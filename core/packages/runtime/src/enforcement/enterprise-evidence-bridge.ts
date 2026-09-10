import type {
  CreateEnterpriseEvidenceInput,
  EnterpriseEvidenceRecord,
} from "@aegisora/core";

export interface EnterpriseEvidenceWriter {
  create(
    input: CreateEnterpriseEvidenceInput,
  ): EnterpriseEvidenceRecord;
}

export interface EnterpriseEvidenceRuntimeConfig {
  readonly workspaceId: string;
  readonly writer: EnterpriseEvidenceWriter;
}

export interface EnterpriseEvidenceRuntimeInput {
  readonly evidenceId: string;
  readonly traceId: string;
  readonly decisionId: string;
  readonly executionId: string;
  readonly agentId: string;
  readonly approvalId?: string;
  readonly policyVersion?: number;
  readonly riskScore: number;
  readonly finalDecision:
    | "ALLOW"
    | "BLOCK"
    | "ESCALATE";
  readonly enforcementStatus:
    | "not_executed"
    | "executed"
    | "prevented"
    | "escalated";
  readonly resourceType: string;
  readonly action: string;
  readonly tool?: string;
  readonly reason: string;
  readonly metadata?: Record<string, unknown>;
}

export class EnterpriseEvidenceRuntimeBridge {

  private readonly workspaceId: string;
  private readonly writer: EnterpriseEvidenceWriter;

  constructor(
    config: EnterpriseEvidenceRuntimeConfig,
  ) {
    if (!config.workspaceId.trim()) {
      throw new Error(
        "Enterprise evidence workspaceId is required.",
      );
    }

    this.workspaceId =
      config.workspaceId;

    this.writer =
      config.writer;
  }

  record(
    input: EnterpriseEvidenceRuntimeInput,
  ): EnterpriseEvidenceRecord {

    const metadata =
      input.metadata ?? {};

    const policyVersion =
      typeof metadata.policyVersion === "number"
        ? metadata.policyVersion
        : input.policyVersion;

    const approvalId =
      typeof metadata.approvalId === "string"
        ? metadata.approvalId
        : input.approvalId;

    return this.writer.create({
      evidenceId:
        input.evidenceId,

      workspaceId:
        this.workspaceId,

      traceId:
        input.traceId,

      decisionId:
        input.decisionId,

      executionId:
        input.executionId,

      agentId:
        input.agentId,

      ...(approvalId !== undefined
        ? { approvalId }
        : {}),

      ...(policyVersion !== undefined
        ? { policyVersion }
        : {}),

      riskScore:
        input.riskScore,

      finalDecision:
        input.finalDecision,

      enforcementStatus:
        input.enforcementStatus,

      resourceType:
        input.resourceType,

      action:
        input.action,

      ...(input.tool !== undefined
        ? { tool: input.tool }
        : {}),

      reason:
        input.reason,

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
