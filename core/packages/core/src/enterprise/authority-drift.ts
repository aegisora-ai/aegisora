import {
  CompromisePath,
  CompromiseSimulationEngine,
  CompromiseSimulationGraph,
  CompromiseSimulationRiskLevel,
} from "./compromise-simulation";

export type AuthorityDriftSeverity =
  | "NONE"
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export type AuthorityDriftAction =
  | "MONITOR"
  | "ESCALATE"
  | "BLOCK"
  | "CONTAIN";

export interface AuthorityDriftPathChange {
  readonly path: CompromisePath;
  readonly reason:
    | "NEW_REACHABLE_RESOURCE"
    | "NEW_SENSITIVE_RESOURCE"
    | "NEW_PRODUCTION_RESOURCE"
    | "NEW_CRITICAL_PATH";
  readonly severity: AuthorityDriftSeverity;
}

export interface AuthorityDriftInput {
  readonly workspaceId: string;
  readonly agentId: string;
  readonly approvedGraph: CompromiseSimulationGraph;
  readonly observedGraph: CompromiseSimulationGraph;
}

export interface AuthorityDriftImpact {
  readonly newReachableResources: readonly string[];
  readonly newSensitiveResources: readonly string[];
  readonly newProductionResources: readonly string[];
  readonly newPaths: readonly CompromisePath[];
  readonly newCriticalPaths: readonly CompromisePath[];

  readonly reachableResourceDelta: number;
  readonly sensitiveResourceDelta: number;
  readonly productionResourceDelta: number;
  readonly pathDelta: number;
  readonly criticalPathDelta: number;

  readonly driftScore: number;
  readonly severity: AuthorityDriftSeverity;
  readonly recommendedAction: AuthorityDriftAction;
}

export interface AuthorityDriftResult {
  readonly workspaceId: string;
  readonly agentId: string;

  readonly approved: {
    readonly blastRadius: number;
    readonly level: CompromiseSimulationRiskLevel;
    readonly reachableResources: number;
    readonly sensitiveResources: number;
    readonly productionResources: number;
    readonly totalPaths: number;
    readonly criticalPaths: number;
  };

  readonly observed: {
    readonly blastRadius: number;
    readonly level: CompromiseSimulationRiskLevel;
    readonly reachableResources: number;
    readonly sensitiveResources: number;
    readonly productionResources: number;
    readonly totalPaths: number;
    readonly criticalPaths: number;
  };

  readonly pathChanges: readonly AuthorityDriftPathChange[];
  readonly impact: AuthorityDriftImpact;
}

function pathKey(path: CompromisePath): string {
  return `${path.nodeIds.join(">")}|${path.edgeIds.join(">")}`;
}

function sortPaths(
  paths: readonly CompromisePath[],
): CompromisePath[] {
  return [...paths].sort((a, b) =>
    pathKey(a).localeCompare(pathKey(b)),
  );
}

function difference(
  observed: readonly string[],
  approved: readonly string[],
): string[] {
  const approvedSet = new Set(approved);

  return [...observed]
    .filter((id) => !approvedSet.has(id))
    .sort();
}

function calculateDriftScore(input: {
  readonly newReachableResources: number;
  readonly newSensitiveResources: number;
  readonly newProductionResources: number;
  readonly newPaths: number;
  readonly newCriticalPaths: number;
}): number {
  const score =
    input.newReachableResources * 8 +
    input.newSensitiveResources * 18 +
    input.newProductionResources * 20 +
    input.newPaths * 4 +
    input.newCriticalPaths * 24;

  return Math.min(100, score);
}

function severityFor(
  score: number,
  newSensitiveResources: number,
  newProductionResources: number,
  newCriticalPaths: number,
): AuthorityDriftSeverity {
  if (
    newCriticalPaths >= 2 ||
    (newSensitiveResources >= 2 &&
      newProductionResources >= 2)
  ) {
    return "CRITICAL";
  }

  if (
    newCriticalPaths >= 1 ||
    newSensitiveResources >= 1 ||
    newProductionResources >= 2 ||
    score >= 60
  ) {
    return "HIGH";
  }

  if (score >= 25) {
    return "MEDIUM";
  }

  if (score > 0) {
    return "LOW";
  }

  return "NONE";
}

function actionFor(
  severity: AuthorityDriftSeverity,
): AuthorityDriftAction {
  switch (severity) {
    case "CRITICAL":
      return "CONTAIN";
    case "HIGH":
      return "BLOCK";
    case "MEDIUM":
      return "ESCALATE";
    case "LOW":
      return "MONITOR";
    case "NONE":
      return "MONITOR";
  }
}

function pathSeverity(
  reason:
    | "NEW_REACHABLE_RESOURCE"
    | "NEW_SENSITIVE_RESOURCE"
    | "NEW_PRODUCTION_RESOURCE"
    | "NEW_CRITICAL_PATH",
): AuthorityDriftSeverity {
  switch (reason) {
    case "NEW_CRITICAL_PATH":
      return "CRITICAL";
    case "NEW_SENSITIVE_RESOURCE":
      return "HIGH";
    case "NEW_PRODUCTION_RESOURCE":
      return "HIGH";
    case "NEW_REACHABLE_RESOURCE":
      return "LOW";
  }
}

