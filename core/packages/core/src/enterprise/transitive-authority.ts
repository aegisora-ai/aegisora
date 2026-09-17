import {
  CompromisePath,
  CompromiseSimulationGraph,
  CompromiseSimulationEdge,
  CompromiseSimulationEngine,
  CompromiseSimulationRiskLevel,
} from "./compromise-simulation";

export interface TransitiveAuthorityHop {
  readonly fromAgentId: string;
  readonly toAgentId: string;
  readonly edgeId: string;
  readonly depth: number;
}

export interface TransitiveAuthorityPath {
  readonly agentIds: readonly string[];
  readonly edgeIds: readonly string[];
  readonly authorityPath: CompromisePath;
}

export interface TransitiveAuthorityResult {
  readonly workspaceId: string;
  readonly sourceAgentId: string;

  readonly directlyReachableAgentIds: readonly string[];
  readonly transitivelyReachableAgentIds: readonly string[];
  readonly delegationHops: readonly TransitiveAuthorityHop[];

  readonly delegationDepth: number;
  readonly transitivePaths: readonly TransitiveAuthorityPath[];

  readonly reachableResources: readonly string[];
  readonly sensitiveResources: readonly string[];
  readonly productionResources: readonly string[];

  readonly blastRadiusScore: number;
  readonly riskLevel: CompromiseSimulationRiskLevel;

  readonly directBlastRadiusScore: number;
  readonly transitiveBlastRadiusIncrease: number;
}

function edgeKey(edge: CompromiseSimulationEdge): string {
  return `${edge.from}>${edge.to}|${edge.id}`;
}

function pathKey(path: TransitiveAuthorityPath): string {
  return `${path.agentIds.join(">")}|${path.edgeIds.join(">")}|${path.authorityPath.nodeIds.join(">")}`;
}

function sortStrings(values: readonly string[]): string[] {
  return [...values].sort((a, b) =>
    a.localeCompare(b),
  );
}

function sortPaths(
  paths: readonly TransitiveAuthorityPath[],
): TransitiveAuthorityPath[] {
  return [...paths].sort((a, b) =>
    pathKey(a).localeCompare(pathKey(b)),
  );
}

function scoreFor(
  reachableResources: number,
  sensitiveResources: number,
  productionResources: number,
  delegationDepth: number,
): number {
  return Math.min(
    100,
    reachableResources * 7 +
      sensitiveResources * 14 +
      productionResources * 16 +
      delegationDepth * 6,
  );
}

function riskLevelFor(
  score: number,
  sensitiveResources: number,
  productionResources: number,
): CompromiseSimulationRiskLevel {
  if (
    sensitiveResources >= 3 &&
    productionResources >= 2
  ) {
    return "CRITICAL";
  }

  if (
    (sensitiveResources >= 1 &&
      productionResources >= 1) ||
    sensitiveResources >= 2 ||
    productionResources >= 2 ||
    score >= 70
  ) {
    return "HIGH";
  }

  if (
    sensitiveResources >= 1 ||
    productionResources >= 1 ||
    score >= 25
  ) {
    return "MEDIUM";
  }

  return "LOW";
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
      metadata: node.metadata
        ? { ...node.metadata }
        : undefined,
    })),
    edges: graph.edges.map((edge) => ({
      ...edge,
    })),
  };
}

export class TransitiveAuthorityEngine {
  private readonly simulator =
    new CompromiseSimulationEngine();

