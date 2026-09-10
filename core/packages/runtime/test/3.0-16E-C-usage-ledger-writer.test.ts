import assert from "node:assert/strict";

import {
  SupabaseEnterpriseUsageLedgerWriter,
  toSupabaseUsageLedgerRow,
  type SupabaseUsageLedgerInsertClient,
} from "../src/usage/supabase-usage-ledger-writer";

import type {
  CreateEnterpriseUsageEventInput,
  EnterpriseUsageEvent,
} from "@aegisora/core";

type InsertCall = {
  readonly table: string;
  readonly row: Record<string, unknown>;
};

class RecordingClient
  implements SupabaseUsageLedgerInsertClient
{
  readonly inserts: InsertCall[] = [];

  failure: Error | null = null;

  from(table: string) {
    return {
      insert: async (
        row: Record<string, unknown>,
      ) => {
        this.inserts.push({
          table,
          row,
        });

        if (this.failure) {
          return {
            error: this.failure,
          };
        }

        return {
          error: null,
        };
      },
    };
  }
}

function createInput(): CreateEnterpriseUsageEventInput {
  return {
    eventId: "usage-event-001",
    workspaceId: "workspace-a",

    traceId: "trace-001",
    decisionId: "decision-001",
    executionId: "execution-001",
    evidenceId: "evidence-001",

    agentId: "agent-001",
    providerId: "openai",
    modelId: "gpt-4.1-mini",

    eventType: "provider.execution",
    outcome: "executed",

    usage: {
      promptTokens: 100,
      completionTokens: 25,
      totalTokens: 125,
    },

    createdAt: "2026-09-08T21:00:00.000Z",

    metadata: {
      source: "16E-C-01",
      provider: "spoof-provider",
      model: "spoof-model",
      workspaceId: "spoof-workspace",
    },
  };
}

async function main(): Promise<void> {
  // ----------------------------------------------------------
  // 01 canonical serialization
  // ----------------------------------------------------------

  const client = new RecordingClient();

  const writer =
    new SupabaseEnterpriseUsageLedgerWriter({
      client,
    });

  const input = createInput();

  const event =
    await writer.create(input);

  assert.equal(
    event.eventId,
    "usage-event-001",
  );

  assert.equal(
    event.workspaceId,
    "workspace-a",
  );

  assert.equal(
    event.providerId,
    "openai",
  );

  assert.equal(
    event.modelId,
    "gpt-4.1-mini",
  );

  console.log(
    "16E-C-WRITER-01 canonical event returned PASS",
  );

  // ----------------------------------------------------------
  // 02 correct table and row
  // ----------------------------------------------------------

  assert.equal(
    client.inserts.length,
    1,
  );

  const insert = client.inserts[0];

  assert.ok(insert);

  assert.equal(
    insert.table,
    "enterprise_usage_ledger",
  );

  assert.deepEqual(
    insert.row,
    {
      event_id: "usage-event-001",
      workspace_id: "workspace-a",

      trace_id: "trace-001",
      decision_id: "decision-001",
      execution_id: "execution-001",
      evidence_id: "evidence-001",

      agent_id: "agent-001",
      provider_id: "openai",
      model_id: "gpt-4.1-mini",

      event_type: "provider.execution",
      outcome: "executed",

      prompt_tokens: 100,
      completion_tokens: 25,
      total_tokens: 125,

      created_at: "2026-09-08T21:00:00.000Z",

      metadata: {
        source: "16E-C-01",
        provider: "spoof-provider",
        model: "spoof-model",
        workspaceId: "spoof-workspace",
      },
    },
  );

  console.log(
    "16E-C-WRITER-02 canonical Supabase row PASS",
  );

  // ----------------------------------------------------------
  // 03 identity remains canonical
  // ----------------------------------------------------------

  assert.notEqual(
    insert.row.provider_id,
    "spoof-provider",
  );

  assert.notEqual(
    insert.row.model_id,
    "spoof-model",
  );

  assert.equal(
    insert.row.workspace_id,
    "workspace-a",
  );

  assert.equal(
    insert.row.provider_id,
    "openai",
  );

  assert.equal(
    insert.row.model_id,
    "gpt-4.1-mini",
  );

  console.log(
    "16E-C-WRITER-03 canonical identity boundary PASS",
  );

  // ----------------------------------------------------------
  // 04 exported serializer is deterministic
  // ----------------------------------------------------------

  const serialized =
    toSupabaseUsageLedgerRow(
      event,
    );

  assert.deepEqual(
    serialized,
    insert.row,
  );

  console.log(
    "16E-C-WRITER-04 deterministic serializer PASS",
  );

  // ----------------------------------------------------------
  // 05 persistence failure propagation
  // ----------------------------------------------------------

  const failingClient =
    new RecordingClient();

  failingClient.failure =
    new Error(
      "simulated usage ledger outage",
    );

  const failingWriter =
    new SupabaseEnterpriseUsageLedgerWriter({
      client: failingClient,
    });

  await assert.rejects(
    failingWriter.create(
      createInput(),
    ),
    (error: unknown) => {
      assert.ok(
        error instanceof Error,
      );

      assert.match(
        error.message,
        /\[USAGE_LEDGER:PERSISTENCE\]/,
      );

      assert.match(
        error.message,
        /usage-event-001/,
      );

      return true;
    },
  );

  console.log(
    "16E-C-WRITER-05 persistence failure propagation PASS",
  );

  // ----------------------------------------------------------
  // 06 invalid identity fails before persistence
  // ----------------------------------------------------------

  const validationClient =
    new RecordingClient();

  const validationWriter =
    new SupabaseEnterpriseUsageLedgerWriter({
      client: validationClient,
    });

  const invalid = {
    ...createInput(),
    workspaceId: "",
  };

  await assert.rejects(
    validationWriter.create(
      invalid,
    ),
    (error: unknown) => {
      assert.ok(
        error instanceof Error,
      );

      assert.match(
        error.message,
        /\[USAGE_LEDGER:INVALID\]/,
      );

      return true;
    },
  );

  assert.equal(
    validationClient.inserts.length,
    0,
  );

  console.log(
    "16E-C-WRITER-06 fail-closed validation PASS",
  );

  console.log("");
  console.log(
    "ALL 6 16E-C PERSISTENT WRITER TESTS PASSED",
  );
}

main().catch(
  (error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  },
);