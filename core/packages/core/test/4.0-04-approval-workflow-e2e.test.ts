import assert from "node:assert/strict";
import test from "node:test";

import {
  EnterpriseApprovalRegistry,
  EnterpriseApprovalWorkflow,
} from "../src/enterprise/approvals";

import {
  userId,
  workspaceId,
} from "../src/enterprise/access";

function approvalInput(
  workspace: string,
  runtimeSuffix: string,
) {
  return {
    workspaceId: workspace,
    runtimeApprovalId:
      `runtime-${runtimeSuffix}`,
    agentId: `agent-${runtimeSuffix}`,
    requesterId: `requester-${runtimeSuffix}`,
    decisionId:
      `decision-${runtimeSuffix}`,
    traceId:
      `trace-${runtimeSuffix}`,
    executionId:
      `execution-${runtimeSuffix}`,
    evidenceId:
      `evidence-${runtimeSuffix}`,
    action: "database.write",
    resourceType: "database",
    resource: "production-db",
    riskScore: 88,
    policyVersion: 4,
    decision: "ESCALATE" as const,
    reason:
      "Production database action requires approval.",
    expiresAt:
      new Date(
        Date.now() + 60_000,
      ).toISOString(),
    metadata: {
      source: "4.0-04-e2e",
    },
  };
}

function member(
  workspace: string,
  user: string,
  role:
    | "owner"
    | "admin"
    | "developer"
    | "analyst"
    | "auditor"
    | "viewer",
) {
  return {
    membershipId:
      `${workspace}:${user}:membership`,
    workspaceId:
      workspace as ReturnType<
        typeof workspaceId
      >,
    userId:
      user as ReturnType<typeof userId>,
    role,
    active: true,
  };
}

function resolver(
  role:
    | "owner"
    | "admin"
    | "developer"
    | "analyst"
    | "auditor"
    | "viewer",
) {
  return {
    async findMembership(
      requestedUserId: string,
      requestedWorkspaceId: string,
    ) {
      return member(
        requestedWorkspaceId,
        requestedUserId,
        role,
      );
    },
  };
}

test(
  "4.0-04 E2E: enterprise approval enters workspace-scoped workflow and resolves",
  async () => {
    const registry =
      new EnterpriseApprovalRegistry();

    const workspace =
      workspaceId("4.0-04-e2e-a");

    const approval =
      registry.create(
        approvalInput(
          workspace,
          "primary",
        ),
      );

    const workflow =
      new EnterpriseApprovalWorkflow({
        registry,
        membershipResolver:
          resolver("admin"),
      });

    const queued =
      workflow.create({
        workspaceId: workspace,
        approvalId:
          approval.approvalId,
        requiredPermission:
          "approvals.manage",
        requiredRoles:
          ["owner", "admin"],
      });

    assert.equal(
      queued.status,
      "pending",
    );

    assert.equal(
      workflow.listPending(workspace).length,
      1,
    );

    const resolved =
      await workflow.approve({
        workspaceId: workspace,
        approvalId:
          approval.approvalId,
        actor: {
          principal: {
            userId:
              userId("approver-admin"),
          },
        },
        reason:
          "Reviewed production impact and approved.",
      });

    assert.equal(
      resolved.status,
      "approved",
    );

    assert.equal(
      resolved.resolvedBy,
      "approver-admin",
    );

    assert.equal(
      workflow.listPending(workspace).length,
      0,
    );

    const registryRecord =
      registry.getForWorkspace(
        workspace,
        approval.approvalId,
      );

    assert.equal(
      registryRecord?.status,
      "approved",
    );

    assert.equal(
      registryRecord?.resolvedBy,
      "approver-admin",
    );
  },
);

test(
  "4.0-04 E2E: two workspaces maintain isolated approval queues",
  () => {
    const registry =
      new EnterpriseApprovalRegistry();

    const workspaceA =
      workspaceId("4.0-04-workspace-a");

    const workspaceB =
      workspaceId("4.0-04-workspace-b");

    const approvalA =
      registry.create(
        approvalInput(
          workspaceA,
          "workspace-a",
        ),
      );

    const approvalB =
      registry.create(
        approvalInput(
          workspaceB,
          "workspace-b",
        ),
      );

    const workflow =
      new EnterpriseApprovalWorkflow({
        registry,
      });

    workflow.create({
      workspaceId:
        workspaceA,
      approvalId:
        approvalA.approvalId,
      requiredPermission:
        "approvals.manage",
      requiredRoles:
        ["owner", "admin"],
    });

    workflow.create({
      workspaceId:
        workspaceB,
      approvalId:
        approvalB.approvalId,
      requiredPermission:
        "approvals.manage",
      requiredRoles:
        ["owner", "admin"],
    });

    const queueA =
      workflow.listPending(
        workspaceA,
      );

    const queueB =
      workflow.listPending(
        workspaceB,
      );

    assert.deepEqual(
      queueA.map(
        (item) => item.approvalId,
      ),
      [approvalA.approvalId],
    );

    assert.deepEqual(
      queueB.map(
        (item) => item.approvalId,
      ),
      [approvalB.approvalId],
    );

    assert.throws(
      () =>
        workflow.get(
          workspaceB,
          approvalA.approvalId,
        ),
      /workspace|approval/i,
    );
  },
);

test(
  "4.0-04 E2E: unauthorized developer cannot approve even when approval is pending",
  async () => {
    const registry =
      new EnterpriseApprovalRegistry();

    const workspace =
      workspaceId("4.0-04-rbac");

    const approval =
      registry.create(
        approvalInput(
          workspace,
          "rbac",
        ),
      );

    const workflow =
      new EnterpriseApprovalWorkflow({
        registry,
        membershipResolver:
          resolver("developer"),
      });

    workflow.create({
      workspaceId: workspace,
      approvalId:
        approval.approvalId,
      requiredPermission:
        "approvals.manage",
      requiredRoles:
        ["owner", "admin"],
    });

    await assert.rejects(
      () =>
        workflow.approve({
          workspaceId: workspace,
          approvalId:
            approval.approvalId,
          actor: {
            principal: {
              userId:
                userId("developer-1"),
            },
          },
        }),
      /FORBIDDEN|approvals\.manage/i,
    );

    assert.equal(
      registry.getForWorkspace(
        workspace,
        approval.approvalId,
      )?.status,
      "pending",
    );
  },
);

test(
  "4.0-04 E2E: workflow cannot be created for already resolved approval",
  () => {
    const registry =
      new EnterpriseApprovalRegistry();

    const workspace =
      workspaceId("4.0-04-resolved");

    const approval =
      registry.create(
        approvalInput(
          workspace,
          "resolved",
        ),
      );

    registry.approve({
      workspaceId: workspace,
      approvalId:
        approval.approvalId,
      approverId:
        "security-admin",
      reason:
        "Approved before workflow registration.",
    });

    const workflow =
      new EnterpriseApprovalWorkflow({
        registry,
      });

    assert.throws(
      () =>
        workflow.create({
          workspaceId: workspace,
          approvalId:
            approval.approvalId,
          requiredPermission:
            "approvals.manage",
          requiredRoles:
            ["owner", "admin"],
        }),
      /pending|transition|approved/i,
    );
  },
);
