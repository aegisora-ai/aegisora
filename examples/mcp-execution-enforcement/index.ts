import assert from "node:assert/strict";
import {
  EnforcementGate,
  PermissionEngine,
  RuntimeContext,
  ToolRegistry,
} from "@aegisora/runtime";
import type { RuntimeTool } from "@aegisora/runtime";

type McpToolCall = {
  jsonrpc: "2.0";
  id: string;
  method: "tools/call";
  params: {
    name: string;
    arguments?: unknown;
  };
};

const AGENT_ID = "mcp-demo-agent";
const EXECUTION_TOKEN = Symbol("mcp-execution-token");

const context = new RuntimeContext();
const permissions = new PermissionEngine();
const enforcement = new EnforcementGate(
  context,
  permissions,
);
const registry = new ToolRegistry(
  EXECUTION_TOKEN,
);

registry.setEnforcementGate(
  enforcement,
);

let executionCount = 0;

const echoTool: RuntimeTool = {
  name: "echo",
  description: "Deterministic local MCP example tool.",
  async execute(input, toolContext) {
    executionCount += 1;

    return {
      ok: true,
      input,
      agentId: toolContext.agentId,
    };
  },
};

registry.register(echoTool);

context.agentRegistry.register({
  id: AGENT_ID,
  name: "MCP Demo Agent",
});

async function executeMcpToolCall(
  request: McpToolCall,
): Promise<unknown> {
  if (request.method !== "tools/call") {
    throw new Error("Unsupported MCP method.");
  }

  const input = request.params.arguments ?? {};

  const receipt = await registry.authorize(
    AGENT_ID,
    request.params.name,
    input,
    {
      protocol: "MCP",
      method: request.method,
      requestId: request.id,
    },
  );

  return registry.execute(
    request.params.name,
    input,
    {
      agentId: AGENT_ID,
      metadata: {
        protocol: "MCP",
        method: request.method,
        requestId: request.id,
      },
    },
    EXECUTION_TOKEN,
    receipt,
  );
}

async function run() {
  const allowRequest: McpToolCall = {
    jsonrpc: "2.0",
    id: "allow-1",
    method: "tools/call",
    params: {
      name: "echo",
      arguments: {
        message: "hello from MCP",
      },
    },
  };

  const allowResult = await executeMcpToolCall(
    allowRequest,
  );

  assert.deepEqual(
    allowResult,
    {
      ok: true,
      input: {
        message: "hello from MCP",
      },
      agentId: AGENT_ID,
    },
  );

  assert.equal(
    executionCount,
    1,
    "ALLOW request must execute exactly once",
  );

  const tracesAfterAllow = context.decisionStore.getAll();
  const allowTrace = tracesAfterAllow[tracesAfterAllow.length - 1];

  assert.equal(
    allowTrace.decision,
    "allow",
  );
  assert.equal(
    allowTrace.enforcementStatus,
    "executed",
  );
  assert.ok(
    allowTrace.evidenceId,
  );

  const blockRequest: McpToolCall = {
    jsonrpc: "2.0",
    id: "block-1",
    method: "tools/call",
    params: {
      name: "shell",
      arguments: {
        command: "echo SHOULD_NOT_EXECUTE",
      },
    },
  };

  await assert.rejects(
    executeMcpToolCall(blockRequest),
    /\\[ENFORCEMENT:BLOCK\\]/i,
  );

  assert.equal(
    executionCount,
    1,
    "BLOCK request must never execute a RuntimeTool",
  );

  const tracesAfterBlock = context.decisionStore.getAll();
  const blockTrace = tracesAfterBlock[tracesAfterBlock.length - 1];

  assert.equal(
    blockTrace.decision,
    "block",
  );
  assert.equal(
    blockTrace.enforcementStatus,
    "prevented",
  );
  assert.ok(
    blockTrace.evidenceId,
  );

  console.log("============================================================");
  console.log("AEGISORA MCP EXECUTION ENFORCEMENT EXAMPLE");
  console.log("============================================================");
  console.log("MCP_ALLOW=PASS");
  console.log("MCP_BLOCK=PASS");
  console.log(`EXECUTION_COUNT=${executionCount}`);
  console.log(`ALLOW_DECISION=${allowTrace.decision.toUpperCase()}`);
  console.log(`BLOCK_DECISION=${blockTrace.decision.toUpperCase()}`);
  console.log(`ALLOW_ENFORCEMENT=${allowTrace.enforcementStatus}`);
  console.log(`BLOCK_ENFORCEMENT=${blockTrace.enforcementStatus}`);
  console.log(`ALLOW_EVIDENCE_ID=${allowTrace.evidenceId}`);
  console.log(`BLOCK_EVIDENCE_ID=${blockTrace.evidenceId}`);
  console.log("MCP_EXECUTION_ENFORCEMENT=PASS");
}

run().catch((error) => {
  console.error("MCP_EXECUTION_ENFORCEMENT=FAIL");
  console.error(error instanceof Error ? error.stack : String(error));
  process.exitCode = 1;
});
