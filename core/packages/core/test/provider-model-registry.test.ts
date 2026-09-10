import assert from "node:assert/strict";
import test from "node:test";

import {
  discoverModels,
  discoverProviders,
  InMemoryProviderModelRegistry,
  modelId,
  providerId,
} from "../src/enterprise/providers";

function makeRegistry() {

  const registry =
    new InMemoryProviderModelRegistry();

  registry.registerProvider({
    id: providerId("openai"),
    kind: "openai",
    name: "OpenAI",
    capabilities: [
      "chat",
      "reasoning",
      "tool_use",
      "vision",
    ],
  });

  registry.registerProvider({
    id: providerId("anthropic"),
    kind: "anthropic",
    name: "Anthropic",
    capabilities: [
      "chat",
      "reasoning",
      "tool_use",
    ],
  });

  registry.registerProvider({
    id: providerId("gemini"),
    kind: "gemini",
    name: "Google Gemini",
    capabilities: [
      "chat",
      "reasoning",
      "vision",
    ],
  });

  registry.registerModel({
    id: modelId("openai-gpt-5"),
    providerId: providerId("openai"),
    modelName: "gpt-5",
    displayName: "GPT-5",
    capabilities: [
      "chat",
      "reasoning",
      "tool_use",
      "vision",
    ],
  });

  registry.registerModel({
    id: modelId("anthropic-sonnet"),
    providerId: providerId("anthropic"),
    modelName: "claude-sonnet",
    displayName: "Claude Sonnet",
    capabilities: [
      "chat",
      "reasoning",
      "tool_use",
    ],
  });

  return registry;
}

test("provider id rejects empty", () => {
  assert.throws(
    () => providerId("   "),
  );
});

test("model id rejects empty", () => {
  assert.throws(
    () => modelId(""),
  );
});

test("model cannot be registered without provider", () => {

  const registry =
    new InMemoryProviderModelRegistry();

  assert.throws(
    () =>
      registry.registerModel({
        id: modelId("orphan"),
        providerId: providerId("missing"),
        modelName: "orphan",
        displayName: "Orphan",
        capabilities: ["chat"],
      }),
  );
});

test("provider registration works", () => {

  const registry =
    new InMemoryProviderModelRegistry();

  const provider =
    registry.registerProvider({
      id: providerId("openai"),
      kind: "openai",
      name: "OpenAI",
    });

  assert.equal(
    provider.id,
    providerId("openai"),
  );

  assert.equal(
    provider.status,
    "active",
  );
});

test("workspace must explicitly enable provider", () => {

  const registry = makeRegistry();

  assert.equal(
    registry.isProviderEnabled(
      "workspace-1",
      providerId("openai"),
    ),
    false,
  );
});

test("enabled provider is visible only in its workspace", () => {

  const registry = makeRegistry();

  registry.bindProvider({
    workspaceId: "workspace-1" as never,
    providerId: providerId("openai"),
    enabled: true,
    credentialRef: "secret://workspace-1/openai",
    createdAt: "2026-09-04T00:00:00Z",
    updatedAt: "2026-09-04T00:00:00Z",
  });

  assert.equal(
    registry.isProviderEnabled(
      "workspace-1",
      providerId("openai"),
    ),
    true,
  );

  assert.equal(
    registry.isProviderEnabled(
      "workspace-2",
      providerId("openai"),
    ),
    false,
  );
});

test("model cannot be enabled when provider is disabled", () => {

  const registry = makeRegistry();

  assert.throws(
    () =>
      registry.bindModel({
        workspaceId: "workspace-1" as never,
        modelId: modelId("openai-gpt-5"),
        enabled: true,
        createdAt: "2026-09-04T00:00:00Z",
        updatedAt: "2026-09-04T00:00:00Z",
      }),
  );
});

