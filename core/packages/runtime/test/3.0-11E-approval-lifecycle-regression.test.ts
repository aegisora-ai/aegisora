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

    this.requests.push(request);

    return this.buildResponse(
      "openai",
      request.model ?? "spy-model",
      `APPROVAL-11E:${request.prompt}`,
    );
  }
}

async function expectBlocked(
  fn: () => Promise<unknown>,
  label: string,
): Promise<void> {

  await assert.rejects(
    fn(),
    (error: unknown) => {

      assert.ok(
        error instanceof Error,
        `${label}: expected Error`,
      );

      assert.match(
        error.message,
        /\[ENFORCEMENT:BLOCK\]/,
        `${label}: expected BLOCK`,
      );

      return true;
    },
  );
}

async function createPendingApproval(
  gateway: ProviderExecutionGateway,
  approvals: any,
  agentId: string,
  prompt: string,
): Promise<any> {

  await assert.rejects(
    gateway.generate({
      agentId,
      provider: "openai",
      request: {
        prompt,
      },
      metadata: {
        requiresReview: true,
      },
    }),
    (error: unknown) => {

      assert.ok(error instanceof Error);

      assert.match(
        error.message,
        /\[ENFORCEMENT:ESCALATE\]/,
      );

      return true;
    },
  );

  const candidates = approvals
    .list()
    .filter(
      (item: any) =>
        item.agentId === agentId &&
        item.status === "pending",
    );

  assert.ok(
    candidates.length >= 1,
    "Expected pending approval",
  );

  return candidates[candidates.length - 1];
}

