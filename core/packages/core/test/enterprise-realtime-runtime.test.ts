import assert from "node:assert/strict";
import test from "node:test";

import {
  createEnterpriseRealtimeServerRuntime,
} from "../../runtime/src/events/enterprise-realtime-runtime";

test("13F - composition requires server credentials", () => {
  assert.throws(
    () =>
      createEnterpriseRealtimeServerRuntime({
        supabaseUrl: "",
        supabaseServiceRoleKey: "",
      }),
    /SUPABASE_URL/,
  );
});

test("13F - composition creates bridge with injected server credentials", () => {
  const runtime =
    createEnterpriseRealtimeServerRuntime({
      supabaseUrl:
        "https://example.supabase.co",
      supabaseServiceRoleKey:
        "test-service-role-key",
    });

  assert.ok(runtime);
  assert.ok(runtime.bridge);

  assert.equal(
    runtime.bridge.listenerCount(),
    0,
  );
});

test("13F - composition bridge exposes subscription boundary", () => {
  const runtime =
    createEnterpriseRealtimeServerRuntime({
      supabaseUrl:
        "https://example.supabase.co",
      supabaseServiceRoleKey:
        "test-service-role-key",
    });

  let received = 0;

  const unsubscribe =
    runtime.bridge.subscribe(() => {
      received += 1;
    });

  assert.equal(
    runtime.bridge.listenerCount(),
    1,
  );

  unsubscribe();

  assert.equal(
    runtime.bridge.listenerCount(),
    0,
  );

  assert.equal(received, 0);
});
