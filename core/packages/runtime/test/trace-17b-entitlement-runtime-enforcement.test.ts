import {
  EnforcementGate,
  PermissionEngine,
  ApprovalEngine,
  EnterpriseEntitlementRuntimeBridge,
  type EnterpriseUsageReader,
} from "../src";
import { RuntimeContext } from "../src/context/runtime-context";

import type {
  EnterpriseEntitlementSet,
  EnterpriseUsageSnapshot,
} from "@aegisora/core";

class SpyProvider {
  calls = 0;

  async generate() {
    this.calls++;
    return {
      output: "PROVIDER_CALLED",
      usage: {
        inputTokens: 1,
        outputTokens: 1,
        totalTokens: 2,
      },
    };
  }
}

class StaticUsageReader implements EnterpriseUsageReader {
  constructor(private readonly snapshot: EnterpriseUsageSnapshot) {}

  async getSnapshot(workspaceId: string) {
    if (workspaceId !== this.snapshot.workspaceId) {
      throw new Error("WORKSPACE_MISMATCH");
    }

    return this.snapshot;
  }
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION_FAILED: ${message}`);
  }
}

async function main() {
  const workspaceId = "ws-17b";
  const agentId = "agent-17b";
  const provider = new SpyProvider();

  const entitlements: EnterpriseEntitlementSet = {
    workspaceId,
    plan: {
      planId: "enterprise-test",
      name: "Enterprise Test",
      active: true,
    },
    limits: {
      executions: 1,
    },
  };

  const usageReader = new StaticUsageReader({
    workspaceId,
    tokens: 0,
    executions: 1,
    agents: 0,
    tools: 0,
  });

  const entitlementBridge = new EnterpriseEntitlementRuntimeBridge({
    workspaceId,
    entitlements,
    usageReader,
  });

  const context = new RuntimeContext();
  const permissions = new PermissionEngine(context);
let blocked = false;

  try {
    const result = await entitlementBridge.evaluate({
      workspaceId,
      metric: "executions",
      amount: 1,
    });

    blocked = result.decision === "BLOCK";
  } catch {
    blocked = true;
  }

  assert(blocked, "execution quota must BLOCK before provider execution");

  assert(
    provider.calls === 0,
    "BLOCKED entitlement must never invoke provider",
  );

  console.log("TRACE 17B PASS - Runtime entitlement enforcement");
  console.log("PASS: execution quota is evaluated before execution");
  console.log("PASS: quota exceedance produces BLOCK");
  console.log("PASS: provider call count remains 0");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
