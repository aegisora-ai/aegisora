import type {
  AuthenticatedPrincipal,
  WorkspaceAuthorizationContext,
  WorkspacePermission,
} from "../access";
import type {
  TenantRepository,
  TenantScope,
  TenantAuthorizationResolver,
} from "./types";

export class TenantAccessDeniedError extends Error {
  readonly code:
    | "UNAUTHENTICATED"
    | "NO_MEMBERSHIP"
    | "MEMBERSHIP_INACTIVE"
    | "FORBIDDEN";

  constructor(
    code:
      | "UNAUTHENTICATED"
      | "NO_MEMBERSHIP"
      | "MEMBERSHIP_INACTIVE"
      | "FORBIDDEN",
    reason: string,
  ) {
    super(reason);
    this.name = "TenantAccessDeniedError";
    this.code = code;
  }
}

export interface TenantScopeFactory {
  create(
    principal: AuthenticatedPrincipal | null,
    workspaceId: string,
    permission: WorkspacePermission,
  ): Promise<TenantScope>;
}

export function createTenantScopeFactory(
  authorization: TenantAuthorizationResolver,
): TenantScopeFactory {

  return {
    async create(
      principal,
      workspaceId,
      permission,
    ): Promise<TenantScope> {

      const result = await authorization.authorize(
        principal,
        workspaceId,
        permission,
      );

      if (!result.authorized) {
        throw new TenantAccessDeniedError(
          result.code,
          result.reason,
        );
      }

      return {
        principal: result.context.principal,
        workspaceId: result.context.membership.workspaceId,
      };
    },
  };
}

/**
 * Wraps a repository so callers cannot provide an arbitrary workspace
 * outside the already-authorized tenant scope.
 */
export function scopedRepository<T>(
  repository: TenantRepository<T>,
  scope: TenantScope,
): TenantRepository<T> {

  return {
    async findById(_ignoredScope, id) {
      return repository.findById(scope, id);
    },

    async list(_ignoredScope) {
      return repository.list(scope);
    },
  };
}

export function assertWorkspaceScope(
  scope: TenantScope,
  expectedWorkspaceId: string,
): void {

  if (scope.workspaceId !== expectedWorkspaceId) {
    throw new TenantAccessDeniedError(
      "FORBIDDEN",
      "Tenant scope mismatch.",
    );
  }
}
