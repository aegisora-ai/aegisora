import assert from "node:assert/strict";

import {
  ProviderExecutionGateway,
} from "../src/providers/provider-execution-gateway";

import {
  ProviderRouter,
} from "../src/providers/provider-router";

import {
  RuntimeContext,
} from "../src/context/runtime-context";

import {
  BaseProvider,
} from "../src/providers/base-provider";

import type {
  ProviderRequest,
  ProviderResponse,
} from "../src/providers/base-provider";

class SpyProvider extends BaseProvider {

  public readonly name = "openai";

  public calls = 0;

  async generate(
    request: ProviderRequest,
    _context?: unknown,
  ): Promise<ProviderResponse> {

    this.calls++;

    return this.buildResponse(
      "openai",
      request.model ?? "spy-model",
      `EVIDENCE:${request.prompt}`,
    );
  }
}

function assertUuid(
  value: unknown,
  label: string,
): asserts value is string {

  assert.equal(
    typeof value,
    "string",
    `${label} must be a string`,
  );

  assert.match(
    value,
    /^[0-9a-f-]{36}$/i,
    `${label} must be UUID-like`,
  );
}

function findById(
  collection: unknown,
  id: string,
): any {

  if (!Array.isArray(collection)) {
    return undefined;
  }

  return collection.find(
    (item: any) =>
      item &&
      (
        item.id === id ||
        item.decisionId === id ||
        item.evidenceId === id ||
        item.traceId === id ||
        item.executionId === id
      ),
  );
}

function readCollection(
  store: any,
): unknown[] {

  if (typeof store.getAll === "function") {
    return store.getAll();
  }

  if (typeof store.list === "function") {
    return store.list();
  }

  if (Array.isArray(store.records)) {
    return store.records;
  }

  if (Array.isArray(store.entries)) {
    return store.entries;
  }

  return [];
}