function classifyPath(
  path: CompromisePath,
  observedSensitive: ReadonlySet<string>,
  observedProduction: ReadonlySet<string>,
): AuthorityDriftPathChange {
  const resourceId =
    path.nodeIds[path.nodeIds.length - 1];

  if (
    observedSensitive.has(resourceId) &&
    observedProduction.has(resourceId)
  ) {
    return {
      path,
      reason: "NEW_CRITICAL_PATH",
      severity: "CRITICAL",
    };
  }

  if (observedSensitive.has(resourceId)) {
    return {
      path,
      reason: "NEW_SENSITIVE_RESOURCE",
      severity: "HIGH",
    };
  }

  if (observedProduction.has(resourceId)) {
    return {
      path,
      reason: "NEW_PRODUCTION_RESOURCE",
      severity: "HIGH",
    };
  }

  return {
    path,
    reason: "NEW_REACHABLE_RESOURCE",
    severity: "LOW",
  };
}

export class AuthorityDriftEngine {
  private readonly simulator =
    new CompromiseSimulationEngine();

  public detect(
    input: AuthorityDriftInput,
  ): AuthorityDriftResult {
    if (!input.workspaceId.trim()) {
      throw new Error("workspaceId is required");
    }

    if (!input.agentId.trim()) {
      throw new Error("agentId is required");
    }

    const approved =
      this.simulator.simulate({
        workspaceId: input.workspaceId,
        agentId: input.agentId,
        graph: input.approvedGraph,
      });

    const observed =
      this.simulator.simulate({
        workspaceId: input.workspaceId,
        agentId: input.agentId,
        graph: input.observedGraph,
      });

    const newReachableResources =
      difference(
        observed.after.exposure.reachableResources,
        approved.before.exposure.reachableResources,
      );

    const newSensitiveResources =
      difference(
        observed.after.exposure.sensitiveResources,
        approved.before.exposure.sensitiveResources,
      );

    const newProductionResources =
      difference(
        observed.after.exposure.productionResources,
        approved.before.exposure.productionResources,
      );

    const approvedPathKeys = new Set(
      approved.before.exposure.paths.map(pathKey),
    );

    const newPaths =
      observed.after.exposure.paths.filter(
        (path) => !approvedPathKeys.has(pathKey(path)),
      );

    const observedSensitive =
      new Set(
        observed.after.exposure.sensitiveResources,
      );

    const observedProduction =
      new Set(
        observed.after.exposure.productionResources,
      );

    const newCriticalPaths =
      newPaths.filter((path) => {
        const resourceId =
          path.nodeIds[path.nodeIds.length - 1];

        return (
          observedSensitive.has(resourceId) &&
          observedProduction.has(resourceId)
        );
      });

    const pathChanges =
      sortPaths(newPaths).map((path) =>
        classifyPath(
          path,
          observedSensitive,
          observedProduction,
        ),
      );

    const driftScore =
      calculateDriftScore({
        newReachableResources:
          newReachableResources.length,
        newSensitiveResources:
          newSensitiveResources.length,
        newProductionResources:
          newProductionResources.length,
        newPaths: newPaths.length,
        newCriticalPaths:
          newCriticalPaths.length,
      });

    const severity =
      severityFor(
        driftScore,
        newSensitiveResources.length,
        newProductionResources.length,
        newCriticalPaths.length,
      );

    return {
      workspaceId: input.workspaceId,
      agentId: input.agentId,

      approved: {
        blastRadius:
          approved.before.impact.blastRadiusScore,
        level:
          approved.before.impact.level,
        reachableResources:
          approved.before.impact.reachableResources,
        sensitiveResources:
          approved.before.impact.sensitiveResources,
        productionResources:
          approved.before.impact.productionResources,
        totalPaths:
          approved.before.impact.totalPaths,
        criticalPaths:
          approved.before.impact.criticalPaths,
      },

      observed: {
        blastRadius:
          observed.after.impact.blastRadiusScore,
        level:
          observed.after.impact.level,
        reachableResources:
          observed.after.impact.reachableResources,
        sensitiveResources:
          observed.after.impact.sensitiveResources,
        productionResources:
          observed.after.impact.productionResources,
        totalPaths:
          observed.after.impact.totalPaths,
        criticalPaths:
          observed.after.impact.criticalPaths,
      },

      pathChanges,

      impact: {
        newReachableResources,
        newSensitiveResources,
        newProductionResources,
        newPaths: sortPaths(newPaths),
        newCriticalPaths: sortPaths(newCriticalPaths),

        reachableResourceDelta:
          observed.after.impact.reachableResources -
          approved.before.impact.reachableResources,

        sensitiveResourceDelta:
          observed.after.impact.sensitiveResources -
          approved.before.impact.sensitiveResources,

        productionResourceDelta:
          observed.after.impact.productionResources -
          approved.before.impact.productionResources,

        pathDelta:
          observed.after.impact.totalPaths -
          approved.before.impact.totalPaths,

        criticalPathDelta:
          observed.after.impact.criticalPaths -
          approved.before.impact.criticalPaths,

        driftScore,
        severity,
        recommendedAction:
          actionFor(severity),
      },
    };
  }
}
