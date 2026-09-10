import assert from "node:assert/strict";

import {
  EnterpriseEvidenceLedger,
} from "@aegisora/core";

import {
  ProviderExecutionGateway,
} from "../src/providers/provider-execution-gateway";

import {
  ProviderRouter,
} from "../src/providers/provider-router";

import {
  RuntimeContext,
} from "../src/context/runtime-context";

import {
  BaseProvider,
} from "../src/providers/base-provider";

import type {
  ProviderRequest,
  ProviderResponse,
} from "../src/providers/base-provider";

class SpyProvider extends BaseProvider {
  public readonly name = "openai";

  public calls = 0;

  async generate(
    request: ProviderRequest,
    _context?: unknown,
  ): Promise<ProviderResponse> {
    this.calls++;

    return this.buildResponse(
      "openai",
      request.model ?? "spy-model",
      `ENTERPRISE-EVIDENCE:${request.prompt}`,
    );
  }
}

function assertUuid(
  value: unknown,
  label: string,
): asserts value is string {
  assert.equal(
    typeof value,
    "string",
    `${label} must be a string`,
  );

  assert.match(
    value,
    /^[0-9a-f-]{36}$/i,
    `${label} must be UUID-like`,
  );
}

function readCollection(store: any): unknown[] {
  if (typeof store.getAll === "function") {
    return store.getAll();
  }

  if (typeof store.list === "function") {
    return store.list();
  }

  if (Array.isArray(store.records)) {
    return store.records;
  }

  if (Array.isArray(store.entries)) {
    return store.entries;
  }

  return [];
}

function findEvidence(
  records: readonly any[],
  evidenceId: string,
): any {
  return records.find(
    (item) =>
      item &&
      item.evidenceId === evidenceId,
  );
}

