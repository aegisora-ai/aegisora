import type {
  EnterpriseIdentityProtocol,
  EnterpriseSSOConfig,
  EnterpriseSCIMProvisioningResult,
} from "./types";

export class EnterpriseIdentityEngine {
  assertWorkspace(
    configuredWorkspaceId: string,
    requestedWorkspaceId: string,
  ): void {
    if (!configuredWorkspaceId) {
      throw new Error("Configured workspaceId is required.");
    }

    if (!requestedWorkspaceId) {
      throw new Error("Requested workspaceId is required.");
    }

    if (configuredWorkspaceId !== requestedWorkspaceId) {
      throw new Error(
        "Cross-workspace enterprise identity operation denied.",
      );
    }
  }

  validateSSO(config: EnterpriseSSOConfig): void {
    if (!config.workspaceId) {
      throw new Error("SSO workspaceId is required.");
    }

    if (!config.issuer) {
      throw new Error("SSO issuer is required.");
    }

    if (!config.clientId) {
      throw new Error("SSO clientId is required.");
    }

    const protocols: readonly EnterpriseIdentityProtocol[] = [
      "OIDC",
      "SAML",
    ];

    if (!protocols.includes(config.protocol)) {
      throw new Error(
        `Unsupported enterprise identity protocol: ${config.protocol}`,
      );
    }
  }

  validateSCIM(
    result: EnterpriseSCIMProvisioningResult,
  ): EnterpriseSCIMProvisioningResult {
    if (!result.workspaceId) {
      throw new Error("SCIM workspaceId is required.");
    }

    return Object.freeze({
      ...result,
    });
  }
}
