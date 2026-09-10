import assert from "node:assert/strict";
import test from "node:test";

import {
  agentId,
  discoverAgents,
  InMemoryAgentRegistry,
} from "../src/enterprise/agents";

function registerFixture(
  registry: InMemoryAgentRegistry,
  input: {
    id: string;
    workspaceId?: string;
    environment?: "production" | "staging" | "development" | "restricted";
    tags?: readonly string[];
    tools?: readonly string[];
    providers?: readonly string[];
  },
) {

  return registry.register({
    id: agentId(input.id),
    workspaceId: input.workspaceId ?? ("workspace-1" as import("../src/enterprise/access").WorkspaceId),
    metadata: {
      name: input.id,
      description: `${input.id} description`,
      environment: input.environment ?? "production",
      owner: {
        userId: "user-1",
      },
      tags: input.tags ?? [],
    },
    declaredTools: input.tools ?? [],
    declaredProviders: input.providers ?? [],
    createdAt: "2026-09-04T00:00:00.000Z",
  });
}

test("agent id rejects empty values", () => {
  assert.throws(() => agentId("   "));
});

test("agent id rejects oversized values", () => {
  assert.throws(() => agentId("a".repeat(129)));
});

test("agent registration creates active agent", () => {

  const registry = new InMemoryAgentRegistry();

  const agent = registerFixture(
    registry,
    {
      id: "support-agent",
      tools: ["search"],
      providers: ["openai"],
    },
  );

  assert.equal(agent.status, "active");
  assert.equal(agent.id, agentId("support-agent"));
  assert.deepEqual(
    agent.declaredTools,
    ["search"],
  );
});

test("agent registry is tenant scoped", () => {

  const registry = new InMemoryAgentRegistry();

  registerFixture(
    registry,
    {
      id: "shared-name",
      workspaceId: "workspace-1",
    },
  );

  registerFixture(
    registry,
    {
      id: "shared-name",
      workspaceId: "workspace-2",
    },
  );

  assert.equal(
    registry.list("workspace-1").length,
    1,
  );

  assert.equal(
    registry.list("workspace-2").length,
    1,
  );

  assert.equal(
    registry.getById(
      "workspace-1",
      agentId("shared-name"),
    )?.workspaceId,
    "workspace-1",
  );
});

test("agent heartbeat updates liveness", () => {

  const registry = new InMemoryAgentRegistry();

  registerFixture(
    registry,
    {
      id: "worker",
    },
  );

  const updated = registry.heartbeat({
    agentId: agentId("worker"),
    workspaceId: "workspace-1" as never,
    observedAt: "2026-09-04T01:00:00.000Z",
  });

  assert.equal(
    updated.lastSeenAt,
    "2026-09-04T01:00:00.000Z",
  );
});

test("suspended agent cannot heartbeat", () => {

  const registry = new InMemoryAgentRegistry();

  registerFixture(
    registry,
    {
      id: "suspended-worker",
    },
  );

  registry.suspend(
    "workspace-1",
    agentId("suspended-worker"),
  );

  assert.throws(
    () =>
      registry.heartbeat({
        agentId: agentId("suspended-worker"),
        workspaceId: "workspace-1" as never,
        observedAt: "2026-09-04T01:00:00.000Z",
      }),
  );
});

test("discovery filters by environment", () => {

  const registry = new InMemoryAgentRegistry();

  registerFixture(
    registry,
    {
      id: "prod-agent",
      environment: "production",
    },
  );

  registerFixture(
    registry,
    {
      id: "stage-agent",
      environment: "staging",
    },
  );

  const result = discoverAgents(
    registry,
    {
      workspaceId: "workspace-1" as never,
      environment: "production",
    },
  );

  assert.deepEqual(
    result.map((agent) => agent.id),
    ["prod-agent"],
  );
});

test("discovery filters by declared tool", () => {

  const registry = new InMemoryAgentRegistry();

  registerFixture(
    registry,
    {
      id: "search-agent",
      tools: ["search", "summarize"],
    },
  );

  registerFixture(
    registry,
    {
      id: "billing-agent",
      tools: ["billing"],
    },
  );

  const result = discoverAgents(
    registry,
    {
      workspaceId: "workspace-1" as never,
      tool: "search",
    },
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "search-agent" as never);
});

test("discovery filters by tag", () => {

  const registry = new InMemoryAgentRegistry();

  registerFixture(
    registry,
    {
      id: "critical-agent",
      tags: ["critical", "customer-facing"],
    },
  );

  registerFixture(
    registry,
    {
      id: "internal-agent",
      tags: ["internal"],
    },
  );

  const result = discoverAgents(
    registry,
    {
      workspaceId: "workspace-1" as never,
      tag: "critical",
    },
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "critical-agent" as never);
});

test("discovery search matches name and description", () => {

  const registry = new InMemoryAgentRegistry();

  registerFixture(
    registry,
    {
      id: "customer-support",
    },
  );

  registerFixture(
    registry,
    {
      id: "finance-agent",
    },
  );

  const result = discoverAgents(
    registry,
    {
      workspaceId: "workspace-1" as never,
      search: "customer",
    },
  );

  assert.equal(result.length, 1);
  assert.equal(result[0].id, "customer-support" as never);
});

test("deprecated agents remain queryable but are not active", () => {

  const registry = new InMemoryAgentRegistry();

  registerFixture(
    registry,
    {
      id: "legacy-agent",
    },
  );

  registry.deprecate(
    "workspace-1",
    agentId("legacy-agent"),
  );

  assert.equal(
    registry.getById(
      "workspace-1",
      agentId("legacy-agent"),
    )?.status,
    "deprecated",
  );

  const active = discoverAgents(
    registry,
    {
      workspaceId: "workspace-1" as never,
      status: "active",
    },
  );

  assert.equal(active.length, 0);
});

test("cross-tenant discovery cannot return another workspace agent", () => {

  const registry = new InMemoryAgentRegistry();

  registerFixture(
    registry,
    {
      id: "tenant-a-agent",
      workspaceId: "workspace-a",
    },
  );

  registerFixture(
    registry,
    {
      id: "tenant-b-agent",
      workspaceId: "workspace-b",
    },
  );

  const result = discoverAgents(
    registry,
    {
      workspaceId: "workspace-a" as never,
    },
  );

  assert.deepEqual(
    result.map((agent) => agent.id),
    ["tenant-a-agent"],
  );
});
