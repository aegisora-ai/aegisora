const test = require("node:test");
const assert = require("node:assert/strict");
const { gmailConnector, GMAIL_TOOL_NAMES } = require("../dist/index.js");

function fakeClient() {
  const calls = { search: [], get: [], send: [] };
  return {
    calls,
    async searchMessages(q) { calls.search.push(q); return [{ id: "m1", subject: "Hi", snippet: "x" }]; },
    async getMessage(id) { calls.get.push(id); return { id, subject: "Hi", body: "b".repeat(30000) }; },
    async sendMessage(r) { calls.send.push(r); return { id: "sent1" }; },
  };
}
const base = { agentId: "agent-1", contractId: "contract-1" };
const byName = (opts, name) => opts.tools.find((t) => t.name === name);

test("contract: read tools allowed, send requires approval, no delete", () => {
  const o = gmailConnector(fakeClient(), base);
  assert.deepEqual([...o.contract.allowedTools].sort(), Object.values(GMAIL_TOOL_NAMES).sort());
  assert.deepEqual([...o.contract.approvalRequiredTools], [GMAIL_TOOL_NAMES.send]);
  assert.ok(!o.tools.some((t) => /delete/i.test(t.name)));
});

test("allowSend=false removes send tool and approval list", () => {
  const o = gmailConnector(fakeClient(), { ...base, allowSend: false });
  assert.ok(!byName(o, GMAIL_TOOL_NAMES.send));
  assert.equal(o.contract.approvalRequiredTools, undefined);
});

test("search defaults, bounds and passes query", async () => {
  const c = fakeClient();
  const o = gmailConnector(c, base);
  const tool = byName(o, GMAIL_TOOL_NAMES.search);
  await tool.execute({ query: "from:a@b.com" });
  assert.equal(c.calls.search[0].maxResults, 10);
  await assert.rejects(() => tool.execute({ maxResults: 100 }));
  await assert.rejects(() => tool.execute({ maxResults: 1.5 }));
});

test("read validates id and truncates body", async () => {
  const o = gmailConnector(fakeClient(), base);
  const tool = byName(o, GMAIL_TOOL_NAMES.read);
  await assert.rejects(() => tool.execute({ id: "../etc" }));
  const m = await tool.execute({ id: "abc123" });
  assert.equal(m.body.length, 20000);
});

test("send validates recipients, header injection and limits", async () => {
  const c = fakeClient();
  const tool = byName(gmailConnector(c, base), GMAIL_TOOL_NAMES.send);
  await assert.rejects(() => tool.execute({ to: ["not-an-email"], subject: "s", body: "b" }));
  await assert.rejects(() => tool.execute({ to: ["a@b.com"], subject: "s\nBcc: x@y.com", body: "b" }));
  await assert.rejects(() => tool.execute({ to: Array(21).fill("a@b.com"), subject: "s", body: "b" }));
  await assert.rejects(() => tool.execute({ to: [], subject: "s", body: "b" }));
  assert.equal(c.calls.send.length, 0);
});

test("send normalizes and dedupes recipients, returns only id", async () => {
  const c = fakeClient();
  const tool = byName(gmailConnector(c, base), GMAIL_TOOL_NAMES.send);
  const r = await tool.execute({ to: ["A@B.com", "a@b.com"], subject: "s", body: "b" });
  assert.deepEqual(r, { id: "sent1" });
  assert.deepEqual(c.calls.send[0].to, ["a@b.com"]);
});

test("allowedRecipientDomains blocks external recipients", async () => {
  const c = fakeClient();
  const tool = byName(gmailConnector(c, { ...base, allowedRecipientDomains: ["corp.com"] }), GMAIL_TOOL_NAMES.send);
  await assert.rejects(() => tool.execute({ to: ["x@evil.com"], subject: "s", body: "b" }));
  await tool.execute({ to: ["x@corp.com"], subject: "s", body: "b" });
  assert.equal(c.calls.send.length, 1);
});

test("expiry and maxExecutions are carried into the contract", () => {
  const o = gmailConnector(fakeClient(), { ...base, expiresAt: "2030-01-01T00:00:00Z", maxExecutions: 5 });
  assert.equal(o.contract.expiresAt, "2030-01-01T00:00:00Z");
  assert.equal(o.contract.maxExecutions, 5);
});