async function main(): Promise<void> {

  console.log("[1] Creating runtime...");

  const context =
    new RuntimeContext();

  const executionToken =
    Symbol(
      "aegisora.3.0.10c.execution",
    );

  const router =
    new ProviderRouter(
      executionToken,
    );

  const spy =
    new SpyProvider();

  router.register(
    "openai",
    spy,
  );

  const gateway =
    new ProviderExecutionGateway(
      context,
      router,
      undefined,
      undefined,
      executionToken,
    );

  const agentId =
    "3.0-10c-evidence-agent";

  context.agentRegistry.register({
    id: agentId,
    name: "3.0-10C Evidence Agent",
    status: "idle",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.ok(
    context.agentRegistry.getById(agentId),
  );

  console.log(
    "Canonical identity: PASS",
  );

  // ========================================================
  // ALLOW EXECUTION
  // ========================================================

  console.log(
    "[2] Executing ALLOW request...",
  );

  const response =
    await gateway.generate({
      agentId,
      provider: "openai",
      request: {
        prompt: "3.0-10 evidence allow",
      },
    });

  assert.equal(
    response.output,
    "EVIDENCE:3.0-10 evidence allow",
  );

  assert.equal(
    spy.calls,
    1,
  );

  console.log(
    "ALLOW execution: PASS",
  );

  // ========================================================
  // DECISION STORE
  // ========================================================

  console.log(
    "[3] Inspecting DecisionTraceStore...",
  );

  const decisions =
    readCollection(
      context.decisionStore,
    );

  assert.ok(
    decisions.length > 0,
    "DecisionTraceStore must contain the ALLOW decision",
  );

  const decision =
    findById(
      decisions,
      String(
        decisions[decisions.length - 1]?.decisionId ??
        decisions[decisions.length - 1]?.id,
      ),
    );

  assert.ok(
    decision,
    "ALLOW decision record must be discoverable",
  );

  assert.equal(
    decision.decision,
    "allow",
    "Decision store must record lowercase allow",
  );

  assert.equal(
    decision.agentId,
    agentId,
  );

  assert.equal(
    decision.action,
    "provider.generate",
  );

  assertUuid(
    decision.traceId,
    "decision.traceId",
  );

  assertUuid(
    decision.decisionId,
    "decision.decisionId",
  );

  assertUuid(
    decision.executionId,
    "decision.executionId",
  );

  assertUuid(
    decision.evidenceId,
    "decision.evidenceId",
  );

  console.log(
    "Decision record: PASS",
  );

  // ========================================================
  // EVIDENCE STORE
  // ========================================================

  console.log(
    "[4] Inspecting MemoryEvidenceStore...",
  );

  const evidenceRecords =
    readCollection(
      context.evidenceStore,
    );

  assert.ok(
    evidenceRecords.length > 0,
    "Evidence store must contain an enforcement evidence record",
  );

  const evidence =
    evidenceRecords.find(
      (item: any) =>
        item &&
        item.evidenceId === decision.evidenceId,
    );

  assert.ok(
    evidence,
    "Evidence must be linked by evidenceId",
  );

  assert.equal(
    evidence.traceId,
    decision.traceId,
    "Evidence traceId must match decision traceId",
  );

  assert.equal(
    evidence.decisionId,
    decision.decisionId,
    "Evidence decisionId must match decision decisionId",
  );

  assert.equal(
    evidence.executionId,
    decision.executionId,
    "Evidence executionId must match decision executionId",
  );

  assert.equal(
    evidence.agentId,
    agentId,
  );

  assert.equal(
    evidence.action,
    "provider.generate",
  );

  assert.equal(
    evidence.finalDecision,
    "ALLOW",
  );

  assert.equal(
    evidence.enforcementStatus,
    "not_executed",
  );

  assert.equal(
    evidence.executionOutcome,
    "not_attempted",
  );

  assert.equal(
    evidence.status,
    "recorded",
  );

  console.log(
    "Evidence linkage: PASS",
  );

  // ========================================================
  // CROSS-STORE CORRELATION
  // ========================================================

  console.log(
    "[5] Verifying correlation chain...",
  );

  assert.equal(
    evidence.traceId,
    decision.traceId,
  );

  assert.equal(
    evidence.decisionId,
    decision.decisionId,
  );

  assert.equal(
    evidence.executionId,
    decision.executionId,
  );

  assert.equal(
    evidence.evidenceId,
    decision.evidenceId,
  );

  console.log(
    "Correlation chain: PASS",
  );

  // ========================================================
  // BLOCK
  // ========================================================

  console.log(
    "[6] Executing BLOCK and verifying audit evidence...",
  );

  const decisionsBeforeBlock =
    readCollection(
      context.decisionStore,
    ).length;

  const evidenceBeforeBlock =
    readCollection(
      context.evidenceStore,
    ).length;

  await assert.rejects(
    gateway.generate({
      agentId,
      provider:
        "unknown-provider" as any,
      request: {
        prompt: "3.0-10 block evidence",
      },
    }),
    (error: unknown) => {

      assert.ok(
        error instanceof Error,
      );

      assert.match(
        error.message,
        /\[ENFORCEMENT:BLOCK\]/,
      );

      return true;
    },
  );

  assert.equal(
    spy.calls,
    1,
    "BLOCK must not invoke provider",
  );

  const decisionsAfterBlock =
    readCollection(
      context.decisionStore,
    );

  const evidenceAfterBlock =
    readCollection(
      context.evidenceStore,
    );

  assert.ok(
    decisionsAfterBlock.length >
    decisionsBeforeBlock,
    "BLOCK must create a decision record",
  );

  assert.ok(
    evidenceAfterBlock.length >
    evidenceBeforeBlock,
    "BLOCK must create evidence",
  );

  const latestDecision =
    decisionsAfterBlock[
      decisionsAfterBlock.length - 1
    ] as any;

  const latestEvidence =
    evidenceAfterBlock[
      evidenceAfterBlock.length - 1
    ] as any;

  assert.equal(
    latestDecision.decision,
    "block",
  );

  assert.equal(
    latestEvidence.finalDecision,
    "BLOCK",
  );

  assert.equal(
    latestEvidence.enforcementStatus,
    "prevented",
  );

  assert.equal(
    latestEvidence.executionOutcome,
    "not_attempted",
  );

  assert.equal(
    latestEvidence.decisionId,
    latestDecision.decisionId,
  );

  assert.equal(
    latestEvidence.traceId,
    latestDecision.traceId,
  );

  console.log(
    "BLOCK audit/evidence: PASS",
  );

  // ========================================================
  // FINAL
  // ========================================================

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    " 3.0-10C EVIDENCE / DECISION / AUDIT: PASS",
  );
  console.log(
    "============================================================",
  );
  console.log(
    "ALLOW  -> decision recorded",
  );
  console.log(
    "ALLOW  -> evidence recorded",
  );
  console.log(
    "ALLOW  -> trace/decision/execution/evidence correlated",
  );
  console.log(
    "BLOCK  -> decision recorded",
  );
  console.log(
    "BLOCK  -> evidence recorded",
  );
  console.log(
    "BLOCK  -> execution not attempted",
  );
}

main().catch(
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
