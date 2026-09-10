import type { WorkspaceId } from "../access";

export type AgentId = string & {
  readonly __brand: "AegisoraAgentId";
};

export type AgentStatus =
  | "active"
  | "suspended"
  | "deprecated"
  | "unregistered";

export type AgentEnvironment =
  | "production"
  | "staging"
  | "development"
  | "restricted";

export interface AgentOwner {
  readonly userId: string;
}

export interface AgentMetadata {
  readonly name: string;
  readonly description?: string;
  readonly environment: AgentEnvironment;
  readonly owner: AgentOwner;
  readonly tags: readonly string[];
}

export interface RegisteredAgent {
  readonly id: AgentId;
  readonly workspaceId: WorkspaceId;
  readonly metadata: AgentMetadata;
  readonly status: AgentStatus;
  readonly declaredTools: readonly string[];
  readonly declaredProviders: readonly string[];
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly lastSeenAt?: string;
}

export interface RegisterAgentInput {
  readonly id: AgentId;
  readonly workspaceId: WorkspaceId;
  readonly metadata: AgentMetadata;
  readonly declaredTools?: readonly string[];
  readonly declaredProviders?: readonly string[];
  readonly createdAt?: string;
}

export interface AgentHeartbeat {
  readonly agentId: AgentId;
  readonly workspaceId: WorkspaceId;
  readonly observedAt: string;
}

export interface AgentDiscoveryQuery {
  readonly workspaceId: WorkspaceId;
  readonly status?: AgentStatus;
  readonly environment?: AgentEnvironment;
  readonly tag?: string;
  readonly tool?: string;
  readonly provider?: string;
  readonly search?: string;
}

export function agentId(value: string): AgentId {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error("agentId must not be empty");
  }

  if (normalized.length > 128) {
    throw new Error("agentId must not exceed 128 characters");
  }

  return normalized as AgentId;
}
