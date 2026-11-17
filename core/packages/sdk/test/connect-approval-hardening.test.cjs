const test = require("node:test");
const assert = require("node:assert/strict");
const { AegisoraClient, gmailConnector, GMAIL_TOOL_NAMES, createHmacApproverVerifier } = require("../dist/index.js");
const { createApprovalController } = require("../../runtime/dist/index.js");

const SECRET = "test-secret-".padEnd(40, "k");
const mail = { to: ["a@b.com"], subject: "Hello", body: "Body text" };

function setup(agentId, sharedClient) {
  let sends = 0;
  const gmail = {
    async searchMessages() { return []; },
    async getMessage(id) { return { id }; },
    async sendMessage() { sends += 1; return { id: "sent-" + sends }; },
  };
  const client = sharedClient || new AegisoraClient();
  client.agent({ name: agentId });
  const tools = client.protectTools(gmailConnector(gmail, { agentId, contractId: "task-" + agentId }));
  const send = tools.find((t) => t.name === GMAIL_TOOL_NAMES.send);
  return { agentId, client, approvals: client.approvals, send, count: () => sends };
}

async function escalate(env, input = mail) {
  await assert.rejects(() => env.send.execute(input), /ENFORCEMENT:ESCALATE/i);
  const pending = env.approvals.listPending();
  assert.equal(pending.length, 1);
  return pending[0];
}

function stubEngine() {
  const calls = [];
  return {
    calls,
    list: () => [],
    get: () => undefined,
    getPreview: () => undefined,
    approve(i) { calls.push(["approve", i]); return { approvalId: i.approvalId, status: "approved" }; },
    reject(i) { calls.push(["reject", i]); return { approvalId: i.approvalId, status: "rejected" }; },
  };
}

test("verifier: round trip returns the actor and expiry, then expires", () => {
  let t = 1_000_000;
  const v = createHmacApproverVerifier({ secret: SECRET, now: () => t });
  const token = v.issue("alice", 60_000);
  assert.deepEqual(v.verify(token), { actorId: "alice", expiresAt: 1_060_000 });
  t += 60_000;
  assert.throws(() => v.verify(token), /invalid or expired/i);
});

test("verifier: tampered, foreign and malformed credentials are rejected", () => {
  const v = createHmacApproverVerifier({ secret: SECRET });
  const other = createHmacApproverVerifier({ secret: "other-secret-".padEnd(40, "z") });
  const a = v.issue("alice");
  const b = v.issue("bob");
  const forged = a.split(".")[0] + "." + b.split(".")[1];
  assert.throws(() => v.verify(forged), /invalid or expired/i);
  assert.throws(() => v.verify(other.issue("alice")), /invalid or expired/i);
  for (const bad of ["", "abc", "a.b.c", ".", 5, null, undefined, "x".repeat(3000)]) {
    assert.throws(() => v.verify(bad), /invalid or expired/i);
  }
});

test("verifier: allowed actors are enforced on issue and verify", () => {
  const open = createHmacApproverVerifier({ secret: SECRET });
  const strict = createHmacApproverVerifier({ secret: SECRET, allowedActors: ["alice"] });
  assert.throws(() => strict.issue("mallory"), /allowed approver/i);
  assert.throws(() => strict.verify(open.issue("mallory")), /invalid or expired/i);
  assert.equal(strict.verify(strict.issue("alice")).actorId, "alice");
});

test("verifier: weak secrets and bad ttl are rejected", () => {
  assert.throws(() => createHmacApproverVerifier({ secret: "short" }), /secret/i);
  const v = createHmacApproverVerifier({ secret: SECRET });
  assert.throws(() => v.issue("alice", 0), /ttl/i);
  assert.throws(() => v.issue("alice", 1000 * 60 * 60 * 48), /ttl/i);
  assert.throws(() => v.issue(" alice"), /actorId/i);
});

test("controller: the enterprise guard blocks approve and reject before the engine is touched", () => {
  const engine = stubEngine();
  const controller = createApprovalController(engine, { getVerifier: () => undefined }, () => {
    throw new Error("[ENFORCEMENT:BLOCK] Enterprise approval is configured. Resolve approvals through EnterpriseApprovalResolutionSync.");
  });
  assert.throws(() => controller.approve({ approvalId: "a1", actorId: "alice" }), /ENFORCEMENT:BLOCK/);
  assert.throws(() => controller.reject({ approvalId: "a1", actorId: "alice" }), /ENFORCEMENT:BLOCK/);
  assert.equal(engine.calls.length, 0);
  assert.deepEqual(controller.listPending(), []);
});

test("controller: with a verifier the actor comes from the credential", () => {
  const engine = stubEngine();
  const v = createHmacApproverVerifier({ secret: SECRET });
  let current;
  const controller = createApprovalController(engine, { getVerifier: () => current }, () => {});

  controller.approve({ approvalId: "a1", actorId: "plain" });
  assert.deepEqual(engine.calls[0][1], { approvalId: "a1", actorId: "plain" });

  current = v;
  assert.throws(() => controller.approve({ approvalId: "a2", actorId: "alice" }), /credential/i);
  assert.throws(() => controller.approve({ approvalId: "a2", actorId: "alice", credential: v.issue("bob") }), /does not match/i);
  assert.throws(() => controller.approve({ approvalId: "a2", credential: "garbage" }), /invalid or expired/i);
  assert.equal(engine.calls.length, 1);

  controller.approve({ approvalId: "a2", credential: v.issue("bob") });
  assert.deepEqual(engine.calls[1][1], { approvalId: "a2", actorId: "bob" });
  controller.reject({ approvalId: "a3", credential: v.issue("carol"), reason: "no" });
  assert.deepEqual(engine.calls[2][1], { approvalId: "a3", actorId: "carol", reason: "no" });
});

test("end to end: with a verifier the approver identity is proven, not claimed", async () => {
  const env = setup("appr-hard-e2e-agent");
  const v = createHmacApproverVerifier({ secret: SECRET });
  env.client.useApproverVerifier(v);
  const p = await escalate(env);

  assert.throws(() => env.approvals.approve({ approvalId: p.approvalId, actorId: "human-reviewer" }), /credential/i);
  assert.throws(() => env.approvals.approve({ approvalId: p.approvalId, credential: v.issue(env.agentId) }), /Separation of duties/i);
  assert.equal(env.approvals.get(p.approvalId).status, "pending");

  const approved = env.approvals.approve({ approvalId: p.approvalId, credential: v.issue("human-reviewer") });
  assert.equal(approved.status, "approved");
  assert.deepEqual(await env.send.execute(mail, { approvalId: p.approvalId }), { id: "sent-1" });
  assert.equal(env.count(), 1);
});

test("controller: previews never outlive a settled approval (time expiry path)", async (t) => {
  const { mock } = require("node:test");
  if (!mock || !mock.timers || typeof mock.timers.enable !== "function") { t.skip("mock timers unavailable"); return; }
  try { mock.timers.enable({ apis: ["Date"], now: Date.now() }); } catch { t.skip("Date mocking unavailable"); return; }
  try {
    const client = new AegisoraClient();
    const a = setup("appr-hard-expiry-a", client);
    const pa = await escalate(a);
    mock.timers.tick(10 * 60 * 1000);
    await assert.rejects(() => a.send.execute({ ...mail, to: ["c@d.com"] }), /ENFORCEMENT:ESCALATE/i);
    const record = a.approvals.get(pa.approvalId);
    if (record.status !== "pending" && record.status !== "approved") {
      assert.equal(record.preview, undefined);
    }
  } finally {
    mock.timers.reset();
  }
});