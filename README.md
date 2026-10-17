<div align="center">

# Aegisora

**Runtime security for AI agents.**

Every agent action gets a decision before it executes: `ALLOW`, `BLOCK` or `ESCALATE`.

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](./LICENSE)
[![CI](https://img.shields.io/github/actions/workflow/status/aegisora-ai/aegisora/ci.yml?branch=main&label=CI)](https://github.com/aegisora-ai/aegisora/actions)
[![Release](https://img.shields.io/github/v/release/aegisora-ai/aegisora?label=release)](https://github.com/aegisora-ai/aegisora/releases)

[Evidence](./docs/evidence/README.md) · [Security policy](./SECURITY.md) · [Architecture](./docs/ARCHITECTURE.md) · [Threat model](./docs/security/THREAT_MODEL.md) · [Changelog](./CHANGELOG.md) · [Live demo](https://www.aegisora.org/) · [Discord](https://discord.gg/8CM3PpQRT5)

</div>

---

Aegisora sits between an AI agent and the systems it can act on. It evaluates a tool call before it runs, applies policy, permissions and risk checks, and records the outcome as audit evidence.

| Decision | Meaning |
|---|---|
| `ALLOW` | The action satisfies policy and may run. |
| `BLOCK` | The action violates policy and must not run. |
| `ESCALATE` | The action needs review before it can run. |

```text
Agent --> tool call --> Aegisora (identity, policy, permission, risk) --> decision --> execution --> audit evidence
```

## What is in this repository

- A runtime enforcement gate that decides before provider and tool execution.
- An enterprise approval registry and runtime approval engine. A requester cannot approve their own request (separation of duties).
- An evidence ledger and audit trail for decisions.
- A security test suite, an agent security benchmark and a runnable LangGraph example.

The hosted dashboard at aegisora.org is developed in a separate repository. The tests listed here do not cover it.

## Verify it yourself

Requirements: Node.js 22 or later and pnpm 11 (see `packageManager` in `package.json`).

```bash
git clone https://github.com/aegisora-ai/aegisora.git
cd aegisora
pnpm install --frozen-lockfile
pnpm build
pnpm test
```

`pnpm test` runs the runtime suite, the core suite (`CORE_TESTS_PASSED=N/N`) and the LangGraph example (`EXAMPLE_RESULT=PASS`). To run only the example:

```bash
pnpm --filter @aegisora/example-langgraph-agent-governance test
```

Each claim, the test behind it and the command to reproduce it are listed in the [evidence index](./docs/evidence/README.md).

## Providers

Adapters in the runtime source: OpenAI, Anthropic, Gemini and Groq.

Verified against the real APIs so far: Gemini and Groq. OpenAI and Anthropic were skipped in the live matrix. See the [pilot evidence report](./docs/evidence/PILOT-EVIDENCE-20261020-235739.md).

## Packages

| Package | Purpose |
|---|---|
| `@aegisora/core` | Core types, enterprise approvals, evidence ledger |
| `@aegisora/runtime` | Runtime governance engine and enforcement gate |

Other packages live in [`core/packages`](./core/packages): audit, observability, plugins, policy-engine, sdk, security-engine and storage.

## Limits

Read this before relying on Aegisora.

- No independent security audit or certification. We make no SOC 2, ISO/IEC 27001, HIPAA or GDPR claim. See [compliance readiness](./docs/security/COMPLIANCE_READINESS.md).
- Results are produced by the maintainers. Nothing here has been independently verified yet.
- The prompt-injection guard is pattern-based. Paraphrased payloads can bypass it, and broad patterns can block harmless text.
- Rate limiting is in-memory and per gate instance. It resets on restart.
- In the live provider matrix, `ESCALATE` is triggered by a caller-supplied review flag, not by automatic detection.
- The vehicle-security scenario suite is partly executed: see [`mobility/README.md`](./mobility/README.md) for what ran and what did not.

## Security

Report vulnerabilities privately by following [SECURITY.md](./SECURITY.md). Do not open public issues for security-sensitive findings.

## Contributing

Read [CONTRIBUTING.md](./CONTRIBUTING.md). Tests are required for security-sensitive changes.

Security researchers: [Challenge #28, break the agent execution boundary](https://github.com/aegisora-ai/aegisora/issues/28). Other work is tracked in [Issues](https://github.com/aegisora-ai/aegisora/issues). Questions go to [Discord](https://discord.gg/8CM3PpQRT5).

## License

[MIT](./LICENSE)