import type { WorkspaceId } from "../access";

export type RiskLevel =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type DetectionSeverity =
  | "low"
  | "medium"
  | "high"
  | "critical";

export type DetectionType =
  | "prompt_injection"
  | "destructive_action"
  | "privilege_escalation"
  | "sensitive_data"
  | "data_exfiltration"
  | "suspicious_network"
  | "unknown_tool"
  | "anomalous_behavior";

export type RiskSignalId = string & {
  readonly __brand: "AegisoraRiskSignalId";
};

export type RiskAssessmentId = string & {
  readonly __brand: "AegisoraRiskAssessmentId";
};

export interface DetectionSignal {
  readonly id: RiskSignalId;
  readonly type: DetectionType;
  readonly severity: DetectionSeverity;
  readonly score: number;
  readonly confidence: number;
  readonly reason: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface RiskRequest {
  readonly workspaceId: WorkspaceId;
  readonly agentId: string;
  readonly action: string;
  readonly payload?: unknown;
  readonly environment?:
    | "production"
    | "staging"
    | "development"
    | "restricted";
  readonly declaredTool?: boolean;
  readonly historyRiskScore?: number;
}

export interface RiskAssessment {
  readonly id: RiskAssessmentId;
  readonly workspaceId: WorkspaceId;
  readonly agentId: string;
  readonly action: string;
  readonly score: number;
  readonly level: RiskLevel;
  readonly recommendedDecision:
    | "ALLOW"
    | "BLOCK"
    | "ESCALATE";
  readonly signals: readonly DetectionSignal[];
  readonly evaluatedAt: string;
}

export interface DetectionEngine {
  detect(
    request: RiskRequest,
  ): readonly DetectionSignal[];
}

export interface RiskEngine {
  assess(
    request: RiskRequest,
  ): RiskAssessment;
}

export function riskAssessmentId(
  value: string,
): RiskAssessmentId {

  const normalized = value.trim();

  if (!normalized) {
    throw new Error(
      "riskAssessmentId must not be empty",
    );
  }

  return normalized as RiskAssessmentId;
}

export function riskSignalId(
  value: string,
): RiskSignalId {

  const normalized = value.trim();

  if (!normalized) {
    throw new Error(
      "riskSignalId must not be empty",
    );
  }

  return normalized as RiskSignalId;
}
