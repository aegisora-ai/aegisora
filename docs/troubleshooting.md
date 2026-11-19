# Troubleshooting

Common problems, what the decisions mean, and how to read the audit evidence.

## `ERR_PACKAGE_PATH_NOT_EXPORTED` on ESM imports

**Symptom.** Importing Aegisora from an ES module fails with:

```text
Error [ERR_PACKAGE_PATH_NOT_EXPORTED]: Package subpath './x' is not defined by "exports" in .../package.json
```

**Cause.** Node.js enforces the `exports` map in `package.json`. A subpath that is not listed there cannot be imported, even if the file exists on disk. This affects projects that import deep paths (for example a package-internal entry point) instead of the package root.

**Fix.** Import from the package root, or from a subpath that the `exports` map actually exposes:

```ts
import { decide } from "@aegisora/runtime";   // root export
```

Deep imports of internal paths are not part of the public API and are not guaranteed to keep working between releases. Pin the version you depend on:

```bash
pnpm add @aegisora/runtime@4.5.3
```

The ESM export map was corrected in **4.5.1**. If you hit this on an older release, upgrade to **4.5.1 or later** — no code change is required beyond moving the import to an exported subpath.

## `ALLOW`, `BLOCK` and `ESCALATE`

Every tool call that passes through Aegisora gets exactly one decision before it executes.

| Decision | Meaning | What happens next |
|---|---|---|
| `ALLOW` | The action satisfies policy, permission and risk checks. | The call runs. |
| `BLOCK` | The action violates policy or is not permitted. | The call never reaches the provider or the tool. |
| `ESCALATE` | The action is allowed in principle but needs a named human to approve it first. | The call pauses until an approver decides. |

### Why an action is blocked

Blocking is **fail-closed**: when the gate cannot prove an action is safe, it refuses. The most common reasons are:

- **No matching policy rule.** The tool or capability is not covered by any rule that grants it, so the default deny applies.
- **Permission missing.** The caller's identity does not have the capability the tool requires. Check the identity mapping before the policy.
- **Unknown or unverified identity.** The caller could not be resolved to a known identity, so no permission can be granted.
- **Risk check failed.** A redaction, recipient-domain or target check rejected the call. For example a recipient outside `allowedRecipientDomains` is rejected before an approval request is created.
- **Separation of duties.** A requester tried to approve their own request; self-approval is never permitted.
- **Provider or model not configured.** The provider adapter is missing credentials or the model is not enabled for the tenant.

### Why an action escalates

Escalation is not a failure. It means the action is permitted but the policy requires a human decision — for example sending email, spending budget, or any action on the approval list. An approval resumes **exactly one** request; it cannot be reused.

## Reading an evidence record

Every decision is written to the evidence ledger. An evidence record is a single JSON object per decision, and the aggregate reports are built from those records. The fields to look at first:

| Field | What it tells you |
|---|---|
| `decision` | `ALLOW`, `BLOCK` or `ESCALATE` — the outcome. |
| `tool` / `capability` | What was asked to run. |
| `caller` / identity | Who asked. Unknown identity is itself a cause of `BLOCK`. |
| `policy` / `ruleId` | Which rule produced the decision. Absent rule means the default deny applied. |
| `reason` | Human-readable explanation, including which check failed. |
| `requestId` / `correlationId` | Correlate the record with the agent run and with an approval. |
| `approval` | Present on `ESCALATE` and on approvals: who approved, when, and for which request. |
| `timestamp` | UTC time of the decision. |

**Workflow when something is blocked and you think it should be allowed:**

1. Read the record and note the `reason` and `ruleId`.
2. Check the caller identity is the one you expect.
3. Check the permission for that identity covers the capability.
4. Only then change the policy — widening a rule or granting a capability.

Changing policy before reading the evidence usually hides the real cause, because a `BLOCK` caused by an unknown identity and a `BLOCK` caused by a missing permission look the same from the outside.

## Still stuck

- [FAQ](./faq.md) — general questions.
- [Adoption guide](./adoption-guide.md) — what is verified and what is not.
- [Evidence index](./evidence/README.md) — the claims behind the README.
- [Security policy](../SECURITY.md) — how to report a vulnerability. Do not open a public issue for security reports.
