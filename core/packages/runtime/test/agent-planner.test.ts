import assert from "node:assert/strict";
import test from "node:test";

import { AgentPlanner } from "../src/agent/planner";

test("createPlan returns the same goal it was given", () => {
  const planner = new AgentPlanner();
  const goal = "ship a feature";

  const plan = planner.createPlan(goal);

  assert.equal(plan.goal, goal);
});

test("createPlan returns 3 steps with ids step-1..step-3 and actions analyze, execute, verify", () => {
  const planner = new AgentPlanner();

  const plan = planner.createPlan("investigate an issue");

  assert.equal(plan.steps.length, 3);
  assert.deepEqual(
    plan.steps.map((step) => ({ id: step.id, action: step.action })),
    [
      { id: "step-1", action: "analyze" },
      { id: "step-2", action: "execute" },
      { id: "step-3", action: "verify" },
    ],
  );
});
