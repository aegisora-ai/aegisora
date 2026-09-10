import {
  EnterpriseRealtimeBus,
} from "@aegisora/core";

import type {
  EnterpriseRealtimeDecision,
  EnterpriseRealtimeEvent,
  EnterpriseRealtimeEventType,
  EnterpriseRealtimeWriter,
} from "@aegisora/core";

export type EnterpriseRealtimeRuntimeConfig = {
  writer?: EnterpriseRealtimeWriter;
};

export type EnterpriseRealtimeRuntimeInput = {
  id: string;
  workspaceId: string;

  type: EnterpriseRealtimeEventType;

  traceId: string;
  decisionId: string;
  executionId: string;
  evidenceId: string;

  agentId: string;
  actorId?: string;

  action: string;

  decision?: EnterpriseRealtimeDecision;
  riskScore?: number;

  timestamp?: Date;

  metadata?: Record<string, unknown>;
};

export class EnterpriseRealtimeRuntimeBridge {
  private readonly bus: EnterpriseRealtimeBus;

  constructor(
    config: EnterpriseRealtimeRuntimeConfig = {},
  ) {
    this.bus = new EnterpriseRealtimeBus(
      config.writer,
    );
  }

  async publish(
    input: EnterpriseRealtimeRuntimeInput,
  ): Promise<void> {
    const event: EnterpriseRealtimeEvent =
      Object.freeze({
        id: input.id,
        workspaceId: input.workspaceId,
        type: input.type,
        traceId: input.traceId,
        decisionId: input.decisionId,
        executionId: input.executionId,
        evidenceId: input.evidenceId,
        agentId: input.agentId,
        actorId: input.actorId,
        action: input.action,
        decision: input.decision,
        riskScore: input.riskScore,
        timestamp: input.timestamp ?? new Date(),
        metadata: Object.freeze({
          ...(input.metadata ?? {}),
        }),
      });

    await this.bus.publish(event);
  }

  subscribe(
    listener: (
      event: EnterpriseRealtimeEvent,
    ) => void,
  ): () => void {
    return this.bus.subscribe(listener);
  }

  listenerCount(): number {
    return this.bus.listenerCount();
  }
}
