# Aegisora Support

Welcome to Aegisora.

This document explains how to get help, report problems, request features, and find the right place for different types of questions.

Aegisora is an open-source project, and good support starts with providing enough context for other contributors to reproduce and understand a problem.

---

## Before Asking for Help

Before opening a support request:

1. Read the [`README.md`](./README.md).
2. Check [`Architecture`](./docs/) for system design questions.
3. Check [`CONTRIBUTING.md`](./CONTRIBUTING.md) for development and contribution questions.
4. Check [`Security Policy`](./docs/security/validation.md) for security-related issues.
5. Search existing GitHub Issues and Discussions.

You may find that your question has already been answered.

---

## Where to Ask

Use the following channels for the appropriate type of request.

| Request Type             | Recommended Channel                    |
| ------------------------ | -------------------------------------- |
| How-to question          | GitHub Discussions                     |
| General project question | GitHub Discussions                     |
| Bug report               | GitHub Issues                          |
| Feature request          | GitHub Discussions or GitHub Issues    |
| Documentation problem    | GitHub Issues                          |
| Development question     | GitHub Discussions                     |
| Security vulnerability   | [`Security Policy`](./docs/security/validation.md)         |
| Contribution question    | [`CONTRIBUTING.md`](./CONTRIBUTING.md) |
| Governance question      | [`GOVERNANCE.md`](./GOVERNANCE.md)     |

---

## GitHub Issues

GitHub Issues are intended for actionable project work.

Use an Issue when you have:

* A reproducible bug
* A documentation error
* A concrete implementation task
* A verified regression
* A clearly defined improvement

Before creating an issue:

* Search for existing issues.
* Confirm the problem is reproducible when possible.
* Use the appropriate issue template.
* Include enough context for another developer to investigate.

Do not use public Issues to report security vulnerabilities.

See [`Security Policy`](./docs/security/validation.md) for the security disclosure process.

---

## GitHub Discussions

Use GitHub Discussions for topics that benefit from broader community conversation.

Good examples include:

* Questions about how Aegisora works
* Design discussions
* Early feature ideas
* Architecture proposals
* Integration ideas
* Best practices
* Community feedback
* Developer onboarding questions

Discussions are particularly useful when the solution has not yet been fully defined.

---

## Bug Reports

A useful bug report should include:

* A clear title
* Affected component
* Environment
* Relevant version or commit
* Reproduction steps
* Expected behavior
* Actual behavior
* Error messages or logs
* Minimal reproduction when possible

Example:

```text id="5r6f3u"
Environment:
- OS:
- Node.js:
- pnpm:
- Browser:
- Commit / version:

Steps to reproduce:
1.
2.
3.

Expected:
...

Actual:
...

Relevant logs:
...
```

Remove passwords, API keys, tokens, credentials, and personal information before posting logs.

---

## Feature Requests

Before requesting a feature, explain the problem it solves.

A strong feature request should include:

* Problem statement
* Intended users
* Why current functionality is insufficient
* Proposed behavior
* Alternative approaches
* Security implications
* Compatibility considerations

Large architectural features may benefit from an RFC or prior discussion.

See [`GOVERNANCE.md`](./GOVERNANCE.md) for project decision-making and RFC guidance.

---

## Security Issues

Do **not** report security vulnerabilities through:

* GitHub Issues
* GitHub Discussions
* Pull Requests
* Public chat messages

Use the private reporting process described in [`Security Policy`](./docs/security/validation.md).

Examples of security-sensitive reports include:

* Authentication bypass
* Authorization bypass
* Policy enforcement bypass
* Tool execution bypass
* Data leakage
* Secret exposure
* Prompt-injection security weaknesses
* Remote code execution
* Sandbox escape
* Privilege escalation

When in doubt, treat the issue as security-sensitive and follow the security reporting process.

---

## Documentation Problems

Documentation contributions are welcome.

Report documentation issues when:

* Instructions are incorrect
* Links are broken
* Examples do not work
* Installation steps are outdated
* Architecture descriptions are inaccurate
* Security documentation is unclear

