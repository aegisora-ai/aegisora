export type ToolSecurityDecision =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE";

export type ToolSecurityContext = Readonly<{
  workspaceId: string;
  agentId: string;
  toolId: string;
  action: string;

  traceId: string;
  decisionId: string;
  executionId: string;
  evidenceId: string;

  riskScore: number;

  metadata?: Readonly<Record<string, unknown>>;
}>;

export type ToolSecurityResult = Readonly<{
  decision: ToolSecurityDecision;
  allowed: boolean;
  reason: string;
  toolId: string;
  workspaceId: string;
  agentId: string;
  riskScore: number;
}>;

export type ToolSecurityPolicy = Readonly<{
  workspaceId: string;

  allowedToolIds: readonly string[];

  blockedToolIds?: readonly string[];

  escalationToolIds?: readonly string[];

  maxRiskScore: number;
}>;

export function assertToolSecurityContext(
  context: ToolSecurityContext,
): void {
  if (!context.workspaceId.trim()) {
    throw new Error(
      "Tool security requires workspaceId.",
    );
  }

  if (!context.agentId.trim()) {
    throw new Error(
      "Tool security requires agentId.",
    );
  }

  if (!context.toolId.trim()) {
    throw new Error(
      "Tool security requires toolId.",
    );
  }

  if (!context.action.trim()) {
    throw new Error(
      "Tool security requires action.",
    );
  }

  if (!context.traceId.trim()) {
    throw new Error(
      "Tool security requires traceId.",
    );
  }

  if (!context.decisionId.trim()) {
    throw new Error(
      "Tool security requires decisionId.",
    );
  }

  if (!context.executionId.trim()) {
    throw new Error(
      "Tool security requires executionId.",
    );
  }

  if (!context.evidenceId.trim()) {
    throw new Error(
      "Tool security requires evidenceId.",
    );
  }

  if (
    !Number.isInteger(context.riskScore) ||
    context.riskScore < 0 ||
    context.riskScore > 100
  ) {
    throw new Error(
      "Tool security riskScore must be between 0 and 100.",
    );
  }
}

export function evaluateToolSecurity(
  context: ToolSecurityContext,
  policy: ToolSecurityPolicy,
): ToolSecurityResult {
  assertToolSecurityContext(context);

  if (
    context.workspaceId !==
    policy.workspaceId
  ) {
    return Object.freeze({
      decision: "BLOCK",
      allowed: false,
      reason:
        "Tool workspace does not match security policy workspace.",
      toolId: context.toolId,
      workspaceId: context.workspaceId,
      agentId: context.agentId,
      riskScore: context.riskScore,
    });
  }

  if (
    policy.blockedToolIds?.includes(
      context.toolId,
    )
  ) {
    return Object.freeze({
      decision: "BLOCK",
      allowed: false,
      reason:
        "Tool is explicitly blocked by policy.",
      toolId: context.toolId,
      workspaceId: context.workspaceId,
      agentId: context.agentId,
      riskScore: context.riskScore,
    });
  }

  if (
    policy.escalationToolIds?.includes(
      context.toolId,
    )
  ) {
    return Object.freeze({
      decision: "ESCALATE",
      allowed: false,
      reason:
        "Tool requires explicit approval.",
      toolId: context.toolId,
      workspaceId: context.workspaceId,
      agentId: context.agentId,
      riskScore: context.riskScore,
    });
  }

  if (
    context.riskScore >
    policy.maxRiskScore
  ) {
    return Object.freeze({
      decision: "ESCALATE",
      allowed: false,
      reason:
        "Tool risk score exceeds workspace threshold.",
      toolId: context.toolId,
      workspaceId: context.workspaceId,
      agentId: context.agentId,
      riskScore: context.riskScore,
    });
  }

  if (
    !policy.allowedToolIds.includes(
      context.toolId,
    )
  ) {
    return Object.freeze({
      decision: "BLOCK",
      allowed: false,
      reason:
        "Tool is not allowlisted by workspace policy.",
      toolId: context.toolId,
      workspaceId: context.workspaceId,
      agentId: context.agentId,
      riskScore: context.riskScore,
    });
  }

  return Object.freeze({
    decision: "ALLOW",
    allowed: true,
    reason:
      "Tool is authorized by workspace policy.",
    toolId: context.toolId,
    workspaceId: context.workspaceId,
    agentId: context.agentId,
    riskScore: context.riskScore,
  });
}
