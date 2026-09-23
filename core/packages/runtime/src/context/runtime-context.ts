import {
  EventStore
} from "../observability";

import {
  EventBus
} from "../events";

import {
  DecisionTraceStore
} from "../audit";

import {
  MemoryEvidenceStore,
} from "@aegisora/audit";

import {
  RuntimePolicyEngine
} from "../policy";

import {
  SecurityGuard
} from "../security";

import {
  RiskEngine
} from "../security";

import {
  RuntimeMonitor
} from "../monitoring";

import {
  AgentRegistry
} from "../agents";

import {
  AgentLifecycle
} from "../lifecycle";

import {
  AgentSnapshotEngine
} from "../snapshot";

import {
  AgentHealthEngine
} from "../health";

import {
  AgentNetwork,
  MessageRouter
} from "../network";

import {
  MessageBus
} from "../communication";

import {
  TransitiveAuthorityEngine,
  workspaceId,
} from "@aegisora/core";

import type {
  CompromiseSimulationGraph,
  TransitiveAuthorityResult,
  WorkspaceId,
} from "@aegisora/core";


export class RuntimeContext {

  evidenceStore:
    MemoryEvidenceStore;

  eventStore:
    EventStore;

  eventBus:
    EventBus;

  decisionStore:
    DecisionTraceStore;


  policy:
    RuntimePolicyEngine;

  security:
    SecurityGuard;

  risk:
    RiskEngine;

  monitor:
    RuntimeMonitor;

  agentRegistry:
    AgentRegistry;

  lifecycle:
    AgentLifecycle;

  snapshot:
    AgentSnapshotEngine;

  health:
    AgentHealthEngine;

  /**
   * Canonical runtime network.
   */
  agentNetwork:
    AgentNetwork;

  /**
   * Canonical runtime message bus.
   *
   * MUST use the same AgentRegistry
   * owned by RuntimeContext.
   */
  messageBus:
    MessageBus;

  /**
   * Canonical runtime message router.
   */
  messageRouter:
    MessageRouter;

  /**
   * Trusted runtime authority context.
   *
   * Workspace identity is immutable after initialization.
   * The graph itself may evolve, but only inside the same
   * canonical workspace boundary.
   */
  private authorityWorkspaceId?: WorkspaceId;

  private authorityGraph?: CompromiseSimulationGraph;


  constructor() {

    this.eventStore =
      new EventStore();

    this.evidenceStore =
      new MemoryEvidenceStore();

    this.decisionStore =
      new DecisionTraceStore(
        this.evidenceStore
      );



    this.policy =
      new RuntimePolicyEngine();

    this.security =
      new SecurityGuard();

    this.risk =
      new RiskEngine();

    this.monitor =
      new RuntimeMonitor(
        this.eventStore.getAll()
      );

    /**
     * SINGLE CANONICAL IDENTITY AUTHORITY.
     */
    this.agentRegistry =
      new AgentRegistry();

    /**
     * NETWORK REUSES CANONICAL REGISTRY.
     */
    this.agentNetwork =
      new AgentNetwork(
        this.agentRegistry
      );

    /**
     * COMMUNICATION REUSES
     * CANONICAL REGISTRY.
     */
    this.messageBus =
      new MessageBus(
        this.agentRegistry
      );

    /**
     * ROUTER USES CANONICAL NETWORK.
     */
    this.messageRouter =
      new MessageRouter(
        this.agentNetwork
      );

    this.lifecycle =
      new AgentLifecycle(
        this
      );

    this.snapshot =
      new AgentSnapshotEngine(
        this
      );

    this.health =
      new AgentHealthEngine();

    this.eventBus =
      new EventBus(
        this.eventStore
      );

  }

  /**
   * Configure the canonical authority context for this runtime.
   *
   * Workspace identity becomes immutable after the first
   * configuration. Authority graph changes must remain inside
   * that workspace.
   */
  configureAuthorityContext(input: {
    workspaceId: string;
    graph: CompromiseSimulationGraph;
  }): void {

    const canonicalWorkspaceId =
      workspaceId(input.workspaceId);

    if (
      this.authorityWorkspaceId &&
      this.authorityWorkspaceId !== canonicalWorkspaceId
    ) {
      throw new Error(
        "Runtime authority workspace identity is immutable.",
      );
    }

    this.assertAuthorityGraphWorkspace(
      input.graph,
      canonicalWorkspaceId,
    );

    this.authorityWorkspaceId =
      canonicalWorkspaceId;

    this.authorityGraph =
      this.cloneAuthorityGraph(
        input.graph,
      );
  }

  /**
   * Replace the current authority graph without changing
   * the canonical workspace identity.
   */
  updateAuthorityGraph(
    graph: CompromiseSimulationGraph,
  ): void {

    const canonicalWorkspaceId =
      this.getAuthorityWorkspaceId();

    this.assertAuthorityGraphWorkspace(
      graph,
      canonicalWorkspaceId,
    );

    this.authorityGraph =
      this.cloneAuthorityGraph(
        graph,
      );
  }

  getAuthorityWorkspaceId(): WorkspaceId {

    if (!this.authorityWorkspaceId) {
      throw new Error(
        "Runtime authority workspace identity is not configured.",
      );
    }

    return this.authorityWorkspaceId;
  }

  getAuthorityGraph(): CompromiseSimulationGraph {

    if (!this.authorityGraph) {
      throw new Error(
        "Runtime authority graph is not configured.",
      );
    }

    return this.cloneAuthorityGraph(
      this.authorityGraph,
    );
  }

  getTransitiveAuthority(
    agentId: string,
    maxDelegationDepth?: number,
  ): TransitiveAuthorityResult {

    const engine =
      new TransitiveAuthorityEngine();

    return engine.analyze({
      workspaceId:
        this.getAuthorityWorkspaceId(),

      sourceAgentId:
        agentId,

      graph:
        this.getAuthorityGraph(),

      ...(maxDelegationDepth !== undefined
        ? { maxDelegationDepth }
        : {}),
    });
  }

  private assertAuthorityGraphWorkspace(
    graph: CompromiseSimulationGraph,
    canonicalWorkspaceId: WorkspaceId,
  ): void {

    for (const node of graph.nodes) {
      if (
        node.workspaceId !==
        canonicalWorkspaceId
      ) {
        throw new Error(
          `Runtime authority node workspace mismatch: ${node.id}`,
        );
      }
    }

    for (const edge of graph.edges) {
      if (
        edge.workspaceId !==
        canonicalWorkspaceId
      ) {
        throw new Error(
          `Runtime authority edge workspace mismatch: ${edge.id}`,
        );
      }
    }
  }

  private cloneAuthorityGraph(
    graph: CompromiseSimulationGraph,
  ): CompromiseSimulationGraph {

    return {
      nodes: graph.nodes.map(
        (node) => ({
          ...node,
          metadata:
            node.metadata
              ? { ...node.metadata }
              : undefined,
        }),
      ),

      edges: graph.edges.map(
        (edge) => ({
          ...edge,
        }),
      ),
    };
  }

}
