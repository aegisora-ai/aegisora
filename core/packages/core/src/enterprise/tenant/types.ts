import type {
  AuthenticatedPrincipal,
  WorkspaceAuthorizationContext,
  WorkspacePermission,
} from "../access";

export interface TenantScope {
  readonly workspaceId: string;
  readonly principal: AuthenticatedPrincipal;
}

export interface TenantQuery {
  readonly workspaceId: string;
}

export interface TenantCommand {
  readonly workspaceId: string;
}

export interface TenantRepository<T> {
  findById(
    scope: TenantScope,
    id: string,
  ): Promise<T | null>;

  list(
    scope: TenantScope,
  ): Promise<readonly T[]>;
}

export interface TenantMutationRepository<TCreate, TResult> {
  create(
    context: WorkspaceAuthorizationContext,
    input: TCreate,
  ): Promise<TResult>;
}

export interface TenantAuthorizationResolver {
  authorize(
    principal: AuthenticatedPrincipal | null,
    workspaceId: string,
    permission: WorkspacePermission,
  ): Promise<
    | {
        readonly authorized: true;
        readonly context: WorkspaceAuthorizationContext;
      }
    | {
        readonly authorized: false;
        readonly code:
          | "UNAUTHENTICATED"
          | "NO_MEMBERSHIP"
          | "MEMBERSHIP_INACTIVE"
          | "FORBIDDEN";
        readonly reason: string;
      }
  >;
}
