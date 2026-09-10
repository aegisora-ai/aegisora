/**
 * Aegisora 3.0 Enterprise Access Contract
 *
 * Framework-agnostic domain types.
 *
 * This layer MUST NOT know about Next.js, Supabase, HTTP,
 * cookies, UI state, or database implementation details.
 */

export type UserId = string & { readonly __brand: "AegisoraUserId" };
export type WorkspaceId = string & { readonly __brand: "AegisoraWorkspaceId" };
export type MembershipId = string & { readonly __brand: "AegisoraMembershipId" };

export type WorkspaceRole =
  | "owner"
  | "admin"
  | "developer"
  | "analyst"
  | "auditor"
  | "viewer";

export type WorkspacePermission =
  | "workspace.read"
  | "workspace.update"
  | "members.read"
  | "members.manage"
  | "agents.read"
  | "agents.manage"
  | "providers.read"
  | "providers.manage"
  | "policies.read"
  | "policies.manage"
  | "decisions.read"
  | "evidence.read"
  | "audit.read"
  | "approvals.read"
  | "approvals.manage"
  | "runtime.read"
  | "runtime.execute"
  | "api_keys.read"
  | "api_keys.manage"
  | "billing.read"
  | "billing.manage"
  | "settings.manage";

export interface AuthenticatedPrincipal {
  readonly userId: UserId;
  readonly email?: string;
}

export interface WorkspaceMembership {
  readonly membershipId: MembershipId;
  readonly workspaceId: WorkspaceId;
  readonly userId: UserId;
  readonly role: WorkspaceRole;
  readonly active: boolean;
}

export interface WorkspaceAuthorizationContext {
  readonly principal: AuthenticatedPrincipal;
  readonly membership: WorkspaceMembership;
}

export interface AuthorizationFailure {
  readonly authorized: false;
  readonly code:
    | "UNAUTHENTICATED"
    | "NO_MEMBERSHIP"
    | "MEMBERSHIP_INACTIVE"
    | "FORBIDDEN";
  readonly reason: string;
}

export interface AuthorizationSuccess {
  readonly authorized: true;
  readonly permission: WorkspacePermission;
  readonly context: WorkspaceAuthorizationContext;
}

export type AuthorizationResult =
  | AuthorizationFailure
  | AuthorizationSuccess;

export function userId(value: string): UserId {
  if (!value.trim()) {
    throw new Error("userId must not be empty");
  }

  return value as UserId;
}

export function workspaceId(value: string): WorkspaceId {
  if (!value.trim()) {
    throw new Error("workspaceId must not be empty");
  }

  return value as WorkspaceId;
}

export function membershipId(value: string): MembershipId {
  if (!value.trim()) {
    throw new Error("membershipId must not be empty");
  }

  return value as MembershipId;
}
