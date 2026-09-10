import assert from "node:assert/strict";
import test from "node:test";

import {
  authorizeWorkspacePermission,
  roleCan,
  userId,
  workspaceId,
  membershipId,
  type WorkspaceMembership,
} from "../src/enterprise/access";

function membership(
  role: WorkspaceMembership["role"],
  active = true,
): WorkspaceMembership {
  return {
    membershipId: membershipId("membership-1"),
    workspaceId: workspaceId("workspace-1"),
    userId: userId("user-1"),
    role,
    active,
  };
}

const principal = {
  userId: userId("user-1"),
  email: "user@example.com",
};

class Resolver {
  constructor(private readonly value: WorkspaceMembership | null) {}

  async findMembership() {
    return this.value;
  }
}

test("unauthenticated request is denied", async () => {
  const result = await authorizeWorkspacePermission(
    new Resolver(membership("owner")),
    {
      principal: null,
      workspaceId: "workspace-1",
      permission: "workspace.read",
    },
  );

  assert.equal(result.authorized, false);

  if (!result.authorized) {
    assert.equal(result.code, "UNAUTHENTICATED");
  }
});

test("cross-tenant membership is denied", async () => {
  const result = await authorizeWorkspacePermission(
    new Resolver(null),
    {
      principal,
      workspaceId: "workspace-foreign",
      permission: "workspace.read",
    },
  );

  assert.equal(result.authorized, false);

  if (!result.authorized) {
    assert.equal(result.code, "NO_MEMBERSHIP");
  }
});

test("inactive membership is denied", async () => {
  const result = await authorizeWorkspacePermission(
    new Resolver(membership("developer", false)),
    {
      principal,
      workspaceId: "workspace-1",
      permission: "agents.read",
    },
  );

  assert.equal(result.authorized, false);

  if (!result.authorized) {
    assert.equal(result.code, "MEMBERSHIP_INACTIVE");
  }
});

test("viewer cannot manage policies", () => {
  assert.equal(roleCan("viewer", "policies.manage"), false);
});

test("developer can manage policies", () => {
  assert.equal(roleCan("developer", "policies.manage"), true);
});

test("analyst cannot execute runtime actions", () => {
  assert.equal(roleCan("analyst", "runtime.execute"), false);
});

test("admin can manage members", () => {
  assert.equal(roleCan("admin", "members.manage"), true);
});

test("auditor can read audit but cannot manage members", () => {
  assert.equal(roleCan("auditor", "audit.read"), true);
  assert.equal(roleCan("auditor", "members.manage"), false);
});

test("authorized workspace permission returns membership context", async () => {
  const result = await authorizeWorkspacePermission(
    new Resolver(membership("developer")),
    {
      principal,
      workspaceId: "workspace-1",
      permission: "runtime.execute",
    },
  );

  assert.equal(result.authorized, true);

  if (result.authorized) {
    assert.equal(result.permission, "runtime.execute");
    assert.equal(result.context.membership.role, "developer");
    assert.equal(result.context.membership.workspaceId, "workspace-1");
  }
});
