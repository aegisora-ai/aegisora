<div align="center">

  <p>
    <img
      src="docs/assets/aegisora-readme-header.png"
      alt="Aegisora"
      width="760"
    />
  </p>

  <p>
    <strong>Open-source runtime security for AI agents.</strong>
  </p>

  <p>
    Intercept every agent action before execution and decide:
    <strong>ALLOW</strong>, <strong>BLOCK</strong>, or <strong>ESCALATE</strong>.
  </p>

  <p>
    <a href="https://opensource.org/licenses/MIT">
      <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="MIT License">
    </a>
    <a href="https://github.com/aegisora-ai/aegisora/releases">
      <img src="https://img.shields.io/github/v/release/aegisora-ai/aegisora?color=green&label=release" alt="Release">
    </a>
    <a href="https://github.com/aegisora-ai/aegisora/actions">
      <img src="https://img.shields.io/github/actions/workflow/status/aegisora-ai/aegisora/ci.yml?branch=main&label=CI" alt="CI status">
    </a>
    <a href="https://nextjs.org">
      <img src="https://img.shields.io/badge/Next.js-14%2B-black" alt="Next.js">
    </a>
    <a href="https://www.typescriptlang.org/">
      <img src="https://img.shields.io/badge/TypeScript-blue" alt="TypeScript">
    </a>
    <a href="https://tailwindcss.com">
      <img src="https://img.shields.io/badge/TailwindCSS-38B2AC" alt="Tailwind CSS">
    </a>
    <a href="https://discord.gg/8CM3PpQRT5">
      <img src="https://img.shields.io/badge/Discord-Join%20us-5865F2?logo=discord&logoColor=white" alt="Discord">
    </a>
  </p>

  <p>
    <a href="https://www.producthunt.com/posts/aegisora" target="_blank">
      <img
        src="https://img.shields.io/badge/Product%20Hunt-Featured%20on%20PH-FF6154?style=for-the-badge&logo=producthunt&logoColor=white"
        alt="Product Hunt Featured"
      />
    </a>
  </p>

  <p>
    <a href="https://aegisora-ai.vercel.app"><strong>Live Demo</strong></a>
    &nbsp;·&nbsp;
    <a href="https://github.com/aegisora-ai/aegisora/tree/main/docs"><strong>Architecture</strong></a>
    &nbsp;·&nbsp;
    <a href="https://github.com/aegisora-ai/aegisora/blob/main/docs/security/validation.md"><strong>Security</strong></a>
    &nbsp;·&nbsp;
    <a href="https://discord.gg/8CM3PpQRT5"><strong>Discord</strong></a>
  </p>

</div>

> **Aegisora sits between your AI agent and the systems it can act on.**
> Every tool call is evaluated at runtime before execution.

---

## Why Aegisora?

AI agents can do more than generate text. They can call tools, access services, execute workflows, and take actions in external systems.

That makes runtime control a security boundary.

Aegisora provides an open-source runtime layer for evaluating agent actions **before execution**, applying governance policies, assessing risk, enforcing permissions, and producing an explicit decision:

**ALLOW · BLOCK · ESCALATE**

The goal is simple:

> **Let agents act — but never let them act without runtime control.**

---

## How It Works

Aegisora is designed to sit directly between an AI agent and the systems it can reach.

```text
┌──────────────────────┐
│       AI AGENT       │
└──────────┬───────────┘
           │
           │  Tool / Action Request
           ▼
┌───────────────────────────────┐
│           AEGISORA            │
│        Runtime Security       │
│                               │
│  Identity · Permission        │
│  Policy · Context · Risk      │
└──────────────┬────────────────┘
               │
               ▼
        ┌───────────────┐
        │    DECISION   │
        └───────┬───────┘
                │
        ┌───────┼────────┐
        ▼       ▼        ▼
      ALLOW   BLOCK   ESCALATE
        │       │        │
        └───────┼────────┘
                ▼
          EXECUTION
                │
                ▼
        AUDIT / EVIDENCE
```

For the visual architecture overview, see [`Architecture documentation`](./docs/).

<p align="center">
  <img
    src="docs/assets/aegisora-architecture.png"
    alt="Aegisora runtime architecture"
    width="900"
  />
</p>

---

## Core Capabilities

