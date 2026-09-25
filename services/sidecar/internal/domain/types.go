package domain

import (
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"
)

const ContractVersion = "v1alpha1"

type Decision string

const (
	DecisionAllow    Decision = "ALLOW"
	DecisionBlock    Decision = "BLOCK"
	DecisionEscalate Decision = "ESCALATE"
)

func (decision Decision) Valid() bool {
	switch decision {
	case DecisionAllow, DecisionBlock, DecisionEscalate:
		return true
	default:
		return false
	}
}

func (decision Decision) Allowed() bool {
	return decision == DecisionAllow
}

type CapabilityRequest struct {
	Capability string `json:"capability"`
	Provider   string `json:"provider,omitempty"`
	Model      string `json:"model,omitempty"`
	Route      string `json:"route,omitempty"`
}

type ExecutionIntent struct {
	RequestID         string                     `json:"request_id"`
	CorrelationID     string                     `json:"correlation_id,omitempty"`
	AgentClaim        string                     `json:"agent_claim"`
	CapabilityRequest CapabilityRequest          `json:"capability_request"`
	Input             map[string]json.RawMessage `json:"input"`
	Context           map[string]json.RawMessage `json:"context"`
}

func (intent ExecutionIntent) Validate() error {
	var validationErrors []error

	validateRequiredString := func(field string, value string, maximum int) {
		value = strings.TrimSpace(value)
		if value == "" {
			validationErrors = append(validationErrors, fmt.Errorf("%s is required", field))
			return
		}
		if len(value) > maximum {
			validationErrors = append(validationErrors, fmt.Errorf("%s exceeds %d bytes", field, maximum))
		}
	}

	validateOptionalString := func(field string, value string, maximum int) {
		if len(value) > maximum {
			validationErrors = append(validationErrors, fmt.Errorf("%s exceeds %d bytes", field, maximum))
		}
	}

	validateRequiredString("request_id", intent.RequestID, 256)
	validateOptionalString("correlation_id", intent.CorrelationID, 256)
	validateRequiredString("agent_claim", intent.AgentClaim, 256)
	validateRequiredString("capability_request.capability", intent.CapabilityRequest.Capability, 256)
	validateOptionalString("capability_request.provider", intent.CapabilityRequest.Provider, 128)
	validateOptionalString("capability_request.model", intent.CapabilityRequest.Model, 256)
	validateOptionalString("capability_request.route", intent.CapabilityRequest.Route, 1024)

	if intent.Input == nil {
		validationErrors = append(validationErrors, errors.New("input must be an object"))
	}
	if intent.Context == nil {
		validationErrors = append(validationErrors, errors.New("context must be an object"))
	}

	return errors.Join(validationErrors...)
}

type Risk struct {
	Score   int      `json:"score"`
	Level   string   `json:"level,omitempty"`
	Signals []string `json:"signals,omitempty"`
}

type DecisionEnvelope struct {
	DecisionID    string    `json:"decision_id"`
	RequestID     string    `json:"request_id"`
	CorrelationID string    `json:"correlation_id"`
	Decision      Decision  `json:"decision"`
	Allowed       bool      `json:"allowed"`
	ReasonCode    string    `json:"reason_code"`
	Risk          Risk      `json:"risk"`
	PolicyVersion string    `json:"policy_version"`
	PolicyDigest  string    `json:"policy_digest"`
	EvaluatedAt   time.Time `json:"evaluated_at"`
}

func NewDecisionEnvelope(
	decisionID string,
	requestID string,
	correlationID string,
	decision Decision,
	reasonCode string,
	risk Risk,
	policyVersion string,
	policyDigest string,
	evaluatedAt time.Time,
) DecisionEnvelope {
	return DecisionEnvelope{
		DecisionID:    decisionID,
		RequestID:     requestID,
		CorrelationID: correlationID,
		Decision:      decision,
		Allowed:       decision.Allowed(),
		ReasonCode:    reasonCode,
		Risk:          risk,
		PolicyVersion: policyVersion,
		PolicyDigest:  policyDigest,
		EvaluatedAt:   evaluatedAt.UTC(),
	}
}

func (envelope DecisionEnvelope) Validate() error {
	if !envelope.Decision.Valid() {
		return fmt.Errorf("invalid decision %q", envelope.Decision)
	}
	if envelope.Allowed != envelope.Decision.Allowed() {
		return errors.New("allowed must be derived from decision")
	}
	for field, value := range map[string]string{
		"decision_id":    envelope.DecisionID,
		"request_id":     envelope.RequestID,
		"correlation_id": envelope.CorrelationID,
		"reason_code":    envelope.ReasonCode,
		"policy_version": envelope.PolicyVersion,
		"policy_digest":  envelope.PolicyDigest,
	} {
		if strings.TrimSpace(value) == "" {
			return fmt.Errorf("%s is required", field)
		}
	}
	if envelope.EvaluatedAt.IsZero() {
		return errors.New("evaluated_at is required")
	}
	if envelope.Risk.Score < 0 || envelope.Risk.Score > 100 {
		return errors.New("risk.score must be between 0 and 100")
	}
	return nil
}

type PolicyScope struct {
	Tenant     string `json:"tenant"`
	Agent      string `json:"agent,omitempty"`
	Capability string `json:"capability,omitempty"`
}

type PolicyBundle struct {
	BundleID  string          `json:"bundle_id"`
	Scope     PolicyScope     `json:"scope"`
	Version   string          `json:"version"`
	Digest    string          `json:"digest"`
	ExpiresAt time.Time       `json:"expires_at"`
	Signature string          `json:"signature"`
	Policy    json.RawMessage `json:"policy"`
}

type ActivePolicyVersion struct {
	Version   string    `json:"version"`
	Digest    string    `json:"digest"`
	ExpiresAt time.Time `json:"expires_at"`
}

type AuditEvent struct {
	EventID       string                     `json:"event_id"`
	RequestID     string                     `json:"request_id"`
	CorrelationID string                     `json:"correlation_id"`
	DecisionID    string                     `json:"decision_id"`
	PolicyVersion string                     `json:"policy_version"`
	EventType     string                     `json:"event_type"`
	OccurredAt    time.Time                  `json:"occurred_at"`
	Payload       map[string]json.RawMessage `json:"payload,omitempty"`
}
