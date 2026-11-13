# Evidence index

Every claim in the README, the test behind it, and how to reproduce it.

Counts come from a local run at the 4.5.0 release commit on Node 26.13. CI runs Node 22. Results are produced by the maintainers and have not been independently verified.

| Claim | Evidence | Reproduce |
|---|---|---|
| Governance decides before provider and tool execution (`ALLOW`, `BLOCK`, `ESCALATE`) | [Runtime tests](../../core/packages/runtime/test), 119 tests | `pnpm --filter @aegisora/runtime test` |
| Enterprise controls: approvals, evidence ledger, tenant boundary | [Core tests](../../core/packages/core/test), 55 test files | `pnpm --filter @aegisora/core test` |
| A requester cannot approve their own request | [Separation-of-duties test](../../core/packages/core/test/4.0-05-separation-of-duties.test.ts) | `pnpm --filter @aegisora/core test` |
| Agent security benchmark scenarios | [Benchmark description](../security/AGENT_SECURITY_BENCHMARK.md) | `pnpm --filter @aegisora/runtime benchmark:security` |
| Gate decides before the model is called (Gemini, Groq) | [Pilot evidence report](PILOT-EVIDENCE-20261020-235739.md) | `powershell -File scripts\enterprise\pilot-evidence-report.ps1` |
| Vehicle-security scenarios: 12 of 110 executed, 98 not tested | [Mobility run](../../mobility/README.md) | See the README in that folder |
| Package integrity for release 2.0.0 | [Release checksums](../../release-evidence) | Compare the `.sha256` files with the packages |

## Related documents

- [Threat model](../security/THREAT_MODEL.md)
- [Security controls](../security/SECURITY_CONTROLS.md)
- [Compliance readiness](../security/COMPLIANCE_READINESS.md): readiness mapping only, no certification claimed
- [Evidence register](../security/EVIDENCE_REGISTER.md): the evidence model
- [Product proof](../security/PRODUCT_PROOF.md)

## What this does not prove

- OpenAI and Anthropic were not tested live.
- The live matrix has 3 scenarios per provider. It shows the gate decides before the model is called, not model-by-model attack resistance.
- Most runtime and core tests use fake providers. Only the live matrix calls real APIs.
- The pilot evidence report was generated at an earlier commit and its generator has not been re-run for 4.5.0.
- The hosted dashboard is not covered by these tests.
- There is no independent verification, audit or certification.