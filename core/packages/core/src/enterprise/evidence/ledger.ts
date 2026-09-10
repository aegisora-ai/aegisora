import type {
  CreateEnterpriseEvidenceInput,
  EnterpriseEvidenceRecord,
} from "./types";

import {
  EnterpriseEvidenceAccessDeniedError,
  EnterpriseEvidenceAlreadyExistsError,
  EnterpriseEvidenceInvalidError,
  EnterpriseEvidenceNotFoundError,
} from "./types";

function cloneMetadata(
  metadata: Readonly<Record<string, unknown>>,
): Readonly<Record<string, unknown>> {
  return Object.freeze({
    ...metadata,
  });
}

function validateInput(
  input: CreateEnterpriseEvidenceInput,
): void {

  if (!input.evidenceId.trim()) {
    throw new EnterpriseEvidenceInvalidError(
      "evidenceId is required.",
    );
  }

  if (!input.workspaceId.trim()) {
    throw new EnterpriseEvidenceInvalidError(
      "workspaceId is required.",
    );
  }

  if (!input.traceId.trim()) {
    throw new EnterpriseEvidenceInvalidError(
      "traceId is required.",
    );
  }

  if (!input.decisionId.trim()) {
    throw new EnterpriseEvidenceInvalidError(
      "decisionId is required.",
    );
  }

  if (!input.executionId.trim()) {
    throw new EnterpriseEvidenceInvalidError(
      "executionId is required.",
    );
  }

  if (!input.agentId.trim()) {
    throw new EnterpriseEvidenceInvalidError(
      "agentId is required.",
    );
  }

  if (
    !Number.isInteger(input.riskScore) ||
    input.riskScore < 0 ||
    input.riskScore > 100
  ) {
    throw new EnterpriseEvidenceInvalidError(
      "riskScore must be an integer between 0 and 100.",
    );
  }

  if (
    input.policyVersion !== undefined &&
    (
      !Number.isInteger(input.policyVersion) ||
      input.policyVersion < 1
    )
  ) {
    throw new EnterpriseEvidenceInvalidError(
      "policyVersion must be a positive integer.",
    );
  }

  if (!input.resourceType.trim()) {
    throw new EnterpriseEvidenceInvalidError(
      "resourceType is required.",
    );
  }

  if (!input.action.trim()) {
    throw new EnterpriseEvidenceInvalidError(
      "action is required.",
    );
  }

  if (!input.reason.trim()) {
    throw new EnterpriseEvidenceInvalidError(
      "reason is required.",
    );
  }

  const createdAt =
    new Date(input.createdAt ?? new Date().toISOString());

  if (Number.isNaN(createdAt.getTime())) {
    throw new EnterpriseEvidenceInvalidError(
      "createdAt must be a valid timestamp.",
    );
  }
}

export class EnterpriseEvidenceLedger {

  private readonly records =
    new Map<string, EnterpriseEvidenceRecord>();

  create(
    input: CreateEnterpriseEvidenceInput,
  ): EnterpriseEvidenceRecord {

    validateInput(input);

    if (this.records.has(input.evidenceId)) {
      throw new EnterpriseEvidenceAlreadyExistsError(
        input.evidenceId,
      );
    }

    const record: EnterpriseEvidenceRecord = {
      evidenceId:
        input.evidenceId,

      workspaceId:
        input.workspaceId,

      traceId:
        input.traceId,

      decisionId:
        input.decisionId,

      executionId:
        input.executionId,

      agentId:
        input.agentId,

      ...(input.approvalId !== undefined
        ? { approvalId: input.approvalId }
        : {}),

      ...(input.policyVersion !== undefined
        ? { policyVersion: input.policyVersion }
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
        input.createdAt ??
        new Date().toISOString(),

      metadata:
        cloneMetadata(
          input.metadata ?? {},
        ),
    };

    const frozen =
      Object.freeze(record);

    this.records.set(
      frozen.evidenceId,
      frozen,
    );

    return frozen;
  }

  get(
    evidenceId: string,
  ): EnterpriseEvidenceRecord {

    const record =
      this.records.get(evidenceId);

    if (!record) {
      throw new EnterpriseEvidenceNotFoundError(
        evidenceId,
      );
    }

    return record;
  }

  getForWorkspace(
    workspaceId: string,
    evidenceId: string,
  ): EnterpriseEvidenceRecord {

    if (!workspaceId.trim()) {
      throw new EnterpriseEvidenceAccessDeniedError(
        "workspaceId is required.",
      );
    }

    const record =
      this.get(evidenceId);

    if (
      record.workspaceId !== workspaceId
    ) {
      throw new EnterpriseEvidenceAccessDeniedError(
        "Evidence does not belong to requested workspace.",
      );
    }

    return record;
  }

  listForWorkspace(
    workspaceId: string,
  ): EnterpriseEvidenceRecord[] {

    if (!workspaceId.trim()) {
      throw new EnterpriseEvidenceAccessDeniedError(
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

  list(): EnterpriseEvidenceRecord[] {
    return Array.from(
      this.records.values(),
    );
  }
}
