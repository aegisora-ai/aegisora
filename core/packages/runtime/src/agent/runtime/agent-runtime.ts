import { ToolRegistry, ToolSelector, EchoTool } from "../../tools";

import { Agent } from "..";

import { GoalManager } from "../../goal";

import { PlannerEngine } from "../../planner";

import { TaskManager } from "../../tasks";

import { AgentExecutor } from "../../execution";

import { Observer } from "../../observation";

import { ReflectionEngine } from "../../reflection";

import { LearningEngine } from "../../learning";

import { AgentLoop } from "../../loop";

import { EventBus } from "../../events";

import { EventStore } from "../../observability";

import { RuntimeMonitor } from "../../monitoring";

import { RiskEngine } from "../../security";

import { DecisionTraceStore } from "../../audit";

import { RuntimeContext } from "../../context/runtime-context";
import { PermissionEngine } from "../../permissions";
import { EnforcementGate } from "../../enforcement";
import { ProviderExecutionGateway } from "../../providers";
import { CollaborationManager } from "../../collaboration";

import {
  EnterpriseRuntimeApprovalBridge,
} from "@aegisora/core";

import type {
  EnterpriseApprovalRuntimeConfig,
} from "../../enforcement/types";

export interface AgentExecutionRequest {
  agentId: string;
  goal: string;
}

export interface AgentExecutionResponse {
  agentId: string;
  status: string;
  success: boolean;
  steps: number;
  finishedAt: Date;
}
// T-minus 48 Hours: The Calm Before the Commit
export class AgentRuntime {
  private readonly toolExecutionToken = Symbol("aegisora.tool.execution");

  private readonly providerExecutionToken = Symbol(
    "aegisora.provider.execution",
  );
  private context = new RuntimeContext();

  private tools = new ToolRegistry(this.toolExecutionToken);

  private permissions = new PermissionEngine(
    this.tools,
    this.context.agentRegistry,
  );

  private enforcement = new EnforcementGate(this.context, this.permissions);

  private collaboration = new CollaborationManager(
    this.context.agentRegistry,
    this.enforcement,
  );

  private providerGateway = new ProviderExecutionGateway(
    this.context,
    undefined,
    undefined,
    this.permissions,
    this.providerExecutionToken,
  );

  private events = this.context.eventBus;

  private goals = new GoalManager();

  private planner = new PlannerEngine(this.goals);

  private tasks = new TaskManager();

  private selector = new ToolSelector(this.tools);

  private executor = new AgentExecutor(
    this.tasks,
    this.selector,
    this.planner,
    this.context,
    this.tools,
    this.toolExecutionToken,
    this.providerGateway,
  );

  private observer = new Observer();

  private reflection = new ReflectionEngine();

  private learning = new LearningEngine();

  private loop = new AgentLoop(
    this.planner,
    this.executor,
    this.observer,
    this.reflection,
    this.learning,
  );

  constructor(
    enterpriseApprovalConfig?: EnterpriseApprovalRuntimeConfig,
  ) {

    if (enterpriseApprovalConfig) {

      const normalized =
        {
          ...enterpriseApprovalConfig,

          bridge:
            enterpriseApprovalConfig.bridge ??
            new EnterpriseRuntimeApprovalBridge(),
        };

      this.enforcement
        .configureEnterpriseApproval(
          normalized,
        );

      this.providerGateway
        .configureEnterpriseApproval(
          normalized,
        );
    }

    this.tools.setEnforcementGate(this.enforcement);
    this.tools.register(new EchoTool());
  }

  create(id: string, config?: unknown) {
    const agent = new Agent({
      id,
      name: id,
      metadata:
        config && typeof config === "object"
          ? (config as Record<string, unknown>)
          : undefined,
    });
    this.context.lifecycle.create(agent);

    return agent;
  }

  async execute(
    request: AgentExecutionRequest,
  ): Promise<AgentExecutionResponse> {
    const agent = this.context.agentRegistry.getAgent(request.agentId);

    if (!agent) {
      throw new Error(`Agent not found: ${request.agentId}`);
    }

    this.context.lifecycle.start(agent.id);

    const goal = this.goals.create(agent.id, request.goal);

    try {
      this.goals.updateStatus(goal.id, "planning");

      this.goals.updateStatus(goal.id, "executing");

      const executionResult = await this.loop.run(
        agent,
        goal.objective,
        goal.id,
      );

      this.goals.updateStatus(goal.id, "completed");

      this.context.lifecycle.complete(agent.id);

      return {
        agentId: agent.id,

        status: "completed",

        success: executionResult.success,
        steps: executionResult.steps,
        finishedAt: new Date(),
      };
    } catch (error) {
      const reason = error instanceof Error ? error.message : String(error);

      this.goals.updateStatus(goal.id, "failed");

      this.context.lifecycle.fail(agent.id, reason);

      throw error;
    }
  }

  async runProtectedAgent(agentId: string, input: string, runner: (input: string) => Promise<unknown>) {
    const agent = this.context.agentRegistry.getById(agentId);
    if (!agent) throw new Error(`Agent not found: ${agentId}`);
    const requestId = crypto.randomUUID();
    const enforcement = await this.enforcement.enforce({
      agentId,
      resourceType: "agent",
      tool: `agent:${agentId}`,
      action: "agent.run",
      input,
      metadata: { requestId, protected: true, capability: "agent.run" },
    });
    if (enforcement.decision !== "ALLOW") throw new Error(`BLOCKED`);
    const output = await runner(input);
    return { output, requestId, decision: enforcement.decision, riskScore: enforcement.riskScore, threats: enforcement.threats, timestamp: new Date() };
  }

