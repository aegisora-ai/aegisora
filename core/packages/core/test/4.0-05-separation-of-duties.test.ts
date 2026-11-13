import assert from "node:assert/strict";
import test from "node:test";

import {
  EnterpriseApprovalRegistry,
} from "../src/enterprise/approvals";

import {
  workspaceId,
} from "../src/enterprise/access";

function baseApproval(
  workspace: string,
) {
  return {
    workspaceId: workspace,
    runtimeApprovalId: `runtime-${workspace}`,
    agentId: "agent-4-0-05",
    requesterId: "requester-1",
    decisionId: `decision-${workspace}`,
    traceId: `trace-${workspace}`,
    executionId: `execution-${workspace}`,
    evidenceId: `evidence-${workspace}`,
    action: "vehicle.remote.command",
    resourceType: "vehicle",
    resource: "vehicle-001",
    riskScore: 82,
    policyVersion: 4,
    decision: "ESCALATE" as const,
    reason: "Remote vehicle command requires human approval.",
    expiresAt: new Date(
      Date.now() + 60_000,
    ).toISOString(),
    metadata: {
      source: "4.0-05-test",
    },
  };
}

test(
  "4.0-05 separation of duties: requester cannot approve their own request",
  () => {
    const registry =
      new EnterpriseApprovalRegistry();

    const workspace =
      workspaceId("sod-self");

    const approval =
      registry.create(
        baseApproval(workspace),
      );

    assert.throws(
      () =>
        registry.approve({
          workspaceId: workspace,
          approvalId: approval.approvalId,
          approverId: "requester-1",
          reason: "Approving my own request.",
        }),
      /separation of duties/i,
    );
  },
);

test(
  "4.0-05 separation of duties: a different approver can still approve",
  () => {
    const registry =
      new EnterpriseApprovalRegistry();

    const workspace =
      workspaceId("sod-other");

    const approval =
      registry.create(
        baseApproval(workspace),
      );

    const result =
      registry.approve({
        workspaceId: workspace,
        approvalId: approval.approvalId,
        approverId: "approver-2",
        reason: "Reviewed by a second person.",
      });

    assert.equal(result.status, "approved");
    assert.equal(result.approvedBy, "approver-2");
  },
);