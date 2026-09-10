import assert from "node:assert/strict";

import {
  ProviderExecutionGateway,
} from "../src/providers/provider-execution-gateway";

import {
  ProviderRouter,
} from "../src/providers/provider-router";

import type {
  ProviderName,
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

  public requests: ProviderRequest[] = [];

  async generate(
    request: ProviderRequest,
    _context?: unknown,
  ): Promise<ProviderResponse> {

    this.calls++;

    this.requests.push(request);

    return this.buildResponse(
      "openai",
      request.model ?? "spy-model",
      `REGRESSION:${request.prompt}`,
    );
  }
}

function collection(
  store: any,
): any[] {

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

function assertId(
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

function assertEnforcement(
  error: unknown,
  decision: "BLOCK" | "ESCALATE",
): void {

  assert.ok(
    error instanceof Error,
    "Expected Error",
  );

  assert.match(
    error.message,
    new RegExp(
      `\\[ENFORCEMENT:${decision}\\]`,
    ),
  );
}

async function main(): Promise<void> {

  console.log("[1] Bootstrapping canonical runtime...");

  const context =
    new RuntimeContext();

  const executionToken =
    Symbol(
      "aegisora.3.0.10d.execution",
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
    "3.0-10d-regression-agent";

  context.agentRegistry.register({
    id: agentId,
    name: "3.0-10D Regression Agent",
    status: "idle",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.ok(
    context.agentRegistry.getById(agentId),
    "Canonical AgentRegistry identity missing",
  );

  console.log(
    "Canonical identity: PASS",
  );

  // ========================================================
  // 1. ALLOW
  // ========================================================

  console.log(
    "[2] ALLOW regression...",
  );

  const allowResponse =
    await gateway.generate({
      agentId,
      provider: "openai",
      request: {
        prompt: "10D allow",
      },
    });

  assert.equal(
    allowResponse.output,
    "REGRESSION:10D allow",
  );

  assert.equal(
    spy.calls,
    1,
    "ALLOW must execute provider",
  );

  const decisionsAfterAllow =
    collection(context.decisionStore);

  const evidenceAfterAllow =
    collection(context.evidenceStore);

  assert.ok(
    decisionsAfterAllow.length >= 1,
    "ALLOW decision must be persisted",
  );

  assert.ok(
    evidenceAfterAllow.length >= 1,
    "ALLOW evidence must be persisted",
  );

  const allowDecision =
    decisionsAfterAllow[
      decisionsAfterAllow.length - 1
    ];

  const allowEvidence =
    evidenceAfterAllow[
      evidenceAfterAllow.length - 1
    ];

  assert.equal(
    allowDecision.decision,
    "allow",
  );

  assert.equal(
    allowDecision.agentId,
    agentId,
  );

  assert.equal(
    allowDecision.action,
    "provider.generate",
  );

  assertId(
    allowDecision.traceId,
    "allow.traceId",
  );

  assertId(
    allowDecision.decisionId,
    "allow.decisionId",
  );

  assertId(
    allowDecision.executionId,
    "allow.executionId",
  );

  assertId(
    allowDecision.evidenceId,
    "allow.evidenceId",
  );

  assert.equal(
    allowEvidence.evidenceId,
    allowDecision.evidenceId,
  );

  assert.equal(
    allowEvidence.traceId,
    allowDecision.traceId,
  );

  assert.equal(
    allowEvidence.decisionId,
    allowDecision.decisionId,
  );

  assert.equal(
    allowEvidence.executionId,
    allowDecision.executionId,
  );

  assert.equal(
    allowEvidence.finalDecision,
    "ALLOW",
  );

  assert.equal(
    allowEvidence.enforcementStatus,
    "not_executed",
  );

  console.log(
    "ALLOW execution + evidence chain: PASS",
  );

  // ========================================================
  // 2. BLOCK
  // ========================================================

  console.log(
    "[3] BLOCK regression...",
  );

  const providerCallsBeforeBlock =
    spy.calls;

  const decisionsBeforeBlock =
    collection(context.decisionStore).length;

  const evidenceBeforeBlock =
    collection(context.evidenceStore).length;

  const unknownProvider =
    "unknown-provider" as unknown as ProviderName;

  await assert.rejects(
    gateway.generate({
      agentId,
      provider: unknownProvider,
      request: {
        prompt: "10D block",
      },
    }),
    (error: unknown) => {

      assertEnforcement(
        error,
        "BLOCK",
      );

      return true;
    },
  );

  assert.equal(
    spy.calls,
    providerCallsBeforeBlock,
    "BLOCK must not execute provider",
  );

  const decisionsAfterBlock =
    collection(context.decisionStore);

  const evidenceAfterBlock =
    collection(context.evidenceStore);

  assert.ok(
    decisionsAfterBlock.length >
    decisionsBeforeBlock,
    "BLOCK decision must be persisted",
  );

  assert.ok(
    evidenceAfterBlock.length >
    evidenceBeforeBlock,
    "BLOCK evidence must be persisted",
  );

  const blockDecision =
    decisionsAfterBlock[
      decisionsAfterBlock.length - 1
    ];

  const blockEvidence =
    evidenceAfterBlock[
      evidenceAfterBlock.length - 1
    ];

  assert.equal(
    blockDecision.decision,
    "block",
  );

  assert.equal(
    blockEvidence.finalDecision,
    "BLOCK",
  );

  assert.equal(
    blockEvidence.enforcementStatus,
    "prevented",
  );

  assert.equal(
    blockEvidence.executionOutcome,
    "not_attempted",
  );

  assert.equal(
    blockEvidence.decisionId,
    blockDecision.decisionId,
  );

  assert.equal(
    blockEvidence.traceId,
    blockDecision.traceId,
  );

  console.log(
    "BLOCK + no provider execution + evidence: PASS",
  );

  // ========================================================
  // 3. ESCALATE
  // ========================================================

  console.log(
    "[4] ESCALATE regression...",
  );

  const providerCallsBeforeEscalate =
    spy.calls;

  const decisionsBeforeEscalate =
    collection(context.decisionStore).length;

  const evidenceBeforeEscalate =
    collection(context.evidenceStore).length;

  await assert.rejects(
    gateway.generate({
      agentId,
      provider: "openai",
      request: {
        prompt: "10D escalate",
      },
      metadata: {
        requiresReview: true,
      },
    }),
    (error: unknown) => {

      assertEnforcement(
        error,
        "ESCALATE",
      );

      return true;
    },
  );

  assert.equal(
    spy.calls,
    providerCallsBeforeEscalate,
    "ESCALATE must not execute provider",
  );

  const decisionsAfterEscalate =
    collection(context.decisionStore);

  const evidenceAfterEscalate =
    collection(context.evidenceStore);

  assert.ok(
    decisionsAfterEscalate.length >
    decisionsBeforeEscalate,
    "ESCALATE decision must be persisted",
  );

  assert.ok(
    evidenceAfterEscalate.length >
    evidenceBeforeEscalate,
    "ESCALATE evidence must be persisted",
  );

  const escalateDecision =
    decisionsAfterEscalate[
      decisionsAfterEscalate.length - 1
    ];

  const escalateEvidence =
    evidenceAfterEscalate[
      evidenceAfterEscalate.length - 1
    ];

  assert.equal(
    escalateDecision.decision,
    "escalate",
  );

  assert.equal(
    escalateEvidence.finalDecision,
    "ESCALATE",
  );

  assert.equal(
    escalateEvidence.enforcementStatus,
    "escalated",
  );

  assert.equal(
    escalateEvidence.executionOutcome,
    "not_attempted",
  );

  assert.equal(
    escalateEvidence.decisionId,
    escalateDecision.decisionId,
  );

  assert.equal(
    escalateEvidence.traceId,
    escalateDecision.traceId,
  );

  console.log(
    "ESCALATE + no provider execution + evidence: PASS",
  );

  // ========================================================
  // 4. RECOVERY
  // ========================================================

  console.log(
    "[5] Recovery regression...",
  );

  const recovery1 =
    await gateway.generate({
      agentId,
      provider: "openai",
      request: {
        prompt: "10D recovery-1",
      },
    });

  assert.equal(
    recovery1.output,
    "REGRESSION:10D recovery-1",
  );

  const recovery2 =
    await gateway.generate({
      agentId,
      provider: "openai",
      request: {
        prompt: "10D recovery-2",
      },
    });

  assert.equal(
    recovery2.output,
    "REGRESSION:10D recovery-2",
  );

  assert.equal(
    spy.calls,
    3,
    "Only three successful provider executions expected",
  );

  assert.equal(
    spy.requests.length,
    3,
    "Only successful ALLOW requests should reach provider",
  );

  console.log(
    "Post-BLOCK / Post-ESCALATE recovery: PASS",
  );

  // ========================================================
  // 5. FINAL COUNTS
  // ========================================================

  const finalDecisions =
    collection(context.decisionStore);

  const finalEvidence =
    collection(context.evidenceStore);

  assert.ok(
    finalDecisions.length >= 3,
    "Final decision store must retain 10D decisions",
  );

  assert.ok(
    finalEvidence.length >= 3,
    "Final evidence store must retain 10D evidence",
  );

  console.log(
    "Final decision/evidence persistence: PASS",
  );

  // ========================================================
  // FINAL
  // ========================================================

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    " 3.0-10D FULL SECURITY REGRESSION: PASS",
  );
  console.log(
    "============================================================",
  );
  console.log(
    "Canonical identity              ✅",
  );
  console.log(
    "ALLOW provider execution        ✅",
  );
  console.log(
    "ALLOW decision persistence      ✅",
  );
  console.log(
    "ALLOW evidence correlation      ✅",
  );
  console.log(
    "BLOCK provider prevention       ✅",
  );
  console.log(
    "BLOCK decision/evidence         ✅",
  );
  console.log(
    "ESCALATE provider prevention    ✅",
  );
  console.log(
    "ESCALATE decision/evidence      ✅",
  );
  console.log(
    "Post-decision recovery          ✅",
  );
  console.log(
    "Final persistence               ✅",
  );
}

main().catch(
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
