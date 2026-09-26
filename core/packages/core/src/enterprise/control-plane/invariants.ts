import type {
  CanonicalExecutionGraph,
} from "./types";

export function assertCanonicalExecutionGraph(
  graph: CanonicalExecutionGraph,
): void {

  const {
    intent,
    identity,
    authority,
    policy,
    decision,
    approval,
    continuity,
    execution,
    effect,
    evidence,
    incident,
  } = graph;

  if (
    identity.workspaceId !==
    intent.workspaceId
  ) {
    throw new Error(
      "CANONICAL_WORKSPACE_MISMATCH: identity",
    );
  }

  if (
    identity.agentId !==
    intent.agentId
  ) {
    throw new Error(
      "CANONICAL_AGENT_MISMATCH: identity",
    );
  }
  if (
    authority.workspaceId !==
    intent.workspaceId
  ) {
    throw new Error(
      "CANONICAL_WORKSPACE_MISMATCH: authority",
    );
  }

  if (
    authority.agentId !==
    intent.agentId
  ) {
    throw new Error(
      "CANONICAL_AGENT_MISMATCH: authority",
    );
  }

  if (
    policy.workspaceId !==
    intent.workspaceId
  ) {
    throw new Error(
      "CANONICAL_WORKSPACE_MISMATCH: policy",
    );
  }

  if (
    decision.workspaceId !==
    intent.workspaceId
  ) {
    throw new Error(
      "CANONICAL_WORKSPACE_MISMATCH: decision",
    );
  }

  if (
    decision.agentId !==
    intent.agentId
  ) {
    throw new Error(
      "CANONICAL_AGENT_MISMATCH: decision",
    );
  }

  if (
    decision.requestId !==
    intent.requestId
  ) {
    throw new Error(
      "CANONICAL_REQUEST_MISMATCH: decision",
    );
  }

  if (
    decision.correlationId !==
    intent.correlationId
  ) {
    throw new Error(
      "CANONICAL_CORRELATION_MISMATCH: decision",
    );
  }

  if (
    decision.policy.versionId !==
    policy.versionId
  ) {
    throw new Error(
      "CANONICAL_POLICY_VERSION_MISMATCH",
    );
  }

  if (
    decision.authority.fingerprint !==
    authority.fingerprint
  ) {
    throw new Error(
      "CANONICAL_AUTHORITY_FINGERPRINT_MISMATCH",
    );
  }

  if (
    decision.decision ===
    "ESCALATE" &&
    !approval
  ) {
    throw new Error(
      "CANONICAL_ESCALATION_APPROVAL_REQUIRED",
    );
  }
  if (approval) {

    if (
      approval.requestId !==
      intent.requestId
    ) {
      throw new Error(
        "CANONICAL_REQUEST_MISMATCH: approval",
      );
    }

    if (
      approval.decisionId !==
      decision.decisionId
    ) {
      throw new Error(
        "CANONICAL_DECISION_MISMATCH: approval",
      );
    }

    if (
      approval.workspaceId !==
      intent.workspaceId
    ) {
      throw new Error(
        "CANONICAL_WORKSPACE_MISMATCH: approval",
      );
    }

    if (
      approval.agentId !==
      intent.agentId
    ) {
      throw new Error(
        "CANONICAL_AGENT_MISMATCH: approval",
      );
    }

    if (
      approval.policyVersionId !==
      policy.versionId
    ) {
      throw new Error(
        "CANONICAL_POLICY_VERSION_MISMATCH: approval",
      );
    }

    if (
      approval.authorityFingerprint !==
      authority.fingerprint
    ) {
      throw new Error(
        "CANONICAL_AUTHORITY_FINGERPRINT_MISMATCH: approval",
      );
    }

    if (
      decision.decision ===
      "ESCALATE" &&
      (
        approval.state === "not_required" ||
        approval.state === "rejected" ||
        approval.state === "expired"
      )
    ) {
      throw new Error(
        "CANONICAL_ESCALATION_APPROVAL_INVALID",
      );
    }
  }

  if (continuity && execution) {

    if (
      continuity.executionId !==
      execution.executionId
    ) {
      throw new Error(
        "CANONICAL_EXECUTION_MISMATCH: continuity",
      );
    }

    if (
      continuity.sealId !==
      execution.continuitySealId
    ) {
      throw new Error(
        "CANONICAL_SEAL_MISMATCH: execution",
      );
    }
  }

  if (execution) {

    if (
      execution.requestId !==
      intent.requestId
    ) {
      throw new Error(
        "CANONICAL_REQUEST_MISMATCH: execution",
      );
    }

    if (
      execution.decisionId !==
      decision.decisionId
    ) {
      throw new Error(
        "CANONICAL_DECISION_MISMATCH: execution",
      );
    }

    if (
      execution.workspaceId !==
      intent.workspaceId
    ) {
      throw new Error(
        "CANONICAL_WORKSPACE_MISMATCH: execution",
      );
    }

    if (
      execution.agentId !==
      intent.agentId
    ) {
      throw new Error(
        "CANONICAL_AGENT_MISMATCH: execution",
      );
    }

    if (
      (
        decision.decision === "BLOCK" ||
        decision.decision === "ESCALATE"
      ) &&
      (
        execution.status === "running" ||
        execution.status === "completed" ||
        execution.status === "failed" ||
        execution.status === "cancelled"
      )
    ) {
      throw new Error(
        "CANONICAL_NO_SIDE_EFFECT_VIOLATION",
      );
    }

    if (
      execution.status !== "blocked" &&
      execution.status !== "escalated" &&
      !continuity
    ) {
      throw new Error(
        "CANONICAL_CONTINUITY_BINDING_REQUIRED",
      );
    }
  }

  if (effect && execution) {

    if (
      effect.executionId !==
      execution.executionId
    ) {
      throw new Error(
        "CANONICAL_EXECUTION_MISMATCH: effect",
      );
    }

    if (
      decision.decision !== "ALLOW" &&
      effect.outcome !== "NOT_ATTEMPTED"
    ) {
      throw new Error(
        "CANONICAL_EFFECT_VIOLATION",
      );
    }
  }

  if (evidence) {

    if (
      evidence.requestId !==
      intent.requestId
    ) {
      throw new Error(
        "CANONICAL_REQUEST_MISMATCH: evidence",
      );
    }

    if (
      evidence.decisionId !==
      decision.decisionId
    ) {
      throw new Error(
        "CANONICAL_DECISION_MISMATCH: evidence",
      );
    }

    if (execution) {

      if (
        evidence.executionId !==
        execution.executionId
      ) {
        throw new Error(
          "CANONICAL_EXECUTION_MISMATCH: evidence",
        );
      }
    }

    if (
      evidence.policyVersionId !==
      policy.versionId
    ) {
      throw new Error(
        "CANONICAL_POLICY_VERSION_MISMATCH: evidence",
      );
    }

    if (
      evidence.authorityFingerprint !==
      authority.fingerprint
    ) {
      throw new Error(
        "CANONICAL_AUTHORITY_FINGERPRINT_MISMATCH: evidence",
      );
    }

    if (
      continuity &&
      evidence.continuitySealId !==
      continuity.sealId
    ) {
      throw new Error(
        "CANONICAL_SEAL_MISMATCH: evidence",
      );
    }
  }

  if (incident) {

    if (
      incident.workspaceId !==
      intent.workspaceId
    ) {
      throw new Error(
        "CANONICAL_WORKSPACE_MISMATCH: incident",
      );
    }

    if (
      incident.agentId !==
      intent.agentId
    ) {
      throw new Error(
        "CANONICAL_AGENT_MISMATCH: incident",
      );
    }

    if (
      incident.executionId &&
      execution &&
      incident.executionId !==
      execution.executionId
    ) {
      throw new Error(
        "CANONICAL_EXECUTION_MISMATCH: incident",
      );
    }

    if (
      incident.decisionId &&
      incident.decisionId !==
      decision.decisionId
    ) {
      throw new Error(
        "CANONICAL_DECISION_MISMATCH: incident",
      );
    }
  }
}
