import assert from "node:assert/strict";
import { test } from "node:test";

import type {
  CompromiseSimulationGraph,
  DelegationAuthorityContract,
  DelegationAuthorityScope,
} from "@aegisora/core";

import {
  DelegationAuthorityContractEngine,
} from "@aegisora/core";

import {
  Agent,
} from "../src/agent/core/agent";

import {
  RuntimeContext,
} from "../src/context/runtime-context";

import {
  EnforcementGate,
} from "../src/enforcement";

import {
  ToolRegistry,
} from "../src/tools/tool-registry";

function baseGraph(): CompromiseSimulationGraph {
  return {
    nodes: [
      {
        id: "agent:parent",
        workspaceId: "workspace-a",
        type: "agent",
      },
      {
        id: "agent:child",
        workspaceId: "workspace-a",
        type: "agent",
      },
      {
        id: "identity:parent",
        workspaceId: "workspace-a",
        type: "identity",
      },
      {
        id: "identity:child",
        workspaceId: "workspace-a",
        type: "identity",
      },
      {
        id: "capability:echo",
        workspaceId: "workspace-a",
        type: "capability",
      },
      {
        id: "tool:echo",
        workspaceId: "workspace-a",
        type: "tool",
      },
    ],

    edges: [
      {
        id: "p1",
        workspaceId: "workspace-a",
        from: "agent:parent",
        to: "identity:parent",
        type: "IDENTIFIED_AS",
      },
      {
        id: "p2",
        workspaceId: "workspace-a",
        from: "identity:parent",
        to: "capability:echo",
        type: "GRANTS",
      },
      {
        id: "p3",
        workspaceId: "workspace-a",
        from: "capability:echo",
        to: "tool:echo",
        type: "USES",
      },
      {
        id: "c1",
        workspaceId: "workspace-a",
        from: "agent:child",
        to: "identity:child",
        type: "IDENTIFIED_AS",
      },
      {
        id: "c2",
        workspaceId: "workspace-a",
        from: "identity:child",
        to: "capability:echo",
        type: "GRANTS",
      },
      {
        id: "c3",
        workspaceId: "workspace-a",
        from: "capability:echo",
        to: "tool:echo",
        type: "USES",
      },
    ],
  };
}

function scope(): DelegationAuthorityScope {
  return {
    capabilityIds: [
      "capability:echo",
    ],
    toolIds: [
      "tool:echo",
    ],
    providerIds: [],
    resourceIds: [],
  };
}

function createContract(
  overrides: Partial<
    DelegationAuthorityContract
  > = {},
): DelegationAuthorityContract {

  const engine =
    new DelegationAuthorityContractEngine();

  return engine.issue({
    workspaceId:
      "workspace-a",

    contractId:
      overrides.contractId ??
      "contract-111",

    issuerAgentId:
      overrides.issuerAgentId ??
      "parent",

    delegateAgentId:
      overrides.delegateAgentId ??
      "child",

    taskId:
      overrides.taskId ??
      "task-111",

    scope:
      overrides.scope ??
      scope(),

    issuedAt:
      overrides.issuedAt ??
      "2026-09-17T10:00:00.000Z",

    expiresAt:
      overrides.expiresAt ??
      "2026-09-17T18:00:00.000Z",

    maxDelegationDepth:
      overrides.maxDelegationDepth ??
      1,

    allowFurtherDelegation:
      overrides.allowFurtherDelegation ??
      false,

    requiresHumanApproval:
      overrides.requiresHumanApproval ??
      false,
  });
}

function createRuntime() {

  const context =
    new RuntimeContext();

  context.agentRegistry.register(
    new Agent({
      id: "parent",
      name: "parent",
    }),
  );

  context.agentRegistry.register(
    new Agent({
      id: "child",
      name: "child",
    }),
  );

  const gate =
    new EnforcementGate(
      context,
    );

  const registry =
    new ToolRegistry(
      Symbol("trace-111"),
    );

  registry.setEnforcementGate(
    gate,
  );

  let executions =
    0;

  registry.register({
    name: "echo",
    description:
      "TRACE 111 echo",

    async execute(input) {
      executions++;
      return input;
    },
  });

  return {
    context,
    registry,

    get executions() {
      return executions;
    },
  };
}

function all(
  store: unknown,
): any[] {
  const value =
    store as any;

  if (
    value &&
    typeof value.getAll === "function"
  ) {
    return value.getAll();
  }

  if (
    value &&
    typeof value.list === "function"
  ) {
    return value.list();
  }

  return [];
}

