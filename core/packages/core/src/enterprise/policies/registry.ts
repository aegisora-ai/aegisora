import type {
  WorkspaceId,
} from "../access";

import {
  validatePolicyDocument,
} from "./validator";

import type {
  CreatePolicyInput,
  CreatePolicyVersionInput,
  PolicyBinding,
  PolicyDefinition,
  PolicyDocument,
  PolicyDiscoveryQuery,
  PolicyId,
  PolicyVersion,
  PolicyVersionDiscoveryQuery,
  PolicyVersionId,
} from "./types";

import {
  policyVersionId,
} from "./types";

function now(): string {
  return new Date().toISOString();
}

function cloneDocument(
  document: PolicyDocument,
): PolicyDocument {
  return structuredClone(document);
}

export interface PolicyRegistry {

  createPolicy(
    input: CreatePolicyInput,
  ): PolicyDefinition;

  createVersion(
    input: CreatePolicyVersionInput,
  ): PolicyVersion;

  validateVersion(
    workspaceId: WorkspaceId,
    versionId: PolicyVersionId,
  ): PolicyVersion;

  publishVersion(
    workspaceId: WorkspaceId,
    versionId: PolicyVersionId,
    publishedBy: string,
  ): PolicyVersion;

  rollback(
    workspaceId: WorkspaceId,
    policyId: PolicyId,
    versionId: PolicyVersionId,
    publishedBy: string,
  ): PolicyVersion;

  getPolicy(
    workspaceId: WorkspaceId,
    policyId: PolicyId,
  ): PolicyDefinition | null;

  getVersion(
    workspaceId: WorkspaceId,
    versionId: PolicyVersionId,
  ): PolicyVersion | null;

  listPolicies(
    query: PolicyDiscoveryQuery,
  ): readonly PolicyDefinition[];

  listVersions(
    query: PolicyVersionDiscoveryQuery,
  ): readonly PolicyVersion[];

  bindPolicy(
    binding: PolicyBinding,
  ): void;

  isPolicyEnabled(
    workspaceId: WorkspaceId,
    policyId: PolicyId,
  ): boolean;
}

