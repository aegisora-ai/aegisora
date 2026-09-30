import assert from "node:assert/strict";

import {
  verifyExecutionBinding,
  verifyExternalDecision,
  type ExternalDecisionBinding,
  type ExternalDecisionEvent,
} from "../src/enforcement/external-decision-binding";

import {
  ToolRegistry,
} from "../src/tools/tool-registry";

import type {
  RuntimeTool,
} from "../src/tools/tool";
import * as nodeFs from "node:fs";
import * as nodePath from "node:path";

function result(
  name: string,
  passed: boolean,
  details: Record<string, unknown> = {},
) {
  console.log(
    `${passed ? "[PASS]" : "[FAIL]"} ${name}`,
  );

  return {
    name,
    passed,
    details,
  };
}

// Fallback: when the env vars are not set, read the committed signed fixtures.
// Returns undefined when the file is missing, so the "fixtures not supplied" guard still fails closed.
function loadFixtureFile(name: string): string | undefined {
  const dir =
    typeof __dirname !== "undefined"
      ? __dirname
      : nodePath.join(process.cwd(), "test");
  const file = nodePath.join(dir, "fixtures", name);
  if (!nodeFs.existsSync(file)) {
    return undefined;
  }
  return nodeFs.readFileSync(file, "utf8").replace(/^\uFEFF/, "").trim();
}
async function main(): Promise<void> {
  const results: Array<Record<string, unknown>> = [];

  const fixtureAEvent =
    process.env.AEGISORA_FIXTURE_A_EVENT ??
    loadFixtureFile("3.0-13-fixture-a.json");

  const fixtureBEvent =
    process.env.AEGISORA_FIXTURE_B_EVENT ??
    loadFixtureFile("3.0-13-fixture-b.json");

  const fixtureA =
    fixtureAEvent
      ? JSON.parse(fixtureAEvent)
      : undefined;

  const fixtureB =
    fixtureBEvent
      ? JSON.parse(fixtureBEvent)
      : undefined;

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    " AEGISORA 3.0-13 EXTERNAL DECISION BINDING E2E",
  );
  console.log(
    "============================================================",
  );

  if (!fixtureA || !fixtureB) {
    throw new Error(
      "Full signed Fixture A/B events were not supplied.",
    );
  }

  const eventA =
    fixtureA.event as ExternalDecisionEvent;

  const bindingA: ExternalDecisionBinding = {
    event: eventA,
    decisionRef: fixtureA.decision_ref,
    actionBindingToolHash:
      fixtureA.action_binding_tool_hash,
    actionBindingArgsHash:
      fixtureA.action_binding_args_hash,
    actionBindingAgentId:
      fixtureA.action_binding_agent_id,
  };

  const eventB =
    fixtureB.event as ExternalDecisionEvent;

  const bindingB: ExternalDecisionBinding = {
    event: eventB,
    decisionRef: fixtureB.decision_ref,
    actionBindingToolHash:
      fixtureB.action_binding_tool_hash,
    actionBindingArgsHash:
      fixtureB.action_binding_args_hash,
    actionBindingAgentId:
      fixtureB.action_binding_agent_id,
  };

  console.log("");
  console.log("[1] External signature verification");

  const verifyA =
    verifyExternalDecision(bindingA);

  results.push(
    result(
      "Fixture A signature/event verification",
      verifyA.valid,
      verifyA,
    ),
  );

  const verifyB =
    verifyExternalDecision(bindingB);

  results.push(
    result(
      "Fixture B signature/event verification",
      verifyB.valid,
      verifyB,
    ),
  );

  assert.equal(
    verifyA.valid,
    true,
    verifyA.reason,
  );

  assert.equal(
    verifyB.valid,
    true,
    verifyB.reason,
  );

  console.log("");
  console.log("[2] Fixture A/B structural separation");

  assert.equal(
    bindingA.actionBindingToolHash,
    bindingB.actionBindingToolHash,
  );

  assert.notEqual(
    bindingA.actionBindingArgsHash,
    bindingB.actionBindingArgsHash,
  );

  results.push(
    result(
      "Same tool hash / different args hash",
      true,
      {
        toolHash:
          bindingA.actionBindingToolHash,
        fixtureAArgsHash:
          bindingA.actionBindingArgsHash,
        fixtureBArgsHash:
          bindingB.actionBindingArgsHash,
      },
    ),
  );

  console.log("");
  console.log("[3] Direct execution binding");

  const mutatedContext = {
    agentId:
      bindingA.actionBindingAgentId,
    tool:
      "fixture.tool.read",
    args: {
      path:
        "fixture-a-mutated.txt",
      mode:
        "read",
      requested_by:
        "mutated-context",
    },
  };

  const mutated =
    verifyExecutionBinding(
      bindingA,
      mutatedContext,
    );

  results.push(
    result(
      "Fixture A rejects mutated execution context",
      !mutated.valid,
      mutated,
    ),
  );

  assert.equal(
    mutated.valid,
    false,
  );

  assert.equal(
    mutated.toolHashValid,
    true,
  );

  assert.equal(
    mutated.argsHashValid,
    false,
  );

  console.log("");
  console.log("[4] Real ToolRegistry execution boundary");

  const executionToken =
    Symbol(
      "aegisora.external-decision-e2e",
    );

  const registry =
    new ToolRegistry(
      executionToken,
    );

  let toolCalls = 0;

  const sendEmail: RuntimeTool = {
    name: "send_email",
    description:
      "Test email side-effect boundary.",
    execute: async (
      _input,
      _context,
    ) => {
      toolCalls++;
      return "EMAIL-SIDE-EFFECT";
    },
  };

  registry.register(
    sendEmail,
  );

  const fakeEnforcement = {
    configureToolRegistry: (_registry: unknown) => {},
    enforce: async () => ({
      decision: "ALLOW" as const,
      reason: "external decision test",
      riskScore: 0,
      threats: [],
      permission: "allow" as const,
      policy: "allow" as const,
      security: "allow" as const,
      traceId: crypto.randomUUID(),
      decisionId: crypto.randomUUID(),
      executionId: crypto.randomUUID(),
      evidenceId: crypto.randomUUID(),
      enforcementStatus:
        "not_executed" as const,
      executionOutcome:
        "not_attempted" as const,
    }),
  };

  registry.setEnforcementGate(
    fakeEnforcement as any,
  );

  console.log("");
  console.log("[4A] Attempting mutated A → B execution");

  let blocked = false;

  try {
    await registry.authorize(
      bindingA.actionBindingAgentId,
      "send_email",
      mutatedContext.args,
      {
        externalDecision:
          bindingA,
      },
    );
  }
  catch (error) {
    blocked = true;

    console.log(
      "BLOCK REASON:",
      error instanceof Error
        ? error.message
        : String(error),
    );
  }

  results.push(
    result(
      "A decision cannot authorize B arguments",
      blocked,
      {
        providerOrToolCalls:
          toolCalls,
      },
    ),
  );

  assert.equal(
    blocked,
    true,
  );

  assert.equal(
    toolCalls,
    0,
    "Tool must not execute when binding fails.",
  );

  console.log("");
  console.log(
    "[4B] Direct execution without authorization",
  );

  let directBlocked = false;

  try {
    await registry.execute(
      "send_email",
      mutatedContext.args,
      {
        agentId:
          bindingA.actionBindingAgentId,
      },
      executionToken,
    );
  }
  catch (error) {
    directBlocked = true;

    console.log(
      "DIRECT EXECUTION BLOCK:",
      error instanceof Error
        ? error.message
        : String(error),
    );
  }

  results.push(
    result(
      "Direct ToolRegistry execution remains blocked",
      directBlocked,
    ),
  );

  assert.equal(
    directBlocked,
    true,
  );

  assert.equal(
    toolCalls,
    0,
  );

  const passed =
    results.every(
      item => item.passed === true,
    );

  const report = {
    test: "3.0-13-external-decision-binding-e2e",
    timestamp:
      new Date().toISOString(),
    passed,
    results,
  };

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    ` FINAL RESULT: ${passed ? "PASS" : "FAIL"}`,
  );
  console.log(
    "============================================================",
  );

  console.log(
    JSON.stringify(
      report,
      null,
      2,
    ),
  );

  if (!passed) {
    throw new Error(
      "External decision binding test failed.",
    );
  }
}

main().catch(error => {
  console.error("");
  console.error(
    "3.0-13 EXTERNAL DECISION BINDING: FAIL",
  );
  console.error(
    error instanceof Error
      ? error.stack
      : error,
  );
  process.exitCode = 1;
});
