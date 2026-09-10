import assert from "node:assert/strict";
import test from "node:test";

import {
  CanonicalSecuredToolExecutor,
  type ToolSecurityContext,
  type ToolSecurityPolicy,
} from "../src/tools/security";

function context(
  overrides: Partial<ToolSecurityContext> = {},
): ToolSecurityContext {
  return {
    workspaceId: "workspace-a",
    agentId: "agent-a",
    toolId: "tool-a",
    action: "tool.execute",
    traceId: "trace-a",
    decisionId: "decision-a",
    executionId: "execution-a",
    evidenceId: "evidence-a",
    riskScore: 10,
    ...overrides,
  };
}

function policy(
  overrides: Partial<ToolSecurityPolicy> = {},
): ToolSecurityPolicy {
  return {
    workspaceId: "workspace-a",
    allowedToolIds: ["tool-a"],
    maxRiskScore: 50,
    ...overrides,
  };
}

function makeSpyTool(id = "tool-a") {
  let calls = 0;
  const inputs: unknown[] = [];

  return {
    id,
    get calls() {
      return calls;
    },
    inputs,
    async execute(input: unknown) {
      calls += 1;
      inputs.push(input);
      return `TOOL_OK:${String(input)}`;
    },
  };
}

test("14C - ALLOW reaches exactly one tool execution", async () => {
  const executor =
    new CanonicalSecuredToolExecutor();

  const spy =
    makeSpyTool();

  const result =
    await executor.execute(
      context(),
      policy(),
      spy,
      "allow",
    );

  assert.equal(
    result,
    "TOOL_OK:allow",
  );

  assert.equal(
    spy.calls,
    1,
    "ALLOW must execute the tool exactly once",
  );
});

test("14C - BLOCK prevents tool execution", async () => {
  const executor =
    new CanonicalSecuredToolExecutor();

  const spy =
    makeSpyTool();

  await assert.rejects(
    executor.execute(
      context({
        toolId: "unknown-tool",
      }),
      policy(),
      spy,
      "blocked",
    ),
    /Tool execution BLOCK/i,
  );

  assert.equal(
    spy.calls,
    0,
    "BLOCK must never invoke the tool",
  );
});

test("14C - explicit blocklist prevents tool execution", async () => {
  const executor =
    new CanonicalSecuredToolExecutor();

  const spy =
    makeSpyTool();

  await assert.rejects(
    executor.execute(
      context(),
      policy({
        blockedToolIds: ["tool-a"],
      }),
      spy,
      "blocked",
    ),
    /Tool execution BLOCK/i,
  );

  assert.equal(
    spy.calls,
    0,
  );
});

test("14C - ESCALATE prevents tool execution", async () => {
  const executor =
    new CanonicalSecuredToolExecutor();

  const spy =
    makeSpyTool();

  await assert.rejects(
    executor.execute(
      context(),
      policy({
        escalationToolIds: ["tool-a"],
      }),
      spy,
      "approval-required",
    ),
    /Tool execution ESCALATE/i,
  );

  assert.equal(
    spy.calls,
    0,
    "ESCALATE must never invoke the tool",
  );
});

test("14C - high risk prevents tool execution", async () => {
  const executor =
    new CanonicalSecuredToolExecutor();

  const spy =
    makeSpyTool();

  await assert.rejects(
    executor.execute(
      context({
        riskScore: 91,
      }),
      policy({
        maxRiskScore: 50,
      }),
      spy,
      "high-risk",
    ),
    /Tool execution ESCALATE/i,
  );

  assert.equal(
    spy.calls,
    0,
  );
});

test("14C - cross-workspace request is blocked before tool execution", async () => {
  const executor =
    new CanonicalSecuredToolExecutor();

  const spy =
    makeSpyTool();

  await assert.rejects(
    executor.execute(
      context({
        workspaceId: "workspace-b",
      }),
      policy({
        workspaceId: "workspace-a",
      }),
      spy,
      "cross-workspace",
    ),
    /Tool execution BLOCK/i,
  );

  assert.equal(
    spy.calls,
    0,
  );
});

test("14C - tool identity mismatch is blocked before execution", async () => {
  const executor =
    new CanonicalSecuredToolExecutor();

  const spy =
    makeSpyTool("tool-attacker");

  await assert.rejects(
    executor.execute(
      context({
        toolId: "tool-canonical",
      }),
      policy({
        allowedToolIds: ["tool-canonical"],
      }),
      spy,
      "identity-tamper",
    ),
    /identity mismatch/i,
  );

  assert.equal(
    spy.calls,
    0,
    "Mismatched tool identity must never execute",
  );
});

test("14C - post-block recovery still permits later ALLOW", async () => {
  const executor =
    new CanonicalSecuredToolExecutor();

  const spy =
    makeSpyTool();

  await assert.rejects(
    executor.execute(
      context({
        toolId: "tool-unknown",
      }),
      policy(),
      spy,
      "blocked-first",
    ),
    /BLOCK/i,
  );

  assert.equal(
    spy.calls,
    0,
  );

  const recovery =
    await executor.execute(
      context(),
      policy(),
      spy,
      "recovery",
    );

  assert.equal(
    recovery,
    "TOOL_OK:recovery",
  );

  assert.equal(
    spy.calls,
    1,
    "Recovery ALLOW must execute exactly once",
  );
});
