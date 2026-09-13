import type {
  UserId,
  WorkspaceId,
  WorkspacePermission,
} from "../access";

import {
  authorizeWorkspacePermission,
} from "../access";

import type {
  MembershipResolver,
} from "../access/authorize";

import type {
  WorkspaceMembership,
} from "../access";

import {
  EnterpriseApprovalAccessDeniedError,
  EnterpriseApprovalInvalidStateError,
} from "./types";

import type {
  EnterpriseApprovalRecord,
} from "./types";

import {
  EnterpriseApprovalRegistry,
} from "./registry";

export interface ApprovalWorkflowActor {
  readonly principal: {
    readonly userId: UserId;
  };
}

export interface CreateApprovalWorkflowInput {
  readonly workspaceId: WorkspaceId;
  readonly approvalId: string;
  readonly requiredPermission: WorkspacePermission;
  readonly requiredRoles?: readonly WorkspaceMembership["role"][];
}

export interface ResolveApprovalWorkflowInput {
  readonly workspaceId: WorkspaceId;
  readonly approvalId: string;
  readonly actor: ApprovalWorkflowActor;
  readonly reason?: string;
}

export interface ApprovalWorkflowRecord {
  readonly approvalId: string;
  readonly workspaceId: WorkspaceId;
  readonly status: EnterpriseApprovalRecord["status"];
  readonly requiredPermission: WorkspacePermission;
  readonly requiredRoles: readonly WorkspaceMembership["role"][];
  readonly createdAt: string;
  readonly resolvedAt?: string;
  readonly resolvedBy?: string;
  readonly resolutionReason?: string;
}

export interface EnterpriseApprovalWorkflowOptions {
  readonly registry: EnterpriseApprovalRegistry;
  readonly membershipResolver?: MembershipResolver;
}

function snapshot(
  record: ApprovalWorkflowRecord,
): ApprovalWorkflowRecord {
  return {
    ...record,
    requiredRoles: [...record.requiredRoles],
  };
}

export class EnterpriseApprovalWorkflow {

  private readonly workflows =
    new Map<string, ApprovalWorkflowRecord>();

  private readonly registry:
    EnterpriseApprovalRegistry;

  private readonly membershipResolver?:
    MembershipResolver;

  constructor(
    options: EnterpriseApprovalWorkflowOptions,
  ) {
    this.registry =
      options.registry;

    this.membershipResolver =
      options.membershipResolver;
  }

  create(
    input: CreateApprovalWorkflowInput,
  ): ApprovalWorkflowRecord {

    const approval =
      this.registry.getForWorkspace(
        input.workspaceId,
        input.approvalId,
      );

    if (!approval) {
      throw new Error(
        `Enterprise approval not found: ${input.approvalId}`,
      );
    }

    const existing =
      this.workflows.get(
        input.approvalId,
      );

    if (existing) {
      throw new EnterpriseApprovalInvalidStateError(
        input.approvalId,
        existing.status,
        "Approval workflow already exists.",
      );
    }

    if (
      approval.status !== "pending"
    ) {
      throw new EnterpriseApprovalInvalidStateError(
        approval.approvalId,
        approval.status,
        "Only pending approvals may enter an approval workflow.",
      );
    }

    const requiredRoles:
      WorkspaceMembership["role"][] =
      input.requiredRoles?.length
        ? [...input.requiredRoles]
        : ["owner", "admin"];

    const workflow: ApprovalWorkflowRecord = {
      approvalId:
        approval.approvalId,

      workspaceId:
        input.workspaceId,

      status:
        approval.status,

      requiredPermission:
        input.requiredPermission,

      requiredRoles,

      createdAt:
        new Date().toISOString(),
    };

    this.workflows.set(
      input.approvalId,
      workflow,
    );

    return snapshot(workflow);
  }

  get(
    workspaceId: WorkspaceId,
    approvalId: string,
  ): ApprovalWorkflowRecord | undefined {

    const workflow =
      this.workflows.get(
        approvalId,
      );

    if (!workflow) {
      return undefined;
    }

    if (
      workflow.workspaceId !==
      workspaceId
    ) {
      throw new EnterpriseApprovalAccessDeniedError(
        approvalId,
        workspaceId,
      );
    }

    return snapshot(workflow);
  }

  listPending(
    workspaceId: WorkspaceId,
  ): readonly ApprovalWorkflowRecord[] {

    return [...this.workflows.values()]
      .filter(
        (workflow) =>
          workflow.workspaceId ===
            workspaceId &&
          workflow.status ===
            "pending",
      )
      .map(snapshot);
  }

  async approve(
    input: ResolveApprovalWorkflowInput,
  ): Promise<ApprovalWorkflowRecord> {

    return this.resolve(
      input,
      "approve",
    );
  }

  async reject(
    input: ResolveApprovalWorkflowInput & {
      readonly reason: string;
    },
  ): Promise<ApprovalWorkflowRecord> {

    return this.resolve(
      input,
      "reject",
    );
  }

  private async resolve(
    input: ResolveApprovalWorkflowInput,
    operation:
      | "approve"
      | "reject",
  ): Promise<ApprovalWorkflowRecord> {

    const workflow =
      this.requireWorkflow(
        input.workspaceId,
        input.approvalId,
      );

    const actorUserId =
      input.actor.principal.userId;

    await this.authorizeActor(
      input.workspaceId,
      actorUserId,
      workflow,
    );

    let resolved:
      EnterpriseApprovalRecord;

    if (
      operation === "approve"
    ) {
      resolved =
        this.registry.approve({
          approvalId:
            input.approvalId,
          workspaceId:
            input.workspaceId,
          approverId:
            actorUserId,
          reason:
            input.reason,
        });
    } else {
      resolved =
        this.registry.reject({
          approvalId:
            input.approvalId,
          workspaceId:
            input.workspaceId,
          rejectorId:
            actorUserId,
          reason:
            input.reason ?? "",
        });
    }

    const updated: ApprovalWorkflowRecord = {
      ...workflow,

      status:
        resolved.status,

      resolvedAt:
        resolved.resolvedAt,

      resolvedBy:
        resolved.resolvedBy,

      resolutionReason:
        resolved.resolutionReason,
    };

    this.workflows.set(
      input.approvalId,
      updated,
    );

    return snapshot(updated);
  }

  private async authorizeActor(
    workspaceId: WorkspaceId,
    actorUserId: UserId,
    workflow: ApprovalWorkflowRecord,
  ): Promise<void> {

    if (!this.membershipResolver) {
      return;
    }

    const result =
      await authorizeWorkspacePermission(
        this.membershipResolver,
        {
          principal: {
            userId:
              actorUserId,
          },
          workspaceId,
          permission:
            workflow.requiredPermission,
        },
      );

    if (!result.authorized) {
      throw new Error(
        `${result.code}: ${result.reason}`,
      );
    }

    if (
      workflow.requiredRoles.length > 0 &&
      !workflow.requiredRoles.includes(
        result.context.membership.role,
      )
    ) {
      throw new Error(
        `FORBIDDEN: Role ${result.context.membership.role} is not permitted to resolve this approval.`,
      );
    }
  }

  private requireWorkflow(
    workspaceId: WorkspaceId,
    approvalId: string,
  ): ApprovalWorkflowRecord {

    const workflow =
      this.workflows.get(
        approvalId,
      );

    if (!workflow) {
      throw new Error(
        `Approval workflow not found: ${approvalId}`,
      );
    }

    if (
      workflow.workspaceId !==
      workspaceId
    ) {
      throw new EnterpriseApprovalAccessDeniedError(
        approvalId,
        workspaceId,
      );
    }

    return workflow;
  }
}


