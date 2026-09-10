import assert from "node:assert/strict";

import {
  EnterpriseRuntimeApprovalBridge,
} from "@aegisora/core";

import {
  EnforcementGate,
} from "../src/enforcement";

import {
  PermissionEngine,
} from "../src/permissions";

import {
  RuntimeContext,
} from "../src/context/runtime-context";

async function main(): Promise<void> {

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    " 3.0-11D.2 ENTERPRISE ENFORCEMENT WIRING",
  );
  console.log(
    "============================================================",
  );

  const context =
    new RuntimeContext();

  const bridge =
    new EnterpriseRuntimeApprovalBridge();

  const gate =
    new EnforcementGate(
      context,
      new PermissionEngine(),
      undefined,
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
      "enterprise-agent",

    name:
      "enterprise-agent",
  });

  const agent =
    context.agentRegistry.getById(
      "enterprise-agent",
    );

  assert.ok(
    agent,
    "Enterprise agent was not registered.",
  );

  assert.equal(
    agent!.id,
    "enterprise-agent",
  );

  const originalInput = {
    prompt:
      "enterprise-controlled request",
  };

  const approvalRequest = {
    resourceType:
      "provider" as const,
    tool:
      "provider:openai",
    input:
      originalInput,
  };

  console.log(
    "[1] Enterprise ESCALATE...",
  );

  const escalated =
    await gate.enforce({

      agentId:
        "enterprise-agent",

      resourceType:
        "provider",

      tool:
        "provider:openai",

      action:
        "provider.generate",

      input:
        originalInput,

      metadata: {
        requiresReview:
          true,
      },
    });

  assert.equal(
    escalated.decision,
    "ESCALATE",
  );

  const decisions =
    context.decisionStore.getAll();

  const escalation =
    decisions
      .find(
        (item: any) =>
          item.decision ===
            "escalate" &&
          typeof item.metadata
            ?.approvalId === "string",
      );

  assert.ok(
    escalation,
    "Escalation decision with runtime approvalId not found.",
  );

  const runtimeApprovalId =
    String(
      (escalation as any)
        .metadata
        .approvalId,
    );

  const enterpriseApprovalId =
    String(
      (escalation as any)
        .metadata
        .enterpriseApprovalId,
    );

  assert.ok(
    runtimeApprovalId,
  );

  assert.ok(
    enterpriseApprovalId,
  );

  console.log(
    "Runtime -> enterprise approval binding: PASS",
  );

  console.log(
    "[2] Enterprise approval lookup...",
  );

  const enterprise =
    bridge.getByRuntimeApprovalId(
      "workspace-a",
      runtimeApprovalId,
    );

  assert.ok(
    enterprise,
  );

  assert.equal(
    enterprise!.approvalId,
    enterpriseApprovalId,
  );

  assert.equal(
    enterprise!.runtimeApprovalId,
    runtimeApprovalId,
  );

  assert.equal(
    enterprise!.workspaceId,
    "workspace-a",
  );

  console.log(
    "Enterprise approval record: PASS",
  );

  console.log(
    "[3] Workspace-B approval lookup must fail...",
  );

  assert.throws(
    () =>
      bridge.getByRuntimeApprovalId(
        "workspace-b",
        runtimeApprovalId,
      ),
    /workspace/i,
  );

  console.log(
    "Cross-workspace approval blocked: PASS",
  );

  console.log(
    "[4] Workspace-A human approval...",
  );

  const approved =
    bridge.approve({

      workspaceId:
        "workspace-a",

      runtimeApprovalId:
        runtimeApprovalId,

      actorId:
        "security-admin",

      reason:
        "Approved for controlled execution.",
    });

  assert.equal(
    approved.status,
    "approved",
  );

  console.log(
    "Enterprise approval resolution: PASS",
  );

  /*
   * Runtime approval must also be approved.
   *
   * 11D.2 intentionally does NOT let an enterprise
   * record bypass the existing runtime ApprovalEngine.
   *
   * This keeps the existing runtime security boundary
   * authoritative while the enterprise record provides
   * workspace-scoped control-plane correlation.
   */

  const runtimeApproval =
    gate
      .getApprovalEngine()
      .get(runtimeApprovalId);

  assert.ok(
    runtimeApproval,
  );

  gate
    .getApprovalEngine()
    .approve({
      approvalId:
        runtimeApprovalId,

      agentId:
        "enterprise-agent",

      action:
        "provider.generate",

      traceId:
        runtimeApproval!.traceId,

      decisionId:
        runtimeApproval!.decisionId,

      executionId:
        runtimeApproval!.executionId,

      request:
        approvalRequest,

      expiresAt:
        runtimeApproval!.expiresAt,
    });

  console.log(
    "Runtime approval resolution: PASS",
  );

  console.log(
    "[5] Wrong workspace resume...",
  );

  const wrongWorkspaceGate =
    new EnforcementGate(
      context,
      new PermissionEngine(),
      gate.getApprovalEngine(),
      {
        workspaceId:
          "workspace-b",

        requesterId:
          "principal-b",

        bridge,
      },
    );

  const wrongWorkspaceResult =
    await wrongWorkspaceGate.enforce({

      agentId:
        "enterprise-agent",

      resourceType:
        "provider",

      tool:
        "provider:openai",

      action:
        "provider.generate",

      input: {
        prompt:
          "cross-workspace replay",
      },

      metadata: {
        approvalId:
          runtimeApprovalId,
      },
    });

  assert.equal(
    wrongWorkspaceResult.decision,
    "BLOCK",
  );

  console.log(
    "Workspace-B resume -> BLOCK: PASS",
  );

  console.log(
    "[6] Exact Workspace-A resume...",
  );

  const resumed =
    await gate.enforce({

      agentId:
        "enterprise-agent",

      resourceType:
        "provider",

      tool:
        "provider:openai",

      action:
        "provider.generate",

      input:
        originalInput,

      metadata: {
        approvalId:
          runtimeApprovalId,
      },
    });

  assert.equal(
    resumed.decision,
    "ALLOW",
  );

  console.log(
    "Workspace-A exact resume -> ALLOW: PASS",
  );

  console.log(
    "[7] Replay...",
  );

  const replay =
    await gate.enforce({

      agentId:
        "enterprise-agent",

      resourceType:
        "provider",

      tool:
        "provider:openai",

      action:
        "provider.generate",

      input:
        originalInput,

      metadata: {
        approvalId:
          runtimeApprovalId,
      },
    });

  assert.equal(
    replay.decision,
    "BLOCK",
  );

  console.log(
    "Enterprise/runtime replay -> BLOCK: PASS",
  );

  console.log(
    "[8] Agent tamper...",
  );

  const tamperedAgent =
    await gate.enforce({

      agentId:
        "foreign-agent",

      resourceType:
        "provider",

      tool:
        "provider:openai",

      action:
        "provider.generate",

      input:
        originalInput,

      metadata: {
        approvalId:
          runtimeApprovalId,
      },
    });

  assert.equal(
    tamperedAgent.decision,
    "BLOCK",
  );

  console.log(
    "Wrong-agent resume -> BLOCK: PASS",
  );

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    " 3.0-11D.2 ENTERPRISE ENFORCEMENT WIRING: PASS",
  );
  console.log(
    "============================================================",
  );
  console.log(
    "Trusted workspace scope              ✅",
  );
  console.log(
    "Runtime -> enterprise binding         ✅",
  );
  console.log(
    "Enterprise identity correlation       ✅",
  );
  console.log(
    "Cross-workspace replay blocked        ✅",
  );
  console.log(
    "Exact workspace resume                ✅",
  );
  console.log(
    "Wrong-agent resume blocked             ✅",
  );
  console.log(
    "Runtime replay blocked                 ✅",
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