  public analyze(input: {
    workspaceId: string;
    sourceAgentId: string;
    graph: CompromiseSimulationGraph;
    maxDelegationDepth?: number;
  }): TransitiveAuthorityResult {
    if (!input.workspaceId.trim()) {
      throw new Error("workspaceId is required");
    }

    if (!input.sourceAgentId.trim()) {
      throw new Error("sourceAgentId is required");
    }

    const maxDepth =
      input.maxDelegationDepth ?? 8;

    if (
      !Number.isInteger(maxDepth) ||
      maxDepth <= 0
    ) {
      throw new Error(
        "maxDelegationDepth must be a positive integer",
      );
    }

    const source = cloneGraph(input.graph);

    for (const edge of source.edges) {
      if (
        edge.workspaceId !==
        input.workspaceId
      ) {
        continue;
      }

      const from =
        source.nodes.find(
          (node) =>
            node.id === edge.from,
        );

      const to =
        source.nodes.find(
          (node) =>
            node.id === edge.to,
        );

      if (!from || !to) {
        throw new Error(
          "authority edge references unknown node",
        );
      }

      if (
        from.workspaceId !==
          input.workspaceId ||
        to.workspaceId !==
          input.workspaceId
      ) {
        throw new Error(
          "cross-workspace edge detected",
        );
      }
    }

    const sourceNodeId =
      `agent:${input.sourceAgentId}`;

    const sourceAgent =
      source.nodes.find(
        (node) =>
          node.id === sourceNodeId &&
          node.type === "agent",
      );

    if (!sourceAgent) {
      throw new Error(
        `agent ${input.sourceAgentId} not found`,
      );
    }

    const directEdges =
      source.edges
        .filter(
          (edge) =>
            edge.workspaceId ===
              input.workspaceId &&
            edge.type ===
              "DELEGATES_TO" &&
            edge.from ===
              sourceNodeId,
        )
        .sort((a, b) =>
          edgeKey(a).localeCompare(
            edgeKey(b),
          ),
        );

    const directlyReachableAgentIds =
      sortStrings(
        directEdges
          .map((edge) => edge.to)
          .filter((nodeId) =>
            source.nodes.some(
              (node) =>
                node.id === nodeId &&
                node.type === "agent",
            ),
          )
          .map((nodeId) =>
            nodeId.replace(/^agent:/, ""),
          ),
      );

    const delegationHops: TransitiveAuthorityHop[] =
      [];

    const transitiveAgentIds =
      new Set<string>();

    const transitivePaths:
      TransitiveAuthorityPath[] = [];

    const walk = (
      agentNodeId: string,
      agentIds: string[],
      edgeIds: string[],
      depth: number,
    ): void => {
      if (depth >= maxDepth) {
        return;
      }

      const outgoing =
        source.edges
          .filter(
            (edge) =>
              edge.workspaceId ===
                input.workspaceId &&
              edge.type ===
                "DELEGATES_TO" &&
              edge.from ===
                agentNodeId,
          )
          .sort((a, b) =>
            edgeKey(a).localeCompare(
              edgeKey(b),
            ),
          );

      for (const edge of outgoing) {
        const target =
          source.nodes.find(
            (node) =>
              node.id ===
              edge.to &&
              node.type ===
              "agent",
          );

        if (!target) {
          throw new Error(
            `delegation target ${edge.to} is not an agent`,
          );
        }

        const targetAgentId =
          target.id.replace(/^agent:/, "");

        if (
          agentIds.includes(targetAgentId)
        ) {
          continue;
        }

        const nextAgentIds = [
          ...agentIds,
          targetAgentId,
        ];

        const nextEdgeIds = [
          ...edgeIds,
          edge.id,
        ];

        transitiveAgentIds.add(
          targetAgentId,
        );

        delegationHops.push({
          fromAgentId:
            agentIds[
              agentIds.length - 1
            ],
          toAgentId:
            targetAgentId,
          edgeId: edge.id,
          depth: depth + 1,
        });

        walk(
          target.id,
          nextAgentIds,
          nextEdgeIds,
          depth + 1,
        );

        const delegatedResult =
          this.simulator.simulate({
            workspaceId:
              input.workspaceId,
            agentId:
              targetAgentId,
            graph: {
              nodes: source.nodes,
              edges: source.edges,
            },
          });

        for (const authorityPath of
          delegatedResult.after.exposure.paths) {

          transitivePaths.push({
            agentIds:
              nextAgentIds,
            edgeIds:
              nextEdgeIds,
            authorityPath,
          });
        }
      }
    };

    walk(
      sourceNodeId,
      [input.sourceAgentId],
      [],
      0,
    );

    const uniquePaths =
      new Map<
        string,
        TransitiveAuthorityPath
      >();

    for (const path of transitivePaths) {
      uniquePaths.set(
        pathKey(path),
        path,
      );
    }

    const sortedTransitivePaths =
      sortPaths(
        [...uniquePaths.values()],
      );

    const delegatedResourceIds =
      sortedTransitivePaths
        .map(
          (path) =>
            path.authorityPath.nodeIds[
              path.authorityPath.nodeIds
                .length - 1
            ],
        )
        .filter((nodeId) =>
          source.nodes.some(
            (node) =>
              node.id === nodeId &&
              node.type === "resource",
          ),
        );

    const reachableResources =
      sortStrings([
        ...new Set(
          delegatedResourceIds,
        ),
      ]);

    const nodeMap = new Map(
      source.nodes.map((node) => [
        node.id,
        node,
      ]),
    );

    const sensitiveResources =
      reachableResources.filter(
        (resourceId) =>
          nodeMap.get(resourceId)
            ?.sensitive === true,
      );

    const productionResources =
      reachableResources.filter(
        (resourceId) =>
          nodeMap.get(resourceId)
            ?.environment ===
          "production",
      );

    const directResult =
      this.simulator.simulate({
        workspaceId:
          input.workspaceId,
        agentId:
          input.sourceAgentId,
        graph: {
          nodes: source.nodes,
          edges: source.edges
            .filter(
              (edge) =>
                edge.type !==
                "DELEGATES_TO",
            ),
        },
      });

    const delegationDepth =
      delegationHops.length === 0
        ? 0
        : Math.max(
            ...delegationHops.map(
              (hop) => hop.depth,
            ),
          );

    const blastRadiusScore =
      scoreFor(
        reachableResources.length,
        sensitiveResources.length,
        productionResources.length,
        delegationDepth,
      );

    return {
      workspaceId:
        input.workspaceId,
      sourceAgentId:
        input.sourceAgentId,

      directlyReachableAgentIds,
      transitivelyReachableAgentIds:
        sortStrings([
          ...transitiveAgentIds,
        ]),
      delegationHops:
        [...delegationHops].sort(
          (a, b) =>
            a.depth - b.depth ||
            a.edgeId.localeCompare(
              b.edgeId,
            ),
        ),

      delegationDepth,
      transitivePaths:
        sortedTransitivePaths,

      reachableResources,
      sensitiveResources,
      productionResources,

      blastRadiusScore,
      riskLevel:
        riskLevelFor(
          blastRadiusScore,
          sensitiveResources.length,
          productionResources.length,
        ),

      directBlastRadiusScore:
        directResult.before.impact
          .blastRadiusScore,

      transitiveBlastRadiusIncrease:
        Math.max(
          0,
          blastRadiusScore -
            directResult.before.impact
              .blastRadiusScore,
        ),
    };
  }
}
