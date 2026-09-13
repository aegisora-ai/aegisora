import assert from "node:assert/strict";
import test from "node:test";

import {
  InMemoryPolicyRegistry,
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

function fixtureDocument(
  effect: "allow" | "block" | "escalate" = "allow",
): PolicyDocument {
  return {
    version: 1,
    rules: [
      {
        id: "rule-1",
        effect,
        action: "database.read",
        conditions: {},
        priority: 1,
      },
    ],
    defaultEffect: "block",
  };
}

function createPolicy(
  registry: InMemoryPolicyRegistry,
  options: {
    workspaceId?: string;
    id?: string;
    effect?: "allow" | "block" | "escalate";
  } = {},
) {
  const workspace = workspaceId(
    options.workspaceId ?? "workspace-1",
  );

  const id = policyId(
    options.id ?? "policy-1",
  );

  return registry.createPolicy({
    id,
    workspaceId: workspace,
    name: options.id ?? "Policy One",
    description: "4.0-02 lifecycle fixture",
    document: fixtureDocument(
      options.effect ?? "allow",
    ),
  });
}

/* ==================================================
   4.0-02 BASELINE
   ================================================== */

test("4.0-02 baseline: policy starts in draft", () => {
  const registry = new InMemoryPolicyRegistry();

  const policy = createPolicy(registry);

  assert.equal(policy.state, "draft");
  assert.ok(policy.currentVersionId);
});

test("4.0-02 baseline: policy version is immutable", () => {
  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);

  const version = registry.getVersion(
    policy.workspaceId,
    policy.currentVersionId!,
  );

  assert.ok(version);
  assert.equal(version!.immutable, true);
});

test("4.0-02 lifecycle contract: unpublished policy cannot be enabled", () => {
  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);

  assert.throws(
    () =>
      registry.bindPolicy({
        workspaceId: policy.workspaceId,
        policyId: policy.id,
        enabled: true,
        createdAt: "2026-09-13T00:00:00.000Z",
        updatedAt: "2026-09-13T00:00:00.000Z",
      }),
    /Only published policies can be enabled/,
  );
});

test("4.0-02 lifecycle baseline: invalid version cannot be published", () => {
  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);

  const validVersion = registry.createVersion({
    policyId: policy.id,
    workspaceId: policy.workspaceId,
    document: {
      version: 1,
      rules: [],
      defaultEffect: "allow",
    },
  });

  assert.equal(validVersion.validation, "valid");

  const invalidVersion = registry.createVersion({
    policyId: policy.id,
    workspaceId: policy.workspaceId,
    document: {
      version: 1,
      rules: [
        {
          id: "invalid-rule",
          effect: "allow",
          action: "",
          conditions: {},
          priority: 1,
        },
      ],
      defaultEffect: "block",
    },
  });

  assert.equal(invalidVersion.validation, "invalid");

  assert.throws(
    () =>
      registry.publishVersion(
        policy.workspaceId,
        invalidVersion.id,
        "reviewer-1",
      ),
    /Cannot publish invalid policy version/,
  );
});

test("4.0-02 lifecycle baseline: published version becomes active policy version", () => {
  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);

  const published = registry.publishVersion(
    policy.workspaceId,
    policy.currentVersionId!,
    "release-manager",
  );

  assert.equal(published.publishedBy, "release-manager");

  const updatedPolicy = registry.getPolicy(
    policy.workspaceId,
    policy.id,
  );

  assert.ok(updatedPolicy);
  assert.equal(updatedPolicy!.state, "published");
  assert.equal(updatedPolicy!.currentVersionId, published.id);
});

test("4.0-02 lifecycle baseline: published policy can be enabled", () => {
  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);

  registry.publishVersion(
    policy.workspaceId,
    policy.currentVersionId!,
    "release-manager",
  );

  registry.bindPolicy({
    workspaceId: policy.workspaceId,
    policyId: policy.id,
    enabled: true,
    createdAt: "2026-09-13T00:00:00.000Z",
    updatedAt: "2026-09-13T00:00:00.000Z",
  });

  assert.equal(
    registry.isPolicyEnabled(
      policy.workspaceId,
      policy.id,
    ),
    true,
  );
});

test("4.0-02 lifecycle baseline: rollback remains policy scoped", () => {
  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);

  const version2 = registry.createVersion({
    policyId: policy.id,
    workspaceId: policy.workspaceId,
    document: fixtureDocument("block"),
  });

  registry.publishVersion(
    policy.workspaceId,
    version2.id,
    "release-manager",
  );

  const rolledBack = registry.rollback(
    policy.workspaceId,
    policy.id,
    policy.currentVersionId!,
    "incident-responder",
  );

  assert.equal(rolledBack.policyId, policy.id);
  assert.equal(rolledBack.id, policy.currentVersionId);
});

test("4.0-02 lifecycle isolation: cross-workspace publish is rejected", () => {
  const registry = new InMemoryPolicyRegistry();

  const policy = createPolicy(registry, {
    workspaceId: "workspace-a",
  });

  assert.throws(
    () =>
      registry.publishVersion(
        workspaceId("workspace-b"),
        policy.currentVersionId!,
        "attacker",
      ),
    /Policy version not found/,
  );
});

