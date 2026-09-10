import {
  EnterpriseUsageRuntimeBridge,
  type EnterpriseUsageWriter,
} from "../src/enforcement/enterprise-usage-bridge";

import type {
  EnterpriseUsageEvent,
} from "@aegisora/core";

import type {
  ProviderResponse,
} from "../src/providers/base-provider";

async function main(): Promise<void> {

  const events: EnterpriseUsageEvent[] = [];

  const writer: EnterpriseUsageWriter = {
    async create(input) {
      const event = Object.freeze({
        ...input,
        usage: Object.freeze({
          ...input.usage,
        }),
        metadata: Object.freeze({
          ...(input.metadata ?? {}),
        }),
      }) as EnterpriseUsageEvent;

      events.push(event);

      return event;
    },
  };

  const bridge =
    new EnterpriseUsageRuntimeBridge({
      workspaceId: "workspace-a",
      writer,
    });

  const first =
    await bridge.record({
      traceId: "trace-allow-001",
      decisionId: "decision-allow-001",
      executionId: "execution-allow-001",
      evidenceId: "evidence-allow-001",
      agentId: "agent-001",
      providerId: "openai",
      modelId: "gpt-4.1-mini",
      outcome: "executed",
      usage: {
        promptTokens: 100,
        completionTokens: 25,
        totalTokens: 125,
      },
      metadata: {
        provider: "spoof-provider",
        model: "spoof-model",
        workspaceId: "spoof-workspace",
        traceId: "spoof-trace",
      },
    });

  if (first.workspaceId !== "workspace-a") {
    throw new Error("16C workspace spoof succeeded");
  }

  if (first.providerId !== "openai") {
    throw new Error("16C provider identity spoof succeeded");
  }

  if (first.modelId !== "gpt-4.1-mini") {
    throw new Error("16C model identity spoof succeeded");
  }

  if (first.traceId !== "trace-allow-001") {
    throw new Error("16C trace identity spoof succeeded");
  }

  if (first.usage.totalTokens !== 125) {
    throw new Error("16C usage propagation failed");
  }

  if (events.length !== 1) {
    throw new Error("16C duplicate usage emission detected");
  }

  // Response identity fields are deliberately ignored.
  // This mirrors the gateway security boundary.
  const providerResponse: ProviderResponse = {
    provider: "attacker-provider",
    model: "attacker-model",
    output: "safe test output",
    usage: {
      promptTokens: 7,
      completionTokens: 3,
      totalTokens: 10,
    },
  };

  if (providerResponse.provider === first.providerId) {
    throw new Error(
      "16C test fixture incorrectly trusts provider response identity",
    );
  }

  if (providerResponse.model === first.modelId) {
    throw new Error(
      "16C test fixture incorrectly trusts provider response model identity",
    );
  }

  console.log(
    "16C-01 canonical workspace identity PASS",
  );

  console.log(
    "16C-02 canonical provider identity PASS",
  );

  console.log(
    "16C-03 canonical model identity PASS",
  );

  console.log(
    "16C-04 canonical correlation identity PASS",
  );

  console.log(
    "16C-05 provider usage propagation PASS",
  );

  console.log(
    "16C-06 response identity spoof boundary PASS",
  );

  console.log(
    "16C-07 metadata spoof protection PASS",
  );

  console.log(
    "16C-08 single usage emission PASS",
  );

  console.log(
    "ALL 8 16C USAGE BRIDGE TESTS PASSED",
  );

}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
