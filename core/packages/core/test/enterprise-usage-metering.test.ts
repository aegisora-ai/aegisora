import assert from "node:assert/strict";

import {
  EnterpriseUsageLedger,
  EnterpriseUsageMetering,
} from "../src/enterprise/usage";

function usage(
  eventId: string,
  workspaceId: string,
  providerId: string,
  modelId: string,
  agentId: string,
  createdAt: string,
  promptTokens: number,
  completionTokens: number,
): {
  eventId: string;
  workspaceId: string;
  traceId: string;
  decisionId: string;
  executionId: string;
  evidenceId: string;
  agentId: string;
  providerId: string;
  modelId: string;
  eventType: "provider.execution";
  outcome: "executed";
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: string;
} {
  return {
    eventId,
    workspaceId,
    traceId: `${eventId}-trace`,
    decisionId: `${eventId}-decision`,
    executionId: `${eventId}-execution`,
    evidenceId: `${eventId}-evidence`,
    agentId,
    providerId,
    modelId,
    eventType: "provider.execution",
    outcome: "executed",
    usage: {
      promptTokens,
      completionTokens,
      totalTokens:
        promptTokens + completionTokens,
    },
    createdAt,
  };
}

const ledger =
  new EnterpriseUsageLedger();

const first =
  ledger.create(
    usage(
      "usage-a-1",
      "workspace-a",
      "openai",
      "gpt-4.1-mini",
      "agent-a",
      "2026-09-08T10:00:00.000Z",
      100,
      20,
    ),
  );

const second =
  ledger.create(
    usage(
      "usage-a-2",
      "workspace-a",
      "openai",
      "gpt-4.1-mini",
      "agent-a",
      "2026-09-08T10:15:00.000Z",
      50,
      10,
    ),
  );

const differentModel =
  ledger.create(
    usage(
      "usage-a-3",
      "workspace-a",
      "openai",
      "gpt-4o",
      "agent-a",
      "2026-09-08T10:20:00.000Z",
      40,
      5,
    ),
  );

const differentAgent =
  ledger.create(
    usage(
      "usage-a-4",
      "workspace-a",
      "anthropic",
      "claude-test",
      "agent-b",
      "2026-09-08T10:25:00.000Z",
      30,
      15,
    ),
  );

const outsideWindow =
  ledger.create(
    usage(
      "usage-a-5",
      "workspace-a",
      "openai",
      "gpt-4.1-mini",
      "agent-a",
      "2026-09-08T11:00:00.000Z",
      999,
      999,
    ),
  );

const otherWorkspace =
  ledger.create(
    usage(
      "usage-b-1",
      "workspace-b",
      "openai",
      "gpt-4.1-mini",
      "agent-b",
      "2026-09-08T10:30:00.000Z",
      500,
      500,
    ),
  );

const events = [
  first,
  second,
  differentModel,
  differentAgent,
  outsideWindow,
  otherWorkspace,
];

// ==========================================================
// 16D-01 GROUP BY PROVIDER/MODEL/AGENT
// ==========================================================

const metering =
  new EnterpriseUsageMetering();

const aggregates =
  metering.aggregateForWorkspace(
    "workspace-a",
    {
      startAt:
        "2026-09-08T10:00:00.000Z",
      endAt:
        "2026-09-08T11:00:00.000Z",
    },
    events,
  );

assert.equal(
  aggregates.length,
  3,
);

// ==========================================================
// 16D-02 OPENAI MODEL TOTAL
// ==========================================================

const openAi =
  aggregates.find(
    (item) =>
      item.providerId === "openai" &&
      item.modelId === "gpt-4.1-mini" &&
      item.agentId === "agent-a",
  );

assert.ok(openAi);

assert.equal(
  openAi.eventCount,
  2,
);

assert.equal(
  openAi.promptTokens,
  150,
);

assert.equal(
  openAi.completionTokens,
  30,
);

assert.equal(
  openAi.totalTokens,
  180,
);

// ==========================================================
// 16D-03 MODEL SEPARATION
// ==========================================================

const otherModel =
  aggregates.find(
    (item) =>
      item.modelId === "gpt-4o",
  );

assert.ok(otherModel);

assert.equal(
  otherModel.totalTokens,
  45,
);

// ==========================================================
// 16D-04 AGENT/PROVIDER SEPARATION
// ==========================================================

const anthropic =
  aggregates.find(
    (item) =>
      item.providerId === "anthropic" &&
      item.agentId === "agent-b",
  );

assert.ok(anthropic);

assert.equal(
  anthropic.totalTokens,
  45,
);

// ==========================================================
// 16D-05 WORKSPACE ISOLATION
// ==========================================================

const workspaceB =
  metering.aggregateForWorkspace(
    "workspace-b",
    {
      startAt:
        "2026-09-08T10:00:00.000Z",
      endAt:
        "2026-09-08T11:00:00.000Z",
    },
    events,
  );

