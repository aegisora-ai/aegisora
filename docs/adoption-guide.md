# Adopting Aegisora: how a company uses it

Aegisora sits between AI agents and the tools they can act on. Every critical action is decided before it runs: ALLOW, ESCALATE to a human, or BLOCK. Each decision leaves evidence.

## Roles

| Role | What they do |
| --- | --- |
| Developer | Wraps the agent's tools with `client.protectTools(...)` and uses a connector such as `gmailConnector`. |
| Security / platform owner | Decides which tools are read-only, which need approval, which are blocked, and which recipients or domains are allowed. Owns the approver secret or SSO mapping. |
| Approver (business owner) | Reviews the preview in the approvals screen and approves or rejects. Identity comes from a signed, expiring credential. |
| Compliance / audit | Uses the decision and approval evidence to answer who approved what, when, under which policy. |

## Rollout in four stages

1. **Pilot (week 1).** One agent, one connector (Gmail), read tools allowed, send requires approval. Run `examples/approvals-console` internally.
2. **Restrict (week 2).** Set `allowedRecipientDomains`, an approver allow-list, and a short credential TTL.
3. **Integrate (weeks 3-4).** Put the approvals screen behind your login. Implement `ApproverVerifier` against your SSO. Write a connector for your second tool using `docs/writing-a-connector.md`.
4. **Expand.** More agents and tools. Review approval volume, rejections and truncated previews to tune policy.

## How a single action flows

Agent calls tool -> gate decides -> if ESCALATE, the call stops and a pending approval appears with a preview -> approver approves or rejects -> the same request is resumed with the approval id -> it runs once, or never.

## Deployment shape

The runtime runs inside the customer's own process or service, so request content stays in their environment. The approvals screen is a thin client over `client.approvals`. Approver secrets stay outside the agent process.

## Current limits (be explicit with customers)

- Approver identity: HMAC credentials are built in. SSO/OIDC needs a customer-specific `ApproverVerifier`.
- Previews are in memory. A restart clears pending previews.
- Tool approvals only. LLM provider approvals use a separate engine.
- One shipped connector (Gmail). Others follow the connector guide.