  getCollaborationManager() {
    return this.collaboration;
  }

  getProviderGateway() {
    return this.providerGateway;
  }

  registerTool(tool: import("../../tools").RuntimeTool) {
    return this.tools.register(tool);
  }

  getToolRegistry() {
    return this.tools;
  }

  getContext() {
    return this.context;
  }

  snapshot() {
    return this.getState();
  }
  getState() {
    return {
      agents: this.context.agentRegistry.getAll().map((agent) => agent.id),

      goals: this.goals.list(),

      plannerPlans: this.planner.list(),

      tools: this.tools.list().map((tool) => tool.name),

      loop: this.loop.getState(),
    };
  }

  getSnapshot(id: string) {
    return this.context.snapshot.getSnapshot(id);
  }

  getHealth(id: string) {
    const snapshot = this.context.snapshot.getSnapshot(id);

    if (!snapshot) {
      return null;
    }

    return this.context.health.evaluate(snapshot);
  }

  getHealthSummary() {
    return this.context.snapshot
      .getAll()
      .map((snapshot) => this.context.health.evaluate(snapshot));
  }

  getSnapshots() {
    return this.context.snapshot.getAll();
  }

  getAgents() {
    return this.context.agentRegistry.getAll();
  }

  /**
   * Canonical AgentRegistry accessor.
   *
   * RuntimeContext owns the single AgentRegistry instance.
   * This accessor exposes that same registry without creating
   * a second identity source.
   */
  getAgentRegistry() {
    return this.context.agentRegistry;
  }

  getAgent(id: string) {
    return this.context.agentRegistry.getById(id);
  }
  /**
   * Canonical agent identity lookup.
   *
   * This method is intentionally backed by the RuntimeContext
   * AgentRegistry. Runtime identity must have one canonical
   * source and must not be duplicated locally.
   */
  getAgentById(id: string) {
    return this.context.agentRegistry.getById(id);
  }

  getEventStore() {
    return this.context.eventStore;
  }

  getRiskSignals() {
    const engine = new RiskEngine();

    return this.context.eventStore
      .getAll()
      .map((event) => engine.analyze(event))
      .filter((signal) => signal !== null);
  }

  getDecisionTraces() {
    return this.context.decisionStore.getAll();
  }

getEvidence() {
    return this.context.evidenceStore.getAll();
  }

  getEvidenceByTrace(
    traceId: string,
  ) {
    return this.context.evidenceStore.getByTraceId(
      traceId,
    );
  }

  getEvidenceByDecision(
    decisionId: string,
  ) {
    return this.context.evidenceStore.getByDecisionId(
      decisionId,
    );
  }

  getEvidenceByAgent(
    agentId: string,
  ) {
    return this.context.evidenceStore.getByAgent(
      agentId,
    );
  }


  getMetrics() {
    const monitor = new RuntimeMonitor(this.context.eventStore.getAll());

    return monitor.getMetrics();
  }

  getEventBus() {
    return this.events;
  }

  createAgent(id: string, config?: unknown) {
    return this.create(id, config);
  }

  runAgent(id: string, goal: string = "") {
    return this.execute({
      agentId: id,

      goal,
    });
  }

  startAgent(id: string, goal: string = "") {
    return this.runAgent(id, goal);
  }

  completeAgent(id: string) {
    const agent = this.context.agentRegistry.getAgent(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }

    const currentState = agent.getState().status;

    if (
      currentState === "completed" ||
      currentState === "failed" ||
      currentState === "stopped"
    ) {
      throw new Error(
        `Cannot complete agent from terminal state: ${currentState}`,
      );
    }

    this.context.lifecycle.complete(id);

    return {
      agentId: id,
      status: "COMPLETED",
      finishedAt: new Date(),
    };
  }

  failAgent(id: string, error?: unknown) {
    const agent = this.context.agentRegistry.getAgent(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }

    const currentState = agent.getState().status;

    if (
      currentState === "completed" ||
      currentState === "failed" ||
      currentState === "stopped"
    ) {
      throw new Error(`Cannot fail agent from terminal state: ${currentState}`);
    }

    const reason =
      error instanceof Error
        ? error.message
        : String(error ?? "Agent execution failed");

    this.context.lifecycle.fail(id, reason);

    return {
      agentId: id,
      status: "FAILED",
      error,
    };
  }

  stopAgent(id: string) {
    const agent = this.context.agentRegistry.getAgent(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }

    const currentState = agent.getState().status;

    if (
      currentState === "completed" ||
      currentState === "failed" ||
      currentState === "stopped"
    ) {
      throw new Error(`Cannot stop agent from terminal state: ${currentState}`);
    }

    if ((agent as { status?: string }).status === "idle") {
      this.context.lifecycle.start(id);
    }

    this.context.lifecycle.stop(id);

    return {
      agentId: id,
      status: "STOPPED",
    };
  }

  /**
   * Canonical executor access for runtime integration and diagnostics.
   */
  getExecutor() {
    return this.executor;
  }

}
