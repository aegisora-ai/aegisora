import assert from "node:assert/strict";

import {
  EnterpriseRuntimeApprovalBridge,
} from "@aegisora/core";

import {
  EnterpriseApprovalResolutionSync,
} from "../src/approval";

import {
  ApprovalEngine,
} from "../src/approval/approval-engine";

import {
  EnforcementGate,
} from "../src/enforcement";

import {
  PermissionEngine,
} from "../src/permissions";

import {
  RuntimeContext,
} from "../src/context/runtime-context";

async function escalate(
  gate: EnforcementGate,
  input: Record<string, unknown>,
) {
  return gate.enforce({
    agentId:
      "sync-agent",
    resourceType:
      "provider",
    tool:
      "provider:openai",
    action:
      "provider.generate",
    input,
    metadata: {
      requiresReview:
        true,
    },
  });
}

function getRuntimeApprovalId(
  context: RuntimeContext,
): string {

  const decision =
    [...context.decisionStore.getAll()]
      .reverse()
      .find(
        (item: any) =>
          item.decision ===
            "escalate" &&
          typeof item.metadata
            ?.approvalId === "string",
      );

  assert.ok(
    decision,
    "Escalation decision not found.",
  );

  return String(
    (decision as any)
      .metadata
      .approvalId,
  );
}

