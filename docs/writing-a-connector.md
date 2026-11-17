# Writing a connector

Use `gmailConnector` (see the Gmail connector source and `docs/connect-gmail.md`) as the reference. A connector takes your API client plus an identity and returns tools that `client.protectTools(...)` wraps with enforcement.

Checklist:

1. **One tool per action.** Reads and writes are separate tools, so policy can treat sending differently from searching.
2. **Least privilege.** Request only the scopes the tools need.
3. **Validate every input** before it reaches the API (types, sizes, header injection in addresses and subjects).
4. **Never put credentials in tool results or errors.**
5. **Safe to resume.** After approval the same input runs again with `{ approvalId }`. Do not depend on state that changes between the first call and the resume.
6. **Test the flow:** escalate, approve, resume sends once; reject blocks; changed input is refused. Copy the patterns in `core/packages/sdk/test/connect-approval-controller.test.cjs`.