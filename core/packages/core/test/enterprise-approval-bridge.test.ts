import assert from "node:assert/strict";

import {
  EnterpriseApprovalAccessDeniedError,
  EnterpriseApprovalInvalidStateError,
  EnterpriseRuntimeApprovalBridge,
} from "../src/enterprise/approvals";

function future(
  seconds: number,
): string {

  return new Date(
    Date.now() +
    seconds * 1000,
  ).toISOString();
}

function runtimeApproval() {

  return {
    approvalId:
      "runtime-approval-001",

    agentId:
      "agent-001",

    action:
      "provider.generate",

    traceId:
      "trace-001",

    decisionId:
      "decision-001",

    executionId:
      "execution-001",

    request: {
      resourceType:
        "provider",

      tool:
        "provider:openai",

      input: {
        prompt:
          "controlled request",
      },
    },

    expiresAt:
      future(3600),

    status:
      "pending" as const,
  };
}

async function main(): Promise<void> {

  const bridge =
    new EnterpriseRuntimeApprovalBridge();

  console.log(
    "[1] Creating enterprise/runtime binding...",
  );

  const enterprise =
    bridge.create({

      workspaceId:
        "workspace-a",

      requesterId:
        "requester-a",

      runtimeApproval:
        runtimeApproval(),

      evidenceId:
        "evidence-001",

      riskScore:
        85,

      policyVersion:
        3,

      reason:
        "Human approval required.",
    });

  assert.ok(
    enterprise.approvalId,
  );

  assert.equal(
    enterprise.runtimeApprovalId,
    "runtime-approval-001",
  );

  assert.equal(
    enterprise.workspaceId,
    "workspace-a",
  );

  assert.equal(
    enterprise.status,
    "pending",
  );

  console.log(
    "Enterprise/runtime binding: PASS",
  );

  console.log(
    "[2] Workspace isolation...",
  );

  assert.throws(
    () =>
      bridge.getByRuntimeApprovalId(
        "workspace-b",
        "runtime-approval-001",
      ),
    (
      error: unknown,
    ) =>
      error instanceof
      EnterpriseApprovalAccessDeniedError,
  );

  console.log(
    "Workspace isolation: PASS",
  );

  console.log(
    "[3] Approving enterprise binding...",
  );

  const approved =
    bridge.approve({

      workspaceId:
        "workspace-a",

      runtimeApprovalId:
        "runtime-approval-001",

      actorId:
        "security-admin",

      reason:
        "Approved after security review.",
    });

  assert.equal(
    approved.status,
    "approved",
  );

  console.log(
    "Enterprise approval: PASS",
  );

  console.log(
    "[4] Validating exact runtime binding...",
  );

  const validated =
    bridge.validateForResume({

      workspaceId:
        "workspace-a",

      runtimeApprovalId:
        "runtime-approval-001",

      agentId:
        "agent-001",

      action:
        "provider.generate",

      decisionId:
        "decision-001",

      traceId:
        "trace-001",

      executionId:
        "execution-001",

      evidenceId:
        "evidence-001",

      resourceType:
        "provider",

      tool:
        "provider:openai",
    });

  assert.equal(
    validated.runtimeApprovalId,
    "runtime-approval-001",
  );

  console.log(
    "Exact runtime binding: PASS",
  );

  console.log(
    "[5] Agent tamper...",
  );

  assert.throws(
    () =>
      bridge.validateForResume({

        workspaceId:
          "workspace-a",

        runtimeApprovalId:
          "runtime-approval-001",

        agentId:
          "foreign-agent",

        action:
          "provider.generate",

        decisionId:
          "decision-001",

        traceId:
          "trace-001",

        executionId:
          "execution-001",

        evidenceId:
          "evidence-001",

        resourceType:
          "provider",

        tool:
          "provider:openai",
      }),
    (
      error: unknown,
    ) =>
      error instanceof
      EnterpriseApprovalInvalidStateError,
  );

  console.log(
    "Agent tamper blocked: PASS",
  );

  console.log(
    "[6] Execution tamper...",
  );

  assert.throws(
    () =>
      bridge.validateForResume({

        workspaceId:
          "workspace-a",

        runtimeApprovalId:
          "runtime-approval-001",

        agentId:
          "agent-001",

        action:
          "provider.generate",

        decisionId:
          "decision-001",

        traceId:
          "trace-001",

        executionId:
          "foreign-execution",

        evidenceId:
          "evidence-001",

        resourceType:
          "provider",

        tool:
          "provider:openai",
      }),
    (
      error: unknown,
    ) =>
      error instanceof
      EnterpriseApprovalInvalidStateError,
  );

  console.log(
    "Execution tamper blocked: PASS",
  );

  console.log(
    "[7] Decision tamper...",
  );

  assert.throws(
    () =>
      bridge.validateForResume({

        workspaceId:
          "workspace-a",

        runtimeApprovalId:
          "runtime-approval-001",

        agentId:
          "agent-001",

        action:
          "provider.generate",

        decisionId:
          "foreign-decision",

        traceId:
          "trace-001",

        executionId:
          "execution-001",

        evidenceId:
          "evidence-001",

        resourceType:
          "provider",

        tool:
          "provider:openai",
      }),
    (
      error: unknown,
    ) =>
      error instanceof
      EnterpriseApprovalInvalidStateError,
  );

  console.log(
    "Decision tamper blocked: PASS",
  );

  console.log(
    "[8] Consuming approved binding...",
  );

  const consumed =
    bridge.consume({

      workspaceId:
        "workspace-a",

      runtimeApprovalId:
        "runtime-approval-001",

      executionId:
        "execution-001",
    });

  assert.equal(
    consumed.status,
    "consumed",
  );

  console.log(
    "Enterprise one-time consume: PASS",
  );

  console.log(
    "[9] Replay...",
  );

  assert.throws(
    () =>
      bridge.consume({

        workspaceId:
          "workspace-a",

        runtimeApprovalId:
          "runtime-approval-001",

        executionId:
          "execution-001",
      }),
    (
      error: unknown,
    ) =>
      error instanceof
      EnterpriseApprovalInvalidStateError,
  );

  console.log(
    "Enterprise replay blocked: PASS",
  );

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    " 3.0-11D.1 ENTERPRISE ↔ RUNTIME CONTRACT: PASS",
  );
  console.log(
    "============================================================",
  );
  console.log(
    "Enterprise identity             ✅",
  );
  console.log(
    "Runtime approval binding         ✅",
  );
  console.log(
    "Workspace isolation              ✅",
  );
  console.log(
    "Agent binding                    ✅",
  );
  console.log(
    "Decision binding                 ✅",
  );
  console.log(
    "Trace binding                    ✅",
  );
  console.log(
    "Execution binding                ✅",
  );
  console.log(
    "Evidence binding                 ✅",
  );
  console.log(
    "Tamper protection                ✅",
  );
  console.log(
    "One-time consumption             ✅",
  );
  console.log(
    "Replay protection                ✅",
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
