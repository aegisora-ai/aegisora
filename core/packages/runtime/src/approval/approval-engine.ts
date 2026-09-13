import {
  createHash,
  randomUUID,
} from "node:crypto";

import type {
  ApprovalConsumeInput,
  ApprovalCreateInput,
  ApprovalDecisionInput,
  ApprovalRecord,
  ApprovalRequestBinding,
  ApprovalStatus,
  ApprovalStore,
} from "./approval";

export class MemoryApprovalStore
  implements ApprovalStore {

  private readonly records =
    new Map<string, ApprovalRecord>();

  create(
    record: ApprovalRecord,
  ): ApprovalRecord {

    if (
      this.records.has(
        record.approvalId,
      )
    ) {
      throw new Error(
        `Approval already exists: ${record.approvalId}`,
      );
    }

    this.records.set(
      record.approvalId,
      { ...record },
    );

    return {
      ...record,
    };
  }

  getById(
    approvalId: string,
  ): ApprovalRecord | undefined {

    const record =
      this.records.get(approvalId);

    return record
      ? { ...record }
      : undefined;
  }

  list(): ApprovalRecord[] {

    return Array.from(
      this.records.values(),
    ).map(
      (record) => ({ ...record }),
    );
  }

  update(
    approvalId: string,
    patch: Partial<ApprovalRecord>,
  ): ApprovalRecord {

    const current =
      this.records.get(approvalId);

    if (!current) {
      throw new Error(
        `Approval not found: ${approvalId}`,
      );
    }

    const next: ApprovalRecord = {
      ...current,
      ...patch,
    };

    this.records.set(
      approvalId,
      next,
    );

    return {
      ...next,
    };
  }

  delete(
    approvalId: string,
  ): void {

    this.records.delete(
      approvalId,
    );
  }
}

export class ApprovalEngine {

  constructor(
    private readonly store: ApprovalStore =
      new MemoryApprovalStore(),
  ) {}

  create(
    input: ApprovalCreateInput,
  ): ApprovalRecord {

    const now =
      new Date();

    const expiresAt =
      new Date(input.expiresAt);

    if (
      !Number.isFinite(
        expiresAt.getTime(),
      )
    ) {
      throw new Error(
        "Approval expiresAt must be a valid ISO timestamp",
      );
    }

    if (
      expiresAt.getTime() <=
      now.getTime()
    ) {
      throw new Error(
        "Approval expiresAt must be in the future",
      );
    }

    const requestHash =
      this.hashBinding({
        agentId:
          input.agentId,

        action:
          input.action,

        traceId:
          input.traceId,

        decisionId:
          input.decisionId,

        executionId:
          input.executionId,

        request:
          input.request,
      });

    const record: ApprovalRecord = {
      approvalId:
        randomUUID(),

      agentId:
        input.agentId,

      action:
        input.action,

      traceId:
        input.traceId,

      decisionId:
        input.decisionId,

      executionId:
        input.executionId,

      requestHash,

      decision:
        "ESCALATE",

      status:
        "pending",

      createdAt:
        now.toISOString(),

      expiresAt:
        expiresAt.toISOString(),
    };

    return this.store.create(
      record,
    );
  }

  get(
    approvalId: string,
  ): ApprovalRecord | undefined {

    const record =
      this.store.getById(
        approvalId,
      );

    if (!record) {
      return undefined;
    }

    return this.normalizeExpiry(
      record,
    );
  }

  list(): ApprovalRecord[] {

    return this.store
      .list()
      .map(
        (record) =>
          this.normalizeExpiry(record),
      );
  }

  approve(
    input: ApprovalDecisionInput,
  ): ApprovalRecord {

    const record =
      this.requireRecord(
        input.approvalId,
      );

    this.expireIfNeeded(
      record,
    );

    if (
      record.status !==
      "pending"
    ) {
      throw new Error(
        `Approval cannot be approved from status: ${record.status}`,
      );
    }

    return this.store.update(
      record.approvalId,
      {
        status:
          "approved",

        approvedAt:
          new Date().toISOString(),

        approvedBy:
          input.actorId,
      },
    );
  }

  reject(
    input: ApprovalDecisionInput & {
      reason?: string;
    },
  ): ApprovalRecord {

    const record =
      this.requireRecord(
        input.approvalId,
      );

    this.expireIfNeeded(
      record,
    );

    if (
      record.status !==
      "pending"
    ) {
      throw new Error(
        `Approval cannot be rejected from status: ${record.status}`,
      );
    }

    return this.store.update(
      record.approvalId,
      {
        status:
          "rejected",

        rejectedAt:
          new Date().toISOString(),

        rejectedBy:
          input.actorId,

        rejectionReason:
          input.reason,
      },
    );
  }

