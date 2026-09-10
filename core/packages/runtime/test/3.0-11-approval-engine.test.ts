import assert from "node:assert/strict";

import {
  ApprovalEngine,
} from "../src/approval";

async function main(): Promise<void> {

  console.log(
    "[1] Creating ApprovalEngine...",
  );

  const engine =
    new ApprovalEngine();

  const now =
    Date.now();

  const traceId =
    crypto.randomUUID();

  const decisionId =
    crypto.randomUUID();

  const executionId =
    crypto.randomUUID();

  const agentId =
    "3.0-11-approval-agent";

  const expiresAt =
    new Date(
      now + 60_000,
    ).toISOString();

  // ========================================================
  // CREATE
  // ========================================================

  console.log(
    "[2] Creating pending approval...",
  );

  const approval =
    engine.create({
      agentId,

      action:
        "provider.generate",

      traceId,

      decisionId,

      executionId,

      request: {
        prompt:
          "approval test",

        model:
          "spy-model",
      },

      expiresAt,
    });

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

  assert.equal(
    approval.traceId,
    traceId,
  );

  assert.equal(
    approval.decisionId,
    decisionId,
  );

  assert.equal(
    approval.executionId,
    executionId,
  );

  assert.equal(
    approval.decision,
    "ESCALATE",
  );

  assert.ok(
    approval.approvalId,
  );

  assert.match(
    approval.requestHash,
    /^[0-9a-f]{64}$/i,
  );

  console.log(
    "Approval creation: PASS",
  );

  // ========================================================
  // APPROVE
  // ========================================================

  console.log(
    "[3] Approving...",
  );

  const approved =
    engine.approve({
      approvalId:
        approval.approvalId,

      actorId:
        "human-reviewer-1",
    });

  assert.equal(
    approved.status,
    "approved",
  );

  assert.equal(
    approved.approvedBy,
    "human-reviewer-1",
  );

  assert.ok(
    approved.approvedAt,
  );

  console.log(
    "Approval transition: PASS",
  );

  // ========================================================
  // CONSUME
  // ========================================================

  console.log(
    "[4] Consuming approved request...",
  );

  const consumed =
    engine.consume({
      approvalId:
        approved.approvalId,

      agentId,

      action:
        "provider.generate",

      traceId,

      decisionId,

      executionId,

      request: {
        prompt:
          "approval test",

        model:
          "spy-model",
      },
    });

  assert.equal(
    consumed.status,
    "consumed",
  );

  assert.ok(
    consumed.consumedAt,
  );

  console.log(
    "One-time consume: PASS",
  );

  // ========================================================
  // REPLAY PROTECTION
  // ========================================================

  console.log(
    "[5] Testing replay protection...",
  );

  assert.throws(
    () => {
      engine.consume({
        approvalId:
          approved.approvalId,

        agentId,

        action:
          "provider.generate",

        traceId,

        decisionId,

        executionId,

        request: {
          prompt:
            "approval test",

          model:
            "spy-model",
        },
      });
    },
    /cannot be consumed/i,
  );

  console.log(
    "Replay protection: PASS",
  );

  // ========================================================
  // REQUEST BINDING
  // ========================================================

  console.log(
    "[6] Testing request binding...",
  );

  const second =
    engine.create({
      agentId,

      action:
        "provider.generate",

      traceId:

        crypto.randomUUID(),

      decisionId:

        crypto.randomUUID(),

      executionId:

        crypto.randomUUID(),

      request: {
        prompt:
          "original request",
      },

      expiresAt:
        new Date(
          Date.now() + 60_000,
        ).toISOString(),
    });

  engine.approve({
    approvalId:
      second.approvalId,

    actorId:
      "human-reviewer-2",
  });

  assert.throws(
    () => {

      engine.consume({
        approvalId:
          second.approvalId,

        agentId,

        action:
          "provider.generate",

        traceId:
          second.traceId,

        decisionId:
          second.decisionId,

        executionId:
          second.executionId,

        request: {
          prompt:
            "ATTACKER MUTATION",
        },
      });

    },
    /request binding mismatch/i,
  );

  console.log(
    "Request binding: PASS",
  );

  // ========================================================
  // AGENT BINDING
  // ========================================================

  console.log(
    "[7] Testing agent binding...",
  );

  const third =
    engine.create({
      agentId,

      action:
        "provider.generate",

      traceId:
        crypto.randomUUID(),

      decisionId:
        crypto.randomUUID(),

      executionId:
        crypto.randomUUID(),

      request: {
        prompt:
          "agent binding",
      },

      expiresAt:
        new Date(
          Date.now() + 60_000,
        ).toISOString(),
    });

  engine.approve({
    approvalId:
      third.approvalId,

    actorId:
      "human-reviewer-3",
  });

  assert.throws(
    () => {

      engine.consume({
        approvalId:
          third.approvalId,

        agentId:
          "attacker-agent",

        action:
          third.action,

        traceId:
          third.traceId,

        decisionId:
          third.decisionId,

        executionId:
          third.executionId,

        request: {
          prompt:
            "agent binding",
        },
      });

    },
    /agent binding mismatch/i,
  );

  console.log(
    "Agent binding: PASS",
  );

  // ========================================================
  // EXPIRY
  // ========================================================

  console.log(
    "[8] Testing expiry...",
  );

  const expired =
    engine.create({
      agentId,

      action:
        "provider.generate",

      traceId:
        crypto.randomUUID(),

      decisionId:
        crypto.randomUUID(),

      executionId:
        crypto.randomUUID(),

      request: {
        prompt:
          "expired approval",
      },

      expiresAt:
        new Date(
          Date.now() + 5,
        ).toISOString(),
    });

  await new Promise(
    (resolve) =>
      setTimeout(
        resolve,
        15,
      ),
  );

  const expiredState =
    engine.get(
      expired.approvalId,
    );

  assert.equal(
    expiredState?.status,
    "expired",
  );

  assert.throws(
    () => {

      engine.approve({
        approvalId:
          expired.approvalId,

        actorId:
          "human-reviewer-4",
      });

    },
    /cannot be approved/i,
  );

  console.log(
    "Expiry enforcement: PASS",
  );

  // ========================================================
  // REJECTION
  // ========================================================

  console.log(
    "[9] Testing rejection...",
  );

  const rejected =
    engine.create({
      agentId,

      action:
        "provider.generate",

      traceId:
        crypto.randomUUID(),

      decisionId:
        crypto.randomUUID(),

      executionId:
        crypto.randomUUID(),

      request: {
        prompt:
          "rejected approval",
      },

      expiresAt:
        new Date(
          Date.now() + 60_000,
        ).toISOString(),
    });

  const rejection =
    engine.reject({
      approvalId:
        rejected.approvalId,

      actorId:
        "human-reviewer-5",

      reason:
        "Security policy rejection",
    });

  assert.equal(
    rejection.status,
    "rejected",
  );

  assert.equal(
    rejection.rejectedBy,
    "human-reviewer-5",
  );

  assert.equal(
    rejection.rejectionReason,
    "Security policy rejection",
  );

  assert.throws(
    () => {

      engine.consume({
        approvalId:
          rejected.approvalId,

        agentId,

        action:
          rejected.action,

        traceId:
          rejected.traceId,

        decisionId:
          rejected.decisionId,

        executionId:
          rejected.executionId,

        request: {
          prompt:
            "rejected approval",
        },
      });

    },
    /cannot be consumed/i,
  );

  console.log(
    "Rejection enforcement: PASS",
  );

  // ========================================================
  // FINAL
  // ========================================================

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    " 3.0-11B/C APPROVAL ENGINE: PASS",
  );
  console.log(
    "============================================================",
  );
  console.log(
    "Canonical approval contract       ✅",
  );
  console.log(
    "Pending -> Approved               ✅",
  );
  console.log(
    "Approved -> Consumed              ✅",
  );
  console.log(
    "Replay protection                 ✅",
  );
  console.log(
    "Request binding                   ✅",
  );
  console.log(
    "Agent binding                     ✅",
  );
  console.log(
    "Expiry enforcement                ✅",
  );
  console.log(
    "Rejection enforcement             ✅",
  );
}

main().catch(
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
