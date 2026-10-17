# Quick Start

## 1. Install

    git clone https://github.com/aegisora-ai/aegisora.git
    cd aegisora
    pnpm install

## 2. Run the runtime test suite

    pnpm --filter "@aegisora/runtime" test

The runtime evaluates each consequential action and returns an ALLOW, BLOCK or ESCALATE decision, with audit evidence.

## 3. Run the LangGraph governance example

    pnpm --filter "@aegisora/example-langgraph-agent-governance" start

See `examples/langgraph-agent-governance/README.md` for details.

## 4. Optional: live provider trace

    pnpm test:live

This runs `core/packages/runtime/test/trace-94-live-groq-governance.ts`. Check the file for the environment variables it needs.

## Next steps

- Full verification: `pnpm verify`
- Security policy: `SECURITY.md`
- Support: `SUPPORT.md`