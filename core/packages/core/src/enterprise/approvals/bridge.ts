import {
  EnterpriseApprovalInvalidStateError,
  EnterpriseApprovalNotFoundError,
} from "./types";

import type {
  EnterpriseApprovalRecord,
} from "./types";

import {
  EnterpriseApprovalRegistry,
} from "./registry";

export interface RuntimeApprovalSnapshot {

  approvalId: string;

  agentId: string;

  action: string;

  traceId: string;

  decisionId: string;

  executionId: string;

  request: {
    resourceType: string;

    tool: string;

    input: unknown;
  };

  expiresAt: string;

  status:
    | "pending"
    | "approved"
    | "rejected"
    | "expired"
    | "consumed";
}

export interface CreateEnterpriseRuntimeApprovalInput {

  workspaceId: string;

  requesterId: string;

  runtimeApproval: RuntimeApprovalSnapshot;

  evidenceId: string;

  riskScore: number;

  policyVersion?: number;

  resource?: string;

  reason: string;

  metadata?: Record<string, unknown>;
}

export interface ValidateEnterpriseRuntimeApprovalInput {

  workspaceId: string;

  runtimeApprovalId: string;

  agentId: string;

  action: string;

  decisionId: string;

  traceId: string;

  executionId: string;

  evidenceId: string;

  resourceType: string;

  tool: string;
}

export interface ResolveEnterpriseRuntimeApprovalInput {

  workspaceId: string;

  runtimeApprovalId: string;

  actorId: string;

  reason?: string;
}

export interface ConsumeEnterpriseRuntimeApprovalInput {

  workspaceId: string;

  runtimeApprovalId: string;

  executionId: string;
}

export class EnterpriseRuntimeApprovalBridge {

  private readonly runtimeToEnterprise =
    new Map<string, string>();

  constructor(
    private readonly registry:
      EnterpriseApprovalRegistry =
        new EnterpriseApprovalRegistry(),
  ) {}

  create(
    input: CreateEnterpriseRuntimeApprovalInput,
  ): EnterpriseApprovalRecord {

    const runtime =
      input.runtimeApproval;

    if (
      runtime.status !== "pending"
    ) {
      throw new EnterpriseApprovalInvalidStateError(
        runtime.approvalId,
        runtime.status,
        "Only pending runtime approvals may enter the enterprise control plane.",
      );
    }

    const existing =
      this.runtimeToEnterprise.get(
        runtime.approvalId,
      );

    if (existing) {
      const record =
        this.registry.get(existing);

      throw new EnterpriseApprovalInvalidStateError(
        existing,
        record?.status ?? "pending",
        "Runtime approval is already bound to an enterprise approval.",
      );
    }

    const enterprise =
      this.registry.create({

        workspaceId:
          input.workspaceId,

        runtimeApprovalId:
          runtime.approvalId,

        agentId:
          runtime.agentId,

        requesterId:
          input.requesterId,

        decisionId:
          runtime.decisionId,

        traceId:
          runtime.traceId,

        executionId:
          runtime.executionId,

        evidenceId:
          input.evidenceId,

        action:
          runtime.action,

        resourceType:
          runtime.request.resourceType,

        resource:
          input.resource ??
          runtime.request.tool,

        riskScore:
          input.riskScore,

        policyVersion:
          input.policyVersion,

        decision:
          "ESCALATE",

        reason:
          input.reason,

        expiresAt:
          runtime.expiresAt,

        metadata: {
          ...(input.metadata ?? {}),

          runtimeApprovalId:
            runtime.approvalId,
        },
      });

    this.runtimeToEnterprise.set(
      runtime.approvalId,
      enterprise.approvalId,
    );

    return enterprise;
  }

  getByRuntimeApprovalId(
    workspaceId: string,
    runtimeApprovalId: string,
  ): EnterpriseApprovalRecord | undefined {

    const enterpriseId =
      this.runtimeToEnterprise.get(
        runtimeApprovalId,
      );

    if (!enterpriseId) {
      return undefined;
    }

    return this.registry.getForWorkspace(
      workspaceId,
      enterpriseId,
    );
  }

  approve(
    input: ResolveEnterpriseRuntimeApprovalInput,
  ): EnterpriseApprovalRecord {

    const record =
      this.requireRuntimeApproval(
        input.workspaceId,
        input.runtimeApprovalId,
      );

    return this.registry.approve({
      approvalId:
        record.approvalId,

      workspaceId:
        input.workspaceId,

      approverId:
        input.actorId,

      reason:
        input.reason,
    });
  }