test("4.0-02 lifecycle isolation: cross-policy rollback is rejected", () => {
  const registry = new InMemoryPolicyRegistry();

  const policyA = createPolicy(registry, {
    id: "policy-a",
  });

  const policyB = createPolicy(registry, {
    id: "policy-b",
  });

  registry.publishVersion(
    policyB.workspaceId,
    policyB.currentVersionId!,
    "release-manager",
  );

  assert.throws(
    () =>
      registry.rollback(
        policyA.workspaceId,
        policyA.id,
        policyB.currentVersionId!,
        "incident-responder",
      ),
    /Rollback target belongs to another policy/,
  );
});

test("4.0-02 lifecycle baseline: draft version is discoverable as unpublished", () => {
  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);

  const versions = registry.listVersions({
    workspaceId: policy.workspaceId,
    policyId: policy.id,
    publishedOnly: false,
  });

  assert.equal(versions.length, 1);
  assert.equal(versions[0]!.publishedAt, undefined);
});

test("4.0-02 lifecycle baseline: published-only discovery excludes drafts", () => {
  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);

  const beforePublish = registry.listVersions({
    workspaceId: policy.workspaceId,
    policyId: policy.id,
    publishedOnly: true,
  });

  assert.equal(beforePublish.length, 0);

  registry.publishVersion(
    policy.workspaceId,
    policy.currentVersionId!,
    "release-manager",
  );

  const afterPublish = registry.listVersions({
    workspaceId: policy.workspaceId,
    policyId: policy.id,
    publishedOnly: true,
  });

  assert.equal(afterPublish.length, 1);
});

test("4.0-02 lifecycle baseline: disabled binding does not activate policy", () => {
  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);

  registry.publishVersion(
    policy.workspaceId,
    policy.currentVersionId!,
    "release-manager",
  );

  registry.bindPolicy({
    workspaceId: policy.workspaceId,
    policyId: policy.id,
    enabled: false,
    createdAt: "2026-09-13T00:00:00.000Z",
    updatedAt: "2026-09-13T00:00:00.000Z",
  });

  assert.equal(
    registry.isPolicyEnabled(
      policy.workspaceId,
      policy.id,
    ),
    false,
  );
});

/* ==================================================
   4.0-02 LIFECYCLE CONTRACT
   ================================================== */

test("4.0-02 contract: lifecycle engine can be constructed", async () => {
  const module = await import("../src/enterprise/policies/lifecycle");

  assert.equal(
    typeof module.PolicyLifecycleEngine,
    "function",
  );
});

test("4.0-02 contract: policy exposes review state", async () => {
  const module = await import("../src/enterprise/policies/lifecycle");

  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);
  const lifecycle = new module.PolicyLifecycleEngine(registry);

  const submitted = lifecycle.submitForReview(
    policy.workspaceId,
    policy.id,
    "author-1",
  );

  assert.equal(submitted.state, "in_review");
});

test("4.0-02 contract: review submission records workflow metadata", async () => {
  const module = await import("../src/enterprise/policies/lifecycle");

  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);
  const lifecycle = new module.PolicyLifecycleEngine(registry);

  const submitted = lifecycle.submitForReview(
    policy.workspaceId,
    policy.id,
    "author-1",
  );

  assert.equal(submitted.submittedBy, "author-1");
  assert.ok(submitted.submittedAt);
});

test("4.0-02 contract: reviewed policy can be approved", async () => {
  const module = await import("../src/enterprise/policies/lifecycle");

  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);
  const lifecycle = new module.PolicyLifecycleEngine(registry);

  lifecycle.submitForReview(
    policy.workspaceId,
    policy.id,
    "author-1",
  );

  const approved = lifecycle.approve(
    policy.workspaceId,
    policy.id,
    "reviewer-1",
  );

  assert.equal(approved.state, "approved");
  assert.equal(approved.approvedBy, "reviewer-1");
});

test("4.0-02 contract: draft cannot be approved directly", async () => {
  const module = await import("../src/enterprise/policies/lifecycle");

  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);
  const lifecycle = new module.PolicyLifecycleEngine(registry);

  assert.throws(
    () =>
      lifecycle.approve(
        policy.workspaceId,
        policy.id,
        "reviewer-1",
      ),
    /in_review/,
  );
});

test("4.0-02 contract: review cannot be published before approval", async () => {
  const module = await import("../src/enterprise/policies/lifecycle");

  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);
  const lifecycle = new module.PolicyLifecycleEngine(registry);

  lifecycle.submitForReview(
    policy.workspaceId,
    policy.id,
    "author-1",
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
});

test("4.0-02 contract: approved policy can be published", async () => {
  const module = await import("../src/enterprise/policies/lifecycle");

  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);
  const lifecycle = new module.PolicyLifecycleEngine(registry);

  lifecycle.submitForReview(
    policy.workspaceId,
    policy.id,
    "author-1",
  );

  lifecycle.approve(
    policy.workspaceId,
    policy.id,
    "reviewer-1",
  );

  const published = lifecycle.publish(
    policy.workspaceId,
    policy.id,
    "release-manager",
  );

  assert.equal(published.state, "published");
  assert.equal(published.publishedBy, "release-manager");
});

