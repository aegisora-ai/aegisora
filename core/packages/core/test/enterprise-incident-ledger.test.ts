import assert from "node:assert/strict";
import test from "node:test";

import {
  EnterpriseIncidentLedger,
  incidentSeverityRank,
  isActiveIncidentStatus,
  isTerminalIncidentStatus,
} from "../src/enterprise/incidents";

function input(
  overrides: Record<string, unknown> = {},
) {
  return {
    incidentId:
      "incident-15a",

    workspaceId:
      "workspace-a",

    severity:
      "HIGH" as const,

    source:
      "policy" as const,

    title:
      "Policy violation detected",

    reason:
      "Agent attempted a protected operation.",

    traceId:
      "trace-15a",

    decisionId:
      "decision-15a",

    executionId:
      "execution-15a",

    evidenceId:
      "evidence-15a",

    auditId:
      "audit-15a",

    agentId:
      "agent-a",

    metadata: {
      origin:
        "runtime",
    },

    ...overrides,
  };
}

test(
  "15A - canonical incident starts OPEN",
  () => {
    const ledger =
      new EnterpriseIncidentLedger();

    const incident =
      ledger.create(
        input(),
      );

    assert.equal(
      incident.status,
      "OPEN",
    );

    assert.equal(
      incident.workspaceId,
      "workspace-a",
    );

    assert.equal(
      incident.severity,
      "HIGH",
    );

    assert.equal(
      incident.traceId,
      "trace-15a",
    );
  },
);

test(
  "15A - duplicate incident identity is rejected",
  () => {
    const ledger =
      new EnterpriseIncidentLedger();

    ledger.create(
      input(),
    );

    assert.throws(
      () =>
        ledger.create(
          input(),
        ),
      /already exists/i,
    );
  },
);

test(
  "15A - workspace isolation hides foreign incident",
  () => {
    const ledger =
      new EnterpriseIncidentLedger();

    ledger.create(
      input(),
    );

    assert.equal(
      ledger.getForWorkspace(
        "workspace-b",
        "incident-15a",
      ),
      undefined,
    );

    assert.equal(
      ledger.listForWorkspace(
        "workspace-b",
      ).length,
      0,
    );
  },
);

test(
  "15A - OPEN -> ACKNOWLEDGED",
  () => {
    const ledger =
      new EnterpriseIncidentLedger();

    ledger.create(
      input(),
    );

    const updated =
      ledger.transition(
        "workspace-a",
        "incident-15a",
        "ACKNOWLEDGE",
      );

    assert.equal(
      updated.status,
      "ACKNOWLEDGED",
    );

    assert.ok(
      updated.acknowledgedAt,
    );
  },
);

test(
  "15A - OPEN -> INVESTIGATING -> RESOLVED",
  () => {
    const ledger =
      new EnterpriseIncidentLedger();

    ledger.create(
      input(),
    );

    ledger.transition(
      "workspace-a",
      "incident-15a",
      "START_INVESTIGATION",
    );

    const resolved =
      ledger.transition(
        "workspace-a",
        "incident-15a",
        "RESOLVE",
      );

    assert.equal(
      resolved.status,
      "RESOLVED",
    );

    assert.ok(
      resolved.resolvedAt,
    );
  },
);

test(
  "15A - invalid transition is blocked",
  () => {
    const ledger =
      new EnterpriseIncidentLedger();

    ledger.create(
      input(),
    );

    assert.throws(
      () =>
        ledger.transition(
          "workspace-a",
          "incident-15a",
          "CLOSE",
        ),
      /\[ENFORCEMENT:BLOCK\].*transition/i,
    );
  },
);

test(
  "15A - foreign workspace transition is blocked",
  () => {
    const ledger =
      new EnterpriseIncidentLedger();

    ledger.create(
      input(),
    );

    assert.throws(
      () =>
        ledger.transition(
          "workspace-b",
          "incident-15a",
          "ACKNOWLEDGE",
        ),
      /\[ENFORCEMENT:BLOCK\].*workspace/i,
    );
  },
);

test(
  "15A - severity ranking is deterministic",
  () => {
    assert.equal(
      incidentSeverityRank("LOW"),
      1,
    );

    assert.equal(
      incidentSeverityRank("MEDIUM"),
      2,
    );

    assert.equal(
      incidentSeverityRank("HIGH"),
      3,
    );

    assert.equal(
      incidentSeverityRank("CRITICAL"),
      4,
    );
  },
);

test(
  "15A - active and terminal status contracts",
  () => {
    assert.equal(
      isActiveIncidentStatus("OPEN"),
      true,
    );

    assert.equal(
      isActiveIncidentStatus(
        "INVESTIGATING",
      ),
      true,
    );

    assert.equal(
      isTerminalIncidentStatus(
        "CLOSED",
      ),
      true,
    );
  },
);

console.log(
  "15A incident test suite loaded.",
);
