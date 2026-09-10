import assert from "node:assert/strict";

import {
  EnterpriseUsageRuntimeBridge,
  type EnterpriseUsageWriter,
} from "../src/enforcement/enterprise-usage-bridge";

import {
  DefaultEnterpriseUsagePipeline,
} from "../src/usage/enterprise-usage-pipeline";

import type {
  EnterpriseUsageEvent,
} from "@aegisora/core";

import {
  SupabaseEnterpriseUsageProjectionWriter,
} from "../src/usage/supabase-usage-projection-writer";

class ProjectionClient {
  readonly calls: Array<{
    readonly functionName: string;
    readonly params?: Record<string, unknown>;
  }> = [];

  async rpc(
    functionName: string,
    params?: Record<string, unknown>,
  ) {
    this.calls.push({
      functionName,
      params,
    });

    return {
      data: {
        status: "applied",
      },
      error: null,
    };
  }
}

function createWriter(
  events: EnterpriseUsageEvent[],
): EnterpriseUsageWriter {
  return {
    async create(input) {
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

      events.push(event);

      return event;
    },
  };
}

async function main(): Promise<void> {
  // ----------------------------------------------------------
  // 01 first event
  // ----------------------------------------------------------

  const events: EnterpriseUsageEvent[] = [];

  const bridge =
    new EnterpriseUsageRuntimeBridge({
      workspaceId: "workspace-16ec",
      writer: createWriter(events),
    });

  const projectionClient =
    new ProjectionClient();

  const projectionWriter =
    new SupabaseEnterpriseUsageProjectionWriter({
      client: projectionClient,
    });

  const pipeline =
    new DefaultEnterpriseUsagePipeline(
      bridge,
      projectionWriter,
    );

  const result =
    await pipeline.persist(
      {
        traceId: "trace-16ec-001",
        decisionId: "decision-16ec-001",
        executionId: "execution-16ec-001",
        evidenceId: "evidence-16ec-001",
        agentId: "agent-16ec-001",
        providerId: "openai",
        modelId: "gpt-4.1-mini",
        outcome: "executed",
        usage: {
          promptTokens: 100,
          completionTokens: 25,
          totalTokens: 125,
        },
        metadata: {
          source: "pipeline-test",
        },
      },
      {
        startAt: "2026-09-08T00:00:00.000Z",
        endAt: "2026-09-09T00:00:00.000Z",
      },
    );

  assert.equal(
    result.event.workspaceId,
    "workspace-16ec",
  );

  assert.equal(
    result.event.providerId,
    "openai",
  );

  assert.equal(
    result.event.modelId,
    "gpt-4.1-mini",
  );

  assert.equal(
    result.event.usage.totalTokens,
    125,
  );

  assert.equal(
    result.projection.status,
    "applied",
  );

  assert.equal(
    projectionClient.calls.length,
    1,
  );

  assert.equal(
    projectionClient.calls[0]?.functionName,
    "project_enterprise_usage_event",
  );

  assert.equal(
    events.length,
    1,
  );

  console.log(
    "16E-C-02-01 ledger -> projection pipeline PASS",
  );

  // ----------------------------------------------------------
  // 02 projection receives canonical ledger identity
  // ----------------------------------------------------------

  const params =
    projectionClient.calls[0]?.params;

  assert.ok(params);

  assert.equal(
    params?.p_event_id,
    result.event.eventId,
  );

  assert.equal(
    params?.p_workspace_id,
    "workspace-16ec",
  );

  console.log(
    "16E-C-02-02 canonical event identity to projection PASS",
  );

  // ----------------------------------------------------------
  // 03 no caller identity rewrite
  // ----------------------------------------------------------

  const second =
    await pipeline.persist(
      {
        traceId: "trace-16ec-002",
        decisionId: "decision-16ec-002",
        executionId: "execution-16ec-002",
        evidenceId: "evidence-16ec-002",
        agentId: "agent-16ec-002",
        providerId: "openai",
        modelId: "gpt-4.1-mini",
        outcome: "executed",
        usage: {
          promptTokens: 20,
          completionTokens: 5,
          totalTokens: 25,
        },
        metadata: {
          workspaceId: "attacker-workspace",
          providerId: "attacker-provider",
          modelId: "attacker-model",
        },
      },
      {
        startAt: "2026-09-08T00:00:00.000Z",
        endAt: "2026-09-09T00:00:00.000Z",
      },
    );

  assert.equal(
    second.event.workspaceId,
    "workspace-16ec",
  );

  assert.equal(
    second.event.providerId,
    "openai",
  );

  assert.equal(
    second.event.modelId,
    "gpt-4.1-mini",
  );

  console.log(
    "16E-C-02-03 canonical identity survives full pipeline PASS",
  );

  console.log("");
  console.log(
    "ALL 3 16E-C-02 PIPELINE TESTS PASSED",
  );
}

main().catch(
  (error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  },
);