import {
  EnterpriseUsageLedger,
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
    metadata: {
      source: "runtime",
    },
    ...overrides,
  };
}

function expectThrow(fn: () => unknown, message: string): void {
  let thrown = false;

  try {
    fn();
  } catch {
    thrown = true;
  }

  if (!thrown) {
    throw new Error(message);
  }
}

function expect(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

const ledger = new EnterpriseUsageLedger();

const created = ledger.create(input());

expect(created.eventId === "usage-001", "event identity mismatch");
expect(created.workspaceId === "workspace-a", "workspace mismatch");
expect(created.providerId === "provider-openai", "provider identity mismatch");
expect(created.modelId === "gpt-4.1-mini", "model identity mismatch");
expect(created.usage.totalTokens === 125, "usage total mismatch");

expectThrow(
  () =>
    ledger.create(
      input({
        usage: {
          promptTokens: 100,
          completionTokens: 25,
          totalTokens: 124,
        },
      }),
    ),
  "invalid total token count must be rejected",
);

expectThrow(
  () =>
    ledger.create(
      input({
        usage: {
          promptTokens: -1,
          completionTokens: 25,
          totalTokens: 24,
        },
      }),
    ),
  "negative token count must be rejected",
);

const frozenRecord = ledger.get("usage-001");
expect(!!frozenRecord, "created record must be retrievable");

expectThrow(
  () => {
    (frozenRecord as { modelId: string }).modelId = "spoofed-model";
  },
  "usage record must be immutable",
);

expectThrow(
  () => {
    (frozenRecord as { metadata: Record<string, unknown> }).metadata =
      { spoofed: true };
  },
  "usage metadata must be immutable",
);

const duplicate = ledger.create(input());

expect(duplicate === created, "same usage identity must be idempotent");

expectThrow(
  () =>
    ledger.create(
      input({
        eventId: "usage-001",
        executionId: "execution-attacker",
      }),
    ),
  "duplicate event id with different execution identity must be rejected",
);

ledger.create(
  input({
    eventId: "usage-002",
    workspaceId: "workspace-b",
    traceId: "trace-002",
    decisionId: "decision-002",
    executionId: "execution-002",
    evidenceId: "evidence-002",
  }),
);

expect(
  ledger.getForWorkspace("workspace-a", "usage-002") === undefined,
  "cross-workspace lookup must be isolated",
);

expect(
  ledger.listForWorkspace("workspace-a").length === 1,
  "workspace-a must see only its own usage",
);

expect(
  ledger.listForWorkspace("workspace-b").length === 1,
  "workspace-b must see only its own usage",
);

expect(
  ledger.list().length === 2,
  "global ledger list must contain both usage events",
);

console.log("16B-01 usage ledger identity PASS");
console.log("16B-02 token arithmetic validation PASS");
console.log("16B-03 immutable record PASS");
console.log("16B-04 immutable metadata PASS");
console.log("16B-05 idempotent duplicate PASS");
console.log("16B-06 duplicate identity rejection PASS");
console.log("16B-07 workspace isolation PASS");
console.log("16B-08 workspace listing PASS");
console.log("16B-09 global listing PASS");
console.log("ALL 9 USAGE LEDGER TESTS PASSED");
