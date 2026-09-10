import assert from "node:assert/strict";

import {
  EnterpriseAuditLedger,
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
      `ENTERPRISE-AUDIT:${request.prompt}`,
    );
  }
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

async function main(): Promise<void> {
  console.log("");
  console.log("============================================================");
  console.log(" 3.0-12C-B ENTERPRISE AUDIT E2E");
  console.log("============================================================");

  const workspaceId =
    "workspace-3.0-12C-B-enterprise-audit";

  const agentId =
    "3.0-12C-B-enterprise-audit-agent";

  // ==========================================================
  // BOOTSTRAP
  // ==========================================================

  console.log("[1] Bootstrapping canonical runtime...");

  const context =
    new RuntimeContext();

  const executionToken =
    Symbol(
      "aegisora.3.0.12c-b.enterprise-audit",
    );

  const router =
    new ProviderRouter(
      executionToken,
    );

  const spy =
    new SpyProvider();

  router.register(
    "openai",
    spy,
  );

  const gateway =
    new ProviderExecutionGateway(
      context,
      router,
      undefined,
      undefined,
      executionToken,
    );

  const ledger =
    new EnterpriseAuditLedger();

  gateway.configureEnterpriseAudit({
    workspaceId,
    writer: ledger,
  });

  assert.ok(
    gateway.getEnterpriseAuditBridge(),
    "Enterprise audit bridge must be configured",
  );

  context.agentRegistry.register({
    id: agentId,
    name: "3.0-12C-B Enterprise Audit Agent",
    status: "idle",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.ok(
    context.agentRegistry.getById(agentId),
    "Canonical agent must exist",
  );

  console.log(
    "Enterprise audit bridge: PASS",
  );

  console.log(
    "Canonical agent identity: PASS",
  );

  // ==========================================================
  // ALLOW
  // ==========================================================

  console.log("[2] Executing ALLOW request...");

  const response =
    await gateway.generate({
      agentId,
      provider: "openai",
      request: {
        prompt:
          "3.0-12C-B enterprise audit allow",
      },
    });

  assert.equal(
    response.output,
    "ENTERPRISE-AUDIT:3.0-12C-B enterprise audit allow",
  );

  assert.equal(
    spy.calls,
    1,
    "ALLOW must invoke provider exactly once",
  );

  console.log(
    "ALLOW provider execution: PASS",
  );

  // ==========================================================
  // RUNTIME CORRELATION
  // ==========================================================

  const decisions =
    readCollection(
      context.decisionStore,
    );

  const evidence =
    readCollection(
      context.evidenceStore,
    );

  assert.ok(
    decisions.length > 0,
    "Runtime decision store must contain a decision",
  );

  assert.ok(
    evidence.length > 0,
    "Runtime evidence store must contain evidence",
  );

  const decision =
    decisions[decisions.length - 1] as any;

  assertUuid(
    decision.traceId,
    "runtime traceId",
  );

  assertUuid(
    decision.decisionId,
    "runtime decisionId",
  );

  assertUuid(
    decision.executionId,
    "runtime executionId",
  );

  assertUuid(
    decision.evidenceId,
    "runtime evidenceId",
  );

  console.log(
    "Runtime correlation identities: PASS",
  );

  // ==========================================================
  // ENTERPRISE AUDIT
  // ==========================================================

  console.log(
    "[3] Inspecting enterprise audit ledger...",
  );

  const auditRecords =
    readCollection(
      ledger,
    );

  assert.ok(
    auditRecords.length > 0,
    "Enterprise audit ledger must contain a record",
  );

  const audit =
    auditRecords[auditRecords.length - 1] as any;

  assertUuid(
    audit.auditId,
    "enterprise auditId",
  );

  assert.equal(
    audit.workspaceId,
    workspaceId,
    "Enterprise audit workspace must be canonical",
  );

  assert.equal(
    audit.agentId,
    agentId,
    "Enterprise audit agentId must match runtime",
  );

  assert.equal(
    audit.traceId,
    decision.traceId,
    "Enterprise audit traceId must match runtime traceId",
  );

  assert.equal(
    audit.decisionId,
    decision.decisionId,
    "Enterprise audit decisionId must match runtime decisionId",
  );

  assert.equal(
    audit.executionId,
    decision.executionId,
    "Enterprise audit executionId must match runtime executionId",
  );

  assert.equal(
    audit.evidenceId,
    decision.evidenceId,
    "Enterprise audit evidenceId must match runtime evidenceId",
  );

  // ==========================================================
  // INDEPENDENT AUDIT ID INVARIANT
  // ==========================================================

  assert.notEqual(
    audit.auditId,
    decision.decisionId,
    "auditId MUST be independent from decisionId",
  );

  assert.notEqual(
    audit.auditId,
    decision.executionId,
    "auditId MUST be independent from executionId",
  );

  assert.notEqual(
    audit.auditId,
    decision.evidenceId,
    "auditId MUST be independent from evidenceId",
  );

  console.log(
    "Independent auditId: PASS",
  );

  // ==========================================================
  // DECISION CONTRACT
  // ==========================================================

  assert.equal(
    audit.decision,
    "ALLOW",
    "Enterprise audit decision must be ALLOW",
  );

  assert.equal(
    audit.enforcementStatus,
    decision.enforcementStatus,
    "Enterprise audit enforcementStatus must match runtime",
  );

  assert.equal(
    audit.reason,
    decision.reason,
    "Enterprise audit reason must match runtime",
  );

  console.log(
    "Audit ↔ decision contract: PASS",
  );

  console.log("");
  console.log("============================================================");
  console.log(" STEP 3.0-12C-B PASS");
  console.log(" ENTERPRISE AUDIT WIRING = VERIFIED");
  console.log(" INDEPENDENT auditId = VERIFIED");
  console.log(" RUNTIME CORRELATION = VERIFIED");
  console.log("============================================================");
  console.log("");
}

main().catch((error: unknown) => {
  console.error("");
  console.error("============================================================");
  console.error(" STEP 3.0-12C-B FAIL");
  console.error("============================================================");
  console.error(error);
  process.exitCode = 1;
});