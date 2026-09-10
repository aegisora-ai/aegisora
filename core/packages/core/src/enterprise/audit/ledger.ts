import type {
  CreateEnterpriseAuditInput,
  EnterpriseAuditRecord,
} from "./types";

import {
  EnterpriseAuditAccessDeniedError,
  EnterpriseAuditAlreadyExistsError,
  EnterpriseAuditInvalidError,
  EnterpriseAuditNotFoundError,
} from "./types";

function cloneMetadata(
  metadata: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    ...metadata,
  });
}

function validateInput(
  input: CreateEnterpriseAuditInput,
): void {
  const required = [
    ["auditId", input.auditId],
    ["workspaceId", input.workspaceId],
    ["traceId", input.traceId],
    ["decisionId", input.decisionId],
    ["executionId", input.executionId],
    ["evidenceId", input.evidenceId],
    ["agentId", input.agentId],
    ["action", input.action],
    ["resourceType", input.resourceType],
    ["resource", input.resource],
    ["reason", input.reason],
  ] as const;

  for (const [name, value] of required) {
    if (!value.trim()) {
      throw new EnterpriseAuditInvalidError(
        `${name} is required.`,
      );
    }
  }

  if (
    !Number.isInteger(input.riskScore) ||
    input.riskScore < 0 ||
    input.riskScore > 100
  ) {
    throw new EnterpriseAuditInvalidError(
      "riskScore must be an integer between 0 and 100.",
    );
  }

  const createdAt = new Date(
    input.createdAt ??
      new Date().toISOString(),
  );

  if (Number.isNaN(createdAt.getTime())) {
    throw new EnterpriseAuditInvalidError(
      "createdAt must be a valid timestamp.",
    );
  }
}

export class EnterpriseAuditLedger {
  private readonly records =
    new Map<string, EnterpriseAuditRecord>();

  create(
    input: CreateEnterpriseAuditInput,
  ): EnterpriseAuditRecord {
    validateInput(input);

    if (this.records.has(input.auditId)) {
      throw new EnterpriseAuditAlreadyExistsError(
        input.auditId,
      );
    }

    const record: EnterpriseAuditRecord = {
      auditId: input.auditId,
      workspaceId: input.workspaceId,

      traceId: input.traceId,
      decisionId: input.decisionId,
      executionId: input.executionId,
      evidenceId: input.evidenceId,

      agentId: input.agentId,

      ...(input.actorId !== undefined
        ? { actorId: input.actorId }
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
        input.createdAt ??
        new Date().toISOString(),

      metadata: cloneMetadata(
        input.metadata ?? {},
      ),
    };

    const frozen =
      Object.freeze(record);

    this.records.set(
      frozen.auditId,
      frozen,
    );

    return frozen;
  }

  get(
    auditId: string,
  ): EnterpriseAuditRecord {
    const record =
      this.records.get(auditId);

    if (!record) {
      throw new EnterpriseAuditNotFoundError(
        auditId,
      );
    }

    return record;
  }

  getForWorkspace(
    workspaceId: string,
    auditId: string,
  ): EnterpriseAuditRecord {
    if (!workspaceId.trim()) {
      throw new EnterpriseAuditAccessDeniedError(
        "workspaceId is required.",
      );
    }

    const record = this.get(auditId);

    if (
      record.workspaceId !== workspaceId
    ) {
      throw new EnterpriseAuditAccessDeniedError(
        "Audit record does not belong to requested workspace.",
      );
    }

    return record;
  }

  listForWorkspace(
    workspaceId: string,
  ): EnterpriseAuditRecord[] {
    if (!workspaceId.trim()) {
      throw new EnterpriseAuditAccessDeniedError(
        "workspaceId is required.",
      );
    }

    return Array.from(
      this.records.values(),
    ).filter(
      (record) =>
        record.workspaceId === workspaceId,
    );
  }

  list(): EnterpriseAuditRecord[] {
    return Array.from(
      this.records.values(),
    );
  }
}