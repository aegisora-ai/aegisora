import {
  AuthorityDriftResult,
  AuthorityDriftSeverity,
} from "./authority-drift";

export type ContainmentActionType =
  | "MONITOR"
  | "REQUIRE_APPROVAL"
  | "BLOCK_EXECUTION"
  | "RESTRICT_AUTHORITY"
  | "SUSPEND_AGENT";

export type ContainmentMode =
  | "NO_ACTION"
  | "ADVISORY"
  | "ENFORCE";

export interface ContainmentAction {
  readonly type: ContainmentActionType;
  readonly priority: number;
  readonly reason: string;
  readonly mode: ContainmentMode;
  readonly reversible: boolean;
}

export interface ContainmentDecision {
  readonly action: ContainmentAction;
  readonly severity: AuthorityDriftSeverity;
  readonly driftScore: number;
  readonly currentBlastRadius: number;
  readonly observedBlastRadius: number;
  readonly blastRadiusIncrease: number;
  readonly targetAgentId: string;
  readonly rationale: readonly string[];
}

export interface AutonomousContainmentInput {
  readonly drift: AuthorityDriftResult;
  readonly mode?: ContainmentMode;
  readonly minimumSeverity?: AuthorityDriftSeverity;
}

export interface AutonomousContainmentResult {
  readonly workspaceId: string;
  readonly agentId: string;
  readonly decision: ContainmentDecision;
  readonly eligibleActions: readonly ContainmentAction[];
}

const severityRank: Record<AuthorityDriftSeverity, number> = {
  NONE: 0,
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
};

function minimumSeverityRank(
  severity: AuthorityDriftSeverity,
): number {
  return severityRank[severity];
}

function actionForSeverity(
  severity: AuthorityDriftSeverity,
): ContainmentAction {
  switch (severity) {
    case "CRITICAL":
      return {
        type: "SUSPEND_AGENT",
        priority: 100,
        reason:
          "Critical authority drift can expose sensitive production resources.",
        mode: "ENFORCE",
        reversible: true,
      };

    case "HIGH":
      return {
        type: "BLOCK_EXECUTION",
        priority: 80,
        reason:
          "High-severity authority drift creates material security exposure.",
        mode: "ENFORCE",
        reversible: true,
      };

    case "MEDIUM":
      return {
        type: "REQUIRE_APPROVAL",
        priority: 60,
        reason:
          "Medium-severity authority drift requires human authorization before continued execution.",
        mode: "ENFORCE",
        reversible: true,
      };

    case "LOW":
      return {
        type: "MONITOR",
        priority: 20,
        reason:
          "Low-severity authority drift should be observed without disrupting the agent.",
        mode: "ADVISORY",
        reversible: true,
      };

    case "NONE":
      return {
        type: "MONITOR",
        priority: 0,
        reason:
          "Observed authority matches the approved authority baseline.",
        mode: "NO_ACTION",
        reversible: true,
      };
  }
}

function eligibleActionsForSeverity(
  severity: AuthorityDriftSeverity,
): ContainmentAction[] {
  switch (severity) {
    case "CRITICAL":
      return [
        {
          type: "SUSPEND_AGENT",
          priority: 100,
          reason:
            "Immediate containment for critical authority drift.",
          mode: "ENFORCE",
          reversible: true,
        },
        {
          type: "RESTRICT_AUTHORITY",
          priority: 90,
          reason:
            "Reduce effective authority while preserving controlled operation.",
          mode: "ENFORCE",
          reversible: true,
        },
        {
          type: "BLOCK_EXECUTION",
          priority: 80,
          reason:
            "Prevent further execution while containment is evaluated.",
          mode: "ENFORCE",
          reversible: true,
        },
      ];

    case "HIGH":
      return [
        {
          type: "BLOCK_EXECUTION",
          priority: 80,
          reason:
            "Stop execution while high-severity drift is investigated.",
          mode: "ENFORCE",
          reversible: true,
        },
        {
          type: "RESTRICT_AUTHORITY",
          priority: 70,
          reason:
            "Narrow the authority envelope instead of fully suspending the agent.",
          mode: "ENFORCE",
          reversible: true,
        },
        {
          type: "REQUIRE_APPROVAL",
          priority: 60,
          reason:
            "Require explicit human approval for continued execution.",
          mode: "ENFORCE",
          reversible: true,
        },
      ];

    case "MEDIUM":
      return [
        {
          type: "REQUIRE_APPROVAL",
          priority: 60,
          reason:
            "Human approval is required before the agent continues.",
          mode: "ENFORCE",
          reversible: true,
        },
        {
          type: "RESTRICT_AUTHORITY",
          priority: 50,
          reason:
            "Temporarily narrow the authority envelope.",
          mode: "ENFORCE",
          reversible: true,
        },
        {
          type: "MONITOR",
          priority: 20,
          reason:
            "Continue with enhanced observation.",
          mode: "ADVISORY",
          reversible: true,
        },
      ];

    case "LOW":
      return [
        {
          type: "MONITOR",
          priority: 20,
          reason:
            "Observe low-impact drift without disrupting execution.",
          mode: "ADVISORY",
          reversible: true,
        },
      ];

    case "NONE":
      return [
        {
          type: "MONITOR",
          priority: 0,
          reason:
            "No containment is required.",
          mode: "NO_ACTION",
          reversible: true,
        },
      ];
  }
}

