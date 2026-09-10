import type {
  EnterpriseUsageEvent,
  EnterpriseUsageWindow,
} from "@aegisora/core";

export interface SupabaseUsageProjectionRpcClient {
  rpc(
    functionName: string,
    params?: Record<string, unknown>,
  ): Promise<{
    data: unknown;
    error: {
      message: string;
    } | null;
  }>;
}

export type SupabaseUsageProjectionWriterConfig = {
  readonly client: SupabaseUsageProjectionRpcClient;
};

export type EnterpriseUsageProjectionPersistResult =
  | {
      readonly status: "applied";
      readonly eventId: string;
    }
  | {
      readonly status: "duplicate";
      readonly eventId: string;
    }
  | {
      readonly status: "ignored";
      readonly eventId: string;
    };

function requireNonEmpty(
  name: string,
  value: string,
): string {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `[USAGE_PROJECTION:INVALID] ${name} is required`,
    );
  }

  return value;
}

function validateWindow(
  window: EnterpriseUsageWindow,
): void {
  requireNonEmpty(
    "window.startAt",
    window.startAt,
  );

  requireNonEmpty(
    "window.endAt",
    window.endAt,
  );

  const start = Date.parse(window.startAt);
  const end = Date.parse(window.endAt);

  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new Error(
      "[USAGE_PROJECTION:INVALID] projection window must contain valid timestamps",
    );
  }

  if (end <= start) {
    throw new Error(
      "[USAGE_PROJECTION:INVALID] projection window_end must be greater than window_start",
    );
  }
}

function parseRpcStatus(
  data: unknown,
  eventId: string,
): EnterpriseUsageProjectionPersistResult {
  if (
    typeof data !== "object" ||
    data === null ||
    Array.isArray(data)
  ) {
    throw new Error(
      "[USAGE_PROJECTION:INVALID] projection RPC returned invalid data",
    );
  }

  const status = (data as Record<string, unknown>).status;

  if (
    status !== "applied" &&
    status !== "duplicate" &&
    status !== "ignored"
  ) {
    throw new Error(
      "[USAGE_PROJECTION:INVALID] projection RPC returned invalid status",
    );
  }

  return Object.freeze({
    status,
    eventId,
  });
}

export class SupabaseEnterpriseUsageProjectionWriter {
  private readonly config: SupabaseUsageProjectionWriterConfig;

  constructor(
    config: SupabaseUsageProjectionWriterConfig,
  ) {
    this.config = config;
  }

  async project(
    event: EnterpriseUsageEvent,
    window: EnterpriseUsageWindow,
  ): Promise<EnterpriseUsageProjectionPersistResult> {
    const eventId = requireNonEmpty(
      "event.eventId",
      event.eventId,
    );

    const workspaceId = requireNonEmpty(
      "event.workspaceId",
      event.workspaceId,
    );

    validateWindow(window);

    const result =
      await this.config.client.rpc(
        "project_enterprise_usage_event",
        {
          p_event_id: eventId,
          p_workspace_id: workspaceId,
          p_window_start: window.startAt,
          p_window_end: window.endAt,
        },
      );

    if (result.error) {
      throw new Error(
        `[USAGE_PROJECTION:PERSISTENCE] ${result.error.message}`,
      );
    }

    return parseRpcStatus(
      result.data,
      eventId,
    );
  }
}
