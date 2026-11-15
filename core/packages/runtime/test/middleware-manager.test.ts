import assert from "node:assert/strict";
import test from "node:test";

import { MiddlewareManager } from "../src/middleware/middleware-manager";
import type {
  RuntimeMiddleware,
  RuntimeMiddlewareContext,
} from "../src/types/middleware";

function createContext(
  overrides: Partial<RuntimeMiddlewareContext> = {},
): RuntimeMiddlewareContext {
  return {
    request: {
      agentId: "agent-1",
      action: "tool:read",
    } as RuntimeMiddlewareContext["request"],
    requestId: "req-1",
    metadata: {},
    blocked: false,
    riskScore: 0,
    signals: [],
    ...overrides,
  };
}

test("MiddlewareManager: execute runs registered middleware in registration order and passes each result to the next one", async () => {
  const manager = new MiddlewareManager();
  const executionOrder: string[] = [];

  const first: RuntimeMiddleware = {
    name: "risk-scorer",
    async execute(context) {
      executionOrder.push("risk-scorer");
      assert.equal(context.riskScore, 0);
      assert.deepEqual(context.signals, []);

      return {
        ...context,
        riskScore: 25,
        signals: [...context.signals, "scored"],
        metadata: {
          ...context.metadata,
          step1: true,
        },
      };
    },
  };

  const second: RuntimeMiddleware = {
    name: "policy-enricher",
    async execute(context) {
      executionOrder.push("policy-enricher");
      assert.equal(context.riskScore, 25);
      assert.deepEqual(context.signals, ["scored"]);
      assert.equal(context.metadata.step1, true);

      return {
        ...context,
        riskScore: context.riskScore + 50,
        blocked: true,
        signals: [...context.signals, "blocked-by-policy"],
        metadata: {
          ...context.metadata,
          step2: true,
        },
      };
    },
  };

  manager.register(first);
  manager.register(second);

  const initialContext = createContext();
  const result = await manager.execute(initialContext);

  assert.deepEqual(executionOrder, ["risk-scorer", "policy-enricher"]);
  assert.equal(result.riskScore, 75);
  assert.equal(result.blocked, true);
  assert.deepEqual(result.signals, ["scored", "blocked-by-policy"]);
  assert.deepEqual(result.metadata, { step1: true, step2: true });
});

test("MiddlewareManager: execute with no middleware returns the input context unchanged", async () => {
  const manager = new MiddlewareManager();
  const initialContext = createContext({
    requestId: "req-empty",
    riskScore: 10,
    signals: ["initial"],
    metadata: { source: "unit-test" },
  });

  const result = await manager.execute(initialContext);

  assert.strictEqual(result, initialContext);
  assert.deepEqual(result, initialContext);
});

test("MiddlewareManager: list returns the middleware names in registration order", () => {
  const manager = new MiddlewareManager();

  assert.deepEqual(manager.list(), []);

  manager.register({
    name: "auth-check",
    async execute(context) {
      return context;
    },
  });

  manager.register({
    name: "rate-limit",
    async execute(context) {
      return context;
    },
  });

  manager.register({
    name: "audit-logger",
    async execute(context) {
      return context;
    },
  });

  assert.deepEqual(manager.list(), ["auth-check", "rate-limit", "audit-logger"]);
});