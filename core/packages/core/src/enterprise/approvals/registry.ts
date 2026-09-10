import {
  EnterpriseApprovalAccessDeniedError,
  EnterpriseApprovalInvalidStateError,
  EnterpriseApprovalNotFoundError,
} from "./types";

import type {
  ApproveEnterpriseApprovalInput,
  ConsumeEnterpriseApprovalInput,
  CreateEnterpriseApprovalInput,
  EnterpriseApprovalRecord,
  ExpireEnterpriseApprovalInput,
  RejectEnterpriseApprovalInput,
} from "./types";

function assertNonEmpty(
  value: string,
  field: string,
): void {

  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `${field} must be non-empty`,
    );
  }
}

function assertRiskScore(
  value: number,
): void {

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > 100
  ) {
    throw new Error(
      "riskScore must be between 0 and 100",
    );
  }
}

function nowIso(): string {
  return new Date().toISOString();
}

function workspaceAllowed(
  record: EnterpriseApprovalRecord,
  workspaceId: string,
): void {

  if (
    record.workspaceId !== workspaceId
  ) {
    throw new EnterpriseApprovalAccessDeniedError(
      record.approvalId,
      workspaceId,
    );
  }
}

function snapshot(
  record: EnterpriseApprovalRecord,
): EnterpriseApprovalRecord {

  return {
    ...record,

    metadata: {
      ...record.metadata,
    },
  };
}

export class EnterpriseApprovalRegistry {

  private readonly records =
    new Map<
      string,
      EnterpriseApprovalRecord
    >();

  create(
    input: CreateEnterpriseApprovalInput,
  ): EnterpriseApprovalRecord {

    assertNonEmpty(
      input.workspaceId,
      "workspaceId",
    );

    assertNonEmpty(
      input.runtimeApprovalId,
      "runtimeApprovalId",
    );

    assertNonEmpty(
      input.agentId,
      "agentId",
    );

    assertNonEmpty(
      input.requesterId,
      "requesterId",
    );

    assertNonEmpty(
      input.decisionId,
      "decisionId",
    );

    assertNonEmpty(
      input.traceId,
      "traceId",
    );

    assertNonEmpty(
      input.executionId,
      "executionId",
    );

    assertNonEmpty(
      input.evidenceId,
      "evidenceId",
    );

    assertNonEmpty(
      input.action,
      "action",
    );

    assertNonEmpty(
      input.resourceType,
      "resourceType",
    );

    assertNonEmpty(
      input.resource,
      "resource",
    );

    assertRiskScore(
      input.riskScore,
    );

    const expiresAt =
      new Date(input.expiresAt);

    if (
      Number.isNaN(
        expiresAt.getTime(),
      )
    ) {
      throw new Error(
        "expiresAt must be a valid ISO timestamp",
      );
    }

    const createdAt =
      nowIso();

    if (
      expiresAt.getTime() <=
      new Date(createdAt).getTime()
    ) {
      throw new Error(
        "expiresAt must be in the future",
      );
    }

    const existingRuntime =
      Array
        .from(this.records.values())
        .find(
          (record) =>
            record.runtimeApprovalId ===
            input.runtimeApprovalId,
        );

    if (existingRuntime) {
      throw new EnterpriseApprovalInvalidStateError(
        existingRuntime.approvalId,
        existingRuntime.status,
        "Runtime approval is already bound to an enterprise approval.",
      );
    }

    const approvalId =
      crypto.randomUUID();

    const record:
      EnterpriseApprovalRecord = {

      approvalId,

      runtimeApprovalId:
        input.runtimeApprovalId,

      workspaceId:
        input.workspaceId,

      agentId:
        input.agentId,

      requesterId:
        input.requesterId,

      decisionId:
        input.decisionId,

      traceId:
        input.traceId,

      executionId:
        input.executionId,

      evidenceId:
        input.evidenceId,

      action:
        input.action,

      resourceType:
        input.resourceType,

      resource:
        input.resource,

      riskScore:
        input.riskScore,

      policyVersion:
        input.policyVersion,

      decision:
        input.decision ??
        "ESCALATE",

      status:
        "pending",

      reason:
        input.reason,

      createdAt,

      expiresAt:
        expiresAt.toISOString(),

      metadata:
        {
          ...(input.metadata ?? {}),

          runtimeApprovalId:
            input.runtimeApprovalId,
        },
    };

    this.records.set(
      approvalId,
      record,
    );

    return snapshot(record);
  }

  get(
    approvalId: string,
  ): EnterpriseApprovalRecord | undefined {

    const record =
      this.records.get(
        approvalId,
      );

    return record
      ? snapshot(record)
      : undefined;
  }

