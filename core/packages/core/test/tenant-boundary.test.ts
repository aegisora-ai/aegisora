import assert from "node:assert/strict";
import test from "node:test";

import {
  authorizeWorkspacePermission,
  membershipId,
  userId,
  workspaceId,
  type AuthenticatedPrincipal,
  type WorkspaceMembership,
} from "../src/enterprise/access";

import {
  TenantAccessDeniedError,
  assertWorkspaceScope,
  createTenantScopeFactory,
  scopedRepository,
  type TenantRepository,
} from "../src/enterprise/tenant";

const principal: AuthenticatedPrincipal = {
  userId: userId("user-1"),
  email: "user@example.com",
};

function membership(
  role: WorkspaceMembership["role"] = "developer",
  workspace = "workspace-1",
): WorkspaceMembership {
  return {
    membershipId: membershipId("membership-1"),
    workspaceId: workspaceId(workspace),
    userId: userId("user-1"),
    role,
    active: true,
  };
}

class Resolver {
  constructor(
    private readonly current: WorkspaceMembership | null,
  ) {}

  async authorize(
    principalInput: AuthenticatedPrincipal | null,
    requestedWorkspace: string,
    permission: Parameters<typeof authorizeWorkspacePermission>[1]["permission"],
  ) {
    return authorizeWorkspacePermission(
      {
        findMembership: async () => this.current,
      },
      {
        principal: principalInput,
        workspaceId: requestedWorkspace,
        permission,
      },
    );
  }
}

test("tenant scope requires authenticated principal", async () => {
  const factory = createTenantScopeFactory(
    new Resolver(membership()),
  );

  await assert.rejects(
    () =>
      factory.create(
        null,
        "workspace-1",
        "agents.read",
      ),
    (error: unknown) => {
      assert.ok(error instanceof TenantAccessDeniedError);
      assert.equal(error.code, "UNAUTHENTICATED");
      return true;
    },
  );
});

test("tenant scope denies foreign workspace", async () => {
  const factory = createTenantScopeFactory(
    new Resolver(null),
  );

  await assert.rejects(
    () =>
      factory.create(
        principal,
        "workspace-foreign",
        "agents.read",
      ),
    (error: unknown) => {
      assert.ok(error instanceof TenantAccessDeniedError);
      assert.equal(error.code, "NO_MEMBERSHIP");
      return true;
    },
  );
});

test("tenant scope is bound to authorized workspace", async () => {
  const factory = createTenantScopeFactory(
    new Resolver(membership("developer", "workspace-1")),
  );

  const scope = await factory.create(
    principal,
    "workspace-1",
    "agents.read",
  );

  assert.equal(scope.workspaceId, "workspace-1");
  assert.equal(scope.principal.userId, "user-1");
});

test("tenant scope rejects workspace mismatch", async () => {
  const factory = createTenantScopeFactory(
    new Resolver(membership()),
  );

  const scope = await factory.create(
    principal,
    "workspace-1",
    "agents.read",
  );

  assert.throws(
    () =>
      assertWorkspaceScope(
        scope,
        "workspace-foreign",
      ),
    (error: unknown) => {
      assert.ok(error instanceof TenantAccessDeniedError);
      assert.equal(error.code, "FORBIDDEN");
      return true;
    },
  );
});

test("scoped repository ignores caller-supplied tenant scope", async () => {

  let receivedWorkspace: string | undefined;

  const repository: TenantRepository<{ id: string }> = {

    async findById(scope, id) {
      receivedWorkspace = scope.workspaceId;

      return {
        id,
      };
    },

    async list(scope) {
      receivedWorkspace = scope.workspaceId;

      return [{ id: scope.workspaceId }];
    },
  };

  const scoped = scopedRepository(
    repository,
    {
      principal,
      workspaceId: "workspace-authorized",
    },
  );

  await scoped.findById(
    {
      principal,
      workspaceId: "workspace-attacker",
    },
    "agent-1",
  );

  assert.equal(
    receivedWorkspace,
    "workspace-authorized",
  );
});

test("scoped repository list remains tenant-bound", async () => {

  const repository: TenantRepository<{ workspaceId: string }> = {

    async findById(scope) {
      return {
        workspaceId: scope.workspaceId,
      };
    },

    async list(scope) {
      return [
        {
          workspaceId: scope.workspaceId,
        },
      ];
    },
  };

  const scoped = scopedRepository(
    repository,
    {
      principal,
      workspaceId: "workspace-1",
    },
  );

  const rows = await scoped.list({
    principal,
    workspaceId: "workspace-foreign",
  });

  assert.deepEqual(
    rows,
    [{ workspaceId: "workspace-1" }],
  );
});
