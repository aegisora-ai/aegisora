import assert from "node:assert/strict";

import {
  ProviderExecutionGateway,
} from "../src/providers/provider-execution-gateway";

import {
  ProviderRouter,
} from "../src/providers/provider-router";

import type {
  ProviderName,
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

  public requests: ProviderRequest[] = [];

  async generate(
    request: ProviderRequest,
    _context?: unknown,
  ): Promise<ProviderResponse> {

    this.calls++;

    this.requests.push(request);

    return this.buildResponse(
      "openai",
      request.model ?? "spy-model",
      `SPY:${request.prompt}`,
    );
  }
}

function expectEnforcementError(
  error: unknown,
  expectedDecision: "BLOCK" | "ESCALATE",
): void {

  assert.ok(
    error instanceof Error,
    "Expected Error",
  );

  assert.match(
    error.message,
    new RegExp(
      `\\[ENFORCEMENT:${expectedDecision}\\]`,
    ),
  );
}

async function main(): Promise<void> {

  console.log("[1] Creating runtime context...");

  const context =
    new RuntimeContext();

  const executionToken =
    Symbol(
      "aegisora.3.0.10.execution",
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

  const agentId =
    "3.0-10-e2e-agent";

  context.agentRegistry.register({
    id: agentId,
    name: "3.0-10 E2E Agent",
    status: "idle",
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  assert.ok(
    context.agentRegistry.getById(agentId),
    "Agent must exist in canonical runtime registry",
  );

  console.log(
    "Canonical AgentRegistry identity: PASS",
  );

  // ========================================================
  // ALLOW
  // ========================================================

  console.log(
    "[2] ALLOW -> provider MUST execute...",
  );

  const allowed =
    await gateway.generate({
      agentId,
      provider: "openai",
      request: {
        prompt: "3.0-10 allow test",
      },
    });

  assert.equal(
    allowed.output,
    "SPY:3.0-10 allow test",
  );

  assert.equal(
    spy.calls,
    1,
    "ALLOW must call provider exactly once",
  );

  assert.equal(
    spy.requests.length,
    1,
    "ALLOW must create one provider request",
  );

  console.log(
    "ALLOW path: PASS (provider calls = 1)",
  );

  // ========================================================
  // BLOCK
  // ========================================================

  console.log(
    "[3] BLOCK -> provider MUST NOT execute...",
  );

  const callsBeforeBlock =
    spy.calls;

  const unknownProvider =
    "unknown-provider" as unknown as ProviderName;

  await assert.rejects(
    gateway.generate({
      agentId,
      provider: unknownProvider,
      request: {
        prompt: "3.0-10 block test",
      },
    }),
    (error: unknown) => {

      expectEnforcementError(
        error,
        "BLOCK",
      );

      return true;
    },
  );

  assert.equal(
    spy.calls,
    callsBeforeBlock,
    "BLOCK must not invoke provider",
  );

  assert.equal(
    spy.requests.length,
    1,
    "BLOCK must not create provider request",
  );

  console.log(
    "BLOCK path: PASS (provider calls unchanged)",
  );

  // ========================================================
  // ESCALATE
  // ========================================================

  console.log(
    "[4] ESCALATE -> provider MUST NOT execute...",
  );

  const callsBeforeEscalate =
    spy.calls;

  await assert.rejects(
    gateway.generate({
      agentId,
      provider: "openai",
      request: {
        prompt: "3.0-10 escalate test",
      },
      metadata: {
        requiresReview: true,
      },
    }),
    (error: unknown) => {

      expectEnforcementError(
        error,
        "ESCALATE",
      );

      return true;
    },
  );

  assert.equal(
    spy.calls,
    callsBeforeEscalate,
    "ESCALATE must not invoke provider",
  );

  assert.equal(
    spy.requests.length,
    1,
    "ESCALATE must not create provider request",
  );

  console.log(
    "ESCALATE path: PASS (provider calls unchanged)",
  );

  // ========================================================
  // RECOVERY AFTER BLOCK
  // ========================================================

  console.log(
    "[5] Recovery after BLOCK...",
  );

  const recovered =
    await gateway.generate({
      agentId,
      provider: "openai",
      request: {
        prompt: "3.0-10 recovery test",
      },
    });

  assert.equal(
    recovered.output,
    "SPY:3.0-10 recovery test",
  );

  assert.equal(
    spy.calls,
    2,
    "Valid request after BLOCK must execute",
  );

  console.log(
    "BLOCK recovery: PASS",
  );

  // ========================================================
  // RECOVERY AFTER ESCALATE
  // ========================================================

  console.log(
    "[6] Recovery after ESCALATE...",
  );

  const finalResponse =
    await gateway.generate({
      agentId,
      provider: "openai",
      request: {
        prompt: "3.0-10 final allow test",
      },
    });

  assert.equal(
    finalResponse.output,
    "SPY:3.0-10 final allow test",
  );

  assert.equal(
    spy.calls,
    3,
    "Valid request after ESCALATE must execute",
  );

  assert.equal(
    spy.requests.length,
    3,
    "Expected exactly three successful provider executions",
  );

  console.log(
    "ESCALATE recovery: PASS",
  );

  // ========================================================
  // FINAL SECURITY ASSERTIONS
  // ========================================================

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    " 3.0-10 REAL PROVIDER E2E: PASS",
  );
  console.log(
    "============================================================",
  );
  console.log(
    "ALLOW    -> provider calls: 0 -> 1",
  );
  console.log(
    "BLOCK    -> provider calls unchanged",
  );
  console.log(
    "ESCALATE -> provider calls unchanged",
  );
  console.log(
    "RECOVERY -> subsequent ALLOW executions succeed",
  );
}

main().catch(
  (error: unknown) => {
    console.error(error);
    process.exit(1);
  },
);