  getForWorkspace(
    workspaceId: string,
    approvalId: string,
  ): EnterpriseApprovalRecord | undefined {

    const record =
      this.records.get(
        approvalId,
      );

    if (!record) {
      return undefined;
    }

    workspaceAllowed(
      record,
      workspaceId,
    );

    return snapshot(record);
  }

  list(
    workspaceId: string,
  ): EnterpriseApprovalRecord[] {

    return Array
      .from(this.records.values())
      .filter(
        (record) =>
          record.workspaceId ===
          workspaceId,
      )
      .map(snapshot);
  }

  approve(
    input: ApproveEnterpriseApprovalInput,
  ): EnterpriseApprovalRecord {

    const record =
      this.require(
        input.approvalId,
      );

    workspaceAllowed(
      record,
      input.workspaceId,
    );

    this.expireIfNeeded(record);

    if (
      record.status !== "pending"
    ) {
      throw new EnterpriseApprovalInvalidStateError(
        record.approvalId,
        record.status,
        "Only pending approvals may be approved.",
      );
    }

    const timestamp =
      nowIso();

    record.status =
      "approved";

    record.approvedAt =
      timestamp;

    record.approvedBy =
      input.approverId;

    record.resolvedAt =
      timestamp;

    record.resolvedBy =
      input.approverId;

    record.resolutionReason =
      input.reason ??
      "Approval granted.";

    return snapshot(record);
  }

  reject(
    input: RejectEnterpriseApprovalInput,
  ): EnterpriseApprovalRecord {

    const record =
      this.require(
        input.approvalId,
      );

    workspaceAllowed(
      record,
      input.workspaceId,
    );

    this.expireIfNeeded(record);

    if (
      record.status !== "pending"
    ) {
      throw new EnterpriseApprovalInvalidStateError(
        record.approvalId,
        record.status,
        "Only pending approvals may be rejected.",
      );
    }

    assertNonEmpty(
      input.reason,
      "reason",
    );

    const timestamp =
      nowIso();

    record.status =
      "rejected";

    record.rejectedAt =
      timestamp;

    record.rejectedBy =
      input.rejectorId;

    record.resolvedAt =
      timestamp;

    record.resolvedBy =
      input.rejectorId;

    record.rejectionReason =
      input.reason;

    record.resolutionReason =
      input.reason;

    return snapshot(record);
  }

  expire(
    input: ExpireEnterpriseApprovalInput,
  ): EnterpriseApprovalRecord {

    const record =
      this.require(
        input.approvalId,
      );

    workspaceAllowed(
      record,
      input.workspaceId,
    );

    if (
      record.status !== "pending"
    ) {
      throw new EnterpriseApprovalInvalidStateError(
        record.approvalId,
        record.status,
        "Only pending approvals may expire.",
      );
    }

    const timestamp =
      nowIso();

    record.status =
      "expired";

    record.resolvedAt =
      timestamp;

    record.resolvedBy =
      input.actorId;

    record.resolutionReason =
      input.reason ??
      "Approval expired.";

    return snapshot(record);
  }

  consume(
    input: ConsumeEnterpriseApprovalInput,
  ): EnterpriseApprovalRecord {

    const record =
      this.require(
        input.approvalId,
      );

    workspaceAllowed(
      record,
      input.workspaceId,
    );

    this.expireIfNeeded(record);

    if (
      record.status !== "approved"
    ) {
      throw new EnterpriseApprovalInvalidStateError(
        record.approvalId,
        record.status,
        "Only approved approvals may be consumed.",
      );
    }

    if (
      record.executionId !==
      input.executionId
    ) {
      throw new EnterpriseApprovalInvalidStateError(
        record.approvalId,
        record.status,
        "Approval executionId does not match the approved execution.",
      );
    }

    record.status =
      "consumed";

    record.consumedAt =
      nowIso();

    return snapshot(record);
  }

  private expireIfNeeded(
    record: EnterpriseApprovalRecord,
  ): void {

    if (
      record.status !== "pending"
    ) {
      return;
    }

    if (
      new Date(record.expiresAt).getTime()
      <= Date.now()
    ) {

      record.status =
        "expired";

      const timestamp =
        nowIso();

      record.resolvedAt =
        timestamp;

      record.resolutionReason =
        "Approval expired.";
    }
  }

  private require(
    approvalId: string,
  ): EnterpriseApprovalRecord {

    const record =
      this.records.get(
        approvalId,
      );

    if (!record) {
      throw new EnterpriseApprovalNotFoundError(
        approvalId,
      );
    }

    return record;
  }
}
