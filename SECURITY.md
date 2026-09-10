# Security Policy

Security is a core design principle of Aegisora.

Aegisora is designed to provide a runtime governance layer between autonomous AI agents and the systems they can affect. Security issues should therefore be treated seriously, investigated responsibly, and disclosed in a way that protects users and contributors.

---

## Supported Versions

Aegisora currently prioritizes security fixes for:

| Version                 | Supported |
| ----------------------- | --------- |
| Latest stable release   | ✅         |
| Main development branch | ✅         |
| Older releases          | ❌         |

Security support for older releases may vary depending on the severity and impact of the issue.

---

## Reporting a Vulnerability

Please **do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**

Security vulnerabilities should be reported privately so they can be investigated before public disclosure.

### Security Contact

**[security@aegisora.org](mailto:security@aegisora.org)**

Please use this address for confidential vulnerability reports.

> This security contact is currently the project's designated reporting channel while the security response process continues to mature.

### What to Include

A useful security report should include, where possible:

* A clear description of the vulnerability
* Reproduction steps
* Affected component, endpoint, or feature
* Expected behavior
* Actual behavior
* Security impact
* Proof of concept or minimal reproduction
* Suggested mitigation, if known

Please do not include unnecessary personal data, credentials, API keys, or other sensitive information in a report.

---

## Security Response Process

Security reports are handled through the following general process:

1. **Acknowledgement** — confirm that the report has been received.
2. **Initial Assessment** — reproduce and validate the reported behavior.
3. **Risk Classification** — determine severity, exploitability, and affected scope.
4. **Remediation** — develop and test an appropriate fix or mitigation.
5. **Security Review** — verify the remediation and assess related attack paths.
6. **Coordinated Disclosure** — determine an appropriate disclosure plan with the reporter when applicable.
7. **Public Advisory** — publish relevant details after remediation and disclosure coordination when appropriate.

Response timing may vary depending on severity, complexity, and the information available in the report.

---

## Security Principles

Aegisora follows these security principles:

* **Zero Trust by Default**
* **Least Privilege**
* **Defense in Depth**
* **Policy Before Execution**
* **Human-in-the-Loop**
* **Secure by Design**
* **Privacy by Default**
* **Observable by Design**

The objective is to prevent autonomous agent actions from becoming unrestricted system actions.

---

## Security Scope

Security reports may include, but are not limited to:

* Prompt injection
* Indirect prompt injection
* Tool abuse
* Unauthorized function calls
* Policy bypass
* Privilege escalation
* Authentication bypass
* Authorization issues
* PII leakage
* Secret exposure
* Data exfiltration
* Remote code execution
* Sandbox escape
* Supply-chain vulnerabilities
* Dependency vulnerabilities
* Unsafe agent-to-agent interactions
* Runtime enforcement bypasses

---

## AI-Specific Threat Model

Aegisora is designed with modern AI-specific threats in mind, including:

* Prompt injection
* Indirect prompt injection
* Prompt leakage
* Context manipulation
* Tool hijacking
* Memory poisoning
* Agent identity abuse
* Agent-to-agent abuse
* Multi-agent escalation
* Data exfiltration
* Autonomous misuse
* Excessive agent permissions
* Unsafe tool execution

The threat model will evolve as new attack techniques and agent architectures emerge.

---

## Security Goals

Aegisora aims to strengthen:

* Runtime protection
* Policy enforcement
* Agent governance
* Human oversight
* Auditability
* Execution integrity
* Security observability
* Privacy protection

These goals describe the project's security direction and should not be interpreted as a guarantee that every threat is prevented.

---

## Security Research

We welcome responsible security research and collaboration with:

* Security researchers
* AI security researchers
* AI safety researchers
* Red teams
* Academic institutions
* Enterprise security teams
* Open-source security contributors

Please coordinate potentially sensitive findings privately before publishing details that could enable exploitation.

---

## Responsible Disclosure

We support responsible disclosure.

Please provide a reasonable opportunity for a vulnerability to be investigated and, where practical, remediated before publicly disclosing technical exploitation details.

The appropriate disclosure timeline may depend on:

* Severity
* Exploitability
* Whether exploitation is already occurring
* Availability of a mitigation
* Complexity of remediation
* Potential impact on users

---

## Security Roadmap

Future security work may include:

* Formal threat modeling
* Expanded security benchmarks
* Independent security audits
* Bug bounty programs
* Cryptographic integrity verification
* Additional runtime enforcement controls
* Enterprise security and compliance documentation

Roadmap items are not guarantees of future implementation or certification.

---

## Security Documentation

Additional security and architecture information is available in:

* [`Architecture documentation`](./docs/)
* [`CONTRIBUTING.md`](./CONTRIBUTING.md)
* [`GOVERNANCE.md`](./GOVERNANCE.md)
* [`ROADMAP.md`](./ROADMAP.md)

---

## Contact

For confidential security reports and security-related questions:

**[security@aegisora.org](mailto:security@aegisora.org)**

Please do not include passwords, API keys, private credentials, or unrelated sensitive information in your initial report.

Thank you for helping improve the security of Aegisora.

---

## Security Readiness Artifacts

- [Threat Model](./docs/security/THREAT_MODEL.md)
- [Security Controls](./docs/security/SECURITY_CONTROLS.md)
- [Incident Response](./docs/security/INCIDENT_RESPONSE.md)
- [Vulnerability Management](./docs/security/VULNERABILITY_MANAGEMENT.md)
- [Compliance Readiness](./docs/security/COMPLIANCE_READINESS.md)
- [Evidence Register](./docs/security/EVIDENCE_REGISTER.md)

These artifacts describe the project's security baseline and readiness work.
They do not constitute independent certification, attestation, or a guarantee that every threat is prevented.

- [Security Risk Register](./docs/security/SECURITY_RISK_REGISTER.md)
- [Access Review Procedure](./docs/security/ACCESS_REVIEW.md)

Security readiness is continuously validated by
[Security Readiness CI](./.github/workflows/security-readiness.yml).

Official website: https://aegisora.org
