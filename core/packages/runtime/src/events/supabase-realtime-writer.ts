import type {
  EnterpriseRealtimeEvent,
  EnterpriseRealtimeWriter,
} from "@aegisora/core";

export type SupabaseRealtimeInsertClient = {
  from(table: string): {
    insert(
      row: Record<string, unknown>,
    ): PromiseLike<{
      error: unknown;
    }>;
  };
};

export type SupabaseRealtimeWriterConfig = {
  client: SupabaseRealtimeInsertClient;
  tableName?: string;
};

function serializeEvent(
  event: EnterpriseRealtimeEvent,
): Record<string, unknown> {
  return {
    event_id: event.id,
    workspace_id: event.workspaceId,
    event_type: event.type,

    trace_id: event.traceId,
    decision_id: event.decisionId,
    execution_id: event.executionId,
    evidence_id: event.evidenceId,

    agent_id: event.agentId,
    actor_id: event.actorId ?? null,

    action: event.action,

    decision: event.decision ?? null,
    risk_score: event.riskScore ?? null,

    occurred_at: event.timestamp.toISOString(),

    metadata: event.metadata,
    payload: {},
  };
}

export class SupabaseEnterpriseRealtimeWriter
  implements EnterpriseRealtimeWriter
{
  private readonly tableName: string;

  constructor(
    private readonly config: SupabaseRealtimeWriterConfig,
  ) {
    this.tableName =
      config.tableName ?? "enterprise_realtime_events";
  }

  async publish(
    event: EnterpriseRealtimeEvent,
  ): Promise<void> {
    const result =
      await this.config.client
        .from(this.tableName)
        .insert(serializeEvent(event));

    if (result.error) {
      throw new Error(
        `Failed to persist enterprise realtime event ${event.id}`,
        {
          cause: result.error,
        },
      );
    }
  }
}

export function toSupabaseRealtimeRow(
  event: EnterpriseRealtimeEvent,
): Record<string, unknown> {
  return serializeEvent(event);
}
