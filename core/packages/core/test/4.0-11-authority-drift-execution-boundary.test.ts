import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  AuthorityDriftExecutionBoundary,
} from "../src/enterprise/authority-drift-execution-boundary";

import {
  AuthorityDriftEnforcementEngine,
} from "../src/enterprise/authority-drift-enforcement";

import type {
  AuthorityDriftResult,
} from "../src/enterprise/authority-drift";

function resultFor(
  severity:
    | "NONE"
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL",
  action:
    | "MONITOR"
    | "ESCALATE"
    | "BLOCK"
    | "CONTAIN",
): AuthorityDriftResult {
  return {
    workspaceId: "workspace-a",
    agentId: "finance",

    approved: {
      blastRadius: 10,
      level: "LOW",
      reachableResources: 1,
      sensitiveResources: 0,
      productionResources: 1,
      totalPaths: 1,
      criticalPaths: 0,
    },

    observed: {
      blastRadius: 90,
      level: "CRITICAL",
      reachableResources: 4,
      sensitiveResources: 2,
      productionResources: 2,
      totalPaths: 5,
      criticalPaths: severity === "CRITICAL" ? 2 : 0,
    },

    pathChanges: [],

    impact: {
      newReachableResources: [
        "resource:new-a",
      ],

      newSensitiveResources:
        severity === "NONE" ||
        severity === "LOW"
          ? []
          : [
              "resource:customer-db",
            ],

      newProductionResources:
        severity === "NONE" ||
        severity === "LOW"
          ? []
          : [
              "resource:production-db",
            ],

      newPaths: [],

      newCriticalPaths:
        severity === "CRITICAL"
          ? [
              {
                nodeIds: [
                  "agent:finance",
                  "resource:customer-db",
                ],
                edgeIds: [
                  "edge-critical",
                ],
              },
            ]
          : [],

      reachableResourceDelta: 1,

      sensitiveResourceDelta:
        severity === "NONE" ||
        severity === "LOW"
          ? 0
          : 1,

      productionResourceDelta:
        severity === "NONE" ||
        severity === "LOW"
          ? 0
          : 1,

      pathDelta: 1,

      criticalPathDelta:
        severity === "CRITICAL"
          ? 2
          : 0,

      driftScore:
        severity === "NONE"
          ? 0
          : severity === "LOW"
            ? 10
            : severity === "MEDIUM"
              ? 30
              : severity === "HIGH"
                ? 70
                : 100,

      severity,
      recommendedAction: action,
    },
  };
}

function decisionFor(
  severity:
    | "NONE"
    | "LOW"
    | "MEDIUM"
    | "HIGH"
    | "CRITICAL",
  action:
    | "MONITOR"
    | "ESCALATE"
    | "BLOCK"
    | "CONTAIN",
) {
  const engine =
    new AuthorityDriftEnforcementEngine();

  return engine.decide(
    resultFor(
      severity,
      action,
    ),
  );
}

