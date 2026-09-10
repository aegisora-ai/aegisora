import assert from "node:assert/strict";

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
  EnterpriseUsageWriter,
} from "../src/enforcement/enterprise-usage-bridge";

import {
  EnterpriseUsagePipelineWriter,
} from "../src/usage/enterprise-usage-pipeline-writer";

import {
  SupabaseEnterpriseUsageProjectionWriter,
} from "../src/usage/supabase-usage-projection-writer";

import type {
  EnterpriseUsageEvent,
  CreateEnterpriseUsageEventInput,
} from "@aegisora/core";

class ProviderSpy extends BaseProvider {
  readonly name = "openai";

  calls = 0;

  async generate(
    request: ProviderRequest,
    _context?: ProviderRuntimeContext,
  ): Promise<ProviderResponse> {
    this.calls++;

    return {
      provider: "attacker-provider",
      model: "attacker-model",
      output: `16E-C-03:${request.prompt}`,
      usage: {
        promptTokens: 100,
        completionTokens: 25,
        totalTokens: 125,
      },
    };
  }
}

class LedgerSpy
  implements EnterpriseUsageWriter
{
  readonly events: EnterpriseUsageEvent[] = [];

  async create(
    input: CreateEnterpriseUsageEventInput,
  ): Promise<EnterpriseUsageEvent> {
    const event: EnterpriseUsageEvent =
      Object.freeze({
        ...input,
        usage: Object.freeze({
          ...input.usage,
        }),
        metadata: Object.freeze({
          ...(input.metadata ?? {}),
        }),
      });

    this.events.push(event);

    return event;
  }
}

class ProjectionSpy {
  readonly calls: Array<{
    readonly eventId: string;
    readonly workspaceId: string;
  }> = [];

  async project(
    event: EnterpriseUsageEvent,
    _window: {
      startAt: string;
      endAt: string;
    },
  ) {
    this.calls.push({
      eventId: event.eventId,
      workspaceId: event.workspaceId,
    });

    return Object.freeze({
      status: "applied" as const,
      eventId: event.eventId,
    });
  }
}

function expectDecision(
  error: unknown,
  decision: "BLOCK" | "ESCALATE",
): void {
  assert.ok(error instanceof Error);

  assert.match(
    error.message,
    new RegExp(
      `\\[ENFORCEMENT:${decision}\\]`,
    ),
  );
}

async function main(): Promise<void> {
  const context =
    new RuntimeContext();

  const executionToken =
    Symbol("16e-c-03-execution");

  const router =
    new ProviderRouter(
      executionToken,
    );

  const provider =
    new ProviderSpy();

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
    "16e-c-03-gateway-agent";

  context.agentRegistry.register({
    id: agentId,
    name: "16E-C-03 Gateway Agent",
    status: "idle",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  const ledger =
    new LedgerSpy();

  const projection =
    new ProjectionSpy();

  /*
   * Adapter boundary: the real projection writer is not
   * needed here because we want to prove gateway composition
   * against the projection writer contract.
   *
   * We intentionally use a tiny compatible spy and validate
   * the exact gateway → writer → projection sequence.
   */

  const pipelineWriter =
    new EnterpriseUsagePipelineWriter({
      ledgerWriter: ledger,
      projectionWriter:
        projection as unknown as SupabaseEnterpriseUsageProjectionWriter,
      window: {
        startAt:
          "2026-09-08T00:00:00.000Z",
        endAt:
          "2026-09-09T00:00:00.000Z",
      },
    });

  gateway.configureEnterpriseUsage({
    workspaceId:
      "workspace-16e-c03",
    writer:
      pipelineWriter,
  });

  // ----------------------------------------------------------
  // ALLOW
  // ----------------------------------------------------------

  const allowed =
    await gateway.generate({
      agentId,
      provider: "openai",
      request: {
        model:
          "16e-canonical-model",
        prompt:
          "16E-C-03 production composition",
      },
      metadata: {
        provider:
          "attacker-provider",
        model:
          "attacker-model",
        workspaceId:
          "attacker-workspace",
      },
    });

  assert.equal(
    allowed.output,
    "16E-C-03:16E-C-03 production composition",
  );

  assert.equal(
    provider.calls,
    1,
  );

  assert.equal(
    ledger.events.length,
    1,
  );

  assert.equal(
    projection.calls.length,
    1,
  );

  const event =
    ledger.events[0];

  assert.ok(event);

  assert.equal(
    event.workspaceId,
    "workspace-16e-c03",
  );

  assert.equal(
    event.providerId,
    "openai",
  );

  assert.equal(
    event.modelId,
    "16e-canonical-model",
  );

  assert.equal(
    event.usage.totalTokens,
    125,
  );

  assert.equal(
    projection.calls[0]?.eventId,
    event.eventId,
  );

  assert.equal(
    projection.calls[0]?.workspaceId,
    "workspace-16e-c03",
  );

  console.log(
    "16E-C-03-01 ALLOW → gateway → ledger → projection PASS",
  );

  // ----------------------------------------------------------
  // Identity spoof resistance
  // ----------------------------------------------------------

  assert.notEqual(
    event.providerId,
    "attacker-provider",
  );

  assert.notEqual(
    event.modelId,
    "attacker-model",
  );

  assert.equal(
    event.workspaceId,
    "workspace-16e-c03",
  );

  console.log(
    "16E-C-03-02 canonical identity survives gateway pipeline PASS",
  );

  // ----------------------------------------------------------
  // BLOCK
  // ----------------------------------------------------------

  const providerBeforeBlock =
    provider.calls;

  const ledgerBeforeBlock =
    ledger.events.length;

  const projectionBeforeBlock =
    projection.calls.length;

  await assert.rejects(
    gateway.generate({
      agentId,
      provider:
        "unknown-provider" as never,
      request: {
        prompt:
          "blocked usage request",
      },
    }),
    (error: unknown) => {
      expectDecision(
        error,
        "BLOCK",
      );

      return true;
    },
  );

  assert.equal(
    provider.calls,
    providerBeforeBlock,
  );

  assert.equal(
    ledger.events.length,
    ledgerBeforeBlock,
  );

  assert.equal(
    projection.calls.length,
    projectionBeforeBlock,
  );

  console.log(
    "16E-C-03-03 BLOCK → provider=0 ledger=0 projection=0 PASS",
  );

  // ----------------------------------------------------------
  // ESCALATE
  // ----------------------------------------------------------

  const providerBeforeEscalate =
    provider.calls;

  const ledgerBeforeEscalate =
    ledger.events.length;

  const projectionBeforeEscalate =
    projection.calls.length;

  await assert.rejects(
    gateway.generate({
      agentId,
      provider: "openai",
      request: {
        prompt:
          "escalated usage request",
      },
      metadata: {
        requiresReview: true,
      },
    }),
    (error: unknown) => {
      expectDecision(
        error,
        "ESCALATE",
      );

      return true;
    },
  );

  assert.equal(
    provider.calls,
    providerBeforeEscalate,
  );

  assert.equal(
    ledger.events.length,
    ledgerBeforeEscalate,
  );

  assert.equal(
    projection.calls.length,
    projectionBeforeEscalate,
  );

  console.log(
    "16E-C-03-04 ESCALATE → provider=0 ledger=0 projection=0 PASS",
  );

  console.log("");
  console.log(
    "ALL 4 16E-C-03 GATEWAY COMPOSITION TESTS PASSED",
  );
}

main().catch(
  (error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  },
);