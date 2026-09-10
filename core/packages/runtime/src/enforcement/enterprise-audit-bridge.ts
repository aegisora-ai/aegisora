import type {
  CreateEnterpriseAuditInput,
  EnterpriseAuditRecord,
} from "@aegisora/core";

export interface EnterpriseAuditWriter {
  create(
    input: CreateEnterpriseAuditInput,
  ): EnterpriseAuditRecord;
}

export interface EnterpriseAuditRuntimeConfig {
  readonly workspaceId: string;
  readonly writer: EnterpriseAuditWriter;
}

export interface EnterpriseAuditRuntimeInput {
  readonly auditId: string;
  readonly traceId: string;
  readonly decisionId: string;
  readonly executionId: string;
  readonly evidenceId: string;
  readonly agentId: string;
  readonly actorId?: string;
  readonly action: string;
  readonly resourceType: string;
  readonly resource: string;
  readonly decision:
    | "ALLOW"
    | "BLOCK"
    | "ESCALATE";
  readonly riskScore: number;
  readonly enforcementStatus:
    | "not_executed"
    | "executed"
    | "prevented"
    | "escalated";
  readonly eventType:
    | "decision"
    | "execution"
    | "approval"
    | "evidence"
    | "incident";
  readonly reason: string;
  readonly metadata?: Record<string, unknown>;
}

export class EnterpriseAuditRuntimeBridge {
  private readonly workspaceId: string;
  private readonly writer: EnterpriseAuditWriter;

  constructor(
    config: EnterpriseAuditRuntimeConfig,
  ) {
    if (!config.workspaceId.trim()) {
      throw new Error(
        "Enterprise audit workspaceId is required.",
      );
    }

    this.workspaceId = config.workspaceId;
    this.writer = config.writer;
  }

  record(
    input: EnterpriseAuditRuntimeInput,
  ): EnterpriseAuditRecord {
    const metadata = input.metadata ?? {};

    const actorId =
      typeof metadata.actorId === "string"
        ? metadata.actorId
        : input.actorId;

    return this.writer.create({
      auditId: input.auditId,
      workspaceId: this.workspaceId,

      traceId: input.traceId,
      decisionId: input.decisionId,
      executionId: input.executionId,
      evidenceId: input.evidenceId,

      agentId: input.agentId,

      ...(actorId !== undefined
        ? { actorId }
        : {}),

      action: input.action,
      resourceType: input.resourceType,
      resource: input.resource,

      decision: input.decision,
      riskScore: input.riskScore,
      enforcementStatus:
        input.enforcementStatus,

      eventType: input.eventType,
      reason: input.reason,

      createdAt:
        new Date().toISOString(),

      metadata: {
        ...metadata,
        enterpriseWorkspaceId:
          this.workspaceId,
      },
    });
  }
}