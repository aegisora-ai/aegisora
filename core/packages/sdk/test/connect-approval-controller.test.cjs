const test = require("node:test");
const assert = require("node:assert/strict");
const { AegisoraClient, gmailConnector, GMAIL_TOOL_NAMES } = require("../dist/index.js");

function setup(agentId) {
  let sends = 0;
  const gmail = {
    async searchMessages() { return []; },
    async getMessage(id) { return { id }; },
    async sendMessage() { sends += 1; return { id: "sent-" + sends }; },
  };
  const client = new AegisoraClient();
  client.agent({ name: agentId });
  const tools = client.protectTools(gmailConnector(gmail, { agentId, contractId: "task-" + agentId }));
  const send = tools.find((t) => t.name === GMAIL_TOOL_NAMES.send);
  return { agentId, approvals: client.approvals, send, count: () => sends };
}

const mail = { to: ["a@b.com"], subject: "Hello", body: "Body text" };

async function escalate(env, input = mail) {
  await assert.rejects(() => env.send.execute(input), /ENFORCEMENT:ESCALATE/i);
  const pending = env.approvals.listPending();
  assert.equal(pending.length, 1);
  return pending[0];
}

test("controller: a pending approval shows what would be sent", async () => {
  const env = setup("appr-ctl-preview-agent");
  const p = await escalate(env);
  assert.equal(p.status, "pending");
  assert.equal(p.preview.tool, GMAIL_TOOL_NAMES.send);
  assert.deepEqual(p.preview.input.to, ["a@b.com"]);
  assert.equal(p.preview.input.subject, "Hello");
  assert.equal(p.preview.truncated, false);
});

test("controller: large content is clipped and flagged as truncated", async () => {
  const env = setup("appr-ctl-clip-agent");
  const p = await escalate(env, { ...mail, body: "x".repeat(5000) });
  assert.equal(p.preview.truncated, true);
  assert.ok(p.preview.input.body.length < 1100);
});

test("controller: approve then resume sends once and drops the preview", async () => {
  const env = setup("appr-ctl-approve-agent");
  const p = await escalate(env);
  assert.equal(env.approvals.approve({ approvalId: p.approvalId, actorId: "human-reviewer" }).status, "approved");
  assert.deepEqual(await env.send.execute(mail, { approvalId: p.approvalId }), { id: "sent-1" });
  assert.equal(env.count(), 1);
  const after = env.approvals.get(p.approvalId);
  assert.equal(after.status, "consumed");
  assert.equal(after.preview, undefined);
});

test("controller: reject blocks the resume and drops the preview", async () => {
  const env = setup("appr-ctl-reject-agent");
  const p = await escalate(env);
  const r = env.approvals.reject({ approvalId: p.approvalId, actorId: "human-reviewer", reason: "not intended" });
  assert.equal(r.status, "rejected");
  await assert.rejects(() => env.send.execute(mail, { approvalId: p.approvalId }), /ENFORCEMENT:BLOCK/i);
  assert.equal(env.count(), 0);
  assert.equal(env.approvals.get(p.approvalId).preview, undefined);
});

test("controller: exposes no create, consume, expire or validate", () => {
  const env = setup("appr-ctl-surface-agent");
  for (const name of ["create", "consume", "expire", "validate", "getRegistry"]) {
    assert.equal(typeof env.approvals[name], "undefined", name);
  }
  assert.ok(Object.isFrozen(env.approvals));
});

test("controller: returned views are copies", async () => {
  const env = setup("appr-ctl-copy-agent");
  const p = await escalate(env);
  p.status = "approved";
  p.preview.input.to.push("evil@x.com");
  const again = env.approvals.get(p.approvalId);
  assert.equal(again.status, "pending");
  assert.deepEqual(again.preview.input.to, ["a@b.com"]);
});

test("controller: the agent identity cannot approve its own request", async () => {
  const env = setup("appr-ctl-sod-agent");
  const p = await escalate(env);
  assert.throws(() => env.approvals.approve({ approvalId: p.approvalId, actorId: env.agentId }), /Separation of duties/i);
  assert.equal(env.approvals.get(p.approvalId).status, "pending");
});

test("controller: invalid input is rejected", () => {
  const env = setup("appr-ctl-input-agent");
  assert.throws(() => env.approvals.approve({ approvalId: "", actorId: "x" }), /approvalId/i);
  assert.throws(() => env.approvals.approve({ approvalId: "x", actorId: " " }), /actorId/i);
  assert.throws(() => env.approvals.approve(null), /object/i);
  assert.throws(() => env.approvals.reject({ approvalId: "x", actorId: "y", reason: 5 }), /reason/i);
  assert.throws(() => env.approvals.approve({ approvalId: "does-not-exist", actorId: "human" }), /not found/i);
});