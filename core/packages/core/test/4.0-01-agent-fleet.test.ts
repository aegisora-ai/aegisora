import assert from "node:assert/strict";
import test from "node:test";

import {
  AgentFleetEngine,
  InMemoryAgentRegistry,
  agentId,
  discoverAgents,
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
    ownerId?: string;
  },
) {
  return registry.register({
    id: agentId(input.id),
    workspaceId: (input.workspaceId ?? "workspace-1") as import("../src/enterprise/access").WorkspaceId,
    metadata: {
      name: input.id,
      description: `${input.id} description`,
      environment: input.environment ?? "production",
      owner: {
        userId: input.ownerId ?? "user-1",
      },
      tags: input.tags ?? [],
    },
    declaredTools: input.tools ?? [],
    declaredProviders: input.providers ?? [],
    createdAt: "2026-09-04T00:00:00.000Z",
  });
}

test("4.0-01 baseline: enterprise agent registry remains tenant scoped", () => {
  const registry = new InMemoryAgentRegistry();

  registerFixture(registry, {
    id: "agent-a",
    workspaceId: "workspace-a",
  });

  registerFixture(registry, {
    id: "agent-b",
    workspaceId: "workspace-b",
  });

  assert.deepEqual(
    registry.list("workspace-a").map((agent) => agent.id),
    [agentId("agent-a")],
  );

  assert.deepEqual(
    registry.list("workspace-b").map((agent) => agent.id),
    [agentId("agent-b")],
  );
});

test("4.0-01 baseline: discovery remains workspace scoped", () => {
  const registry = new InMemoryAgentRegistry();

  registerFixture(registry, {
    id: "production-a",
    workspaceId: "workspace-a",
    environment: "production",
    tags: ["critical"],
    tools: ["search"],
    providers: ["openai"],
  });

  registerFixture(registry, {
    id: "production-b",
    workspaceId: "workspace-b",
    environment: "production",
    tags: ["critical"],
    tools: ["search"],
    providers: ["openai"],
  });

  const result = discoverAgents(registry, {
    workspaceId: "workspace-a" as import("../src/enterprise/access").WorkspaceId,
    environment: "production",
    tag: "critical",
    tool: "search",
    provider: "openai",
  });

  assert.deepEqual(
    result.map((agent) => agent.id),
    [agentId("production-a")],
  );
});

test("4.0-01 baseline: lifecycle states remain queryable", () => {
  const registry = new InMemoryAgentRegistry();

  registerFixture(registry, {
    id: "worker",
  });

  registry.suspend(
    "workspace-1",
    agentId("worker"),
    "2026-09-04T02:00:00.000Z",
  );

  assert.equal(
    registry.getById(
      "workspace-1",
      agentId("worker"),
    )?.status,
    "suspended",
  );
});

test("4.0-01 baseline: heartbeat remains canonical liveness signal", () => {
  const registry = new InMemoryAgentRegistry();

  registerFixture(registry, {
    id: "heartbeat-worker",
  });

  const updated = registry.heartbeat({
    agentId: agentId("heartbeat-worker"),
    workspaceId: "workspace-1" as import("../src/enterprise/access").WorkspaceId,
    observedAt: "2026-09-04T03:00:00.000Z",
  });

  assert.equal(
    updated.lastSeenAt,
    "2026-09-04T03:00:00.000Z",
  );
});

test("4.0-01 fleet list supports enterprise filtering", () => {
  const registry = new InMemoryAgentRegistry();

  registerFixture(registry, {
    id: "support-prod",
    environment: "production",
    tags: ["customer-facing"],
    providers: ["openai"],
    tools: ["search"],
    ownerId: "owner-a",
  });

  registerFixture(registry, {
    id: "billing-prod",
    environment: "production",
    tags: ["finance"],
    providers: ["anthropic"],
    tools: ["billing"],
    ownerId: "owner-b",
  });

  registerFixture(registry, {
    id: "support-stage",
    environment: "staging",
    tags: ["customer-facing"],
    providers: ["openai"],
    tools: ["search"],
    ownerId: "owner-a",
  });

  const fleet = new AgentFleetEngine(registry);

  const result = fleet.list({
    workspaceId: "workspace-1" as import("../src/enterprise/access").WorkspaceId,
    environment: "production",
    ownerId: "owner-a",
    provider: "openai",
    tool: "search",
    tag: "customer-facing",
  });

  assert.deepEqual(
    result.map((agent) => agent.id),
    [agentId("support-prod")],
  );
});

