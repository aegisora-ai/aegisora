import assert from "node:assert/strict";

import {
  EnterpriseUsageLedger,
  EnterpriseUsageMetering,
  EnterpriseUsageProjection,
  type CreateEnterpriseUsageEventInput,
} from "../src/enterprise/usage";

function input(
  overrides: Partial<CreateEnterpriseUsageEventInput> = {},
): CreateEnterpriseUsageEventInput {
  return {
    eventId: "usage-001",
    workspaceId: "workspace-a",
    traceId: "trace-001",
    decisionId: "decision-001",
    executionId: "execution-001",
    evidenceId: "evidence-001",
    agentId: "agent-001",
    providerId: "provider-openai",
    modelId: "gpt-4.1-mini",
    eventType: "provider.execution",
    outcome: "executed",
    usage: {
      promptTokens: 100,
      completionTokens: 25,
      totalTokens: 125,
    },
    createdAt: "2026-01-10T10:00:00.000Z",
    ...overrides,
  };
}

function expectThrows(
  callback: () => unknown,
): void {
  assert.throws(callback);
}

function window() {
  return {
    startAt: "2026-01-10T00:00:00.000Z",
    endAt: "2026-01-11T00:00:00.000Z",
  };
}

const ledger = new EnterpriseUsageLedger();

const first = ledger.create(
  input({
    eventId: "usage-001",
  }),
);

const second = ledger.create(
  input({
    eventId: "usage-002",
    traceId: "trace-002",
    decisionId: "decision-002",
    executionId: "execution-002",
    evidenceId: "evidence-002",
    createdAt: "2026-01-10T11:00:00.000Z",
    usage: {
      promptTokens: 50,
      completionTokens: 10,
      totalTokens: 60,
    },
  }),
);

const foreign = ledger.create(
  input({
    eventId: "usage-foreign",
    workspaceId: "workspace-b",
    traceId: "trace-foreign",
    decisionId: "decision-foreign",
    executionId: "execution-foreign",
    evidenceId: "evidence-foreign",
  }),
);

const outside = ledger.create(
  input({
    eventId: "usage-outside",
    traceId: "trace-outside",
    decisionId: "decision-outside",
    executionId: "execution-outside",
    evidenceId: "evidence-outside",
    createdAt: "2026-01-11T00:00:00.000Z",
  }),
);

const projection =
  new EnterpriseUsageProjection();

console.log("[16E-01] First application...");

const applied = projection.apply(
  "workspace-a",
  window(),
  first,
);

assert.equal(
  applied.status,
  "applied",
);
assert.equal(
  applied.aggregate?.eventCount,
  1,
);
assert.equal(
  applied.aggregate?.totalTokens,
  125,
);

console.log("16E-01 PASS");

console.log("[16E-02] Exact duplicate is idempotent...");

const duplicate = projection.apply(
  "workspace-a",
  window(),
  first,
);

assert.equal(
  duplicate.status,
  "duplicate",
);
assert.equal(
  duplicate.aggregate?.eventCount,
  1,
);

console.log("16E-02 PASS");

console.log("[16E-03] Second unique event increments exactly once...");

const secondApplied = projection.apply(
  "workspace-a",
  window(),
  second,
);

assert.equal(
  secondApplied.status,
  "applied",
);
assert.equal(
  projection.getProjectedEventCount(
    "workspace-a",
    window(),
  ),
  2,
);

console.log("16E-03 PASS");

console.log("[16E-04] Cross-workspace event is rejected...");

expectThrows(() =>
  projection.apply(
    "workspace-a",
    window(),
    foreign,
  ),
);

console.log("16E-04 PASS");

console.log("[16E-05] Outside-window event is ignored...");

const ignored = projection.apply(
  "workspace-a",
  window(),
  outside,
);

assert.equal(
  ignored.status,
  "ignored",
);
assert.equal(
  projection.getProjectedEventCount(
    "workspace-a",
    window(),
  ),
  2,
);

console.log("16E-05 PASS");

console.log("[16E-06] Same eventId with altered identity is rejected...");

const alteredReplay = {
  ...first,
  executionId: "execution-attacker",
};

expectThrows(() =>
  projection.apply(
    "workspace-a",
    window(),
    alteredReplay,
  ),
);

console.log("16E-06 PASS");

console.log("[16E-07] Source event remains immutable...");

const before = JSON.stringify(first);

projection.apply(
  "workspace-a",
  window(),
  first,
);

assert.equal(
  JSON.stringify(first),
  before,
);

console.log("16E-07 PASS");

console.log("[16E-08] Projection matches metering...");

const meter = new EnterpriseUsageMetering();

const expected =
  meter.aggregateForWorkspace(
    "workspace-a",
    window(),
    [
      first,
      second,
      foreign,
      outside,
    ],
  );

const projected =
  projection.snapshotForWorkspace(
    "workspace-a",
    window(),
  );

assert.deepEqual(
  projected,
  expected,
);

console.log("16E-08 PASS");

console.log("[16E-09] Empty projection is deterministic...");

const empty =
  new EnterpriseUsageProjection();

assert.deepEqual(
  empty.snapshotForWorkspace(
    "workspace-a",
    window(),
  ),
  [],
);

assert.equal(
  empty.getProjectedEventCount(
    "workspace-a",
    window(),
  ),
  0,
);

console.log("16E-09 PASS");

console.log("[16E-10] Half-open window boundary...");

const boundary = ledger.create(
  input({
    eventId: "usage-boundary",
    traceId: "trace-boundary",
    decisionId: "decision-boundary",
    executionId: "execution-boundary",
    evidenceId: "evidence-boundary",
    createdAt: "2026-01-11T00:00:00.000Z",
  }),
);

const boundaryResult =
  new EnterpriseUsageProjection().apply(
    "workspace-a",
    window(),
    boundary,
  );

assert.equal(
  boundaryResult.status,
  "ignored",
);

console.log("16E-10 PASS");

console.log("[16E-11] Invalid window is rejected...");

expectThrows(() =>
  projection.snapshotForWorkspace(
    "workspace-a",
    {
      startAt: "2026-01-11T00:00:00.000Z",
      endAt: "2026-01-10T00:00:00.000Z",
    },
  ),
);

console.log("16E-11 PASS");

console.log("[16E-12] All projection invariants passed");

console.log(
  "ALL 12 16E PROJECTION TESTS PASSED",
);
