import {
  CompromiseSimulationEngine,
  CompromiseSimulationGraph,
  CompromiseSimulationEdge,
  CompromisePath,
  CompromiseSimulationRiskLevel,
} from "./compromise-simulation";

export type MitigationControlType =
  | "REMOVE_AUTHORITY_EDGE";

export interface MitigationCandidate {
  readonly controlId: string;
  readonly type: MitigationControlType;
  readonly targetEdgeId: string;
  readonly targetEdgeType: CompromiseSimulationEdge["type"];
  readonly from: string;
  readonly to: string;

  readonly beforeBlastRadius: number;
  readonly afterBlastRadius: number;
  readonly blastRadiusReduction: number;
  readonly blastRadiusReductionPercent: number;

  readonly beforeLevel: CompromiseSimulationRiskLevel;
  readonly afterLevel: CompromiseSimulationRiskLevel;

  readonly reachableResourceLoss: number;
  readonly sensitiveResourceLoss: number;
  readonly productionResourceLoss: number;
  readonly pathReduction: number;
  readonly criticalPathReduction: number;

  readonly securityGain: number;
  readonly businessImpact: number;
  readonly efficiencyScore: number;

  readonly affectedPaths: readonly CompromisePath[];
}

export interface AttackPathMitigationInput {
  readonly workspaceId: string;
  readonly agentId: string;
  readonly graph: CompromiseSimulationGraph;
  readonly maxCandidates?: number;
}

export interface AttackPathMitigationResult {
  readonly workspaceId: string;
  readonly agentId: string;

  readonly baseline: {
    readonly blastRadius: number;
    readonly level: CompromiseSimulationRiskLevel;
    readonly reachableResources: number;
    readonly sensitiveResources: number;
    readonly productionResources: number;
    readonly totalPaths: number;
    readonly criticalPaths: number;
  };

  readonly candidates: readonly MitigationCandidate[];
  readonly recommended: MitigationCandidate | null;
}

function cloneGraph(
  graph: CompromiseSimulationGraph,
): {
  nodes: CompromiseSimulationGraph["nodes"][number][];
  edges: CompromiseSimulationEdge[];
} {
  return {
    nodes: graph.nodes.map((node) => ({
      ...node,
      metadata: node.metadata ? { ...node.metadata } : undefined,
    })),
    edges: graph.edges.map((edge) => ({ ...edge })),
  };
}

function pathKey(path: CompromisePath): string {
  return `${path.nodeIds.join(">")}|${path.edgeIds.join(">")}`;
}

function edgePathSet(
  paths: readonly CompromisePath[],
): Set<string> {
  const set = new Set<string>();

  for (const path of paths) {
    for (const edgeId of path.edgeIds) {
      set.add(edgeId);
    }
  }

  return set;
}

function percentReduction(
  before: number,
  after: number,
): number {
  if (before <= 0) {
    return 0;
  }

  return Number(
    (((before - after) / before) * 100).toFixed(2),
  );
}

/**
 * Converts blast-radius reduction into a normalized security gain.
 *
 * The optimizer deliberately keeps this deterministic and explainable:
 * larger blast-radius reduction = larger security gain.
 */
function calculateSecurityGain(
  beforeBlastRadius: number,
  afterBlastRadius: number,
  criticalPathReduction: number,
  sensitiveResourceLoss: number,
): number {
  const blastReduction = Math.max(
    0,
    beforeBlastRadius - afterBlastRadius,
  );

  const criticalBonus = criticalPathReduction * 10;

  const sensitivePreservationBonus =
    sensitiveResourceLoss === 0 ? 8 : 0;

  return Math.max(
    0,
    blastReduction + criticalBonus + sensitivePreservationBonus,
  );
}

/**
 * Business impact is deliberately expressed as loss of reachable business
 * surface, with production and sensitive assets weighted more heavily.
 *
 * Lower is better.
 */
function calculateBusinessImpact(
  reachableResourceLoss: number,
  sensitiveResourceLoss: number,
  productionResourceLoss: number,
  pathReduction: number,
): number {
  return (
    reachableResourceLoss * 4 +
    sensitiveResourceLoss * 9 +
    productionResourceLoss * 8 +
    pathReduction
  );
}

/**
 * Higher is better.
 *
 * Security gain is divided by business impact + 1 so that zero-disruption
 * security improvements naturally rank first.
 */
function calculateEfficiencyScore(
  securityGain: number,
  businessImpact: number,
): number {
  return Number(
    (securityGain / (businessImpact + 1)).toFixed(4),
  );
}

function compareCandidates(
  a: MitigationCandidate,
  b: MitigationCandidate,
): number {
  if (b.efficiencyScore !== a.efficiencyScore) {
    return b.efficiencyScore - a.efficiencyScore;
  }

  if (b.blastRadiusReduction !== a.blastRadiusReduction) {
    return (
      b.blastRadiusReduction -
      a.blastRadiusReduction
    );
  }

  if (a.businessImpact !== b.businessImpact) {
    return a.businessImpact - b.businessImpact;
  }

  if (
    b.criticalPathReduction !==
    a.criticalPathReduction
  ) {
    return (
      b.criticalPathReduction -
      a.criticalPathReduction
    );
  }

  return a.targetEdgeId.localeCompare(b.targetEdgeId);
}

