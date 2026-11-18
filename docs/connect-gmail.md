# Aegisora Connect: Gmail (governance layer)

`gmailConnector()` returns the tool set and the task contract for a Gmail-connected agent.
It plugs straight into `protectTools()`.

| Capability | Decision |
| --- | --- |
| `gmail.search_messages` | ALLOW |
| `gmail.read_message` | ALLOW |
| `gmail.send_message` | ESCALATE (human approval required) |
| delete | not offered, so it cannot be executed |

```ts
import { AegisoraClient, gmailConnector, createGmailRestClient } from "@aegisora/sdk";

const client = new AegisoraClient();
client.agent({ name: "support-agent" });

// `gmail` implements GmailClient, for example createGmailRestClient(...).
const gmail = createGmailRestClient({ getAccessToken: async () => myOAuthLayer.getFreshAccessToken() });

const tools = client.protectTools(
  gmailConnector(gmail, {
    agentId: "support-agent",
    contractId: "support-task-001",
    expiresAt: "2030-01-01T00:00:00Z",
    maxExecutions: 100,
    allowedRecipientDomains: ["yourcompany.com"],
  }),
);
```

## Approvals

`gmail.send_message` always escalates. After a human approves the pending request, resume it with the same input:

```ts
await sendTool.execute(sameInput, { approvalId });
```

An approval is single-use and bound to the agent, the action and the exact input. Replaying it, or changing the recipient, subject or body, is blocked and does not consume the approval. The approver must use a different identity string than the agent.
## Limits

- The connector itself contains no Gmail API or OAuth code. `createGmailRestClient()` is an optional REST adapter (see `connect-gmail-rest.md`); OAuth token acquisition is yours.
- It has been tested with a mock client. It has not been tested against live Gmail.
- Unit tests call the tool functions directly. `connect-gmail-e2e.test.cjs` runs them through the runtime and shows that send escalates (ENFORCEMENT:ESCALATE) before the Gmail client is called. `connect-gmail-approval.test.cjs` covers the approved path: after approval the same send runs once, replay and a changed recipient are blocked.
- There is no public SDK accessor for the approval engine yet. The tests reach it through runtime internals (runtime.enforcement.getApprovalEngine()); who may approve, and how that identity is authenticated, is left to the host application.
