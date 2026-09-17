import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  TransitiveAuthorityEngine,
} from "../src/enterprise/transitive-authority";

import {
  CompromiseSimulationGraph,
} from "../src/enterprise/compromise-simulation";

function graph(): CompromiseSimulationGraph {
  return {
    nodes: [
      {
        id: "agent:a",
        workspaceId: "workspace-a",
        type: "agent",
      },
      {
        id: "agent:b",
        workspaceId: "workspace-a",
        type: "agent",
      },
      {
        id: "agent:c",
        workspaceId: "workspace-a",
        type: "agent",
      },
      {
        id: "identity:c",
        workspaceId: "workspace-a",
        type: "identity",
      },
      {
        id: "capability:payment",
        workspaceId: "workspace-a",
        type: "capability",
      },
      {
        id: "tool:payments",
        workspaceId: "workspace-a",
        type: "tool",
      },
      {
        id: "provider:stripe",
        workspaceId: "workspace-a",
        type: "provider",
      },
      {
        id: "resource:payments",
        workspaceId: "workspace-a",
        type: "resource",
        sensitive: true,
        environment: "production",
      },
      {
        id: "resource:reports",
        workspaceId: "workspace-a",
        type: "resource",
        environment: "development",
      },
      {
        id: "agent:external",
        workspaceId: "workspace-b",
        type: "agent",
      },
    ],
    edges: [
      {
        id: "d1",
        workspaceId: "workspace-a",
        from: "agent:a",
        to: "agent:b",
        type: "DELEGATES_TO",
      },
      {
        id: "d2",
        workspaceId: "workspace-a",
        from: "agent:b",
        to: "agent:c",
        type: "DELEGATES_TO",
      },
      {
        id: "c1",
        workspaceId: "workspace-a",
        from: "agent:c",
        to: "identity:c",
        type: "IDENTIFIED_AS",
      },
      {
        id: "c2",
        workspaceId: "workspace-a",
        from: "identity:c",
        to: "capability:payment",
        type: "GRANTS",
      },
      {
        id: "c3",
        workspaceId: "workspace-a",
        from: "capability:payment",
        to: "tool:payments",
        type: "USES",
      },
      {
        id: "c4",
        workspaceId: "workspace-a",
        from: "tool:payments",
        to: "provider:stripe",
        type: "ROUTES_TO",
      },
      {
        id: "c5",
        workspaceId: "workspace-a",
        from: "provider:stripe",
        to: "resource:payments",
        type: "REACHES",
      },
      {
        id: "r1",
        workspaceId: "workspace-a",
        from: "agent:a",
        to: "resource:reports",
        type: "REACHES",
      },
    ],
  };
}

describe("4.0-11 transitive authority", () => {
  it("discovers direct and transitive delegated agents", () => {
    const engine =
      new TransitiveAuthorityEngine();

    const result = engine.analyze({
      workspaceId: "workspace-a",
      sourceAgentId: "a",
      graph: graph(),
    });

    assert.deepEqual(
      result.directlyReachableAgentIds,
      ["b"],
    );

    assert.deepEqual(
      result.transitivelyReachableAgentIds,
      ["b", "c"],
    );

    assert.equal(
      result.delegationDepth,
      2,
    );
  });

  it("finds resources reachable only through delegated agents", () => {
    const engine =
      new TransitiveAuthorityEngine();

    const result = engine.analyze({
      workspaceId: "workspace-a",
      sourceAgentId: "a",
      graph: graph(),
    });

    assert.deepEqual(
      result.reachableResources,
      ["resource:payments"],
    );

    assert.deepEqual(
      result.sensitiveResources,
      ["resource:payments"],
    );

    assert.deepEqual(
      result.productionResources,
      ["resource:payments"],
    );
  });

  it("surfaces transitive authority paths", () => {
    const engine =
      new TransitiveAuthorityEngine();

    const result = engine.analyze({
      workspaceId: "workspace-a",
      sourceAgentId: "a",
      graph: graph(),
    });

    assert.ok(
      result.transitivePaths.length >= 1,
    );

    assert.ok(
      result.transitivePaths.some(
        (path) =>
          path.agentIds.join(">") ===
          "a>b>c",
      ),
    );
  });

  it("calculates transitive blast-radius increase", () => {
    const engine =
      new TransitiveAuthorityEngine();

    const result = engine.analyze({
      workspaceId: "workspace-a",
      sourceAgentId: "a",
      graph: graph(),
    });

    assert.equal(
      result.directBlastRadiusScore,
      7,
    );

    assert.ok(
      result.transitiveBlastRadiusIncrease >
      0,
    );

    assert.ok(
      result.blastRadiusScore > 0,
    );
  });

  it("classifies delegated sensitive production authority as high risk", () => {
    const engine =
      new TransitiveAuthorityEngine();

    const result = engine.analyze({
      workspaceId: "workspace-a",
      sourceAgentId: "a",
      graph: graph(),
    });

    assert.equal(
      result.riskLevel,
      "HIGH",
    );
  });

  it("protects against delegation cycles", () => {
    const source = graph();

    source.edges = [
      ...source.edges,
      {
        id: "cycle",
        workspaceId: "workspace-a",
        from: "agent:c",
        to: "agent:a",
        type: "DELEGATES_TO",
      },
    ];

    const engine =
      new TransitiveAuthorityEngine();

    const result = engine.analyze({
      workspaceId: "workspace-a",
      sourceAgentId: "a",
      graph: source,
    });

    assert.equal(
      result.delegationDepth,
      2,
    );

    assert.equal(
      result.transitivelyReachableAgentIds.includes(
        "a",
      ),
      false,
    );
  });

  it("remains workspace isolated", () => {
    const source = graph();

    source.edges = [
      ...source.edges,
      {
        id: "cross",
        workspaceId: "workspace-a",
        from: "agent:a",
        to: "agent:external",
        type: "DELEGATES_TO",
      },
    ];

    const engine =
      new TransitiveAuthorityEngine();

    assert.throws(
      () =>
        engine.analyze({
          workspaceId: "workspace-a",
          sourceAgentId: "a",
          graph: source,
        }),
      /cross-workspace/,
    );
  });

  it("does not mutate the caller graph", () => {
    const source = graph();

    const beforeNodes =
      JSON.stringify(source.nodes);
    const beforeEdges =
      JSON.stringify(source.edges);

    const engine =
      new TransitiveAuthorityEngine();

    engine.analyze({
      workspaceId: "workspace-a",
      sourceAgentId: "a",
      graph: source,
    });

    assert.equal(
      JSON.stringify(source.nodes),
      beforeNodes,
    );

    assert.equal(
      JSON.stringify(source.edges),
      beforeEdges,
    );
  });

  it("is deterministic", () => {
    const engine =
      new TransitiveAuthorityEngine();

    const input = {
      workspaceId: "workspace-a",
      sourceAgentId: "a",
      graph: graph(),
    };

    const first =
      engine.analyze(input);

    const second =
      engine.analyze(input);

    assert.deepEqual(
      first,
      second,
    );
  });

  it("rejects invalid delegation depth", () => {
    const engine =
      new TransitiveAuthorityEngine();

    assert.throws(
      () =>
        engine.analyze({
          workspaceId: "workspace-a",
          sourceAgentId: "a",
          graph: graph(),
          maxDelegationDepth: 0,
        }),
      /positive integer/,
    );
  });
});
