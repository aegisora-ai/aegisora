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

## Limits

- The connector itself contains no Gmail API or OAuth code. `createGmailRestClient()` is an optional REST adapter (see `connect-gmail-rest.md`); OAuth token acquisition is yours.
- It has been tested with a mock client. It has not been tested against live Gmail.
- Unit tests call the tool functions directly. `connect-gmail-e2e.test.cjs` runs them through the runtime and shows that send escalates (ENFORCEMENT:ESCALATE) before the Gmail client is called. The approved-send path is not covered yet.