test(
  "TRACE 111 - forged child is audited as BLOCK with zero side effect",
  async () => {

    const app =
      createRuntime();

    const c =
      createContract();

    await assert.rejects(
      async () => {
        await app.registry.executeContractDelegated(
          "echo",
          {},
          {
            agentId: "parent",
          },
          c,
          baseGraph(),
          "task-111",
          "2026-09-17T12:00:00.000Z",
        );
      },
      /DELEGATION_CONTRACT:BLOCK/,
    );

    assert.equal(
      app.executions,
      0,
    );

    const decisions =
      all(
        app.context.decisionStore,
      );

    const evidence =
      all(
        app.context.evidenceStore,
      );

    assert.equal(
      decisions.length,
      1,
    );

    assert.equal(
      evidence.length,
      1,
    );

    assert.equal(
      decisions[0].decision,
      "block",
    );

    assert.equal(
      evidence[0].finalDecision,
      "BLOCK",
    );

    assert.equal(
      evidence[0].enforcementStatus,
      "prevented",
    );

    assert.equal(
      evidence[0].executionOutcome,
      "not_attempted",
    );

    assert.equal(
      decisions[0].metadata
        ?.delegationFailureCode,
      "DELEGATE_IDENTITY_MISMATCH",
    );

    assert.equal(
      evidence[0].metadata
        ?.delegationFailureCode,
      "DELEGATE_IDENTITY_MISMATCH",
    );

    assert.equal(
      decisions[0].metadata
        ?.delegationContractHash,
      c.contractHash,
    );

    assert.equal(
      evidence[0].metadata
        ?.delegationContractHash,
      c.contractHash,
    );
  },
);

test(
  "TRACE 111 - out-of-scope tool is audited as BLOCK with zero side effect",
  async () => {

    const app =
      createRuntime();

    const c =
      createContract();

    await assert.rejects(
      async () => {
        await app.registry.executeContractDelegated(
          "admin",
          {},
          {
            agentId: "child",
          },
          c,
          baseGraph(),
          "task-111",
          "2026-09-17T12:00:00.000Z",
        );
      },
      /DELEGATION_CONTRACT:BLOCK/,
    );

    assert.equal(
      app.executions,
      0,
    );

    const decisions =
      all(
        app.context.decisionStore,
      );

    const evidence =
      all(
        app.context.evidenceStore,
      );

    assert.equal(
      decisions.length,
      1,
    );

    assert.equal(
      evidence.length,
      1,
    );

    assert.equal(
      decisions[0].decision,
      "block",
    );

    assert.equal(
      evidence[0].finalDecision,
      "BLOCK",
    );

    assert.equal(
      decisions[0].metadata
        ?.delegationFailureCode,
      "TOOL_OUTSIDE_CONTRACT_SCOPE",
    );

    assert.equal(
      evidence[0].metadata
        ?.delegationFailureCode,
      "TOOL_OUTSIDE_CONTRACT_SCOPE",
    );
  },
);

test(
  "TRACE 111 - malformed cross-workspace graph fails closed and is audited",
  async () => {

    const app =
      createRuntime();

    const graph =
      baseGraph();

    graph.nodes.push({
      id: "agent:external",
      workspaceId: "workspace-b",
      type: "agent",
    });

    graph.edges.push({
      id: "cross-workspace",
      workspaceId: "workspace-a",
      from: "agent:child",
      to: "agent:external",
      type: "DELEGATES_TO",
    });

    const c =
      createContract();

    await assert.rejects(
      async () => {
        await app.registry.executeContractDelegated(
          "echo",
          {},
          {
            agentId: "child",
          },
          c,
          graph,
          "task-111",
          "2026-09-17T12:00:00.000Z",
        );
      },
      /DELEGATION_CONTRACT:BLOCK/,
    );

    assert.equal(
      app.executions,
      0,
    );

    const decisions =
      all(
        app.context.decisionStore,
      );

    const evidence =
      all(
        app.context.evidenceStore,
      );

    assert.equal(
      decisions.length,
      1,
    );

    assert.equal(
      evidence.length,
      1,
    );

    assert.equal(
      decisions[0].decision,
      "block",
    );

    assert.equal(
      evidence[0].finalDecision,
      "BLOCK",
    );

    assert.equal(
      evidence[0].enforcementStatus,
      "prevented",
    );

    assert.equal(
      evidence[0].executionOutcome,
      "not_attempted",
    );

    assert.equal(
      decisions[0].metadata
        ?.delegationFailureCode,
      "CONTRACT_EVALUATION_ERROR",
    );

    assert.equal(
      evidence[0].metadata
        ?.delegationFailureCode,
      "CONTRACT_EVALUATION_ERROR",
    );

    assert.deepEqual(
      decisions[0].metadata
        ?.delegationReasonCodes,
      ["INVALID_GRAPH"],
    );

    assert.deepEqual(
      evidence[0].metadata
        ?.delegationReasonCodes,
      ["INVALID_GRAPH"],
    );
  },
);
