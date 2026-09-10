import {
  EnterpriseRuntimeApprovalBridge,
} from "@aegisora/core";

import {
  ApprovalEngine,
} from "./approval-engine";

import type {
  ApprovalRecord,
} from "./approval";

export interface EnterpriseApprovalResolutionInput {
  readonly workspaceId: string;
  readonly runtimeApprovalId: string;
  readonly actorId: string;
  readonly reason?: string;
}

export interface EnterpriseApprovalResolutionResult {
  readonly runtimeApprovalId: string;
  readonly enterpriseApprovalId: string;
  readonly status:
    import("@aegisora/core").EnterpriseApprovalRecord["status"];
  readonly runtimeStatus:
    import("../approval").ApprovalRecord["status"];
}

export class EnterpriseApprovalResolutionSync {

  constructor(
    private readonly bridge:
      EnterpriseRuntimeApprovalBridge,

    private readonly runtime:
      ApprovalEngine,
  ) {}

  approve(
    input: EnterpriseApprovalResolutionInput,
  ): EnterpriseApprovalResolutionResult {

    const pair =
      this.requirePendingPair(
        input.workspaceId,
        input.runtimeApprovalId,
      );

    const runtimeRecord =
      this.runtime.approve({
        approvalId:
          pair.runtime.approvalId,
        actorId:
          input.actorId,
      });

    const enterpriseRecord =
      this.bridge.approve({
        workspaceId:
          input.workspaceId,
        runtimeApprovalId:
          input.runtimeApprovalId,
        actorId:
          input.actorId,
        reason:
          input.reason,
      });

    return {
      runtimeApprovalId:
        input.runtimeApprovalId,
      enterpriseApprovalId:
        enterpriseRecord.approvalId,
      status:
        enterpriseRecord.status,
      runtimeStatus:
        runtimeRecord.status,
    };
  }

  reject(
    input:
      EnterpriseApprovalResolutionInput & {
        readonly reason: string;
      },
  ): EnterpriseApprovalResolutionResult {

    const pair =
      this.requirePendingPair(
        input.workspaceId,
        input.runtimeApprovalId,
      );

    const runtimeRecord =
      this.runtime.reject({
        approvalId:
          pair.runtime.approvalId,
        actorId:
          input.actorId,
        reason:
          input.reason,
      });

    const enterpriseRecord =
      this.bridge.reject({
        workspaceId:
          input.workspaceId,
        runtimeApprovalId:
          input.runtimeApprovalId,
        actorId:
          input.actorId,
        reason:
          input.reason,
      });

    return {
      runtimeApprovalId:
        input.runtimeApprovalId,
      enterpriseApprovalId:
        enterpriseRecord.approvalId,
      status:
        enterpriseRecord.status,
      runtimeStatus:
        runtimeRecord.status,
    };
  }

  expire(
    input: EnterpriseApprovalResolutionInput,
  ): EnterpriseApprovalResolutionResult {

    const pair =
      this.requirePendingPair(
        input.workspaceId,
        input.runtimeApprovalId,
      );

    const runtimeRecord =
      this.runtime.expire(
        pair.runtime.approvalId,
      );

    const enterpriseRecord =
      this.bridge.expire({
        workspaceId:
          input.workspaceId,
        runtimeApprovalId:
          input.runtimeApprovalId,
        actorId:
          input.actorId,
        reason:
          input.reason,
      });

    return {
      runtimeApprovalId:
        input.runtimeApprovalId,
      enterpriseApprovalId:
        enterpriseRecord.approvalId,
      status:
        enterpriseRecord.status,
      runtimeStatus:
        runtimeRecord.status,
    };
  }

  private requirePendingPair(
    workspaceId: string,
    runtimeApprovalId: string,
  ): {
    enterpriseApprovalId: string;
    enterpriseStatus: string;
    runtime: ApprovalRecord;
  } {

    const enterprise =
      this.bridge.getByRuntimeApprovalId(
        workspaceId,
        runtimeApprovalId,
      );

    if (!enterprise) {
      throw new Error(
        "Enterprise approval binding not found.",
      );
    }

    const runtime =
      this.runtime.get(
        runtimeApprovalId,
      );

    if (!runtime) {
      throw new Error(
        "Runtime approval not found.",
      );
    }

    if (
      enterprise.status !==
        "pending" ||
      runtime.status !==
        "pending"
    ) {
      throw new Error(
        `Resolution sync requires both approvals to be pending. Enterprise=${enterprise.status}, Runtime=${runtime.status}.`,
      );
    }

    if (
      enterprise.runtimeApprovalId !==
        runtime.approvalId
    ) {
      throw new Error(
        "Enterprise/runtime approval identity mismatch.",
      );
    }

    if (
      enterprise.agentId !==
        runtime.agentId
    ) {
      throw new Error(
        "Enterprise/runtime agent binding mismatch.",
      );
    }

    if (
      enterprise.action !==
        runtime.action
    ) {
      throw new Error(
        "Enterprise/runtime action binding mismatch.",
      );
    }

    if (
      enterprise.traceId !==
        runtime.traceId
    ) {
      throw new Error(
        "Enterprise/runtime trace binding mismatch.",
      );
    }

    if (
      enterprise.decisionId !==
        runtime.decisionId
    ) {
      throw new Error(
        "Enterprise/runtime decision binding mismatch.",
      );
    }

    if (
      enterprise.executionId !==
        runtime.executionId
    ) {
      throw new Error(
        "Enterprise/runtime execution binding mismatch.",
      );
    }

    return {
      enterpriseApprovalId:
        enterprise.approvalId,
      enterpriseStatus:
        enterprise.status,
      runtime,
    };
  }
}