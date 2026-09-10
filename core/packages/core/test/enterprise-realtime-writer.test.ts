import assert from "node:assert/strict";
import test from "node:test";

import {
  SupabaseEnterpriseRealtimeWriter,
  toSupabaseRealtimeRow,
} from "../../runtime/src/events/supabase-realtime-writer";

import type {
  EnterpriseRealtimeEvent,
} from "../src/enterprise/realtime";

function createEvent(
  workspaceId = "workspace-a",
): EnterpriseRealtimeEvent {
  return Object.freeze({
    id: `realtime-event-${workspaceId}`,
    workspaceId,
    type: "execution.blocked",
    traceId: "trace-001",
    decisionId: "decision-001",
    executionId: "execution-001",
    evidenceId: "evidence-001",
    agentId: "agent-001",
    actorId: "actor-001",
    action: "tool.execute",
    decision: "BLOCK",
    riskScore: 97,
    timestamp: new Date("2026-09-07T18:00:00.000Z"),
    metadata: Object.freeze({
      source: "runtime",
      reason: "policy",
    }),
  });
}

test("13D-C - canonical event serializes to persistence row", () => {
  const row = toSupabaseRealtimeRow(
    createEvent(),
  );

  assert.equal(
    row.event_id,
    "realtime-event-workspace-a",
  );

  assert.equal(
    row.workspace_id,
    "workspace-a",
  );

  assert.equal(
    row.event_type,
    "execution.blocked",
  );

  assert.equal(
    row.trace_id,
    "trace-001",
  );

  assert.equal(
    row.decision_id,
    "decision-001",
  );

  assert.equal(
    row.execution_id,
    "execution-001",
  );

  assert.equal(
    row.evidence_id,
    "evidence-001",
  );

  assert.equal(
    row.agent_id,
    "agent-001",
  );

  assert.equal(
    row.actor_id,
    "actor-001",
  );

  assert.equal(
    row.action,
    "tool.execute",
  );

  assert.equal(
    row.decision,
    "BLOCK",
  );

  assert.equal(
    row.risk_score,
    97,
  );

  assert.equal(
    row.occurred_at,
    "2026-09-07T18:00:00.000Z",
  );

  assert.deepEqual(
    row.metadata,
    {
      source: "runtime",
      reason: "policy",
    },
  );
});

test("13D-C - writer publishes exactly one canonical row", async () => {
  const rows: Record<string, unknown>[] = [];

  let requestedTable = "";

  const client: SupabaseRealtimeInsertClient = {
    from(table: string) {
      requestedTable = table;

      return {
        async insert(
          row: Record<string, unknown>,
        ) {
          rows.push(row);

          return {
            error: null,
          };
        },
      };
    },
  };

  const writer =
    new SupabaseEnterpriseRealtimeWriter({
      client,
    });

  await writer.publish(createEvent());

  assert.equal(
    requestedTable,
    "enterprise_realtime_events",
  );

  assert.equal(
    rows.length,
    1,
  );

  assert.equal(
    rows[0]?.event_id,
    "realtime-event-workspace-a",
  );

  assert.equal(
    rows[0]?.workspace_id,
    "workspace-a",
  );

  assert.equal(
    rows[0]?.decision,
    "BLOCK",
  );
});

test("13D-C - writer propagates persistence failure", async () => {
  const client: SupabaseRealtimeInsertClient = {
    from() {
      return {
        async insert() {
          return {
            error: new Error(
              "database unavailable",
            ),
          };
        },
      };
    },
  };

  const writer =
    new SupabaseEnterpriseRealtimeWriter({
      client,
    });

  await assert.rejects(
    () => writer.publish(createEvent()),
    /Failed to persist enterprise realtime event/,
  );
});

test("13D-C - writer preserves workspace identity", async () => {
  const rows: Record<string, unknown>[] = [];

  const client: SupabaseRealtimeInsertClient = {
    from() {
      return {
        async insert(
          row: Record<string, unknown>,
        ) {
          rows.push(row);

          return {
            error: null,
          };
        },
      };
    },
  };

  const writer =
    new SupabaseEnterpriseRealtimeWriter({
      client,
    });

  await writer.publish(
    createEvent("workspace-a"),
  );

  await writer.publish(
    createEvent("workspace-b"),
  );

  assert.deepEqual(
    rows.map(
      (row) => row.workspace_id,
    ),
    [
      "workspace-a",
      "workspace-b",
    ],
  );
});
