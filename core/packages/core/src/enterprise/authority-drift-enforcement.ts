import {
  AuthorityDriftAction,
  AuthorityDriftResult,
  AuthorityDriftSeverity,
} from "./authority-drift";

export interface AuthorityDriftEnforcementDecision {
  readonly workspaceId: string;
  readonly agentId: string;
  readonly severity: AuthorityDriftSeverity;
  readonly action: AuthorityDriftAction;

  readonly executionAllowed: boolean;
  readonly requiresApproval: boolean;
  readonly containmentRequired: boolean;

  readonly driftScore: number;
  readonly newReachableResources: readonly string[];
  readonly newSensitiveResources: readonly string[];
  readonly newProductionResources: readonly string[];
  readonly newCriticalPaths: number;

  readonly reason: string;
}

function reasonFor(
  severity: AuthorityDriftSeverity,
): string {
  switch (severity) {
    case "NONE":
      return "No authority drift detected.";

    case "LOW":
      return "Low-impact authority drift detected; monitoring is sufficient.";

    case "MEDIUM":
      return "Moderate authority drift detected; execution requires human approval.";

    case "HIGH":
      return "High-impact authority drift detected; execution must be blocked.";

    case "CRITICAL":
      return "Critical authority drift detected; execution must be contained.";
  }
}

export class AuthorityDriftEnforcementEngine {
  public decide(
    result: AuthorityDriftResult,
  ): AuthorityDriftEnforcementDecision {
    const {
      impact,
      workspaceId,
      agentId,
    } = result;

    const severity = impact.severity;
    const action = impact.recommendedAction;

    const executionAllowed =
      severity === "NONE" ||
      severity === "LOW";

    const requiresApproval =
      severity === "MEDIUM";

    const containmentRequired =
      severity === "CRITICAL";

    return {
      workspaceId,
      agentId,
      severity,
      action,

      executionAllowed,
      requiresApproval,
      containmentRequired,

      driftScore: impact.driftScore,

      newReachableResources:
        [...impact.newReachableResources],

      newSensitiveResources:
        [...impact.newSensitiveResources],

      newProductionResources:
        [...impact.newProductionResources],

      newCriticalPaths:
        impact.newCriticalPaths.length,

      reason: reasonFor(severity),
    };
  }
}