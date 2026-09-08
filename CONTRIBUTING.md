# Contributing to Aegisora

Thank you for your interest in contributing to Aegisora.

Aegisora is an open-source runtime security and governance layer for autonomous AI agents. We are building the project in public and welcome contributions from developers, security researchers, AI engineers, designers, technical writers, testers, and researchers.

Our goal is to make contribution accessible without compromising security, reliability, or engineering quality.

> **Build openly. Review carefully. Secure by default.**

---

## Before You Start

Please read these documents before making a contribution:

* [`README.md`](./README.md)
* [`Architecture documentation`](./docs/)
* [`Security Policy`](./docs/security/validation.md)
* [`GOVERNANCE.md`](./GOVERNANCE.md)
* [`ROADMAP.md`](./ROADMAP.md)
* [`LICENSE`](./LICENSE)

For security vulnerabilities, **do not open a public issue**. Follow the process in [`Security Policy`](./docs/security/validation.md).

---

## Ways to Contribute

You do not need to be a core maintainer to make a meaningful contribution.

Useful contributions include:

* Bug fixes
* Security improvements
* Policy and detection rules
* Agent and framework integrations
* Tests
* Benchmark scenarios
* Documentation
* Examples
* Developer tooling
* Performance improvements
* UI and developer-experience improvements
* Security research
* Issue triage
* Code review

Small contributions are valuable. A clear bug report, documentation fix, or reproducible test case can be as useful as a large feature.

---

## Development Philosophy

Every contribution should improve one or more of these areas:

* **Security**
* **Reliability**
* **Developer Experience**
* **Performance**
* **Observability**
* **Maintainability**
* **Documentation**

Contributions should solve a real problem and fit the architectural direction of Aegisora.

Prefer:

* Simple and explicit designs
* Small, reviewable changes
* Reproducible behavior
* Strong tests
* Secure defaults
* Clear documentation

Avoid unnecessary abstraction, duplicated logic, hidden behavior, and breaking changes without prior discussion.

---

## Repository Setup

### Requirements

Before starting development, make sure you have:

* Node.js 18 or newer
* pnpm
* Git

The repository currently uses pnpm and Turbo-based project scripts. See `package.json` for the canonical command definitions.

### Clone the Repository

```bash
git clone https://github.com/aegisora-ai/aegisora.git
cd aegisora
```

### Install Dependencies

```bash
pnpm install
```

### Start the Development Server

```bash
pnpm dev
```

Open the local application at:

```text
http://localhost:3000
```

---

## Environment Variables

Some parts of Aegisora require environment variables.

When environment configuration is required:

1. Copy the example environment file when available.
2. Add local credentials only to your local environment.
3. Never commit secrets to Git.
4. Never include API keys, tokens, passwords, or private credentials in issues or pull requests.

Example:

```bash
cp .env.example .env.local
```

Never commit:

```text
.env.local
```

or any other file containing secrets.

---

## Project Verification

Before opening a pull request, run the relevant checks locally.

The repository currently provides scripts for build, lint, test, type checking, and verification.

### Type Checking

```bash
pnpm typecheck
```

### Tests

```bash
pnpm test
```

### Linting

```bash
pnpm lint
```

### Build

```bash
pnpm build
```

### Full Verification

```bash
pnpm verify
```

The goal is to ensure that changes can be reviewed and reproduced by other contributors and maintainers.

---

## Branch Strategy

Do not work directly on `main`.

Create a dedicated branch for every contribution.

Recommended naming patterns:

```text
feature/<short-description>
fix/<short-description>
docs/<short-description>
refactor/<short-description>
security/<short-description>
test/<short-description>
perf/<short-description>
```

Examples:

```text
feature/mcp-policy-support
fix/tool-policy-bypass
docs/runtime-architecture
security/request-validation
test/escalation-workflow
```

Keep branches focused on one logical change.

---

## Commit Convention

Aegisora follows a Conventional Commits-style convention.

Common commit types include:

```text
feat:
fix:
docs:
refactor:
test:
ci:
perf:
security:
chore:
```

Examples:

```text
feat(policy): add resource scope validation
```

```text
fix(runtime): prevent policy bypass on tool requests
```

```text
security(proxy): validate untrusted tool arguments
```

Write commit messages that explain the purpose of the change rather than only describing the edited files.

---

## Opening an Issue

Before opening a new issue:

1. Search existing issues.
2. Check whether the problem has already been reported.
3. Confirm that the problem is reproducible when possible.
4. Provide enough context for another developer to investigate it.

### Bug Reports

Include:

* Environment
* Relevant version or commit
* Reproduction steps
* Expected behavior
* Actual behavior
* Error messages or logs
* Minimal reproduction, when possible
* Screenshots or recordings, when useful

Please remove secrets and sensitive information before posting logs.

### Feature Requests

A strong feature request should explain:

* The problem
* Who is affected
* Why the current behavior is insufficient
* The proposed solution
* Possible alternatives
* Security or compatibility considerations

Focus on the problem first and the implementation second.

---

## Pull Requests

A pull request should:

