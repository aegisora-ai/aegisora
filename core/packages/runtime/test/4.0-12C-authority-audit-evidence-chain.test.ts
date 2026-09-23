import assert from "node:assert/strict";

import {
  AgentRuntime,
} from "../src/agent/runtime/agent-runtime";

import {
  EnterpriseAuditLedger,
  EnterpriseEvidenceLedger,
} from "@aegisora/core";

import type {
  CompromiseSimulationGraph,
  ProviderRequest,
  ProviderResponse,
} from "@aegisora/core";

import {
  BaseProvider,
} from "../src/providers/base-provider";


class AuditChainProvider extends BaseProvider {

  public readonly name = "audit-chain-provider";

  public calls = 0;

  async generate(
    request: ProviderRequest,
    _context?: unknown,
  ): Promise<ProviderResponse> {

    this.calls += 1;

    return this.buildResponse(
      "audit-chain-provider",
      request.model ?? "test-model",
      `AUDITCHAIN:${request.prompt}`,
    );
  }
}


function lowGraph(
  agentId: string,
): CompromiseSimulationGraph {

  return {
    nodes: [
      {
        id: `agent:${agentId}`,
        workspaceId: "workspace-audit-chain",
        type: "agent",
      },
    ],

    edges: [],
  };
}


function highGraph(
  agentId: string,
): CompromiseSimulationGraph {

  return {
    nodes: [
      {
        id: `agent:${agentId}`,
        workspaceId: "workspace-audit-chain",
        type: "agent",
      },

      {
        id: "agent:audit-delegate",
        workspaceId: "workspace-audit-chain",
        type: "agent",
      },

      {
        id: "resource:audit-sensitive-production",
        workspaceId: "workspace-audit-chain",
        type: "resource",
        sensitive: true,
        environment: "production",
      },
    ],

    edges: [
      {
        id: "audit-high-delegation",
        workspaceId: "workspace-audit-chain",
        from: `agent:${agentId}`,
        to: "agent:audit-delegate",
        type: "DELEGATES_TO",
      },

      {
        id: "audit-high-resource",
        workspaceId: "workspace-audit-chain",
        from: "agent:audit-delegate",
        to: "resource:audit-sensitive-production",
        type: "REACHES",
      },
    ],
  };
}


function createFixture() {

  const runtime =
    new AgentRuntime();

  const agentId =
    "4.0-12C-audit-chain-agent";

  runtime.create(
    agentId,
  );

  const gateway =
    runtime.getProviderGateway();

  const provider =
    new AuditChainProvider();

  gateway.registerProvider(
    "openai",
    provider,
  );

  const auditLedger =
    new EnterpriseAuditLedger();

  const evidenceLedger =
    new EnterpriseEvidenceLedger();

  gateway.configureEnterpriseAudit({
    workspaceId:
      "workspace-audit-chain",

    writer: {
      create: (input) =>
        auditLedger.create(
          input,
        ),
    },
  });

  gateway.configureEnterpriseEvidence({
    workspaceId:
      "workspace-audit-chain",

    writer: {
      create: (input) =>
        evidenceLedger.create(
          input,
        ),
    },
  });

  gateway.configureAuthorityAwareExecutionFromRuntimeContext();

  return {
    runtime,
    gateway,
    provider,
    auditLedger,
    evidenceLedger,
    agentId,
  };
}


