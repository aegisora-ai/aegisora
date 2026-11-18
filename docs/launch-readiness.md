# Launch readiness (Connect, 4.5.2)

Honest status. "Verified" means exercised by an automated test or a live run.

## Verified

- Gate stops send, approval is single-use, changed requests are refused, reject blocks the resume.
- Approval controller exposes only list, get, approve, reject. Returned records are copies.
- Approver identity from a signed, expiring credential with an allow-list. Separation of duties holds.
- Company scenario: external recipients blocked, tenant isolation of approver credentials, read tools run freely.
- Live: real Gmail send through the approvals console, approve and reject paths, truncated preview with explicit acknowledgement.
- Full `pnpm verify` (build, typecheck, tests of all packages) passes on main.

## Not yet proven

- SSO/OIDC approver verification (interface exists, no reference implementation).
- Persistent approval store and what happens to pending approvals after a restart.
- Enterprise approval mode end to end with a real enterprise configuration.
- Audit export to a SIEM and a compliance report.
- Performance: no latency or throughput benchmark.
- Any paying or piloting customer. This is the main gap for investors.

## Before showing investors

1. Run one real pilot with a design partner and record the numbers (approvals, rejections, time to approve).
2. Add a latency benchmark of the gate.
3. Ship the SSO/OIDC reference verifier.
4. Decide the price model (free open-source runtime, paid team/enterprise tiers).