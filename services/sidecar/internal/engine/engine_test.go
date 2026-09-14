package engine

import (
	"context"
	"encoding/json"
	"sync"
	"testing"
	"time"

	"github.com/aegisora-ai/aegisora/services/sidecar/internal/audit"
	"github.com/aegisora-ai/aegisora/services/sidecar/internal/domain"
	"github.com/aegisora-ai/aegisora/services/sidecar/internal/policy"
)

type staticPolicies struct {
	snapshot policy.Snapshot
	ready    bool
}

func (policies staticPolicies) Active(time.Time) (policy.Snapshot, bool) {
	return policies.snapshot, policies.ready
}

type mutablePolicies struct {
	snapshot policy.Snapshot
	ready    bool
}

func (policies *mutablePolicies) Active(time.Time) (policy.Snapshot, bool) {
	return policies.snapshot, policies.ready
}

func testEngine(t *testing.T, snapshot policy.Snapshot, ready bool) (*Engine, *audit.MemorySink) {
	t.Helper()
	sink, _ := audit.NewMemorySink(100)
	nextID := 0
	instance, err := New(Options{
		Policies: staticPolicies{snapshot: snapshot, ready: ready},
		Audit:    sink,
		Clock:    func() time.Time { return time.Date(2026, 8, 29, 12, 0, 0, 0, time.UTC) },
		IDs: func() string {
			nextID++
			return "id-" + string(rune('0'+nextID))
		},
		CacheEntries: 10,
	})
	if err != nil {
		t.Fatal(err)
	}
	return instance, sink
}

func validIntent() domain.ExecutionIntent {
	return domain.ExecutionIntent{
		RequestID:     "req-1",
		CorrelationID: "corr-1",
		AgentClaim:    "agent:demo",
		CapabilityRequest: domain.CapabilityRequest{
			Capability: "provider.generate",
		},
		Input:   map[string]json.RawMessage{},
		Context: map[string]json.RawMessage{},
	}
}

func TestEvaluateFailsClosedWithoutPolicy(t *testing.T) {
	instance, sink := testEngine(t, policy.Snapshot{}, false)
	envelope, err := instance.Evaluate(context.Background(), validIntent())
	if err != nil {
		t.Fatal(err)
	}
	if envelope.Decision != domain.DecisionBlock || envelope.ReasonCode != "POLICY_UNAVAILABLE" {
		t.Fatalf("Evaluate() = %#v", envelope)
	}
	if envelope.Allowed {
		t.Fatal("BLOCK must derive allowed=false")
	}
	if len(sink.Events()) != 1 || sink.Events()[0].DecisionID != envelope.DecisionID {
		t.Fatalf("audit events = %#v", sink.Events())
	}
}

func TestEvaluateIsIdempotentAndRejectsConflict(t *testing.T) {
	snapshot := policy.Snapshot{
		Bundle: domain.PolicyBundle{Version: "policy-1", Digest: "sha256:test"},
		Document: policy.Document{
			DefaultDecision: domain.DecisionAllow,
			Rules:           []policy.Rule{},
		},
	}
	instance, sink := testEngine(t, snapshot, true)
	first, err := instance.Evaluate(context.Background(), validIntent())
	if err != nil {
		t.Fatal(err)
	}
	second, err := instance.Evaluate(context.Background(), validIntent())
	if err != nil {
		t.Fatal(err)
	}
	if first.DecisionID != second.DecisionID {
		t.Fatalf("idempotent decisions differ: %q != %q", first.DecisionID, second.DecisionID)
	}
	if len(sink.Events()) != 1 {
		t.Fatalf("idempotent replay emitted %d audit events, want 1", len(sink.Events()))
	}

	conflict := validIntent()
	conflict.CapabilityRequest.Provider = "attacker"
	result, err := instance.Evaluate(context.Background(), conflict)
	if err != nil {
		t.Fatal(err)
	}
	if result.Decision != domain.DecisionBlock || result.ReasonCode != "REQUEST_ID_CONFLICT" {
		t.Fatalf("conflict result = %#v", result)
	}
}

