const test = require("node:test");
const assert = require("node:assert/strict");
const { AegisoraClient, gmailConnector, createGmailRestClient, GMAIL_TOOL_NAMES } = require("../dist/index.js");

function fakeGmail() {
  const calls = { search: 0, get: 0, send: 0 };
  return {
    calls,
    async searchMessages() { calls.search += 1; return [{ id: "m1", subject: "Hi" }]; },
    async getMessage(id) { calls.get += 1; return { id, subject: "Hi", body: "hello" }; },
    async sendMessage() { calls.send += 1; return { id: "sent1" }; },
  };
}

function setup(agentId, gmail, extra = {}) {
  const client = new AegisoraClient();
  client.agent({ name: agentId });
  const tools = client.protectTools(gmailConnector(gmail, { agentId, contractId: "task-" + agentId, ...extra }));
  const byName = (n) => tools.find((t) => t.name === n);
  return { client, runtime: client.runtimeInstance(), byName };
}

test("e2e: search and read run through the runtime and are recorded as evidence", async () => {
  const gmail = fakeGmail();
  const { client, byName } = setup("gmail-e2e-read-agent", gmail);
  const found = await byName(GMAIL_TOOL_NAMES.search).execute({ query: "is:unread" });
  assert.equal(found.length, 1);
  const msg = await byName(GMAIL_TOOL_NAMES.read).execute({ id: "m1" });
  assert.equal(msg.body, "hello");
  assert.equal(gmail.calls.search, 1);
  assert.equal(gmail.calls.get, 1);
  assert.ok(client.runtimeInstance().getEvidence().length > 0);
});

test("e2e: send escalates and the Gmail client is never called", async () => {
  const gmail = fakeGmail();
  const { byName } = setup("gmail-e2e-send-agent", gmail);
  await assert.rejects(
    () => byName(GMAIL_TOOL_NAMES.send).execute({ to: ["a@b.com"], subject: "s", body: "b" }),
    /ENFORCEMENT:ESCALATE/i,
  );
  assert.equal(gmail.calls.send, 0);
});

test("e2e: escalation cannot be bypassed through the runtime entry point, delete does not exist", async () => {
  const gmail = fakeGmail();
  const { runtime } = setup("gmail-e2e-bypass-agent", gmail);
  await assert.rejects(
    () => runtime.executeRegisteredTool("gmail-e2e-bypass-agent", GMAIL_TOOL_NAMES.send, { to: ["a@b.com"], subject: "s", body: "b" }),
    /ENFORCEMENT:ESCALATE/i,
  );
  await assert.rejects(
    () => runtime.executeRegisteredTool("gmail-e2e-bypass-agent", "gmail.delete_message", { id: "m1" }),
  );
  assert.equal(gmail.calls.send, 0);
});

test("e2e: REST adapter + connector + runtime, token sent only on allowed read path", async () => {
  const requests = [];
  const fakeFetch = async (url, init = {}) => {
    requests.push({ url, auth: init.headers && init.headers.Authorization, method: init.method });
    const json = url.includes("/messages?")
      ? { messages: [{ id: "a1" }] }
      : { id: "a1", snippet: "s", payload: { headers: [{ name: "Subject", value: "Hello" }] } };
    return { ok: true, status: 200, json: async () => json };
  };
  const gmail = createGmailRestClient({ getAccessToken: async () => "tok-123", fetch: fakeFetch });
  const { byName } = setup("gmail-e2e-rest-agent", gmail);
  const found = await byName(GMAIL_TOOL_NAMES.search).execute({ query: "x" });
  assert.equal(found[0].subject, "Hello");
  await assert.rejects(
    () => byName(GMAIL_TOOL_NAMES.send).execute({ to: ["a@b.com"], subject: "s", body: "b" }),
    /ENFORCEMENT:ESCALATE/i,
  );
  assert.ok(requests.length > 0 && requests.every((r) => r.method === "GET" && r.auth === "Bearer tok-123"));
});