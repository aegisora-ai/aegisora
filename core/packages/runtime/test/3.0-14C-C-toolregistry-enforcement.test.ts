import assert from "node:assert/strict";
import test from "node:test";

import {
  RuntimeContext,
} from "../src/context/runtime-context";

import {
  EnforcementGate,
} from "../src/enforcement";

import {
  PermissionEngine,
} from "../src/permissions";

import {
  ToolRegistry,
} from "../src/tools/tool-registry";

import type {
  RuntimeTool,
} from "../src/tools/tool";

const EXECUTION_TOKEN = Symbol("14C-C-execution-token");

function createRegistry() {
  const context =
    new RuntimeContext();

  const gate =
    new EnforcementGate(
      context,
      new PermissionEngine(),
    );

  const registry =
    new ToolRegistry(
      EXECUTION_TOKEN,
    );

  registry.setEnforcementGate(
    gate,
  );

  return {
    context,
    gate,
    registry,
  };
}

function createSpyTool(
  name = "echo",
) {
  let calls = 0;

  const tool: RuntimeTool = {
    name,

    description:
      "14C-C enforcement regression tool",

    async execute(
      input,
      context,
    ) {
      calls += 1;

      return {
        output:
          String(input),
        agentId:
          context.agentId,
      };
    },
  };

  return {
    tool,
    get calls() {
      return calls;
    },
  };
}

test(
  "14C-C - ToolRegistry ALLOW executes real RuntimeTool",
  async () => {
    const {
      context,
      registry,
    } = createRegistry();

    const spy =
      createSpyTool();

    registry.register(
      spy.tool,
    );

    context.agentRegistry.register({
      id:
        "agent-14c-allow",
      name:
        "agent-14c-allow",
    });

    const receipt =
      await registry.authorize(
        "agent-14c-allow",
        "echo",
        "allow-request",
      );

    const result =
      await registry.execute(
        "echo",
        "allow-request",
        {
          agentId:
            "agent-14c-allow",
        },
        EXECUTION_TOKEN,
        receipt,
      );

    assert.deepEqual(
      result,
      {
        output:
          "allow-request",
        agentId:
          "agent-14c-allow",
      },
    );

    assert.equal(
      spy.calls,
      1,
      "ALLOW must reach RuntimeTool exactly once",
    );
  },
);

test(
  "14C-C - direct ToolRegistry execution without token is blocked",
  async () => {
    const {
      context,
      registry,
    } = createRegistry();

    const spy =
      createSpyTool();

    registry.register(
      spy.tool,
    );

    context.agentRegistry.register({
      id:
        "agent-14c-direct",
      name:
        "agent-14c-direct",
    });

    await assert.rejects(
      registry.execute(
        "echo",
        "direct-bypass",
        {
          agentId:
            "agent-14c-direct",
        },
      ),
      /Direct ToolRegistry execution is not authorized/i,
    );

    assert.equal(
      spy.calls,
      0,
      "Direct registry bypass must never execute tool",
    );
  },
);

test(
  "14C-C - invalid authorization receipt is blocked",
  async () => {
    const {
      context,
      registry,
    } = createRegistry();

    const spy =
      createSpyTool();

    registry.register(
      spy.tool,
    );

    context.agentRegistry.register({
      id:
        "agent-14c-receipt",
      name:
        "agent-14c-receipt",
    });

    const fakeReceipt = {
      authorizationId:
        "attacker",
      agentId:
        "agent-14c-receipt",
      tool:
        "echo",
      action:
        "tool.execute",
      enforcement: {
        decision:
          "ALLOW",
      },
      marker:
        Symbol("forged-marker"),
    } as any;

    await assert.rejects(
      registry.execute(
        "echo",
        "forged-receipt",
        {
          agentId:
            "agent-14c-receipt",
        },
        EXECUTION_TOKEN,
        fakeReceipt,
      ),
      /Invalid tool authorization receipt/i,
    );

    assert.equal(
      spy.calls,
      0,
    );
  },
);

test(
  "14C-C - mismatched agent authorization is blocked",
  async () => {
    const {
      context,
      registry,
    } = createRegistry();

    const spy =
      createSpyTool();

    registry.register(
      spy.tool,
    );

    context.agentRegistry.register({
      id:
        "agent-14c-agent-a",
      name:
        "agent-14c-agent-a",
    });

    context.agentRegistry.register({
      id:
        "agent-14c-agent-b",
      name:
        "agent-14c-agent-b",
    });

    const receipt =
      await registry.authorize(
        "agent-14c-agent-a",
        "echo",
        "authorized",
      );

    await assert.rejects(
      registry.execute(
        "echo",
        "tampered-agent",
        {
          agentId:
            "agent-14c-agent-b",
        },
        EXECUTION_TOKEN,
        receipt,
      ),
      /scope mismatch/i,
    );

    assert.equal(
      spy.calls,
      0,
    );
  },
);

test(
  "14C-C - authorization receipt is single-use",
  async () => {
    const {
      context,
      registry,
    } = createRegistry();

    const spy =
      createSpyTool();

    registry.register(
      spy.tool,
    );

    context.agentRegistry.register({
      id:
        "agent-14c-replay",
      name:
        "agent-14c-replay",
    });

    const receipt =
      await registry.authorize(
        "agent-14c-replay",
        "echo",
        "single-use",
      );

    const first =
      await registry.execute(
        "echo",
        "single-use",
        {
          agentId:
            "agent-14c-replay",
        },
        EXECUTION_TOKEN,
        receipt,
      );

    assert.deepEqual(
      first,
      {
        output:
          "single-use",
        agentId:
          "agent-14c-replay",
      },
    );

    assert.equal(
      spy.calls,
      1,
    );

    await assert.rejects(
      registry.execute(
        "echo",
        "replay",
        {
          agentId:
            "agent-14c-replay",
        },
        EXECUTION_TOKEN,
        receipt,
      ),
      /already been consumed/i,
    );

    assert.equal(
      spy.calls,
      1,
      "Replay must not execute tool",
    );
  },
);

test(
  "14C-C - missing enforcement gate blocks authorization",
  async () => {
    const context =
      new RuntimeContext();

    const registry =
      new ToolRegistry(
        EXECUTION_TOKEN,
      );

    const spy =
      createSpyTool();

    registry.register(
      spy.tool,
    );

    context.agentRegistry.register({
      id:
        "agent-14c-no-gate",
      name:
        "agent-14c-no-gate",
    });

    await assert.rejects(
      registry.authorize(
        "agent-14c-no-gate",
        "echo",
        "no-gate",
      ),
      /execution boundary is not configured/i,
    );

    assert.equal(
      spy.calls,
      0,
    );
  },
);

test(
  "14C-C - canonical tool identity must remain exact",
  async () => {
    const {
      context,
      registry,
    } = createRegistry();

    const spy =
      createSpyTool(
        "echo",
      );

    registry.register(
      spy.tool,
    );

    context.agentRegistry.register({
      id:
        "agent-14c-identity",
      name:
        "agent-14c-identity",
    });

    const receipt =
      await registry.authorize(
        "agent-14c-identity",
        "echo",
        "identity",
      );

    await assert.rejects(
      registry.execute(
        "different-tool",
        "identity-tamper",
        {
          agentId:
            "agent-14c-identity",
        },
        EXECUTION_TOKEN,
        receipt,
      ),
      /scope mismatch/i,
    );

    assert.equal(
      spy.calls,
      0,
    );
  },
);