export class InMemoryPolicyRegistry
  implements PolicyRegistry {

  private readonly policies =
    new Map<string, PolicyDefinition>();

  private readonly versions =
    new Map<string, PolicyVersion>();

  private readonly bindings =
    new Map<string, PolicyBinding>();

  private counters =
    new Map<string, number>();

  createPolicy(
    input: CreatePolicyInput,
  ): PolicyDefinition {

    if (this.policies.has(input.id)) {
      throw new Error(
        `Policy already exists: ${input.id}`,
      );
    }

    const timestamp = now();

    const policy: PolicyDefinition = {
      id: input.id,
      workspaceId: input.workspaceId,
      name: input.name,
      description: input.description,
      state: "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    this.policies.set(
      `${input.workspaceId}:${input.id}`,
      policy,
    );

    const version =
      this.createVersion({
        policyId: input.id,
        workspaceId: input.workspaceId,
        document: input.document,
      });

    this.policies.set(
      `${input.workspaceId}:${input.id}`,
      {
        ...policy,
        currentVersionId: version.id,
        updatedAt: timestamp,
      },
    );

    return this.policies.get(
      `${input.workspaceId}:${input.id}`,
    )!;
  }

  createVersion(
    input: CreatePolicyVersionInput,
  ): PolicyVersion {

    const policyKey =
      `${input.workspaceId}:${input.policyId}`;

    const policy =
      this.policies.get(policyKey);

    if (!policy) {
      throw new Error(
        `Policy not found: ${input.policyId}`,
      );
    }

    const current =
      this.counters.get(policyKey) ?? 0;

    const versionNumber =
      current + 1;

    this.counters.set(
      policyKey,
      versionNumber,
    );

    const id =
      policyVersionId(
        `${input.workspaceId}:${input.policyId}:v${versionNumber}`,
      );

    const validation =
      validatePolicyDocument(
        input.document,
      );

    const version: PolicyVersion = {
      id,
      policyId: input.policyId,
      workspaceId: input.workspaceId,
      version: versionNumber,
      document: cloneDocument(
        input.document,
      ),
      validation: validation.valid
        ? "valid"
        : "invalid",
      validationErrors: [
        ...validation.errors,
      ],
      createdAt: now(),
      immutable: true,
    };

    this.versions.set(
      `${input.workspaceId}:${id}`,
      version,
    );

    this.policies.set(
      policyKey,
      {
        ...policy,
        currentVersionId: id,
        updatedAt: now(),
      },
    );

    return version;
  }

  validateVersion(
    workspaceId: WorkspaceId,
    versionId: PolicyVersionId,
  ): PolicyVersion {

    const version =
      this.versions.get(
        `${workspaceId}:${versionId}`,
      );

    if (!version) {
      throw new Error(
        `Policy version not found: ${versionId}`,
      );
    }

    const validation =
      validatePolicyDocument(
        version.document,
      );

    const updated: PolicyVersion = {
      ...version,
      validation: validation.valid
        ? "valid"
        : "invalid",
      validationErrors: [
        ...validation.errors,
      ],
    };

    this.versions.set(
      `${workspaceId}:${versionId}`,
      updated,
    );

    return updated;
  }

  publishVersion(
    workspaceId: WorkspaceId,
    versionId: PolicyVersionId,
    publishedBy: string,
  ): PolicyVersion {

    const version =
      this.validateVersion(
        workspaceId,
        versionId,
      );

    if (version.validation !== "valid") {
      throw new Error(
        `Cannot publish invalid policy version: ${versionId}`,
      );
    }

    const timestamp = now();

    const published: PolicyVersion = {
      ...version,
      publishedAt: timestamp,
      publishedBy,
      immutable: true,
    };

    this.versions.set(
      `${workspaceId}:${versionId}`,
      published,
    );

    const policy =
      this.policies.get(
        `${workspaceId}:${version.policyId}`,
      );

    if (!policy) {
      throw new Error(
        `Policy not found: ${version.policyId}`,
      );
    }

    this.policies.set(
      `${workspaceId}:${version.policyId}`,
      {
        ...policy,
        state: "published",
        currentVersionId: versionId,
        updatedAt: timestamp,
      },
    );

    return published;
  }

  rollback(
    workspaceId: WorkspaceId,
    policyId: PolicyId,
    versionId: PolicyVersionId,
    publishedBy: string,
  ): PolicyVersion {

    const target =
      this.getVersion(
        workspaceId,
        versionId,
      );

    if (!target) {
      throw new Error(
        `Rollback target not found: ${versionId}`,
      );
    }

    if (target.policyId !== policyId) {
      throw new Error(
        "Rollback target belongs to another policy",
      );
    }

    if (target.validation !== "valid") {
      throw new Error(
        `Cannot rollback to invalid version: ${versionId}`,
      );
    }

    return this.publishVersion(
      workspaceId,
      versionId,
      publishedBy,
    );
  }

  getPolicy(
    workspaceId: WorkspaceId,
    policyId: PolicyId,
  ): PolicyDefinition | null {

    return this.policies.get(
      `${workspaceId}:${policyId}`,
    ) ?? null;
  }

  getVersion(
    workspaceId: WorkspaceId,
    versionId: PolicyVersionId,
  ): PolicyVersion | null {

    return this.versions.get(
      `${workspaceId}:${versionId}`,
    ) ?? null;
  }

  listPolicies(
    query: PolicyDiscoveryQuery,
  ): readonly PolicyDefinition[] {

    let result = [
      ...this.policies.values(),
    ].filter(
      (policy) =>
        policy.workspaceId ===
        query.workspaceId,
    );

    if (query.state) {
      result = result.filter(
        (policy) =>
          policy.state === query.state,
      );
    }

    if (query.search) {
      const term =
        query.search.toLowerCase();

      result = result.filter(
        (policy) =>
          policy.name
            .toLowerCase()
            .includes(term) ||
          policy.description
            ?.toLowerCase()
            .includes(term),
      );
    }

    return result;
  }

  listVersions(
    query: PolicyVersionDiscoveryQuery,
  ): readonly PolicyVersion[] {

    let result = [
      ...this.versions.values(),
    ].filter(
      (version) =>
        version.workspaceId ===
        query.workspaceId,
    );

    if (query.policyId) {
      result = result.filter(
        (version) =>
          version.policyId ===
          query.policyId,
      );
    }

    if (query.publishedOnly) {
      result = result.filter(
        (version) =>
          Boolean(version.publishedAt),
      );
    }

    return result;
  }

  bindPolicy(
    binding: PolicyBinding,
  ): void {

    const policy =
      this.getPolicy(
        binding.workspaceId,
        binding.policyId,
      );

    if (!policy) {
      throw new Error(
        `Policy not found: ${binding.policyId}`,
      );
    }

    if (
      binding.enabled &&
      policy.state !== "published"
    ) {
      throw new Error(
        "Only published policies can be enabled",
      );
    }

    this.bindings.set(
      `${binding.workspaceId}:${binding.policyId}`,
      binding,
    );
  }

  isPolicyEnabled(
    workspaceId: WorkspaceId,
    policyId: PolicyId,
  ): boolean {

    const policy =
      this.getPolicy(
        workspaceId,
        policyId,
      );

    if (!policy) {
      return false;
    }

    if (policy.state !== "published") {
      return false;
    }

    return (
      this.bindings.get(
        `${workspaceId}:${policyId}`,
      )?.enabled === true
    );
  }
}