func TestEvaluateReevaluatesCachedRequestWhenPolicyChanges(t *testing.T) {
	sink, _ := audit.NewMemorySink(100)
	policies := &mutablePolicies{
		ready: true,
		snapshot: policy.Snapshot{
			Bundle: domain.PolicyBundle{Version: "policy-1", Digest: "sha256:one"},
			Document: policy.Document{
				DefaultDecision: domain.DecisionAllow,
			},
		},
	}
	nextID := 0
	instance, err := New(Options{
		Policies: policies,
		Audit:    sink,
		Clock:    func() time.Time { return time.Date(2026, 8, 29, 12, 0, 0, 0, time.UTC) },
		IDs: func() string {
			nextID++
			return "id-" + string(rune('0'+nextID))
		},
		CacheEntries: 10,
	})
	if err != nil {
		t.Fatal(err)
	}

	allowed, err := instance.Evaluate(context.Background(), validIntent())
	if err != nil {
		t.Fatal(err)
	}
	if allowed.Decision != domain.DecisionAllow {
		t.Fatalf("first decision = %q, want ALLOW", allowed.Decision)
	}

	policies.ready = false
	blocked, err := instance.Evaluate(context.Background(), validIntent())
	if err != nil {
		t.Fatal(err)
	}
	if blocked.Decision != domain.DecisionBlock || blocked.ReasonCode != "POLICY_UNAVAILABLE" {
		t.Fatalf("decision after policy removal = %#v", blocked)
	}
	if blocked.DecisionID == allowed.DecisionID {
		t.Fatal("policy removal reused the cached ALLOW decision")
	}

	replayed, err := instance.Evaluate(context.Background(), validIntent())
	if err != nil {
		t.Fatal(err)
	}
	if replayed.DecisionID != blocked.DecisionID {
		t.Fatalf("stable policy state did not replay decision: %q != %q", replayed.DecisionID, blocked.DecisionID)
	}
	if len(sink.Events()) != 2 {
		t.Fatalf("audit events = %d, want 2", len(sink.Events()))
	}
}

func TestEvaluateCacheIsolatesRiskSignals(t *testing.T) {
	snapshot := policy.Snapshot{
		Bundle: domain.PolicyBundle{Version: "policy-1", Digest: "sha256:test"},
		Document: policy.Document{
			DefaultDecision: domain.DecisionBlock,
			Rules: []policy.Rule{{
				Capability: "provider.generate",
				Decision:   domain.DecisionEscalate,
				ReasonCode: "REVIEW_REQUIRED",
				Risk:       &domain.Risk{Score: 70, Level: "HIGH", Signals: []string{"original"}},
			}},
		},
	}
	instance, _ := testEngine(t, snapshot, true)

	first, err := instance.Evaluate(context.Background(), validIntent())
	if err != nil {
		t.Fatal(err)
	}
	first.Risk.Signals[0] = "mutated"

	second, err := instance.Evaluate(context.Background(), validIntent())
	if err != nil {
		t.Fatal(err)
	}
	if got := second.Risk.Signals[0]; got != "original" {
		t.Fatalf("cached risk signal = %q, want isolated original", got)
	}
}

func TestEvaluateSerializesConcurrentIdempotentRequests(t *testing.T) {
	snapshot := policy.Snapshot{
		Bundle: domain.PolicyBundle{Version: "policy-1", Digest: "sha256:test"},
		Document: policy.Document{
			DefaultDecision: domain.DecisionAllow,
			Rules:           []policy.Rule{},
		},
	}
	instance, sink := testEngine(t, snapshot, true)

	const callers = 20
	results := make(chan domain.DecisionEnvelope, callers)
	errors := make(chan error, callers)
	start := make(chan struct{})
	var wait sync.WaitGroup
	wait.Add(callers)
	for range callers {
		go func() {
			defer wait.Done()
			<-start
			result, err := instance.Evaluate(context.Background(), validIntent())
			results <- result
			errors <- err
		}()
	}
	close(start)
	wait.Wait()
	close(results)
	close(errors)

	for err := range errors {
		if err != nil {
			t.Fatal(err)
		}
	}
	decisionID := ""
	for result := range results {
		if decisionID == "" {
			decisionID = result.DecisionID
		}
		if result.DecisionID != decisionID {
			t.Fatalf("concurrent replay returned decision %q, want %q", result.DecisionID, decisionID)
		}
	}
	if len(sink.Events()) != 1 {
		t.Fatalf("audit events = %d, want 1", len(sink.Events()))
	}
}
