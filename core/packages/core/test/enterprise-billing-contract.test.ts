import {
  createEnterpriseSubscription,
  billingAllowsExecution,
} from "../src";

function assert(condition: boolean, message: string) {
  if (!condition) throw new Error(`ASSERTION_FAILED: ${message}`);
}

const active = createEnterpriseSubscription({
  subscriptionId: "sub-1",
  workspaceId: "ws-1",
  planId: "enterprise",
  currentPeriodStart: "2026-01-01T00:00:00.000Z",
  currentPeriodEnd: "2026-02-01T00:00:00.000Z",
});

assert(active.workspaceId === "ws-1", "workspace must be bound");
assert(active.planId === "enterprise", "plan must be bound");
assert(billingAllowsExecution(active), "ACTIVE subscription must allow execution");

const canceled = {
  ...active,
  status: "CANCELED" as const,
};

assert(!billingAllowsExecution(canceled), "CANCELED subscription must block execution");

let rejected = false;

try {
  createEnterpriseSubscription({
    subscriptionId: "sub-invalid",
    workspaceId: "ws-1",
    planId: "enterprise",
    currentPeriodStart: "2026-02-01T00:00:00.000Z",
    currentPeriodEnd: "2026-01-01T00:00:00.000Z",
  });
} catch {
  rejected = true;
}

assert(rejected, "invalid billing period must be rejected");

console.log("TRACE BILLING CONTRACT PASS");
console.log("PASS: workspace binding");
console.log("PASS: plan binding");
console.log("PASS: ACTIVE execution allowance");
console.log("PASS: canceled subscription blocks");
console.log("PASS: invalid period rejection");