- **Runtime interception** — evaluate agent actions before execution.
- **Policy enforcement** — apply explicit governance rules to agent behavior.
- **Permission control** — restrict what an agent can do and which execution surfaces it can reach.
- **Risk assessment** — evaluate actions in context before they are executed.
- **Decision enforcement** — return `ALLOW`, `BLOCK`, or `ESCALATE`.
- **Zero-trust execution** — treat every agent action as requiring an explicit runtime decision.
- **Audit and evidence** — record security decisions as auditable runtime evidence.
- **Provider-aware governance** — designed to operate across modern AI provider integrations.

---

## Runtime Security Model

Aegisora treats an agent's ability to act as a controlled capability rather than an implicit privilege.

Every request moves through a runtime decision path:

```text
Agent Action
     │
     ▼
┌──────────────┐
│ Interception │
└──────┬───────┘
       ▼
┌──────────────┐
│   Security   │
└──────┬───────┘
       ▼
┌──────────────┐
│    Policy    │
└──────┬───────┘
       ▼
┌──────────────┐
│ Risk Assess. │
└──────┬───────┘
       ▼
┌──────────────┐
│   Decision   │
└──────┬───────┘
       │
   ┌───┼────────┐
   ▼   ▼        ▼
 ALLOW BLOCK  ESCALATE
       │
       ▼
   Execution
       │
       ▼
 Audit / Evidence
```

This creates a clear enforcement boundary between the agent's reasoning and the external systems it can affect.

---

## Decision Model

Aegisora uses three explicit runtime outcomes:

| Decision | Meaning |
|---|---|
| **ALLOW** | The requested action satisfies the applicable security and governance requirements and may proceed. |
| **BLOCK** | The requested action violates a security or governance requirement and must not execute. |
| **ESCALATE** | The requested action requires additional review, control, or handling before execution. |

The important property is that the decision happens **before the action is executed**.

---

## Risk Classification

Aegisora evaluates agent actions in context rather than treating every tool call as equivalent.

The runtime can use factors such as:

- requested capability,
- selected tool or execution surface,
- applicable policy,
- permissions,
- contextual risk,
- and the consequences of allowing the action.

The result feeds the runtime decision:

```text
LOW / ACCEPTABLE RISK
        │
        ▼
      ALLOW

HIGH / DISALLOWED RISK
        │
        ▼
      BLOCK

REQUIRES ADDITIONAL CONTROL
        │
        ▼
    ESCALATE
```

For the detailed implementation and security model, see [`Security documentation`](./docs/security/validation.md).

---

## Governance Policies

Policies define what an agent is allowed to do at runtime.

A policy can be used to express governance requirements around:

- permitted capabilities,
- restricted actions,
- execution boundaries,
- risk thresholds,
- and escalation conditions.

The intent is to keep governance **explicit, reviewable, and enforceable at runtime** instead of relying only on prompts or application-level conventions.

---

## Audit & Evidence

Runtime decisions should be observable and explainable.

Aegisora records security decisions as audit/evidence data so teams can understand:

```text
WHO
  ↓
requested WHAT
  ↓
using WHICH capability
  ↓
under WHICH policy
  ↓
with WHICH risk assessment
  ↓
resulting in WHICH decision
```

This provides a traceable security boundary for agent activity.

---

## Supported Providers

Aegisora is designed to work with modern AI agent stacks and provider integrations.

Current provider integrations include:

- OpenAI
- Anthropic
- Gemini

The runtime model is intended to remain provider-agnostic: the security and governance decision should be enforced at the runtime boundary rather than being tied to a single model provider.

---

## Quick Start

Clone the repository and install the dependencies:

```bash
git clone https://github.com/aegisora-ai/aegisora.git
cd aegisora
pnpm install
```

Start the development environment:

```bash
pnpm dev
```

Then open the local development URL reported by Next.js.