async function run() {

  const fixture =
    createFixture();

  const context =
    fixture.runtime.getContext();

  context.configureAuthorityContext({
    workspaceId:
      "workspace-audit-chain",

    graph:
      lowGraph(
        fixture.agentId,
      ),
  });

  console.log("");
  console.log("=== A — LOW AUTHORITY / ALLOW ===");

  const allowed =
    await fixture.gateway.generate({
      agentId:
        fixture.agentId,

      provider:
        "openai",

      request: {
        prompt:
          "audit-chain-allow",
      },
    });

  assert.equal(
    allowed.output,
    "AUDITCHAIN:audit-chain-allow",
  );

  assert.equal(
    fixture.provider.calls,
    1,
  );

  assert.ok(
    allowed,
  );

  const localAllowTrace =
    context.decisionStore
      .getAll()
      .find(
        (item) =>
          item.executionId ===
          allowed.metadata?.executionId,
      );

  const localAllowTraces =
    context.decisionStore.getAll();

  const localAllow =
    localAllowTraces[
      localAllowTraces.length - 1
    ];

  assert.ok(
    localAllow,
  );

  const allowEvidenceRecords =
    context.evidenceStore.getAll();

  assert.ok(
    allowEvidenceRecords.length >= 1,
  );

  const allowEvidence =
    allowEvidenceRecords[
      allowEvidenceRecords.length - 1
    ];

  const allowAudits =
    fixture.auditLedger.listForWorkspace(
      "workspace-audit-chain",
    );

  const allowAudit =
    allowAudits[
      allowAudits.length - 1
    ];

  const allowEnterpriseEvidence =
    fixture.evidenceLedger.listForWorkspace(
      "workspace-audit-chain",
    );

  const allowEnterpriseEvidenceRecord =
    allowEnterpriseEvidence[
      allowEnterpriseEvidence.length - 1
    ];

  console.log("");
  console.log("ALLOW DECISION:");
  console.log(
    JSON.stringify(
      localAllow,
      null,
      2,
    ),
  );

  console.log("");
  console.log("ALLOW LOCAL EVIDENCE:");
  console.log(
    JSON.stringify(
      allowEvidence,
      null,
      2,
    ),
  );

  console.log("");
  console.log("ALLOW ENTERPRISE AUDIT:");
  console.log(
    JSON.stringify(
      allowAudit,
      null,
      2,
    ),
  );

  console.log("");
  console.log("ALLOW ENTERPRISE EVIDENCE:");
  console.log(
    JSON.stringify(
      allowEnterpriseEvidenceRecord,
      null,
      2,
    ),
  );

  assert.ok(
    allowAudit,
  );

  assert.ok(
    allowEnterpriseEvidenceRecord,
  );

  assert.equal(
    allowAudit.traceId,
    localAllow.traceId,
  );

  assert.equal(
    allowAudit.decisionId,
    localAllow.decisionId,
  );

  assert.equal(
    allowAudit.executionId,
    localAllow.executionId,
  );

  assert.equal(
    allowAudit.evidenceId,
    localAllow.evidenceId,
  );

  assert.equal(
    allowEnterpriseEvidenceRecord.traceId,
    localAllow.traceId,
  );

  assert.equal(
    allowEnterpriseEvidenceRecord.decisionId,
    localAllow.decisionId,
  );

  assert.equal(
    allowEnterpriseEvidenceRecord.executionId,
    localAllow.executionId,
  );

  assert.equal(
    allowEnterpriseEvidenceRecord.evidenceId,
    localAllow.evidenceId,
  );

  assert.equal(
    allowEnterpriseEvidenceRecord.finalDecision,
    "ALLOW",
  );

  console.log("");
  console.log(
    "[PASS] ALLOW identity chain preserved",
  );

  console.log("");
  console.log("=== B — HIGH AUTHORITY / ESCALATE ===");

  context.updateAuthorityGraph(
    highGraph(
      fixture.agentId,
    ),
  );

  await assert.rejects(
    () =>
      fixture.gateway.generate({
        agentId:
          fixture.agentId,

        provider:
          "openai",

        request: {
          prompt:
            "audit-chain-high",
        },
      }),

    /ENFORCEMENT:ESCALATE/,
  );

  assert.equal(
    fixture.provider.calls,
    1,
  );

  const allLocalTraces =
    context.decisionStore.getAll();

  const highLocal =
    allLocalTraces[
      allLocalTraces.length - 1
    ];

  assert.ok(
    highLocal,
  );

  const allLocalEvidence =
    context.evidenceStore.getAll();

  const highLocalEvidence =
    allLocalEvidence[
      allLocalEvidence.length - 1
    ];

  assert.ok(
    highLocalEvidence,
  );

  const auditsAfterHigh =
    fixture.auditLedger.listForWorkspace(
      "workspace-audit-chain",
    );

  const highAudit =
    auditsAfterHigh[
      auditsAfterHigh.length - 1
    ];

  const enterpriseEvidenceAfterHigh =
    fixture.evidenceLedger.listForWorkspace(
      "workspace-audit-chain",
    );

  const highEnterpriseEvidence =
    enterpriseEvidenceAfterHigh[
      enterpriseEvidenceAfterHigh.length - 1
    ];

  console.log("");
  console.log("HIGH LOCAL DECISION:");
  console.log(
    JSON.stringify(
      highLocal,
      null,
      2,
    ),
  );

  console.log("");
  console.log("HIGH LOCAL EVIDENCE:");
  console.log(
    JSON.stringify(
      highLocalEvidence,
      null,
      2,
    ),
  );

  console.log("");
  console.log("HIGH ENTERPRISE AUDIT:");
  console.log(
    JSON.stringify(
      highAudit,
      null,
      2,
    ),
  );

  console.log("");
  console.log("HIGH ENTERPRISE EVIDENCE:");
  console.log(
    JSON.stringify(
      highEnterpriseEvidence,
      null,
      2,
    ),
  );

  assert.ok(
    highAudit,
  );

  assert.ok(
    highEnterpriseEvidence,
  );

  console.log("");
  console.log(
    "HIGH authority observed by execution boundary:",
    "ESCALATE",
  );

  console.log(
    "Provider calls:",
    fixture.provider.calls,
  );

  console.log(
    "Local decision:",
    highLocal.decision,
  );

  console.log(
    "Enterprise audit decision:",
    highAudit.decision,
  );

  console.log(
    "Enterprise evidence finalDecision:",
    highEnterpriseEvidence.finalDecision,
  );

  console.log("");
  console.log(
    "NOTE: this section intentionally exposes whether",
  );

  console.log(
    "the authority-layer decision is reflected downstream",
  );

  console.log(
    "in the canonical audit/evidence records.",
  );

  console.log("");
  console.log(
    "[PASS] audit/evidence chain inspected",
  );

  console.log("");
  console.log("============================================================");
  console.log(" 4.0-12C AUDIT / EVIDENCE CHAIN INSPECTION COMPLETE");
  console.log("============================================================");
}


run().catch(
  (error) => {
    console.error("");
    console.error(
      "4.0-12C AUDIT / EVIDENCE CHAIN TEST FAILED",
    );
    console.error(error);
    process.exitCode = 1;
  },
);