export class AttackPathMitigationEngine {
  private readonly simulator =
    new CompromiseSimulationEngine();

  public optimize(
    input: AttackPathMitigationInput,
  ): AttackPathMitigationResult {
    if (!input.workspaceId.trim()) {
      throw new Error("workspaceId is required");
    }

    if (!input.agentId.trim()) {
      throw new Error("agentId is required");
    }

    const maxCandidates =
      input.maxCandidates ?? 10;

    if (
      !Number.isInteger(maxCandidates) ||
      maxCandidates <= 0
    ) {
      throw new Error(
        "maxCandidates must be a positive integer",
      );
    }

    const source = cloneGraph(input.graph);

    for (const node of source.nodes) {
      if (node.workspaceId !== input.workspaceId) {
        continue;
      }
    }

    const baselineResult =
      this.simulator.simulate({
        workspaceId: input.workspaceId,
        agentId: input.agentId,
        graph: {
          nodes: source.nodes,
          edges: source.edges,
        },
      });

    const baseline = {
      blastRadius:
        baselineResult.before.impact.blastRadiusScore,
      level:
        baselineResult.before.impact.level,
      reachableResources:
        baselineResult.before.impact.reachableResources,
      sensitiveResources:
        baselineResult.before.impact.sensitiveResources,
      productionResources:
        baselineResult.before.impact.productionResources,
      totalPaths:
        baselineResult.before.impact.totalPaths,
      criticalPaths:
        baselineResult.before.impact.criticalPaths,
    };

    const relevantEdges =
      edgePathSet(
        baselineResult.before.exposure.paths,
      );

    const workspaceEdges =
      source.edges
        .filter(
          (edge) =>
            edge.workspaceId ===
              input.workspaceId &&
            relevantEdges.has(edge.id),
        )
        .sort((a, b) =>
          a.id.localeCompare(b.id),
        );

    const candidates: MitigationCandidate[] =
      [];

    for (const edge of workspaceEdges) {
      const affectedPaths =
        baselineResult.before.exposure.paths.filter(
          (path) =>
            path.edgeIds.includes(edge.id),
        );

      if (affectedPaths.length === 0) {
        continue;
      }

      const candidateGraph = cloneGraph({
        nodes: source.nodes,
        edges: source.edges,
      });

      candidateGraph.edges =
        candidateGraph.edges.filter(
          (candidateEdge) =>
            candidateEdge.id !== edge.id,
        );

      const afterResult =
        this.simulator.simulate({
          workspaceId: input.workspaceId,
          agentId: input.agentId,
          graph: {
            nodes: candidateGraph.nodes,
            edges: candidateGraph.edges,
          },
        });

      const after =
        afterResult.after.impact;

      const reachableResourceLoss =
        Math.max(
          0,
          baseline.reachableResources -
            after.reachableResources,
        );

      const sensitiveResourceLoss =
        Math.max(
          0,
          baseline.sensitiveResources -
            after.sensitiveResources,
        );

      const productionResourceLoss =
        Math.max(
          0,
          baseline.productionResources -
            after.productionResources,
        );

      const pathReduction =
        Math.max(
          0,
          baseline.totalPaths -
            after.totalPaths,
        );

      const criticalPathReduction =
        Math.max(
          0,
          baseline.criticalPaths -
            after.criticalPaths,
        );

      const securityGain =
        calculateSecurityGain(
          baseline.blastRadius,
          after.blastRadiusScore,
          criticalPathReduction,
          sensitiveResourceLoss,
        );

      const businessImpact =
        calculateBusinessImpact(
          reachableResourceLoss,
          sensitiveResourceLoss,
          productionResourceLoss,
          pathReduction,
        );

      const efficiencyScore =
        calculateEfficiencyScore(
          securityGain,
          businessImpact,
        );

      candidates.push({
        controlId:
          `remove-edge:${edge.id}`,
        type: "REMOVE_AUTHORITY_EDGE",
        targetEdgeId: edge.id,
        targetEdgeType: edge.type,
        from: edge.from,
        to: edge.to,

        beforeBlastRadius:
          baseline.blastRadius,
        afterBlastRadius:
          after.blastRadiusScore,
        blastRadiusReduction:
          Math.max(
            0,
            baseline.blastRadius -
              after.blastRadiusScore,
          ),
        blastRadiusReductionPercent:
          percentReduction(
            baseline.blastRadius,
            after.blastRadiusScore,
          ),

        beforeLevel:
          baseline.level,
        afterLevel:
          after.level,

        reachableResourceLoss,
        sensitiveResourceLoss,
        productionResourceLoss,
        pathReduction,
        criticalPathReduction,

        securityGain,
        businessImpact,
        efficiencyScore,

        affectedPaths: [...affectedPaths]
          .sort((a, b) =>
            pathKey(a).localeCompare(
              pathKey(b),
            ),
          ),
      });
    }

    candidates.sort(compareCandidates);

    return {
      workspaceId: input.workspaceId,
      agentId: input.agentId,
      baseline,
      candidates: candidates.slice(
        0,
        maxCandidates,
      ),
      recommended:
        candidates.length > 0
          ? candidates[0]
          : null,
    };
  }
}

