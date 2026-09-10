import assert from "node:assert/strict";

import {
  SupabaseEnterpriseUsageProjectionWriter,
  type SupabaseUsageProjectionRpcClient,
} from "../src/usage/supabase-usage-projection-writer";

async function main(): Promise<void> {

  const event = {
    eventId: "usage-001",
    workspaceId: "workspace-a",
  } as never;

  const projectionWindow = {
    startAt: "2026-01-10T00:00:00.000Z",
    endAt: "2026-01-11T00:00:00.000Z",
  };

  const calls: Array<{
    functionName: string;
    params: Record<string, unknown>;
  }> = [];

  const client: SupabaseUsageProjectionRpcClient = {
    async rpc(
      functionName,
      params = {},
    ) {
      calls.push({
        functionName,
        params,
      });

      return {
        data: {
          status: "applied",
          event_id: "usage-001",
        },
        error: null,
      };
    },
  };

  const writer =
    new SupabaseEnterpriseUsageProjectionWriter({
      client,
    });

  const applied =
    await writer.project(
      event,
      projectionWindow,
    );

  assert.equal(applied.status, "applied");
  assert.equal(calls.length, 1);
  assert.equal(
    calls[0].functionName,
    "project_enterprise_usage_event",
  );
  assert.equal(
    calls[0].params.p_event_id,
    "usage-001",
  );
  assert.equal(
    calls[0].params.p_workspace_id,
    "workspace-a",
  );
  assert.equal(
    calls[0].params.p_window_start,
    projectionWindow.startAt,
  );
  assert.equal(
    calls[0].params.p_window_end,
    projectionWindow.endAt,
  );

  console.log("16E-B-01 canonical RPC invocation PASS");

  const duplicateWriter =
    new SupabaseEnterpriseUsageProjectionWriter({
      client: {
        async rpc() {
          return {
            data: {
              status: "duplicate",
              event_id: "usage-001",
            },
            error: null,
          };
        },
      },
    });

  const duplicate =
    await duplicateWriter.project(
      event,
      projectionWindow,
    );

  assert.equal(duplicate.status, "duplicate");

  console.log("16E-B-02 duplicate result preserved PASS");

  const ignoredWriter =
    new SupabaseEnterpriseUsageProjectionWriter({
      client: {
        async rpc() {
          return {
            data: {
              status: "ignored",
              event_id: "usage-001",
            },
            error: null,
          };
        },
      },
    });

  const ignored =
    await ignoredWriter.project(
      event,
      projectionWindow,
    );

  assert.equal(ignored.status, "ignored");

  console.log("16E-B-03 ignored result preserved PASS");

  const failureWriter =
    new SupabaseEnterpriseUsageProjectionWriter({
      client: {
        async rpc() {
          return {
            data: null,
            error: {
              message: "database unavailable",
            },
          };
        },
      },
    });

  await assert.rejects(
    () =>
      failureWriter.project(
        event,
        projectionWindow,
      ),
    /database unavailable/,
  );

  console.log("16E-B-04 persistence failure propagation PASS");

  await assert.rejects(
    () =>
      writer.project(
        event,
        {
          startAt: "2026-01-11T00:00:00.000Z",
          endAt: "2026-01-10T00:00:00.000Z",
        },
      ),
    /greater than/,
  );

  console.log("16E-B-05 invalid window fail-closed PASS");

  console.log("ALL 5 16E-B WRITER TESTS PASSED");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
