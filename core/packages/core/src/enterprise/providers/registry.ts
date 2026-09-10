import type {
  ModelDefinition,
  ModelId,
  ProviderDefinition,
  ProviderId,
  RegisterModelInput,
  RegisterProviderInput,
  WorkspaceModelBinding,
  WorkspaceProviderBinding,
} from "./types";

export interface ProviderModelRegistry {
  registerProvider(
    input: RegisterProviderInput,
  ): ProviderDefinition;

  registerModel(
    input: RegisterModelInput,
  ): ModelDefinition;

  getProvider(
    providerId: ProviderId,
  ): ProviderDefinition | null;

  getModel(
    modelId: ModelId,
  ): ModelDefinition | null;

  listProviders(): readonly ProviderDefinition[];

  listModels(
    providerId?: ProviderId,
  ): readonly ModelDefinition[];

  bindProvider(
    binding: WorkspaceProviderBinding,
  ): void;

  bindModel(
    binding: WorkspaceModelBinding,
  ): void;

  isProviderEnabled(
    workspaceId: string,
    providerId: ProviderId,
  ): boolean;

  isModelEnabled(
    workspaceId: string,
    modelId: ModelId,
  ): boolean;
}

export class InMemoryProviderModelRegistry
  implements ProviderModelRegistry {

  private readonly providers =
    new Map<string, ProviderDefinition>();

  private readonly models =
    new Map<string, ModelDefinition>();

  private readonly providerBindings =
    new Map<string, WorkspaceProviderBinding>();

  private readonly modelBindings =
    new Map<string, WorkspaceModelBinding>();

  registerProvider(
    input: RegisterProviderInput,
  ): ProviderDefinition {

    const current = this.providers.get(input.id);

    const provider: ProviderDefinition = {
      id: input.id,
      kind: input.kind,
      name: input.name,
      status: input.status ?? "active",
      endpoint: input.endpoint,
      capabilities: [
        ...(input.capabilities ?? []),
      ],
    };

    if (current) {
      const updated = {
        ...provider,
        capabilities: [
          ...(input.capabilities ?? current.capabilities),
        ],
      };

      this.providers.set(input.id, updated);

      return updated;
    }

    this.providers.set(input.id, provider);

    return provider;
  }

  registerModel(
    input: RegisterModelInput,
  ): ModelDefinition {

    if (!this.providers.has(input.providerId)) {
      throw new Error(
        `Cannot register model ${input.id}: provider ${input.providerId} is not registered.`,
      );
    }

    const model: ModelDefinition = {
      id: input.id,
      providerId: input.providerId,
      modelName: input.modelName,
      displayName: input.displayName,
      status: input.status ?? "active",
      capabilities: [
        ...input.capabilities,
      ],
      contextWindow: input.contextWindow,
      maxOutputTokens: input.maxOutputTokens,
    };

    this.models.set(input.id, model);

    return model;
  }

  getProvider(
    id: ProviderId,
  ): ProviderDefinition | null {

    return this.providers.get(id) ?? null;
  }

  getModel(
    id: ModelId,
  ): ModelDefinition | null {

    return this.models.get(id) ?? null;
  }

  listProviders(): readonly ProviderDefinition[] {
    return [...this.providers.values()];
  }

  listModels(
    providerId?: ProviderId,
  ): readonly ModelDefinition[] {

    const models = [
      ...this.models.values(),
    ];

    if (!providerId) {
      return models;
    }

    return models.filter(
      (model) =>
        model.providerId === providerId,
    );
  }

  bindProvider(
    binding: WorkspaceProviderBinding,
  ): void {

    if (!this.providers.has(binding.providerId)) {
      throw new Error(
        `Cannot bind unknown provider ${binding.providerId}.`,
      );
    }

    const key =
      `${binding.workspaceId}:${binding.providerId}`;

    this.providerBindings.set(
      key,
      binding,
    );
  }

  bindModel(
    binding: WorkspaceModelBinding,
  ): void {

    const model = this.models.get(binding.modelId);

    if (!model) {
      throw new Error(
        `Cannot bind unknown model ${binding.modelId}.`,
      );
    }

    const providerEnabled =
      this.isProviderEnabled(
        binding.workspaceId,
        model.providerId,
      );

    if (!providerEnabled) {
      throw new Error(
        `Cannot bind model ${binding.modelId}: provider ${model.providerId} is not enabled for workspace ${binding.workspaceId}.`,
      );
    }

    const key =
      `${binding.workspaceId}:${binding.modelId}`;

    this.modelBindings.set(
      key,
      binding,
    );
  }

  isProviderEnabled(
    workspaceId: string,
    providerId: ProviderId,
  ): boolean {

    const provider =
      this.providers.get(providerId);

    if (!provider) {
      return false;
    }

    if (provider.status !== "active") {
      return false;
    }

    return (
      this.providerBindings.get(
        `${workspaceId}:${providerId}`,
      )?.enabled === true
    );
  }

  isModelEnabled(
    workspaceId: string,
    modelId: ModelId,
  ): boolean {

    const model =
      this.models.get(modelId);

    if (!model) {
      return false;
    }

    if (model.status !== "active") {
      return false;
    }

    if (
      !this.isProviderEnabled(
        workspaceId,
        model.providerId,
      )
    ) {
      return false;
    }

    return (
      this.modelBindings.get(
        `${workspaceId}:${modelId}`,
      )?.enabled === true
    );
  }
}
