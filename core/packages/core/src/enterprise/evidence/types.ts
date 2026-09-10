export type EnterpriseEvidenceDecision =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE";

export type EnterpriseEvidenceEnforcementStatus =
  | "not_executed"
  | "executed"
  | "prevented"
  | "escalated";

export interface EnterpriseEvidenceRecord {
  readonly evidenceId: string;
  readonly workspaceId: string;
  readonly traceId: string;
  readonly decisionId: string;
  readonly executionId: string;
  readonly agentId: string;
  readonly approvalId?: string;
  readonly policyVersion?: number;
  readonly riskScore: number;
  readonly finalDecision: EnterpriseEvidenceDecision;
  readonly enforcementStatus: EnterpriseEvidenceEnforcementStatus;
  readonly resourceType: string;
  readonly action: string;
  readonly tool?: string;
  readonly reason: string;
  readonly createdAt: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface CreateEnterpriseEvidenceInput {
  evidenceId: string;
  workspaceId: string;
  traceId: string;
  decisionId: string;
  executionId: string;
  agentId: string;
  approvalId?: string;
  policyVersion?: number;
  riskScore: number;
  finalDecision: EnterpriseEvidenceDecision;
  enforcementStatus: EnterpriseEvidenceEnforcementStatus;
  resourceType: string;
  action: string;
  tool?: string;
  reason: string;
  createdAt?: string;
  metadata?: Record<string, unknown>;
}

export class EnterpriseEvidenceAccessDeniedError extends Error {
  constructor(message = "Enterprise evidence access denied.") {
    super(message);
    this.name = "EnterpriseEvidenceAccessDeniedError";
  }
}

export class EnterpriseEvidenceInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EnterpriseEvidenceInvalidError";
  }
}

export class EnterpriseEvidenceAlreadyExistsError extends Error {
  constructor(evidenceId: string) {
    super(
      `Enterprise evidence already exists: ${evidenceId}`,
    );
    this.name = "EnterpriseEvidenceAlreadyExistsError";
  }
}

export class EnterpriseEvidenceNotFoundError extends Error {
  constructor(evidenceId: string) {
    super(
      `Enterprise evidence not found: ${evidenceId}`,
    );
    this.name = "EnterpriseEvidenceNotFoundError";
  }
}
