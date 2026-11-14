import assert from "node:assert/strict";
import test from "node:test";

import { RequestValidator } from "../src/services/request-validator";

test("validate returns true for request with agentId and action", () => {
  const validator = new RequestValidator();

  assert.equal(
    validator.validate({
      agentId: "agent-1",
      action: "run",
    } as any),
    true,
  );
});

test("validate throws when agentId is missing", () => {
  const validator = new RequestValidator();

  assert.throws(
    () =>
      validator.validate({
        action: "run",
      } as any),
    { message: "Agent ID is required" },
  );
});

test("validate throws when action is missing", () => {
  const validator = new RequestValidator();

  assert.throws(
    () =>
      validator.validate({
        agentId: "agent-1",
      } as any),
    { message: "Action is required" },
  );
});
