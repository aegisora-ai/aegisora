import type { WorkspaceId } from "../access";

export type ProviderId = string & {
  readonly __brand: "AegisoraProviderId";
};

export type ModelId = string & {
  readonly __brand: "AegisoraModelId";
};

export type ProviderStatus =
  | "active"
  | "disabled"
  | "degraded"
  | "deprecated";

export type ModelStatus =
  | "active"
  | "disabled"
  | "deprecated";

export type ProviderKind =
  | "openai"
  | "anthropic"
  | "gemini"
  | "groq"
  | "custom";

export type ModelCapability =
  | "chat"
  | "reasoning"
  | "vision"
  | "tool_use"
  | "structured_output"
  | "embeddings"
  | "streaming";

export interface ProviderDefinition {
  readonly id: ProviderId;
  readonly kind: ProviderKind;
  readonly name: string;
  readonly status: ProviderStatus;
  readonly endpoint?: string;
  readonly capabilities: readonly string[];
}

export interface ModelDefinition {
  readonly id: ModelId;
  readonly providerId: ProviderId;
  readonly modelName: string;
  readonly displayName: string;
  readonly status: ModelStatus;
  readonly capabilities: readonly ModelCapability[];
  readonly contextWindow?: number;
  readonly maxOutputTokens?: number;
}

export interface WorkspaceProviderBinding {
  readonly workspaceId: WorkspaceId;
  readonly providerId: ProviderId;
  readonly enabled: boolean;
  readonly credentialRef?: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface WorkspaceModelBinding {
  readonly workspaceId: WorkspaceId;
  readonly modelId: ModelId;
  readonly enabled: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RegisterProviderInput {
  readonly id: ProviderId;
  readonly kind: ProviderKind;
  readonly name: string;
  readonly status?: ProviderStatus;
  readonly endpoint?: string;
  readonly capabilities?: readonly string[];
}

export interface RegisterModelInput {
  readonly id: ModelId;
  readonly providerId: ProviderId;
  readonly modelName: string;
  readonly displayName: string;
  readonly status?: ModelStatus;
  readonly capabilities: readonly ModelCapability[];
  readonly contextWindow?: number;
  readonly maxOutputTokens?: number;
}

export interface ProviderDiscoveryQuery {
  readonly workspaceId: WorkspaceId;
  readonly status?: ProviderStatus;
  readonly kind?: ProviderKind;
  readonly search?: string;
}

export interface ModelDiscoveryQuery {
  readonly workspaceId: WorkspaceId;
  readonly providerId?: ProviderId;
  readonly status?: ModelStatus;
  readonly capability?: ModelCapability;
  readonly search?: string;
}

export function providerId(value: string): ProviderId {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error("providerId must not be empty");
  }

  if (normalized.length > 128) {
    throw new Error("providerId must not exceed 128 characters");
  }

  return normalized as ProviderId;
}

export function modelId(value: string): ModelId {
  const normalized = value.trim();

  if (!normalized) {
    throw new Error("modelId must not be empty");
  }

  if (normalized.length > 160) {
    throw new Error("modelId must not exceed 160 characters");
  }

  return normalized as ModelId;
}
