export {
  InMemoryAgentRegistry,
  type AgentRegistry,
} from "./registry";

export {
  discoverAgents,
} from "./discovery";

export type {
  AgentId,
  AgentStatus,
  AgentEnvironment,
  AgentOwner,
  AgentMetadata,
  RegisteredAgent,
  RegisterAgentInput,
  AgentHeartbeat,
  AgentDiscoveryQuery,
} from "./types";

export {
  agentId,
} from "./types";
