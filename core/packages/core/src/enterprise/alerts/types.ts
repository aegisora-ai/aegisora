export type EnterpriseAlertSeverity =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type EnterpriseAlertStatus =
  | "ACTIVE"
  | "SUPPRESSED"
  | "DISABLED";

export type EnterpriseAlertSource =
  | "policy"
  | "risk"
  | "decision"
  | "execution"
  | "approval"
  | "evidence"
  | "audit"
  | "runtime"
  | "incident"
  | "manual";

export type EnterpriseAlertRule = Readonly<{
  ruleId: string;
  workspaceId: string;

  name: string;
  description: string;

  enabled: boolean;

  source: EnterpriseAlertSource;
  severity: EnterpriseAlertSeverity;

  minRiskScore?: number;
  requiredDecision?: "ALLOW" | "BLOCK" | "ESCALATE";

  dedupeWindowMs: number;

  createdAt: Date;
  updatedAt: Date;

  metadata: Readonly<Record<string, unknown>>;
}>;

export type CreateEnterpriseAlertRuleInput = Readonly<{
  ruleId: string;
  workspaceId: string;

  name: string;
  description: string;

  enabled?: boolean;

  source: EnterpriseAlertSource;
  severity: EnterpriseAlertSeverity;

  minRiskScore?: number;
  requiredDecision?: "ALLOW" | "BLOCK" | "ESCALATE";

  dedupeWindowMs?: number;

  createdAt?: Date;

  metadata?: Readonly<Record<string, unknown>>;
}>;

export type EnterpriseAlertEvent = Readonly<{
  workspaceId: string;

  source: EnterpriseAlertSource;
  severity?: EnterpriseAlertSeverity;

  riskScore?: number;
  decision?: "ALLOW" | "BLOCK" | "ESCALATE";

  traceId?: string;
  decisionId?: string;
  executionId?: string;
  evidenceId?: string;
  auditId?: string;
  agentId?: string;

  occurredAt?: Date;

  metadata?: Readonly<Record<string, unknown>>;
}>;

export type EnterpriseAlertMatch = Readonly<{
  matched: boolean;
  ruleId: string;
  workspaceId: string;
  severity: EnterpriseAlertSeverity;
  reason: string;

  traceId?: string;
  decisionId?: string;
  executionId?: string;
  evidenceId?: string;
  auditId?: string;
  agentId?: string;
}>;

function assertNonEmpty(
  value: string,
  field: string,
): void {
  if (!value.trim()) {
    throw new Error(
      `Enterprise alert requires ${field}.`,
    );
  }
}

export function assertEnterpriseAlertRule(
  rule: EnterpriseAlertRule,
): void {
  assertNonEmpty(rule.ruleId, "ruleId");
  assertNonEmpty(rule.workspaceId, "workspaceId");
  assertNonEmpty(rule.name, "name");
  assertNonEmpty(rule.source, "source");

  if (
    rule.minRiskScore !== undefined &&
    (
      !Number.isInteger(rule.minRiskScore) ||
      rule.minRiskScore < 0 ||
      rule.minRiskScore > 100
    )
  ) {
    throw new Error(
      "Enterprise alert minRiskScore must be between 0 and 100.",
    );
  }

  if (
    !Number.isInteger(rule.dedupeWindowMs) ||
    rule.dedupeWindowMs < 0
  ) {
    throw new Error(
      "Enterprise alert dedupeWindowMs must be a non-negative integer.",
    );
  }
}