async function main(): Promise<void> {

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    " 3.0-11D.3 ENTERPRISE APPROVAL RESOLUTION SYNC",
  );
  console.log(
    "============================================================",
  );

  const context =
    new RuntimeContext();

  const bridge =
    new EnterpriseRuntimeApprovalBridge();

  const runtime =
    new ApprovalEngine();

  const gate =
    new EnforcementGate(
      context,
      new PermissionEngine(),
      runtime,
      {
        workspaceId:
          "workspace-a",
        requesterId:
          "principal-a",
        bridge,
      },
    );

  context.agentRegistry.register({
    id:
      "sync-agent",
    name:
      "sync-agent",
  });

  const sync =
    new EnterpriseApprovalResolutionSync(
      bridge,
      runtime,
    );

  /* ========================================================== */
  // APPROVE
  /* ========================================================== */

  console.log("");
  console.log(
    "[1] APPROVE sync...",
  );

  const approvedInput = {
    prompt:
      "approve-sync",
  };

  const approvedEscalation =
    await escalate(
      gate,
      approvedInput,
    );

  assert.equal(
    approvedEscalation.decision,
    "ESCALATE",
  );

  const approvedId =
    getRuntimeApprovalId(
      context,
    );

  const approvedResult =
    sync.approve({
      workspaceId:
        "workspace-a",
      runtimeApprovalId:
        approvedId,
      actorId:
        "security-admin",
      reason:
        "Approved by enterprise control plane.",
    });

  assert.equal(
    approvedResult.status,
    "approved",
  );

  assert.equal(
    approvedResult.runtimeStatus,
    "approved",
  );

  const approvedEnterprise =
    bridge.getByRuntimeApprovalId(
      "workspace-a",
      approvedId,
    );

  assert.ok(
    approvedEnterprise,
  );

  assert.equal(
    approvedEnterprise!.status,
    "approved",
  );

  const approvedRuntime =
    runtime.get(
      approvedId,
    );

  assert.ok(
    approvedRuntime,
  );

  assert.equal(
    approvedRuntime!.status,
    "approved",
  );

  console.log(
    "Enterprise APPROVED ↔ Runtime APPROVED: PASS",
  );

  /* ========================================================== */
  // WRONG WORKSPACE
  /* ========================================================== */

  console.log("");
  console.log(
    "[2] Cross-workspace resolution...",
  );

  assert.throws(
    () =>
      sync.approve({
        workspaceId:
          "workspace-b",
        runtimeApprovalId:
          approvedId,
        actorId:
          "security-admin",
      }),
    /workspace|pending|denied/i,
  );

  console.log(
    "Cross-workspace resolution blocked: PASS",
  );

  /* ========================================================== */
  // DOUBLE RESOLUTION
  /* ========================================================== */

  console.log("");
  console.log(
    "[3] Double resolution...",
  );

  assert.throws(
    () =>
      sync.approve({
        workspaceId:
          "workspace-a",
        runtimeApprovalId:
          approvedId,
        actorId:
          "security-admin",
      }),
    /pending|approved|consumed/i,
  );

  console.log(
    "Double resolution blocked: PASS",
  );

  /* ========================================================== */
  // REJECT
  /* ========================================================== */

  console.log("");
  console.log(
    "[4] REJECT sync...",
  );

  const rejectedEscalation =
    await escalate(
      gate,
      {
        prompt:
          "reject-sync",
      },
    );

  assert.equal(
    rejectedEscalation.decision,
    "ESCALATE",
  );

  const rejectedId =
    getRuntimeApprovalId(
      context,
    );

  const rejectedResult =
    sync.reject({
      workspaceId:
        "workspace-a",
      runtimeApprovalId:
        rejectedId,
      actorId:
        "security-admin",
      reason:
        "Rejected by enterprise security review.",
    });

  assert.equal(
    rejectedResult.status,
    "rejected",
  );

  assert.equal(
    rejectedResult.runtimeStatus,
    "rejected",
  );

  console.log(
    "Enterprise REJECTED ↔ Runtime REJECTED: PASS",
  );

  /* ========================================================== */
  // EXPIRE
  /* ========================================================== */

  console.log("");
  console.log(
    "[5] EXPIRE sync...",
  );

  const expiredEscalation =
    await escalate(
      gate,
      {
        prompt:
          "expire-sync",
      },
    );

  assert.equal(
    expiredEscalation.decision,
    "ESCALATE",
  );

  const expiredId =
    getRuntimeApprovalId(
      context,
    );

  const expiredResult =
    sync.expire({
      workspaceId:
        "workspace-a",
      runtimeApprovalId:
        expiredId,
      actorId:
        "system",
      reason:
        "Approval expired by control plane.",
    });

  assert.equal(
    expiredResult.status,
    "expired",
  );

  assert.equal(
    expiredResult.runtimeStatus,
    "expired",
  );

  console.log(
    "Enterprise EXPIRED ↔ Runtime EXPIRED: PASS",
  );

  /* ========================================================== */
  // APPROVED RESUME + CONSUMED STATE
  /* ========================================================== */

  console.log("");
  console.log(
    "[6] Approved resume + consumed lifecycle...",
  );

  const resumed =
    await gate.enforce({
      agentId:
        "sync-agent",
      resourceType:
        "provider",
      tool:
        "provider:openai",
      action:
        "provider.generate",
      input:
        approvedInput,
      metadata: {
        approvalId:
          approvedId,
      },
    });

  assert.equal(
    resumed.decision,
    "ALLOW",
  );

  const consumedEnterprise =
    bridge.getByRuntimeApprovalId(
      "workspace-a",
      approvedId,
    );

  assert.ok(
    consumedEnterprise,
  );

  assert.equal(
    consumedEnterprise!.status,
    "consumed",
  );

  assert.throws(
    () =>
      sync.approve({
        workspaceId:
          "workspace-a",
        runtimeApprovalId:
          approvedId,
        actorId:
          "security-admin",
      }),
    /pending|consumed/i,
  );

  console.log(
    "Approved → consumed; post-consume resolution blocked: PASS",
  );

  /* ========================================================== */
  // FINAL
  /* ========================================================== */

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    " 3.0-11D.3 ENTERPRISE APPROVAL RESOLUTION SYNC: PASS",
  );
  console.log(
    "============================================================",
  );
  console.log(
    "Approve synchronization                  ✅",
  );
  console.log(
    "Reject synchronization                   ✅",
  );
  console.log(
    "Expire synchronization                   ✅",
  );
  console.log(
    "Cross-workspace resolution blocked      ✅",
  );
  console.log(
    "Double resolution blocked               ✅",
  );
  console.log(
    "Post-consume resolution blocked         ✅",
  );
  console.log(
    "Enterprise/runtime lifecycle parity    ✅",
  );
}

main().catch(
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);