import assert from "node:assert/strict";

import {
  EnterpriseApprovalAccessDeniedError,
  EnterpriseApprovalInvalidStateError,
  EnterpriseApprovalRegistry,
} from "../src/enterprise/approvals";

function future(
  seconds: number,
): string {

  return new Date(
    Date.now() +
    seconds * 1000,
  ).toISOString();
}

function baseInput(
  workspaceId: string,
) {

  return {
    workspaceId,

    runtimeApprovalId:
      `runtime-${workspaceId}`,

    agentId:
      "enterprise-agent-01",

    requesterId:
      "user-requester",

    decisionId:
      "decision-01",

    traceId:
      "trace-01",

    executionId:
      "execution-01",

    evidenceId:
      "evidence-01",

    action:
      "provider.generate",

    resourceType:
      "provider",

    resource:
      "provider:openai",

    riskScore:
      85,

    policyVersion:
      3,

    reason:
      "High-risk execution requires human approval.",

    expiresAt:
      future(3600),

    metadata: {
      source:
        "3.0-11-enterprise-approval-test",
    },
  };
}

function expectInvalid(
  callback: () => unknown,
): void {

  assert.throws(
    callback,
    (
      error: unknown,
    ) =>
      error instanceof
      EnterpriseApprovalInvalidStateError,
  );
}

async function main(): Promise<void> {

  console.log(
    "[1] Create pending enterprise approval...",
  );

  const registry =
    new EnterpriseApprovalRegistry();

  const approval =
    registry.create(
      baseInput("workspace-a"),
    );

  assert.equal(
    approval.status,
    "pending",
  );

  assert.equal(
    approval.workspaceId,
    "workspace-a",
  );

  assert.equal(
    approval.decision,
    "ESCALATE",
  );

  assert.equal(
    approval.riskScore,
    85,
  );

  assert.ok(
    approval.approvalId,
  );

  console.log(
    "Pending approval: PASS",
  );

  // ========================================================
  // TENANT ISOLATION
  // ========================================================

  console.log(
    "[2] Verify workspace isolation...",
  );

  assert.throws(
    () =>
      registry.getForWorkspace(
        "workspace-b",
        approval.approvalId,
      ),
    (
      error: unknown,
    ) =>
      error instanceof
      EnterpriseApprovalAccessDeniedError,
  );

  assert.equal(
    registry.list("workspace-b").length,
    0,
  );

  console.log(
    "Tenant isolation: PASS",
  );

  // ========================================================
  // APPROVE
  // ========================================================

  console.log(
    "[3] Approve...",
  );

  const approved =
    registry.approve({
      approvalId:
        approval.approvalId,

      workspaceId:
        "workspace-a",

      approverId:
        "security-admin",

      reason:
        "Reviewed and approved for controlled execution.",
    });

  assert.equal(
    approved.status,
    "approved",
  );

  assert.equal(
    approved.approvedBy,
    "security-admin",
  );

  assert.ok(
    approved.approvedAt,
  );

  assert.ok(
    approved.resolvedAt,
  );

  assert.equal(
    approved.resolvedBy,
    "security-admin",
  );

  console.log(
    "Approve lifecycle: PASS",
  );

  // ========================================================
  // ONE-TIME CONSUME
  // ========================================================

  console.log(
    "[4] Consume approved execution...",
  );

  const consumed =
    registry.consume({
      approvalId:
        approval.approvalId,

      workspaceId:
        "workspace-a",

      executionId:
        "execution-01",
    });

  assert.equal(
    consumed.status,
    "consumed",
  );

  assert.ok(
    consumed.consumedAt,
  );

  console.log(
    "One-time consumption: PASS",
  );

  expectInvalid(
    () =>
      registry.consume({
        approvalId:
          approval.approvalId,

        workspaceId:
          "workspace-a",

        executionId:
          "execution-01",
      }),
  );

  console.log(
    "Replay protection: PASS",
  );

  // ========================================================
  // REJECTION
  // ========================================================

  console.log(
    "[5] Rejection lifecycle...",
  );

  const rejected =
    registry.create({
      ...baseInput("workspace-a"),
      runtimeApprovalId:
        "runtime-approval-rejection-lifecycle",
    });

  const rejection =
    registry.reject({
      approvalId:
        rejected.approvalId,

      workspaceId:
        "workspace-a",

      rejectorId:
        "security-reviewer",

      reason:
        "Execution exceeds approved risk tolerance.",
    });

  assert.equal(
    rejection.status,
    "rejected",
  );

  assert.equal(
    rejection.rejectedBy,
    "security-reviewer",
  );

  assert.equal(
    rejection.rejectionReason,
    "Execution exceeds approved risk tolerance.",
  );

  expectInvalid(
    () =>
      registry.consume({
        approvalId:
          rejected.approvalId,

        workspaceId:
          "workspace-a",

        executionId:
          "execution-01",
      }),
  );

  console.log(
    "Rejected lifecycle: PASS",
  );

  // ========================================================
  // EXPIRE
  // ========================================================

  console.log(
    "[6] Expiration lifecycle...",
  );

  const expiring =
    registry.create({
      ...baseInput("workspace-a"),
      runtimeApprovalId:
        "runtime-approval-expiration-lifecycle",
      expiresAt:
        future(3600),
    });

  const expired =
    registry.expire({
      approvalId:
        expiring.approvalId,

      workspaceId:
        "workspace-a",

      actorId:
        "system",
    });

  assert.equal(
    expired.status,
    "expired",
  );

  assert.ok(
    expired.resolvedAt,
  );

  expectInvalid(
    () =>
      registry.approve({
        approvalId:
          expiring.approvalId,

        workspaceId:
          "workspace-a",

        approverId:
          "security-admin",
      }),
  );

  console.log(
    "Expired lifecycle: PASS",
  );

  // ========================================================
  // EXECUTION BINDING
  // ========================================================

  console.log(
    "[7] Execution binding...",
  );

  const bound =
    registry.create({
      ...baseInput("workspace-a"),
      runtimeApprovalId:
        "runtime-approval-execution-binding",
    });

  registry.approve({
    approvalId:
      bound.approvalId,

    workspaceId:
      "workspace-a",

    approverId:
      "security-admin",
  });

  expectInvalid(
    () =>
      registry.consume({
        approvalId:
          bound.approvalId,

        workspaceId:
          "workspace-a",

        executionId:
          "foreign-execution",
      }),
  );

  console.log(
    "Execution binding: PASS",
  );

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    " 3.0-11C ENTERPRISE APPROVAL TEST: PASS",
  );
  console.log(
    "============================================================",
  );
  console.log(
    "PENDING -> APPROVED        PASS",
  );
  console.log(
    "PENDING -> REJECTED        PASS",
  );
  console.log(
    "PENDING -> EXPIRED         PASS",
  );
  console.log(
    "APPROVED -> CONSUMED       PASS",
  );
  console.log(
    "CONSUMED replay blocked    PASS",
  );
  console.log(
    "Foreign workspace blocked  PASS",
  );
  console.log(
    "Execution binding          PASS",
  );
}

main().catch(
  (
    error: unknown,
  ) => {

    console.error(error);
    process.exit(1);
  },
);
