import assert from "node:assert/strict";

import {
  EnterpriseAuditAccessDeniedError,
  EnterpriseAuditAlreadyExistsError,
  EnterpriseAuditInvalidError,
  EnterpriseAuditLedger,
} from "../src";

function createInput(
  auditId: string,
  workspaceId: string,
) {
  return {
    auditId,
    workspaceId,

    traceId: "trace-12c",
    decisionId: "decision-12c",
    executionId: "execution-12c",
    evidenceId: "evidence-12c",

    agentId: "agent-12c",
    actorId: "actor-12c",

    action: "provider.generate",
    resourceType: "provider",
    resource: "provider:openai",

    decision: "ALLOW" as const,
    riskScore: 25,
    enforcementStatus:
      "not_executed" as const,

    eventType: "decision" as const,
    reason: "Allowed by policy.",

    metadata: {
      policyVersion: 3,
      source: "12C-A-test",
    },
  };
}

const ledger =
  new EnterpriseAuditLedger();

const record = ledger.create(
  createInput(
    "audit-1",
    "workspace-A",
  ),
);

assert.equal(
  record.auditId,
  "audit-1",
);

assert.equal(
  record.workspaceId,
  "workspace-A",
);

assert.equal(
  record.traceId,
  "trace-12c",
);

assert.equal(
  record.decisionId,
  "decision-12c",
);

assert.equal(
  record.executionId,
  "execution-12c",
);

assert.equal(
  record.evidenceId,
  "evidence-12c",
);

assert.equal(
  record.decision,
  "ALLOW",
);

assert.equal(
  record.riskScore,
  25,
);

assert.equal(
  record.eventType,
  "decision",
);

assert.ok(
  Object.isFrozen(record),
);

assert.ok(
  Object.isFrozen(record.metadata),
);

console.log(
  "Canonical audit identity: PASS",
);

console.log(
  "Immutable audit snapshot: PASS",
);

assert.throws(
  () =>
    ledger.create(
      createInput(
        "audit-1",
        "workspace-A",
      ),
    ),
  EnterpriseAuditAlreadyExistsError,
);

console.log(
  "Duplicate protection: PASS",
);

assert.equal(
  ledger.getForWorkspace(
    "workspace-A",
    "audit-1",
  ).auditId,
  "audit-1",
);

assert.throws(
  () =>
    ledger.getForWorkspace(
      "workspace-B",
      "audit-1",
    ),
  EnterpriseAuditAccessDeniedError,
);

assert.equal(
  ledger.listForWorkspace(
    "workspace-B",
  ).length,
  0,
);

console.log(
  "Workspace isolation: PASS",
);

assert.throws(
  () =>
    ledger.create({
      ...createInput(
        "audit-invalid-risk",
        "workspace-A",
      ),
      riskScore: 101,
    }),
  EnterpriseAuditInvalidError,
);

console.log(
  "Risk bounds: PASS",
);

assert.throws(
  () =>
    ledger.create({
      ...createInput(
        "audit-invalid-id",
        "workspace-A",
      ),
      evidenceId: "",
    }),
  EnterpriseAuditInvalidError,
);

console.log(
  "Required identity validation: PASS",
);

const workspaceBRecord =
  ledger.create(
    createInput(
      "audit-2",
      "workspace-B",
    ),
  );

assert.equal(
  workspaceBRecord.workspaceId,
  "workspace-B",
);

assert.equal(
  ledger.listForWorkspace(
    "workspace-A",
  ).length,
  1,
);

assert.equal(
  ledger.listForWorkspace(
    "workspace-B",
  ).length,
  1,
);

console.log(
  "Multi-workspace inventory: PASS",
);

console.log("");

console.log(
  "============================================================",
);

console.log(
  " 3.0-12C-A ENTERPRISE AUDIT LEDGER: PASS",
);

console.log(
  "============================================================",
);