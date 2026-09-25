package policy

import (
	"bytes"
	"crypto/ed25519"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/aegisora-ai/aegisora/services/sidecar/internal/domain"
)

const (
	digestPrefix    = "sha256:"
	signaturePrefix = "ed25519:"
)

type Rule struct {
	AgentClaim string          `json:"agent_claim,omitempty"`
	Capability string          `json:"capability,omitempty"`
	Provider   string          `json:"provider,omitempty"`
	Model      string          `json:"model,omitempty"`
	Route      string          `json:"route,omitempty"`
	Decision   domain.Decision `json:"decision"`
	ReasonCode string          `json:"reason_code,omitempty"`
	Risk       *domain.Risk    `json:"risk,omitempty"`
}

type Document struct {
	DefaultDecision domain.Decision `json:"default_decision,omitempty"`
	Rules           []Rule          `json:"rules"`
}

type Snapshot struct {
	Bundle   domain.PolicyBundle
	Document Document
}

type Ed25519Verifier struct {
	publicKey ed25519.PublicKey
}

func NewEd25519Verifier(encodedPublicKey string) (*Ed25519Verifier, error) {
	publicKey, err := base64.StdEncoding.DecodeString(strings.TrimSpace(encodedPublicKey))
	if err != nil {
		return nil, fmt.Errorf("decode policy public key: %w", err)
	}
	if len(publicKey) != ed25519.PublicKeySize {
		return nil, fmt.Errorf("policy public key must be %d bytes", ed25519.PublicKeySize)
	}
	return &Ed25519Verifier{publicKey: ed25519.PublicKey(append([]byte(nil), publicKey...))}, nil
}

func (verifier *Ed25519Verifier) Verify(bundle domain.PolicyBundle) error {
	wantDigest, err := Digest(bundle)
	if err != nil {
		return err
	}
	if bundle.Digest != wantDigest {
		return errors.New("policy bundle digest mismatch")
	}

	encodedSignature := strings.TrimPrefix(bundle.Signature, signaturePrefix)
	signature, err := base64.StdEncoding.DecodeString(encodedSignature)
	if err != nil {
		return fmt.Errorf("decode policy signature: %w", err)
	}
	if !ed25519.Verify(verifier.publicKey, []byte(wantDigest), signature) {
		return errors.New("policy bundle signature mismatch")
	}
	return nil
}

func Digest(bundle domain.PolicyBundle) (string, error) {
	var normalizedPolicy any
	decoder := json.NewDecoder(bytes.NewReader(bundle.Policy))
	decoder.UseNumber()
	if err := decoder.Decode(&normalizedPolicy); err != nil {
		return "", fmt.Errorf("decode policy for digest: %w", err)
	}
	if normalizedPolicy == nil {
		return "", errors.New("policy must be a JSON object")
	}

	payload := struct {
		BundleID  string             `json:"bundle_id"`
		Scope     domain.PolicyScope `json:"scope"`
		Version   string             `json:"version"`
		ExpiresAt time.Time          `json:"expires_at"`
		Policy    any                `json:"policy"`
	}{
		BundleID:  bundle.BundleID,
		Scope:     bundle.Scope,
		Version:   bundle.Version,
		ExpiresAt: bundle.ExpiresAt.UTC(),
		Policy:    normalizedPolicy,
	}

	encoded, err := json.Marshal(payload)
	if err != nil {
		return "", fmt.Errorf("encode policy digest payload: %w", err)
	}
	sum := sha256.Sum256(encoded)
	return digestPrefix + hex.EncodeToString(sum[:]), nil
}

func EncodePublicKey(publicKey ed25519.PublicKey) string {
	return base64.StdEncoding.EncodeToString(publicKey)
}

func Sign(bundle domain.PolicyBundle, privateKey ed25519.PrivateKey) (domain.PolicyBundle, error) {
	if len(privateKey) != ed25519.PrivateKeySize {
		return domain.PolicyBundle{}, fmt.Errorf("policy private key must be %d bytes", ed25519.PrivateKeySize)
	}
	digest, err := Digest(bundle)
	if err != nil {
		return domain.PolicyBundle{}, err
	}
	bundle.Digest = digest
	bundle.Signature = signaturePrefix + base64.StdEncoding.EncodeToString(ed25519.Sign(privateKey, []byte(digest)))
	return bundle, nil
}

func LoadFile(path string) (domain.PolicyBundle, error) {
	contents, err := os.ReadFile(path)
	if err != nil {
		return domain.PolicyBundle{}, fmt.Errorf("read policy bundle: %w", err)
	}

	var bundle domain.PolicyBundle
	decoder := json.NewDecoder(bytes.NewReader(contents))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&bundle); err != nil {
		return domain.PolicyBundle{}, fmt.Errorf("decode policy bundle: %w", err)
	}
	var trailing any
	if err := decoder.Decode(&trailing); err == nil {
		return domain.PolicyBundle{}, errors.New("policy bundle file must contain exactly one JSON object")
	} else if !errors.Is(err, io.EOF) {
		return domain.PolicyBundle{}, fmt.Errorf("decode trailing policy bundle data: %w", err)
	}
	return bundle, nil
}

