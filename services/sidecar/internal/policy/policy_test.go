package policy

import (
	"crypto/ed25519"
	"encoding/json"
	"testing"
	"time"

	"github.com/aegisora-ai/aegisora/services/sidecar/internal/domain"
)

var testPrivateKey = ed25519.NewKeyFromSeed([]byte("0123456789abcdef0123456789abcdef"))
var testPublicKey = testPrivateKey.Public().(ed25519.PublicKey)

func signedBundle(t *testing.T, policyJSON string) domain.PolicyBundle {
	t.Helper()
	bundle := domain.PolicyBundle{
		BundleID: "bundle-1",
		Scope: domain.PolicyScope{
			Tenant: "tenant-1",
			Agent:  "agent:demo",
		},
		Version:   "policy-1",
		ExpiresAt: time.Now().Add(time.Hour).UTC(),
		Policy:    json.RawMessage(policyJSON),
	}
	bundle, err := Sign(bundle, testPrivateKey)
	if err != nil {
		t.Fatalf("Sign(): %v", err)
	}
	return bundle
}

func TestManagerActivatesValidSignedBundle(t *testing.T) {
	verifier, err := NewEd25519Verifier(EncodePublicKey(testPublicKey))
	if err != nil {
		t.Fatal(err)
	}
	manager := NewManager(verifier)
	bundle := signedBundle(t, `{"rules":[{"capability":"provider.generate","decision":"ALLOW"}]}`)

	if err := manager.Activate(bundle, time.Now()); err != nil {
		t.Fatalf("Activate(): %v", err)
	}
	if !manager.Ready(time.Now()) {
		t.Fatal("manager must be ready")
	}
	metadata, ok := manager.Metadata(time.Now())
	if !ok || metadata.Version != bundle.Version || metadata.Digest != bundle.Digest {
		t.Fatalf("Metadata() = %#v, %t", metadata, ok)
	}
}

func TestManagerRejectsTamperingAndExpiry(t *testing.T) {
	verifier, _ := NewEd25519Verifier(EncodePublicKey(testPublicKey))
	manager := NewManager(verifier)

	tampered := signedBundle(t, `{"rules":[{"decision":"ALLOW"}]}`)
	tampered.Policy = json.RawMessage(`{"rules":[{"decision":"BLOCK"}]}`)
	if err := manager.Activate(tampered, time.Now()); err == nil {
		t.Fatal("tampered bundle must be rejected")
	}

	expired := signedBundle(t, `{"rules":[]}`)
	expired.ExpiresAt = time.Now().Add(-time.Minute)
	expired, _ = Sign(expired, testPrivateKey)
	if err := manager.Activate(expired, time.Now()); err == nil {
		t.Fatal("expired bundle must be rejected")
	}
}

func TestManagerSnapshotCannotBeMutatedByCaller(t *testing.T) {
	verifier, _ := NewEd25519Verifier(EncodePublicKey(testPublicKey))
	manager := NewManager(verifier)
	bundle := signedBundle(t, `{"rules":[{"decision":"ALLOW","risk":{"score":1,"signals":["original"]}}]}`)
	if err := manager.Activate(bundle, time.Now()); err != nil {
		t.Fatal(err)
	}

	bundle.Policy[0] = '['
	first, ok := manager.Active(time.Now())
	if !ok {
		t.Fatal("active snapshot missing")
	}
	first.Document.Rules[0].Decision = domain.DecisionBlock
	first.Document.Rules[0].Risk.Signals[0] = "mutated"
	first.Bundle.Policy[0] = '['

	second, ok := manager.Active(time.Now())
	if !ok {
		t.Fatal("active snapshot missing after mutation attempt")
	}
	if second.Document.Rules[0].Decision != domain.DecisionAllow ||
		second.Document.Rules[0].Risk.Signals[0] != "original" ||
		second.Bundle.Policy[0] != '{' {
		t.Fatalf("active snapshot was mutated: %#v", second)
	}
}

func TestEvaluateUsesDenyOverrides(t *testing.T) {
	bundle := signedBundle(t, `{
		"default_decision":"BLOCK",
		"rules":[
			{"capability":"provider.generate","decision":"ALLOW"},
			{"capability":"provider.generate","provider":"blocked-provider","decision":"BLOCK","reason_code":"PROVIDER_DENIED"}
		]
	}`)
	document, err := compile(bundle)
	if err != nil {
		t.Fatal(err)
	}
	snapshot := Snapshot{Bundle: bundle, Document: document}
	intent := domain.ExecutionIntent{
		RequestID:  "req-1",
		AgentClaim: "agent:demo",
		CapabilityRequest: domain.CapabilityRequest{
			Capability: "provider.generate",
			Provider:   "blocked-provider",
		},
		Input:   map[string]json.RawMessage{},
		Context: map[string]json.RawMessage{},
	}

	result := Evaluate(snapshot, intent)
	if result.Decision != domain.DecisionBlock || result.ReasonCode != "PROVIDER_DENIED" {
		t.Fatalf("Evaluate() = %#v", result)
	}
}

func TestEvaluateBlocksScopeMismatch(t *testing.T) {
	bundle := signedBundle(t, `{"rules":[{"decision":"ALLOW"}]}`)
	document, _ := compile(bundle)
	intent := domain.ExecutionIntent{
		AgentClaim:        "agent:attacker",
		CapabilityRequest: domain.CapabilityRequest{Capability: "provider.generate"},
	}
	result := Evaluate(Snapshot{Bundle: bundle, Document: document}, intent)
	if result.Decision != domain.DecisionBlock || result.ReasonCode != "IDENTITY_SCOPE_MISMATCH" {
		t.Fatalf("Evaluate() = %#v", result)
	}
}