  reject(
    input:
      ResolveEnterpriseRuntimeApprovalInput & {
        reason: string;
      },
  ): EnterpriseApprovalRecord {

    const record =
      this.requireRuntimeApproval(
        input.workspaceId,
        input.runtimeApprovalId,
      );

    return this.registry.reject({
      approvalId:
        record.approvalId,

      workspaceId:
        input.workspaceId,

      rejectorId:
        input.actorId,

      reason:
        input.reason,
    });
  }

  expire(
    input: ResolveEnterpriseRuntimeApprovalInput,
  ): EnterpriseApprovalRecord {

    const record =
      this.requireRuntimeApproval(
        input.workspaceId,
        input.runtimeApprovalId,
      );

    return this.registry.expire({
      approvalId:
        record.approvalId,

      workspaceId:
        input.workspaceId,

      actorId:
        input.actorId,

      reason:
        input.reason,
    });
  }

  validateForResume(
    input: ValidateEnterpriseRuntimeApprovalInput,
  ): EnterpriseApprovalRecord {

    const record =
      this.requireRuntimeApproval(
        input.workspaceId,
        input.runtimeApprovalId,
      );

    this.assertApproved(
      record,
    );

    const mismatches: string[] = [];

    if (
      record.agentId !==
      input.agentId
    ) {
      mismatches.push(
        "agentId",
      );
    }

    if (
      record.action !==
      input.action
    ) {
      mismatches.push(
        "action",
      );
    }

    if (
      record.decisionId !==
      input.decisionId
    ) {
      mismatches.push(
        "decisionId",
      );
    }

    if (
      record.traceId !==
      input.traceId
    ) {
      mismatches.push(
        "traceId",
      );
    }

    if (
      record.executionId !==
      input.executionId
    ) {
      mismatches.push(
        "executionId",
      );
    }

    if (
      record.evidenceId !==
      input.evidenceId
    ) {
      mismatches.push(
        "evidenceId",
      );
    }

    if (
      record.resourceType !==
      input.resourceType
    ) {
      mismatches.push(
        "resourceType",
      );
    }

    if (
      record.resource !==
      input.tool
    ) {
      mismatches.push(
        "tool",
      );
    }

    if (
      mismatches.length > 0
    ) {
      throw new EnterpriseApprovalInvalidStateError(
        record.approvalId,
        record.status,
        `Enterprise/runtime approval binding mismatch: ${mismatches.join(", ")}`,
      );
    }

    return {
      ...record,
      metadata: {
        ...record.metadata,
      },
    };
  }

  consume(
    input: ConsumeEnterpriseRuntimeApprovalInput,
  ): EnterpriseApprovalRecord {

    const record =
      this.requireRuntimeApproval(
        input.workspaceId,
        input.runtimeApprovalId,
      );

    if (
      record.executionId !==
      input.executionId
    ) {
      throw new EnterpriseApprovalInvalidStateError(
        record.approvalId,
        record.status,
        "Enterprise approval executionId does not match the consuming execution.",
      );
    }

    return this.registry.consume({
      approvalId:
        record.approvalId,

      workspaceId:
        input.workspaceId,

      executionId:
        input.executionId,
    });
  }

  getRegistry():
    EnterpriseApprovalRegistry {

    return this.registry;
  }

  private assertApproved(
    record: EnterpriseApprovalRecord,
  ): void {

    if (
      record.status === "pending" &&
      new Date(
        record.expiresAt,
      ).getTime() <= Date.now()
    ) {
      throw new EnterpriseApprovalInvalidStateError(
        record.approvalId,
        record.status,
        "Approval has expired.",
      );
    }

    if (
      record.status !== "approved"
    ) {
      throw new EnterpriseApprovalInvalidStateError(
        record.approvalId,
        record.status,
        "Only approved enterprise approvals may resume execution.",
      );
    }
  }

  private requireRuntimeApproval(
    workspaceId: string,
    runtimeApprovalId: string,
  ): EnterpriseApprovalRecord {

    const enterprise =
      this.getByRuntimeApprovalId(
        workspaceId,
        runtimeApprovalId,
      );

    if (!enterprise) {
      throw new EnterpriseApprovalNotFoundError(
        runtimeApprovalId,
      );
    }

    return enterprise;
  }
}
