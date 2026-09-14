import assert from "node:assert/strict";
import test from "node:test";

import {
  AuthorityGraph,
  BlastRadiusEngine,
} from "../src/enterprise/blast-radius";

import type {
  WorkspaceId,
} from "../src/enterprise/access";

import type {
  AgentId,
} from "../src/enterprise/agents";

const ws = (
  value: string,
): WorkspaceId =>
  value as WorkspaceId;

const aid = (
  value: string,
): AgentId =>
  value as AgentId;

function graphFixture(): AuthorityGraph {
  const graph =
    new AuthorityGraph();

  graph.addNode({
    id: "agent:agent-a",
    type: "agent",
    workspaceId:
      ws("workspace-a"),
    name: "Agent A",
  });

  graph.addNode({
    id: "identity:agent-a",
    type: "identity",
    workspaceId:
      ws("workspace-a"),
    name: "Agent A Identity",
  });

  graph.addNode({
    id: "capability:data-access",
    type: "capability",
    workspaceId:
      ws("workspace-a"),
    name: "Data Access",
  });

  graph.addNode({
    id: "tool:database",
    type: "tool",
    workspaceId:
      ws("workspace-a"),
    name: "Database Tool",
  });

  graph.addNode({
    id: "provider:postgres",
    type: "provider",
    workspaceId:
      ws("workspace-a"),
    name: "Postgres",
  });

  graph.addNode({
    id: "policy:production-data",
    type: "policy",
    workspaceId:
      ws("workspace-a"),
    name: "Production Data Policy",
  });

  graph.addNode({
    id: "approval:data-write",
    type: "approval",
    workspaceId:
      ws("workspace-a"),
    name: "Data Write Approval",
  });

  graph.addNode({
    id: "resource:customer-db",
    type: "resource",
    workspaceId:
      ws("workspace-a"),
    name: "Customer Database",
    sensitive: true,
    production: true,
  });

  graph.addNode({
    id: "resource:logs",
    type: "resource",
    workspaceId:
      ws("workspace-a"),
    name: "Application Logs",
    sensitive: false,
    production: true,
  });

  graph.addNode({
    id: "resource:dev-db",
    type: "resource",
    workspaceId:
      ws("workspace-a"),
    name: "Development Database",
    sensitive: false,
    production: false,
  });

  graph.addEdge({
    from: "agent:agent-a",
    to: "identity:agent-a",
    type: "IDENTIFIED_AS",
    workspaceId:
      ws("workspace-a"),
  });

  graph.addEdge({
    from: "identity:agent-a",
    to: "capability:data-access",
    type: "GRANTS",
    workspaceId:
      ws("workspace-a"),
  });

  graph.addEdge({
    from: "capability:data-access",
    to: "tool:database",
    type: "USES",
    workspaceId:
      ws("workspace-a"),
  });

  graph.addEdge({
    from: "tool:database",
    to: "provider:postgres",
    type: "ROUTES_TO",
    workspaceId:
      ws("workspace-a"),
  });

  graph.addEdge({
    from: "provider:postgres",
    to: "policy:production-data",
    type: "GOVERNED_BY",
    workspaceId:
      ws("workspace-a"),
  });

  graph.addEdge({
    from: "policy:production-data",
    to: "approval:data-write",
    type: "REQUIRES_APPROVAL",
    workspaceId:
      ws("workspace-a"),
  });

  graph.addEdge({
    from: "approval:data-write",
    to: "resource:customer-db",
    type: "REACHES",
    workspaceId:
      ws("workspace-a"),
  });

  graph.addEdge({
    from: "policy:production-data",
    to: "resource:logs",
    type: "REACHES",
    workspaceId:
      ws("workspace-a"),
  });

  graph.addEdge({
    from: "tool:database",
    to: "resource:dev-db",
    type: "REACHES",
    workspaceId:
      ws("workspace-a"),
  });

  return graph;
}

