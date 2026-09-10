import assert from "node:assert/strict";

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
      request.model ?? "workspace-isolation-model",
      `WORKSPACE-ISOLATION:${request.prompt}`,
    );
  }
}

async function main(): Promise<void> {
  console.log("");
  console.log("============================================================");
  console.log(" 3.0-11D-4 CROSS-WORKSPACE APPROVAL ISOLATION");
  console.log("============================================================");

  const workspaceA = "workspace-a-11d";
  const workspaceB = "workspace-b-11d";

  // ==========================================================
  // WORKSPACE A RUNTIME
  // ==========================================================

  console.log("[1] Bootstrapping Workspace A runtime...");

  const contextA = new RuntimeContext();

  const tokenA =
    Symbol("aegisora.3.0.11d.workspace-a");

  const routerA =
    new ProviderRouter(tokenA);

  const spyA =
    new SpyProvider();

  routerA.register(
    "openai",
    spyA,
  );

  const gatewayA =
    new ProviderExecutionGateway(
      contextA,
      routerA,
      undefined,
      undefined,
      tokenA,
      undefined,
      {
        workspaceId: workspaceA,
        requesterId: "requester-a",
      },
    );

  const agentA =
    "3.0-11d-workspace-a-agent";

  contextA.agentRegistry.register({
    id: agentA,
    name: "Workspace A Agent",
    status: "idle",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.ok(
    contextA.agentRegistry.getById(agentA),
  );

  // ==========================================================
  // CREATE APPROVAL IN WORKSPACE A
  // ==========================================================

  console.log("[2] Creating approval in Workspace A...");

  const prompt =
    "3.0-11D workspace-bound protected execution";

  await assert.rejects(
    gatewayA.generate({
      agentId: agentA,
      provider: "openai",
      request: {
        prompt,
      },
      metadata: {
        requiresReview: true,
      },
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error);

      assert.match(
        error.message,
        /\[ENFORCEMENT:ESCALATE\]/,
      );

      return true;
    },
  );

  assert.equal(
    spyA.calls,
    0,
    "Workspace A escalation must not execute provider",
  );

  const runtimeApproval =
    gatewayA
      .getApprovalEngine()
      .list()
      .find(
        (item) =>
          item.status === "pending",
      );

  assert.ok(
    runtimeApproval,
    "Workspace A approval must exist",
  );

  assert.ok(
    runtimeApproval.approvalId,
  );

  assert.ok(
    runtimeApproval.executionId,
  );

  const bridgeA =
    gatewayA.getEnterpriseApprovalBridge();

  assert.ok(
    bridgeA,
    "Workspace A enterprise bridge must exist",
  );

  const enterpriseA =
    bridgeA.getByRuntimeApprovalId(
      workspaceA,
      runtimeApproval.approvalId,
    );

  assert.ok(
    enterpriseA,
    "Workspace A enterprise approval binding must exist",
  );

  assert.equal(
    enterpriseA.workspaceId,
    workspaceA,
    "Approval must belong to Workspace A",
  );

  console.log(
    "Workspace A approval binding: PASS",
  );

  // ==========================================================
  // APPROVE IN WORKSPACE A
  // ==========================================================

  console.log("[3] Approving Workspace A approval...");

  const approved =
    gatewayA
      .getApprovalEngine()
      .approve({
        approvalId:
          runtimeApproval.approvalId,
        actorId:
          "workspace-a-reviewer",
      });

  assert.equal(
    approved.status,
    "approved",
  );

  assert.equal(
    gatewayA
      .getApprovalEngine()
      .get(runtimeApproval.approvalId)
      ?.status,
    "approved",
  );

  console.log(
    "Workspace A approval state: APPROVED",
  );

  // ==========================================================
  // WORKSPACE B RUNTIME
  // ==========================================================

  console.log("[4] Bootstrapping Workspace B runtime...");

  const contextB =
    new RuntimeContext();

  const tokenB =
    Symbol("aegisora.3.0.11d.workspace-b");

  const routerB =
    new ProviderRouter(tokenB);

  const spyB =
    new SpyProvider();

  routerB.register(
    "openai",
    spyB,
  );

  const gatewayB =
    new ProviderExecutionGateway(
      contextB,
      routerB,
      undefined,
      undefined,
      tokenB,
      undefined,
      {
        workspaceId: workspaceB,
        requesterId: "requester-b",
      },
    );

  const agentB =
    "3.0-11d-workspace-b-agent";

  contextB.agentRegistry.register({
    id: agentB,
    name: "Workspace B Agent",
    status: "idle",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.ok(
    contextB.agentRegistry.getById(agentB),
  );

  // ==========================================================
  // FOREIGN WORKSPACE REPLAY
  // ==========================================================

  console.log(
    "[5] Attempting Workspace A approval in Workspace B...",
  );

  const callsBefore =
    spyB.calls;

  await assert.rejects(
    gatewayB.generate({
      agentId: agentB,
      provider: "openai",
      request: {
        prompt,
      },
      metadata: {
        requiresReview: true,
        approvalId:
          runtimeApproval.approvalId,
      },
    }),
    (error: unknown) => {
      assert.ok(error instanceof Error);

      assert.match(
        error.message,
        /\[ENFORCEMENT:(BLOCK|ESCALATE)\]/,
      );

      return true;
    },
  );

  assert.equal(
    spyB.calls,
    callsBefore,
    "Foreign workspace approval must never reach provider",
  );

  console.log(
    "Cross-workspace execution blocked: PASS",
  );

  // ==========================================================
  // VERIFY APPROVAL INTEGRITY
  // ==========================================================

  console.log(
    "[6] Verifying original Workspace A approval integrity...",
  );

  const original =
    gatewayA
      .getApprovalEngine()
      .get(runtimeApproval.approvalId);

  assert.equal(
    original?.status,
    "approved",
    "Foreign workspace attack must not consume Workspace A approval",
  );

  assert.equal(
    enterpriseA.workspaceId,
    workspaceA,
  );

  assert.equal(
    enterpriseA.runtimeApprovalId,
    runtimeApproval.approvalId,
  );

  console.log(
    "Original approval preserved: PASS",
  );

  // ==========================================================
  // FINAL
  // ==========================================================

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    " 3.0-11D-4 CROSS-WORKSPACE ISOLATION: PASS",
  );
  console.log(
    "============================================================",
  );
  console.log(
    "Workspace A approval created       ✅",
  );
  console.log(
    "Workspace A approval approved      ✅",
  );
  console.log(
    "Workspace B foreign replay         ✅",
  );
  console.log(
    "Provider execution prevented       ✅",
  );
  console.log(
    "Original approval preserved        ✅",
  );
  console.log(
    "Enterprise binding preserved       ✅",
  );
}

main().catch(
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
