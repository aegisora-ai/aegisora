import {
  EnforcementGate,
} from "../src/enforcement";
import {
  ProviderExecutionGateway,
} from "../src/providers/provider-execution-gateway";
import {
  RuntimeContext,
} from "../src/context/runtime-context";
import {
  PermissionEngine,
} from "../src/permissions";
import {
  ApprovalEngine,
} from "../src/approval";

import type {
  EnterpriseEntitlementSet,
} from "@aegisora/core";

interface UsageSnapshot {
  readonly workspaceId: string;
  readonly tokens: number;
  readonly executions: number;
  readonly agents: number;
  readonly tools: number;
}

class StaticUsageReader {
  constructor(
    private readonly snapshot: UsageSnapshot,
  ) {}

  async getSnapshot(workspaceId: string) {
    if (workspaceId !== this.snapshot.workspaceId) {
      throw new Error("WORKSPACE_MISMATCH");
    }

    return this.snapshot;
  }
}

class SpyProvider {
  calls = 0;

  async generate(
    request: any,
    context: any,
  ) {
    this.calls++;

    return {
      output: "Aegisora provider execution",
      usage: {
        inputTokens: 2,
        outputTokens: 3,
        totalTokens: 5,
      },
    };
  }
}

function assert(
  condition: boolean,
  message: string,
) {
  if (!condition) {
    throw new Error(
      `ASSERTION_FAILED: ${message}`,
    );
  }
}

async function createGateway(
  executions: number,
) {
  const context =
    new RuntimeContext();

  const agentId =
    "agent-17b-e2e";

  context.agentRegistry.register({
    id: agentId,
    name: agentId,
  });

  const registeredAgent =
    context.agentRegistry.getById(agentId);

  if (!registeredAgent) {
    throw new Error(
      "17B test agent registration failed.",
    );
  }

  const permissions =
    new PermissionEngine(context);

  const approvals =
    new ApprovalEngine();

  const workspaceId =
    "ws-17b-e2e";

  const entitlements:
    EnterpriseEntitlementSet = {
      workspaceId,

      plan: {
        planId:
          "enterprise-e2e",

        name:
          "Enterprise E2E",

        active: true,
      },

      limits: {
        executions: 1,
      },
    };

  const usageReader =
    new StaticUsageReader({
      workspaceId,
      tokens: 0,
      executions,
      agents: 0,
      tools: 0,
    });

  const gateway =
    new ProviderExecutionGateway(
      context,
      undefined,
      undefined,
      permissions,
      undefined,
      approvals,
      undefined,
      {
        workspaceId,
        entitlements,
        usageReader,
      },
    );

  const spy =
    new SpyProvider();

  const providerRouter =
    (gateway as any).router;

  providerRouter.register(
    "openai",
    spy,
    (gateway as any).providerExecutionToken,
  );

  return {
    gateway,
    spy,
    workspaceId,
  };
}

async function main() {

  const agentId =
    "agent-17b-e2e";

  /*
   * ----------------------------------------------------------
   * CASE 1
   * Available execution quota -> ALLOW -> provider called.
   * ----------------------------------------------------------
   */

  const allowCase =
    await createGateway(0);

  const allowResult =
    await allowCase.gateway.generate({
      agentId:
        agentId,

      provider:
        "openai",

      request: {
        prompt:
          "safe enterprise request",

        model:
          "test-model",
      },

      metadata: {
        workspaceId:
          "attacker-workspace",

        plan:
          "fake-plan",

        limit:
          999999,
      },
    });

  assert(
    allowResult.output ===
      "Aegisora provider execution",
    "ALLOW request must reach provider",
  );

  assert(
    allowCase.spy.calls === 1,
    "ALLOW request must invoke provider exactly once",
  );

  console.log(
    "PASS: available execution quota -> ALLOW",
  );

  console.log(
    "PASS: ALLOW reaches provider exactly once",
  );

  /*
   * ----------------------------------------------------------
   * CASE 2
   * Exhausted execution quota -> BLOCK -> zero calls.
   * ----------------------------------------------------------
   */

  const blockCase =
    await createGateway(1);

  let blocked = false;

  try {

    await blockCase.gateway.generate({
      agentId:
        agentId,

      provider:
        "openai",

      request: {
        prompt:
          "quota exhausted request",

        model:
          "test-model",
      },

      metadata: {
        workspaceId:
          "attacker-workspace",

        plan:
          "enterprise",

        limit:
          999999999,

        entitlement:
          "ALLOW",
      },
    });

  } catch (error) {

    blocked =
      String(error)
        .includes("[ENFORCEMENT:BLOCK]");
  }

  assert(
    blocked,
    "exhausted quota must produce enforcement BLOCK",
  );

  assert(
    blockCase.spy.calls === 0,
    "BLOCKED request must never invoke provider",
  );

  console.log(
    "PASS: exhausted execution quota -> BLOCK",
  );

  console.log(
    "PASS: BLOCKED request provider calls = 0",
  );

  /*
   * ----------------------------------------------------------
   * CASE 3
   * Workspace spoofing must remain ineffective.
   * ----------------------------------------------------------
   */

  const spoofCase =
    await createGateway(1);

  let spoofBlocked = false;

  try {

    await spoofCase.gateway.generate({
      agentId:
        agentId,

      provider:
        "openai",

      request: {
        prompt:
          "workspace spoof attempt",

        model:
          "test-model",
      },

      metadata: {
        workspaceId:
          spoofCase.workspaceId,

        entitlementWorkspaceId:
          "attacker-workspace",

        plan:
          "enterprise",

        executionsRemaining:
          999999,
      },
    });

  } catch (error) {

    spoofBlocked =
      String(error)
        .includes("[ENFORCEMENT:BLOCK]");
  }

  assert(
    spoofBlocked,
    "caller metadata must not bypass exhausted quota",
  );

  assert(
    spoofCase.spy.calls === 0,
    "workspace metadata spoof must not reach provider",
  );

  console.log(
    "PASS: caller workspace/plan metadata cannot bypass quota",
  );

  console.log(
    "PASS: spoof attempt provider calls = 0",
  );

  /*
   * ----------------------------------------------------------
   * FINAL
   * ----------------------------------------------------------
   */

  console.log("");
  console.log(
    "============================================================",
  );
  console.log(
    "TRACE 17B PASS - REAL PROVIDER EXECUTION ENFORCEMENT",
  );
  console.log(
    "============================================================",
  );
}

main().catch((error) => {
  console.error("");
  console.error(
    "TRACE 17B FAIL",
  );
  console.error(error);
  process.exit(1);
});
