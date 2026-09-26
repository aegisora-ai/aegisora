import type { WorkspaceId } from "../access";
import type { AgentId } from "../agents";
import type {
  PolicyId,
  PolicyVersionId,
} from "../policies";
import type {
  RiskAssessmentId,
  RiskLevel,
} from "../risk";

export type ControlPlaneDecision =
  | "ALLOW"
  | "BLOCK"
  | "ESCALATE";

export type ControlPlaneReasonCode =
  | string;

export type CanonicalApprovalState =
  | "not_required"
  | "pending"
  | "approved"
  | "rejected"
  | "expired"
  | "consumed";

export type CanonicalExecutionStatus =
  | "pending"
  | "running"
  | "completed"
  | "failed"
  | "cancelled"
  | "blocked"
  | "escalated";

export type CanonicalEffectOutcome =
  | "NOT_ATTEMPTED"
  | "OBSERVED"
  | "FAILED"
  | "UNKNOWN";

export type CanonicalIncidentState =
  | "open"
  | "contained"
  | "resolved";

export interface CanonicalExecutionIntent {
  readonly workspaceId: WorkspaceId;
  readonly agentId: AgentId;

  readonly requestId: string;
  readonly correlationId: string;

  readonly action: string;
  readonly resource: string;

  readonly tool?: string;
  readonly provider?: string;
  readonly route?: string;

  readonly input: unknown;

  readonly requestedAt: string;
}

export interface CanonicalAuthorityReference {
  readonly workspaceId: WorkspaceId;
  readonly agentId: AgentId;

  readonly capability: string;

  readonly fingerprint: string;

  readonly resolvedAt: string;

  readonly tool?: string;
  readonly provider?: string;
  readonly model?: string;
  readonly route?: string;

  readonly delegationChain?: readonly string[];
}

export interface CanonicalPolicyReference {
  readonly workspaceId: WorkspaceId;

  readonly policyId: PolicyId;
  readonly versionId: PolicyVersionId;

  readonly version: number;

  readonly digest: string;
}

export interface CanonicalRiskReference {
  readonly assessmentId: RiskAssessmentId;

  readonly score: number;
  readonly level: RiskLevel;

  readonly evaluatedAt: string;
}

export interface CanonicalDecision {
  readonly decisionId: string;

  readonly requestId: string;
  readonly correlationId: string;

  readonly workspaceId: WorkspaceId;
  readonly agentId: AgentId;

  readonly decision: ControlPlaneDecision;

  readonly reasonCode: ControlPlaneReasonCode;

  readonly risk: CanonicalRiskReference;

  readonly policy: CanonicalPolicyReference;

  readonly authority: CanonicalAuthorityReference;

  readonly evaluatedAt: string;
}

export interface CanonicalApprovalBinding {
  readonly approvalId: string;

  readonly requestId: string;
  readonly decisionId: string;

  readonly workspaceId: WorkspaceId;
  readonly agentId: AgentId;

  readonly policyVersionId: PolicyVersionId;
  readonly authorityFingerprint: string;

  readonly state: CanonicalApprovalState;

  readonly expiresAt: string;

  readonly approverId?: string;

  readonly resolvedAt?: string;
}

export interface CanonicalContinuityBinding {
  readonly sealId: string;
  readonly sealHash: string;

  readonly executionId: string;

  readonly version: "1";
}

export interface CanonicalExecution {
  readonly executionId: string;

  readonly requestId: string;
  readonly decisionId: string;

  readonly workspaceId: WorkspaceId;
  readonly agentId: AgentId;

  readonly action: string;
  readonly resource: string;

  readonly tool?: string;
  readonly provider?: string;
  readonly route?: string;

  readonly continuitySealId: string;

  readonly status: CanonicalExecutionStatus;

  readonly startedAt: string;
  readonly completedAt?: string;
}

export interface CanonicalEffect {
  readonly executionId: string;

  readonly outcome: CanonicalEffectOutcome;

  readonly observedAt: string;

  readonly upstreamReference?: string;

  readonly metadata?: Readonly<Record<string, unknown>>;
}

export interface CanonicalEvidenceReference {
  readonly evidenceId: string;

  readonly requestId: string;
  readonly correlationId: string;

  readonly decisionId: string;
  readonly executionId: string;

  readonly workspaceId: WorkspaceId;
  readonly agentId: AgentId;

  readonly policyVersionId: PolicyVersionId;
  readonly authorityFingerprint: string;

  readonly continuitySealId?: string;

  readonly createdAt: string;
}

export interface CanonicalIncidentReference {
  readonly incidentId: string;

  readonly workspaceId: WorkspaceId;
  readonly agentId: AgentId;

  readonly executionId?: string;
  readonly decisionId?: string;
  readonly evidenceId?: string;

  readonly state: CanonicalIncidentState;

  readonly createdAt: string;
  readonly resolvedAt?: string;
}

export interface CanonicalExecutionGraph {
  readonly intent: CanonicalExecutionIntent;

  readonly authority: CanonicalAuthorityReference;

  readonly policy: CanonicalPolicyReference;

  readonly risk: CanonicalRiskReference;

  readonly decision: CanonicalDecision;

  readonly approval?: CanonicalApprovalBinding;

  readonly continuity?: CanonicalContinuityBinding;

  readonly execution?: CanonicalExecution;

  readonly effect?: CanonicalEffect;

  readonly evidence?: CanonicalEvidenceReference;

  readonly incident?: CanonicalIncidentReference;
}