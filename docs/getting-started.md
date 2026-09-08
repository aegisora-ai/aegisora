# Aegisora Developer Getting Started

Clean-clone onboarding path for developers and engineering teams.

## Prerequisites

- Git
- Node.js 22+
- pnpm 11.20.0

## Clone

```bash
git clone https://github.com/aegisora-ai/aegisora.git
cd aegisora
```

## Install

```bash
pnpm install
```

The default installation requires no provider API key.

## Build

```bash
pnpm build
```

## Typecheck

```bash
pnpm typecheck
```

## Test

```bash
pnpm test
```

The default suite is designed to run without external provider credentials.

## LangGraph example

```bash
pnpm --filter "@aegisora/example-langgraph-agent-governance" start
```

Expected result:

```text
STATUS=SUCCESS
EXAMPLE_RESULT=PASS
```

## Security boundary example

```bash
pnpm --filter "@aegisora/runtime" exec tsx test/trace-79-provider-gateway-boundary.ts
```

This demonstrates ALLOW, BLOCK, and ESCALATE at the provider boundary.

## Live provider validation

Live Groq validation is intentionally separate from the default suite.

```bash
pnpm test:live
```

This requires GROQ_API_KEY.

Never commit API keys or local environment files.

## Full path

```bash
pnpm install
pnpm build
pnpm typecheck
pnpm test
pnpm --filter "@aegisora/example-langgraph-agent-governance" start
```
