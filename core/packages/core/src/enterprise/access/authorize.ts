import type {
  AuthorizationResult,
  AuthenticatedPrincipal,
  WorkspaceAuthorizationContext,
  WorkspaceMembership,
  WorkspacePermission,
  WorkspaceRole,
} from "./types";
import { hasWorkspacePermission } from "./rbac";

export interface MembershipResolver {
  findMembership(
    userId: string,
    workspaceId: string,
  ): Promise<WorkspaceMembership | null>;
}

export async function authorizeWorkspacePermission(
  resolver: MembershipResolver,
  input: {
    principal: AuthenticatedPrincipal | null;
    workspaceId: string;
    permission: WorkspacePermission;
  },
): Promise<AuthorizationResult> {

  if (!input.principal) {
    return {
      authorized: false,
      code: "UNAUTHENTICATED",
      reason: "Authentication is required.",
    };
  }

  const membership = await resolver.findMembership(
    input.principal.userId,
    input.workspaceId,
  );

  if (!membership) {
    return {
      authorized: false,
      code: "NO_MEMBERSHIP",
      reason: "Principal has no membership in the requested workspace.",
    };
  }

  if (!membership.active) {
    return {
      authorized: false,
      code: "MEMBERSHIP_INACTIVE",
      reason: "Workspace membership is inactive.",
    };
  }

  if (!hasWorkspacePermission(membership.role, input.permission)) {
    return {
      authorized: false,
      code: "FORBIDDEN",
      reason: `Role ${membership.role} does not grant ${input.permission}.`,
    };
  }

  const context: WorkspaceAuthorizationContext = {
    principal: input.principal,
    membership,
  };

  return {
    authorized: true,
    permission: input.permission,
    context,
  };
}

export function roleCan(
  role: WorkspaceRole,
  permission: WorkspacePermission,
): boolean {
  return hasWorkspacePermission(role, permission);
}
