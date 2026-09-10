import {
  ProviderExecutionGateway,
} from "../src/providers/provider-execution-gateway";

import {
  ProviderRouter,
} from "../src/providers/provider-router";

import {
  RuntimeContext,
} from "../src/context/runtime-context";

import {
  BaseProvider,
  type ProviderRequest,
  type ProviderResponse,
} from "../src/providers/base-provider";

import type {
  ProviderRuntimeContext,
} from "../src/types/context";

import {
  EnterpriseUsageRuntimeBridge,
  type EnterpriseUsageWriter,
} from "../src/enforcement/enterprise-usage-bridge";

import type {
  EnterpriseUsageEvent,
} from "@aegisora/core";

import assert from "node:assert/strict";

class UsageSpyProvider extends BaseProvider {
  readonly name = "openai";

  calls = 0;

  readonly requests: ProviderRequest[] = [];

  async generate(
    request: ProviderRequest,
    _context?: ProviderRuntimeContext,
  ): Promise<ProviderResponse> {
    this.calls++;

    this.requests.push(request);

    return {
      provider: "attacker-provider",
      model: "attacker-model",
      output: `USAGE-E2E:${request.prompt}`,
      usage: {
        promptTokens: 100,
        completionTokens: 25,
        totalTokens: 125,
      },
    };
  }
}

function expectEnforcementError(
  error: unknown,
  decision: "BLOCK" | "ESCALATE",
): void {
  assert.ok(
    error instanceof Error,
    "Expected Error",
  );

  assert.match(
    error.message,
    new RegExp(
      `\\[ENFORCEMENT:${decision}\\]`,
    ),
  );
}

