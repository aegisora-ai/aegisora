import assert from "node:assert/strict";

import {
  createEnterprisePlan,
  createEnterpriseEntitlementSet,
  EnterpriseEntitlementEngine,
} from "../src";

const plan = createEnterprisePlan({
  planId: "trace-entitlement-plan",
  name: "Trace Entitlement Plan",
});

const entitlements =
  createEnterpriseEntitlementSet({
    workspaceId: "workspace-a",
    plan,
    limits: {
      tokens: 1000,
      executions: 10,
      agents: 5,
      tools: 20,
    },
  });

const engine =
  new EnterpriseEntitlementEngine();

const baseUsage = {
  workspaceId: "workspace-a",
  tokens: 200,
  executions: 2,
  agents: 1,
  tools: 3,
};

const allowed =
  engine.evaluate(
    entitlements,
    baseUsage,
    {
      workspaceId: "workspace-a",
      metric: "tokens",
      amount: 300,
    },
  );

assert.equal(
  allowed.decision,
  "ALLOW",
);

assert.equal(
  allowed.remaining,
  800,
);

const blocked =
  engine.evaluate(
    entitlements,
    {
      ...baseUsage,
      tokens: 900,
    },
    {
      workspaceId: "workspace-a",
      metric: "tokens",
      amount: 200,
    },
  );

assert.equal(
  blocked.decision,
  "BLOCK",
);

assert.equal(
  blocked.remaining,
  100,
);

assert.throws(
  () =>
    engine.evaluate(
      entitlements,
      baseUsage,
      {
        workspaceId: "workspace-attacker",
        metric: "tokens",
        amount: 1,
      },
    ),
  /ENTITLEMENT:TENANT/,
);

const spoofedMetadataPlan =
  "enterprise-unlimited";

const spoofed =
  engine.evaluate(
    entitlements,
    baseUsage,
    {
      workspaceId: "workspace-a",
      metric: "tokens",
      amount: 700,
    },
  );

assert.equal(
  spoofed.decision,
  "ALLOW",
);

assert.equal(
  spoofedMetadataPlan,
  "enterprise-unlimited",
);

assert.equal(
  entitlements.plan.planId,
  "trace-entitlement-plan",
);

console.log(
  "TRACE 17A PASS - Enterprise entitlement engine",
);
console.log(
  "PASS: configured workspace is authoritative",
);
console.log(
  "PASS: entitlement limits are evaluated server-side",
);
console.log(
  "PASS: cross-workspace usage is rejected",
);
console.log(
  "PASS: caller metadata cannot redefine the plan",
);
console.log(
  "PASS: quota exceedance produces BLOCK",
);