test("4.0-01 fleet summary aggregates lifecycle and environment posture", () => {
  const registry = new InMemoryAgentRegistry();

  registerFixture(registry, {
    id: "prod-a",
    environment: "production",
  });

  registerFixture(registry, {
    id: "prod-b",
    environment: "production",
  });

  registerFixture(registry, {
    id: "stage-a",
    environment: "staging",
  });

  registerFixture(registry, {
    id: "dev-a",
    environment: "development",
  });

  registerFixture(registry, {
    id: "restricted-a",
    environment: "restricted",
  });

  registry.suspend(
    "workspace-1",
    agentId("stage-a"),
    "2026-09-04T02:00:00.000Z",
  );

  const fleet = new AgentFleetEngine(registry);

  const summary = fleet.summarize(
    "workspace-1" as import("../src/enterprise/access").WorkspaceId,
    {
      now: "2026-09-04T03:00:00.000Z",
    },
  );

  assert.deepEqual(summary, {
    total: 5,

    active: 4,
    suspended: 1,
    deprecated: 0,
    unregistered: 0,

    production: 2,
    staging: 1,
    development: 1,
    restricted: 1,

    stale: 4,
    healthy: 0,
  });
});

test("4.0-01 fleet summary uses heartbeat freshness for active agents", () => {
  const registry = new InMemoryAgentRegistry();

  registerFixture(registry, {
    id: "fresh-agent",
  });

  registerFixture(registry, {
    id: "stale-agent",
  });

  registry.heartbeat({
    agentId: agentId("fresh-agent"),
    workspaceId: "workspace-1" as import("../src/enterprise/access").WorkspaceId,
    observedAt: "2026-09-04T04:59:00.000Z",
  });

  registry.heartbeat({
    agentId: agentId("stale-agent"),
    workspaceId: "workspace-1" as import("../src/enterprise/access").WorkspaceId,
    observedAt: "2026-09-04T04:00:00.000Z",
  });

  const fleet = new AgentFleetEngine(registry);

  const summary = fleet.summarize(
    "workspace-1" as import("../src/enterprise/access").WorkspaceId,
    {
      now: "2026-09-04T05:00:00.000Z",
      staleAfterMs: 30 * 60 * 1000,
    },
  );

  assert.equal(summary.total, 2);
  assert.equal(summary.active, 2);
  assert.equal(summary.stale, 1);
  assert.equal(summary.healthy, 1);
});

test("4.0-01 suspended agents are not counted as stale", () => {
  const registry = new InMemoryAgentRegistry();

  registerFixture(registry, {
    id: "suspended-agent",
  });

  registry.suspend(
    "workspace-1",
    agentId("suspended-agent"),
    "2026-09-04T01:00:00.000Z",
  );

  const fleet = new AgentFleetEngine(registry);

  const summary = fleet.summarize(
    "workspace-1" as import("../src/enterprise/access").WorkspaceId,
    {
      now: "2026-09-04T05:00:00.000Z",
      staleAfterMs: 1,
    },
  );

  assert.equal(summary.suspended, 1);
  assert.equal(summary.stale, 0);
  assert.equal(summary.healthy, 0);
});

test("4.0-01 fleet snapshot returns filtered agents and fleet posture", () => {
  const registry = new InMemoryAgentRegistry();

  registerFixture(registry, {
    id: "prod-a",
    environment: "production",
    tags: ["critical"],
  });

  registerFixture(registry, {
    id: "prod-b",
    environment: "production",
    tags: ["internal"],
  });

  const fleet = new AgentFleetEngine(registry);

  const snapshot = fleet.snapshot({
    workspaceId: "workspace-1" as import("../src/enterprise/access").WorkspaceId,
    tag: "critical",
    now: "2026-09-04T05:00:00.000Z",
  });

  assert.deepEqual(
    snapshot.agents.map((agent) => agent.id),
    [agentId("prod-a")],
  );

  assert.equal(snapshot.summary.total, 2);
  assert.equal(snapshot.summary.production, 2);
  assert.equal(snapshot.summary.stale, 2);
});

test("4.0-01 fleet rejects invalid stale threshold", () => {
  const registry = new InMemoryAgentRegistry();
  const fleet = new AgentFleetEngine(registry);

  assert.throws(
    () =>
      fleet.summarize(
        "workspace-1" as import("../src/enterprise/access").WorkspaceId,
        {
          staleAfterMs: -1,
        },
      ),
    /staleAfterMs/,
  );
});

test("4.0-01 fleet remains tenant isolated", () => {
  const registry = new InMemoryAgentRegistry();

  registerFixture(registry, {
    id: "tenant-a",
    workspaceId: "workspace-a",
  });

  registerFixture(registry, {
    id: "tenant-b",
    workspaceId: "workspace-b",
  });

  const fleet = new AgentFleetEngine(registry);

  const summary = fleet.summarize(
    "workspace-a" as import("../src/enterprise/access").WorkspaceId,
    {
      now: "2026-09-04T05:00:00.000Z",
    },
  );

  assert.equal(summary.total, 1);

  const agents = fleet.list({
    workspaceId: "workspace-a" as import("../src/enterprise/access").WorkspaceId,
  });

  assert.deepEqual(
    agents.map((agent) => agent.id),
    [agentId("tenant-a")],
  );
});
