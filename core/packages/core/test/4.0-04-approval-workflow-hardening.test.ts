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

function input(workspace: string, suffix: string) {
  return {
    workspaceId: workspace,
    runtimeApprovalId:
      `runtime-${suffix}`,
    agentId:
      `agent-${suffix}`,
    requesterId:
      `requester-${suffix}`,
    decisionId:
      `decision-${suffix}`,
    traceId:
      `trace-${suffix}`,
    executionId:
      `execution-${suffix}`,
    evidenceId:
      `evidence-${suffix}`,
    action:
      "external.send",
    resourceType:
      "network",
    resource:
      "external-api",
    riskScore:
      76,
    decision:
      "ESCALATE" as const,
    reason:
      "External transfer requires approval.",
    expiresAt:
      new Date(
        Date.now() + 60_000,
      ).toISOString(),
  };
}

function adminResolver() {
  return {
    async findMembership(
      requestedUserId: string,
      requestedWorkspaceId: string,
    ) {
      return {
        membershipId:
          `${requestedWorkspaceId}:${requestedUserId}`,
        workspaceId:
          requestedWorkspaceId as ReturnType<
            typeof workspaceId
          >,
        userId:
          requestedUserId as ReturnType<
            typeof userId
          >,
        role: "admin" as const,
        active: true,
      };
    },
  };
}

test(
  "4.0-04 hardening: duplicate workflow registration is rejected",
  () => {
    const registry =
      new EnterpriseApprovalRegistry();

    const workspace =
      workspaceId("4.0-04-duplicate");

    const approval =
      registry.create(
        input(
          workspace,
          "duplicate",
        ),
      );

    const workflow =
      new EnterpriseApprovalWorkflow({
        registry,
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
      /already exists/i,
    );
  },
);

test(
  "4.0-04 hardening: workflow snapshot cannot mutate internal role state",
  () => {
    const registry =
      new EnterpriseApprovalRegistry();

    const workspace =
      workspaceId("4.0-04-snapshot");

    const approval =
      registry.create(
        input(
          workspace,
          "snapshot",
        ),
      );

    const workflow =
      new EnterpriseApprovalWorkflow({
        registry,
      });

    const created =
      workflow.create({
        workspaceId: workspace,
        approvalId:
          approval.approvalId,
        requiredPermission:
          "approvals.manage",
        requiredRoles:
          ["owner", "admin"],
      });

    const mutable =
      created.requiredRoles as string[];

    mutable.push("developer");

    const reread =
      workflow.get(
        workspace,
        approval.approvalId,
      );

    assert.deepEqual(
      reread?.requiredRoles,
      ["owner", "admin"],
    );
  },
);

test(
  "4.0-04 hardening: rejection remains delegated to enterprise approval registry",
  async () => {
    const registry =
      new EnterpriseApprovalRegistry();

    const workspace =
      workspaceId("4.0-04-reject");

    const approval =
      registry.create(
        input(
          workspace,
          "reject",
        ),
      );

    const workflow =
      new EnterpriseApprovalWorkflow({
        registry,
        membershipResolver:
          adminResolver(),
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

    const result =
      await workflow.reject({
        workspaceId: workspace,
        approvalId:
          approval.approvalId,
        actor: {
          principal: {
            userId:
              userId("admin-reject"),
          },
        },
        reason:
          "External destination is not approved.",
      });

    assert.equal(
      result.status,
      "rejected",
    );

    assert.equal(
      registry.getForWorkspace(
        workspace,
        approval.approvalId,
      )?.status,
      "rejected",
    );

    assert.equal(
      registry.getForWorkspace(
        workspace,
        approval.approvalId,
      )?.rejectionReason,
      "External destination is not approved.",
    );
  },
);

test(
  "4.0-04 hardening: workflow preserves immutable approval identity",
  async () => {
    const registry =
      new EnterpriseApprovalRegistry();

    const workspace =
      workspaceId("4.0-04-identity");

    const approval =
      registry.create(
        input(
          workspace,
          "identity",
        ),
      );

    const original =
      registry.getForWorkspace(
        workspace,
        approval.approvalId,
      )!;

    const workflow =
      new EnterpriseApprovalWorkflow({
        registry,
        membershipResolver:
          adminResolver(),
      });

    await workflow.create({
      workspaceId: workspace,
      approvalId:
        approval.approvalId,
      requiredPermission:
        "approvals.manage",
      requiredRoles:
        ["owner", "admin"],
    });

    await workflow.approve({
      workspaceId: workspace,
      approvalId:
        approval.approvalId,
      actor: {
        principal: {
          userId:
            userId("admin-identity"),
        },
      },
      reason:
        "Identity approved.",
    });

    const resolved =
      registry.getForWorkspace(
        workspace,
        approval.approvalId,
      )!;

    assert.equal(
      resolved.approvalId,
      original.approvalId,
    );

    assert.equal(
      resolved.runtimeApprovalId,
      original.runtimeApprovalId,
    );

    assert.equal(
      resolved.executionId,
      original.executionId,
    );

    assert.equal(
      resolved.traceId,
      original.traceId,
    );

    assert.equal(
      resolved.evidenceId,
      original.evidenceId,
    );
  },
);
