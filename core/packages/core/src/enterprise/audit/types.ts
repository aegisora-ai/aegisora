export type EnterpriseAuditDecision =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE";

export type EnterpriseAuditEnforcementStatus =
  | "not_executed"
  | "executed"
  | "prevented"
  | "escalated";

export type EnterpriseAuditEventType =
  | "decision"
  | "execution"
  | "approval"
  | "evidence"
  | "incident";

export interface CreateEnterpriseAuditInput {
  auditId: string;
  workspaceId: string;

  traceId: string;
  decisionId: string;
  executionId: string;
  evidenceId: string;

  agentId: string;
  actorId?: string;

  action: string;
  resourceType: string;
  resource: string;

  decision: EnterpriseAuditDecision;
  riskScore: number;
  enforcementStatus: EnterpriseAuditEnforcementStatus;

  eventType: EnterpriseAuditEventType;
  reason: string;

  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export interface EnterpriseAuditRecord
  extends Readonly<
    Omit<
      CreateEnterpriseAuditInput,
      "metadata" | "createdAt"
    >
  > {
  readonly createdAt: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export class EnterpriseAuditAccessDeniedError extends Error {
  constructor(
    message = "Enterprise audit access denied.",
  ) {
    super(message);
    this.name =
      "EnterpriseAuditAccessDeniedError";
  }
}

export class EnterpriseAuditInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name =
      "EnterpriseAuditInvalidError";
  }
}

export class EnterpriseAuditAlreadyExistsError extends Error {
  constructor(auditId: string) {
    super(
      `Enterprise audit already exists: ${auditId}`,
    );
    this.name =
      "EnterpriseAuditAlreadyExistsError";
  }
}

export class EnterpriseAuditNotFoundError extends Error {
  constructor(auditId: string) {
    super(
      `Enterprise audit not found: ${auditId}`,
    );
    this.name =
      "EnterpriseAuditNotFoundError";
  }
}