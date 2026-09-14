package httpapi

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/aegisora-ai/aegisora/services/sidecar/internal/domain"
)

type evaluatorStub struct {
	decision domain.DecisionEnvelope
	calls    int
}

func (stub *evaluatorStub) Evaluate(_ context.Context, _ domain.ExecutionIntent) (domain.DecisionEnvelope, error) {
	stub.calls++
	return stub.decision, nil
}

func TestHealthEndpoints(t *testing.T) {
	handler := New(Options{ServiceName: "test-sidecar", Version: "test-version", Commit: "test-commit"})

	legacy := httptest.NewRecorder()
	handler.ServeHTTP(legacy, httptest.NewRequest(http.MethodGet, "/healthz", nil))
	if legacy.Code != http.StatusOK || !strings.Contains(legacy.Body.String(), "test-sidecar") {
		t.Fatalf("legacy health = %d %s", legacy.Code, legacy.Body.String())
	}

	contract := httptest.NewRecorder()
	handler.ServeHTTP(contract, httptest.NewRequest(http.MethodGet, "/v1alpha1/health", nil))
	var body map[string]string
	if err := json.NewDecoder(contract.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body["status"] != "healthy" || body["contract_version"] != domain.ContractVersion {
		t.Fatalf("contract health = %#v", body)
	}
}

func TestReadinessAndActivePolicy(t *testing.T) {
	expires := time.Now().Add(time.Hour).UTC()
	handler := New(Options{
		Ready: func() bool { return true },
		ActivePolicy: func() (domain.ActivePolicyVersion, bool) {
			return domain.ActivePolicyVersion{Version: "policy-1", Digest: "sha256:test", ExpiresAt: expires}, true
		},
	})

	ready := httptest.NewRecorder()
	handler.ServeHTTP(ready, httptest.NewRequest(http.MethodGet, "/v1alpha1/readiness", nil))
	if ready.Code != http.StatusOK {
		t.Fatalf("readiness status = %d", ready.Code)
	}

	active := httptest.NewRecorder()
	handler.ServeHTTP(active, httptest.NewRequest(http.MethodGet, "/v1alpha1/policies/active", nil))
	if active.Code != http.StatusOK || !strings.Contains(active.Body.String(), "policy-1") {
		t.Fatalf("active policy = %d %s", active.Code, active.Body.String())
	}
}

func TestSubmitExecutionIntent(t *testing.T) {
	stub := &evaluatorStub{decision: domain.NewDecisionEnvelope(
		"dec-1", "req-1", "corr-1", domain.DecisionAllow, "POLICY_ALLOW",
		domain.Risk{Score: 0}, "policy-1", "sha256:test", time.Now(),
	)}
	handler := New(Options{Evaluator: stub})
	request := httptest.NewRequest(http.MethodPost, "/v1alpha1/execution/intent", strings.NewReader(`{
		"request_id":"req-1",
		"agent_claim":"agent:demo",
		"capability_request":{"capability":"provider.generate"},
		"input":{},
		"context":{}
	}`))
	request.Header.Set("Content-Type", "application/json")
	response := httptest.NewRecorder()
	handler.ServeHTTP(response, request)

	if response.Code != http.StatusOK || stub.calls != 1 {
		t.Fatalf("response = %d %s, calls = %d", response.Code, response.Body.String(), stub.calls)
	}
	var body domain.DecisionEnvelope
	if err := json.NewDecoder(response.Body).Decode(&body); err != nil {
		t.Fatal(err)
	}
	if body.Decision != domain.DecisionAllow || !body.Allowed {
		t.Fatalf("decision = %#v", body)
	}
}

func TestSubmitRejectsUnknownFieldAndOversizedBody(t *testing.T) {
	stub := &evaluatorStub{}
	handler := New(Options{Evaluator: stub, MaximumBodyBytes: 64})

	unknown := httptest.NewRequest(http.MethodPost, "/v1alpha1/execution/intent", strings.NewReader(`{"unknown":true}`))
	unknown.Header.Set("Content-Type", "application/json")
	unknownResponse := httptest.NewRecorder()
	handler.ServeHTTP(unknownResponse, unknown)
	if unknownResponse.Code != http.StatusBadRequest || stub.calls != 0 {
		t.Fatalf("unknown response = %d %s", unknownResponse.Code, unknownResponse.Body.String())
	}

	large := httptest.NewRequest(http.MethodPost, "/v1alpha1/execution/intent", strings.NewReader(`{"request_id":"`+strings.Repeat("x", 200)+`"}`))
	large.Header.Set("Content-Type", "application/json")
	largeResponse := httptest.NewRecorder()
	handler.ServeHTTP(largeResponse, large)
	if largeResponse.Code != http.StatusRequestEntityTooLarge {
		t.Fatalf("large response = %d %s", largeResponse.Code, largeResponse.Body.String())
	}
}
