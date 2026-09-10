import type {
  AgentHeartbeat,
  AgentId,
  RegisterAgentInput,
  RegisteredAgent,
} from "./types";

export interface AgentRegistry {
  register(input: RegisterAgentInput): RegisteredAgent;

  getById(
    workspaceId: string,
    agentId: AgentId,
  ): RegisteredAgent | null;

  list(
    workspaceId: string,
  ): readonly RegisteredAgent[];

  heartbeat(
    heartbeat: AgentHeartbeat,
  ): RegisteredAgent;

  suspend(
    workspaceId: string,
    agentId: AgentId,
    at?: string,
  ): RegisteredAgent;

  deprecate(
    workspaceId: string,
    agentId: AgentId,
    at?: string,
  ): RegisteredAgent;
}

export class InMemoryAgentRegistry implements AgentRegistry {
  private readonly agents = new Map<string, RegisteredAgent>();

  register(input: RegisterAgentInput): RegisteredAgent {

    const key = `${input.workspaceId}:${input.id}`;

    const existing = this.agents.get(key);

    if (existing) {
      if (
        existing.status === "deprecated" ||
        existing.status === "unregistered"
      ) {
        throw new Error(
          `Agent ${input.id} cannot be re-registered from status ${existing.status}.`,
        );
      }

      const updated: RegisteredAgent = {
        ...existing,
        metadata: input.metadata,
        declaredTools: [
          ...(input.declaredTools ?? existing.declaredTools),
        ],
        declaredProviders: [
          ...(input.declaredProviders ?? existing.declaredProviders),
        ],
        updatedAt: new Date().toISOString(),
      };

      this.agents.set(key, updated);

      return updated;
    }

    const now = input.createdAt ?? new Date().toISOString();

    const agent: RegisteredAgent = {
      id: input.id,
      workspaceId: input.workspaceId,
      metadata: input.metadata,
      status: "active",
      declaredTools: [...(input.declaredTools ?? [])],
      declaredProviders: [...(input.declaredProviders ?? [])],
      createdAt: now,
      updatedAt: now,
    };

    this.agents.set(key, agent);

    return agent;
  }

  getById(
    workspaceId: string,
    id: AgentId,
  ): RegisteredAgent | null {

    return (
      this.agents.get(`${workspaceId}:${id}`) ??
      null
    );
  }

  list(
    workspaceId: string,
  ): readonly RegisteredAgent[] {

    const prefix = `${workspaceId}:`;

    return [...this.agents.values()].filter(
      (agent) =>
        `${agent.workspaceId}:${agent.id}`.startsWith(prefix),
    );
  }

  heartbeat(
    heartbeat: AgentHeartbeat,
  ): RegisteredAgent {

    const key = `${heartbeat.workspaceId}:${heartbeat.agentId}`;
    const current = this.agents.get(key);

    if (!current) {
      throw new Error(
        `Agent ${heartbeat.agentId} is not registered.`,
      );
    }

    if (current.status !== "active") {
      throw new Error(
        `Agent ${heartbeat.agentId} cannot heartbeat while status is ${current.status}.`,
      );
    }

    const updated: RegisteredAgent = {
      ...current,
      lastSeenAt: heartbeat.observedAt,
      updatedAt: heartbeat.observedAt,
    };

    this.agents.set(key, updated);

    return updated;
  }

  suspend(
    workspaceId: string,
    id: AgentId,
    at = new Date().toISOString(),
  ): RegisteredAgent {

    return this.changeStatus(
      workspaceId,
      id,
      "suspended",
      at,
    );
  }

  deprecate(
    workspaceId: string,
    id: AgentId,
    at = new Date().toISOString(),
  ): RegisteredAgent {

    return this.changeStatus(
      workspaceId,
      id,
      "deprecated",
      at,
    );
  }

  private changeStatus(
    workspaceId: string,
    id: AgentId,
    status: RegisteredAgent["status"],
    at: string,
  ): RegisteredAgent {

    const key = `${workspaceId}:${id}`;
    const current = this.agents.get(key);

    if (!current) {
      throw new Error(
        `Agent ${id} is not registered in workspace ${workspaceId}.`,
      );
    }

    const updated: RegisteredAgent = {
      ...current,
      status,
      updatedAt: at,
    };

    this.agents.set(key, updated);

    return updated;
  }
}
