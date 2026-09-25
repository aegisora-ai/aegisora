package httpapi

import (
	"crypto/ed25519"
	"encoding/json"
	"fmt"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/aegisora-ai/aegisora/services/sidecar/internal/audit"
	"github.com/aegisora-ai/aegisora/services/sidecar/internal/domain"
	"github.com/aegisora-ai/aegisora/services/sidecar/internal/engine"
	"github.com/aegisora-ai/aegisora/services/sidecar/internal/policy"
)

func TestEndToEndDecisionMatrix(t *testing.T) {
	now := time.Date(2026, 8, 29, 12, 0, 0, 0, time.UTC)
	privateKey := ed25519.NewKeyFromSeed([]byte("0123456789abcdef0123456789abcdef"))
	publicKey := privateKey.Public().(ed25519.PublicKey)
	verifier, err := policy.NewEd25519Verifier(policy.EncodePublicKey(publicKey))
	if err != nil {
		t.Fatal(err)
	}
	manager := policy.NewManager(verifier)
	bundle, err := policy.Sign(domain.PolicyBundle{
		BundleID:  "bundle-integration",
		Scope:     domain.PolicyScope{Tenant: "tenant-1", Agent: "agent:demo"},
		Version:   "policy-integration-1",
		ExpiresAt: now.Add(time.Hour),
		Policy: json.RawMessage(`{
			"default_decision":"BLOCK",
			"rules":[
				{"capability":"provider.generate","provider":"openai","decision":"ALLOW"},
				{"capability":"provider.generate","provider":"anthropic","decision":"ESCALATE"},
				{"capability":"provider.generate","provider":"banned","decision":"ALLOW"},
				{"capability":"provider.generate","provider":"banned","decision":"BLOCK","reason_code":"PROVIDER_BANNED"}
			]
		}`),
	}, privateKey)
	if err != nil {
		t.Fatal(err)
	}
	if err := manager.Activate(bundle, now); err != nil {
		t.Fatal(err)
	}
	sink, _ := audit.NewMemorySink(10)
	nextID := 0
	enforcement, err := engine.New(engine.Options{
		Policies: manager,
		Audit:    sink,
		Clock:    func() time.Time { return now },
		IDs: func() string {
			nextID++
			return fmt.Sprintf("id-%d", nextID)
		},
	})
	if err != nil {
		t.Fatal(err)
	}
	handler := New(Options{
		Evaluator: enforcement,
		Ready:     func() bool { return manager.Ready(now) },
		ActivePolicy: func() (domain.ActivePolicyVersion, bool) {
			return manager.Metadata(now)
		},
	})

	tests := []struct {
		name       string
		agent      string
		provider   string
		decision   domain.Decision
		reasonCode string
	}{
		{name: "allow", agent: "agent:demo", provider: "openai", decision: domain.DecisionAllow, reasonCode: "POLICY_ALLOW"},
		{name: "escalate", agent: "agent:demo", provider: "anthropic", decision: domain.DecisionEscalate, reasonCode: "POLICY_REVIEW_REQUIRED"},
		{name: "deny overrides broad allow", agent: "agent:demo", provider: "banned", decision: domain.DecisionBlock, reasonCode: "PROVIDER_BANNED"},
		{name: "identity mismatch", agent: "agent:attacker", provider: "openai", decision: domain.DecisionBlock, reasonCode: "IDENTITY_SCOPE_MISMATCH"},
	}

	for index, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			body := fmt.Sprintf(`{
				"request_id":"req-%d",
				"agent_claim":%q,
				"capability_request":{"capability":"provider.generate","provider":%q},
				"input":{},
				"context":{}
			}`, index, test.agent, test.provider)
			request := httptest.NewRequest(http.MethodPost, "/v1alpha1/execution/intent", strings.NewReader(body))
			request.Header.Set("Content-Type", "application/json")
			response := httptest.NewRecorder()
			handler.ServeHTTP(response, request)
			if response.Code != http.StatusOK {
				t.Fatalf("status = %d: %s", response.Code, response.Body.String())
			}
			var envelope domain.DecisionEnvelope
			if err := json.NewDecoder(response.Body).Decode(&envelope); err != nil {
				t.Fatal(err)
			}
			if envelope.Decision != test.decision || envelope.ReasonCode != test.reasonCode {
				t.Fatalf("decision = %#v", envelope)
			}
			if envelope.Allowed != (test.decision == domain.DecisionAllow) {
				t.Fatalf("allowed = %t for decision %s", envelope.Allowed, envelope.Decision)
			}
		})
	}

	if len(sink.Events()) != len(tests) {
		t.Fatalf("audit events = %d, want %d", len(sink.Events()), len(tests))
	}
}