func compile(bundle domain.PolicyBundle) (Document, error) {
	if len(bundle.Policy) == 0 {
		return Document{}, errors.New("policy must be an object")
	}

	var document Document
	decoder := json.NewDecoder(bytes.NewReader(bundle.Policy))
	decoder.DisallowUnknownFields()
	if err := decoder.Decode(&document); err != nil {
		return Document{}, fmt.Errorf("decode policy document: %w", err)
	}
	if document.Rules == nil {
		return Document{}, errors.New("policy.rules must be an array")
	}
	if document.DefaultDecision == "" {
		document.DefaultDecision = domain.DecisionBlock
	}
	if !document.DefaultDecision.Valid() {
		return Document{}, fmt.Errorf("invalid default decision %q", document.DefaultDecision)
	}
	for index, rule := range document.Rules {
		if !rule.Decision.Valid() {
			return Document{}, fmt.Errorf("policy.rules[%d] has invalid decision %q", index, rule.Decision)
		}
		if rule.Risk != nil && (rule.Risk.Score < 0 || rule.Risk.Score > 100) {
			return Document{}, fmt.Errorf("policy.rules[%d].risk.score must be between 0 and 100", index)
		}
	}
	return document, nil
}

type Manager struct {
	mu       sync.RWMutex
	verifier *Ed25519Verifier
	active   *Snapshot
	seen     map[string]string
}

func NewManager(verifier *Ed25519Verifier) *Manager {
	return &Manager{
		verifier: verifier,
		seen:     make(map[string]string),
	}
}

func (manager *Manager) Activate(bundle domain.PolicyBundle, now time.Time) error {
	if manager.verifier == nil {
		return errors.New("policy verifier is not configured")
	}
	if err := validateBundleIdentity(bundle); err != nil {
		return err
	}
	if !bundle.ExpiresAt.After(now) {
		return errors.New("policy bundle is expired")
	}
	if err := manager.verifier.Verify(bundle); err != nil {
		return err
	}
	document, err := compile(bundle)
	if err != nil {
		return err
	}

	manager.mu.Lock()
	defer manager.mu.Unlock()
	if priorDigest, exists := manager.seen[bundle.Version]; exists && priorDigest != bundle.Digest {
		return fmt.Errorf("policy version %q was already observed with a different digest", bundle.Version)
	}
	manager.seen[bundle.Version] = bundle.Digest
	snapshot := cloneSnapshot(Snapshot{Bundle: bundle, Document: document})
	manager.active = &snapshot
	return nil
}

func (manager *Manager) Active(now time.Time) (Snapshot, bool) {
	manager.mu.RLock()
	defer manager.mu.RUnlock()
	if manager.active == nil || !manager.active.Bundle.ExpiresAt.After(now) {
		return Snapshot{}, false
	}
	return cloneSnapshot(*manager.active), true
}

func cloneSnapshot(snapshot Snapshot) Snapshot {
	cloned := snapshot
	cloned.Bundle.Policy = append(json.RawMessage(nil), snapshot.Bundle.Policy...)
	cloned.Document.Rules = make([]Rule, len(snapshot.Document.Rules))
	for index, rule := range snapshot.Document.Rules {
		cloned.Document.Rules[index] = rule
		if rule.Risk != nil {
			risk := *rule.Risk
			risk.Signals = append([]string(nil), rule.Risk.Signals...)
			cloned.Document.Rules[index].Risk = &risk
		}
	}
	return cloned
}

func (manager *Manager) Ready(now time.Time) bool {
	_, ready := manager.Active(now)
	return ready
}

func (manager *Manager) Metadata(now time.Time) (domain.ActivePolicyVersion, bool) {
	snapshot, ok := manager.Active(now)
	if !ok {
		return domain.ActivePolicyVersion{}, false
	}
	return domain.ActivePolicyVersion{
		Version:   snapshot.Bundle.Version,
		Digest:    snapshot.Bundle.Digest,
		ExpiresAt: snapshot.Bundle.ExpiresAt.UTC(),
	}, true
}

func validateBundleIdentity(bundle domain.PolicyBundle) error {
	for field, value := range map[string]string{
		"bundle_id":    bundle.BundleID,
		"scope.tenant": bundle.Scope.Tenant,
		"version":      bundle.Version,
		"digest":       bundle.Digest,
		"signature":    bundle.Signature,
	} {
		if strings.TrimSpace(value) == "" {
			return fmt.Errorf("%s is required", field)
		}
	}
	if bundle.ExpiresAt.IsZero() {
		return errors.New("expires_at is required")
	}
	if !strings.HasPrefix(bundle.Digest, digestPrefix) {
		return fmt.Errorf("digest must use %s", digestPrefix)
	}
	if !strings.HasPrefix(bundle.Signature, signaturePrefix) {
		return fmt.Errorf("signature must use %s", signaturePrefix)
	}
	return nil
}
