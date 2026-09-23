import { createHash } from "node:crypto";

import type {
  AuthorityDriftSeverity,
} from "./authority-drift";

import type {
  ContainmentActionType,
} from "./autonomous-containment";

import type {
  TransitiveAuthorityResult,
} from "./transitive-authority";

export type AuthorityAwareDecisionState =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE";

export type AuthorityAwareExecutionReasonCode =
  | "AUTHORITY_OK"
  | "CRITICAL_CONTAINMENT"
  | "HIGH_AUTHORITY_DRIFT"
  | "CRITICAL_AUTHORITY_DRIFT"
  | "MEDIUM_AUTHORITY_DRIFT"
  | "CRITICAL_TRANSITIVE_RISK"
  | "HIGH_TRANSITIVE_RISK"
  | "MEDIUM_TRANSITIVE_RISK"
  | "APPROVAL_REQUIRED"
  | "APPROVAL_PENDING"
  | "APPROVAL_REJECTED"
  | "APPROVAL_EXPIRED"
  | "APPROVAL_CONSUMED"
  | "APPROVAL_EXECUTION_MISMATCH"
  | "AUTHORITY_CONTEXT_MISMATCH"
  | "CONTAINMENT_BLOCK";

export type AuthorityAwareApprovalStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "consumed";

export interface AuthorityAwareApprovalState {
  readonly status: AuthorityAwareApprovalStatus;
  readonly executionId: string;
  readonly approvalId?: string;
}

export interface AuthorityAwareExecutionInput {
  readonly workspaceId: string;
  readonly agentId: string;
  readonly executionId: string;
  readonly action: string;
  readonly resource: string;

  readonly transitiveAuthority:
    TransitiveAuthorityResult;

  readonly authorityDriftSeverity:
    AuthorityDriftSeverity;

  readonly containmentAction?:
    ContainmentActionType;

  readonly approval?:
    AuthorityAwareApprovalState;
}

export interface AuthorityAwareExecutionDecision {
  readonly workspaceId: string;
  readonly agentId: string;
  readonly executionId: string;

  readonly decision:
    AuthorityAwareDecisionState;

  readonly reasonCode:
    AuthorityAwareExecutionReasonCode;

  readonly reason: string;

  readonly requiresApproval: boolean;
  readonly containmentRequired: boolean;

  readonly authoritySnapshotId: string;

  readonly delegationDepth: number;
  readonly transitivelyReachableAgentIds:
    readonly string[];

  readonly reachableResources:
    readonly string[];

  readonly sensitiveResources:
    readonly string[];

  readonly productionResources:
    readonly string[];

  readonly blastRadiusScore: number;
  readonly transitiveBlastRadiusIncrease: number;

  readonly authorityDriftSeverity:
    AuthorityDriftSeverity;
}

export interface AuthorityAwareExecutionResult<T> {
  readonly executed: boolean;
  readonly decision:
    AuthorityAwareDecisionState;
  readonly value?: T;
}

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

function authoritySnapshotPayload(
  input: AuthorityAwareExecutionInput,
): string {
  return JSON.stringify({
    workspaceId:
      input.workspaceId,

    agentId:
      input.agentId,

    executionId:
      input.executionId,

    action:
      input.action,

    resource:
      input.resource,

    authorityDriftSeverity:
      input.authorityDriftSeverity,

    containmentAction:
      input.containmentAction ?? null,

    delegationDepth:
      input.transitiveAuthority
        .delegationDepth,

    transitivelyReachableAgentIds:
      [
        ...input.transitiveAuthority
          .transitivelyReachableAgentIds,
      ].sort(),

    reachableResources:
      [
        ...input.transitiveAuthority
          .reachableResources,
      ].sort(),

    sensitiveResources:
      [
        ...input.transitiveAuthority
          .sensitiveResources,
      ].sort(),

    productionResources:
      [
        ...input.transitiveAuthority
          .productionResources,
      ].sort(),

    blastRadiusScore:
      input.transitiveAuthority
        .blastRadiusScore,

    transitiveBlastRadiusIncrease:
      input.transitiveAuthority
        .transitiveBlastRadiusIncrease,
  });
}