test("4.0-02 contract: invalid policy cannot be approved", async () => {
  const module = await import("../src/enterprise/policies/lifecycle");

  const registry = new InMemoryPolicyRegistry();

  const policy = createPolicy(
    registry,
    { id: "invalid-policy" },
  );

  const invalidVersion = registry.createVersion({
    policyId: policy.id,
    workspaceId: policy.workspaceId,
    document: {
      version: 1,
      rules: [
        {
          id: "invalid-rule",
          effect: "allow",
          action: "",
          conditions: {},
          priority: 1,
        },
      ],
      defaultEffect: "block",
    },
  });

  const lifecycle = new module.PolicyLifecycleEngine(registry);

  lifecycle.submitForReview(
    policy.workspaceId,
    policy.id,
    "author-1",
    invalidVersion.id,
  );

  assert.throws(
    () =>
      lifecycle.approve(
        policy.workspaceId,
        policy.id,
        "reviewer-1",
      ),
    /valid/,
  );
});

test("4.0-02 contract: cross-workspace lifecycle operation is rejected", async () => {
  const module = await import("../src/enterprise/policies/lifecycle");

  const registry = new InMemoryPolicyRegistry();

  const policy = createPolicy(
    registry,
    { workspaceId: "workspace-a" },
  );

  const lifecycle = new module.PolicyLifecycleEngine(registry);

  assert.throws(
    () =>
      lifecycle.submitForReview(
        workspaceId("workspace-b"),
        policy.id,
        "attacker",
      ),
    /Policy not found|workspace/,
  );
});

test("4.0-02 contract: approved policy cannot be approved twice", async () => {
  const module = await import("../src/enterprise/policies/lifecycle");

  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);
  const lifecycle = new module.PolicyLifecycleEngine(registry);

  lifecycle.submitForReview(
    policy.workspaceId,
    policy.id,
    "author-1",
  );

  lifecycle.approve(
    policy.workspaceId,
    policy.id,
    "reviewer-1",
  );

  assert.throws(
    () =>
      lifecycle.approve(
        policy.workspaceId,
        policy.id,
        "reviewer-2",
      ),
    /approved/,
  );
});

test("4.0-02 contract: lifecycle can read current workflow state", async () => {
  const module = await import("../src/enterprise/policies/lifecycle");

  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);
  const lifecycle = new module.PolicyLifecycleEngine(registry);

  const initial = lifecycle.getState(
    policy.workspaceId,
    policy.id,
  );

  assert.equal(initial.state, "draft");

  lifecycle.submitForReview(
    policy.workspaceId,
    policy.id,
    "author-1",
  );

  const reviewed = lifecycle.getState(
    policy.workspaceId,
    policy.id,
  );

  assert.equal(reviewed.state, "in_review");
});

test("4.0-02 contract: rollback requires published policy", async () => {
  const module = await import("../src/enterprise/policies/lifecycle");

  const registry = new InMemoryPolicyRegistry();
  const policy = createPolicy(registry);
  const lifecycle = new module.PolicyLifecycleEngine(registry);

  assert.throws(
    () =>
      lifecycle.rollback(
        policy.workspaceId,
        policy.id,
        policy.currentVersionId!,
        "incident-responder",
      ),
    /published/,
  );
});

/* ==================================================
   4.0-02 HARDENING REGRESSIONS
   ================================================== */

test("4.0-02 hardening: review cannot bind a version from another policy", async () => {
  const module = await import("../src/enterprise/policies/lifecycle");

  const registry = new InMemoryPolicyRegistry();

  const policyA = createPolicy(registry, {
    id: "policy-a",
  });

  const policyB = createPolicy(registry, {
    id: "policy-b",
  });

  const lifecycle = new module.PolicyLifecycleEngine(registry);

  assert.throws(
    () =>
      lifecycle.submitForReview(
        policyA.workspaceId,
        policyA.id,
        "author-a",
        policyB.currentVersionId!,
      ),
    /another policy|does not belong|policy/i,
  );
});

test("4.0-02 hardening: new version after publish creates a fresh draft workflow", async () => {
  const module = await import("../src/enterprise/policies/lifecycle");

  const registry = new InMemoryPolicyRegistry();

  const policy = createPolicy(registry);

  const lifecycle = new module.PolicyLifecycleEngine(registry);

  lifecycle.submitForReview(
    policy.workspaceId,
    policy.id,
    "author-1",
  );

  lifecycle.approve(
    policy.workspaceId,
    policy.id,
    "reviewer-1",
  );

  lifecycle.publish(
    policy.workspaceId,
    policy.id,
    "release-manager",
  );

  const version2 = registry.createVersion({
    policyId: policy.id,
    workspaceId: policy.workspaceId,
    document: fixtureDocument("block"),
  });

  const current = lifecycle.getState(
    policy.workspaceId,
    policy.id,
  );

  assert.equal(
    current.state,
    "draft",
  );

  assert.equal(
    current.versionId,
    version2.id,
  );
});
