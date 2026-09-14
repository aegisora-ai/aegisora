import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  CompromiseSimulationEngine,
  CompromiseSimulationGraph,
} from "../src/enterprise/compromise-simulation";

function graph(): CompromiseSimulationGraph {
  return {
    nodes: [
      {
        id: "agent:agent-a",
        workspaceId: "workspace-a",
        type: "agent",
      },
      {
        id: "identity:agent-a",
        workspaceId: "workspace-a",
        type: "identity",
      },
      {
        id: "capability:read",
        workspaceId: "workspace-a",
        type: "capability",
      },
      {
        id: "capability:write",
        workspaceId: "workspace-a",
        type: "capability",
      },
      {
        id: "tool:database",
        workspaceId: "workspace-a",
        type: "tool",
      },
      {
        id: "provider:postgres",
        workspaceId: "workspace-a",
        type: "provider",
      },
      {
        id: "resource:analytics",
        workspaceId: "workspace-a",
        type: "resource",
        environment: "production",
      },
      {
        id: "resource:customer-db",
        workspaceId: "workspace-a",
        type: "resource",
        sensitive: true,
        environment: "production",
      },
      {
        id: "resource:dev-db",
        workspaceId: "workspace-a",
        type: "resource",
        environment: "development",
      },
      {
        id: "agent:other",
        workspaceId: "workspace-b",
        type: "agent",
      },
      {
        id: "capability:other",
        workspaceId: "workspace-b",
        type: "capability",
      },
    ],
    edges: [
      {
        id: "e1",
        workspaceId: "workspace-a",
        from: "agent:agent-a",
        to: "identity:agent-a",
        type: "IDENTIFIED_AS",
      },
      {
        id: "e2",
        workspaceId: "workspace-a",
        from: "identity:agent-a",
        to: "capability:read",
        type: "GRANTS",
      },
      {
        id: "e3",
        workspaceId: "workspace-a",
        from: "capability:read",
        to: "tool:database",
        type: "USES",
      },
      {
        id: "e4",
        workspaceId: "workspace-a",
        from: "tool:database",
        to: "provider:postgres",
        type: "ROUTES_TO",
      },
      {
        id: "e5",
        workspaceId: "workspace-a",
        from: "provider:postgres",
        to: "resource:analytics",
        type: "REACHES",
      },
      {
        id: "e6",
        workspaceId: "workspace-a",
        from: "provider:postgres",
        to: "resource:customer-db",
        type: "REACHES",
      },
    ],
  };
}

describe("4.0-07 compromise simulation", () => {
  it("computes the current compromise exposure", () => {
    const engine = new CompromiseSimulationEngine();

    const result = engine.simulate({
      workspaceId: "workspace-a",
      agentId: "agent-a",
      graph: graph(),
    });

    assert.deepEqual(
      result.before.exposure.reachableResources,
      [
        "resource:analytics",
        "resource:customer-db",
      ],
    );

    assert.equal(
      result.before.impact.sensitiveResources,
      1,
    );

    assert.equal(
      result.before.impact.productionResources,
      2,
    );

    assert.equal(
      result.before.impact.level,
      "HIGH",
    );
  });

  it("predicts additional authority before reality changes", () => {
    const engine = new CompromiseSimulationEngine();

    const result = engine.simulate({
      workspaceId: "workspace-a",
      agentId: "agent-a",
      graph: graph(),
      change: {
        type: "GRANT_CAPABILITY",
        agentId: "agent-a",
        capabilityId: "write",
      },
    });

    assert.equal(
      result.before.impact.reachableResources,
      2,
    );

    assert.equal(
      result.after.impact.reachableResources,
      2,
    );

    assert.equal(
      result.delta.reachableResourceDelta,
      0,
    );

    assert.deepEqual(
      result.delta.newReachableResources,
      [],
    );

    assert.equal(
      result.delta.levelChanged,
      false,
    );
  });

  it("supports a compound authority change and exposes new blast radius", () => {
    const engine = new CompromiseSimulationEngine();

    const result = engine.simulate({
      workspaceId: "workspace-a",
      agentId: "agent-a",
      graph: graph(),
      change: {
        type: "ADD_AUTHORITY_EDGE",
        edge: {
          id: "simulated-write-capability",
          workspaceId: "workspace-a",
          from: "agent:agent-a",
          to: "capability:write",
          type: "GRANTS",
        },
      },
    });

    const extended = engine.simulate({
      workspaceId: "workspace-a",
      agentId: "agent-a",
      graph: {
        nodes: graph().nodes,
        edges: [
          ...graph().edges,
          {
            id: "simulated-write-tool",
            workspaceId: "workspace-a",
            from: "capability:write",
            to: "tool:database",
            type: "USES",
          },
        ],
      },
      change: {
        type: "ADD_AUTHORITY_EDGE",
        edge: {
          id: "simulated-write-capability",
          workspaceId: "workspace-a",
          from: "agent:agent-a",
          to: "capability:write",
          type: "GRANTS",
        },
      },
    });

    assert.equal(
      result.after.impact.reachableResources,
      2,
    );

    assert.deepEqual(
      extended.delta.newReachableResources,
      [],
    );

    assert.equal(
      extended.delta.pathDelta,
      2,
    );
  });

  it("does not mutate the caller graph", () => {
    const source = graph();
    const beforeEdges = source.edges.length;

    const engine = new CompromiseSimulationEngine();

    engine.simulate({
      workspaceId: "workspace-a",
      agentId: "agent-a",
      graph: source,
      change: {
        type: "GRANT_CAPABILITY",
        agentId: "agent-a",
        capabilityId: "write",
      },
    });

    assert.equal(source.edges.length, beforeEdges);
  });

  it("remains deterministic", () => {
    const engine = new CompromiseSimulationEngine();

    const input = {
      workspaceId: "workspace-a",
      agentId: "agent-a",
      graph: graph(),
      change: {
        type: "ADD_AUTHORITY_EDGE" as const,
        edge: {
          id: "simulated-write-capability",
          workspaceId: "workspace-a",
          from: "agent:agent-a",
          to: "capability:write",
          type: "GRANTS" as const,
        },
      },
    };

    const first = engine.simulate(input);
    const second = engine.simulate(input);

    assert.deepEqual(first, second);
  });

  it("rejects cross-workspace changes", () => {
    const engine = new CompromiseSimulationEngine();

    assert.throws(
      () =>
        engine.simulate({
          workspaceId: "workspace-a",
          agentId: "agent-a",
          graph: graph(),
          change: {
            type: "ADD_AUTHORITY_EDGE",
            edge: {
              id: "evil-edge",
              workspaceId: "workspace-b",
              from: "agent:agent-other",
              to: "capability:other",
              type: "GRANTS",
            },
          },
        }),
      /cross-workspace/,
    );
  });

  it("rejects unknown agents", () => {
    const engine = new CompromiseSimulationEngine();

    assert.throws(
      () =>
        engine.simulate({
          workspaceId: "workspace-a",
          agentId: "does-not-exist",
          graph: graph(),
        }),
      /not found/,
    );
  });

  it("returns stable sorted attack paths", () => {
    const engine = new CompromiseSimulationEngine();

    const result = engine.simulate({
      workspaceId: "workspace-a",
      agentId: "agent-a",
      graph: graph(),
    });

    const keys = result.before.exposure.paths.map(
      (path) => path.nodeIds.join(">"),
    );

    assert.deepEqual(keys, [...keys].sort());
  });
});

