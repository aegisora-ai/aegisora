export type CompromiseSimulationNodeType =
  | "agent"
  | "identity"
  | "capability"
  | "tool"
  | "provider"
  | "policy"
  | "approval"
  | "resource";

export type CompromiseSimulationEdgeType =
  | "IDENTIFIED_AS"
  | "GRANTS"
  | "USES"
  | "ROUTES_TO"
  | "GOVERNED_BY"
  | "REQUIRES_APPROVAL"
  | "REACHES";

export type CompromiseSimulationRiskLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface CompromiseSimulationNode {
  id: string;
  workspaceId: string;
  type: CompromiseSimulationNodeType;
  sensitive?: boolean;
  environment?: "production" | "staging" | "development" | "restricted";
  metadata?: Readonly<Record<string, string>>;
}

export interface CompromiseSimulationEdge {
  id: string;
  workspaceId: string;
  from: string;
  to: string;
  type: CompromiseSimulationEdgeType;
}

export interface CompromiseSimulationGraph {
  nodes: readonly CompromiseSimulationNode[];
  edges: readonly CompromiseSimulationEdge[];
}

export interface GrantCapabilityChange {
  readonly type: "GRANT_CAPABILITY";
  readonly agentId: string;
  readonly capabilityId: string;
}

export interface AddAuthorityEdgeChange {
  readonly type: "ADD_AUTHORITY_EDGE";
  readonly edge: CompromiseSimulationEdge;
}

export type CompromiseSimulationChange =
  | GrantCapabilityChange
  | AddAuthorityEdgeChange;

export interface CompromisePath {
  readonly nodeIds: readonly string[];
  readonly edgeIds: readonly string[];
}

export interface CompromiseExposure {
  readonly reachableResources: readonly string[];
  readonly sensitiveResources: readonly string[];
  readonly productionResources: readonly string[];
  readonly paths: readonly CompromisePath[];
}

export interface CompromiseImpact {
  readonly reachableResources: number;
  readonly sensitiveResources: number;
  readonly productionResources: number;
  readonly totalPaths: number;
  readonly criticalPaths: number;
  readonly blastRadiusScore: number;
  readonly level: CompromiseSimulationRiskLevel;
}

export interface CompromiseSimulationSnapshot {
  readonly exposure: CompromiseExposure;
  readonly impact: CompromiseImpact;
}

export interface CompromiseSimulationDelta {
  readonly newReachableResources: readonly string[];
  readonly newSensitiveResources: readonly string[];
  readonly newProductionResources: readonly string[];
  readonly newPaths: readonly CompromisePath[];
  readonly reachableResourceDelta: number;
  readonly sensitiveResourceDelta: number;
  readonly productionResourceDelta: number;
  readonly pathDelta: number;
  readonly blastRadiusScoreDelta: number;
  readonly levelChanged: boolean;
  readonly fromLevel: CompromiseSimulationRiskLevel;
  readonly toLevel: CompromiseSimulationRiskLevel;
}

export interface CompromiseSimulationResult {
  readonly workspaceId: string;
  readonly agentId: string;
  readonly change: CompromiseSimulationChange | null;
  readonly before: CompromiseSimulationSnapshot;
  readonly after: CompromiseSimulationSnapshot;
  readonly delta: CompromiseSimulationDelta;
}

const NODE_TYPES = new Set<CompromiseSimulationNodeType>([
  "agent",
  "identity",
  "capability",
  "tool",
  "provider",
  "policy",
  "approval",
  "resource",
]);

const EDGE_TYPES = new Set<CompromiseSimulationEdgeType>([
  "IDENTIFIED_AS",
  "GRANTS",
  "USES",
  "ROUTES_TO",
  "GOVERNED_BY",
  "REQUIRES_APPROVAL",
  "REACHES",
]);

function assertValidNode(node: CompromiseSimulationNode): void {
  if (!node.id.trim()) {
    throw new Error("node.id is required");
  }

  if (!node.workspaceId.trim()) {
    throw new Error("node.workspaceId is required");
  }

  if (!NODE_TYPES.has(node.type)) {
    throw new Error(`unsupported node type: ${String(node.type)}`);
  }
}

function assertValidEdge(edge: CompromiseSimulationEdge): void {
  if (!edge.id.trim()) {
    throw new Error("edge.id is required");
  }

  if (!edge.workspaceId.trim()) {
    throw new Error("edge.workspaceId is required");
  }

  if (!edge.from.trim() || !edge.to.trim()) {
    throw new Error("edge endpoints are required");
  }

  if (!EDGE_TYPES.has(edge.type)) {
    throw new Error(`unsupported edge type: ${String(edge.type)}`);
  }
}