describe(
  "4.0-11 authority drift execution boundary",
  () => {

    it(
      "executes NONE decisions",
      () => {
        const boundary =
          new AuthorityDriftExecutionBoundary();

        const decision =
          decisionFor(
            "NONE",
            "MONITOR",
          );

        let calls = 0;

        const result =
          boundary.execute(
            decision,
            () => {
              calls += 1;
              return "executed";
            },
          );

        assert.equal(
          result.executed,
          true,
        );

        assert.equal(
          result.action,
          "MONITOR",
        );

        assert.equal(
          calls,
          1,
        );

        assert.equal(
          result.value,
          "executed",
        );
      },
    );

    it(
      "executes LOW monitoring decisions",
      () => {
        const boundary =
          new AuthorityDriftExecutionBoundary();

        const decision =
          decisionFor(
            "LOW",
            "MONITOR",
          );

        let calls = 0;

        const result =
          boundary.execute(
            decision,
            () => {
              calls += 1;
              return "allowed";
            },
          );

        assert.equal(
          result.executed,
          true,
        );

        assert.equal(
          calls,
          1,
        );
      },
    );

    it(
      "does not execute MEDIUM escalation",
      () => {
        const boundary =
          new AuthorityDriftExecutionBoundary();

        const decision =
          decisionFor(
            "MEDIUM",
            "ESCALATE",
          );

        let calls = 0;

        const result =
          boundary.execute(
            decision,
            () => {
              calls += 1;
              return "MUST_NOT_RUN";
            },
          );

        assert.equal(
          result.executed,
          false,
        );

        assert.equal(
          result.action,
          "ESCALATE",
        );

        assert.equal(
          calls,
          0,
        );

        assert.equal(
          result.value,
          undefined,
        );
      },
    );

    it(
      "does not execute HIGH block",
      () => {
        const boundary =
          new AuthorityDriftExecutionBoundary();

        const decision =
          decisionFor(
            "HIGH",
            "BLOCK",
          );

        let calls = 0;

        const result =
          boundary.execute(
            decision,
            () => {
              calls += 1;
              return "MUST_NOT_RUN";
            },
          );

        assert.equal(
          result.executed,
          false,
        );

        assert.equal(
          result.action,
          "BLOCK",
        );

        assert.equal(
          calls,
          0,
        );
      },
    );

    it(
      "does not execute CRITICAL containment",
      () => {
        const boundary =
          new AuthorityDriftExecutionBoundary();

        const decision =
          decisionFor(
            "CRITICAL",
            "CONTAIN",
          );

        let calls = 0;

        const result =
          boundary.execute(
            decision,
            () => {
              calls += 1;
              return "MUST_NOT_RUN";
            },
          );

        assert.equal(
          result.executed,
          false,
        );

        assert.equal(
          result.action,
          "CONTAIN",
        );

        assert.equal(
          result.severity,
          "CRITICAL",
        );

        assert.equal(
          calls,
          0,
        );
      },
    );

    it(
      "prevents mutation side effects",
      () => {
        const boundary =
          new AuthorityDriftExecutionBoundary();

        const decision =
          decisionFor(
            "HIGH",
            "BLOCK",
          );

        const state = {
          balance: 1000,
        };

        const result =
          boundary.execute(
            decision,
            () => {
              state.balance -= 900;
              return state.balance;
            },
          );

        assert.equal(
          result.executed,
          false,
        );

        assert.equal(
          state.balance,
          1000,
        );
      },
    );

    it(
      "prevents provider-like calls",
      () => {
        const boundary =
          new AuthorityDriftExecutionBoundary();

        const decision =
          decisionFor(
            "HIGH",
            "BLOCK",
          );

        const calls: string[] = [];

        const result =
          boundary.execute(
            decision,
            () => {
              calls.push(
                "PROVIDER_CALLED",
              );

              return {
                model: "test-model",
              };
            },
          );

        assert.equal(
          result.executed,
          false,
        );

        assert.deepEqual(
          calls,
          [],
        );
      },
    );

    it(
      "prevents tool-like calls",
      () => {
        const boundary =
          new AuthorityDriftExecutionBoundary();

        const decision =
          decisionFor(
            "CRITICAL",
            "CONTAIN",
          );

        const calls: string[] = [];

        const result =
          boundary.execute(
            decision,
            () => {
              calls.push(
                "TOOL_CALLED",
              );

              return {
                success: true,
              };
            },
          );

        assert.equal(
          result.executed,
          false,
        );

        assert.deepEqual(
          calls,
          [],
        );
      },
    );

    it(
      "executes exactly once for ALLOW-path decisions",
      () => {
        const boundary =
          new AuthorityDriftExecutionBoundary();

        const decision =
          decisionFor(
            "LOW",
            "MONITOR",
          );

        let calls = 0;

        const result =
          boundary.execute(
            decision,
            () => {
              calls += 1;
              return calls;
            },
          );

        assert.equal(
          result.executed,
          true,
        );

        assert.equal(
          result.value,
          1,
        );

        assert.equal(
          calls,
          1,
        );
      },
    );

    it(
      "never invokes the side effect before checking the decision",
      () => {
        const boundary =
          new AuthorityDriftExecutionBoundary();

        const decision =
          decisionFor(
            "CRITICAL",
            "CONTAIN",
          );

        const events: string[] = [];

        const result =
          boundary.execute(
            decision,
            () => {
              events.push(
                "SIDE_EFFECT",
              );

              return "unexpected";
            },
          );

        events.push(
          result.executed
            ? "EXECUTED"
            : "BLOCKED",
        );

        assert.deepEqual(
          events,
          ["BLOCKED"],
        );
      },
    );
  },
);