  expire(
    approvalId: string,
  ): ApprovalRecord {

    const record =
      this.requireRecord(
        approvalId,
      );

    if (
      record.status ===
      "consumed"
    ) {
      throw new Error(
        "Consumed approval cannot expire",
      );
    }

    if (
      record.status ===
      "rejected"
    ) {
      throw new Error(
        "Rejected approval cannot expire",
      );
    }

    if (
      record.status ===
      "expired"
    ) {
      return record;
    }

    return this.store.update(
      approvalId,
      {
        status:
          "expired",
      },
    );
  }

  validate(
    input: ApprovalConsumeInput,
  ): ApprovalRecord {

    const record =
      this.requireRecord(
        input.approvalId,
      );

    this.expireIfNeeded(
      record,
    );

    if (
      record.status !==
      "approved"
    ) {
      throw new Error(
        `Approval cannot be consumed from status: ${record.status}`,
      );
    }

    if (
      record.agentId !==
      input.agentId
    ) {
      throw new Error(
        "Approval agent binding mismatch",
      );
    }

    if (
      record.action !==
      input.action
    ) {
      throw new Error(
        "Approval action binding mismatch",
      );
    }

    if (
      record.traceId !==
      input.traceId
    ) {
      throw new Error(
        "Approval trace binding mismatch",
      );
    }

    if (
      record.decisionId !==
      input.decisionId
    ) {
      throw new Error(
        "Approval decision binding mismatch",
      );
    }

    if (
      record.executionId !==
      input.executionId
    ) {
      throw new Error(
        "Approval execution binding mismatch",
      );
    }

    const actualHash =
      this.hashBinding({
        agentId:
          input.agentId,

        action:
          input.action,

        traceId:
          input.traceId,

        decisionId:
          input.decisionId,

        executionId:
          input.executionId,

        request:
          input.request,
      });

    if (
      actualHash !==
      record.requestHash
    ) {
      throw new Error(
        "Approval request binding mismatch",
      );
    }

    return {
      ...record,
    };
  }
  consume(
    input: ApprovalConsumeInput,
  ): ApprovalRecord {

    const record =
      this.validate(
        input,
      );

    return this.store.update(
      record.approvalId,
      {
        status:
          "consumed",

        consumedAt:
          new Date().toISOString(),
      },
    );
  }
  private requireRecord(
    approvalId: string,
  ): ApprovalRecord {

    const record =
      this.store.getById(
        approvalId,
      );

    if (!record) {
      throw new Error(
        `Approval not found: ${approvalId}`,
      );
    }

    return record;
  }

  private expireIfNeeded(
    record: ApprovalRecord,
  ): void {

    if (
      record.status ===
      "pending" ||
      record.status ===
      "approved"
    ) {

      const expiresAt =
        new Date(
          record.expiresAt,
        ).getTime();

      if (
        Date.now() >=
        expiresAt
      ) {

        this.store.update(
          record.approvalId,
          {
            status:
              "expired",
          },
        );

        record.status =
          "expired";
      }
    }
  }

  private normalizeExpiry(
    record: ApprovalRecord,
  ): ApprovalRecord {

    const copy = {
      ...record,
    };

    this.expireIfNeeded(
      copy,
    );

    const latest =
      this.store.getById(
        record.approvalId,
      );

    return latest
      ? { ...latest }
      : copy;
  }

  private hashBinding(
    binding: ApprovalRequestBinding,
  ): string {

    const canonical =
      JSON.stringify(
        this.canonicalize(
          binding,
        ),
      );

    return createHash(
      "sha256",
    )
      .update(canonical)
      .digest("hex");
  }

  private canonicalize(
    value: unknown,
  ): unknown {
    if (value === undefined) {
      return ["undefined"];
    }

    if (value === null) {
      return ["null"];
    }

    if (typeof value === "boolean") {
      return ["boolean", value];
    }

    if (typeof value === "string") {
      return ["string", value];
    }

    if (typeof value === "number") {
      if (Number.isNaN(value)) {
        return ["number", "NaN"];
      }

      if (value === Number.POSITIVE_INFINITY) {
        return ["number", "Infinity"];
      }

      if (value === Number.NEGATIVE_INFINITY) {
        return ["number", "-Infinity"];
      }

      if (Object.is(value, -0)) {
        return ["number", "-0"];
      }

      return ["number", value];
    }

    if (
      typeof value === "bigint" ||
      typeof value === "symbol" ||
      typeof value === "function"
    ) {
      throw new Error(
        "Approval binding contains an unsupported value type",
      );
    }

    if (Array.isArray(value)) {
      return [
        "array",
        value.map(
          (item) =>
            this.canonicalize(item),
        ),
      ];
    }

    if (typeof value === "object") {
      const object =
        value as Record<
          string,
          unknown
        >;

      return [
        "object",
        Object.keys(object)
          .sort()
          .map(
            (key) => [
              key,
              this.canonicalize(
                object[key],
              ),
            ],
          ),
      ];
    }

    throw new Error(
      "Approval binding contains an unsupported value type",
    );
  }
}
