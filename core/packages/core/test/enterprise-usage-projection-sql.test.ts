import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const sql = readFileSync(
  "supabase/migrations/019_enterprise_usage_projection.sql",
  "utf8",
);

assert.match(
  sql,
  /create table if not exists public\.enterprise_usage_projection\b/i,
);

assert.match(
  sql,
  /create table if not exists public\.enterprise_usage_projection_events\b/i,
);

assert.match(
  sql,
  /primary key\s*\(\s*event_id,\s*window_start,\s*window_end\s*\)/is,
);

assert.match(
  sql,
  /on conflict\s*\(\s*event_id,\s*window_start,\s*window_end\s*\)\s*do nothing/is,
);

assert.match(
  sql,
  /on conflict\s*\(\s*workspace_id,\s*window_start,\s*window_end,\s*provider_id,\s*model_id,\s*agent_id\s*\)/is,
);

assert.match(
  sql,
  /auth\.role\(\)\s*<>\s*'service_role'/i,
);

assert.match(
  sql,
  /grant execute[\s\S]*project_enterprise_usage_event[\s\S]*to service_role/i,
);

assert.match(
  sql,
  /revoke all[\s\S]*enterprise_usage_projection[\s\S]*from authenticated, anon/is,
);

assert.match(
  sql,
  /source_event\.created_at\s*<\s*p_window_start/is,
);

assert.match(
  sql,
  /source_event\.created_at\s*>=\s*p_window_end/is,
);

console.log("16E-B-SQL-01 tables/keys PASS");
console.log("16E-B-SQL-02 event idempotency PASS");
console.log("16E-B-SQL-03 server-only RPC PASS");
console.log("16E-B-SQL-04 client mutation denial PASS");
console.log("16E-B-SQL-05 half-open window PASS");
console.log("ALL 5 16E-B SQL TESTS PASSED");