assert.equal(
  workspaceB.length,
  1,
);

assert.equal(
  workspaceB[0]?.totalTokens,
  1000,
);

// ==========================================================
// 16D-06 OUTSIDE WINDOW EXCLUDED
// ==========================================================

assert.equal(
  aggregates.some(
    (item) =>
      item.totalTokens >= 1998,
  ),
  false,
);

// ==========================================================
// 16D-07 HALF-OPEN WINDOW
// ==========================================================

const boundary =
  ledger.create(
    usage(
      "usage-a-boundary",
      "workspace-a",
      "openai",
      "gpt-4.1-mini",
      "agent-a",
      "2026-09-08T11:00:00.000Z",
      777,
      1,
    ),
  );

const boundaryEvents = [
  ...events,
  boundary,
];

const boundaryAggregate =
  metering.summarizeWorkspace(
    "workspace-a",
    {
      startAt:
        "2026-09-08T10:00:00.000Z",
      endAt:
        "2026-09-08T11:00:00.000Z",
    },
    boundaryEvents,
  );

assert.equal(
  boundaryAggregate.totalTokens,
  270,
);

// ==========================================================
// 16D-08 DUPLICATE EVENT DEFENSE
// ==========================================================

const duplicateInput = usage(
  "usage-a-duplicate",
  "workspace-a",
  "openai",
  "gpt-4.1-mini",
  "agent-a",
  "2026-09-08T10:30:00.000Z",
  12,
  3,
);

const duplicateEvent =
  ledger.create(
    duplicateInput,
  );

const duplicatedInputArray = [
  ...events,
  duplicateEvent,
  duplicateEvent,
];

const before =
  metering.summarizeWorkspace(
    "workspace-a",
    {
      startAt:
        "2026-09-08T10:00:00.000Z",
      endAt:
        "2026-09-08T11:00:00.000Z",
    },
    [ ...events, duplicateEvent ],
  );

const after =
  metering.summarizeWorkspace(
    "workspace-a",
    {
      startAt:
        "2026-09-08T10:00:00.000Z",
      endAt:
        "2026-09-08T11:00:00.000Z",
    },
    duplicatedInputArray,
  );

assert.equal(
  after.totalTokens,
  before.totalTokens,
);

// ==========================================================
// 16D-09 INVALID WINDOW
// ==========================================================

assert.throws(
  () =>
    metering.aggregateForWorkspace(
      "workspace-a",
      {
        startAt:
          "2026-09-08T11:00:00.000Z",
        endAt:
          "2026-09-08T10:00:00.000Z",
      },
      events,
    ),
);

// ==========================================================
// 16D-10 EMPTY WINDOW
// ==========================================================

const empty =
  metering.summarizeWorkspace(
    "workspace-a",
    {
      startAt:
        "2026-09-08T12:00:00.000Z",
      endAt:
        "2026-09-08T13:00:00.000Z",
    },
    events,
  );

assert.equal(
  empty.eventCount,
  0,
);

assert.equal(
  empty.totalTokens,
  0,
);

// ==========================================================
// 16D-11 SOURCE LEDGER IMMUTABILITY
// ==========================================================

assert.equal(
  ledger.get(first.eventId)?.usage.totalTokens,
  120,
);

assert.equal(
  ledger.get(second.eventId)?.usage.totalTokens,
  60,
);

// ==========================================================
// 16D-12 SUMMARY CONSISTENCY
// ==========================================================

const summary =
  metering.summarizeWorkspace(
    "workspace-a",
    {
      startAt:
        "2026-09-08T10:00:00.000Z",
      endAt:
        "2026-09-08T11:00:00.000Z",
    },
    events,
  );

assert.equal(
  summary.eventCount,
  4,
);

assert.equal(
  summary.promptTokens,
  220,
);

assert.equal(
  summary.completionTokens,
  50,
);

assert.equal(
  summary.totalTokens,
  270,
);

console.log(
  "16D-01 provider/model/agent aggregation PASS",
);

console.log(
  "16D-02 prompt/completion/total aggregation PASS",
);

console.log(
  "16D-03 model separation PASS",
);

console.log(
  "16D-04 provider/agent separation PASS",
);

console.log(
  "16D-05 workspace isolation PASS",
);

console.log(
  "16D-06 time-window exclusion PASS",
);

console.log(
  "16D-07 half-open window boundary PASS",
);

console.log(
  "16D-08 duplicate event defense PASS",
);

console.log(
  "16D-09 invalid window rejection PASS",
);

console.log(
  "16D-10 empty window summary PASS",
);

console.log(
  "16D-11 source ledger immutability PASS",
);

console.log(
  "16D-12 aggregate/summary consistency PASS",
);

console.log(
  "ALL 12 16D METERING TESTS PASSED",
);
