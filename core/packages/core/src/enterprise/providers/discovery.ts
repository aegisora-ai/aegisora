import type {
  ModelDiscoveryQuery,
  ModelDefinition,
  ProviderDiscoveryQuery,
  ProviderDefinition,
} from "./types";

import type {
  ProviderModelRegistry,
} from "./registry";

export function discoverProviders(
  registry: ProviderModelRegistry,
  query: ProviderDiscoveryQuery,
): readonly ProviderDefinition[] {

  let providers =
    registry.listProviders();

  if (query.status) {
    providers = providers.filter(
      (provider) =>
        provider.status === query.status,
    );
  }

  if (query.kind) {
    providers = providers.filter(
      (provider) =>
        provider.kind === query.kind,
    );
  }

  if (query.search) {

    const search =
      query.search.toLowerCase();

    providers = providers.filter(
      (provider) => {

        const haystack = [
          provider.id,
          provider.name,
          provider.kind,
          ...provider.capabilities,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      },
    );
  }

  return providers.filter(
    (provider) =>
      registry.isProviderEnabled(
        query.workspaceId,
        provider.id,
      ),
  );
}

export function discoverModels(
  registry: ProviderModelRegistry,
  query: ModelDiscoveryQuery,
): readonly ModelDefinition[] {

  let models =
    registry.listModels(
      query.providerId,
    );

  if (query.status) {
    models = models.filter(
      (model) =>
        model.status === query.status,
    );
  }

  if (query.capability) {
    models = models.filter(
      (model) =>
        model.capabilities.includes(
          query.capability!,
        ),
    );
  }

  if (query.search) {

    const search =
      query.search.toLowerCase();

    models = models.filter(
      (model) => {

        const haystack = [
          model.id,
          model.modelName,
          model.displayName,
          model.providerId,
          ...model.capabilities,
        ]
          .join(" ")
          .toLowerCase();

        return haystack.includes(search);
      },
    );
  }

  return models.filter(
    (model) =>
      registry.isModelEnabled(
        query.workspaceId,
        model.id,
      ),
  );
}
