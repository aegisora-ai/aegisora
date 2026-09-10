import type {
  PolicyRegistry,
} from "../policies";

import type {
  PolicyResolution,
} from "./types";

import type {
  ControlRequest,
} from "./types";

export class ControlPolicyResolver {

  constructor(
    private readonly policies:
      PolicyRegistry,
  ) {}

  resolve(
    request: ControlRequest,
  ): PolicyResolution {

    const candidates =
      this.policies.listPolicies({
        workspaceId:
          request.workspaceId,
        state: "published",
      });

    for (const policy of candidates) {

      if (!policy.currentVersionId) {
        continue;
      }

      const version =
        this.policies.getVersion(
          request.workspaceId,
          policy.currentVersionId,
        );

      if (!version) {
        continue;
      }

      for (const rule of version.document.rules) {

        if (
          rule.action !== request.action &&
          rule.action !== "*"
        ) {
          continue;
        }

        return {
          policy,
          version,
          matched: true,
          effect: rule.effect,
        };
      }

      if (
        version.document.defaultEffect
      ) {
        return {
          policy,
          version,
          matched: false,
          effect:
            version.document.defaultEffect,
        };
      }
    }

    return {
      policy: null,
      version: null,
      matched: false,
    };
  }
}
