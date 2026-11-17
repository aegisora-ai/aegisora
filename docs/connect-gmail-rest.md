# Gmail REST adapter

`createGmailRestClient()` implements `GmailClient` on top of the Gmail REST API with plain `fetch`. It adds no dependency.

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

## OAuth scopes

Request only `https://www.googleapis.com/auth/gmail.readonly` and `https://www.googleapis.com/auth/gmail.send`. Do not request delete or full-access scopes.

## Limits

- OAuth consent, token storage and refresh are not part of this adapter. You provide `getAccessToken`.
- Tested with a fake `fetch` only. Not tested against live Gmail.
- Plain-text bodies only. HTML-only messages return no body. Attachments are not supported.