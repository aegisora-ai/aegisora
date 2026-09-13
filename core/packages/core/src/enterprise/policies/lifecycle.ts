import type {
  WorkspaceId,
} from "../access";

import type {
  PolicyId,
  PolicyVersion,
  PolicyVersionId,
} from "./types";

import type {
  PolicyRegistry,
} from "./registry";

export type PolicyLifecycleState =
  | "draft"
  | "in_review"
  | "approved"
  | "published";

export interface PolicyLifecycleRecord {
  readonly workspaceId: WorkspaceId;
  readonly policyId: PolicyId;
  readonly state: PolicyLifecycleState;
  readonly versionId: PolicyVersionId;

  readonly submittedAt?: string;
  readonly submittedBy?: string;

  readonly approvedAt?: string;
  readonly approvedBy?: string;

  readonly publishedAt?: string;
  readonly publishedBy?: string;
}

function timestamp(): string {
  return new Date().toISOString();
}

export class PolicyLifecycleEngine {

  private readonly records =
    new Map<string, PolicyLifecycleRecord>();

  constructor(
    private readonly registry: PolicyRegistry,
  ) {}

  getState(
    workspaceId: WorkspaceId,
    policyId: PolicyId,
  ): PolicyLifecycleRecord {

    const policy =
      this.registry.getPolicy(
        workspaceId,
        policyId,
      );

    if (!policy) {
      throw new Error(
        `Policy not found: ${policyId}`,
      );
    }

    const key =
      `${workspaceId}:${policyId}`;

    const existing =
      this.records.get(key);

    if (existing) {

      if (
        policy.currentVersionId &&
        policy.currentVersionId !== existing.versionId
      ) {
        const refreshed: PolicyLifecycleRecord = {
          workspaceId,
          policyId,
          state: "draft",
          versionId: policy.currentVersionId,
        };

        this.records.set(
          key,
          refreshed,
        );

        return refreshed;
      }

      return existing;
    }

    if (!policy.currentVersionId) {
      throw new Error(
        `Policy has no current version: ${policyId}`,
      );
    }

    const initial: PolicyLifecycleRecord = {
      workspaceId,
      policyId,
      state:
        policy.state === "published"
          ? "published"
          : "draft",
      versionId: policy.currentVersionId,
    };

    this.records.set(
      key,
      initial,
    );

    return initial;
  }

  submitForReview(
    workspaceId: WorkspaceId,
    policyId: PolicyId,
    submittedBy: string,
    versionId?: PolicyVersionId,
  ): PolicyLifecycleRecord {

    const current =
      this.getState(
        workspaceId,
        policyId,
      );

    if (
      current.state !== "draft"
    ) {
      throw new Error(
        `Policy must be in draft before review submission; current state is ${current.state}.`,
      );
    }

    const policy =
      this.registry.getPolicy(
        workspaceId,
        policyId,
      );

    if (!policy) {
      throw new Error(
        `Policy not found: ${policyId}`,
      );
    }

    const selectedVersionId =
      versionId ??
      policy.currentVersionId;

    if (!selectedVersionId) {
      throw new Error(
        `Policy has no version available for review: ${policyId}`,
      );
    }

    const version =
      this.requireVersion(
        workspaceId,
        selectedVersionId,
      );

    if (
      version.policyId !== policyId
    ) {
      throw new Error(
        `Review version ${selectedVersionId} belongs to another policy.`,
      );
    }

    const submittedAt =
      timestamp();

    const next: PolicyLifecycleRecord = {
      workspaceId,
      policyId,
      state: "in_review",
      versionId: selectedVersionId,
      submittedAt,
      submittedBy,
    };

    this.records.set(
      `${workspaceId}:${policyId}`,
      next,
    );

    return next;
  }

  approve(
    workspaceId: WorkspaceId,
    policyId: PolicyId,
    approvedBy: string,
  ): PolicyLifecycleRecord {

    const current =
      this.getState(
        workspaceId,
        policyId,
      );

    if (
      current.state !== "in_review"
    ) {
      throw new Error(
        `Policy must be in_review before approval; current state is ${current.state}.`,
      );
    }

    const version =
      this.requireVersion(
        workspaceId,
        current.versionId,
      );

    if (
      version.policyId !== policyId
    ) {
      throw new Error(
        `Policy version ${current.versionId} belongs to another policy.`,
      );
    }

    if (
      version.validation !== "valid"
    ) {
      throw new Error(
        `Policy version must be valid before approval: ${current.versionId}`,
      );
    }

    const approvedAt =
      timestamp();

    const next: PolicyLifecycleRecord = {
      ...current,
      state: "approved",
      approvedAt,
      approvedBy,
    };

    this.records.set(
      `${workspaceId}:${policyId}`,
      next,
    );

    return next;
  }

  publish(
    workspaceId: WorkspaceId,
    policyId: PolicyId,
    publishedBy: string,
  ): PolicyLifecycleRecord {

    const current =
      this.getState(
        workspaceId,
        policyId,
      );

    if (
      current.state !== "approved"
    ) {
      throw new Error(
        `Policy must be approved before publishing; current state is ${current.state}.`,
      );
    }

    const version =
      this.requireVersion(
        workspaceId,
        current.versionId,
      );

    if (
      version.policyId !== policyId
    ) {
      throw new Error(
        `Policy version ${current.versionId} belongs to another policy.`,
      );
    }

    if (
      version.validation !== "valid"
    ) {
      throw new Error(
        `Policy version must be valid before publishing: ${current.versionId}`,
      );
    }

    this.registry.publishVersion(
      workspaceId,
      current.versionId,
      publishedBy,
    );

    const publishedAt =
      timestamp();

    const next: PolicyLifecycleRecord = {
      ...current,
      state: "published",
      publishedAt,
      publishedBy,
    };

    this.records.set(
      `${workspaceId}:${policyId}`,
      next,
    );

    return next;
  }

  rollback(
    workspaceId: WorkspaceId,
    policyId: PolicyId,
    targetVersionId: PolicyVersionId,
    publishedBy: string,
  ): PolicyLifecycleRecord {

    const current =
      this.getState(
        workspaceId,
        policyId,
      );

    if (
      current.state !== "published"
    ) {
      throw new Error(
        `Policy must be published before rollback; current state is ${current.state}.`,
      );
    }

    const target =
      this.requireVersion(
        workspaceId,
        targetVersionId,
      );

    if (
      target.policyId !== policyId
    ) {
      throw new Error(
        "Rollback target belongs to another policy",
      );
    }

    if (
      target.validation !== "valid"
    ) {
      throw new Error(
        `Cannot rollback to invalid version: ${targetVersionId}`,
      );
    }

    const rolledBack =
      this.registry.rollback(
        workspaceId,
        policyId,
        targetVersionId,
        publishedBy,
      );

    const publishedAt =
      timestamp();

    const next: PolicyLifecycleRecord = {
      ...current,
      state: "published",
      versionId: rolledBack.id,
      publishedAt,
      publishedBy,
    };

    this.records.set(
      `${workspaceId}:${policyId}`,
      next,
    );

    return next;
  }

  private requireVersion(
    workspaceId: WorkspaceId,
    versionId: PolicyVersionId,
  ): PolicyVersion {

    const version =
      this.registry.getVersion(
        workspaceId,
        versionId,
      );

    if (!version) {
      throw new Error(
        `Policy version not found: ${versionId}`,
      );
    }

    return version;
  }
}