function cloneGraph(
  graph: CompromiseSimulationGraph,
): {
  nodes: CompromiseSimulationNode[];
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

function riskLevelFor(
  reachableResources: number,
  sensitiveResources: number,
  productionResources: number,
  criticalPaths: number,
): CompromiseSimulationRiskLevel {
  if (
    sensitiveResources >= 3 &&
    (productionResources >= 2 || criticalPaths >= 2)
  ) {
    return "CRITICAL";
  }

  if (
    sensitiveResources >= 2 ||
    productionResources >= 2 ||
    criticalPaths >= 1
  ) {
    return "HIGH";
  }

  if (
    reachableResources >= 2 ||
    sensitiveResources >= 1 ||
    productionResources >= 1
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

function scoreFor(
  reachableResources: number,
  sensitiveResources: number,
  productionResources: number,
  criticalPaths: number,
): number {
  const score =
    reachableResources * 7 +
    sensitiveResources * 12 +
    productionResources * 15 +
    criticalPaths * 16;

  return Math.min(100, score);
}

function pathKey(path: CompromisePath): string {
  return `${path.nodeIds.join(">")}|${path.edgeIds.join(">")}`;
}

function sortPaths(paths: readonly CompromisePath[]): CompromisePath[] {
  return [...paths].sort((a, b) =>
    pathKey(a).localeCompare(pathKey(b)),
  );
}

export class CompromiseSimulationEngine {
  public simulate(input: {
    workspaceId: string;
    agentId: string;
    graph: CompromiseSimulationGraph;
    change?: CompromiseSimulationChange;
  }): CompromiseSimulationResult {
    if (!input.workspaceId.trim()) {
      throw new Error("workspaceId is required");
    }

    if (!input.agentId.trim()) {
      throw new Error("agentId is required");
    }

    const baseline = cloneGraph(input.graph);

    for (const node of baseline.nodes) {
      assertValidNode(node);
    }

    for (const edge of baseline.edges) {
      assertValidEdge(edge);

      if (edge.workspaceId !== input.workspaceId) {
        continue;
      }

      const fromNode = baseline.nodes.find(
        (node) => node.id === edge.from,
      );

      const toNode = baseline.nodes.find(
        (node) => node.id === edge.to,
      );

      if (!fromNode || !toNode) {
        throw new Error("authority edge references unknown node");
      }

      if (
        fromNode.workspaceId !== input.workspaceId ||
        toNode.workspaceId !== input.workspaceId
      ) {
        throw new Error("cross-workspace edge detected");
      }
    }

    const agentNodeId = `agent:${input.agentId}`;

    const agentExists = baseline.nodes.some(
      (node) => node.id === agentNodeId && node.type === "agent",
    );

    if (!agentExists) {
      throw new Error(`agent ${input.agentId} not found`);
    }

    const before = this.snapshot(
      {
        nodes: baseline.nodes,
        edges: baseline.edges,
      },
      input.workspaceId,
      agentNodeId,
    );

    if (input.change) {
      this.applyChange(
        baseline,
        input.workspaceId,
        input.change,
      );
    }

    const after = this.snapshot(
      {
        nodes: baseline.nodes,
        edges: baseline.edges,
      },
      input.workspaceId,
      agentNodeId,
    );

    const beforeReachable = new Set(before.exposure.reachableResources);
    const beforeSensitive = new Set(before.exposure.sensitiveResources);
    const beforeProduction = new Set(before.exposure.productionResources);
    const beforePaths = new Set(before.exposure.paths.map(pathKey));

    const newReachableResources = after.exposure.reachableResources.filter(
      (id) => !beforeReachable.has(id),
    );

    const newSensitiveResources = after.exposure.sensitiveResources.filter(
      (id) => !beforeSensitive.has(id),
    );

    const newProductionResources = after.exposure.productionResources.filter(
      (id) => !beforeProduction.has(id),
    );

    const newPaths = after.exposure.paths.filter(
      (path) => !beforePaths.has(pathKey(path)),
    );

    return {
      workspaceId: input.workspaceId,
      agentId: input.agentId,
      change: input.change ?? null,
      before,
      after,
      delta: {
        newReachableResources,
        newSensitiveResources,
        newProductionResources,
        newPaths: sortPaths(newPaths),
        reachableResourceDelta:
          after.impact.reachableResources -
          before.impact.reachableResources,
        sensitiveResourceDelta:
          after.impact.sensitiveResources -
          before.impact.sensitiveResources,
        productionResourceDelta:
          after.impact.productionResources -
          before.impact.productionResources,
        pathDelta:
          after.impact.totalPaths -
          before.impact.totalPaths,
        blastRadiusScoreDelta:
          after.impact.blastRadiusScore -
          before.impact.blastRadiusScore,
        levelChanged:
          before.impact.level !== after.impact.level,
        fromLevel: before.impact.level,
        toLevel: after.impact.level,
      },
    };
  }

  private applyChange(
    graph: {
      nodes: CompromiseSimulationNode[];
      edges: CompromiseSimulationEdge[];
    },
    workspaceId: string,
    change: CompromiseSimulationChange,
  ): void {
    if (change.type === "GRANT_CAPABILITY") {
      if (change.agentId === "") {
        throw new Error("change.agentId is required");
      }

      if (change.capabilityId === "") {
        throw new Error("change.capabilityId is required");
      }

      if (change.agentId !== change.agentId.trim()) {
        throw new Error("invalid change.agentId");
      }

      const capabilityId = `capability:${change.capabilityId}`;
      const agentId = `agent:${change.agentId}`;

      const capability = graph.nodes.find(
        (node) =>
          node.id === capabilityId &&
          node.type === "capability",
      );

      if (!capability) {
        throw new Error(`capability ${change.capabilityId} not found`);
      }

      const agent = graph.nodes.find(
        (node) =>
          node.id === agentId &&
          node.type === "agent",
      );

      if (!agent) {
        throw new Error(`agent ${change.agentId} not found`);
      }

      const edgeId =
        `simulated:grant:${change.agentId}:${change.capabilityId}`;

      if (!graph.edges.some((edge) => edge.id === edgeId)) {
        graph.edges.push({
          id: edgeId,
          workspaceId,
          from: agentId,
          to: capabilityId,
          type: "GRANTS",
        });
      }

      return;
    }

    if (change.type === "ADD_AUTHORITY_EDGE") {
      assertValidEdge(change.edge);

      if (change.edge.workspaceId !== workspaceId) {
        throw new Error("cross-workspace change rejected");
      }

      const from = graph.nodes.find(
        (node) => node.id === change.edge.from,
      );

      const to = graph.nodes.find(
        (node) => node.id === change.edge.to,
      );

      if (!from || !to) {
        throw new Error("authority edge references unknown node");
      }

      if (from.workspaceId !== workspaceId || to.workspaceId !== workspaceId) {
        throw new Error("cross-workspace change rejected");
      }

      if (
        !graph.edges.some(
          (edge) => edge.id === change.edge.id,
        )
      ) {
        graph.edges.push({ ...change.edge });
      }

      return;
    }

    const exhaustive: never = change;
    return exhaustive;
  }

  private snapshot(
    graph: CompromiseSimulationGraph,
    workspaceId: string,
    agentNodeId: string,
  ): CompromiseSimulationSnapshot {
    const nodesById = new Map(
      graph.nodes.map((node) => [node.id, node]),
    );

    const outgoing = new Map<
      string,
      CompromiseSimulationEdge[]
    >();

    for (const edge of graph.edges) {
      if (edge.workspaceId !== workspaceId) {
        continue;
      }

      const fromNode = nodesById.get(edge.from);
      const toNode = nodesById.get(edge.to);

      if (
        !fromNode ||
        !toNode ||
        fromNode.workspaceId !== workspaceId ||
        toNode.workspaceId !== workspaceId
      ) {
        continue;
      }

      const list = outgoing.get(edge.from) ?? [];
      list.push(edge);
      outgoing.set(edge.from, list);
    }

    for (const list of outgoing.values()) {
      list.sort((a, b) => a.id.localeCompare(b.id));
    }

    const paths: CompromisePath[] = [];

    const visit = (
      nodeId: string,
      nodePath: string[],
      edgePath: string[],
    ): void => {
      const edges = outgoing.get(nodeId) ?? [];

      for (const edge of edges) {
        if (nodePath.includes(edge.to)) {
          continue;
        }

        const nextNodePath = [...nodePath, edge.to];
        const nextEdgePath = [...edgePath, edge.id];
        const nextNode = nodesById.get(edge.to);

        if (!nextNode) {
          continue;
        }

        if (nextNode.type === "resource") {
          paths.push({
            nodeIds: nextNodePath,
            edgeIds: nextEdgePath,
          });
          continue;
        }

        visit(
          edge.to,
          nextNodePath,
          nextEdgePath,
        );
      }
    };

    visit(agentNodeId, [agentNodeId], []);

    const sortedPaths = sortPaths(paths);

    const resourcePaths = sortedPaths.filter(
      (path) => path.nodeIds.length > 0,
    );

    const reachableResources = [
      ...new Set(
        resourcePaths
          .map((path) => path.nodeIds[path.nodeIds.length - 1])
          .filter((nodeId) => nodesById.get(nodeId)?.type === "resource"),
      ),
    ].sort();

    const sensitiveResources = reachableResources
      .filter(
        (resourceId) =>
          nodesById.get(resourceId)?.sensitive === true,
      )
      .sort();

    const productionResources = reachableResources
      .filter(
        (resourceId) =>
          nodesById.get(resourceId)?.environment === "production",
      )
      .sort();

    const criticalPaths = resourcePaths.filter((path) => {
      const resourceId =
        path.nodeIds[path.nodeIds.length - 1];

      const resource = nodesById.get(resourceId);

      return (
        resource?.type === "resource" &&
        resource.sensitive === true &&
        resource.environment === "production"
      );
    });

    const impact: CompromiseImpact = {
      reachableResources: reachableResources.length,
      sensitiveResources: sensitiveResources.length,
      productionResources: productionResources.length,
      totalPaths: resourcePaths.length,
      criticalPaths: criticalPaths.length,
      blastRadiusScore: scoreFor(
        reachableResources.length,
        sensitiveResources.length,
        productionResources.length,
        criticalPaths.length,
      ),
      level: riskLevelFor(
        reachableResources.length,
        sensitiveResources.length,
        productionResources.length,
        criticalPaths.length,
      ),
    };

    return {
      exposure: {
        reachableResources,
        sensitiveResources,
        productionResources,
        paths: resourcePaths,
      },
      impact,
    };
  }
}

