export type EnterpriseIdentityProtocol = "OIDC" | "SAML";

export interface EnterpriseSSOConfig {
  workspaceId: string;
  protocol: EnterpriseIdentityProtocol;
  issuer: string;
  clientId: string;
  enabled: boolean;
}

export interface EnterpriseSCIMUser {
  externalId: string;
  workspaceId: string;
  email: string;
  active: boolean;
}

export interface EnterpriseSCIMProvisioningResult {
  externalId: string;
  workspaceId: string;
  active: boolean;
}

export function assertEnterpriseWorkspace(
  expectedWorkspaceId: string,
  actualWorkspaceId: string,
) {
  if (expectedWorkspaceId !== actualWorkspaceId) {
    throw new Error("WORKSPACE_MISMATCH");
  }
}
