export type EnterpriseUsageEventType =
  | "provider.execution"
  | "provider.completion";

export type EnterpriseUsageOutcome =
  | "executed"
  | "failed";

export interface EnterpriseUsageAmounts {
  readonly promptTokens: number;
  readonly completionTokens: number;
  readonly totalTokens: number;
}

export interface EnterpriseUsageEvent {
  readonly eventId: string;
  readonly workspaceId: string;

  readonly traceId: string;
  readonly decisionId: string;
  readonly executionId: string;
  readonly evidenceId: string;

  readonly agentId: string;
  readonly providerId: string;
  readonly modelId: string;

  readonly eventType: EnterpriseUsageEventType;
  readonly outcome: EnterpriseUsageOutcome;

  readonly usage: Readonly<EnterpriseUsageAmounts>;

  readonly createdAt: string;
  readonly metadata: Readonly<Record<string, unknown>>;
}

export interface CreateEnterpriseUsageEventInput {
  readonly eventId: string;
  readonly workspaceId: string;

  readonly traceId: string;
  readonly decisionId: string;
  readonly executionId: string;
  readonly evidenceId: string;

  readonly agentId: string;
  readonly providerId: string;
  readonly modelId: string;

  readonly eventType?: EnterpriseUsageEventType;
  readonly outcome: EnterpriseUsageOutcome;

  readonly usage: EnterpriseUsageAmounts;

  readonly createdAt?: string;
  readonly metadata?: Readonly<Record<string, unknown>>;
}
