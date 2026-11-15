import assert from "node:assert/strict";

import { AgentExecutor } from "../src/execution/executor";
import { RuntimeContext } from "../src/context/runtime-context";
import { PermissionEngine } from "../src/permissions";
import { EnforcementGate } from "../src/enforcement";

import {
  ProviderExecutionGateway
} from "../src/providers/provider-execution-gateway";

import {
  ProviderRouter
} from "../src/providers/provider-router";

import {
  BaseProvider
} from "../src/providers/base-provider";

import type {
  ProviderRequest,
  ProviderResponse
} from "../src/providers/base-provider";

import {
  TaskManager
} from "../src/tasks";

import {
  ToolRegistry,
  ToolSelector,
  EchoTool
} from "../src/tools";

import {
  PlannerEngine
} from "../src/planner";

import {
  GoalManager
} from "../src/goal";

import {
  Agent
} from "../src/agent";


class CountingProvider extends BaseProvider {

  public readonly name = "test";

  public calls = 0;

  async generate(
    request: ProviderRequest,
    _context?: unknown
  ): Promise<ProviderResponse> {

    this.calls++;

    console.log(
      "!!! COUNTING PROVIDER CALLED !!!",
      this.calls
    );

    return this.buildResponse(
      "test",
      request.model ?? "test-model",
      `TEST:${request.prompt}`
    );
  }
}


/**
 * Force the security layer to return BLOCK while preserving
 * the real RuntimeContext -> EnforcementGate -> ProviderGateway
 * execution path.
 */
function installSecurityBlock(
  context: RuntimeContext
) {

  const security = context.security as any;

  security.check = () => ({
    decision: "block",
    reason:
      "TRACE 55: synthetic security violation"
  });

  console.log(
    "Installed synthetic security BLOCK"
  );
}


