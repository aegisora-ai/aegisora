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
      `APPROVAL-11F:${request.prompt}`,
    );
  }
}

async function main(): Promise<void> {

  console.log("");
  console.log("============================================================");
  console.log(" 3.0-11F APPROVAL ↔ DECISION ↔ EVIDENCE ↔ AUDIT");
  console.log("============================================================");

  // ==========================================================
  // BOOTSTRAP
  // ==========================================================

  console.log("[1] Bootstrapping canonical runtime...");

  const context =
    new RuntimeContext();

  const executionToken =
    Symbol(
      "aegisora.3.0.11f.e2e",
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
    "3.0-11f-correlation-agent";

  context.agentRegistry.register({
    id: agentId,
    name: "3.0-11F Correlation Agent",
    status: "idle",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.ok(
    context.agentRegistry.getById(agentId),
  );

  console.log(
    "Canonical runtime identity: PASS",
  );

  // ==========================================================
  // ESCALATE
  // ==========================================================

  console.log(
    "[2] Creating approval-producing ESCALATE...",
  );

  const protectedPrompt =
    "3.0-11F canonical approval correlation";

  await assert.rejects(
    gateway.generate({
      agentId,
      provider: "openai",
      request: {
        prompt: protectedPrompt,
      },
      metadata: {
        requiresReview: true,
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
  );

  const pending =
    approvals.list().filter(
      (item) =>
        item.agentId === agentId &&
        item.status === "pending",
    );

  assert.equal(
    pending.length,
    1,
  );

  const approval =
    pending[0];

  assert.ok(
    approval,
  );

  console.log(
    "ESCALATE -> approval persisted -> provider blocked: PASS",
  );

  // ==========================================================
  // APPROVAL IDENTITY
  // ==========================================================

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

  assert.ok(
    approval.requestHash,
  );

  console.log(
    "Approval canonical identity: PASS",
  );

  // ==========================================================
  // APPROVE + RESUME
  // ==========================================================

  console.log(
    "[3] Approving and resuming bound execution...",
  );

  approvals.approve({
    approvalId:
      approval.approvalId,
    actorId:
      "human-reviewer-11f",
  });

  const beforeResume =
    context.decisionStore.getAll();

  const beforeEvidence =
    context.evidenceStore.getAll();

  const response =
    await gateway.generate({
      agentId,
      provider: "openai",
      request: {
        prompt: protectedPrompt,
      },
      metadata: {
        requiresReview: true,
        approvalId:
          approval.approvalId,
      },
    });

  assert.equal(
    response.output,
    `APPROVAL-11F:${protectedPrompt}`,
  );

  assert.equal(
    spy.calls,
    1,
  );

  assert.equal(
    approvals.get(
      approval.approvalId,
    )?.status,
    "consumed",
  );

  console.log(
    "Approved bound execution: PASS",
  );

  // ==========================================================
  // DECISION DELTA
  // ==========================================================

  const afterResume =
    context.decisionStore.getAll();

  const decisionDelta =
    afterResume.slice(
      beforeResume.length,
    );

  assert.ok(
    decisionDelta.length >= 1,
    "Expected new enforcement decision on resume",
  );

  const resumedDecision =
    decisionDelta[
      decisionDelta.length - 1
    ] as any;

  assert.ok(
    resumedDecision.traceId,
    "Resumed decision must have traceId",
  );

  assert.ok(
    resumedDecision.decisionId,
    "Resumed decision must have decisionId",
  );

  assert.ok(
    resumedDecision.executionId,
    "Resumed decision must have executionId",
  );

  // New enforcement execution MUST NOT silently reuse
  // the original approval's decision/execution identity.
  assert.notEqual(
    resumedDecision.decisionId,
    approval.decisionId,
    "Resumed enforcement needs independent decisionId",
  );

  assert.notEqual(
    resumedDecision.executionId,
    approval.executionId,
    "Resumed enforcement needs independent executionId",
  );

  console.log(
    "Resume creates independent enforcement correlation: PASS",
  );

  // ==========================================================
  // EVIDENCE DELTA
  // ==========================================================

  const afterEvidence =
    context.evidenceStore.getAll();

  const evidenceDelta =
    afterEvidence.slice(
      beforeEvidence.length,
    );

  assert.ok(
    evidenceDelta.length >= 1,
    "Expected evidence on resumed execution",
  );

  // Search the complete evidence chain for approval linkage.
  const approvalEvidenceRecords =
    afterEvidence.filter(
      (item: any) =>
        item?.metadata?.approvalId ===
        approval.approvalId,
    );

  assert.ok(
    approvalEvidenceRecords.length >= 2,
    [
      "Expected both original ESCALATE and resumed evidence.",
      `approvalId=${approval.approvalId}`,
      `count=${approvalEvidenceRecords.length}`,
    ].join(" "),
  );

  const originalApprovalEvidence =
    approvalEvidenceRecords.find(
      (item: any) =>
        item?.decisionId ===
        approval.decisionId &&
        item?.executionId ===
        approval.executionId &&
        item?.enforcementStatus ===
        "escalated",
    );

  assert.ok(
    originalApprovalEvidence,
    "Original approval-producing ESCALATE evidence missing",
  );

  const resumedApprovalEvidence =
    approvalEvidenceRecords.find(
      (item: any) =>
        item?.decisionId &&
        item?.decisionId !==
          approval.decisionId &&
        item?.executionId &&
        item?.executionId !==
          approval.executionId,
    );

  assert.ok(
    resumedApprovalEvidence,
    "Resumed execution evidence with independent correlation missing",
  );

  console.log(
    "Approval -> original ESCALATE evidence correlation: PASS",
  );

  console.log(
    "Approval -> resumed execution evidence correlation: PASS",
  );

  // ==========================================================
  // CANONICAL FIELD INTEGRITY
  // ==========================================================

  const approvalEvidenceAny =
    resumedApprovalEvidence as any;

  assert.ok(
    approvalEvidenceAny.metadata,
    "Approval evidence must expose metadata",
  );

  assert.equal(
    approvalEvidenceAny.metadata.approvalId,
    approval.approvalId,
  );

  if (approvalEvidenceAny.traceId) {
    assert.ok(
      typeof approvalEvidenceAny.traceId === "string",
    );
  }

  if (approvalEvidenceAny.decisionId) {
    assert.ok(
      typeof approvalEvidenceAny.decisionId === "string",
    );
  }

  if (approvalEvidenceAny.executionId) {
    assert.ok(
      typeof approvalEvidenceAny.executionId === "string",
    );
  }

  console.log(
    "Canonical evidence identity integrity: PASS",
  );

  // ==========================================================
  // ORIGINAL APPROVAL VS RESUMED DECISION
  // ==========================================================

  assert.equal(
    typeof approvalEvidenceAny.traceId,
    "string",
  );

  assert.equal(
    typeof approvalEvidenceAny.decisionId,
    "string",
  );

  assert.equal(
    typeof approvalEvidenceAny.executionId,
    "string",
  );

  assert.notEqual(
    approvalEvidenceAny.traceId,
    approval.traceId,
    "Resumed evidence must have independent traceId",
  );

  assert.notEqual(
    approvalEvidenceAny.decisionId,
    approval.decisionId,
    "Resumed evidence must have independent decisionId",
  );

  assert.notEqual(
    approvalEvidenceAny.executionId,
    approval.executionId,
    "Resumed evidence must have independent executionId",
  );

  console.log(
    "Original approval identity preserved separately from resumed execution: PASS",
  );

  // ==========================================================
  // APPROVAL RECORD IMMUTABILITY SEMANTICS
  // ==========================================================

  const finalApproval =
    approvals.get(
      approval.approvalId,
    );

  assert.ok(
    finalApproval,
  );

  assert.equal(
    finalApproval?.traceId,
    approval.traceId,
  );

  assert.equal(
    finalApproval?.decisionId,
    approval.decisionId,
  );

  assert.equal(
    finalApproval?.executionId,
    approval.executionId,
  );

  assert.equal(
    finalApproval?.requestHash,
    approval.requestHash,
  );

  assert.equal(
    finalApproval?.status,
    "consumed",
  );

  console.log(
    "Approval canonical binding remains immutable: PASS",
  );

  // ==========================================================
  // AUDIT CHAIN SANITY
  // ==========================================================

  const decisions =
    context.decisionStore.getAll();

  const evidence =
    context.evidenceStore.getAll();

  assert.ok(
    decisions.length >= 2,
  );

  assert.ok(
    evidence.length >= 2,
  );

  console.log(
    "Decision + evidence audit persistence: PASS",
  );

  // ==========================================================
  // FINAL
  // ==========================================================

  console.log("");
  console.log("============================================================");
  console.log(" 3.0-11F APPROVAL CORRELATION: PASS");
  console.log("============================================================");
  console.log("Approval identity                    ✅");
  console.log("ESCALATE audit record                ✅");
  console.log("Approved resume                      ✅");
  console.log("Independent resumed correlation      ✅");
  console.log("Approval -> evidence correlation     ✅");
  console.log("Canonical identity integrity         ✅");
  console.log("Approval binding immutability         ✅");
  console.log("Decision/evidence persistence         ✅");
  console.log("");
}

main().catch(
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
