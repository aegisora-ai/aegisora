import assert from "node:assert/strict";

import {
  DelegationAuthorityContractEngine,
} from "@aegisora/core";

import type {
  CompromiseSimulationGraph,
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

import type {
  EnforcementResult,
} from "../src/enforcement/types";

import {
  ToolRegistry,
} from "../src/tools/tool-registry";

import type {
  ToolContext,
} from "../src/tools/tool";

class CountingEnforcementGate extends EnforcementGate {
  enforceCalls = 0;
  lastResult?: EnforcementResult;
  beforeEnforce?: () => Promise<void>;

  override async enforce(
    request: Parameters<EnforcementGate["enforce"]>[0],
  ): Promise<EnforcementResult> {
    this.enforceCalls += 1;
    if (this.beforeEnforce) {
      await this.beforeEnforce();
    }
    const result = await super.enforce(request);
    this.lastResult = structuredClone(result);
    return result;
  }
}

function authorityGraph(): CompromiseSimulationGraph {
  // RuntimeContext requires every node and edge to belong to one workspace.
  // This is the workspace-a portion of the core contract fixture; the
  // workspace-b external node is intentionally excluded.
  return {
    nodes: [
      { id: "agent:a", workspaceId: "workspace-a", type: "agent" },
      { id: "agent:b", workspaceId: "workspace-a", type: "agent" },
      { id: "agent:c", workspaceId: "workspace-a", type: "agent" },
      { id: "identity:a", workspaceId: "workspace-a", type: "identity" },
      { id: "identity:b", workspaceId: "workspace-a", type: "identity" },
      { id: "identity:c", workspaceId: "workspace-a", type: "identity" },
      { id: "capability:reports", workspaceId: "workspace-a", type: "capability" },
      { id: "tool:reports", workspaceId: "workspace-a", type: "tool" },
      { id: "provider:internal", workspaceId: "workspace-a", type: "provider" },
      { id: "resource:reports", workspaceId: "workspace-a", type: "resource", environment: "development" },
    ],
    edges: [
      { id: "a1", workspaceId: "workspace-a", from: "agent:a", to: "identity:a", type: "IDENTIFIED_AS" },
      { id: "a2", workspaceId: "workspace-a", from: "identity:a", to: "capability:reports", type: "GRANTS" },
      { id: "a3", workspaceId: "workspace-a", from: "capability:reports", to: "tool:reports", type: "USES" },
      { id: "a4", workspaceId: "workspace-a", from: "tool:reports", to: "provider:internal", type: "ROUTES_TO" },
      { id: "a5", workspaceId: "workspace-a", from: "provider:internal", to: "resource:reports", type: "REACHES" },
      { id: "b1", workspaceId: "workspace-a", from: "agent:b", to: "identity:b", type: "IDENTIFIED_AS" },
      { id: "b2", workspaceId: "workspace-a", from: "identity:b", to: "capability:reports", type: "GRANTS" },
      { id: "b3", workspaceId: "workspace-a", from: "capability:reports", to: "tool:reports", type: "USES" },
      { id: "b4", workspaceId: "workspace-a", from: "tool:reports", to: "provider:internal", type: "ROUTES_TO" },
      { id: "b5", workspaceId: "workspace-a", from: "provider:internal", to: "resource:reports", type: "REACHES" },
      { id: "b6", workspaceId: "workspace-a", from: "agent:b", to: "identity:b", type: "REQUIRES_APPROVAL" },
      { id: "c1", workspaceId: "workspace-a", from: "agent:c", to: "identity:c", type: "IDENTIFIED_AS" },
      { id: "d1", workspaceId: "workspace-a", from: "agent:b", to: "agent:c", type: "DELEGATES_TO" },
    ],
  };
}

function issueContract(options: {
  contractId: string;
  delegateAgentId?: string;
  requiresHumanApproval?: boolean;
  workspaceId?: string;
}) {
  const now = Date.now();
  const engine = new DelegationAuthorityContractEngine();
  return engine.issue({
    workspaceId: options.workspaceId ?? "workspace-a",
    contractId: options.contractId,
    issuerAgentId: "a",
    delegateAgentId: options.delegateAgentId ?? "b",
    taskId: "task-42",
    scope: {
      capabilityIds: ["capability:reports"],
      toolIds: ["tool:reports"],
      providerIds: ["provider:internal"],
      resourceIds: ["resource:reports"],
    },
    issuedAt: new Date(now - 60_000).toISOString(),
    expiresAt: new Date(now + 120_000).toISOString(),
    // The canonical fixture contains agent:b -> agent:c. Match the
    // proven core positive case: bounded further delegation at depth 2.
    maxDelegationDepth: 2,
    allowFurtherDelegation: true,
    ...(options.requiresHumanApproval ? { requiresHumanApproval: true } : {}),
  });
}

function createHarness() {
  const context = new RuntimeContext();
  for (const agentId of ["a", "b", "c"]) {
    context.agentRegistry.register(new Agent({ id: agentId, name: agentId }));
  }
  context.configureAuthorityContext({
    workspaceId: "workspace-a",
    graph: authorityGraph(),
  });

  const gate = new CountingEnforcementGate(context);
  gate.configureAuthorityAwareExecutionFromRuntimeContext();

  const executionToken = Symbol("trace108-execution");
  const registry = new ToolRegistry(executionToken);
  registry.setEnforcementGate(gate);

  let executions = 0;
  let receivedInput: unknown;
  let receivedContext: ToolContext | undefined;
  let workspaceBeforeHandlerMutation: unknown;

  registry.register({
    name: "reports",
    description: "Trace 108 contract-governed report tool",
    async execute(input, toolContext) {
      executions += 1;
      receivedInput = structuredClone(input);
      receivedContext = toolContext;
      workspaceBeforeHandlerMutation = toolContext.metadata?.authorityWorkspaceId;
      if (toolContext.metadata) {
        // Simulate a handler trying to alter metadata after authorization.
        toolContext.metadata.authorityWorkspaceId = "workspace-attacker";
      }
      return input;
    },
  });

  return {
    context,
    gate,
    registry,
    executionToken,
    get executions() { return executions; },
    get receivedInput() { return receivedInput; },
    get receivedContext() { return receivedContext; },
    get workspaceBeforeHandlerMutation() { return workspaceBeforeHandlerMutation; },
  };
}

async function testSingleCanonicalEnforcementAndSnapshot(): Promise<void> {
  console.log("[108A] SINGLE CANONICAL ENFORCEMENT + SNAPSHOT");
  const harness = createHarness();
  const contract = issueContract({ contractId: "trace108-single-allow" });

  let signalStarted!: () => void;
  let release!: () => void;
  const started = new Promise<void>((resolve) => { signalStarted = resolve; });
  harness.gate.beforeEnforce = async () => {
    signalStarted();
    await new Promise<void>((resolve) => { release = resolve; });
  };

  const callerInput = { reportId: "authorized-before-mutation" };
  const pending = harness.registry.executeContractDelegated(
    "reports",
    callerInput,
    { agentId: "b" },
    contract,
    // Malicious/empty caller graph must be ignored.
    { nodes: [], edges: [] } as CompromiseSimulationGraph,
    "task-42",
    // Stale caller clock must be ignored in favor of runtime time.
    "2000-01-01T00:00:00.000Z",
  );

  let startTimeout: ReturnType<typeof setTimeout> | undefined;
  await Promise.race([
    started,
    new Promise<void>((_resolve, reject) => {
      startTimeout = setTimeout(
        () => reject(new Error("Canonical ALLOW enforcement did not start.")),
        5000,
      );
    }),
  ]);
  if (startTimeout) clearTimeout(startTimeout);

  callerInput.reportId = "attacker-substituted-input";
  release();
  const result = await pending;

  assert.deepEqual(result, { reportId: "authorized-before-mutation" });
  assert.deepEqual(harness.receivedInput, { reportId: "authorized-before-mutation" });
  assert.equal(harness.executions, 1);
  assert.equal(harness.gate.enforceCalls, 1);
  assert.ok(harness.gate.lastResult);
  assert.equal(harness.gate.lastResult.decision, "ALLOW");
  assert.ok(harness.gate.lastResult.continuitySeal);

  const executionContext = harness.receivedContext;
  assert.ok(executionContext);
  assert.equal(executionContext.traceId, harness.gate.lastResult.traceId);
  assert.equal(executionContext.decisionId, harness.gate.lastResult.decisionId);
  assert.equal(executionContext.executionId, harness.gate.lastResult.executionId);
  assert.equal(executionContext.evidenceId, harness.gate.lastResult.evidenceId);
  assert.equal(executionContext.metadata?.delegationContractId, contract.contractId);
  assert.equal(executionContext.metadata?.delegationContractHash, contract.contractHash);
  assert.equal(executionContext.metadata?.delegationDecision, "ALLOW");
  assert.equal(executionContext.metadata?.delegationObservedDepth, 1);
  assert.equal(executionContext.metadata?.delegationTaskId, "task-42");
  assert.equal(harness.workspaceBeforeHandlerMutation, "workspace-a");
  assert.equal(executionContext.metadata?.authorityWorkspaceId, "workspace-attacker");

  console.log("PASS: one normal enforcement call.");
  console.log("PASS: caller graph and clock ignored.");
  console.log("PASS: input snapshot preserved through async enforcement.");
  console.log("PASS: private execution identity preserved.");
  console.log("PASS: handler metadata mutation did not corrupt reconciliation.");
}

async function testDelegationBlockPreventsExecution(): Promise<void> {
  console.log("[108B] DELEGATION BLOCK");
  const harness = createHarness();
  const contract = issueContract({
    contractId: "trace108-invalid-delegate",
    delegateAgentId: "attacker-agent",
  });

  await assert.rejects(
    () => harness.registry.executeContractDelegated(
      "reports",
      { reportId: "blocked" },
      { agentId: "b" },
      contract,
      { nodes: [], edges: [] } as CompromiseSimulationGraph,
      "task-42",
      "2000-01-01T00:00:00.000Z",
    ),
    /DELEGATION_CONTRACT:BLOCK/i,
  );
  assert.equal(harness.executions, 0);
  assert.equal(harness.gate.enforceCalls, 0);
  console.log("PASS: BLOCK prevents handler execution.");
}

async function testDelegationEscalationPreventsExecution(): Promise<void> {
  console.log("[108C] DELEGATION ESCALATE");
  const harness = createHarness();
  const contract = issueContract({
    contractId: "trace108-human-approval",
    requiresHumanApproval: true,
  });

  await assert.rejects(
    () => harness.registry.executeContractDelegated(
      "reports",
      { reportId: "approval-required" },
      { agentId: "b" },
      contract,
      { nodes: [], edges: [] } as CompromiseSimulationGraph,
      "task-42",
      "2000-01-01T00:00:00.000Z",
    ),
    /DELEGATION_CONTRACT:ESCALATE/i,
  );
  assert.equal(harness.executions, 0);
  assert.equal(harness.gate.enforceCalls, 0);
  console.log("PASS: ESCALATE prevents handler execution.");
}

async function testTaskBindingMismatchBlocks(): Promise<void> {
  console.log("[108D] TASK BINDING MISMATCH");
  const harness = createHarness();
  const contract = issueContract({ contractId: "trace108-task-mismatch" });

  await assert.rejects(
    () => harness.registry.executeContractDelegated(
      "reports",
      { reportId: "wrong-task" },
      { agentId: "b" },
      contract,
      { nodes: [], edges: [] } as CompromiseSimulationGraph,
      "attacker-task",
      "2000-01-01T00:00:00.000Z",
    ),
    /DELEGATION_CONTRACT:BLOCK/i,
  );
  assert.equal(harness.executions, 0);
  assert.equal(harness.gate.enforceCalls, 0);
  console.log("PASS: task mismatch blocks before tool execution.");
}


async function testCallerAuthorityInputsAreIgnored(): Promise<void> {
  console.log("[108E] CALLER GRAPH / WORKSPACE / CLOCK SUBSTITUTION");
  const harness = createHarness();
  const contract = issueContract({ contractId: "trace108-canonical-context" });

  const result = await harness.gate.enforceDelegationContract({
    contract,
    graph: { nodes: [], edges: [] } as CompromiseSimulationGraph,
    workspaceId: "workspace-attacker",
    taskId: "task-42",
    now: "2000-01-01T00:00:00.000Z",
    request: {
      agentId: "b",
      resourceType: "tool",
      tool: "reports",
      action: "tool.execute",
      input: { reportId: "canonical-context" },
      metadata: { delegated: true },
    },
  });

  assert.equal(result.decision, "ALLOW");
  assert.equal(harness.gate.enforceCalls, 1);
  assert.ok(result.continuitySeal);
  console.log("PASS: caller graph ignored in favor of RuntimeContext graph.");
  console.log("PASS: caller workspace ignored in favor of RuntimeContext workspace.");
  console.log("PASS: caller clock ignored in favor of runtime clock.");
}

async function testReceiptTamperingReplayAndSealBinding(): Promise<void> {
  console.log("[108F] RECEIPT TAMPERING + REPLAY + SEAL BINDING");
  const harness = createHarness();
  const input = { reportId: "receipt-replay-test" };
  const receipt = await harness.registry.authorize(
    "b",
    "reports",
    input,
    { authorityWorkspaceId: "workspace-a" },
  );

  assert.equal(Object.isFrozen(receipt), true);
  assert.equal(Object.isFrozen(receipt.enforcement), true);
  assert.equal(Reflect.set(receipt.enforcement, "decision", "BLOCK"), false);
  assert.ok(receipt.continuitySeal);
  assert.equal(harness.gate.enforceCalls, 1);

  const result = await harness.registry.execute(
    "reports",
    input,
    { agentId: "b", metadata: { authorityWorkspaceId: "workspace-a" } },
    harness.executionToken,
    receipt,
  );
  assert.deepEqual(result, input);
  assert.equal(harness.executions, 1);

  await assert.rejects(
    () => harness.registry.execute(
      "reports",
      input,
      { agentId: "b", metadata: { authorityWorkspaceId: "workspace-a" } },
      harness.executionToken,
      receipt,
    ),
    /already been consumed/i,
  );
  assert.equal(harness.executions, 1);
  assert.equal(harness.gate.enforceCalls, 1);
  console.log("PASS: public receipt is frozen.");
  console.log("PASS: private receipt binding survives handler metadata mutation.");
  console.log("PASS: receipt replay prevented.");
}

async function main(): Promise<void> {
  console.log("\n==================================================");
  console.log(" TRACE 108 - CANONICAL CONTRACT DELEGATION");
  console.log("==================================================");
  await testSingleCanonicalEnforcementAndSnapshot();
  await testDelegationBlockPreventsExecution();
  await testDelegationEscalationPreventsExecution();
  await testTaskBindingMismatchBlocks();
  await testCallerAuthorityInputsAreIgnored();
  await testReceiptTamperingReplayAndSealBinding();
  console.log("\n==================================================");
  console.log(" TRACE 108 - ALL ASSERTIONS PASSED");
  console.log("==================================================");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});