import assert from "node:assert/strict";
import test from "node:test";

import {
  InMemoryPolicyRegistry,
  PolicyLifecycleEngine,
  policyId,
} from "../src/enterprise/policies";

import type {
  PolicyDocument,
} from "../src/enterprise/policies";

import type {
  WorkspaceId,
} from "../src/enterprise/access";

function workspaceId(
  value: string,
): WorkspaceId {
  return value as WorkspaceId;
}

function document(
  effect: "allow" | "block",
): PolicyDocument {
  return {
    version: 1,
    rules: [
      {
        id: "database-rule",
        effect,
        action: "database.write",
        conditions: {
          environment: "production",
        },
        priority: 1,
      },
    ],
    defaultEffect: "block",
  };
}

test("4.0-02 E2E: full enterprise policy lifecycle with rollback", () => {
  const registry = new InMemoryPolicyRegistry();

  const workspace = workspaceId(
    "enterprise-workspace",
  );

  const policy = registry.createPolicy({
    id: policyId("production-data-policy"),
    workspaceId: workspace,
    name: "Production Data Policy",
    description: "Enterprise lifecycle E2E",
    document: document("allow"),
  });

  const lifecycle =
    new PolicyLifecycleEngine(registry);

  /* -----------------------------------------------
     V1: DRAFT → REVIEW → APPROVED → PUBLISHED
     ----------------------------------------------- */

  const v1Id =
    policy.currentVersionId!;

  const reviewV1 =
    lifecycle.submitForReview(
      workspace,
      policy.id,
      "policy-author",
      v1Id,
    );

  assert.equal(
    reviewV1.state,
    "in_review",
  );

  assert.equal(
    reviewV1.versionId,
    v1Id,
  );

  const approvalV1 =
    lifecycle.approve(
      workspace,
      policy.id,
      "security-reviewer",
    );

  assert.equal(
    approvalV1.state,
    "approved",
  );

  assert.equal(
    approvalV1.approvedBy,
    "security-reviewer",
  );

  const publishedV1 =
    lifecycle.publish(
      workspace,
      policy.id,
      "release-manager",
    );

  assert.equal(
    publishedV1.state,
    "published",
  );

  assert.equal(
    publishedV1.versionId,
    v1Id,
  );

  const publishedPolicy =
    registry.getPolicy(
      workspace,
      policy.id,
    );

  assert.ok(publishedPolicy);

  assert.equal(
    publishedPolicy!.state,
    "published",
  );

  assert.equal(
    publishedPolicy!.currentVersionId,
    v1Id,
  );

  /* -----------------------------------------------
     V2: CREATE → automatic fresh DRAFT
     ----------------------------------------------- */

  const v2 =
    registry.createVersion({
      policyId: policy.id,
      workspaceId: workspace,
      document: document("block"),
    });

  const afterV2 =
    lifecycle.getState(
      workspace,
      policy.id,
    );

  assert.equal(
    afterV2.state,
    "draft",
  );

  assert.equal(
    afterV2.versionId,
    v2.id,
  );

  /* -----------------------------------------------
     V2: DRAFT → REVIEW → APPROVED → PUBLISHED
     ----------------------------------------------- */

  const reviewV2 =
    lifecycle.submitForReview(
      workspace,
      policy.id,
      "policy-author",
      v2.id,
    );

  assert.equal(
    reviewV2.state,
    "in_review",
  );

  const approvalV2 =
    lifecycle.approve(
      workspace,
      policy.id,
      "security-reviewer",
    );

  assert.equal(
    approvalV2.state,
    "approved",
  );

  assert.equal(
    approvalV2.versionId,
    v2.id,
  );

  const publishedV2 =
    lifecycle.publish(
      workspace,
      policy.id,
      "release-manager",
    );

  assert.equal(
    publishedV2.state,
    "published",
  );

  assert.equal(
    publishedV2.versionId,
    v2.id,
  );

  /* -----------------------------------------------
     ROLLBACK V2 → V1
     ----------------------------------------------- */

  const rolledBack =
    lifecycle.rollback(
      workspace,
      policy.id,
      v1Id,
      "incident-responder",
    );

  assert.equal(
    rolledBack.state,
    "published",
  );

  assert.equal(
    rolledBack.versionId,
    v1Id,
  );

  assert.equal(
    rolledBack.publishedBy,
    "incident-responder",
  );

  const finalPolicy =
    registry.getPolicy(
      workspace,
      policy.id,
    );

  assert.ok(finalPolicy);

  assert.equal(
    finalPolicy!.state,
    "published",
  );

  assert.equal(
    finalPolicy!.currentVersionId,
    v1Id,
  );

  /* -----------------------------------------------
     FINAL ASSERTIONS
     ----------------------------------------------- */

  const publishedVersions =
    registry.listVersions({
      workspaceId: workspace,
      policyId: policy.id,
      publishedOnly: true,
    });

  assert.equal(
    publishedVersions.length,
    2,
  );

  const finalState =
    lifecycle.getState(
      workspace,
      policy.id,
    );

  assert.deepEqual(
    {
      state: finalState.state,
      versionId: finalState.versionId,
      submittedBy: finalState.submittedBy,
      approvedBy: finalState.approvedBy,
      publishedBy: finalState.publishedBy,
    },
    {
      state: "published",
      versionId: v1Id,
      submittedBy: "policy-author",
      approvedBy: "security-reviewer",
      publishedBy: "incident-responder",
    },
  );
});

test("4.0-02 E2E: cross-workspace version cannot enter lifecycle", () => {
  const registry = new InMemoryPolicyRegistry();

  const policyA =
    registry.createPolicy({
      id: policyId("policy-a"),
      workspaceId: workspaceId("workspace-a"),
      name: "Policy A",
      document: document("allow"),
    });

  const lifecycle =
    new PolicyLifecycleEngine(registry);

  assert.throws(
    () =>
      lifecycle.submitForReview(
        workspaceId("workspace-b"),
        policyA.id,
        "attacker",
        policyA.currentVersionId!,
      ),
    /Policy not found|version not found|workspace/i,
  );
});

test("4.0-02 E2E: lifecycle never publishes without approval", () => {
  const registry = new InMemoryPolicyRegistry();

  const policy =
    registry.createPolicy({
      id: policyId("approval-required"),
      workspaceId: workspaceId("workspace-1"),
      name: "Approval Required",
      document: document("allow"),
    });

  const lifecycle =
    new PolicyLifecycleEngine(registry);

  lifecycle.submitForReview(
    policy.workspaceId,
    policy.id,
    "author",
  );

  assert.throws(
    () =>
      lifecycle.publish(
        policy.workspaceId,
        policy.id,
        "release-manager",
      ),
    /approved/,
  );

  assert.equal(
    registry.getPolicy(
      policy.workspaceId,
      policy.id,
    )!.state,
    "draft",
  );
});