* Solve one logical problem
* Remain focused and reviewable
* Include tests when behavior changes
* Update documentation when necessary
* Avoid unrelated formatting or refactoring
* Preserve backwards compatibility where possible
* Consider security implications
* Include migration notes for breaking changes

### Pull Request Checklist

Before submitting:

* [ ] The change is focused on one problem.
* [ ] Tests were added or updated where appropriate.
* [ ] Type checking passes.
* [ ] Linting passes.
* [ ] Relevant tests pass.
* [ ] The project builds successfully.
* [ ] Documentation was updated when needed.
* [ ] No secrets or credentials were committed.
* [ ] Security implications were considered.
* [ ] The pull request description explains the change clearly.

---

## Pull Request Description

A good pull request description should explain:

### What changed?

Describe the implementation at a high level.

### Why?

Explain the problem or use case being solved.

### How was it tested?

List the commands, tests, or manual verification performed.

### Security impact

State whether the change affects:

* Authentication
* Authorization
* Agent permissions
* Tool execution
* Policy evaluation
* Data handling
* Secrets
* Runtime enforcement

If there is no security impact, say so explicitly.

---

## Code Review

Every pull request may be reviewed for:

* Correctness
* Security
* Architecture
* Maintainability
* Performance
* Developer Experience
* Testing
* Documentation
* Backwards compatibility

Passing CI does not automatically mean that a pull request will be approved.

Maintainers may request changes before merging.

Review comments should focus on the implementation and help improve the project.

---

## Architecture Principles

New functionality should respect the core architecture principles of Aegisora:

* **Zero Trust by Default**
* **Policy Before Execution**
* **Least Privilege**
* **Human in the Loop**
* **Observable by Design**
* **Secure by Design**
* **Extensible Architecture**
* **Backwards Compatibility**

For significant architectural changes, discuss the design with maintainers before investing in a large implementation.

---

## Security Contributions

Security contributions are highly valuable.

Examples include:

* New detection rules
* Policy improvements
* Attack test cases
* Security benchmarks
* Runtime enforcement improvements
* Dependency security fixes
* Hardening
* Threat-model improvements

### Important

Do **not** publicly disclose exploitable vulnerabilities through GitHub issues or pull requests.

Follow [`Security Policy`](./docs/security/validation.md) for vulnerability reporting.

Security-sensitive changes may receive additional review before merging.

---

## Testing Contributions

Security software requires strong testing.

When adding functionality, consider tests for:

* Expected behavior
* Invalid input
* Edge cases
* Authorization boundaries
* Policy bypass attempts
* Error handling
* Regression scenarios
* Security-sensitive workflows

A useful security test should be reproducible and explain what behavior it protects.

---

## Documentation Contributions

Documentation is part of the project, not an afterthought.

You can improve:

* Guides
* API documentation
* Architecture documentation
* Examples
* Installation instructions
* Troubleshooting
* Security explanations
* Developer onboarding

When changing behavior, update the relevant documentation in the same pull request whenever practical.

---

## Performance Contributions

Performance changes should include evidence whenever possible.

Useful measurements include:

* Latency
* Throughput
* Memory usage
* CPU usage
* Request volume
* Regression comparisons

Avoid claiming a performance improvement without a reproducible measurement.

---

## Large Changes

For large or potentially breaking changes, open a discussion or issue before implementation.

This is especially important for:

* Architectural changes
* New runtime enforcement models
* Major dependency changes
* Public API changes
* Authentication or authorization changes
* Data-model migrations
* Security-sensitive features
* Breaking changes

Early design discussion helps avoid duplicated work and keeps the project coherent as the contributor community grows.

---

## Maintainer Review

Maintainers may:

* Request changes
* Ask for additional tests
* Request documentation updates
* Request security analysis
* Ask for benchmarks
* Reject changes that do not fit the project's technical or security direction

The goal of review is not simply to reject code.

The goal is to keep Aegisora secure, understandable, maintainable, and useful to the wider community.

---

## Community Standards

Aegisora is an open-source project.

Please:

* Be respectful
* Assume good intent
* Give constructive feedback
* Welcome new contributors
* Avoid personal attacks
* Keep technical discussions focused
* Respect security disclosure procedures

Please also read [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

---

## Recognition

Meaningful contributions may be recognized through project contributor records, release notes, documentation, or other community recognition mechanisms.

Aegisora is built by its contributors.

---

## Contribution Workflow

The typical workflow is:

```text
Find or create an issue
        ↓
Understand the problem
        ↓
Discuss large or architectural changes
        ↓
Create a feature branch
        ↓
Implement the change
        ↓
Add / update tests
        ↓
Run verification
        ↓
Open a Pull Request
        ↓
Address review feedback
        ↓
Merge
```

---

## Useful Commands

```bash
# Install dependencies
pnpm install

# Start development
pnpm dev

# Lint
pnpm lint

# Type check
pnpm typecheck

# Run tests
pnpm test

# Build
pnpm build

# Run the full verification pipeline
pnpm verify
```

---

## Final Note

Aegisora is intended to be built in the open.

A small documentation fix, a reproducible bug report, a security test, a new integration, and a major architectural contribution all help move the project forward.

> **Write secure code. Test your assumptions. Document your changes. Leave the project better than you found it.**

Thank you for helping build Aegisora.
