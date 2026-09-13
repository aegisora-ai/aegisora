import assert from "node:assert/strict";
import test from "node:test";

import {
  EnterpriseApprovalRegistry,
} from "../src/enterprise/approvals";

import {
  EnterpriseApprovalWorkflow,
} from "../src/enterprise/approvals/workflow";

import {
  userId,
  workspaceId,
} from "../src/enterprise/access";

function baseApproval(
  workspace: string,
) {
  return {
    workspaceId: workspace,
    runtimeApprovalId: `runtime-${workspace}`,
    agentId: "agent-4-0-04",
    requesterId: "requester-1",
    decisionId: `decision-${workspace}`,
    traceId: `trace-${workspace}`,
    executionId: `execution-${workspace}`,
    evidenceId: `evidence-${workspace}`,
    action: "database.write",
    resourceType: "database",
    resource: "production-db",
    riskScore: 82,
    policyVersion: 4,
    decision: "ESCALATE" as const,
    reason: "High-risk production action requires human approval.",
    expiresAt: new Date(
      Date.now() + 60_000,
    ).toISOString(),
    metadata: {
      source: "4.0-04-test",
    },
  };
}

function membership(
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
    membershipId: `${workspace}:${user}:membership`,
    workspaceId: workspace as ReturnType<typeof workspaceId>,
    userId: user as ReturnType<typeof userId>,
    role,
    active: true,
  };
}

test(
  "4.0-04 contract: workflow creates a pending approval from an enterprise approval record",
  async () => {
    const registry =
      new EnterpriseApprovalRegistry();

    const workspace =
      workspaceId("workflow-a");

    const approval =
      registry.create(
        baseApproval(workspace),
      );

    const workflow =
      new EnterpriseApprovalWorkflow({
        registry,
      });

    const created =
      workflow.create({
        workspaceId: workspace,
        approvalId: approval.approvalId,
        requiredPermission: "approvals.manage",
        requiredRoles: ["owner", "admin"],
      });

    assert.equal(
      created.approvalId,
      approval.approvalId,
    );

    assert.equal(
      created.workspaceId,
      workspace,
    );

    assert.equal(
      created.status,
      "pending",
    );

    assert.deepEqual(
      created.requiredRoles,
      ["owner", "admin"],
    );
  },
);

test(
  "4.0-04 contract: pending queue is workspace scoped",
  () => {
    const registry =
      new EnterpriseApprovalRegistry();

    const workspaceA =
      workspaceId("workflow-a");

    const workspaceB =
      workspaceId("workflow-b");

    const approvalA =
      registry.create(
        baseApproval(workspaceA),
      );

    const approvalB =
      registry.create(
        baseApproval(workspaceB),
      );

    const workflow =
      new EnterpriseApprovalWorkflow({
        registry,
      });

    workflow.create({
      workspaceId: workspaceA,
      approvalId: approvalA.approvalId,
      requiredPermission: "approvals.manage",
      requiredRoles: ["owner", "admin"],
    });

    workflow.create({
      workspaceId: workspaceB,
      approvalId: approvalB.approvalId,
      requiredPermission: "approvals.manage",
      requiredRoles: ["owner", "admin"],
    });

    const queueA =
      workflow.listPending(workspaceA);

    assert.equal(
      queueA.length,
      1,
    );

    assert.equal(
      queueA[0].approvalId,
      approvalA.approvalId,
    );
  },
);

test(
  "4.0-04 contract: developer cannot resolve enterprise approval",
  async () => {
    const registry =
      new EnterpriseApprovalRegistry();

    const workspace =
      workspaceId("workflow-rbac");

    const approval =
      registry.create(
        baseApproval(workspace),
      );

    const workflow =
      new EnterpriseApprovalWorkflow({
        registry,
        membershipResolver: {
          async findMembership(
            requestedUserId,
            requestedWorkspaceId,
          ) {
            return membership(
              requestedWorkspaceId,
              requestedUserId,
              "developer",
            );
          },
        },
      });

    workflow.create({
      workspaceId: workspace,
      approvalId: approval.approvalId,
      requiredPermission: "approvals.manage",
      requiredRoles: ["owner", "admin"],
    });

    await assert.rejects(
      () =>
        workflow.approve({
          workspaceId: workspace,
          approvalId: approval.approvalId,
          actor: {
            principal: {
              userId: userId("developer-1"),
            },
          },
          reason: "Attempted approval.",
        }),
      /approvals\.manage|forbidden/i,
    );
  },
);

test(
  "4.0-04 contract: admin can approve and workflow returns immutable resolution",
  async () => {
    const registry =
      new EnterpriseApprovalRegistry();

    const workspace =
      workspaceId("workflow-approve");

    const approval =
      registry.create(
        baseApproval(workspace),
      );

    const workflow =
      new EnterpriseApprovalWorkflow({
        registry,
        membershipResolver: {
          async findMembership(
            requestedUserId,
            requestedWorkspaceId,
          ) {
            return membership(
              requestedWorkspaceId,
              requestedUserId,
              "admin",
            );
          },
        },
      });

    workflow.create({
      workspaceId: workspace,
      approvalId: approval.approvalId,
      requiredPermission: "approvals.manage",
      requiredRoles: ["owner", "admin"],
    });

    const result =
      await workflow.approve({
        workspaceId: workspace,
        approvalId: approval.approvalId,
        actor: {
          principal: {
            userId: userId("admin-1"),
          },
        },
        reason: "Reviewed and approved.",
      });

    assert.equal(
      result.status,
      "approved",
    );

    assert.equal(
      result.resolvedBy,
      "admin-1",
    );

    assert.equal(
      result.resolutionReason,
      "Reviewed and approved.",
    );

    const secondRead =
      workflow.get(
        workspace,
        approval.approvalId,
      );

    assert.deepEqual(
      secondRead,
      result,
    );
  },
);

test(
  "4.0-04 contract: cross-workspace workflow access is rejected",
  async () => {
    const registry =
      new EnterpriseApprovalRegistry();

    const workspaceA =
      workspaceId("workflow-a");

    const workspaceB =
      workspaceId("workflow-b");

    const approval =
      registry.create(
        baseApproval(workspaceA),
      );

    const workflow =
      new EnterpriseApprovalWorkflow({
        registry,
        membershipResolver: {
          async findMembership(
            requestedUserId,
            requestedWorkspaceId,
          ) {
            return membership(
              requestedWorkspaceId,
              requestedUserId,
              "admin",
            );
          },
        },
      });

    workflow.create({
      workspaceId: workspaceA,
      approvalId: approval.approvalId,
      requiredPermission: "approvals.manage",
      requiredRoles: ["owner", "admin"],
    });

    await assert.rejects(
      () =>
        workflow.approve({
          workspaceId: workspaceB,
          approvalId: approval.approvalId,
          actor: {
            principal: {
              userId: userId("admin-2"),
            },
          },
        }),
      /workspace|approval|forbidden|not found/i,
    );
  },
);
