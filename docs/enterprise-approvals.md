# Enterprise approvals

## What is guaranteed

- Risky tool calls are stopped by the enforcement gate until a human decides.
- An approval is bound to a hash of the full request. Changing the request invalidates the approval.
- The approval controller (`client.approvals`) can only list, get, approve and reject. It cannot create, consume or expire approvals. Returned records are copies.
- The agent identity cannot approve its own request (separation of duties).
- With an approver verifier configured, the approver identity is taken from a signed, expiring credential, not from a field the caller types.

## Approver credentials

`createHmacApproverVerifier` issues and verifies HMAC-SHA256 signed credentials with an expiry and an optional allow-list of approvers.

- Keep the secret outside the agent process, at least 32 characters.
- Credentials are not single-use. They are valid until they expire, so keep the TTL short (default 15 minutes).
- For SSO/OIDC, implement `ApproverVerifier` (`verify(credential)` returns `{ actorId, expiresAt }`) and map your verified token to an actor id.
- `client.useApproverVerifier()` is for the host application. Never expose it to the agent.

## Previews

The reviewer sees a clipped copy of the request. It is kept in memory only, never written to the approval store, and dropped when the approval is consumed, rejected or expired. Screenshots and logs of an approval screen contain the request content, so treat them accordingly.

## Enterprise approval mode

When enterprise approval is configured, the controller refuses to approve or reject (`[ENFORCEMENT:BLOCK]`). Resolve approvals through `EnterpriseApprovalResolutionSync` instead. This guard is covered by a test against the controller; an end-to-end test with a real enterprise configuration still needs that configuration.

## Scope

Tool approvals only. LLM provider approvals use a separate engine and are not part of this controller.