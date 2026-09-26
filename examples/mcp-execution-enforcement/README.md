# Aegisora MCP Execution Enforcement Example

Minimal local example showing an MCP tools/call request crossing the Aegisora runtime execution boundary.

This example intentionally uses an MCP-shaped request object instead of requiring an external MCP server or network connection.

That keeps the security behavior deterministic and reproducible while showing the important boundary: an MCP tool request must receive an Aegisora authorization decision before execution.

## Flow

MCP REQUEST
  -> INTERCEPTION
  -> POLICY EVALUATION
  -> DECISION
  -> ENFORCEMENT
  -> EVIDENCE

The example demonstrates:

- ALLOW for the registered echo tool
- BLOCK for the restricted shell tool
- zero tool execution for the blocked request
- decision and evidence records for both outcomes

## Requirements

- Node.js 18 or newer
- pnpm

No external credentials are required.

## Run

From the repository root:

```text
pnpm install
pnpm --filter @aegisora/example-mcp-execution-enforcement build
pnpm --filter @aegisora/example-mcp-execution-enforcement typecheck
pnpm --filter @aegisora/example-mcp-execution-enforcement test
```

## Expected result

```text
MCP_ALLOW=PASS
MCP_BLOCK=PASS
EXECUTION_COUNT=1
ALLOW_DECISION=ALLOW
BLOCK_DECISION=BLOCK
ALLOW_ENFORCEMENT=executed
BLOCK_ENFORCEMENT=prevented
MCP_EXECUTION_ENFORCEMENT=PASS
```

The execution count remains 1 because the blocked MCP request never reaches the RuntimeTool.

## Security boundary

The important property is not the MCP transport itself. The important property is that tool execution is unreachable without a valid Aegisora authorization receipt and the internal execution token.

The example therefore maps directly to the runtime model:

request -> policy -> decision -> enforcement -> evidence

## Scope

This is a local interoperability example, not an official integration with an MCP client or server.

Future contributions can replace the MCP-shaped request with a real MCP transport while preserving the same Aegisora execution boundary.
