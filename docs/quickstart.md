# Quickstart: protect an agent's tools in 10 minutes

Aegisora Connect puts a human approval step in front of risky tool calls. The agent asks, the system stops, a reviewer sees what would happen, approves or rejects, and the action runs exactly once.

## 1. Build

    pnpm install
    pnpm build

## 2. Protect your tools

    const { AegisoraClient, gmailConnector, GMAIL_TOOL_NAMES } = require("@aegisora/sdk");

    const client = new AegisoraClient();
    client.agent({ name: "support-agent" });
    const tools = client.protectTools(gmailConnector(gmailApi, { agentId: "support-agent", contractId: "task-1" }));
    const send = tools.find((t) => t.name === GMAIL_TOOL_NAMES.send);

    await send.execute(mail);   // throws [ENFORCEMENT:ESCALATE]: a human has to approve

## 3. Review and approve

    const [pending] = client.approvals.listPending();   // pending.preview shows what would be sent
    client.approvals.approve({ approvalId: pending.approvalId, credential });
    await send.execute(mail, { approvalId: pending.approvalId });   // same input, sent once

Check `preview.truncated`. When it is true the reviewer has not seen the full request, and your UI must say so.

## 4. Prove who approved

    const { createHmacApproverVerifier } = require("@aegisora/sdk");
    const verifier = createHmacApproverVerifier({ secret: process.env.APPROVER_SECRET, allowedActors: ["alice", "bob"] });
    client.useApproverVerifier(verifier);
    const credential = verifier.issue("alice");   // done by your login service, not by the agent

With a verifier set, `approve` and `reject` require a `credential`, and the approver identity comes from it. See `docs/enterprise-approvals.md`.

## 5. Try the approvals screen

    cd examples/approvals-console
    node server.cjs

Open the printed URL, paste a printed credential, press "Simulate agent email", then approve or reject. For real Gmail, see `examples/approvals-console/gmail-oauth.cjs`.