async function main(): Promise<void> {
  const context = new RuntimeContext();

  const executionToken = Symbol(
    "aegisora.3.0.16c.execution",
  );

  const router =
    new ProviderRouter(
      executionToken,
    );

  const provider =
    new UsageSpyProvider();

  router.register(
    "openai",
    provider,
  );

  const gateway =
    new ProviderExecutionGateway(
      context,
      router,
      undefined,
      undefined,
      executionToken,
    );

  const agentId =
    "3.0-16C-gateway-agent";

  context.agentRegistry.register({
    id: agentId,
    name: "3.0-16C Gateway Usage Agent",
    status: "idle",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const events: EnterpriseUsageEvent[] = [];

  const writer: EnterpriseUsageWriter = {
    create(input) {
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

  gateway.configureEnterpriseUsage({
    workspaceId: "workspace-16c",
    writer,
  });

  // ==========================================================
  // ALLOW
  // ==========================================================

  const allowed =
    await gateway.generate({
      agentId,
      provider: "openai",
      request: {
        model: "trace16c-canonical-model",
        prompt: "16C canonical usage proof",
      },
      metadata: {
        provider: "attacker-provider",
        model: "attacker-model",
        providerId: "attacker-provider-id",
        modelId: "attacker-model-id",
        workspaceId: "attacker-workspace",
      },
    });

  assert.equal(
    allowed.output,
    "USAGE-E2E:16C canonical usage proof",
  );

  assert.equal(
    provider.calls,
    1,
    "ALLOW must invoke provider exactly once",
  );

  assert.equal(
    events.length,
    1,
    "ALLOW with provider usage must create exactly one usage event",
  );

  const allowEvent = events[0];

  assert.ok(
    allowEvent,
    "ALLOW usage event missing",
  );

  assert.equal(
    allowEvent.workspaceId,
    "workspace-16c",
    "Usage workspace must come from enterprise configuration",
  );

  assert.equal(
    allowEvent.agentId,
    agentId,
    "Usage agent identity mismatch",
  );

  assert.equal(
    allowEvent.providerId,
    "openai",
    "Usage provider identity must come from gateway",
  );

  assert.equal(
    allowEvent.modelId,
    "trace16c-canonical-model",
    "Usage model identity must come from gateway",
  );

  assert.notEqual(
    allowEvent.providerId,
    "attacker-provider",
    "Provider response/metadata must never redirect usage identity",
  );

  assert.notEqual(
    allowEvent.modelId,
    "attacker-model",
    "Provider response/metadata must never redirect usage model",
  );

  assert.equal(
    allowEvent.usage.promptTokens,
    100,
  );

  assert.equal(
    allowEvent.usage.completionTokens,
    25,
  );

  assert.equal(
    allowEvent.usage.totalTokens,
    125,
  );

  assert.ok(
    allowEvent.traceId.length > 0,
    "Canonical traceId missing",
  );

  assert.ok(
    allowEvent.decisionId.length > 0,
    "Canonical decisionId missing",
  );

  assert.ok(
    allowEvent.executionId.length > 0,
    "Canonical executionId missing",
  );

  assert.ok(
    allowEvent.evidenceId.length > 0,
    "Canonical evidenceId missing",
  );

  // ==========================================================
  // BLOCK
  // ==========================================================

  const callsBeforeBlock =
    provider.calls;

  const usageBeforeBlock =
    events.length;

  await assert.rejects(
    gateway.generate({
      agentId,
      provider:
        "unknown-provider" as never,
      request: {
        prompt: "16C BLOCK usage suppression",
      },
    }),
    (error: unknown) => {
      expectEnforcementError(
        error,
        "BLOCK",
      );

      return true;
    },
  );

  assert.equal(
    provider.calls,
    callsBeforeBlock,
    "BLOCK must not invoke provider",
  );

  assert.equal(
    events.length,
    usageBeforeBlock,
    "BLOCK must not create usage event",
  );

  // ==========================================================
  // ESCALATE
  // ==========================================================

  const callsBeforeEscalate =
    provider.calls;

  const usageBeforeEscalate =
    events.length;

  await assert.rejects(
    gateway.generate({
      agentId,
      provider: "openai",
      request: {
        prompt: "16C ESCALATE usage suppression",
      },
      metadata: {
        requiresReview: true,
      },
    }),
    (error: unknown) => {
      expectEnforcementError(
        error,
        "ESCALATE",
      );

      return true;
    },
  );

  assert.equal(
    provider.calls,
    callsBeforeEscalate,
    "ESCALATE must not invoke provider",
  );

  assert.equal(
    events.length,
    usageBeforeEscalate,
    "ESCALATE must not create usage event",
  );

  // ==========================================================
  // SECOND ALLOW
  // ==========================================================

  await gateway.generate({
    agentId,
    provider: "openai",
    request: {
      prompt: "16C second canonical usage proof",
    },
  });

  assert.equal(
    provider.calls,
    2,
    "Second ALLOW must invoke provider",
  );

  assert.equal(
    events.length,
    2,
    "Second ALLOW must create exactly one additional usage event",
  );

  const secondEvent = events[1];

  assert.ok(
    secondEvent,
    "Second usage event missing",
  );

  assert.equal(
    secondEvent.providerId,
    "openai",
  );

  assert.equal(
    secondEvent.modelId,
    "gpt-4.1-mini",
    "Default model must remain gateway-canonical",
  );

  assert.equal(
    secondEvent.usage.totalTokens,
    125,
  );

  // ==========================================================
  // FINAL
  // ==========================================================

  console.log(
    "16C-GW-01 ALLOW -> provider execution PASS",
  );

  console.log(
    "16C-GW-02 ProviderResponse.usage -> enterprise usage PASS",
  );

  console.log(
    "16C-GW-03 canonical workspace binding PASS",
  );

  console.log(
    "16C-GW-04 canonical provider identity PASS",
  );

  console.log(
    "16C-GW-05 canonical model identity PASS",
  );

  console.log(
    "16C-GW-06 correlation identifiers preserved PASS",
  );

  console.log(
    "16C-GW-07 provider response identity spoof blocked PASS",
  );

  console.log(
    "16C-GW-08 BLOCK -> provider=0 / usage=0 PASS",
  );

  console.log(
    "16C-GW-09 ESCALATE -> provider=0 / usage=0 PASS",
  );

  console.log(
    "16C-GW-10 default model usage remains canonical PASS",
  );

  console.log(
    "ALL 10 16C GATEWAY USAGE E2E TESTS PASSED",
  );

  console.log("");
  console.log(
    `Provider calls: ${provider.calls}`,
  );

  console.log(
    `Enterprise usage events: ${events.length}`,
  );

  console.log(
    `First usage tokens: ${events[0]?.usage.totalTokens}`,
  );

  console.log(
    `Second usage tokens: ${events[1]?.usage.totalTokens}`,
  );
}

main().catch(
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