async function main() {

  console.log("");
  console.log("==================================================");
  console.log(" TRACE 55 - REAL EXECUTOR PROVIDER BLOCK BOUNDARY");
  console.log("==================================================");


  const context =
    new RuntimeContext();


  const permissions =
    new PermissionEngine();


  const provider =
    new CountingProvider();


  const router =
    new ProviderRouter();


  router.register(
    "openai",
    provider
  );


  const gateway =
    new ProviderExecutionGateway(
      context,
      router,
      undefined,
      permissions
    );


  const goals =
    new GoalManager();


  const planner =
    new PlannerEngine(
      goals
    );


  const tasks =
    new TaskManager();


  const toolExecutionToken =
    Symbol("trace55.tool.execution");

  const tools =
    new ToolRegistry(
      toolExecutionToken
    );

  tools.register(
    new EchoTool()
  );

  const enforcement =
    new EnforcementGate(
      context,
      permissions
    );

  tools.setEnforcementGate(
    enforcement
  );

  const selector =
    new ToolSelector(
      tools
    );


  const executor =
    new AgentExecutor(
      tasks,
      selector,
      planner,
      context,
      tools,
      toolExecutionToken,
      gateway
    );


  const agentId =
    "trace55-agent";

  const agent =
    new Agent({
      id: agentId,
      name: agentId
    });

  context.agentRegistry.register(
    agent
  );


  console.log("");
  console.log("=== 55A - VERIFY PROVIDER REGISTRATION ===");

  assert.equal(
    gateway.has("openai"),
    true,
    "OpenAI provider must be registered"
  );

  console.log(
    "Providers:",
    gateway.list()
  );

  console.log(
    "PASS: provider registered"
  );


  console.log("");
  console.log("=== 55B - INSTALL SECURITY BLOCK ===");

  installSecurityBlock(
    context
  );

  console.log(
    "PASS: synthetic security BLOCK installed"
  );


  console.log("");
  console.log("=== 55C - CREATE REAL GOAL ===");

  const goal =
    goals.create(
      agent.id,
      "Attempt a provider-backed step that must be blocked"
    );

  console.log(
    "Goal ID:",
    goal.id
  );

  assert.equal(
    goal.agentId,
    agent.id
  );

  console.log(
    "PASS: real goal created"
  );


  console.log("");
  console.log("=== 55D - BUILD REAL EXECUTION PLAN ===");

  const plan =
    planner.createFromGoal(
      goal.id
    );

  console.log(
    "Plan ID:",
    plan.id
  );

  console.log(
    "Plan steps:",
    plan.steps.length
  );

  assert.ok(
    plan.steps.length > 0,
    "Planner must create at least one step"
  );

  console.log(
    "PASS: real execution plan created"
  );


  console.log("");
  console.log("=== 55E - EXECUTE REAL AGENT EXECUTOR ===");

  let executionError:
    unknown = undefined;

  let result:
    any = undefined;

  try {

    result =
      await executor.execute(
        agent,
        plan
      );

  } catch (error) {

    executionError =
      error;

    console.log(
      "Executor threw:",
      error instanceof Error
        ? error.message
        : error
    );

  }


  console.log("");
  console.log(
    "Provider calls after execution:",
    provider.calls
  );


  console.log("");
  console.log("=== 55F - PROVIDER MUST NOT BE CALLED ===");

  assert.equal(
    provider.calls,
    0,
    "BLOCKED execution MUST NOT call provider.generate()"
  );

  console.log(
    "PASS: provider.generate() was never called"
  );


  console.log("");
  console.log("=== 55G - REAL DECISION TRACE ===");

  const decisions =
    context.decisionStore.getAll();

  console.log(
    "Decision records:",
    decisions.length
  );

  console.log(
    JSON.stringify(
      decisions,
      null,
      2
    )
  );

  assert.ok(
    decisions.length > 0,
    "At least one decision trace must be persisted"
  );

  console.log(
    "PASS: decision trace persisted"
  );


  console.log("");
  console.log("=== 55H - BLOCK DECISION VALIDATION ===");

  const blocked =
    decisions.filter(
      record =>
        record.decision === "block"
    );

  console.log(
    "BLOCK records:",
    blocked.length
  );

  assert.ok(
    blocked.length > 0,
    "At least one BLOCK decision must be persisted"
  );

  const block =
    blocked[0];

  assert.ok(
    block,
    "BLOCK trace must exist"
  );

  console.log(
    "BLOCK trace:",
    JSON.stringify(
      block,
      null,
      2
    )
  );

  assert.equal(
    block.agentId,
    agent.id,
    "BLOCK trace must belong to executing agent"
  );

  assert.equal(
    block.decision,
    "block",
    "Decision trace must record lowercase block"
  );

  assert.equal(
    block.action,
    "provider.generate",
    "BLOCK trace must record the provider generation action (the provider is governed before tool input exists)"
  );

  assert.equal(
    block.reason,
    "TRACE 55: synthetic security violation",
    "BLOCK trace must preserve enforcement reason"
  );

  assert.equal(
    block.riskScore,
    90,
    "Security BLOCK must preserve risk score >= 90"
  );

  assert.ok(
    block.metadata,
    "BLOCK trace must contain metadata"
  );

  assert.equal(
    block.metadata?.resourceType,
    "provider",
    "BLOCK metadata must identify provider resource (the provider is governed before tool input exists)"
  );

  assert.equal(
    block.metadata?.tool,
    "echo",
    "BLOCK metadata must identify selected tool"
  );

  console.log(
    "PASS: BLOCK decision is fully observable"
  );


  console.log("");
  console.log("=== 55I - EXECUTION TERMINATION ===");

  if (result !== undefined) {

    console.log(
      "Execution result:",
      JSON.stringify(
        result,
        null,
        2
      )
    );

  }

  if (executionError !== undefined) {

    console.log(
      "Execution terminated after enforcement."
    );

  }

  assert.equal(
    provider.calls,
    0,
    "Final safety invariant: blocked execution cannot reach provider"
  );

  assert.ok(
    executionError !== undefined,
    "Blocked execution must terminate before provider execution"
  );

  console.log(
    "PASS: execution terminated at enforcement boundary"
  );


  console.log("");
  console.log("=== 55J - END-TO-END SECURITY INVARIANT ===");

  console.log(
    "Security decision: BLOCK"
  );

  console.log(
    "Decision trace persisted: YES"
  );

  console.log(
    "Provider calls:",
    provider.calls
  );

  console.log(
    "Provider boundary crossed: NO"
  );

  assert.equal(
    provider.calls,
    0
  );

  assert.ok(
    blocked.length >= 1
  );

  console.log(
    "PASS: BLOCK -> AUDIT -> NO PROVIDER EXECUTION"
  );


  console.log("");
  console.log("==================================================");
  console.log(" TRACE 55 COMPLETE - ALL ASSERTIONS PASSED");
  console.log("==================================================");
}


main().catch(error => {

  console.error("");
  console.error("==================================================");
  console.error(" TRACE 55 FAILED");
  console.error("==================================================");

  console.error(
    error instanceof Error
      ? error.stack
      : error
  );

  process.exitCode = 1;

});
