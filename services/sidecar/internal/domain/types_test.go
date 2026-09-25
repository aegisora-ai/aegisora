package domain

import (
	"encoding/json"
	"testing"
	"time"
)

func TestDecisionVocabularyAndAllowedDerivation(t *testing.T) {
	tests := []struct {
		decision Decision
		allowed  bool
	}{
		{DecisionAllow, true},
		{DecisionBlock, false},
		{DecisionEscalate, false},
	}

	for _, test := range tests {
		t.Run(string(test.decision), func(t *testing.T) {
			if !test.decision.Valid() {
				t.Fatalf("%s must be valid", test.decision)
			}
			if got := test.decision.Allowed(); got != test.allowed {
				t.Fatalf("Allowed() = %t, want %t", got, test.allowed)
			}
		})
	}

	if Decision("UNKNOWN").Valid() {
		t.Fatal("UNKNOWN must not be valid")
	}
}

func TestExecutionIntentValidation(t *testing.T) {
	valid := ExecutionIntent{
		RequestID:         "req-1",
		AgentClaim:        "agent:demo",
		CapabilityRequest: CapabilityRequest{Capability: "provider.generate"},
		Input:             map[string]json.RawMessage{},
		Context:           map[string]json.RawMessage{},
	}
	if err := valid.Validate(); err != nil {
		t.Fatalf("valid intent: %v", err)
	}

	invalid := valid
	invalid.RequestID = ""
	invalid.Input = nil
	if err := invalid.Validate(); err == nil {
		t.Fatal("invalid intent must fail validation")
	}
}

func TestDecisionEnvelopeRejectsAllowedMismatch(t *testing.T) {
	envelope := NewDecisionEnvelope(
		"dec-1",
		"req-1",
		"corr-1",
		DecisionBlock,
		"POLICY_BLOCK",
		Risk{Score: 100},
		"policy-1",
		"sha256:test",
		time.Now(),
	)
	if err := envelope.Validate(); err != nil {
		t.Fatalf("valid envelope: %v", err)
	}

	envelope.Allowed = true
	if err := envelope.Validate(); err == nil {
		t.Fatal("allowed/decision mismatch must fail validation")
	}
}
