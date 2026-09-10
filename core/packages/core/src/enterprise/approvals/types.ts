export type EnterpriseApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "consumed";

export type EnterpriseApprovalDecision =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE";

export interface EnterpriseApprovalRecord {

  approvalId: string;

  /**
   * Runtime ApprovalEngine identity bound to this
   * enterprise approval.
   */
  runtimeApprovalId: string;

  workspaceId: string;

  agentId: string;

  requesterId: string;

  decisionId: string;

  traceId: string;

  executionId: string;

  evidenceId: string;

  action: string;

  resourceType: string;

  resource: string;

  riskScore: number;

  policyVersion?: number;

  decision: EnterpriseApprovalDecision;

  status: EnterpriseApprovalStatus;

  reason: string;

  createdAt: string;

  expiresAt: string;

  approvedAt?: string;

  approvedBy?: string;

  rejectedAt?: string;

  rejectedBy?: string;

  rejectionReason?: string;

  resolvedAt?: string;

  resolvedBy?: string;

  resolutionReason?: string;

  consumedAt?: string;

  metadata: Record<string, unknown>;
}

export interface CreateEnterpriseApprovalInput {

  workspaceId: string;

  runtimeApprovalId: string;

  agentId: string;

  requesterId: string;

  decisionId: string;

  traceId: string;

  executionId: string;

  evidenceId: string;

  action: string;

  resourceType: string;

  resource: string;

  riskScore: number;

  policyVersion?: number;

  decision?: EnterpriseApprovalDecision;

  reason: string;

  expiresAt: string;

  metadata?: Record<string, unknown>;
}

export interface ApproveEnterpriseApprovalInput {

  approvalId: string;

  workspaceId: string;

  approverId: string;

  reason?: string;
}

export interface RejectEnterpriseApprovalInput {

  approvalId: string;

  workspaceId: string;

  rejectorId: string;

  reason: string;
}

export interface ExpireEnterpriseApprovalInput {

  approvalId: string;

  workspaceId: string;

  actorId: string;

  reason?: string;
}

export interface ConsumeEnterpriseApprovalInput {

  approvalId: string;

  workspaceId: string;

  executionId: string;
}

export class EnterpriseApprovalNotFoundError
  extends Error {

  constructor(
    approvalId: string,
  ) {
    super(
      `Enterprise approval not found: ${approvalId}`,
    );

    this.name =
      "EnterpriseApprovalNotFoundError";
  }
}

export class EnterpriseApprovalAccessDeniedError
  extends Error {

  constructor(
    approvalId: string,
    workspaceId: string,
  ) {
    super(
      `Approval ${approvalId} does not belong to workspace ${workspaceId}`,
    );

    this.name =
      "EnterpriseApprovalAccessDeniedError";
  }
}

export class EnterpriseApprovalInvalidStateError
  extends Error {

  constructor(
    approvalId: string,
    status: EnterpriseApprovalStatus,
    message: string,
  ) {
    super(
      `Approval ${approvalId} cannot transition from ${status}: ${message}`,
    );

    this.name =
      "EnterpriseApprovalInvalidStateError";
  }
}
