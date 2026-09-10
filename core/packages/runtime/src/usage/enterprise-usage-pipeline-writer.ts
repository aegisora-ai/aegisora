import type {
  EnterpriseUsageEvent,
  EnterpriseUsageWindow,
} from "@aegisora/core";

import type {
  CreateEnterpriseUsageEventInput,
} from "@aegisora/core";

import type {
  EnterpriseUsageWriter,
} from "../enforcement/enterprise-usage-bridge";

import {
  SupabaseEnterpriseUsageProjectionWriter,
} from "./supabase-usage-projection-writer";

export interface EnterpriseUsageLedgerWriterLike
  extends EnterpriseUsageWriter {}

export interface EnterpriseUsagePipelineWriterConfig {
  readonly ledgerWriter: EnterpriseUsageLedgerWriterLike;
  readonly projectionWriter:
    SupabaseEnterpriseUsageProjectionWriter;
  readonly window: EnterpriseUsageWindow;
}

function validateWindow(
  window: EnterpriseUsageWindow,
): void {
  const start = Date.parse(window.startAt);
  const end = Date.parse(window.endAt);

  if (
    Number.isNaN(start) ||
    Number.isNaN(end) ||
    end <= start
  ) {
    throw new Error(
      "[USAGE_PIPELINE:INVALID] window must contain valid ordered timestamps",
    );
  }
}

export class EnterpriseUsagePipelineWriter
  implements EnterpriseUsageWriter
{
  constructor(
    private readonly config:
      EnterpriseUsagePipelineWriterConfig,
  ) {
    validateWindow(config.window);
  }

  async create(
    input: CreateEnterpriseUsageEventInput,
  ): Promise<EnterpriseUsageEvent> {
    const event =
      await this.config.ledgerWriter.create(
        input,
      );

    await this.config.projectionWriter.project(
      event,
      this.config.window,
    );

    return event;
  }
}