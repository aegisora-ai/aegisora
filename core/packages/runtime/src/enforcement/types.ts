import type { RuntimeContext } from "../context/runtime-context";

import type { ContinuitySeal } from "@aegisora/core";

export type EnforcementDecision =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE";

export type EnforcementResourceType =
  | "tool"
  | "provider"
  | "agent";

export interface EnforcementRequest {
  agentId: string;
  resourceType: EnforcementResourceType;
  tool: string;
  action: string;
  input: unknown;
  metadata?: Record<string, unknown>;
}

export interface EnforcementThreat {
  type: string;
  severity: string;
  description: string;
  score: number;
}

export interface EnforcementResult {
  decision: EnforcementDecision;
  reason: string;
  riskScore: number;
  threats: EnforcementThreat[];
  permission: "allow" | "deny" | "review";
  policy: "allow" | "block" | "escalate";
  security: "allow" | "block" | "escalate";

  traceId: string;
  decisionId: string;
  executionId: string;
  evidenceId: string;

  enforcementStatus:
    | "not_executed"
    | "executed"
    | "prevented"
    | "escalated";

  continuitySeal?: ContinuitySeal;

  executionOutcome:
    | "not_attempted"
    | "succeeded"
    | "failed";
}

export interface EnforcementAuditRecord {
  agentId: string;
  resourceType: EnforcementResourceType;
  tool: string;
  action: string;
  decision: EnforcementDecision;
  reason: string;
  riskScore: number;
  threats: EnforcementThreat[];
  metadata?: Record<string, unknown>;
}

export interface EnforcementDependencies {
  context: RuntimeContext;
  audit?: {
    record(record: EnforcementAuditRecord): Promise<unknown> | unknown;
  };
}

import type {
  EnterpriseRuntimeApprovalBridge,
} from "@aegisora/core";

export interface EnterpriseApprovalRuntimeConfig {

  /**
   * Trusted workspace scope established by the
   * enterprise bootstrap layer.
   *
   * NEVER derive this from request.metadata.
   */
  readonly workspaceId: string;

  /**
   * Trusted requester/principal identity established
   * by the enterprise bootstrap layer.
   */
  readonly requesterId: string;

  /**
   * Shared enterprise/runtime approval bridge.
   *
   * A shared instance is required when multiple runtime
   * enforcement boundaries participate in the same process.
   */
  readonly bridge?: EnterpriseRuntimeApprovalBridge;
}