Documentation pull requests are also welcome.

See [`CONTRIBUTING.md`](./CONTRIBUTING.md).

---

## Troubleshooting

When something does not work, first try:

### 1. Verify the Environment

Check your versions:

```bash id="7pm6sn"
node --version
pnpm --version
```

### 2. Reinstall Dependencies

```bash id="pf4scn"
pnpm install
```

### 3. Run Type Checking

```bash id="zt83q9"
pnpm typecheck
```

### 4. Run Tests

```bash id="56w0r5"
pnpm test
```

### 5. Run the Build

```bash id="h2tm6u"
pnpm build
```

### 6. Check the Documentation

Review:

* [`README.md`](./README.md)
* [`Architecture`](./docs/)
* [`CONTRIBUTING.md`](./CONTRIBUTING.md)
* [`Security Policy`](./docs/security/validation.md)

If the issue persists, open a GitHub Issue with the relevant diagnostic information.

---

## Support Requests for Contributors

When asking a development question, include:

* What you are trying to build
* Which part of the repository you are working on
* What you expected
* What actually happened
* What you have already tried
* Relevant error messages
* Relevant code snippets when necessary

This helps other developers avoid repeating the same investigation.

---

## Community Support

Aegisora is an open-source project.

Community members can help by:

* Answering questions
* Improving documentation
* Reproducing bugs
* Reviewing pull requests
* Sharing examples
* Creating integrations
* Contributing tests

Please keep discussions respectful and follow [`CODE_OF_CONDUCT.md`](./CODE_OF_CONDUCT.md).

---

## Maintainer Support

Maintainers may help with:

* Project architecture
* Security-sensitive design
* Release issues
* Contribution workflow
* Complex regressions
* Project-wide technical questions

Maintainers are not a replacement for reading the documentation or searching existing discussions.

Please provide a clear description of the problem before requesting maintainer assistance.

---

## Response Expectations

Aegisora is an open-source project supported by contributors and maintainers.

Response times may vary depending on:

* Severity
* Security impact
* Complexity
* Maintainer availability
* Community participation

A lack of immediate response does not mean that a report has been ignored.

For critical security issues, follow [`Security Policy`](./docs/security/validation.md) rather than relying on public support channels.

---

## Important Links

* [Aegisora Repository](https://github.com/aegisora-ai/aegisora)
* [GitHub Issues](https://github.com/aegisora-ai/aegisora/issues)
* [GitHub Discussions](https://github.com/aegisora-ai/aegisora/discussions)
* [Contributing Guide](./CONTRIBUTING.md)
* [Security Policy](./docs/security/validation.md)
* [Architecture](./docs/)
* [Governance](./GOVERNANCE.md)
* [Roadmap](./ROADMAP.md)
* [Code of Conduct](./CODE_OF_CONDUCT.md)

---

## Improving Support

Support documentation should evolve with the project.

If you notice a recurring question that is not answered here, consider contributing a documentation improvement so future developers can find the answer more easily.

> **The best support system is one that helps the next developer solve the problem without needing to ask.**
---

## Contributor Growth Paths

Aegisora is open source and welcomes focused technical contributions.

### First Contribution

Good starting work includes documentation fixes, reproducible examples, tests, scoped bug fixes, and developer experience improvements.

### Security Research

Useful areas include runtime enforcement, policy bypass, identity and authorization integrity, tool execution, approval integrity, delegation, and evidence integrity.

Sensitive vulnerabilities should follow the project's security disclosure process rather than public issue discussion.

### Agent Integrations

Useful contribution areas include agent frameworks, MCP, model providers, tool execution, and observability integrations.

### Testing and Benchmarks

Contributors can add adversarial cases, regression coverage, policy fixtures, latency benchmarks, and reproducible security benchmarks.

### Developer Experience

Setup automation, local demos, CLI improvements, examples, test helpers, and CI improvements are useful contribution areas.

Prefer small, reviewable, reproducible changes.