function authoritySnapshotIdFor(
  input: AuthorityAwareExecutionInput,
): string {
  return createHash("sha256")
    .update(
      authoritySnapshotPayload(input),
      "utf8",
    )
    .digest("hex");
}

function baseDecision(
  input: AuthorityAwareExecutionInput,
  decision:
    AuthorityAwareDecisionState,
  reasonCode:
    AuthorityAwareExecutionReasonCode,
  reason: string,
  requiresApproval: boolean,
  containmentRequired: boolean,
): AuthorityAwareExecutionDecision {
  return {
    workspaceId:
      input.workspaceId,

    agentId:
      input.agentId,

    executionId:
      input.executionId,

    decision,

    reasonCode,

    reason,

    requiresApproval,

    containmentRequired,

    authoritySnapshotId:
      authoritySnapshotIdFor(input),

    delegationDepth:
      input.transitiveAuthority
        .delegationDepth,

    transitivelyReachableAgentIds:
      [
        ...input.transitiveAuthority
          .transitivelyReachableAgentIds,
      ],

    reachableResources:
      [
        ...input.transitiveAuthority
          .reachableResources,
      ],

    sensitiveResources:
      [
        ...input.transitiveAuthority
          .sensitiveResources,
      ],

    productionResources:
      [
        ...input.transitiveAuthority
          .productionResources,
      ],

    blastRadiusScore:
      input.transitiveAuthority
        .blastRadiusScore,

    transitiveBlastRadiusIncrease:
      input.transitiveAuthority
        .transitiveBlastRadiusIncrease,

    authorityDriftSeverity:
      input.authorityDriftSeverity,
  };
}

export class AuthorityAwareExecutionControlEngine {
  public decide(
    input: AuthorityAwareExecutionInput,
  ): AuthorityAwareExecutionDecision {
    assertNonEmpty(
      input.workspaceId,
      "workspaceId",
    );

    assertNonEmpty(
      input.agentId,
      "agentId",
    );

    assertNonEmpty(
      input.executionId,
      "executionId",
    );

    assertNonEmpty(
      input.action,
      "action",
    );

    assertNonEmpty(
      input.resource,
      "resource",
    );

    if (
      input.transitiveAuthority
        .workspaceId !==
      input.workspaceId
    ) {
      return baseDecision(
        input,
        "BLOCK",
        "AUTHORITY_CONTEXT_MISMATCH",
        "Authority analysis belongs to a different workspace.",
        false,
        true,
      );
    }

    if (
      input.transitiveAuthority
        .sourceAgentId !==
      input.agentId
    ) {
      return baseDecision(
        input,
        "BLOCK",
        "AUTHORITY_CONTEXT_MISMATCH",
        "Authority analysis belongs to a different source agent.",
        false,
        true,
      );
    }

    if (
      input.containmentAction ===
        "SUSPEND_AGENT"
    ) {
      return baseDecision(
        input,
        "BLOCK",
        "CRITICAL_CONTAINMENT",
        "Agent suspension is active; execution is not permitted.",
        false,
        true,
      );
    }

    if (
      input.containmentAction ===
        "BLOCK_EXECUTION"
    ) {
      return baseDecision(
        input,
        "BLOCK",
        "CONTAINMENT_BLOCK",
        "Containment requires execution to remain blocked.",
        false,
        true,
      );
    }

    if (
      input.authorityDriftSeverity ===
      "CRITICAL"
    ) {
      return baseDecision(
        input,
        "BLOCK",
        "CRITICAL_AUTHORITY_DRIFT",
        "Critical authority drift prevents continued execution.",
        false,
        true,
      );
    }

    if (
      input.authorityDriftSeverity ===
      "HIGH"
    ) {
      return baseDecision(
        input,
        "BLOCK",
        "HIGH_AUTHORITY_DRIFT",
        "High-severity authority drift prevents execution.",
        false,
        true,
      );
    }

    const transitiveRisk =
      input.transitiveAuthority
        .riskLevel;

    if (
      transitiveRisk === "CRITICAL"
    ) {
      return baseDecision(
        input,
        "BLOCK",
        "CRITICAL_TRANSITIVE_RISK",
        "Transitive authority exposes critical execution impact.",
        false,
        true,
      );
    }

    if (
      input.authorityDriftSeverity ===
      "MEDIUM"
    ) {
      return this.resolveApproval(
        input,
        "MEDIUM_AUTHORITY_DRIFT",
        "Medium-severity authority drift requires explicit approval before execution.",
      );
    }

    if (
      transitiveRisk === "HIGH"
    ) {
      return this.resolveApproval(
        input,
        "HIGH_TRANSITIVE_RISK",
        "High transitive authority impact requires explicit approval before execution.",
      );
    }

    if (
      transitiveRisk === "MEDIUM"
    ) {
      return this.resolveApproval(
        input,
        "MEDIUM_TRANSITIVE_RISK",
        "Medium transitive authority impact requires explicit approval before execution.",
      );
    }

    if (
      input.containmentAction ===
      "REQUIRE_APPROVAL"
    ) {
      return this.resolveApproval(
        input,
        "APPROVAL_REQUIRED",
        "Containment requires explicit human approval before execution.",
      );
    }

    return baseDecision(
      input,
      "ALLOW",
      "AUTHORITY_OK",
      "Authority state is within the allowed execution envelope.",
      false,
      false,
    );
  }

