import type {
  CreateEnterpriseUsageEventInput,
  EnterpriseUsageEvent,
} from "@aegisora/core";

export interface SupabaseUsageLedgerInsertClient {
  from(
    table: string,
  ): {
    insert(
      row: Record<string, unknown>,
    ): PromiseLike<{
      error: unknown;
    }>;
  };
}

export interface SupabaseUsageLedgerWriterConfig {
  readonly client: SupabaseUsageLedgerInsertClient;
  readonly tableName?: string;
}

function validateCanonicalInput(
  input: CreateEnterpriseUsageEventInput,
): void {
  const requiredFields: Array<
    keyof CreateEnterpriseUsageEventInput
  > = [
    "eventId",
    "workspaceId",
    "traceId",
    "decisionId",
    "executionId",
    "evidenceId",
    "agentId",
    "providerId",
    "modelId",
  ];

  for (const field of requiredFields) {
    const value = input[field];

    if (
      typeof value !== "string" ||
      value.trim().length === 0
    ) {
      throw new Error(
        `[USAGE_LEDGER:INVALID] ${String(field)} is required`,
      );
    }
  }
}

function serializeUsageEvent(
  event: EnterpriseUsageEvent,
): Record<string, unknown> {
  return {
    event_id: event.eventId,
    workspace_id: event.workspaceId,

    trace_id: event.traceId,
    decision_id: event.decisionId,
    execution_id: event.executionId,
    evidence_id: event.evidenceId,

    agent_id: event.agentId,
    provider_id: event.providerId,
    model_id: event.modelId,

    event_type: event.eventType,
    outcome: event.outcome,

    prompt_tokens: event.usage.promptTokens,
    completion_tokens: event.usage.completionTokens,
    total_tokens: event.usage.totalTokens,

    created_at: event.createdAt,
    metadata: event.metadata,
  };
}

export class SupabaseEnterpriseUsageLedgerWriter {
  private readonly tableName: string;

  constructor(
    private readonly config: SupabaseUsageLedgerWriterConfig,
  ) {
    this.tableName =
      config.tableName ??
      "enterprise_usage_ledger";
  }

  async create(
    input: CreateEnterpriseUsageEventInput,
  ): Promise<EnterpriseUsageEvent> {
    validateCanonicalInput(input);

    const event: EnterpriseUsageEvent =
      Object.freeze({
        ...input,

        eventType:
          input.eventType ??
          "provider.execution",

        createdAt:
          input.createdAt ??
          new Date().toISOString(),

        usage: Object.freeze({
          ...input.usage,
        }),

        metadata: Object.freeze({
          ...(input.metadata ?? {}),
        }),
      });

    const result =
      await this.config.client
        .from(this.tableName)
        .insert(
          serializeUsageEvent(event),
        );

    if (result.error) {
      throw new Error(
        `[USAGE_LEDGER:PERSISTENCE] failed to persist usage event ${event.eventId}`,
        {
          cause: result.error,
        },
      );
    }

    return event;
  }
}

export function toSupabaseUsageLedgerRow(
  event: EnterpriseUsageEvent,
): Record<string, unknown> {
  return serializeUsageEvent(event);
}