async function main(): Promise<void> {
  const workspaceA = "workspace-3.0-12B-A";
  const workspaceB = "workspace-3.0-12B-B";
  const agentId = "3.0-12B-enterprise-evidence-agent";

  console.log("[1] Creating runtime and enterprise ledger...");

  const context = new RuntimeContext();

  const executionToken = Symbol(
    "aegisora.3.0.12b.execution",
  );

  const router = new ProviderRouter(
    executionToken,
  );

  const spy = new SpyProvider();

  router.register(
    "openai",
    spy,
  );

  const gateway = new ProviderExecutionGateway(
    context,
    router,
    undefined,
    undefined,
    executionToken,
  );

  const ledger = new EnterpriseEvidenceLedger();

  gateway.configureEnterpriseEvidence({
    workspaceId: workspaceA,
    writer: ledger,
  });

  assert.ok(
    gateway.getEnterpriseEvidenceBridge(),
    "Enterprise evidence bridge must be configured",
  );

  context.agentRegistry.register({
    id: agentId,
    name: "3.0-12B Enterprise Evidence Agent",
    status: "idle",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.ok(
    context.agentRegistry.getById(agentId),
    "Canonical agent must exist",
  );

  console.log("Enterprise evidence bridge: PASS");
  console.log("Canonical agent identity: PASS");

  // ============================================================
  // ALLOW
  // ============================================================

  console.log("[2] Executing ALLOW request...");

  const allowResponse = await gateway.generate({
    agentId,
    provider: "openai",
    request: {
      prompt: "3.0-12B enterprise allow",
    },
  });

  assert.equal(
    allowResponse.output,
    "ENTERPRISE-EVIDENCE:3.0-12B enterprise allow",
  );

  assert.equal(
    spy.calls,
    1,
    "ALLOW must invoke provider exactly once",
  );

  const runtimeDecisions = readCollection(
    context.decisionStore,
  );

  const runtimeEvidence = readCollection(
    context.evidenceStore,
  );

  assert.ok(
    runtimeDecisions.length > 0,
    "Runtime decision store must contain ALLOW decision",
  );

  assert.ok(
    runtimeEvidence.length > 0,
    "Runtime evidence store must contain ALLOW evidence",
  );

  const runtimeDecision =
    runtimeDecisions[runtimeDecisions.length - 1] as any;

  const runtimeEvidenceRecord =
    findEvidence(
      runtimeEvidence,
      runtimeDecision.evidenceId,
    );

  assert.ok(
    runtimeEvidenceRecord,
    "Runtime evidence must be linked by evidenceId",
  );

  assert.equal(
    runtimeDecision.decision,
    "allow",
  );

  assert.equal(
    runtimeDecision.agentId,
    agentId,
  );

  assert.equal(
    runtimeEvidenceRecord.finalDecision,
    "ALLOW",
  );

  assert.equal(
    runtimeEvidenceRecord.enforcementStatus,
    "not_executed",
  );

  assert.equal(
    runtimeEvidenceRecord.executionOutcome,
    "not_attempted",
  );

  assertUuid(
    runtimeDecision.traceId,
    "runtimeDecision.traceId",
  );

  assertUuid(
    runtimeDecision.decisionId,
    "runtimeDecision.decisionId",
  );

  assertUuid(
    runtimeDecision.executionId,
    "runtimeDecision.executionId",
  );

  assertUuid(
    runtimeDecision.evidenceId,
    "runtimeDecision.evidenceId",
  );

  // ============================================================
  // ENTERPRISE LEDGER CORRELATION
  // ============================================================

  console.log(
    "[3] Verifying runtime → enterprise evidence correlation...",
  );

  const enterpriseAllow =
    ledger.getForWorkspace(
      workspaceA,
      runtimeEvidenceRecord.evidenceId,
    );

  assert.equal(
    enterpriseAllow.workspaceId,
    workspaceA,
  );

  assert.equal(
    enterpriseAllow.evidenceId,
    runtimeEvidenceRecord.evidenceId,
  );

  assert.equal(
    enterpriseAllow.traceId,
    runtimeDecision.traceId,
  );

  assert.equal(
    enterpriseAllow.decisionId,
    runtimeDecision.decisionId,
  );

  assert.equal(
    enterpriseAllow.executionId,
    runtimeDecision.executionId,
  );

  assert.equal(
    enterpriseAllow.agentId,
    agentId,
  );

  assert.equal(
    enterpriseAllow.finalDecision,
    "ALLOW",
  );

  assert.equal(
    enterpriseAllow.enforcementStatus,
    "not_executed",
  );

  assert.equal(
    enterpriseAllow.resourceType,
    runtimeEvidenceRecord.resourceType,
  );

  assert.equal(
    enterpriseAllow.action,
    "provider.generate",
  );

  assert.equal(
    enterpriseAllow.reason,
    runtimeEvidenceRecord.reason,
  );

  assert.ok(
    Object.isFrozen(enterpriseAllow),
    "Enterprise evidence record must be immutable",
  );

  console.log(
    "ALLOW runtime → enterprise correlation: PASS",
  );

  // ============================================================
  // WORKSPACE ISOLATION
  // ============================================================

  console.log("[4] Verifying workspace isolation...");

  assert.throws(
    () =>
      ledger.getForWorkspace(
        workspaceB,
        enterpriseAllow.evidenceId,
      ),
    /Evidence does not belong to requested workspace/,
    "Foreign workspace must not retrieve evidence",
  );

  assert.equal(
    ledger.listForWorkspace(workspaceB).length,
    0,
    "Foreign workspace must see zero evidence",
  );

  assert.equal(
    ledger.listForWorkspace(workspaceA).length,
    1,
    "Owning workspace must see the evidence",
  );

  console.log(
    "Workspace isolation: PASS",
  );

  // ============================================================
  // BLOCK
  // ============================================================

  console.log("[5] Executing BLOCK request...");

  const decisionCountBeforeBlock =
    readCollection(context.decisionStore).length;

  const evidenceCountBeforeBlock =
    readCollection(context.evidenceStore).length;

  await assert.rejects(
    gateway.generate({
      agentId,
      provider: "unknown-provider" as any,
      request: {
        prompt: "3.0-12B enterprise block",
      },
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error);

      assert.match(
        error.message,
        /\[ENFORCEMENT:BLOCK\]/,
      );

      return true;
    },
  );

  assert.equal(
    spy.calls,
    1,
    "BLOCK must not invoke provider",
  );

  const decisionsAfterBlock =
    readCollection(context.decisionStore);

  const evidenceAfterBlock =
    readCollection(context.evidenceStore);

  assert.ok(
    decisionsAfterBlock.length >
      decisionCountBeforeBlock,
  );

  assert.ok(
    evidenceAfterBlock.length >
      evidenceCountBeforeBlock,
  );

  const blockDecision =
    decisionsAfterBlock[
      decisionsAfterBlock.length - 1
    ] as any;

  const blockRuntimeEvidence =
    findEvidence(
      evidenceAfterBlock,
      blockDecision.evidenceId,
    );

  assert.ok(
    blockRuntimeEvidence,
    "BLOCK runtime evidence must exist",
  );

  assert.equal(
    blockDecision.decision,
    "block",
  );

  assert.equal(
    blockRuntimeEvidence.finalDecision,
    "BLOCK",
  );

  assert.equal(
    blockRuntimeEvidence.enforcementStatus,
    "prevented",
  );

  assert.equal(
    blockRuntimeEvidence.executionOutcome,
    "not_attempted",
  );

  const enterpriseBlock =
    ledger.getForWorkspace(
      workspaceA,
      blockRuntimeEvidence.evidenceId,
    );

  assert.equal(
    enterpriseBlock.workspaceId,
    workspaceA,
  );

  assert.equal(
    enterpriseBlock.evidenceId,
    blockRuntimeEvidence.evidenceId,
  );

  assert.equal(
    enterpriseBlock.traceId,
    blockDecision.traceId,
  );

  assert.equal(
    enterpriseBlock.decisionId,
    blockDecision.decisionId,
  );

  assert.equal(
    enterpriseBlock.executionId,
    blockDecision.executionId,
  );

  assert.equal(
    enterpriseBlock.finalDecision,
    "BLOCK",
  );

  assert.equal(
    enterpriseBlock.enforcementStatus,
    "prevented",
  );

  console.log(
    "BLOCK runtime → enterprise correlation: PASS",
  );

  // ============================================================
  // FINAL
  // ============================================================

  assert.equal(
    ledger.listForWorkspace(workspaceA).length,
    2,
    "Workspace A must contain ALLOW + BLOCK enterprise evidence",
  );

  assert.equal(
    ledger.listForWorkspace(workspaceB).length,
    0,
    "Workspace B must remain isolated",
  );

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    " 3.0-12B RUNTIME → ENTERPRISE EVIDENCE: PASS",
  );
  console.log(
    "============================================================",
  );
  console.log(
    "ALLOW  -> runtime evidence persisted",
  );
  console.log(
    "ALLOW  -> enterprise evidence persisted",
  );
  console.log(
    "ALLOW  -> trace/decision/execution/evidence correlated",
  );
  console.log(
    "BLOCK  -> provider not invoked",
  );
  console.log(
    "BLOCK  -> enterprise evidence persisted",
  );
  console.log(
    "TENANT -> foreign workspace blocked",
  );
}

main().catch(
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
