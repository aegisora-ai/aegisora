import assert from "node:assert/strict";

import {
  EnterpriseEvidenceAccessDeniedError,
  EnterpriseEvidenceAlreadyExistsError,
  EnterpriseEvidenceInvalidError,
  EnterpriseEvidenceLedger,
} from "../src/enterprise/evidence";

async function main(): Promise<void> {

  console.log("");
  console.log("============================================================");
  console.log(" 3.0-12A ENTERPRISE EVIDENCE LEDGER");
  console.log("============================================================");

  const ledger =
    new EnterpriseEvidenceLedger();

  const base = {
    evidenceId: "evidence-12a-1",
    workspaceId: "workspace-a",
    traceId: "trace-12a-1",
    decisionId: "decision-12a-1",
    executionId: "execution-12a-1",
    agentId: "agent-12a-1",
    approvalId: "approval-12a-1",
    policyVersion: 3,
    riskScore: 72,
    finalDecision: "ESCALATE" as const,
    enforcementStatus: "escalated" as const,
    resourceType: "provider",
    action: "provider.generate",
    tool: "openai",
    reason: "Human approval required.",
    createdAt: new Date().toISOString(),
    metadata: {
      source: "3.0-12A",
    },
  };

  console.log("[1] Creating evidence...");

  const created =
    ledger.create(base);

  assert.equal(
    created.evidenceId,
    base.evidenceId,
  );

  assert.equal(
    created.workspaceId,
    base.workspaceId,
  );

  assert.equal(
    created.traceId,
    base.traceId,
  );

  assert.equal(
    created.decisionId,
    base.decisionId,
  );

  assert.equal(
    created.executionId,
    base.executionId,
  );

  assert.equal(
    created.policyVersion,
    3,
  );

  assert.equal(
    created.finalDecision,
    "ESCALATE",
  );

  console.log(
    "Evidence canonical identity: PASS",
  );

  console.log("[2] Testing duplicate protection...");

  assert.throws(
    () => ledger.create(base),
    EnterpriseEvidenceAlreadyExistsError,
  );

  console.log(
    "Duplicate evidence blocked: PASS",
  );

  console.log("[3] Testing workspace isolation...");

  const workspaceA =
    ledger.getForWorkspace(
      "workspace-a",
      base.evidenceId,
    );

  assert.equal(
    workspaceA.workspaceId,
    "workspace-a",
  );

  assert.throws(
    () =>
      ledger.getForWorkspace(
        "workspace-b",
        base.evidenceId,
      ),
    EnterpriseEvidenceAccessDeniedError,
  );

  console.log(
    "Cross-workspace evidence access blocked: PASS",
  );

  console.log("[4] Testing workspace inventory...");

  assert.equal(
    ledger.listForWorkspace(
      "workspace-a",
    ).length,
    1,
  );

  assert.equal(
    ledger.listForWorkspace(
      "workspace-b",
    ).length,
    0,
  );

  console.log(
    "Workspace-scoped inventory: PASS",
  );

  console.log("[5] Testing immutable snapshot behavior...");

  assert.equal(
    created.metadata.source,
    "3.0-12A",
  );

  assert.equal(
    Object.isFrozen(created),
    true,
  );

  assert.equal(
    Object.isFrozen(created.metadata),
    true,
  );

  console.log(
    "Evidence snapshot immutability: PASS",
  );

  console.log("[6] Testing invalid risk score...");

  assert.throws(
    () =>
      ledger.create({
        ...base,
        evidenceId: "evidence-invalid-risk",
        riskScore: 101,
      }),
    EnterpriseEvidenceInvalidError,
  );

  console.log(
    "Risk bounds enforced: PASS",
  );

  console.log("");
  console.log("============================================================");
  console.log(" 3.0-12A ENTERPRISE EVIDENCE LEDGER: PASS");
  console.log("============================================================");
  console.log(
    "Canonical evidence identity       ✅",
  );
  console.log(
    "Duplicate protection              ✅",
  );
  console.log(
    "Cross-workspace isolation         ✅",
  );
  console.log(
    "Workspace inventory               ✅",
  );
  console.log(
    "Immutable snapshot                ✅",
  );
  console.log(
    "Risk bounds                       ✅",
  );
}

main().catch(
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
