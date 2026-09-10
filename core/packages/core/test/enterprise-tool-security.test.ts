import assert from "node:assert/strict";
import test from "node:test";

import {
  ToolSecurityEvaluator,
  type ToolSecurityContext,
  type ToolSecurityPolicy,
} from "../../runtime/src/tools/security";

import {
  evaluateToolSecurity,
} from "../../runtime/src/tools/security";

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

test("14B - allowlisted tool is allowed", () => {
  const result =
    evaluateToolSecurity(
      context(),
      policy(),
    );

  assert.equal(
    result.decision,
    "ALLOW",
  );

  assert.equal(
    result.allowed,
    true,
  );
});

test("14B - unknown tool is blocked", () => {
  const result =
    evaluateToolSecurity(
      context({
        toolId: "tool-unknown",
      }),
      policy(),
    );

  assert.equal(
    result.decision,
    "BLOCK",
  );

  assert.equal(
    result.allowed,
    false,
  );
});

test("14B - explicitly blocked tool is blocked", () => {
  const result =
    evaluateToolSecurity(
      context(),
      policy({
        blockedToolIds: ["tool-a"],
      }),
    );

  assert.equal(
    result.decision,
    "BLOCK",
  );

  assert.equal(
    result.allowed,
    false,
  );
});

test("14B - approval-required tool escalates", () => {
  const result =
    evaluateToolSecurity(
      context(),
      policy({
        escalationToolIds: ["tool-a"],
      }),
    );

  assert.equal(
    result.decision,
    "ESCALATE",
  );

  assert.equal(
    result.allowed,
    false,
  );
});

test("14B - high-risk tool escalates", () => {
  const result =
    evaluateToolSecurity(
      context({
        riskScore: 91,
      }),
      policy({
        maxRiskScore: 50,
      }),
    );

  assert.equal(
    result.decision,
    "ESCALATE",
  );

  assert.equal(
    result.allowed,
    false,
  );
});

test("14B - cross-workspace tool request is blocked", () => {
  const result =
    evaluateToolSecurity(
      context({
        workspaceId: "workspace-b",
      }),
      policy({
        workspaceId: "workspace-a",
      }),
    );

  assert.equal(
    result.decision,
    "BLOCK",
  );

  assert.equal(
    result.allowed,
    false,
  );
});

test("14B - canonical identity is preserved", () => {
  const result =
    evaluateToolSecurity(
      context({
        toolId: "tool-canonical",
        agentId: "agent-canonical",
        workspaceId:
          "workspace-canonical",
        riskScore: 33,
      }),
      policy({
        workspaceId:
          "workspace-canonical",
        allowedToolIds: [
          "tool-canonical",
        ],
      }),
    );

  assert.equal(
    result.toolId,
    "tool-canonical",
  );

  assert.equal(
    result.agentId,
    "agent-canonical",
  );

  assert.equal(
    result.workspaceId,
    "workspace-canonical",
  );

  assert.equal(
    result.riskScore,
    33,
  );
});

test("14B - evaluator returns the same security result contract", () => {
  const evaluator =
    new ToolSecurityEvaluator();

  const result =
    evaluator.evaluate(
      context(),
      policy(),
    );

  assert.equal(
    result.decision,
    "ALLOW",
  );

  assert.equal(
    result.allowed,
    true,
  );
});
