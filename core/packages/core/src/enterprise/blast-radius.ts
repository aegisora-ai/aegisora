import type {
  WorkspaceId,
} from "./access";

import type {
  AgentId,
} from "./agents";

export type AuthorityNodeType =
  | "agent"
  | "identity"
  | "capability"
  | "tool"
  | "provider"
  | "policy"
  | "approval"
  | "resource";

export type AuthorityEdgeType =
  | "IDENTIFIED_AS"
  | "GRANTS"
  | "USES"
  | "ROUTES_TO"
  | "GOVERNED_BY"
  | "REQUIRES_APPROVAL"
  | "REACHES";

export interface AuthorityNode {
  readonly id: string;
  readonly type: AuthorityNodeType;
  readonly workspaceId: WorkspaceId;
  readonly name: string;
  readonly sensitive?: boolean;
  readonly production?: boolean;
  readonly metadata?: Readonly<
    Record<string, unknown>
  >;
}

export interface AuthorityEdge {
  readonly from: string;
  readonly to: string;
  readonly type: AuthorityEdgeType;
  readonly workspaceId: WorkspaceId;
  readonly metadata?: Readonly<
    Record<string, unknown>
  >;
}

export interface AuthorityGraphSnapshot {
  readonly workspaceId: WorkspaceId;
  readonly nodes: readonly AuthorityNode[];
  readonly edges: readonly AuthorityEdge[];
}

export interface EffectiveAuthorityPath {
  readonly nodeIds: readonly string[];
  readonly nodeTypes:
    readonly AuthorityNodeType[];
  readonly edgeTypes:
    readonly AuthorityEdgeType[];
  readonly terminalResourceId: string;
  readonly sensitive: boolean;
  readonly production: boolean;
}

export type BlastRadiusLevel =
  | "LOW"
  | "MEDIUM"
  | "HIGH"
  | "CRITICAL";

export interface AgentBlastRadius {
  readonly workspaceId: WorkspaceId;
  readonly agentId: AgentId;

  readonly reachableResources: number;
  readonly sensitiveResources: number;
  readonly productionResources: number;

  readonly identityNodes: number;
  readonly capabilityNodes: number;
  readonly toolNodes: number;
  readonly providerNodes: number;
  readonly policyNodes: number;
  readonly approvalNodes: number;

  readonly paths: readonly EffectiveAuthorityPath[];

  readonly criticalPaths: number;

  readonly level: BlastRadiusLevel;
}

export interface BlastRadiusOptions {
  readonly maxPathDepth?: number;
}

const DEFAULT_MAX_PATH_DEPTH = 12;

function validateDepth(
  value: number | undefined,
): number {
  const resolved =
    value ??
    DEFAULT_MAX_PATH_DEPTH;

  if (
    !Number.isFinite(resolved) ||
    resolved < 1 ||
    !Number.isInteger(resolved)
  ) {
    throw new Error(
      "maxPathDepth must be a positive integer.",
    );
  }

  return resolved;
}

function cloneNode(
  node: AuthorityNode,
): AuthorityNode {
  return {
    ...node,
    metadata: node.metadata
      ? { ...node.metadata }
      : undefined,
  };
}

function cloneEdge(
  edge: AuthorityEdge,
): AuthorityEdge {
  return {
    ...edge,
    metadata: edge.metadata
      ? { ...edge.metadata }
      : undefined,
  };
}

function clonePath(
  path: EffectiveAuthorityPath,
): EffectiveAuthorityPath {
  return {
    nodeIds: [...path.nodeIds],
    nodeTypes: [...path.nodeTypes],
    edgeTypes: [...path.edgeTypes],
    terminalResourceId:
      path.terminalResourceId,
    sensitive: path.sensitive,
    production: path.production,
  };
}

function levelFor(
  input: {
    readonly reachableResources: number;
    readonly sensitiveResources: number;
    readonly productionResources: number;
    readonly criticalPaths: number;
  },
): BlastRadiusLevel {

  if (
    input.sensitiveResources >= 3 &&
    (
      input.productionResources >= 2 ||
      input.criticalPaths >= 2
    )
  ) {
    return "CRITICAL";
  }

  if (
    input.sensitiveResources >= 2 ||
    input.productionResources >= 2 ||
    input.criticalPaths >= 1
  ) {
    return "HIGH";
  }

  if (
    input.reachableResources >= 2 ||
    input.sensitiveResources >= 1 ||
    input.productionResources >= 1
  ) {
    return "MEDIUM";
  }

  return "LOW";
}

export class AuthorityGraph {

  private readonly nodes =
    new Map<string, AuthorityNode>();

  private readonly edges: AuthorityEdge[] = [];

  addNode(
    node: AuthorityNode,
  ): AuthorityNode {

    if (
      this.nodes.has(node.id)
    ) {
      throw new Error(
        `Authority node already exists: ${node.id}`,
      );
    }

    this.nodes.set(
      node.id,
      cloneNode(node),
    );

    return cloneNode(node);
  }

  addEdge(
    edge: AuthorityEdge,
  ): AuthorityEdge {

    if (
      !this.nodes.has(edge.from)
    ) {
      throw new Error(
        `Authority edge source not found: ${edge.from}`,
      );
    }

    if (
      !this.nodes.has(edge.to)
    ) {
      throw new Error(
        `Authority edge target not found: ${edge.to}`,
      );
    }

    if (
      edge.workspaceId !==
      this.nodes.get(edge.from)!.workspaceId ||
      edge.workspaceId !==
      this.nodes.get(edge.to)!.workspaceId
    ) {
      throw new Error(
        "Authority edge crosses workspace boundary.",
      );
    }

    this.edges.push(
      cloneEdge(edge),
    );

    return cloneEdge(edge);
  }

