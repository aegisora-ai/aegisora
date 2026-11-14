# Aegisora LangGraph Governance Example

Runnable example showing how to wire `Aegisora.protect` into a LangGraph node.

## Run

```bash
pnpm --filter @aegisora/example-langgraph-agent-governance test
```

## Expected result

```text
STATUS=SUCCESS
EXAMPLE_RESULT=PASS
```

## What this example does not show

`Aegisora.protect` wraps the agent's `run` method and normalizes its result. It does not evaluate policy, so this example does not exercise the ALLOW, BLOCK, or ESCALATE enforcement gate.
