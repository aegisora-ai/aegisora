import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  AttackPathMitigationEngine,
} from "../src/enterprise/attack-path-mitigation";

import {
  CompromiseSimulationGraph,
} from "../src/enterprise/compromise-simulation";

function graph(): CompromiseSimulationGraph {
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
        id: "capability:data-read",
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
        id: "resource:internal-docs",
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
        from: "agent:finance",
        to: "identity:finance",
        type: "IDENTIFIED_AS",
      },
      {
        id: "e2",
        workspaceId: "workspace-a",
        from: "identity:finance",
        to: "capability:data-read",
        type: "GRANTS",
      },
      {
        id: "e3",
        workspaceId: "workspace-a",
        from: "capability:data-read",
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
      {
        id: "e7",
        workspaceId: "workspace-a",
        from: "provider:postgres",
        to: "resource:internal-docs",
        type: "REACHES",
      },
    ],
  };
}

describe("4.0-08 attack-path mitigation", () => {
  it("discovers authority edges that can reduce blast radius", () => {
    const engine =
      new AttackPathMitigationEngine();

    const result = engine.optimize({
      workspaceId: "workspace-a",
      agentId: "finance",
      graph: graph(),
    });

    assert.ok(result.candidates.length > 0);
    assert.equal(
      result.baseline.reachableResources,
      3,
    );
    assert.equal(
      result.baseline.sensitiveResources,
      1,
    );
    assert.equal(
      result.baseline.productionResources,
      2,
    );
  });

  it("evaluates removal without mutating the caller graph", () => {
    const source = graph();
    const beforeEdges = source.edges.length;

    const engine =
      new AttackPathMitigationEngine();

    engine.optimize({
      workspaceId: "workspace-a",
      agentId: "finance",
      graph: source,
    });

    assert.equal(
      source.edges.length,
      beforeEdges,
    );
  });

  it("ranks candidate controls deterministically", () => {
    const engine =
      new AttackPathMitigationEngine();

    const input = {
      workspaceId: "workspace-a",
      agentId: "finance",
      graph: graph(),
    };

    const first =
      engine.optimize(input);
    const second =
      engine.optimize(input);

    assert.deepEqual(first, second);

    const scores =
      first.candidates.map(
        (candidate) =>
          candidate.efficiencyScore,
      );

    assert.deepEqual(
      scores,
      [...scores].sort(
        (a, b) => b - a,
      ),
    );
  });

  it("finds the provider-to-sensitive-resource cut", () => {
    const engine =
      new AttackPathMitigationEngine();

    const result = engine.optimize({
      workspaceId: "workspace-a",
      agentId: "finance",
      graph: graph(),
    });

    const target =
      result.candidates.find(
        (candidate) =>
          candidate.targetEdgeId ===
          "e6",
      );

    assert.ok(target);
    assert.equal(
      target.targetEdgeType,
      "REACHES",
    );
    assert.equal(
      target.to,
      "resource:customer-db",
    );
    assert.equal(
      target.sensitiveResourceLoss,
      1,
    );
    assert.ok(
      target.blastRadiusReduction > 0,
    );
  });

  it("reports no candidate when the agent has no reachable authority", () => {
    const isolated: CompromiseSimulationGraph = {
      nodes: [
        {
          id: "agent:isolated",
          workspaceId: "workspace-a",
          type: "agent",
        },
      ],
      edges: [],
    };

    const engine =
      new AttackPathMitigationEngine();

    const result = engine.optimize({
      workspaceId: "workspace-a",
      agentId: "isolated",
      graph: isolated,
    });

    assert.equal(
      result.baseline.blastRadius,
      0,
    );
    assert.equal(
      result.baseline.level,
      "LOW",
    );
    assert.equal(
      result.candidates.length,
      0,
    );
    assert.equal(
      result.recommended,
      null,
    );
  });

  it("remains tenant isolated", () => {
    const engine =
      new AttackPathMitigationEngine();

    const result = engine.optimize({
      workspaceId: "workspace-a",
      agentId: "finance",
      graph: graph(),
    });

    for (const candidate of result.candidates) {
      assert.match(
        candidate.targetEdgeId,
        /^e[1-7]$/,
      );
    }
  });

  it("limits returned candidates", () => {
    const engine =
      new AttackPathMitigationEngine();

    const result = engine.optimize({
      workspaceId: "workspace-a",
      agentId: "finance",
      graph: graph(),
      maxCandidates: 2,
    });

    assert.ok(
      result.candidates.length <= 2,
    );
  });

  it("rejects invalid candidate limit", () => {
    const engine =
      new AttackPathMitigationEngine();

    assert.throws(
      () =>
        engine.optimize({
          workspaceId: "workspace-a",
          agentId: "finance",
          graph: graph(),
          maxCandidates: 0,
        }),
      /positive integer/,
    );
  });
});