  snapshot(
    workspaceId: WorkspaceId,
  ): AuthorityGraphSnapshot {

    const nodes =
      [...this.nodes.values()]
        .filter(
          (node) =>
            node.workspaceId ===
            workspaceId,
        )
        .map(cloneNode);

    const allowedIds =
      new Set(
        nodes.map(
          (node) => node.id,
        ),
      );

    const edges =
      this.edges
        .filter(
          (edge) =>
            edge.workspaceId ===
              workspaceId &&
            allowedIds.has(edge.from) &&
            allowedIds.has(edge.to),
        )
        .map(cloneEdge);

    return {
      workspaceId,
      nodes,
      edges,
    };
  }
}

export class BlastRadiusEngine {

  constructor(
    private readonly graph:
      AuthorityGraph,
  ) {}

  analyze(
    workspaceId: WorkspaceId,
    agentId: AgentId,
    options:
      BlastRadiusOptions = {},
  ): AgentBlastRadius {

    const maxPathDepth =
      validateDepth(
        options.maxPathDepth,
      );

    const snapshot =
      this.graph.snapshot(
        workspaceId,
      );

    const nodeById =
      new Map(
        snapshot.nodes.map(
          (node) => [
            node.id,
            node,
          ],
        ),
      );

    const outgoing =
      new Map<
        string,
        AuthorityEdge[]
      >();

    for (const edge of snapshot.edges) {
      const existing =
        outgoing.get(edge.from);

      if (existing) {
        existing.push(edge);
      } else {
        outgoing.set(
          edge.from,
          [edge],
        );
      }
    }

    const start =
      nodeById.get(
        `agent:${agentId}`,
      );

    if (!start) {
      return {
        workspaceId,
        agentId,

        reachableResources: 0,
        sensitiveResources: 0,
        productionResources: 0,

        identityNodes: 0,
        capabilityNodes: 0,
        toolNodes: 0,
        providerNodes: 0,
        policyNodes: 0,
        approvalNodes: 0,

        paths: [],
        criticalPaths: 0,

        level: "LOW",
      };
    }

    const paths: EffectiveAuthorityPath[] =
      [];

    const visit = (
      currentId: string,
      nodeIds: string[],
      nodeTypes:
        AuthorityNodeType[],
      edgeTypes:
        AuthorityEdgeType[],
      depth: number,
    ): void => {

      if (depth > maxPathDepth) {
        return;
      }

      const current =
        nodeById.get(
          currentId,
        );

      if (!current) {
        return;
      }

      if (
        current.type ===
        "resource"
      ) {
        paths.push({
          nodeIds: [
            ...nodeIds,
          ],
          nodeTypes: [
            ...nodeTypes,
          ],
          edgeTypes: [
            ...edgeTypes,
          ],
          terminalResourceId:
            current.id,
          sensitive:
            current.sensitive === true,
          production:
            current.production === true,
        });

        return;
      }

      for (
        const edge of
        outgoing.get(
          currentId,
        ) ?? []
      ) {

        const next =
          nodeById.get(
            edge.to,
          );

        if (!next) {
          continue;
        }

        if (
          nodeIds.includes(
            next.id,
          )
        ) {
          continue;
        }

        visit(
          next.id,
          [
            ...nodeIds,
            next.id,
          ],
          [
            ...nodeTypes,
            next.type,
          ],
          [
            ...edgeTypes,
            edge.type,
          ],
          depth + 1,
        );
      }
    };

    visit(
      start.id,
      [start.id],
      [start.type],
      [],
      1,
    );

    const uniquePaths =
      new Map<
        string,
        EffectiveAuthorityPath
      >();

    for (const path of paths) {
      uniquePaths.set(
        path.nodeIds.join("->"),
        path,
      );
    }

    const finalPaths =
      [...uniquePaths.values()]
        .sort(
          (left, right) =>
            left.nodeIds.join("->")
              .localeCompare(
                right.nodeIds.join("->"),
              ),
        )
        .map(clonePath);

    const resourceIds =
      new Set(
        finalPaths.map(
          (path) =>
            path.terminalResourceId,
        ),
      );

    const sensitiveResources =
      new Set(
        finalPaths
          .filter(
            (path) =>
              path.sensitive,
          )
          .map(
            (path) =>
              path.terminalResourceId,
          ),
      );

    const productionResources =
      new Set(
        finalPaths
          .filter(
            (path) =>
              path.production,
          )
          .map(
            (path) =>
              path.terminalResourceId,
          ),
      );

    const criticalPaths =
      finalPaths.filter(
        (path) =>
          path.sensitive &&
          path.production,
      ).length;

    const reachableNodeIds =
      new Set(
        finalPaths.flatMap(
          (path) =>
            path.nodeIds,
        ),
      );

    const countType =
      (
        type: AuthorityNodeType,
      ): number =>
        [...reachableNodeIds]
          .map(
            (id) =>
              nodeById.get(id),
          )
          .filter(
            (
              node,
            ): node is AuthorityNode =>
              node?.type === type,
          ).length;

    return {
      workspaceId,
      agentId,

      reachableResources:
        resourceIds.size,

      sensitiveResources:
        sensitiveResources.size,

      productionResources:
        productionResources.size,

      identityNodes:
        countType("identity"),

      capabilityNodes:
        countType("capability"),

      toolNodes:
        countType("tool"),

      providerNodes:
        countType("provider"),

      policyNodes:
        countType("policy"),

      approvalNodes:
        countType("approval"),

      paths:
        finalPaths,

      criticalPaths,

      level:
        levelFor({
          reachableResources:
            resourceIds.size,
          sensitiveResources:
            sensitiveResources.size,
          productionResources:
            productionResources.size,
          criticalPaths,
        }),
    };
  }
}
