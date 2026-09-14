import { describe, it } from "node:test";
import assert from "node:assert/strict";

import {
  AutonomousContainmentEngine,
} from "../src/enterprise/autonomous-containment";

import {
  AuthorityDriftResult,
} from "../src/enterprise/authority-drift";

function noDrift(): AuthorityDriftResult {
  return {
    workspaceId: "workspace-a",
    agentId: "finance",
    approved: {
      blastRadius: 30,
      level: "HIGH",
      reachableResources: 3,
      sensitiveResources: 1,
      productionResources: 2,
      totalPaths: 4,
      criticalPaths: 1,
    },
    observed: {
      blastRadius: 30,
      level: "HIGH",
      reachableResources: 3,
      sensitiveResources: 1,
      productionResources: 2,
      totalPaths: 4,
      criticalPaths: 1,
    },
    pathChanges: [],
    impact: {
      newReachableResources: [],
      newSensitiveResources: [],
      newProductionResources: [],
      newPaths: [],
      newCriticalPaths: [],
      reachableResourceDelta: 0,
      sensitiveResourceDelta: 0,
      productionResourceDelta: 0,
      pathDelta: 0,
      criticalPathDelta: 0,
      driftScore: 0,
      severity: "NONE",
      recommendedAction: "MONITOR",
    },
  };
}

function mediumDrift(): AuthorityDriftResult {
  const base = noDrift();

  return {
    ...base,
    observed: {
      ...base.observed,
      blastRadius: 45,
      reachableResources: 4,
      totalPaths: 5,
    },
    impact: {
      ...base.impact,
      newReachableResources: [
        "resource:new-service",
      ],
      newPaths: [
        {
          nodeIds: [
            "agent:finance",
            "provider:postgres",
            "resource:new-service",
          ],
          edgeIds: [
            "e1",
            "e-new",
          ],
        },
      ],
      reachableResourceDelta: 1,
      pathDelta: 1,
      driftScore: 25,
      severity: "MEDIUM",
      recommendedAction: "ESCALATE",
    },
  };
}

function criticalDrift(): AuthorityDriftResult {
  const base = noDrift();

  return {
    ...base,
    observed: {
      ...base.observed,
      blastRadius: 96,
      level: "CRITICAL",
      reachableResources: 6,
      sensitiveResources: 3,
      productionResources: 4,
      totalPaths: 9,
      criticalPaths: 3,
    },
    impact: {
      ...base.impact,
      newReachableResources: [
        "resource:payments",
        "resource:customer-db",
      ],
      newSensitiveResources: [
        "resource:customer-db",
        "resource:payments",
      ],
      newProductionResources: [
        "resource:customer-db",
        "resource:payments",
      ],
      newCriticalPaths: [
        {
          nodeIds: [
            "agent:finance",
            "identity:finance",
            "capability:write",
            "resource:customer-db",
          ],
          edgeIds: [
            "e10",
            "e11",
            "e12",
          ],
        },
        {
          nodeIds: [
            "agent:finance",
            "identity:finance",
            "capability:pay",
            "resource:payments",
          ],
          edgeIds: [
            "e13",
            "e14",
            "e15",
          ],
        },
      ],
      newPaths: [
        {
          nodeIds: [
            "agent:finance",
            "resource:customer-db",
          ],
          edgeIds: [
            "e12",
          ],
        },
        {
          nodeIds: [
            "agent:finance",
            "resource:payments",
          ],
          edgeIds: [
            "e15",
          ],
        },
      ],
      reachableResourceDelta: 3,
      sensitiveResourceDelta: 2,
      productionResourceDelta: 2,
      pathDelta: 5,
      criticalPathDelta: 2,
      driftScore: 100,
      severity: "CRITICAL",
      recommendedAction: "CONTAIN",
    },
  };
}

