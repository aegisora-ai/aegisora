import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  AuthorityDriftEnforcementEngine,
} from "../src/enterprise/authority-drift-enforcement";

import {
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
      blastRadius: 30,
      level: "HIGH",
      reachableResources: 2,
      sensitiveResources: 1,
      productionResources: 2,
      totalPaths: 2,
      criticalPaths: 1,
    },

    pathChanges: [],

    impact: {
      newReachableResources: [
        "resource:new",
      ],

      newSensitiveResources:
        severity === "NONE" || severity === "LOW"
          ? []
          : ["resource:sensitive"],

      newProductionResources:
        severity === "NONE" || severity === "LOW"
          ? []
          : ["resource:production"],

      newPaths: [],

      newCriticalPaths:
        severity === "CRITICAL"
          ? [
              {
                nodeIds: [
                  "agent:finance",
                  "resource:critical",
                ],
                edgeIds: [
                  "critical-edge",
                ],
              },
            ]
          : [],

      reachableResourceDelta: 1,
      sensitiveResourceDelta:
        severity === "NONE" || severity === "LOW"
          ? 0
          : 1,
      productionResourceDelta:
        severity === "NONE" || severity === "LOW"
          ? 0
          : 1,

      pathDelta: 1,

      criticalPathDelta:
        severity === "CRITICAL"
          ? 1
          : 0,

      driftScore:
        severity === "NONE"
          ? 0
          : severity === "LOW"
            ? 10
            : severity === "MEDIUM"
              ? 30
              : severity === "HIGH"
                ? 65
                : 100,

      severity,

      recommendedAction:
        action,
    },
  };
}

describe(
  "4.0-10 authority drift enforcement",
  () => {

    it(
      "allows execution for NONE",
      () => {
        const engine =
          new AuthorityDriftEnforcementEngine();

        const decision =
          engine.decide(
            resultFor(
              "NONE",
              "MONITOR",
            ),
          );

        assert.equal(
          decision.executionAllowed,
          true,
        );

        assert.equal(
          decision.requiresApproval,
          false,
        );

        assert.equal(
          decision.containmentRequired,
          false,
        );

        assert.equal(
          decision.action,
          "MONITOR",
        );
      },
    );

    it(
      "allows execution for LOW monitoring drift",
      () => {
        const engine =
          new AuthorityDriftEnforcementEngine();

        const decision =
          engine.decide(
            resultFor(
              "LOW",
              "MONITOR",
            ),
          );

        assert.equal(
          decision.executionAllowed,
          true,
        );

        assert.equal(
          decision.requiresApproval,
          false,
        );
      },
    );

    it(
      "requires approval for MEDIUM drift",
      () => {
        const engine =
          new AuthorityDriftEnforcementEngine();

        const decision =
          engine.decide(
            resultFor(
              "MEDIUM",
              "ESCALATE",
            ),
          );

        assert.equal(
          decision.executionAllowed,
          false,
        );

        assert.equal(
          decision.requiresApproval,
          true,
        );

        assert.equal(
          decision.containmentRequired,
          false,
        );

        assert.equal(
          decision.action,
          "ESCALATE",
        );
      },
    );

    it(
      "blocks HIGH drift",
      () => {
        const engine =
          new AuthorityDriftEnforcementEngine();

        const decision =
          engine.decide(
            resultFor(
              "HIGH",
              "BLOCK",
            ),
          );

        assert.equal(
          decision.executionAllowed,
          false,
        );

        assert.equal(
          decision.requiresApproval,
          false,
        );

        assert.equal(
          decision.containmentRequired,
          false,
        );

        assert.equal(
          decision.action,
          "BLOCK",
        );
      },
    );

    it(
      "contains CRITICAL drift",
      () => {
        const engine =
          new AuthorityDriftEnforcementEngine();

        const decision =
          engine.decide(
            resultFor(
              "CRITICAL",
              "CONTAIN",
            ),
          );

        assert.equal(
          decision.executionAllowed,
          false,
        );

        assert.equal(
          decision.requiresApproval,
          false,
        );

        assert.equal(
          decision.containmentRequired,
          true,
        );

        assert.equal(
          decision.action,
          "CONTAIN",
        );

        assert.equal(
          decision.newCriticalPaths,
          1,
        );
      },
    );

    it(
      "preserves immutable input data",
      () => {
        const engine =
          new AuthorityDriftEnforcementEngine();

        const input =
          resultFor(
            "HIGH",
            "BLOCK",
          );

        const before =
          input.impact.newSensitiveResources;

        const decision =
          engine.decide(input);

        assert.deepEqual(
          input.impact.newSensitiveResources,
          before,
        );

        assert.notStrictEqual(
          decision.newSensitiveResources,
          input.impact.newSensitiveResources,
        );
      },
    );

    it(
      "is deterministic",
      () => {
        const engine =
          new AuthorityDriftEnforcementEngine();

        const input =
          resultFor(
            "CRITICAL",
            "CONTAIN",
          );

        const first =
          engine.decide(input);

        const second =
          engine.decide(input);

        assert.deepEqual(
          first,
          second,
        );
      },
    );

    it(
      "rejects execution for every non-monitoring severity",
      () => {
        const engine =
          new AuthorityDriftEnforcementEngine();

        const cases = [
          ["MEDIUM", "ESCALATE"],
          ["HIGH", "BLOCK"],
          ["CRITICAL", "CONTAIN"],
        ] as const;

        for (const [severity, action] of cases) {
          const decision =
            engine.decide(
              resultFor(
                severity,
                action,
              ),
            );

          assert.equal(
            decision.executionAllowed,
            false,
          );
        }
      },
    );
  },
);