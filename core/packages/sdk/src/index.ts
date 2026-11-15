export { AegisoraClient } from "./client/aegisora-client";

export { SDKAgent } from "./agent/sdk-agent";

export { Aegisora } from "./aegisora";

export { protect } from "./protect";
export { protectTools } from "./integration/protect-tools";

export type {
  AegisoraTaskContract,
  AegisoraToolDefinition,
  ProtectedAegisoraTool,
  ProtectToolsOptions,
} from "./integration/types";

export type {
AgentInput,
AgentResponse,
ProtectedAgent
} from "./types";

export type {
AgentConfig
} from "./client/aegisora-client";

export type {
SDKAgentConfig
} from "./agent/sdk-agent";
