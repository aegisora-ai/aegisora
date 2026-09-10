export {
  TenantAccessDeniedError,
  createTenantScopeFactory,
  scopedRepository,
  assertWorkspaceScope,
} from "./boundary";

export type {
  TenantScope,
  TenantQuery,
  TenantCommand,
  TenantRepository,
  TenantMutationRepository,
  TenantAuthorizationResolver,
} from "./types";
