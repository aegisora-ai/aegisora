import assert from "node:assert/strict";
import test from "node:test";

import {
  EnterpriseAlertEngine,
} from "../src/enterprise/alerts";

function rule(
  overrides: Record<string, unknown> = {},
) {
  return {
    ruleId:
      "rule-15b",

    workspaceId:
      "workspace-a",

    name:
      "High Risk Block",

    description:
      "Block/high-risk governance alert",

    source:
      "decision" as const,

    severity:
      "CRITICAL" as const,

    minRiskScore:
      80,

    requiredDecision:
      "BLOCK" as const,

    dedupeWindowMs:
      300_000,

    ...overrides,
  };
}

function event(
  overrides: Record<string, unknown> = {},
) {
  return {
    workspaceId:
      "workspace-a",

    source:
      "decision" as const,

    riskScore:
      95,

    decision:
      "BLOCK" as const,

    traceId:
      "trace-15b",

    decisionId:
      "decision-15b",

    executionId:
      "execution-15b",

    evidenceId:
      "evidence-15b",

    agentId:
      "agent-15b",

    ...overrides,
  };
}

test(
  "15B - rule creation and workspace lookup",
  () => {
    const engine =
      new EnterpriseAlertEngine();

    const created =
      engine.createRule(
        rule(),
      );

    assert.equal(
      created.ruleId,
      "rule-15b",
    );

    assert.ok(
      engine.getForWorkspace(
        "workspace-a",
        "rule-15b",
      ),
    );

    assert.equal(
      engine.getForWorkspace(
        "workspace-b",
        "rule-15b",
      ),
      undefined,
    );
  },
);

test(
  "15B - matching decision creates one alert match",
  () => {
    const engine =
      new EnterpriseAlertEngine();

    engine.createRule(
      rule(),
    );

    const matches =
      engine.evaluate(
        event(),
      );

    assert.equal(
      matches.length,
      1,
    );

    assert.equal(
      matches[0]?.severity,
      "CRITICAL",
    );

    assert.equal(
      matches[0]?.workspaceId,
      "workspace-a",
    );
  },
);

test(
  "15B - lower risk does not match",
  () => {
    const engine =
      new EnterpriseAlertEngine();

    engine.createRule(
      rule(),
    );

    const matches =
      engine.evaluate(
        event({
          riskScore:
            79,
        }),
      );

    assert.equal(
      matches.length,
      0,
    );
  },
);

test(
  "15B - decision mismatch does not match",
  () => {
    const engine =
      new EnterpriseAlertEngine();

    engine.createRule(
      rule(),
    );

    const matches =
      engine.evaluate(
        event({
          decision:
            "ALLOW",
        }),
      );

    assert.equal(
      matches.length,
      0,
    );
  },
);

test(
  "15B - cross-workspace event cannot trigger rule",
  () => {
    const engine =
      new EnterpriseAlertEngine();

    engine.createRule(
      rule(),
    );

    const matches =
      engine.evaluate(
        event({
          workspaceId:
            "workspace-b",
        }),
      );

    assert.equal(
      matches.length,
      0,
    );
  },
);

test(
  "15B - dedupe suppresses repeated identical alert",
  () => {
    const engine =
      new EnterpriseAlertEngine();

    engine.createRule(
      rule(),
    );

    const first =
      engine.evaluate(
        event(),
      );

    const second =
      engine.evaluate(
        event(),
      );

    assert.equal(
      first.length,
      1,
    );

    assert.equal(
      second.length,
      0,
    );
  },
);

test(
  "15B - disabled rule cannot fire",
  () => {
    const engine =
      new EnterpriseAlertEngine();

    engine.createRule(
      rule({
        enabled:
          false,
      }),
    );

    const matches =
      engine.evaluate(
        event(),
      );

    assert.equal(
      matches.length,
      0,
    );
  },
);

test(
  "15B - duplicate rule identity is rejected",
  () => {
    const engine =
      new EnterpriseAlertEngine();

    engine.createRule(
      rule(),
    );

    assert.throws(
      () =>
        engine.createRule(
          rule(),
        ),
      /already exists/i,
    );
  },
);

console.log(
  "15B alert engine tests loaded.",
);
