import type { EnforcementDecision } from "../enforcement/types";

export type ApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "consumed";

export interface ApprovalRequestBinding {
  agentId: string;
  action: string;
  traceId: string;
  decisionId: string;
  executionId: string;
  request: unknown;
}

export interface ApprovalRecord {
  approvalId: string;

  agentId: string;
  action: string;

  traceId: string;
  decisionId: string;
  executionId: string;

  requestHash: string;

  decision: Extract<
    EnforcementDecision,
    "ESCALATE"
  >;

  status: ApprovalStatus;

  createdAt: string;

  expiresAt: string;

  approvedAt?: string;
  approvedBy?: string;

  rejectedAt?: string;
  rejectedBy?: string;
  rejectionReason?: string;

  consumedAt?: string;
}

export interface ApprovalCreateInput {
  agentId: string;
  action: string;

  traceId: string;
  decisionId: string;
  executionId: string;

  request: unknown;

  expiresAt: string;
}

export interface ApprovalDecisionInput {
  approvalId: string;
  actorId: string;
}

export interface ApprovalConsumeInput {
  approvalId: string;

  agentId: string;
  action: string;

  traceId: string;
  decisionId: string;
  executionId: string;

  request: unknown;
}

export interface ApprovalStore {
  create(record: ApprovalRecord): ApprovalRecord;

  getById(
    approvalId: string,
  ): ApprovalRecord | undefined;

  list(): ApprovalRecord[];

  update(
    approvalId: string,
    patch: Partial<ApprovalRecord>,
  ): ApprovalRecord;

  delete?(
    approvalId: string,
  ): void;
}
