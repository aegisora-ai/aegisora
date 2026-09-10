import {
  EnterpriseEntitlementEngine,
} from "@aegisora/core";

import type {
  EnterpriseEntitlementSet,
  EntitlementMetric,
} from "@aegisora/core";

export interface EnterpriseUsageReader {
  getSnapshot(
    workspaceId: string,
  ): Promise<{
    readonly workspaceId: string;
    readonly tokens: number;
    readonly executions: number;
    readonly agents: number;
    readonly tools: number;
  }>;
}

export interface EnterpriseEntitlementRuntimeConfig {
  readonly workspaceId: string;
  readonly entitlements:
    EnterpriseEntitlementSet;
  readonly usageReader: EnterpriseUsageReader;
}

export interface EnterpriseEntitlementRuntimeInput {
  readonly workspaceId: string;
  readonly metric:
    EntitlementMetric;
  readonly amount: number;
}

export class EnterpriseEntitlementRuntimeBridge {
  constructor(
    private readonly config:
      EnterpriseEntitlementRuntimeConfig,
  ) {
    if (
      typeof config.workspaceId !== "string" ||
      config.workspaceId.trim().length === 0
    ) {
      throw new Error(
        "Enterprise entitlement workspaceId is required.",
      );
    }

    if (
      config.entitlements.workspaceId !==
      config.workspaceId
    ) {
      throw new Error(
        "Enterprise entitlement workspace mismatch.",
      );
    }
  }

  async evaluate(
    input: EnterpriseEntitlementRuntimeInput,
  ) {
    if (
      input.workspaceId !==
      this.config.workspaceId
    ) {
      throw new Error(
        "[ENTITLEMENT:TENANT] runtime workspace does not match configured workspace",
      );
    }

    const usage =
      await this.config.usageReader.getSnapshot(
        this.config.workspaceId,
      );

    const engine = new EnterpriseEntitlementEngine();

    return engine.evaluate(
      this.config.entitlements,
      usage,
      input,
    );
  }
}
