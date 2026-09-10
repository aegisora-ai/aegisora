import assert from "node:assert/strict";
import test from "node:test";

import {
  InMemoryPolicyRegistry,
  policyId,
  validatePolicyDocument,
} from "../src/enterprise/policies";

function document(
  action = "provider.generate",
) {
  return {
    version: 1 as const,
    defaultEffect: "block" as const,
    rules: [
      {
        id: "rule-1",
        effect: "allow" as const,
        action,
        conditions: {},
        priority: 10,
      },
    ],
  };
}

test("policy id rejects empty", () => {
  assert.throws(
    () => policyId(" "),
  );
});

test("valid policy document passes validation", () => {

  const result =
    validatePolicyDocument(
      document(),
    );

  assert.equal(result.valid, true);
  assert.equal(result.errors.length, 0);
});

test("duplicate rules are rejected", () => {

  const result =
    validatePolicyDocument({
      ...document(),
      rules: [
        ...document().rules,
        ...document().rules,
      ],
    });

  assert.equal(result.valid, false);
  assert.equal(
    result.errors.some(
      (x) => x.includes("duplicate rule id"),
    ),
    true,
  );
});

test("policy starts as draft", () => {

  const registry =
    new InMemoryPolicyRegistry();

  const policy =
    registry.createPolicy({
      id: policyId("policy-a"),
      workspaceId: "workspace-a" as never,
      name: "Production Guardrails",
      document: document(),
    });

  assert.equal(
    policy.state,
    "draft",
  );
});

test("version numbering is monotonic", () => {

  const registry =
    new InMemoryPolicyRegistry();

  registry.createPolicy({
    id: policyId("policy-a"),
    workspaceId: "workspace-a" as never,
    name: "Policy",
    document: document(),
  });

  const v2 =
    registry.createVersion({
      policyId: policyId("policy-a"),
      workspaceId: "workspace-a" as never,
      document: document(
        "tool.execute",
      ),
    });

  assert.equal(v2.version, 2);
});

test("invalid version cannot be published", () => {

  const registry =
    new InMemoryPolicyRegistry();

  registry.createPolicy({
    id: policyId("policy-a"),
    workspaceId: "workspace-a" as never,
    name: "Policy",
    document: document(),
  });

  const invalid =
    registry.createVersion({
      policyId: policyId("policy-a"),
      workspaceId: "workspace-a" as never,
      document: {
        version: 1,
        defaultEffect: "block",
        rules: [
          {
            id: "duplicate",
            effect: "allow",
            action: "a",
            conditions: {},
            priority: 1,
          },
          {
            id: "duplicate",
            effect: "allow",
            action: "b",
            conditions: {},
            priority: 2,
          },
        ],
      },
    });

  assert.equal(
    invalid.validation,
    "invalid",
  );

  assert.throws(
    () =>
      registry.publishVersion(
        "workspace-a" as never,
        invalid.id,
        "owner-a",
      ),
  );
});

test("valid version can be published", () => {

  const registry =
    new InMemoryPolicyRegistry();

  registry.createPolicy({
    id: policyId("policy-a"),
    workspaceId: "workspace-a" as never,
    name: "Policy",
    document: document(),
  });

  const published =
    registry.publishVersion(
      "workspace-a" as never,
      registry.getPolicy(
        "workspace-a" as never,
        policyId("policy-a"),
      )!.currentVersionId!,
      "owner-a",
    );

  assert.equal(
    Boolean(published.publishedAt),
    true,
  );

  assert.equal(
    registry.getPolicy(
      "workspace-a" as never,
      policyId("policy-a"),
    )!.state,
    "published",
  );
});

test("cross-tenant policy read is denied by workspace key", () => {

  const registry =
    new InMemoryPolicyRegistry();

  registry.createPolicy({
    id: policyId("policy-a"),
    workspaceId: "workspace-a" as never,
    name: "A",
    document: document(),
  });

  assert.equal(
    registry.getPolicy(
      "workspace-b" as never,
      policyId("policy-a"),
    ),
    null,
  );
});

test("policy binding requires published policy", () => {

  const registry =
    new InMemoryPolicyRegistry();

  registry.createPolicy({
    id: policyId("policy-a"),
    workspaceId: "workspace-a" as never,
    name: "Policy",
    document: document(),
  });

  assert.throws(
    () =>
      registry.bindPolicy({
        workspaceId: "workspace-a" as never,
        policyId: policyId("policy-a"),
        enabled: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }),
  );
});

test("enabled published policy is active only in its tenant", () => {

  const registry =
    new InMemoryPolicyRegistry();

  registry.createPolicy({
    id: policyId("policy-a"),
    workspaceId: "workspace-a" as never,
    name: "Policy",
    document: document(),
  });

  const current =
    registry.getPolicy(
      "workspace-a" as never,
      policyId("policy-a"),
    )!.currentVersionId!;

  registry.publishVersion(
    "workspace-a" as never,
    current,
    "owner-a",
  );

  registry.bindPolicy({
    workspaceId: "workspace-a" as never,
    policyId: policyId("policy-a"),
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  assert.equal(
    registry.isPolicyEnabled(
      "workspace-a" as never,
      policyId("policy-a"),
    ),
    true,
  );

  assert.equal(
    registry.isPolicyEnabled(
      "workspace-b" as never,
      policyId("policy-a"),
    ),
    false,
  );
});

test("rollback rejects a version from another policy", () => {

  const registry =
    new InMemoryPolicyRegistry();

  registry.createPolicy({
    id: policyId("policy-a"),
    workspaceId: "workspace-a" as never,
    name: "A",
    document: document(),
  });

  registry.createPolicy({
    id: policyId("policy-b"),
    workspaceId: "workspace-a" as never,
    name: "B",
    document: document(),
  });

  const versionB =
    registry.getPolicy(
      "workspace-a" as never,
      policyId("policy-b"),
    )!.currentVersionId!;

  assert.throws(
    () =>
      registry.rollback(
        "workspace-a" as never,
        policyId("policy-a"),
        versionB,
        "owner-a",
      ),
  );
});

test("rollback restores a valid historical version", () => {

  const registry =
    new InMemoryPolicyRegistry();

  registry.createPolicy({
    id: policyId("policy-a"),
    workspaceId: "workspace-a" as never,
    name: "A",
    document: document(),
  });

  const v1 =
    registry.getPolicy(
      "workspace-a" as never,
      policyId("policy-a"),
    )!.currentVersionId!;

  registry.publishVersion(
    "workspace-a" as never,
    v1,
    "owner-a",
  );

  const v2 =
    registry.createVersion({
      policyId: policyId("policy-a"),
      workspaceId: "workspace-a" as never,
      document: document("dangerous.tool"),
    });

  registry.publishVersion(
    "workspace-a" as never,
    v2.id,
    "owner-a",
  );

  const rolled =
    registry.rollback(
      "workspace-a" as never,
      policyId("policy-a"),
      v1,
      "owner-a",
    );

  assert.equal(
    rolled.id,
    v1,
  );

  assert.equal(
    rolled.document.rules[0].action,
    "provider.generate",
  );
});
