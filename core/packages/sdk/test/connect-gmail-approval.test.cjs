const test = require("node:test");
const assert = require("node:assert/strict");
const { AegisoraClient, gmailConnector, GMAIL_TOOL_NAMES } = require("../dist/index.js");

function setup(agentId) {
  let sends = 0;
  const sent = [];
  const gmail = {
    async searchMessages() { return []; },
    async getMessage(id) { return { id }; },
    async sendMessage(r) { sends += 1; sent.push(r); return { id: "sent-" + sends }; },
  };
  const client = new AegisoraClient();
  client.agent({ name: agentId });
  const tools = client.protectTools(gmailConnector(gmail, { agentId, contractId: "task-" + agentId }));
  const send = tools.find((t) => t.name === GMAIL_TOOL_NAMES.send);
  // Test-only: the approval engine is reached through runtime internals. A public approval API is not designed yet.
  const engine = client.runtimeInstance().enforcement.getApprovalEngine();
  return { agentId, send, engine, count: () => sends, sent };
}

const mail = { to: ["a@b.com"], subject: "Hello", body: "Body text" };

async function escalate(env, input = mail) {
  await assert.rejects(() => env.send.execute(input), /ENFORCEMENT:ESCALATE/i);
  const pending = env.engine.list().find((r) => r.status === "pending");
  assert.ok(pending, "an approval must be pending after ESCALATE");
  assert.equal(env.count(), 0);
  return pending;
}

test("approval: approved send runs exactly once and consumes the approval", async () => {
  const env = setup("gmail-appr-once-agent");
  const pending = await escalate(env);
  assert.equal(env.engine.approve({ approvalId: pending.approvalId, actorId: "human-reviewer" }).status, "approved");
  const result = await env.send.execute(mail, { approvalId: pending.approvalId });
  assert.deepEqual(result, { id: "sent-1" });
  assert.equal(env.count(), 1);
  assert.deepEqual(env.sent[0].to, ["a@b.com"]);
  assert.equal(env.engine.get(pending.approvalId).status, "consumed");
});

test("approval: single-use, replay is blocked", async () => {
  const env = setup("gmail-appr-replay-agent");
  const pending = await escalate(env);
  env.engine.approve({ approvalId: pending.approvalId, actorId: "human-reviewer" });
  await env.send.execute(mail, { approvalId: pending.approvalId });
  await assert.rejects(() => env.send.execute(mail, { approvalId: pending.approvalId }), /ENFORCEMENT:BLOCK/i);
  assert.equal(env.count(), 1);
});

test("approval: a changed recipient is blocked and does not consume the approval", async () => {
  const env = setup("gmail-appr-tamper-agent");
  const pending = await escalate(env);
  env.engine.approve({ approvalId: pending.approvalId, actorId: "human-reviewer" });
  await assert.rejects(
    () => env.send.execute({ ...mail, to: ["evil@x.com"] }, { approvalId: pending.approvalId }),
    /ENFORCEMENT:BLOCK/i,
  );
  assert.equal(env.count(), 0);
  assert.equal(env.engine.get(pending.approvalId).status, "approved");
});

test("approval: the requester identity cannot approve its own request", async () => {
  const env = setup("gmail-appr-sod-agent");
  const pending = await escalate(env);
  assert.throws(() => env.engine.approve({ approvalId: pending.approvalId, actorId: env.agentId }), /Separation of duties/i);
  assert.equal(env.engine.get(pending.approvalId).status, "pending");
});

test("approval: unknown or malformed approvalId never reaches Gmail", async () => {
  const env = setup("gmail-appr-bad-id-agent");
  await assert.rejects(() => env.send.execute(mail, { approvalId: "does-not-exist" }), /ENFORCEMENT:BLOCK/i);
  await assert.rejects(() => env.send.execute(mail, { approvalId: 123 }), /approvalId/i);
  await assert.rejects(() => env.send.execute(mail, { approvalId: "" }), /approvalId/i);
  assert.equal(env.count(), 0);
});