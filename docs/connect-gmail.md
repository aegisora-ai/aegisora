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
import { protectTools, gmailConnector } from "@aegisora/sdk";

// `runtime` is an AgentRuntime with the agent already registered.
// `gmail` implements GmailClient (search, get, send) on top of the Gmail API.
const tools = protectTools(
  runtime,
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

- The connector does not contain a Gmail API or OAuth implementation. You provide a `GmailClient`.
- It has been tested with a mock client. It has not been tested against live Gmail.
- The unit tests call the tool functions directly. Enforcement through the runtime comes from `protectTools`, which has its own tests.