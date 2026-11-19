# Troubleshooting

The problems new users hit most often, and where to look when an action is not doing what you expect.

## `ERR_PACKAGE_PATH_NOT_EXPORTED` when importing from ESM

Symptom: `import { AegisoraClient } from "@aegisora/sdk"` fails with `ERR_PACKAGE_PATH_NOT_EXPORTED` ("Package subpath '.' is not defined by exports").

Cause: before 4.5.1 the `exports` map of several `@aegisora/*` packages offered only a `require` condition, so an ESM `import` found nothing to resolve to.

Fix: upgrade to 4.5.1 or later (the current release is 4.5.3). Keep all `@aegisora/*` packages on the same version.

```bash
pnpm add @aegisora/sdk@latest
```

## What `ALLOW`, `BLOCK` and `ESCALATE` mean

Every agent action gets one of three decisions before it runs. The tool handler is only entered on `ALLOW`.

| Decision | Meaning | What you see |
| --- | --- | --- |
| `ALLOW` | The action passed policy, security and permission checks. It runs. | The tool's normal result. |
| `BLOCK` | The action is refused. The handler is not called. | An error starting with `[ENFORCEMENT:BLOCK]`, followed by the reason. |
| `ESCALATE` | The action needs a human decision first. The handler is not called yet. | An error starting with `[ENFORCEMENT:ESCALATE]`, followed by the reason. |

For tools wrapped with `protectTools()`, `BLOCK` and `ESCALATE` surface as a rejected promise from `execute()`. Catch it and read the message.

### Why an action is blocked

Aegisora fails closed: if something required for a safe decision is missing or invalid, the answer is `BLOCK`, not `ALLOW`. Common reasons, in the words of the error message:

| Message contains | What it means | What to do |
| --- | --- | --- |
| `Unknown or unregistered agent identity` | The agent id was never registered in this runtime. | Call `client.agent({ name })` with the same id before using it. |
| `Unknown or unregistered tool` | The tool name is not registered. | Register the tool through `protectTools()`; names are exact and wildcards are not supported. |
| `Tool is not permitted by task contract` (thrown by `protectTools()`) | The tool is not in the contract's `allowedTools`. | Add it to `allowedTools`, or do not wrap it. |
| `Task contract expired` | The contract's `expiresAt` is in the past. | Create a new contract with a later `expiresAt`. |
| `Task contract execution limit reached` | `maxExecutions` attempts across the protected tool set were used up. Attempts count, not only successful calls. | Create a new contract or raise `maxExecutions`. |
| `Rate limit exceeded` | The agent made more than the allowed calls in the window (default 100 calls per 60 s). | Slow down, or tune `AEGISORA_RATE_LIMIT_MAX` and `AEGISORA_RATE_LIMIT_WINDOW_MS`. `AEGISORA_RATE_LIMIT_MAX=0` disables the limiter. The limiter is in memory and per gate instance, so it resets on restart. |
| `contains a recipient outside the allowed domains` (Gmail connector) | A recipient is outside `allowedRecipientDomains`. It is rejected immediately and never creates an approval request. | Fix the recipient or extend `allowedRecipientDomains`. |
| `Tool input and metadata must be structured-cloneable` | The input holds something that cannot be copied, such as a function. | Pass plain data. |
| `Execution input does not match the authorized input snapshot` | The input changed between authorization and execution. | Do not mutate the input after calling `execute()`. |
| `Tool authorization has already been consumed` | The same authorization was used twice. | Authorizations are single use. Make a new call. |

A prompt that looks like an injection attempt (for example a role or mode switch) can also be blocked by the security guard. The guard is pattern-based: paraphrased payloads can get past it, and broad patterns can block harmless text. See the Limits section of the [README](../README.md).

If a block message is not in this table, the message itself is the reason. Look it up in the evidence record (below) with the decision's trace id.

### Why an action escalates

- The tool is listed in `approvalRequiredTools` in the task contract (for example `gmail.send_message` in the Gmail connector always escalates).
- The permission check answered "review" (`Execution requires permission review`).

After a human approves the pending request, resume it with the same input. An approval is single use and bound to the agent, the action and the exact input. See [Aegisora Connect: Gmail](./connect-gmail.md#approvals).

```ts
const [pending] = client.approvals.listPending();
client.approvals.approve({ approvalId: pending.approvalId, actorId: "reviewer-id" });
await tool.execute(sameInput, { approvalId: pending.approvalId });
```

The approver must use a different identity than the agent that asked. A requester cannot approve its own request.

## How to read an evidence record

Every decision is recorded as an evidence record. From a runtime you can read them with `getEvidence()`, `getEvidenceByAgent(agentId)`, `getEvidenceByTrace(traceId)` or `getEvidenceByDecision(decisionId)`. With the SDK client, call them on `client.runtimeInstance()`.

```ts
const runtime = client.runtimeInstance();
for (const record of runtime.getEvidenceByAgent("support-agent")) {
  console.log(record.finalDecision, record.enforcementStatus, record.reason);
}
```

The main fields of an `EvidenceRecord` (defined in `@aegisora/core`, `core/packages/core/src/types/evidence.ts`):

| Field | How to read it |
| --- | --- |
| `finalDecision` | The decision: `ALLOW`, `BLOCK` or `ESCALATE`. |
| `reason` | A human-readable explanation. Start here when something was blocked. |
| `enforcementStatus` | What actually happened: `executed`, `prevented` (blocked), `escalated` (waiting for a human) or `not_executed`. |
| `executionOutcome` | Present when known: `succeeded` or `failed` if the handler ran, `not_attempted` if enforcement stopped it. An `ALLOW` can still end in `failed` if your handler threw. |
| `riskScore` and `threats` | The risk score for the action and the signals behind it (each threat has a type, severity, description and score). |
| `agentId`, `resourceType`, `tool`, `action` | Who did what: the agent, whether the target was an agent, tool or provider, the tool name and the requested action. |
| `traceId`, `decisionId`, `executionId`, `evidenceId` | Identifiers. The trace id ties together everything in one flow; the decision id is unique per decision. Use them to find related records. |
| `type`, `status` | The record category (`decision`, `enforcement` or `audit`) and its state (`recorded` or `verified`). |
| `timestamp`, `metadata` | When it was created, plus extra context such as an approval id. |

A typical blocked call has `finalDecision: "BLOCK"`, `enforcementStatus: "prevented"` and `executionOutcome: "not_attempted"`: the decision was made and the handler never ran.

Evidence kept by the in-memory store is lost when the process stops. Workspaces that use the enterprise evidence ledger keep an `EnterpriseEvidenceRecord` with similar fields plus `workspaceId`, `approvalId` and `policyVersion`. For what the evidence does and does not prove, see the [evidence index](./evidence/README.md).

## Installation and build

See [installation](./installation.md): for example `pnpm: command not found` (install pnpm) and build errors after upgrading Node.js (delete `node_modules` and run `pnpm install` again).

## Still stuck?

Ask in GitHub Discussions or Discord (see [SUPPORT.md](../SUPPORT.md)). Do not report security vulnerabilities in public issues; follow [SECURITY.md](../SECURITY.md).