describe("4.0-10 autonomous containment", () => {
  it("produces monitor/no-action for a clean authority state", () => {
    const engine =
      new AutonomousContainmentEngine();

    const result = engine.decide({
      drift: noDrift(),
    });

    assert.equal(
      result.decision.action.type,
      "MONITOR",
    );

    assert.equal(
      result.decision.action.mode,
      "NO_ACTION",
    );

    assert.equal(
      result.decision.severity,
      "NONE",
    );
  });

  it("converts medium drift into approval-gated containment", () => {
    const engine =
      new AutonomousContainmentEngine();

    const result = engine.decide({
      drift: mediumDrift(),
    });

    assert.equal(
      result.decision.action.type,
      "REQUIRE_APPROVAL",
    );

    assert.equal(
      result.decision.action.mode,
      "ENFORCE",
    );

    assert.equal(
      result.decision.severity,
      "MEDIUM",
    );
  });

  it("converts high drift into execution blocking", () => {
    const base = mediumDrift();

    const high: AuthorityDriftResult = {
      ...base,
      impact: {
        ...base.impact,
        driftScore: 70,
        severity: "HIGH",
        recommendedAction: "BLOCK",
      },
    };

    const engine =
      new AutonomousContainmentEngine();

    const result = engine.decide({
      drift: high,
    });

    assert.equal(
      result.decision.action.type,
      "BLOCK_EXECUTION",
    );

    assert.equal(
      result.decision.action.priority,
      80,
    );
  });

  it("suspends a critically drifting agent", () => {
    const engine =
      new AutonomousContainmentEngine();

    const result = engine.decide({
      drift: criticalDrift(),
    });

    assert.equal(
      result.decision.action.type,
      "SUSPEND_AGENT",
    );

    assert.equal(
      result.decision.action.priority,
      100,
    );

    assert.equal(
      result.decision.action.reversible,
      true,
    );
  });

  it("returns alternate containment options", () => {
    const engine =
      new AutonomousContainmentEngine();

    const result = engine.decide({
      drift: criticalDrift(),
    });

    assert.ok(
      result.eligibleActions.length >= 3,
    );

    assert.ok(
      result.eligibleActions.some(
        (action) =>
          action.type ===
          "RESTRICT_AUTHORITY",
      ),
    );

    assert.ok(
      result.eligibleActions.some(
        (action) =>
          action.type ===
          "BLOCK_EXECUTION",
      ),
    );
  });

  it("supports advisory mode without changing the selected decision type", () => {
    const engine =
      new AutonomousContainmentEngine();

    const result = engine.decide({
      drift: criticalDrift(),
      mode: "ADVISORY",
    });

    assert.equal(
      result.decision.action.type,
      "SUSPEND_AGENT",
    );

    assert.equal(
      result.decision.action.mode,
      "ADVISORY",
    );
  });

  it("supports threshold-based containment", () => {
    const engine =
      new AutonomousContainmentEngine();

    const result = engine.decide({
      drift: mediumDrift(),
      minimumSeverity: "HIGH",
    });

    assert.equal(
      result.decision.action.type,
      "MONITOR",
    );

    assert.equal(
      result.decision.action.mode,
      "NO_ACTION",
    );
  });

  it("explains why containment was selected", () => {
    const engine =
      new AutonomousContainmentEngine();

    const result = engine.decide({
      drift: criticalDrift(),
    });

    assert.ok(
      result.decision.rationale.length >= 4,
    );

    assert.ok(
      result.decision.rationale.some(
        (line) =>
          line.includes("critical"),
      ),
    );

    assert.ok(
      result.decision.rationale.some(
        (line) =>
          line.includes("Blast radius"),
      ),
    );
  });

  it("is deterministic for identical drift input", () => {
    const engine =
      new AutonomousContainmentEngine();

    const input = {
      drift: criticalDrift(),
    };

    const first =
      engine.decide(input);
    const second =
      engine.decide(input);

    assert.deepEqual(
      first,
      second,
    );
  });

  it("does not mutate the drift result", () => {
    const drift = criticalDrift();

    const before = JSON.stringify(drift);

    const engine =
      new AutonomousContainmentEngine();

    engine.decide({
      drift,
    });

    assert.equal(
      JSON.stringify(drift),
      before,
    );
  });
});
