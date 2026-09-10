import type { WorkspaceId } from "../access";

export type PolicyId = string & {
  readonly __brand: "AegisoraPolicyId";
};

export type PolicyVersionId = string & {
  readonly __brand: "AegisoraPolicyVersionId";
};

export type PolicyState =
  | "draft"
  | "published"
  | "archived";

export type PolicyValidationState =
  | "not_validated"
  | "valid"
  | "invalid";

export type PolicyDecisionEffect =
  | "allow"
  | "block"
  | "escalate";

export interface PolicyRule {
  readonly id: string;
  readonly effect: PolicyDecisionEffect;
  readonly action: string;
  readonly conditions: Readonly<Record<string, unknown>>;
  readonly priority: number;
}

export interface PolicyDocument {
  readonly version: 1;
  readonly rules: readonly PolicyRule[];
  readonly defaultEffect: PolicyDecisionEffect;
}

export interface PolicyDefinition {
  readonly id: PolicyId;
  readonly workspaceId: WorkspaceId;
  readonly name: string;
  readonly description?: string;
  readonly state: PolicyState;
  readonly currentVersionId?: PolicyVersionId;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PolicyVersion {
  readonly id: PolicyVersionId;
  readonly policyId: PolicyId;
  readonly workspaceId: WorkspaceId;
  readonly version: number;
  readonly document: PolicyDocument;
  readonly validation: PolicyValidationState;
  readonly validationErrors: readonly string[];
  readonly createdAt: string;
  readonly publishedAt?: string;
  readonly publishedBy?: string;
  readonly immutable: true;
}

export interface CreatePolicyInput {
  readonly id: PolicyId;
  readonly workspaceId: WorkspaceId;
  readonly name: string;
  readonly description?: string;
  readonly document: PolicyDocument;
}

export interface CreatePolicyVersionInput {
  readonly policyId: PolicyId;
  readonly workspaceId: WorkspaceId;
  readonly document: PolicyDocument;
}

export interface PolicyBinding {
  readonly workspaceId: WorkspaceId;
  readonly policyId: PolicyId;
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface PolicyDiscoveryQuery {
  readonly workspaceId: WorkspaceId;
  readonly state?: PolicyState;
  readonly search?: string;
}

export interface PolicyVersionDiscoveryQuery {
  readonly workspaceId: WorkspaceId;
  readonly policyId?: PolicyId;
  readonly publishedOnly?: boolean;
}

export function policyId(value: string): PolicyId {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error("policyId must not be empty");
  }

  if (normalized.length > 128) {
    throw new Error("policyId must not exceed 128 characters");
  }

  return normalized as PolicyId;
}

export function policyVersionId(value: string): PolicyVersionId {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error("policyVersionId must not be empty");
  }

  return normalized as PolicyVersionId;
}
