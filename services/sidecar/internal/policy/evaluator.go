package policy

import (
	"strings"

	"github.com/aegisora-ai/aegisora/services/sidecar/internal/domain"
)

type Evaluation struct {
	Decision   domain.Decision
	ReasonCode string
	Risk       domain.Risk
}

func Evaluate(snapshot Snapshot, intent domain.ExecutionIntent) Evaluation {
	if snapshot.Bundle.Scope.Agent != "" && snapshot.Bundle.Scope.Agent != intent.AgentClaim {
		return blocked("IDENTITY_SCOPE_MISMATCH")
	}
	if snapshot.Bundle.Scope.Capability != "" && snapshot.Bundle.Scope.Capability != intent.CapabilityRequest.Capability {
		return blocked("CAPABILITY_SCOPE_MISMATCH")
	}

	var selected *Rule
	for index := range snapshot.Document.Rules {
		rule := &snapshot.Document.Rules[index]
		if !matches(*rule, intent) {
			continue
		}
		if selected == nil || precedence(rule.Decision) > precedence(selected.Decision) {
			selected = rule
		}
	}

	if selected == nil {
		return Evaluation{
			Decision:   snapshot.Document.DefaultDecision,
			ReasonCode: defaultReason(snapshot.Document.DefaultDecision),
			Risk:       defaultRisk(snapshot.Document.DefaultDecision),
		}
	}

	reason := strings.TrimSpace(selected.ReasonCode)
	if reason == "" {
		reason = defaultReason(selected.Decision)
	}
	risk := defaultRisk(selected.Decision)
	if selected.Risk != nil {
		risk = *selected.Risk
	}
	return Evaluation{Decision: selected.Decision, ReasonCode: reason, Risk: risk}
}

func matches(rule Rule, intent domain.ExecutionIntent) bool {
	request := intent.CapabilityRequest
	return match(rule.AgentClaim, intent.AgentClaim) &&
		match(rule.Capability, request.Capability) &&
		match(rule.Provider, request.Provider) &&
		match(rule.Model, request.Model) &&
		match(rule.Route, request.Route)
}

func match(expected string, actual string) bool {
	return expected == "" || expected == actual
}

func precedence(decision domain.Decision) int {
	switch decision {
	case domain.DecisionBlock:
		return 3
	case domain.DecisionEscalate:
		return 2
	case domain.DecisionAllow:
		return 1
	default:
		return 0
	}
}

func defaultReason(decision domain.Decision) string {
	switch decision {
	case domain.DecisionAllow:
		return "POLICY_ALLOW"
	case domain.DecisionEscalate:
		return "POLICY_REVIEW_REQUIRED"
	default:
		return "POLICY_BLOCK"
	}
}

func defaultRisk(decision domain.Decision) domain.Risk {
	switch decision {
	case domain.DecisionAllow:
		return domain.Risk{Score: 0, Level: "LOW"}
	case domain.DecisionEscalate:
		return domain.Risk{Score: 50, Level: "MEDIUM"}
	default:
		return domain.Risk{Score: 100, Level: "HIGH"}
	}
}

func blocked(reason string) Evaluation {
	return Evaluation{
		Decision:   domain.DecisionBlock,
		ReasonCode: reason,
		Risk:       domain.Risk{Score: 100, Level: "HIGH"},
	}
}