  public execute<T>(
    input: AuthorityAwareExecutionInput,
    sideEffect: () => T,
  ): AuthorityAwareExecutionResult<T> {
    const decision =
      this.decide(input);

    if (
      decision.decision !== "ALLOW"
    ) {
      return {
        executed: false,
        decision: decision.decision,
      };
    }

    return {
      executed: true,
      decision: decision.decision,
      value: sideEffect(),
    };
  }

  private resolveApproval(
    input: AuthorityAwareExecutionInput,
    fallbackCode:
      | "MEDIUM_AUTHORITY_DRIFT"
      | "HIGH_TRANSITIVE_RISK"
      | "MEDIUM_TRANSITIVE_RISK"
      | "APPROVAL_REQUIRED",
    fallbackReason: string,
  ): AuthorityAwareExecutionDecision {
    const approval =
      input.approval;

    if (!approval) {
      return baseDecision(
        input,
        "ESCALATE",
        fallbackCode,
        `${fallbackReason} No approval is currently bound to this execution.`,
        true,
        false,
      );
    }

    if (
      approval.executionId !==
      input.executionId
    ) {
      return baseDecision(
        input,
        "BLOCK",
        "APPROVAL_EXECUTION_MISMATCH",
        "Approval executionId does not match the current execution.",
        true,
        true,
      );
    }

    switch (approval.status) {
      case "approved":
        return baseDecision(
          input,
          "ALLOW",
          fallbackCode,
          `${fallbackReason} Matching approval is present for this execution.`,
          true,
          false,
        );

      case "pending":
        return baseDecision(
          input,
          "ESCALATE",
          "APPROVAL_PENDING",
          "Approval is still pending; execution remains deferred.",
          true,
          false,
        );

      case "rejected":
        return baseDecision(
          input,
          "BLOCK",
          "APPROVAL_REJECTED",
          "The bound approval was rejected.",
          true,
          true,
        );

      case "expired":
        return baseDecision(
          input,
          "BLOCK",
          "APPROVAL_EXPIRED",
          "The bound approval has expired.",
          true,
          true,
        );

      case "consumed":
        return baseDecision(
          input,
          "BLOCK",
          "APPROVAL_CONSUMED",
          "The bound approval has already been consumed.",
          true,
          true,
        );
    }
  }
}
