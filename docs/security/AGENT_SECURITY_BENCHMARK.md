# Aegisora Agent Security Benchmark v0.1

## Scope

This benchmark measures selected adversarial security controls in the Aegisora OSS runtime.

The benchmark is based on existing runtime security tests and excludes Enterprise 3.0 test suites.

## Benchmark Result

Scenarios executed: 8
Scenarios passed: 8
Scenarios failed: 0
Unexpected protected execution: 0 where explicitly measured

This result represents local working-tree verification of the selected benchmark scenarios.

## Scenario Matrix

| ID | Security Area | Evidence Test | Result |
|---|---|---|---|
| B01 | Adversarial security matrix | trace-36-adversarial-security-matrix.ts | PASS |
| B02 | Provider adversarial controls | trace-60-provider-adversarial-matrix.ts | PASS |
| B03 | Direct tool bypass | trace-73k-r11-direct-tool-bypass.ts | PASS |
| B04 | Direct provider bypass / forged identity | trace-73k-r12-direct-provider-bypass.ts | PASS |
| B05 | Governance-gated model resolution | trace-85-governance-gated-model-resolution.ts | PASS |
| B06 | Protected agent boundary | trace-93-protected-agent-boundary.ts | PASS |
| B07 | Governance boundary / fail-closed identity | trace-95-governance-boundary-contract.ts | PASS |
| B08 | Correlation identity spoofing | trace-96-correlation-identity-integrity.ts | PASS |

## B01 - Adversarial Security Matrix

Result: PASS

Evidence:
packages/runtime/test/trace-36-adversarial-security-matrix.ts

## B02 - Provider Adversarial Security

Verified:

- 1 safe request allowed
- 5 malicious requests blocked
- 1 human-review request escalated
- only the ALLOW path crossed the provider boundary
- all decision traces remained observable

Result: PASS

Observed provider calls: 1

Security invariant:
Only ALLOW crossed the provider boundary.

Evidence:
packages/runtime/test/trace-60-provider-adversarial-matrix.ts

## B03 - Direct Tool Bypass

Verified:

- canonical ToolRegistry resolution
- direct RuntimeTool execution rejected
- forged provider execution blocked
- no direct tool execution result escaped the security boundary

Result: PASS

Evidence:
packages/runtime/test/trace-73k-r11-direct-tool-bypass.ts

## B04 - Direct Provider Bypass

Verified:

- forged provider identity blocked
- enforcement remained in the tested execution path
- direct provider bypass surface measured

The test also identified provider-related internal runtime handles:

- providerExecutionToken
- providerGateway

These handles are recorded as a hardening surface requiring continued verification.

Result: PASS for the tested forged-identity control.

Hardening status: FOLLOW-UP REQUIRED

Evidence:
packages/runtime/test/trace-73k-r12-direct-provider-bypass.ts

## B05 - Governance-Gated Model Resolution

Verified:

- ALLOW -> one model resolution and provider execution
- BLOCK -> zero additional model resolution
- ESCALATE -> zero additional model resolution

Result: PASS

Security invariant:
Governance denial must not continue into model resolution or provider execution.

Evidence:
packages/runtime/test/trace-85-governance-gated-model-resolution.ts

## B06 - Protected Agent Boundary

Verified:

- registered agent crossed the protected execution boundary
- forged agent identity was blocked before execution
- blocked agent execution count remained zero

Result: PASS

Evidence:
packages/runtime/test/trace-93-protected-agent-boundary.ts

## B07 - Governance Boundary Contract

Verified:

- ALLOW carried the canonical correlation contract
- unknown or forged identity failed closed
- blocked execution was marked prevented
- blocked execution was not attempted
- audit records preserved canonical correlation identifiers
- each governance decision maintained an independent identity

Result: PASS

Evidence:
packages/runtime/test/trace-95-governance-boundary-contract.ts

## B08 - Correlation Identity Spoofing

Verified:

- attacker-controlled correlation identifiers did not become canonical
- runtime-generated identifiers remained authoritative
- audit retained canonical identifiers
- request -> enforcement -> audit correlation remained consistent

Result: PASS

Evidence:
packages/runtime/test/trace-96-correlation-identity-integrity.ts

## Security Invariants

### Provider Boundary

Requests classified as BLOCK or ESCALATE do not cross the measured provider boundary.

### Identity Authority

Forged agent and provider identities are rejected by the tested enforcement paths.

### Model Authority

Attacker-controlled model metadata cannot replace the canonical model in the tested execution path.

### Correlation Authority

Attacker-controlled correlation identifiers cannot replace runtime-generated canonical identifiers.

### Audit Continuity

The tested governance flows preserve canonical correlation identity into audit evidence.

## Limitations

This benchmark is not a formal security certification.

It does not establish:

- SOC 2 compliance
- ISO/IEC 27001 certification
- HIPAA certification
- GDPR legal compliance
- complete penetration-test coverage
- complete elimination of all possible runtime bypasses

A PASS means that the specific tested scenario produced the expected result.

It does not mean that every possible variation of the attack has been exhausted.

## Reproducibility

Benchmark scenarios are implemented as executable runtime tests.

The corresponding test files are located under:

core/packages/runtime/test/

The benchmark should be rerun against a clean, identified commit when used for public release evidence.

## Benchmark Status

AEGISORA AGENT SECURITY BENCHMARK v0.1

8 / 8 selected scenarios passed

Unexpected protected execution: 0 where explicitly measured

Direct-provider bypass hardening surface: identified for follow-up

Certification claims: none

