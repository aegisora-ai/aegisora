import assert from "node:assert/strict";
import test from "node:test";

import {
  EnforcementGate,
} from "../src/enforcement";

import {
  PermissionEngine,
} from "../src/permissions";

import {
  RuntimeContext,
} from "../src/context/runtime-context";

import {
  ToolRegistry,
} from "../src/tools/tool-registry";

import {
  ToolRegistryExternalBridge,
} from "../src/tools/external";

import type {
  ExternalToolAdapter,
  ExternalToolDescriptor,
  ExternalToolRequest,
} from "../src/tools/external";

const executionToken =
  Symbol("14D-external-token");

function descriptor(
  overrides:
    Partial<ExternalToolDescriptor> = {},
): ExternalToolDescriptor {
  return {
    id:
      "external.echo",
    name:
      "External Echo",
    transport:
      "mcp",
    workspaceId:
      "workspace-a",
    ...overrides,
  };
}

function request(
  overrides:
    Partial<ExternalToolRequest> = {},
): ExternalToolRequest {
  return {
    workspaceId:
      "workspace-a",
    agentId:
      "agent-a",
    toolId:
      "external.echo",
    action:
      "tool.execute",
    transport:
      "mcp",
    traceId:
      "trace-14d",
    decisionId:
      "decision-14d",
    executionId:
      "execution-14d",
    evidenceId:
      "evidence-14d",
    riskScore:
      10,
    input: {
      message:
        "hello",
    },
    ...overrides,
  };
}

function adapter(
  overrides:
    Partial<ExternalToolAdapter> = {},
): ExternalToolAdapter & {
  calls: number;
} {
  let calls = 0;

  return {
    transport:
      "mcp",

    get calls() {
      return calls;
    },

    async execute(
      tool,
      req,
    ) {
      calls += 1;

      return {
        toolId:
          tool.id,

        workspaceId:
          req.workspaceId,

        agentId:
          req.agentId,

        transport:
          req.transport,

        traceId:
          req.traceId,

        decisionId:
          req.decisionId,

        executionId:
          req.executionId,

        evidenceId:
          req.evidenceId,

        output: {
          echoed:
            req.input,
        },
      };
    },

    ...overrides,
  };
}

function setup() {
  const context =
    new RuntimeContext();

  context.agentRegistry.register({
    id:
      "agent-a",
    name:
      "14D External Agent",
    status:
      "idle",
    createdAt:
      new Date(),
  });

  if (!context.agentRegistry.getById("agent-a")) {
    throw "14D agent registration failed.";
  }

  const registry =
    new ToolRegistry(
      executionToken,
    );

  const permissionEngine =
    new PermissionEngine(
      registry,
      context.agentRegistry,
    );

  const gate =
    new EnforcementGate(
      context,
      permissionEngine,
    );

  registry.setEnforcementGate(
    gate,
  );

  const bridge =
    new ToolRegistryExternalBridge(
      registry,
      executionToken,
    );

  return {
    context,
    gate,
    registry,
    bridge,
  };
}

test(
  "14D - MCP external tool ALLOW reaches ToolRegistry and adapter",
  async () => {
    const {
      bridge,
    } = setup();

    const external =
      adapter();


    bridge.register(descriptor(), external);
const result =
      await bridge.execute(
        descriptor(),
        request(),
        external,
      );

    assert.deepEqual(
      result,
      {
        echoed: {
          message:
            "hello",
        },
      },
    );

    assert.equal(
      external.calls,
      1,
    );
  },
);

test(
  "14D - unknown external tool is blocked before adapter",
  async () => {
    const {
      bridge,
    } = setup();

    const external =
      adapter();

    await assert.rejects(
      bridge.execute(
        descriptor({
          id:
            "external.unknown",
        }),
        request({
          toolId:
            "external.unknown",
        }),
        external,
      ),
      /unknown tool|BLOCK/i,
    );

    assert.equal(
      external.calls,
      0,
    );
  },
);

test(
  "14D - cross-workspace external request is blocked",
  async () => {
    const {
      bridge,
    } = setup();

    const external =
      adapter();

    await assert.rejects(
      bridge.execute(
        descriptor(),
        request({
          workspaceId:
            "workspace-b",
        }),
        external,
      ),
      /workspace/i,
    );

    assert.equal(
      external.calls,
      0,
    );
  },
);

test(
  "14D - transport spoof is blocked",
  async () => {
    const {
      bridge,
    } = setup();

    const external =
      adapter();

    await assert.rejects(
      bridge.execute(
        descriptor(),
        request({
          transport:
            "http",
        }),
        external,
      ),
      /transport mismatch/i,
    );

    assert.equal(
      external.calls,
      0,
    );
  },
);

test(
  "14D - review requirement prevents external adapter execution",
  async () => {
    const {
      bridge,
    } = setup();

    const external =
      adapter();


    bridge.register(descriptor(), external);
await assert.rejects(
      bridge.execute(
        descriptor(),
        request({
          metadata: {
            requiresReview:
              true,
          },
        }),
        external,
      ),
      /ESCALATE/i,
    );

    assert.equal(
      external.calls,
      0,
    );
  },
);

test(
  "14D - direct ToolRegistry bypass remains blocked",
  async () => {
    const {
      registry,
    } = setup();

    const external =
      adapter();

    const runtimeTool =
      bridgeRegister(
        registry,
        external,
      );

    assert.equal(
      runtimeTool.name,
      "external.echo",
    );

    await assert.rejects(
      registry.execute(
        "external.echo",
        {
          direct:
            "bypass",
        },
        {
          agentId:
            "agent-a",
        },
      ),
      /not authorized/i,
    );

    assert.equal(
      external.calls,
      0,
    );
  },
);

function bridgeRegister(
  registry: ToolRegistry,
  external: ExternalToolAdapter,
) {
  const runtimeTool =
    new ToolRegistryExternalBridge(
      registry,
      executionToken,
    ).register(
      descriptor(),
      external,
    );

  return runtimeTool;
}

test(
  "14D - forged adapter output cannot rewrite canonical identity",
  async () => {
    const {
      bridge,
    } = setup();

    const external =
      adapter({
        async execute(
          tool,
          req,
        ) {
          return {
            toolId:
              "attacker.tool",

            workspaceId:
              req.workspaceId,

            agentId:
              req.agentId,

            transport:
              req.transport,

            traceId:
              req.traceId,

            decisionId:
              req.decisionId,

            executionId:
              req.executionId,

            evidenceId:
              req.evidenceId,

            output:
              "attacker",
          };
        },
      });

    bridge.register(descriptor(), external);

    await assert.rejects(
      bridge.execute(
        descriptor(),
        request(),
        external,
      ),
      /mismatched tool identity/i,
    );
  },
);

test(
  "14D - forged correlation ID is rejected",
  async () => {
    const {
      bridge,
    } = setup();

    const external =
      adapter({
        async execute(
          tool,
          req,
        ) {
          return {
            toolId:
              tool.id,

            workspaceId:
              req.workspaceId,

            agentId:
              req.agentId,

            transport:
              req.transport,

            traceId:
              "forged-trace",

            decisionId:
              req.decisionId,

            executionId:
              req.executionId,

            evidenceId:
              req.evidenceId,

            output:
              "attacker",
          };
        },
      });

    bridge.register(descriptor(), external);

    await assert.rejects(
      bridge.execute(
        descriptor(),
        request(),
        external,
      ),
      /mismatched execution correlation/i,
    );
  },
);
