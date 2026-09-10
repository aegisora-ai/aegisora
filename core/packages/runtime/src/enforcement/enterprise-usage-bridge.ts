import { randomUUID } from "node:crypto";

import type {
  CreateEnterpriseUsageEventInput,
  EnterpriseUsageEvent,
} from "@aegisora/core";

export interface EnterpriseUsageWriter {
  create(
    input: CreateEnterpriseUsageEventInput,
  ): Promise<EnterpriseUsageEvent>;
}

export interface EnterpriseUsageRuntimeConfig {
  readonly workspaceId: string;
  readonly writer: EnterpriseUsageWriter;
}

export interface EnterpriseUsageRuntimeInput {
  readonly traceId: string;
  readonly decisionId: string;
  readonly executionId: string;
  readonly evidenceId: string;

  readonly agentId: string;

  readonly providerId: string;
  readonly modelId: string;

  readonly outcome: "executed" | "failed";

  readonly usage: {
    readonly promptTokens: number;
    readonly completionTokens: number;
    readonly totalTokens: number;
  };

  readonly metadata?: Record<string, unknown>;
}

function requireNonEmpty(
  name: string,
  value: string,
): void {
  if (
    typeof value !== "string" ||
    value.trim().length === 0
  ) {
    throw new Error(
      `Enterprise usage ${name} is required.`,
    );
  }
}

function sanitizeMetadata(
  metadata: Record<string, unknown> | undefined,
): Record<string, unknown> {
  const source = metadata ?? {};

  return Object.fromEntries(
    Object.entries(source).filter(
      ([key]) =>
        key !== "provider" &&
        key !== "model" &&
        key !== "providerId" &&
        key !== "modelId" &&
        key !== "workspaceId" &&
        key !== "traceId" &&
        key !== "decisionId" &&
        key !== "executionId" &&
        key !== "evidenceId" &&
        key !== "agentId",
    ),
  );
}

export class EnterpriseUsageRuntimeBridge {
  private readonly workspaceId: string;
  private readonly writer: EnterpriseUsageWriter;

  constructor(
    config: EnterpriseUsageRuntimeConfig,
  ) {
    requireNonEmpty(
      "workspaceId",
      config.workspaceId,
    );

    this.workspaceId = config.workspaceId;
    this.writer = config.writer;
  }

  async record(
    input: EnterpriseUsageRuntimeInput,
  ): Promise<EnterpriseUsageEvent> {
    requireNonEmpty("traceId", input.traceId);
    requireNonEmpty("decisionId", input.decisionId);
    requireNonEmpty("executionId", input.executionId);
    requireNonEmpty("evidenceId", input.evidenceId);
    requireNonEmpty("agentId", input.agentId);
    requireNonEmpty("providerId", input.providerId);
    requireNonEmpty("modelId", input.modelId);

    return await this.writer.create({
      eventId: randomUUID(),

      workspaceId:
        this.workspaceId,

      traceId:
        input.traceId,

      decisionId:
        input.decisionId,

      executionId:
        input.executionId,

      evidenceId:
        input.evidenceId,

      agentId:
        input.agentId,

      providerId:
        input.providerId,

      modelId:
        input.modelId,

      eventType:
        "provider.execution",

      outcome:
        input.outcome,

      usage: {
        promptTokens:
          input.usage.promptTokens,

        completionTokens:
          input.usage.completionTokens,

        totalTokens:
          input.usage.totalTokens,
      },

      createdAt:
        new Date().toISOString(),

      metadata: {
        ...sanitizeMetadata(input.metadata),
        enterpriseWorkspaceId:
          this.workspaceId,
      },
    });
  }
}
