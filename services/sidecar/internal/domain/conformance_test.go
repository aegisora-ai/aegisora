package domain

import (
	"encoding/json"
	"os"
	"path/filepath"
	"runtime"
	"testing"
)

type conformanceFixtures struct {
	Version            string     `json:"version"`
	DecisionVocabulary []Decision `json:"decisionVocabulary"`
	DecisionCases      []struct {
		Name            string   `json:"name"`
		Decision        Decision `json:"decision"`
		ExpectedAllowed bool     `json:"expectedAllowed"`
	} `json:"decisionCases"`
	ValidExecutionIntent  ExecutionIntent  `json:"validExecutionIntent"`
	ValidDecisionEnvelope DecisionEnvelope `json:"validDecisionEnvelope"`
	ValidPolicyBundle     PolicyBundle     `json:"validPolicyBundle"`
	ExpiredPolicyBundle   PolicyBundle     `json:"expiredPolicyBundle"`
}

func TestUpstreamSemanticFixtures(t *testing.T) {
	fixtures := loadConformanceFixtures(t)
	if fixtures.Version != ContractVersion {
		t.Fatalf("fixture version = %q, want %q", fixtures.Version, ContractVersion)
	}
	wantVocabulary := []Decision{DecisionAllow, DecisionBlock, DecisionEscalate}
	if len(fixtures.DecisionVocabulary) != len(wantVocabulary) {
		t.Fatalf("decision vocabulary = %#v", fixtures.DecisionVocabulary)
	}
	for index, decision := range wantVocabulary {
		if fixtures.DecisionVocabulary[index] != decision {
			t.Fatalf("decision vocabulary[%d] = %q, want %q", index, fixtures.DecisionVocabulary[index], decision)
		}
	}
	for _, test := range fixtures.DecisionCases {
		if !test.Decision.Valid() || test.Decision.Allowed() != test.ExpectedAllowed {
			t.Fatalf("decision case %q is not implemented canonically", test.Name)
		}
	}
	if err := fixtures.ValidExecutionIntent.Validate(); err != nil {
		t.Fatalf("validExecutionIntent: %v", err)
	}
	if err := fixtures.ValidDecisionEnvelope.Validate(); err != nil {
		t.Fatalf("validDecisionEnvelope: %v", err)
	}
	if fixtures.ValidPolicyBundle.Scope.Tenant == "" || fixtures.ValidPolicyBundle.ExpiresAt.IsZero() {
		t.Fatal("validPolicyBundle did not decode required canonical fields")
	}
	if !fixtures.ExpiredPolicyBundle.ExpiresAt.Before(fixtures.ValidPolicyBundle.ExpiresAt) {
		t.Fatal("expired policy fixture must predate valid fixture")
	}
}

func loadConformanceFixtures(t *testing.T) conformanceFixtures {
	t.Helper()
	_, filename, _, ok := runtime.Caller(0)
	if !ok {
		t.Fatal("resolve conformance test path")
	}
	path := filepath.Clean(filepath.Join(
		filepath.Dir(filename),
		"..", "..", "..", "..",
		"contracts", "conformance", "v1alpha1", "semantic-fixtures.json",
	))
	contents, err := os.ReadFile(path)
	if err != nil {
		t.Fatalf("read %s: %v", path, err)
	}
	var fixtures conformanceFixtures
	if err := json.Unmarshal(contents, &fixtures); err != nil {
		t.Fatalf("decode fixtures: %v", err)
	}
	return fixtures
}
