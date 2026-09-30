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

function createGraph(): CompromiseSimulationGraph {
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
        id: "parent-identity",
        workspaceId: "workspace-a",
        from: "agent:parent",
        to: "identity:parent",
        type: "IDENTIFIED_AS",
      },
      {
        id: "parent-capability",
        workspaceId: "workspace-a",
        from: "identity:parent",
        to: "capability:echo",
        type: "GRANTS",
      },
      {
        id: "parent-tool",
        workspaceId: "workspace-a",
        from: "capability:echo",
        to: "tool:echo",
        type: "USES",
      },
      {
        id: "child-identity",
        workspaceId: "workspace-a",
        from: "agent:child",
        to: "identity:child",
        type: "IDENTIFIED_AS",
      },
      {
        id: "child-capability",
        workspaceId: "workspace-a",
        from: "identity:child",
        to: "capability:echo",
        type: "GRANTS",
      },
      {
        id: "child-tool",
        workspaceId: "workspace-a",
        from: "capability:echo",
        to: "tool:echo",
        type: "USES",
      },
    ],
  };
}

function createScope(): DelegationAuthorityScope {
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
  overrides: Partial<DelegationAuthorityContract> = {},
): DelegationAuthorityContract {
  const engine =
    new DelegationAuthorityContractEngine();

  return engine.issue({
    workspaceId: "workspace-a",
    contractId:
      overrides.contractId ??
      "contract-109",
    issuerAgentId:
      overrides.issuerAgentId ??
      "parent",
    delegateAgentId:
      overrides.delegateAgentId ??
      "child",
    taskId:
      overrides.taskId ??
      "task-109",
    scope:
      overrides.scope ??
      createScope(),
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
    new EnforcementGate(context);

  const registry =
    new ToolRegistry(
      Symbol("trace-109"),
    );

  registry.setEnforcementGate(gate);

  let executions = 0;

  registry.register({
    name: "echo",
    description: "TRACE 109 echo",

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

function records(store: unknown): any[] {
  const value = store as any;

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
  "TRACE 109 - ALLOW reaches execution and binds contract evidence",
  async () => {
    const app =
      createRuntime();

    const contract =
      createContract();

    const result =
      await app.registry.executeContractDelegated(
        "echo",
        {
          message: "allow",
        },
        {
          agentId: "child",
        },
        contract,
        createGraph(),
        "task-109",
        "2026-09-17T12:00:00.000Z",
      );

    assert.deepEqual(
      result,
      {
        message: "allow",
      },
    );

    assert.equal(
      app.executions,
      1,
    );

    const decisions =
      records(
        app.context.decisionStore,
      );

    const evidence =
      records(
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

    const decision =
      decisions[0];

    const evidenceRecord =
      evidence[0];

    assert.equal(
      decision.decision,
      "allow",
    );

    assert.equal(
      evidenceRecord.finalDecision,
      "ALLOW",
    );

    assert.equal(
      decision.metadata?.delegationContractId,
      contract.contractId,
    );

    assert.equal(
      evidenceRecord.metadata?.delegationContractId,
      contract.contractId,
    );

    assert.equal(
      decision.metadata?.delegationContractHash,
      contract.contractHash,
    );

    assert.equal(
      evidenceRecord.metadata?.delegationContractHash,
      contract.contractHash,
    );

    assert.equal(
      decision.metadata?.delegationTaskId,
      contract.taskId,
    );

    assert.equal(
      evidenceRecord.metadata?.delegationTaskId,
      contract.taskId,
    );

    assert.equal(
      decision.metadata?.delegationIssuerAgentId,
      contract.issuerAgentId,
    );

    assert.equal(
      evidenceRecord.metadata?.delegationIssuerAgentId,
      contract.issuerAgentId,
    );

    assert.equal(
      decision.metadata?.delegationDelegateAgentId,
      contract.delegateAgentId,
    );

    assert.equal(
      evidenceRecord.metadata?.delegationDelegateAgentId,
      contract.delegateAgentId,
    );

    assert.equal(
      decision.metadata?.delegationDecision,
      "ALLOW",
    );

    assert.equal(
      evidenceRecord.metadata?.delegationDecision,
      "ALLOW",
    );

    assert.deepEqual(
      decision.metadata?.delegationReasonCodes,
      [],
    );

    assert.deepEqual(
      evidenceRecord.metadata?.delegationReasonCodes,
      [],
    );

    assert.equal(
      evidenceRecord.traceId,
      decision.traceId,
    );

    assert.equal(
      evidenceRecord.decisionId,
      decision.decisionId,
    );

    assert.equal(
      evidenceRecord.executionId,
      decision.executionId,
    );

    assert.equal(
      evidenceRecord.evidenceId,
      decision.evidenceId,
    );
  },
);

test(
  "TRACE 109 - BLOCK persists evidence and produces zero side effects",
  async () => {
    const app =
      createRuntime();

    const contract =
      createContract();

    await assert.rejects(
      async () => {
        await app.registry.executeContractDelegated(
          "echo",
          {
            message: "expired",
          },
          {
            agentId: "child",
          },
          contract,
          createGraph(),
          "task-109",
          "2026-09-17T18:00:00.001Z",
        );
      },
      /\[DELEGATION_CONTRACT:BLOCK\]/,
    );

    assert.equal(
      app.executions,
      0,
    );

    const decisions =
      records(
        app.context.decisionStore,
      );

    const evidence =
      records(
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

    const decision =
      decisions[0];

    const evidenceRecord =
      evidence[0];

    assert.equal(
      decision.decision,
      "block",
    );

    assert.equal(
      evidenceRecord.finalDecision,
      "BLOCK",
    );

    assert.equal(
      evidenceRecord.enforcementStatus,
      "prevented",
    );

    assert.equal(
      evidenceRecord.executionOutcome,
      "not_attempted",
    );

    assert.equal(
      decision.metadata?.delegationContractId,
      contract.contractId,
    );

    assert.equal(
      evidenceRecord.metadata?.delegationContractId,
      contract.contractId,
    );

    assert.ok(
      decision.metadata?.delegationReasonCodes?.includes(
        "EXPIRED",
      ),
    );

    assert.ok(
      evidenceRecord.metadata?.delegationReasonCodes?.includes(
        "EXPIRED",
      ),
    );
  },
);

test(
  "TRACE 109 - ESCALATE persists evidence and produces zero side effects",
  async () => {
    const app =
      createRuntime();

    const contract =
      createContract({
        contractId:
          "contract-109-escalate",
        requiresHumanApproval:
          true,
      });

    await assert.rejects(
      async () => {
        await app.registry.executeContractDelegated(
          "echo",
          {
            message:
              "approval required",
          },
          {
            agentId: "child",
          },
          contract,
          createGraph(),
          "task-109",
          "2026-09-17T12:00:00.000Z",
        );
      },
      /\[DELEGATION_CONTRACT:ESCALATE\]/,
    );

    assert.equal(
      app.executions,
      0,
    );

    const decisions =
      records(
        app.context.decisionStore,
      );

    const evidence =
      records(
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

    const decision =
      decisions[0];

    const evidenceRecord =
      evidence[0];

    assert.equal(
      decision.decision,
      "escalate",
    );

    assert.equal(
      evidenceRecord.finalDecision,
      "ESCALATE",
    );

    assert.equal(
      evidenceRecord.enforcementStatus,
      "escalated",
    );

    assert.equal(
      evidenceRecord.executionOutcome,
      "not_attempted",
    );

    assert.equal(
      decision.metadata?.delegationContractId,
      contract.contractId,
    );

    assert.equal(
      evidenceRecord.metadata?.delegationContractId,
      contract.contractId,
    );

    assert.equal(
      decision.metadata?.delegationDecision,
      "ESCALATE",
    );

    assert.equal(
      evidenceRecord.metadata?.delegationDecision,
      "ESCALATE",
    );

    assert.ok(
      decision.metadata?.delegationReasonCodes?.includes(
        "HUMAN_APPROVAL_REQUIRED",
      ),
    );

    assert.ok(
      evidenceRecord.metadata?.delegationReasonCodes?.includes(
        "HUMAN_APPROVAL_REQUIRED",
      ),
    );
  },
);

test(
  "TRACE 109 - forged child is blocked before side effect",
  async () => {
    const app =
      createRuntime();

    const contract =
      createContract();

    await assert.rejects(
      async () => {
        await app.registry.executeContractDelegated(
          "echo",
          {},
          {
            agentId: "parent",
          },
          contract,
          createGraph(),
          "task-109",
          "2026-09-17T12:00:00.000Z",
        );
      },
      /Contract delegate identity does not match execution context/i,
    );

    assert.equal(
      app.executions,
      0,
    );
  },
);

test(
  "TRACE 109 - contract scope blocks unknown tool before side effect",
  async () => {
    const app =
      createRuntime();

    const contract =
      createContract();

    await assert.rejects(
      async () => {
        await app.registry.executeContractDelegated(
          "unknown",
          {},
          {
            agentId: "child",
          },
          contract,
          createGraph(),
          "task-109",
          "2026-09-17T12:00:00.000Z",
        );
      },
      /outside the delegation contract scope/,
    );

    assert.equal(
      app.executions,
      0,
    );
  },
);
