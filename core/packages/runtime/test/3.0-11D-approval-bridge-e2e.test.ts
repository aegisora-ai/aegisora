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

  public requests: ProviderRequest[] = [];

  async generate(
    request: ProviderRequest,
    _context?: unknown,
  ): Promise<ProviderResponse> {

    this.calls++;

    this.requests.push(
      request,
    );

    return this.buildResponse(
      "openai",
      request.model ?? "spy-model",
      `APPROVAL-E2E:${request.prompt}`,
    );
  }
}

async function main(): Promise<void> {

  // ========================================================
  // BOOTSTRAP
  // ========================================================

  console.log(
    "[1] Bootstrapping canonical runtime...",
  );

  const context =
    new RuntimeContext();

  const executionToken =
    Symbol(
      "aegisora.3.0.11d.e2e",
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

  const approvals =
    gateway.getApprovalEngine();

  const agentId =
    "3.0-11d-real-agent";

  context.agentRegistry.register({
    id: agentId,
    name: "3.0-11D Real Approval Agent",
    status: "idle",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.ok(
    context.agentRegistry.getById(
      agentId,
    ),
  );

  console.log(
    "Canonical runtime identity: PASS",
  );

  // ========================================================
  // STEP 1 — ESCALATE
  // ========================================================

  console.log(
    "[2] Review-required request -> ESCALATE...",
  );

  const protectedPrompt =
    "3.0-11D protected execution";

  await assert.rejects(
    gateway.generate({
      agentId,

      provider:
        "openai",

      request: {
        prompt:
          protectedPrompt,
      },

      metadata: {
        requiresReview:
          true,
      },
    }),

    (error: unknown) => {

      assert.ok(
        error instanceof Error,
      );

      assert.match(
        error.message,
        /\[ENFORCEMENT:ESCALATE\]/,
      );

      return true;
    },
  );

  assert.equal(
    spy.calls,
    0,
    "ESCALATE must prevent provider execution",
  );

  const pending =
    approvals.list();

  assert.equal(
    pending.length,
    1,
    "Exactly one approval must be created",
  );

  const approval =
    pending[0];

  assert.ok(
    approval,
  );

  assert.equal(
    approval.status,
    "pending",
  );

  assert.equal(
    approval.agentId,
    agentId,
  );

  assert.equal(
    approval.action,
    "provider.generate",
  );

  assert.ok(
    approval.approvalId,
  );

  assert.ok(
    approval.traceId,
  );

  assert.ok(
    approval.decisionId,
  );

  assert.ok(
    approval.executionId,
  );

  assert.match(
    approval.requestHash,
    /^[0-9a-f]{64}$/i,
  );

  console.log(
    "ESCALATE -> approval created -> provider = 0: PASS",
  );

  // ========================================================
  // STEP 2 — APPROVE
  // ========================================================

  console.log(
    "[3] Human approval...",
  );

  const approved =
    approvals.approve({
      approvalId:
        approval.approvalId,

      actorId:
        "human-reviewer-11d",
    });

  assert.equal(
    approved.status,
    "approved",
  );

  assert.equal(
    approved.approvedBy,
    "human-reviewer-11d",
  );

  console.log(
    "Approval transition: PASS",
  );

  // ========================================================
  // STEP 3 — RESUME
  // ========================================================

  console.log(
    "[4] Resuming SAME approved request...",
  );

  const response =
    await gateway.generate({
      agentId,

      provider:
        "openai",

      request: {
        prompt:
          protectedPrompt,
      },

      metadata: {
        requiresReview:
          true,

        approvalId:
          approval.approvalId,
      },
    });

  assert.equal(
    response.output,
    `APPROVAL-E2E:${protectedPrompt}`,
  );

  assert.equal(
    spy.calls,
    1,
    "Approved request must reach provider exactly once",
  );

  assert.equal(
    spy.requests.length,
    1,
  );

  console.log(
    "Approved request -> provider execution: PASS",
  );

  // ========================================================
  // STEP 4 — CONSUMED
  // ========================================================

  console.log(
    "[5] Verifying one-time consumption...",
  );

  const consumed =
    approvals.get(
      approval.approvalId,
    );

  assert.equal(
    consumed?.status,
    "consumed",
  );

  assert.ok(
    consumed?.consumedAt,
  );

  console.log(
    "Approval consumed exactly once: PASS",
  );

  // ========================================================
  // STEP 5 — REPLAY
  // ========================================================

  console.log(
    "[6] Replay attempt...",
  );

  await assert.rejects(
    gateway.generate({
      agentId,

      provider:
        "openai",

      request: {
        prompt:
          protectedPrompt,
      },

      metadata: {
        requiresReview:
          true,

        approvalId:
          approval.approvalId,
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
    "Replay must not reach provider",
  );

  console.log(
    "Replay blocked at enforcement boundary: PASS",
  );

  // ========================================================
  // STEP 6 — TAMPERED REQUEST
  // ========================================================

  console.log(
    "[7] Creating second approval for request tamper test...",
  );

  const originalPrompt =
    "3.0-11D original request";

  await assert.rejects(
    gateway.generate({
      agentId,

      provider:
        "openai",

      request: {
        prompt:
          originalPrompt,
      },

      metadata: {
        requiresReview:
          true,
      },
    }),
    /\[ENFORCEMENT:ESCALATE\]/,
  );

  const secondApproval =
    approvals
      .list()
      .find(
        (item) =>
          item.status ===
          "pending" &&
          item.approvalId !==
          approval.approvalId,
      );

  assert.ok(
    secondApproval,
  );

  approvals.approve({
    approvalId:
      secondApproval.approvalId,

    actorId:
      "human-reviewer-11d-2",
  });

  const callsBeforeTamper =
    spy.calls;

  await assert.rejects(
    gateway.generate({
      agentId,

      provider:
        "openai",

      request: {
        prompt:
          "ATTACKER MUTATION",
      },

      metadata: {
        requiresReview:
          true,

        approvalId:
          secondApproval.approvalId,
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
    callsBeforeTamper,
    "Tampered request must not execute",
  );

  const tamperApproval =
    approvals.get(
      secondApproval.approvalId,
    );

  assert.equal(
    tamperApproval?.status,
    "approved",
    "Failed tamper validation must not consume approval",
  );

  console.log(
    "Request tamper protection: PASS",
  );

  // ========================================================
  // STEP 7 — WRONG AGENT
  // ========================================================

  console.log(
    "[8] Wrong-agent approval attempt...",
  );

  const callsBeforeAgentAttack =
    spy.calls;

  await assert.rejects(
    gateway.generate({
      agentId:
        "3.0-11d-attacker",

      provider:
        "openai",

      request: {
        prompt:
          originalPrompt,
      },

      metadata: {
        requiresReview:
          true,

        approvalId:
          secondApproval.approvalId,
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
    callsBeforeAgentAttack,
    "Wrong-agent request must not execute",
  );

  assert.equal(
    approvals.get(
      secondApproval.approvalId,
    )?.status,
    "approved",
  );

  console.log(
    "Wrong-agent protection: PASS",
  );

  // ========================================================
  // STEP 8 — DECISION / EVIDENCE
  // ========================================================

  console.log(
    "[9] Inspecting final decision/evidence records...",
  );

  const decisionStoreAny =
    context.decisionStore as any;

  const decisionReaderCandidates = [
    "getAll",
    "list",
    "getRecords",
    "getDecisionRecords",
    "getTraces",
    "getEntries",
  ];

  let decisions: any[] | undefined;

  for (const methodName of decisionReaderCandidates) {
    const method =
      decisionStoreAny?.[methodName];

    if (typeof method !== "function") {
      continue;
    }

    try {
      const result =
        method.call(decisionStoreAny);

      if (Array.isArray(result)) {
        decisions = result;
        break;
      }
    } catch {
      // Keep trying the supported reader candidates.
    }
  }

  assert.ok(
    decisions,
    [
      "Unable to read decision records from DecisionStore.",
      "Available prototype methods:",
      Object.getOwnPropertyNames(
        Object.getPrototypeOf(decisionStoreAny),
      ).join(", "),
    ].join(" "),
  );

  const evidence =
    context.evidenceStore.getAll();

  assert.ok(
    decisions.length >= 4,
    "Expected ESCALATE, resumed ALLOW and attack decisions",
  );

  assert.ok(
    evidence.length >= 4,
    "Expected corresponding evidence records",
  );

  const approvalEvidence =
    evidence.find(
      (item: any) =>
        item?.metadata?.approvalId ===
        approval.approvalId,
    );

  assert.ok(
    approvalEvidence,
    "Approval-linked evidence must be discoverable",
  );

  console.log(
    "Decision/evidence approval correlation: PASS",
  );

  // ========================================================
  // FINAL
  // ========================================================

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    " 3.0-11D REAL APPROVAL BRIDGE: PASS",
  );
  console.log(
    "============================================================",
  );
  console.log(
    "ESCALATE -> approval created          ✅",
  );
  console.log(
    "ESCALATE -> provider blocked          ✅",
  );
  console.log(
    "Human approval                        ✅",
  );
  console.log(
    "Approved bound execution              ✅",
  );
  console.log(
    "One-time consumption                  ✅",
  );
  console.log(
    "Replay protection                     ✅",
  );
  console.log(
    "Request tamper protection             ✅",
  );
  console.log(
    "Wrong-agent protection                ✅",
  );
  console.log(
    "Decision/evidence correlation         ✅",
  );
}

main().catch(
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