async function main(): Promise<void> {

  console.log("");
  console.log("============================================================");
  console.log(" 3.0-11E APPROVAL LIFECYCLE SECURITY REGRESSION");
  console.log("============================================================");

  // ==========================================================
  // BOOTSTRAP
  // ==========================================================

  console.log("[1] Bootstrapping canonical runtime...");

  const context =
    new RuntimeContext();

  const executionToken =
    Symbol(
      "aegisora.3.0.11e.e2e",
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
    gateway.getApprovalEngine() as any;

  const agentId =
    "3.0-11e-security-agent";

  context.agentRegistry.register({
    id: agentId,
    name: "3.0-11E Security Agent",
    status: "idle",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.ok(
    context.agentRegistry.getById(agentId),
  );

  console.log("Canonical runtime identity: PASS");

  // ==========================================================
  // 1. EXPIRY
  // ==========================================================

  console.log("[2] Expiry enforcement...");

  const expiredApproval =
    await createPendingApproval(
      gateway,
      approvals,
      agentId,
      "3.0-11E expiry protected request",
    );

  assert.equal(
    expiredApproval.status,
    "pending",
  );

  const expired =
    approvals.expire(
      expiredApproval.approvalId,
    );

  assert.equal(
    expired.status,
    "expired",
  );

  const callsBeforeExpiry =
    spy.calls;

  await expectBlocked(
    () =>
      gateway.generate({
        agentId,
        provider: "openai",
        request: {
          prompt:
            "3.0-11E expiry protected request",
        },
        metadata: {
          requiresReview: true,
          approvalId:
            expiredApproval.approvalId,
        },
      }),
    "expired approval",
  );

  assert.equal(
    spy.calls,
    callsBeforeExpiry,
    "Expired approval must never reach provider",
  );

  console.log(
    "Expired approval -> BLOCK -> provider unchanged: PASS",
  );

  // ==========================================================
  // 2. REJECTION
  // ==========================================================

  console.log("[3] Rejection enforcement...");

  const rejectedApproval =
    await createPendingApproval(
      gateway,
      approvals,
      agentId,
      "3.0-11E rejected protected request",
    );

  assert.equal(
    rejectedApproval.status,
    "pending",
  );

  const rejectFn =
    approvals.reject.bind(
      approvals,
    );

  let rejected;

  try {

    rejected =
      rejectFn({
        approvalId:
          rejectedApproval.approvalId,
        actorId:
          "human-reviewer-reject",
        rejectionReason:
          "Security policy rejection",
      });

  } catch {

    rejected =
      rejectFn({
        approvalId:
          rejectedApproval.approvalId,
        actorId:
          "human-reviewer-reject",
        reason:
          "Security policy rejection",
      });
  }

  assert.equal(
    rejected.status,
    "rejected",
  );

  const callsBeforeRejection =
    spy.calls;

  await expectBlocked(
    () =>
      gateway.generate({
        agentId,
        provider: "openai",
        request: {
          prompt:
            "3.0-11E rejected protected request",
        },
        metadata: {
          requiresReview: true,
          approvalId:
            rejectedApproval.approvalId,
        },
      }),
    "rejected approval",
  );

  assert.equal(
    spy.calls,
    callsBeforeRejection,
    "Rejected approval must never reach provider",
  );

  console.log(
    "Rejected approval -> BLOCK -> provider unchanged: PASS",
  );

  // ==========================================================
  // 3. APPROVED ONE-TIME CONSUME
  // ==========================================================

  console.log("[4] Approved one-time lifecycle...");

  const validApproval =
    await createPendingApproval(
      gateway,
      approvals,
      agentId,
      "3.0-11E valid protected request",
    );

  const approved =
    approvals.approve({
      approvalId:
        validApproval.approvalId,
      actorId:
        "human-reviewer-valid",
    });

  assert.equal(
    approved.status,
    "approved",
  );

  const response =
    await gateway.generate({
      agentId,
      provider: "openai",
      request: {
        prompt:
          "3.0-11E valid protected request",
      },
      metadata: {
        requiresReview: true,
        approvalId:
          validApproval.approvalId,
      },
    });

  assert.equal(
    response.output,
    "APPROVAL-11E:3.0-11E valid protected request",
  );

  assert.equal(
    spy.calls,
    1,
  );

  assert.equal(
    approvals.get(validApproval.approvalId)?.status,
    "consumed",
  );

  console.log(
    "Approved request -> provider -> consumed exactly once: PASS",
  );

  // ==========================================================
  // 4. REPLAY
  // ==========================================================

  console.log("[5] Replay protection...");

  const callsBeforeReplay =
    spy.calls;

  await expectBlocked(
    () =>
      gateway.generate({
        agentId,
        provider: "openai",
        request: {
          prompt:
            "3.0-11E valid protected request",
        },
        metadata: {
          requiresReview: true,
          approvalId:
            validApproval.approvalId,
        },
      }),
    "consumed approval replay",
  );

  assert.equal(
    spy.calls,
    callsBeforeReplay,
  );

  console.log(
    "Consumed approval replay -> BLOCK: PASS",
  );

  // ==========================================================
  // 5. TAMPER AGAINST APPROVED APPROVAL
  // ==========================================================

  console.log("[6] Tamper preservation...");

  const tamperApproval =
    await createPendingApproval(
      gateway,
      approvals,
      agentId,
      "3.0-11E original protected request",
    );

  approvals.approve({
    approvalId:
      tamperApproval.approvalId,
    actorId:
      "human-reviewer-tamper",
  });

  const callsBeforeTamper =
    spy.calls;

  await expectBlocked(
    () =>
      gateway.generate({
        agentId,
        provider: "openai",
        request: {
          prompt:
            "ATTACKER MUTATION 3.0-11E",
        },
        metadata: {
          requiresReview: true,
          approvalId:
            tamperApproval.approvalId,
        },
      }),
    "tampered approval",
  );

  assert.equal(
    spy.calls,
    callsBeforeTamper,
  );

  assert.equal(
    approvals.get(
      tamperApproval.approvalId,
    )?.status,
    "approved",
  );

  console.log(
    "Tamper -> BLOCK -> approval remains approved: PASS",
  );

  // ==========================================================
  // 6. WRONG AGENT
  // ==========================================================

  console.log("[7] Wrong-agent protection...");

  const callsBeforeWrongAgent =
    spy.calls;

  await expectBlocked(
    () =>
      gateway.generate({
        agentId:
          "3.0-11e-attacker",
        provider: "openai",
        request: {
          prompt:
            "3.0-11E original protected request",
        },
        metadata: {
          requiresReview: true,
          approvalId:
            tamperApproval.approvalId,
        },
      }),
    "wrong agent",
  );

  assert.equal(
    spy.calls,
    callsBeforeWrongAgent,
  );

  assert.equal(
    approvals.get(
      tamperApproval.approvalId,
    )?.status,
    "approved",
  );

  console.log(
    "Wrong agent -> BLOCK -> approval preserved: PASS",
  );

  // ==========================================================
  // 7. APPROVAL INVENTORY INTEGRITY
  // ==========================================================

  console.log("[8] Approval inventory integrity...");

  const all =
    approvals.list();

  const states =
    all.map(
      (item: any) => item.status,
    );

  assert.ok(
    states.includes("expired"),
    "Expected expired approval",
  );

  assert.ok(
    states.includes("rejected"),
    "Expected rejected approval",
  );

  assert.ok(
    states.includes("consumed"),
    "Expected consumed approval",
  );

  assert.ok(
    states.includes("approved"),
    "Expected preserved approved approval",
  );

  console.log(
    "pending/approved/rejected/expired/consumed lifecycle evidence: PASS",
  );

  // ==========================================================
  // 8. DECISION/EVIDENCE
  // ==========================================================

  console.log("[9] Decision/evidence security trail...");

  const decisions =
    context.decisionStore.getAll();

  const evidence =
    context.evidenceStore.getAll();

  assert.ok(
    decisions.length >= 6,
    `Expected >= 6 decision records, got ${decisions.length}`,
  );

  assert.ok(
    evidence.length >= 6,
    `Expected >= 6 evidence records, got ${evidence.length}`,
  );

  console.log(
    "Decision/evidence persistence: PASS",
  );

  // ==========================================================
  // FINAL
  // ==========================================================

  console.log("");
  console.log("============================================================");
  console.log(" 3.0-11E APPROVAL LIFECYCLE SECURITY: PASS");
  console.log("============================================================");
  console.log("Expiry enforcement                  ✅");
  console.log("Rejection enforcement               ✅");
  console.log("Approved one-time consumption       ✅");
  console.log("Consumed replay blocked             ✅");
  console.log("Request tamper blocked              ✅");
  console.log("Wrong-agent blocked                 ✅");
  console.log("Approval lifecycle integrity        ✅");
  console.log("Decision/evidence persistence       ✅");
  console.log("");
}

main().catch(
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
