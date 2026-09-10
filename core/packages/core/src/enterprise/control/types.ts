import type { WorkspaceId } from "../access";

import type {
  RiskAssessment,
  RiskRequest,
} from "../risk";

import type {
  PolicyDefinition,
  PolicyVersion,
} from "../policies";

export type Decision =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE";

export type ControlDecisionReason =
  | "risk"
  | "policy"
  | "combined"
  | "system";

export interface ControlRequest extends RiskRequest {
  readonly requestId: string;
}

export interface PolicyResolution {
  readonly policy: PolicyDefinition | null;
  readonly version: PolicyVersion | null;
  readonly matched: boolean;
  readonly effect?: "allow" | "block" | "escalate";
}

export interface ControlDecision {
  readonly requestId: string;
  readonly workspaceId: WorkspaceId;
  readonly agentId: string;
  readonly decision: Decision;
  readonly reason: ControlDecisionReason;
  readonly risk: RiskAssessment;
  readonly policy: PolicyResolution;
  readonly decidedAt: string;
}

export interface ControlSurface {
  evaluate(
    request: ControlRequest,
  ): ControlDecision;
}
