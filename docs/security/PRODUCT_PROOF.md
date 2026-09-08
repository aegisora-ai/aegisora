# Aegisora Product Proof

## Purpose

This document records reproducible product-level security evidence for Aegisora.

It distinguishes between:

- locally verified runtime behavior
- public repository documentation
- future independent benchmark or third-party validation

No claim in this document should be interpreted as an external certification or independent assurance unless explicitly stated.

---

## Runtime Security Proof

### Current Local Verification

The current working tree has been validated with the Aegisora runtime test suite.

**Result:**

- Runtime tests: **103 / 103 passed**
- Provider execution boundary: verified
- Governance decisions: **ALLOW / BLOCK / ESCALATE**
- Canonical provider identity: verified
- Canonical model identity: verified
- Correlation identity integrity: verified
- Protected agent boundary: verified
- Audit integrity: verified

This is local reproducible evidence from the current development working tree. It is not, by itself, a claim that every result is already reproduced on the public GitHub main branch.

---

## Key Security Proof Areas

### 1. Governance-Gated Model Resolution

The runtime verifies that model resolution occurs only when governance permits execution.

Expected behavior:

| Decision | Model Resolution | Provider Execution |
|---|---:|---:|
| ALLOW | 1 | Allowed |
| BLOCK | 0 | Prevented |
| ESCALATE | 0 | Prevented |

This establishes the invariant that blocked or escalated requests do not continue into model resolution or provider execution.

---

### 2. Provider Identity Integrity

The runtime preserves the canonical provider identity across the execution path.

Security property:

> Attacker-controlled provider metadata cannot redefine the provider selected by the runtime.

Verified boundaries include:

- request
- runtime
- enforcement
- audit evidence

The canonical provider remains authoritative throughout the execution lifecycle.

---

### 3. Model Identity Integrity

The runtime prevents attacker-controlled metadata from overriding the canonical model.

Verified cases include:

- explicit request model
- default canonical model resolution
- attacker-controlled `metadata.model`
- audit model identity

The runtime preserves the canonical model across provider execution and audit evidence.

---

### 4. Provider / Model Consistency

Canonical provider/model pairs remain internally consistent.

Verified examples include:

- OpenAI canonical provider + canonical model
- Anthropic canonical provider + canonical model

Attacker-controlled provider/model combinations cannot redirect execution.

---

### 5. Cross-Provider Resolution Authority

Model resolution remains bound to the canonical provider authority.

Verified behavior includes:

- explicit OpenAI resolution
- explicit Anthropic resolution
- default model resolution
- attacker metadata cannot redirect provider authority
- BLOCK prevents routing and execution
- ESCALATE prevents routing and execution

---

### 6. Protected Agent Boundary

Registered agents cross the protected runtime boundary under canonical identity.

Forged agent identities are rejected before execution.

Security property:

> Agent identity must be established by the trusted runtime boundary, not by attacker-controlled request metadata.

---

### 7. Governance Boundary Contract

ALLOW decisions carry the canonical runtime correlation contract.

Forged identity attempts fail closed.

Audit evidence preserves the canonical identity and correlation relationship established by the runtime.

Each governance decision maintains an independent identity.

---

### 8. Correlation Identity Integrity

Attacker-controlled correlation identifiers cannot become canonical runtime identifiers.

The runtime generates authoritative correlation identities and preserves them across:

- request
- enforcement
- audit

This provides a consistent basis for tracing security decisions through the execution lifecycle.

---

## Evidence Classification

### Local Reproducible Evidence

The 103/103 runtime test result is development-working-tree evidence.

It demonstrates that the current runtime implementation satisfies the covered test contracts at the time of execution.

### Public Repository Evidence

Public repository documentation describes the intended security architecture, enforcement model, audit behavior, and production-readiness methodology.

Public repository state and local development state must be treated separately when evaluating current implementation coverage.

### Independent Validation

Independent security reviews, third-party benchmarks, formal certifications, or external assurance are not implied by this document.

Such evidence should be added here only after it has actually been completed.

---

## Security Decision Model

Aegisora uses three primary governance decisions:

- **ALLOW** — execution may proceed through the enforcement boundary.
- **BLOCK** — execution is prevented.
- **ESCALATE** — execution requires escalation and does not continue as an ordinary provider call.

The security model is designed around a zero-trust execution boundary in which governance precedes protected execution.

---

## Product Proof Principle

Aegisora treats security claims as evidence-backed engineering claims.

The preferred progression is:

**Implementation → Test → Reproducible Evidence → Public Documentation → Independent Validation**

Marketing language should not exceed the strength of the available evidence.

---

## Verification Status

**Current local runtime verification: GREEN**

**Runtime test result: 103 / 103 passed**

**External certification status: Not claimed**

**Independent third-party validation: Not claimed**

---

## Scope

This document is intentionally limited to product/security proof that is currently supported by available test evidence.

It does not constitute:

- a SOC 2 attestation
- an ISO/IEC 27001 certification
- a HIPAA compliance certification
- a GDPR legal determination
- an independent penetration-test report
- a third-party security audit

Those claims require separate evidence and must not be inferred from the runtime test suite.
