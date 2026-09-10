import assert from "node:assert/strict";
import test from "node:test";

import {
  createSupabaseServerClient,
  isSupabaseServerEnvironment,
} from "../../runtime/src/events/supabase-server-client";

test("13E - server environment is detected", () => {
  assert.equal(
    isSupabaseServerEnvironment(),
    true,
  );
});

test("13E - missing URL fails closed", () => {
  assert.throws(
    () =>
      createSupabaseServerClient({
        url: "",
        serviceRoleKey: "test-service-role-key",
      }),
    /SUPABASE_URL/,
  );
});

test("13E - missing service role key fails closed", () => {
  assert.throws(
    () =>
      createSupabaseServerClient({
        url: "https://example.supabase.co",
        serviceRoleKey: "",
      }),
    /SUPABASE_SERVICE_ROLE_KEY/,
  );
});

test("13E - injected credentials create a client", () => {
  const client =
    createSupabaseServerClient({
      url: "https://example.supabase.co",
      serviceRoleKey: "test-service-role-key",
    });

  assert.ok(client);

  assert.equal(
    typeof client.from,
    "function",
  );
});

test("13E - factory does not mutate environment", () => {
  const beforeUrl =
    process.env.SUPABASE_URL;

  const beforeKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY;

  createSupabaseServerClient({
    url: "https://example.supabase.co",
    serviceRoleKey: "test-service-role-key",
  });

  assert.equal(
    process.env.SUPABASE_URL,
    beforeUrl,
  );

  assert.equal(
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    beforeKey,
  );
});
