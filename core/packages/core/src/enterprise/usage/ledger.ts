import type {
  CreateEnterpriseUsageEventInput,
  EnterpriseUsageEvent,
} from "./types";

function requireNonEmpty(name: string, value: string): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`[USAGE:INVALID] ${name} is required`);
  }

  return value;
}

function requireSafeInteger(name: string, value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new Error(`[USAGE:INVALID] ${name} must be a non-negative safe integer`);
  }

  return value;
}

function validateUsage(
  usage: CreateEnterpriseUsageEventInput["usage"],
): EnterpriseUsageEvent["usage"] {
  const promptTokens = requireSafeInteger(
    "usage.promptTokens",
    usage.promptTokens,
  );

  const completionTokens = requireSafeInteger(
    "usage.completionTokens",
    usage.completionTokens,
  );

  const totalTokens = requireSafeInteger(
    "usage.totalTokens",
    usage.totalTokens,
  );

  if (totalTokens !== promptTokens + completionTokens) {
    throw new Error(
      "[USAGE:INVALID] usage.totalTokens must equal promptTokens + completionTokens",
    );
  }

  return Object.freeze({
    promptTokens,
    completionTokens,
    totalTokens,
  });
}

function validateCorrelation(input: CreateEnterpriseUsageEventInput): void {
  requireNonEmpty("workspaceId", input.workspaceId);
  requireNonEmpty("traceId", input.traceId);
  requireNonEmpty("decisionId", input.decisionId);
  requireNonEmpty("executionId", input.executionId);
  requireNonEmpty("evidenceId", input.evidenceId);
  requireNonEmpty("agentId", input.agentId);
  requireNonEmpty("providerId", input.providerId);
  requireNonEmpty("modelId", input.modelId);
}

function freezeMetadata(
  metadata: Readonly<Record<string, unknown>> | undefined,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    ...(metadata ?? {}),
  });
}

function freezeRecord(
  input: CreateEnterpriseUsageEventInput,
): EnterpriseUsageEvent {
  validateCorrelation(input);

  const eventId = requireNonEmpty("eventId", input.eventId);
  const usage = validateUsage(input.usage);

  const createdAt = input.createdAt ?? new Date().toISOString();

  if (Number.isNaN(Date.parse(createdAt))) {
    throw new Error("[USAGE:INVALID] createdAt must be a valid ISO timestamp");
  }

  const record: EnterpriseUsageEvent = {
    eventId,
    workspaceId: input.workspaceId,
    traceId: input.traceId,
    decisionId: input.decisionId,
    executionId: input.executionId,
    evidenceId: input.evidenceId,
    agentId: input.agentId,
    providerId: input.providerId,
    modelId: input.modelId,
    eventType: input.eventType ?? "provider.execution",
    outcome: input.outcome,
    usage,
    createdAt,
    metadata: freezeMetadata(input.metadata),
  };

  return Object.freeze(record);
}

export class EnterpriseUsageLedger {
  private readonly records = new Map<string, EnterpriseUsageEvent>();

  create(input: CreateEnterpriseUsageEventInput): EnterpriseUsageEvent {
    // Validate the complete canonical event BEFORE idempotency lookup.
    // A malformed replay must never be accepted merely because eventId
    // already exists.
    const record = freezeRecord(input);

    const existing = this.records.get(record.eventId);

    if (existing) {
      if (
        existing.workspaceId === record.workspaceId &&
        existing.traceId === record.traceId &&
        existing.executionId === record.executionId
      ) {
        return existing;
      }

      throw new Error(
        "[USAGE:DUPLICATE] eventId already belongs to a different usage identity",
      );
    }

    this.records.set(record.eventId, record);

    return record;
  }

  get(eventId: string): EnterpriseUsageEvent | undefined {
    return this.records.get(eventId);
  }

  getForWorkspace(
    workspaceId: string,
    eventId: string,
  ): EnterpriseUsageEvent | undefined {
    const record = this.records.get(eventId);

    if (!record || record.workspaceId !== workspaceId) {
      return undefined;
    }

    return record;
  }

  listForWorkspace(workspaceId: string): readonly EnterpriseUsageEvent[] {
    return Object.freeze(
      Array.from(this.records.values()).filter(
        (record) => record.workspaceId === workspaceId,
      ),
    );
  }

  list(): readonly EnterpriseUsageEvent[] {
    return Object.freeze(Array.from(this.records.values()));
  }
}