test(
  "4.0-06 resolves the complete effective authority path",
  () => {
    const graph =
      graphFixture();

    const result =
      new BlastRadiusEngine(
        graph,
      ).analyze(
        ws("workspace-a"),
        aid("agent-a"),
      );

    assert.equal(
      result.reachableResources,
      3,
    );

    assert.equal(
      result.sensitiveResources,
      1,
    );

    assert.equal(
      result.productionResources,
      2,
    );

    assert.equal(
      result.identityNodes,
      1,
    );

    assert.equal(
      result.capabilityNodes,
      1,
    );

    assert.equal(
      result.toolNodes,
      1,
    );

    assert.equal(
      result.providerNodes,
      1,
    );

    assert.equal(
      result.policyNodes,
      1,
    );

    assert.equal(
      result.approvalNodes,
      1,
    );

    assert.equal(
      result.paths.length,
      3,
    );
  },
);

test(
  "4.0-06 classifies sensitive production reachability as critical impact",
  () => {
    const graph =
      graphFixture();

    const result =
      new BlastRadiusEngine(
        graph,
      ).analyze(
        ws("workspace-a"),
        aid("agent-a"),
      );

    assert.equal(
      result.criticalPaths,
      1,
    );

    assert.equal(
      result.level,
      "HIGH",
    );
  },
);

test(
  "4.0-06 remains workspace isolated",
  () => {
    const graph =
      graphFixture();

    graph.addNode({
      id: "agent:agent-b",
      type: "agent",
      workspaceId:
        ws("workspace-b"),
      name: "Agent B",
    });

    graph.addNode({
      id: "resource:secret-b",
      type: "resource",
      workspaceId:
        ws("workspace-b"),
      name: "Workspace B Secret",
      sensitive: true,
      production: true,
    });

    graph.addEdge({
      from: "agent:agent-b",
      to: "resource:secret-b",
      type: "REACHES",
      workspaceId:
        ws("workspace-b"),
    });

    const result =
      new BlastRadiusEngine(
        graph,
      ).analyze(
        ws("workspace-a"),
        aid("agent-a"),
      );

    assert.equal(
      result.reachableResources,
      3,
    );

    assert.equal(
      result.paths.some(
        (path) =>
          path.terminalResourceId ===
          "resource:secret-b",
      ),
      false,
    );
  },
);

test(
  "4.0-06 missing agent produces empty blast radius",
  () => {
    const result =
      new BlastRadiusEngine(
        graphFixture(),
      ).analyze(
        ws("workspace-a"),
        aid("missing"),
      );

    assert.equal(
      result.reachableResources,
      0,
    );

    assert.equal(
      result.level,
      "LOW",
    );

    assert.deepEqual(
      result.paths,
      [],
    );
  },
);

test(
  "4.0-06 rejects cross-workspace edges",
  () => {
    const graph =
      new AuthorityGraph();

    graph.addNode({
      id: "agent:a",
      type: "agent",
      workspaceId:
        ws("workspace-a"),
      name: "A",
    });

    graph.addNode({
      id: "resource:b",
      type: "resource",
      workspaceId:
        ws("workspace-b"),
      name: "B",
    });

    assert.throws(
      () =>
        graph.addEdge({
          from: "agent:a",
          to: "resource:b",
          type: "REACHES",
          workspaceId:
            ws("workspace-a"),
        }),
      /crosses workspace boundary/,
    );
  },
);

test(
  "4.0-06 returns deterministic path ordering",
  () => {
    const graph =
      graphFixture();

    const engine =
      new BlastRadiusEngine(
        graph,
      );

    const first =
      engine.analyze(
        ws("workspace-a"),
        aid("agent-a"),
      );

    const second =
      engine.analyze(
        ws("workspace-a"),
        aid("agent-a"),
      );

    assert.deepEqual(
      second.paths,
      first.paths,
    );
  },
);

test(
  "4.0-06 caller mutation cannot alter graph snapshots",
  () => {
    const graph =
      graphFixture();

    const snapshot =
      graph.snapshot(
        ws("workspace-a"),
      );

    const nodes =
      snapshot.nodes as Array<unknown>;

    nodes.pop();

    const second =
      graph.snapshot(
        ws("workspace-a"),
      );

    assert.equal(
      second.nodes.length,
      10,
    );
  },
);

test(
  "4.0-06 rejects invalid maximum path depth",
  () => {
    assert.throws(
      () =>
        new BlastRadiusEngine(
          graphFixture(),
        ).analyze(
          ws("workspace-a"),
          aid("agent-a"),
          {
            maxPathDepth: 0,
          },
        ),
      /maxPathDepth/,
    );
  },
);
