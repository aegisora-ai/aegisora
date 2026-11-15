import { randomUUID } from "node:crypto";
import { AgentRuntime } from "@aegisora/runtime";

import type {
  AgentInput,
  AgentResponse,
  ProtectedAgent,
  ProtectableAgent,
} from "./types";

export class Aegisora {
  /**
   * @deprecated This protects only the top-level run invocation. It does not
   * automatically intercept tools called internally by the wrapped agent.
   * Use AegisoraClient.protectTools() for per-tool runtime enforcement.
   */
  static protect(agent: ProtectableAgent): ProtectedAgent {
    const runtime = new AgentRuntime();
    const agentId = `aegisora-sdk-${randomUUID()}`;
    runtime.create(agentId);

    return {
      async run(input: AgentInput): Promise<AgentResponse> {
        const result = await runtime.runProtectedAgent(
          agentId,
          input.input,
          async (value) => agent.run(value),
        );
        const output = typeof result.output === "string"
          ? result.output
          : JSON.stringify(result.output) ?? String(result.output);
        return {
          output,
          timestamp: new Date(),
        };
      },
    };
  }
}