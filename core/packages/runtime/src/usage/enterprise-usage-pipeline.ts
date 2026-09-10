import type {
  EnterpriseUsageEvent,
  EnterpriseUsageWindow,
} from "@aegisora/core";

import type {
  EnterpriseUsageRuntimeInput,
  EnterpriseUsageRuntimeBridge,
} from "../enforcement/enterprise-usage-bridge";

import type {
  EnterpriseUsageProjectionPersistResult,
  SupabaseEnterpriseUsageProjectionWriter,
} from "./supabase-usage-projection-writer";

export interface EnterpriseUsagePipeline {
  persist(
    input: EnterpriseUsageRuntimeInput,
    window: EnterpriseUsageWindow,
  ): Promise<{
    readonly event: EnterpriseUsageEvent;
    readonly projection: EnterpriseUsageProjectionPersistResult;
  }>;
}

export class DefaultEnterpriseUsagePipeline
  implements EnterpriseUsagePipeline
{
  constructor(
    private readonly bridge: EnterpriseUsageRuntimeBridge,
    private readonly projectionWriter:
      SupabaseEnterpriseUsageProjectionWriter,
  ) {}

  async persist(
    input: EnterpriseUsageRuntimeInput,
    window: EnterpriseUsageWindow,
  ): Promise<{
    readonly event: EnterpriseUsageEvent;
    readonly projection: EnterpriseUsageProjectionPersistResult;
  }> {
    const event =
      await this.bridge.record(input);

    const projection =
      await this.projectionWriter.project(
        event,
        window,
      );

    return Object.freeze({
      event,
      projection,
    });
  }
}