For the live project, see the [Live Demo](https://aegisora-ai.vercel.app).

---

## Project Structure

At a high level, Aegisora is organized around a runtime enforcement path:

```text
Agent
  │
  ▼
Runtime Gateway
  │
  ├── Security
  │
  ├── Policy
  │
  ├── Permission
  │
  ├── Risk Assessment
  │
  └── Decision
        │
        ├── ALLOW
        ├── BLOCK
        └── ESCALATE
              │
              ▼
          Execution
              │
              ▼
        Audit / Evidence
```

See [`Architecture documentation`](./docs/) for the detailed architecture.

---

## Examples

### Allow a permitted action

```text
Agent
  │
  └── Request tool execution
            │
            ▼
        Aegisora
            │
            ├── policy: permitted
            ├── permission: valid
            └── risk: acceptable
                    │
                    ▼
                  ALLOW
                    │
                    ▼
                Execute
```

### Block a disallowed action

```text
Agent
  │
  └── Request tool execution
            │
            ▼
        Aegisora
            │
            ├── policy: denied
            └── risk: unacceptable
                    │
                    ▼
                  BLOCK
```

### Escalate an ambiguous action

```text
Agent
  │
  └── Request tool execution
            │
            ▼
        Aegisora
            │
            ├── policy: requires review
            └── risk: unresolved
                    │
                    ▼
                ESCALATE
```

---

## Security

Security is a first-class part of the project.

For the detailed security model, threat considerations, and security guidance, see [`Security documentation`](./docs/security/validation.md).

Please do not disclose security-sensitive information in public issues. For responsible disclosure, follow the project's security guidance.

---

## Architecture

The core architectural principle is:

> **Agent → Runtime Gateway → Security → Policy → Decision → Execution**

Aegisora is designed to enforce governance before an agent action crosses into the systems it can affect.

See [`Architecture documentation`](./docs/) for the full architecture documentation.

---

## Roadmap

Aegisora is being developed as an open-source runtime security and governance layer for autonomous AI agents.

The project roadmap focuses on strengthening:

- runtime policy enforcement,
- permission and capability controls,
- contextual risk assessment,
- auditability and evidence,
- provider and tool integrations,
- and production-grade governance.

See the repository's [Issues](https://github.com/aegisora-ai/aegisora/issues) and [Releases](https://github.com/aegisora-ai/aegisora/releases) for the current project status.

---

---

## START CONTRIBUTING IN 5 MINUTES

Aegisora is an open-source runtime security and governance layer for autonomous AI agents.

Pick the path that matches your interests.

### Security Researchers

**Break the Agent Execution Boundary**

Find a reproducible path where a consequential agent action can execute without a valid authorization decision at the execution boundary.

[Security Research Challenge #28](https://github.com/aegisora-ai/aegisora/issues/28)

### First Contribution

New to Aegisora?

[#4 - Add PII masking tests](https://github.com/aegisora-ai/aegisora/issues/4)

[#3 - Improve the Live Monitor documentation](https://github.com/aegisora-ai/aegisora/issues/3)

### Agent / LLM Engineers

[#7 - Alternative LLM providers](https://github.com/aegisora-ai/aegisora/issues/7)

[#19 - LiteLLM routing](https://github.com/aegisora-ai/aegisora/issues/19)

### Systems / Infrastructure

[#22 - Go enforcement sidecar + FastAPI control plane](https://github.com/aegisora-ai/aegisora/issues/22)

### The Core Question

> **Can an autonomous agent ever reach a consequential side effect without a valid authorization decision bound to the exact execution context?**

Break it. Reproduce it. Test it. Harden it.

### Community

[Join the Aegisora Discord](https://discord.gg/8CM3PpQRT5)

[Try the Live Demo](https://aegisora-ai.vercel.app)

We value real technical participation: security findings, reproductions, tests, reviews, documentation improvements, and PRs.

---
## Contributing

Contributions are welcome.

Before opening a pull request:

1. Review the existing architecture and security model.
2. Keep runtime enforcement behavior explicit and testable.
3. Add or update tests for security-sensitive changes.
4. Keep documentation aligned with the implementation.
5. Explain the motivation and impact of non-trivial changes.

For project discussion and community collaboration, join the [Aegisora Discord](https://discord.gg/8CM3PpQRT5).

---

## Community

- **GitHub:** https://github.com/aegisora-ai/aegisora
- **Live Demo:** https://aegisora-ai.vercel.app
- **Discord:** https://discord.gg/8CM3PpQRT5
- **Product Hunt:** https://www.producthunt.com/posts/aegisora

---

## License

Aegisora is released under the [MIT License](./LICENSE).

---

<div align="center">

  <strong>Aegisora</strong>

  <br />

  Zero-Trust Security for AI Agents.

  <br /><br />

  <a href="https://github.com/aegisora-ai/aegisora">
    GitHub
  </a>
  ·
  <a href="https://aegisora.org">
    Live Demo
  </a>
  ·
  <a href="https://discord.gg/8CM3PpQRT5">
    Discord
  </a>

</div>