test("model requires enabled provider", () => {

  const registry = makeRegistry();

  registry.bindProvider({
    workspaceId: "workspace-1" as never,
    providerId: providerId("openai"),
    enabled: true,
    credentialRef: "secret://workspace-1/openai",
    createdAt: "2026-09-04T00:00:00Z",
    updatedAt: "2026-09-04T00:00:00Z",
  });

  registry.bindModel({
    workspaceId: "workspace-1" as never,
    modelId: modelId("openai-gpt-5"),
    enabled: true,
    createdAt: "2026-09-04T00:00:00Z",
    updatedAt: "2026-09-04T00:00:00Z",
  });

  assert.equal(
    registry.isModelEnabled(
      "workspace-1",
      modelId("openai-gpt-5"),
    ),
    true,
  );

  assert.equal(
    registry.isModelEnabled(
      "workspace-2",
      modelId("openai-gpt-5"),
    ),
    false,
  );
});

test("provider discovery is workspace scoped", () => {

  const registry = makeRegistry();

  registry.bindProvider({
    workspaceId: "workspace-a" as never,
    providerId: providerId("openai"),
    enabled: true,
    createdAt: "2026-09-04T00:00:00Z",
    updatedAt: "2026-09-04T00:00:00Z",
  });

  registry.bindProvider({
    workspaceId: "workspace-b" as never,
    providerId: providerId("anthropic"),
    enabled: true,
    createdAt: "2026-09-04T00:00:00Z",
    updatedAt: "2026-09-04T00:00:00Z",
  });

  const a =
    discoverProviders(
      registry,
      {
        workspaceId: "workspace-a" as never,
      },
    );

  const b =
    discoverProviders(
      registry,
      {
        workspaceId: "workspace-b" as never,
      },
    );

  assert.deepEqual(
    a.map((x) => x.id),
    [providerId("openai")],
  );

  assert.deepEqual(
    b.map((x) => x.id),
    [providerId("anthropic")],
  );
});

test("model discovery can filter capability", () => {

  const registry = makeRegistry();

  registry.bindProvider({
    workspaceId: "workspace-1" as never,
    providerId: providerId("openai"),
    enabled: true,
    credentialRef: "secret://workspace-1/openai",
    createdAt: "2026-09-04T00:00:00Z",
    updatedAt: "2026-09-04T00:00:00Z",
  });

  registry.bindModel({
    workspaceId: "workspace-1" as never,
    modelId: modelId("openai-gpt-5"),
    enabled: true,
    createdAt: "2026-09-04T00:00:00Z",
    updatedAt: "2026-09-04T00:00:00Z",
  });

  const result =
    discoverModels(
      registry,
      {
        workspaceId: "workspace-1" as never,
        capability: "reasoning",
      },
    );

  assert.deepEqual(
    result.map((x) => x.id),
    [modelId("openai-gpt-5")],
  );
});

test("disabled provider never becomes discoverable", () => {

  const registry =
    new InMemoryProviderModelRegistry();

  registry.registerProvider({
    id: providerId("openai"),
    kind: "openai",
    name: "OpenAI",
    status: "disabled",
  });

  const result =
    discoverProviders(
      registry,
      {
        workspaceId: "workspace-1" as never,
      },
    );

  assert.equal(
    result.length,
    0,
  );
});

test("disabled model never becomes discoverable", () => {

  const registry =
    new InMemoryProviderModelRegistry();

  registry.registerProvider({
    id: providerId("openai"),
    kind: "openai",
    name: "OpenAI",
  });

  registry.registerModel({
    id: modelId("disabled-model"),
    providerId: providerId("openai"),
    modelName: "disabled",
    displayName: "Disabled",
    status: "disabled",
    capabilities: ["chat"],
  });

  registry.bindProvider({
    workspaceId: "workspace-1" as never,
    providerId: providerId("openai"),
    enabled: true,
    credentialRef: "secret://workspace-1/openai",
    createdAt: "2026-09-04T00:00:00Z",
    updatedAt: "2026-09-04T00:00:00Z",
  });

  registry.bindModel({
    workspaceId: "workspace-1" as never,
    modelId: modelId("disabled-model"),
    enabled: true,
    createdAt: "2026-09-04T00:00:00Z",
    updatedAt: "2026-09-04T00:00:00Z",
  });

  const result =
    discoverModels(
      registry,
      {
        workspaceId: "workspace-1" as never,
      },
    );

  assert.equal(
    result.length,
    0,
  );
});
