import type { WorkspacePermission, WorkspaceRole } from "./types";

const ROLE_PERMISSIONS: Readonly<Record<WorkspaceRole, ReadonlySet<WorkspacePermission>>> = {
  owner: new Set<WorkspacePermission>([
    "workspace.read",
    "workspace.update",
    "members.read",
    "members.manage",
    "agents.read",
    "agents.manage",
    "providers.read",
    "providers.manage",
    "policies.read",
    "policies.manage",
    "decisions.read",
    "evidence.read",
    "audit.read",
    "approvals.read",
    "approvals.manage",
    "runtime.read",
    "runtime.execute",
    "api_keys.read",
    "api_keys.manage",
    "billing.read",
    "billing.manage",
    "settings.manage",
  ]),

  admin: new Set<WorkspacePermission>([
    "workspace.read",
    "workspace.update",
    "members.read",
    "members.manage",
    "agents.read",
    "agents.manage",
    "providers.read",
    "providers.manage",
    "policies.read",
    "policies.manage",
    "decisions.read",
    "evidence.read",
    "audit.read",
    "approvals.read",
    "approvals.manage",
    "runtime.read",
    "runtime.execute",
    "api_keys.read",
    "api_keys.manage",
    "billing.read",
    "settings.manage",
  ]),

  developer: new Set<WorkspacePermission>([
    "workspace.read",
    "members.read",
    "agents.read",
    "agents.manage",
    "providers.read",
    "providers.manage",
    "policies.read",
    "policies.manage",
    "decisions.read",
    "evidence.read",
    "runtime.read",
    "runtime.execute",
    "api_keys.read",
    "api_keys.manage",
  ]),

  analyst: new Set<WorkspacePermission>([
    "workspace.read",
    "members.read",
    "agents.read",
    "providers.read",
    "policies.read",
    "decisions.read",
    "evidence.read",
    "audit.read",
    "approvals.read",
    "runtime.read",
  ]),

  auditor: new Set<WorkspacePermission>([
    "workspace.read",
    "members.read",
    "agents.read",
    "providers.read",
    "policies.read",
    "decisions.read",
    "evidence.read",
    "audit.read",
    "approvals.read",
    "runtime.read",
  ]),

  viewer: new Set<WorkspacePermission>([
    "workspace.read",
    "members.read",
    "agents.read",
    "providers.read",
    "policies.read",
    "decisions.read",
    "runtime.read",
  ]),
};

export function hasWorkspacePermission(
  role: WorkspaceRole,
  permission: WorkspacePermission,
): boolean {
  return ROLE_PERMISSIONS[role].has(permission);
}

export function permissionsForRole(
  role: WorkspaceRole,
): readonly WorkspacePermission[] {
  return [...ROLE_PERMISSIONS[role]];
}