function rationaleFor(
  drift: AuthorityDriftResult,
): string[] {
  const rationale: string[] = [];

  rationale.push(
    `Drift severity: ${drift.impact.severity}.`,
  );

  rationale.push(
    `Drift score: ${drift.impact.driftScore}/100.`,
  );

  if (
    drift.impact.newReachableResources.length > 0
  ) {
    rationale.push(
      `${drift.impact.newReachableResources.length} new reachable resource(s) detected.`,
    );
  }

  if (
    drift.impact.newSensitiveResources.length > 0
  ) {
    rationale.push(
      `${drift.impact.newSensitiveResources.length} new sensitive resource(s) detected.`,
    );
  }

  if (
    drift.impact.newProductionResources.length > 0
  ) {
    rationale.push(
      `${drift.impact.newProductionResources.length} new production resource(s) detected.`,
    );
  }

  if (
    drift.impact.newCriticalPaths.length > 0
  ) {
    rationale.push(
      `${drift.impact.newCriticalPaths.length} new critical authority path(s) detected.`,
    );
  }

  if (
    drift.impact.pathDelta > 0
  ) {
    rationale.push(
      `${drift.impact.pathDelta} additional authority path(s) observed.`,
    );
  }

  if (
    drift.observed.blastRadius >
    drift.approved.blastRadius
  ) {
    rationale.push(
      `Blast radius increased from ${drift.approved.blastRadius} to ${drift.observed.blastRadius}.`,
    );
  }

  return rationale;
}

export class AutonomousContainmentEngine {
  public decide(
    input: AutonomousContainmentInput,
  ): AutonomousContainmentResult {
    const drift = input.drift;

    if (!drift.workspaceId.trim()) {
      throw new Error("workspaceId is required");
    }

    if (!drift.agentId.trim()) {
      throw new Error("agentId is required");
    }

    const mode =
      input.mode ?? "ENFORCE";

    const minimumSeverity =
      input.minimumSeverity ?? "NONE";

    if (
      severityRank[drift.impact.severity] <
      minimumSeverityRank(minimumSeverity)
    ) {
      const action: ContainmentAction = {
        type: "MONITOR",
        priority: 0,
        reason:
          "Observed severity is below the configured containment threshold.",
        mode: "NO_ACTION",
        reversible: true,
      };

      return {
        workspaceId: drift.workspaceId,
        agentId: drift.agentId,
        decision: {
          action,
          severity: drift.impact.severity,
          driftScore: drift.impact.driftScore,
          currentBlastRadius:
            drift.approved.blastRadius,
          observedBlastRadius:
            drift.observed.blastRadius,
          blastRadiusIncrease:
            Math.max(
              0,
              drift.observed.blastRadius -
                drift.approved.blastRadius,
            ),
          targetAgentId: drift.agentId,
          rationale: [
            `Severity threshold ${minimumSeverity} was not reached.`,
          ],
        },
        eligibleActions: [action],
      };
    }

    const selected =
      actionForSeverity(
        drift.impact.severity,
      );

    const selectedAction: ContainmentAction =
      mode === "ADVISORY"
        ? {
            ...selected,
            mode: "ADVISORY",
          }
        : mode === "NO_ACTION"
          ? {
              type: "MONITOR",
              priority: 0,
              reason:
                "Containment decision requested in no-action mode.",
              mode: "NO_ACTION",
              reversible: true,
            }
          : selected;

    const eligible: ContainmentAction[] =
      eligibleActionsForSeverity(
        drift.impact.severity,
      ).map((action): ContainmentAction => {
        if (mode === "ADVISORY") {
          return {
            ...action,
            mode: "ADVISORY",
          };
        }

        if (mode === "NO_ACTION") {
          return {
            ...action,
            mode: "NO_ACTION",
          };
        }

        return action;
      });

    return {
      workspaceId: drift.workspaceId,
      agentId: drift.agentId,
      decision: {
        action: selectedAction,
        severity: drift.impact.severity,
        driftScore: drift.impact.driftScore,
        currentBlastRadius:
          drift.approved.blastRadius,
        observedBlastRadius:
          drift.observed.blastRadius,
        blastRadiusIncrease:
          Math.max(
            0,
            drift.observed.blastRadius -
              drift.approved.blastRadius,
          ),
        targetAgentId: drift.agentId,
        rationale: rationaleFor(drift),
      },
      eligibleActions: eligible,
    };
  }
}

