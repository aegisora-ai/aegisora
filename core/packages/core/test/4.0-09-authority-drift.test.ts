import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  AuthorityDriftEngine,
} from "../src/enterprise/authority-drift";

import {
  CompromiseSimulationGraph,
} from "../src/enterprise/compromise-simulation";

function approvedGraph(): CompromiseSimulationGraph {
  return {
    nodes: [
      {
        id: "agent:finance",
        workspaceId: "workspace-a",
        type: "agent",
      },
      {
        id: "identity:finance",
        workspaceId: "workspace-a",
        type: "identity",
      },
      {
        id: "capability:read",
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
        id: "resource:internal-docs",
        workspaceId: "workspace-a",
        type: "resource",
        environment: "development",
      },
    ],
    edges: [
      {
        id: "e1",
        workspaceId: "workspace-a",
        from: "agent:finance",
        to: "identity:finance",
        type: "IDENTIFIED_AS",
      },
      {
        id: "e2",
        workspaceId: "workspace-a",
        from: "identity:finance",
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
    ],
  };
}

function observedWithSensitiveProductionDrift(): CompromiseSimulationGraph {
  const base = approvedGraph();

  return {
    nodes: [
      ...base.nodes,
      {
        id: "resource:customer-db",
        workspaceId: "workspace-a",
        type: "resource",
        sensitive: true,
        environment: "production",
      },
      {
        id: "capability:write",
        workspaceId: "workspace-a",
        type: "capability",
      },
    ],
    edges: [
      ...base.edges,
      {
        id: "e6",
        workspaceId: "workspace-a",
        from: "identity:finance",
        to: "capability:write",
        type: "GRANTS",
      },
      {
        id: "e7",
        workspaceId: "workspace-a",
        from: "capability:write",
        to: "tool:database",
        type: "USES",
      },
      {
        id: "e8",
        workspaceId: "workspace-a",
        from: "provider:postgres",
        to: "resource:customer-db",
        type: "REACHES",
      },
    ],
  };
}

describe("4.0-09 authority drift", () => {
  it("returns NONE when observed authority matches approved authority", () => {
    const engine =
      new AuthorityDriftEngine();

    const graph = approvedGraph();

    const result = engine.detect({
      workspaceId: "workspace-a",
      agentId: "finance",
      approvedGraph: graph,
      observedGraph: graph,
    });

    assert.equal(
      result.impact.driftScore,
      0,
    );
    assert.equal(
      result.impact.severity,
      "NONE",
    );
    assert.equal(
      result.impact.recommendedAction,
      "MONITOR",
    );
    assert.deepEqual(
      result.impact.newPaths,
      [],
    );
  });

  it("detects newly reachable resources", () => {
    const base = approvedGraph();

    const observed: CompromiseSimulationGraph = {
      nodes: [
        ...base.nodes,
        {
          id: "resource:new-service",
          workspaceId: "workspace-a",
          type: "resource",
          environment: "development",
        },
      ],
      edges: [
        ...base.edges,
        {
          id: "e-new",
          workspaceId: "workspace-a",
          from: "provider:postgres",
          to: "resource:new-service",
          type: "REACHES",
        },
      ],
    };

    const engine =
      new AuthorityDriftEngine();

    const result = engine.detect({
      workspaceId: "workspace-a",
      agentId: "finance",
      approvedGraph: base,
      observedGraph: observed,
    });

    assert.deepEqual(
      result.impact.newReachableResources,
      ["resource:new-service"],
    );

    assert.equal(
      result.impact.severity,
      "LOW",
    );

    assert.equal(
      result.impact.recommendedAction,
      "MONITOR",
    );

    assert.ok(
      result.impact.newPaths.length > 0,
    );
  });

  it("escalates sensitive production drift to HIGH", () => {
    const engine =
      new AuthorityDriftEngine();

    const result = engine.detect({
      workspaceId: "workspace-a",
      agentId: "finance",
      approvedGraph: approvedGraph(),
      observedGraph:
        observedWithSensitiveProductionDrift(),
    });

    assert.deepEqual(
      result.impact.newSensitiveResources,
      ["resource:customer-db"],
    );

    assert.deepEqual(
      result.impact.newProductionResources,
      ["resource:customer-db"],
    );

    assert.ok(
      result.impact.newCriticalPaths.length >= 1,
    );

    assert.equal(
      result.impact.severity,
      "CRITICAL",
    );

    assert.equal(
      result.impact.recommendedAction,
      "CONTAIN",
    );
  });

  it("reports resource, path, and blast-radius deltas", () => {
    const engine =
      new AuthorityDriftEngine();

    const result = engine.detect({
      workspaceId: "workspace-a",
      agentId: "finance",
      approvedGraph: approvedGraph(),
      observedGraph:
        observedWithSensitiveProductionDrift(),
    });

    assert.equal(
      result.impact.reachableResourceDelta,
      1,
    );

    assert.equal(
      result.impact.sensitiveResourceDelta,
      1,
    );

    assert.equal(
      result.impact.productionResourceDelta,
      1,
    );

    assert.ok(
      result.impact.pathDelta > 0,
    );

    assert.ok(
      result.observed.blastRadius >
      result.approved.blastRadius,
    );
  });

  it("classifies each newly observed path", () => {
    const engine =
      new AuthorityDriftEngine();

    const result = engine.detect({
      workspaceId: "workspace-a",
      agentId: "finance",
      approvedGraph: approvedGraph(),
      observedGraph:
        observedWithSensitiveProductionDrift(),
    });

    assert.ok(
      result.pathChanges.some(
        (change) =>
          change.reason ===
          "NEW_CRITICAL_PATH",
      ),
    );
  });

  it("does not mutate approved or observed graphs", () => {
    const approved = approvedGraph();
    const observed =
      observedWithSensitiveProductionDrift();

    const approvedEdges =
      approved.edges.length;
    const observedEdges =
      observed.edges.length;

    const engine =
      new AuthorityDriftEngine();

    engine.detect({
      workspaceId: "workspace-a",
      agentId: "finance",
      approvedGraph: approved,
      observedGraph: observed,
    });

    assert.equal(
      approved.edges.length,
      approvedEdges,
    );

    assert.equal(
      observed.edges.length,
      observedEdges,
    );
  });

  it("remains workspace isolated", () => {
    const base = approvedGraph();

    const observed: CompromiseSimulationGraph = {
      nodes: [
        ...base.nodes,
        {
          id: "agent:other",
          workspaceId: "workspace-b",
          type: "agent",
        },
        {
          id: "resource:other",
          workspaceId: "workspace-b",
          type: "resource",
          sensitive: true,
          environment: "production",
        },
      ],
      edges: base.edges,
    };

    const engine =
      new AuthorityDriftEngine();

    const result = engine.detect({
      workspaceId: "workspace-a",
      agentId: "finance",
      approvedGraph: base,
      observedGraph: observed,
    });

    assert.deepEqual(
      result.impact.newReachableResources,
      [],
    );

    assert.equal(
      result.impact.severity,
      "NONE",
    );
  });

  it("is deterministic for identical inputs", () => {
    const engine =
      new AuthorityDriftEngine();

    const input = {
      workspaceId: "workspace-a",
      agentId: "finance",
      approvedGraph: approvedGraph(),
      observedGraph:
        observedWithSensitiveProductionDrift(),
    };

    const first =
      engine.detect(input);
    const second =
      engine.detect(input);

    assert.deepEqual(
      first,
      second,
    );
  });
});
