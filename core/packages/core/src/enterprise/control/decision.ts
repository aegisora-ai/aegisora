import type {
  Decision,
  ControlDecisionReason,
  PolicyResolution,
} from "./types";

import type {
  RiskAssessment,
} from "../risk";

function policyDecision(
  policy: PolicyResolution,
): Decision | null {

  if (!policy.effect) {
    return null;
  }

  if (
    policy.effect === "block"
  ) {
    return "BLOCK";
  }

  if (
    policy.effect === "escalate"
  ) {
    return "ESCALATE";
  }

  return "ALLOW";
}

export function resolveControlDecision(
  risk: RiskAssessment,
  policy: PolicyResolution,
): {
  decision: Decision;
  reason: ControlDecisionReason;
} {

  // Security precedence:
  // 1. Critical risk / risk BLOCK
  // 2. Explicit policy BLOCK
  // 3. Risk ESCALATE
  // 4. Policy ESCALATE
  // 5. Explicit policy ALLOW
  // 6. Risk ALLOW

  if (
    risk.recommendedDecision ===
    "BLOCK"
  ) {
    return {
      decision: "BLOCK",
      reason: "risk",
    };
  }

  const policyResult =
    policyDecision(policy);

  if (
    policyResult === "BLOCK"
  ) {
    return {
      decision: "BLOCK",
      reason: "policy",
    };
  }

  if (
    risk.recommendedDecision ===
    "ESCALATE"
  ) {
    return {
      decision: "ESCALATE",
      reason: "risk",
    };
  }

  if (
    policyResult === "ESCALATE"
  ) {
    return {
      decision: "ESCALATE",
      reason: "policy",
    };
  }

  if (
    policyResult === "ALLOW"
  ) {
    return {
      decision: "ALLOW",
      reason: "policy",
    };
  }

  return {
    decision: "ALLOW",
    reason: "combined",
  };
}
