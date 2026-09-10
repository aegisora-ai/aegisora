import { EnterpriseEntitlementEngine } from "@aegisora/core";

type State = {
  workspaceId: string;
  plan: {
    planId: string;
    name: string;
    active: boolean;
  };
  limits: {
    executions?: number;
  };
};

type Snapshot = {
  workspaceId: string;
  tokens: number;
  executions: number;
  agents: number;
  tools: number;
};

async function main() {
  const engine = new EnterpriseEntitlementEngine();

  const entitlement: State = {
    workspaceId: "ws-17c",
    plan: {
      planId: "enterprise",
      name: "Enterprise",
      active: true,
    },
    limits: {
      executions: 1,
    },
  };

  const base = {
    workspaceId: "ws-17c",
    metric: "executions" as const,
    amount: 1,
  };

  const first = engine.evaluate(
    entitlement as never,
    {
      workspaceId: "ws-17c",
      tokens: 0,
      executions: 0,
      agents: 0,
      tools: 0,
    } satisfies Snapshot,
    base,
  );

  if (first.decision !== "ALLOW") {
    throw new Error("Expected first execution to be ALLOW.");
  }

  const second = engine.evaluate(
    entitlement as never,
    {
      workspaceId: "ws-17c",
      tokens: 0,
      executions: 1,
      agents: 0,
      tools: 0,
    } satisfies Snapshot,
    base,
  );

  if (second.decision !== "BLOCK") {
    throw new Error("Expected exhausted execution quota to BLOCK.");
  }

  console.log("PASS: first execution allowed");
  console.log("PASS: exhausted execution blocked");
  console.log("PASS: execution quota evaluation remains fail-closed");
}

void main();
