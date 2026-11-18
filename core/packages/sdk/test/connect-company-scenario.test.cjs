const test = require("node:test");
const assert = require("node:assert/strict");
const { AegisoraClient, gmailConnector, GMAIL_TOOL_NAMES, createHmacApproverVerifier } = require("../dist/index.js");

function company(name, approvers) {
  let sends = 0;
  const gmail = {
    async searchMessages() { return []; },
    async getMessage(id) { return { id }; },
    async sendMessage() { sends += 1; return { id: name + "-sent-" + sends }; },
  };
  const secret = (name + "-secret-").padEnd(40, "s");
  const verifier = createHmacApproverVerifier({ secret, allowedActors: approvers });
  const client = new AegisoraClient();
  const agentId = name + "-support-agent";
  client.agent({ name: agentId });
  client.useApproverVerifier(verifier);
  const tools = client.protectTools(gmailConnector(gmail, {
    agentId,
    contractId: "task-" + name,
    allowedRecipientDomains: [name + ".com"],
  }));
  return {
    client, verifier, approvals: client.approvals, count: () => sends,
    send: tools.find((t) => t.name === GMAIL_TOOL_NAMES.send),
    search: tools.find((t) => t.name === "gmail.search_messages"),
  };
}

const mailTo = (domain) => ({ to: ["customer@" + domain], subject: "Refund", body: "Your refund was processed." });

test("company: external recipient is blocked and never reaches Gmail", async () => {
  const c = company("acmeone", ["alice"]);
  await assert.rejects(() => c.send.execute(mailTo("outside.org")));
  assert.equal(c.count(), 0);
  assert.equal(c.approvals.listPending().length, 0);
});

test("company: internal send escalates, only listed approvers can sign, approval is single-use", async () => {
  const c = company("acmetwo", ["alice"]);
  const input = mailTo("acmetwo.com");
  await assert.rejects(() => c.send.execute(input), /ENFORCEMENT:ESCALATE/i);
  const [p] = c.approvals.listPending();
  assert.ok(p && p.preview && p.preview.tool === GMAIL_TOOL_NAMES.send);

  assert.throws(() => c.verifier.issue("mallory"), /allowed approver/i);
  assert.throws(() => c.approvals.approve({ approvalId: p.approvalId, actorId: "alice" }), /credential/i);

  assert.equal(c.approvals.approve({ approvalId: p.approvalId, credential: c.verifier.issue("alice") }).status, "approved");
  assert.deepEqual(await c.send.execute(input, { approvalId: p.approvalId }), { id: "acmetwo-sent-1" });
  assert.equal(c.count(), 1);
  await assert.rejects(() => c.send.execute(input, { approvalId: p.approvalId }));
  assert.equal(c.count(), 1);
});

test("company: a changed request cannot ride on an existing approval", async () => {
  const c = company("acmethree", ["alice"]);
  const input = mailTo("acmethree.com");
  await assert.rejects(() => c.send.execute(input), /ENFORCEMENT:ESCALATE/i);
  const [p] = c.approvals.listPending();
  c.approvals.approve({ approvalId: p.approvalId, credential: c.verifier.issue("alice") });
  await assert.rejects(() => c.send.execute({ ...input, subject: "Something else" }, { approvalId: p.approvalId }));
  assert.equal(c.count(), 0);
});

test("company: reject keeps the email from ever being sent", async () => {
  const c = company("acmefour", ["alice"]);
  const input = mailTo("acmefour.com");
  await assert.rejects(() => c.send.execute(input), /ENFORCEMENT:ESCALATE/i);
  const [p] = c.approvals.listPending();
  assert.equal(c.approvals.reject({ approvalId: p.approvalId, credential: c.verifier.issue("alice"), reason: "not intended" }).status, "rejected");
  await assert.rejects(() => c.send.execute(input, { approvalId: p.approvalId }));
  assert.equal(c.count(), 0);
});

test("tenants: one company's approver credential is worthless in another company", async () => {
  const a = company("tenanta", ["alice"]);
  const b = company("tenantb", ["alice"]);
  await assert.rejects(() => a.send.execute(mailTo("tenanta.com")), /ENFORCEMENT:ESCALATE/i);
  const [p] = a.approvals.listPending();
  assert.throws(() => a.approvals.approve({ approvalId: p.approvalId, credential: b.verifier.issue("alice") }), /invalid or expired/i);
  assert.equal(a.approvals.get(p.approvalId).status, "pending");
  assert.equal(b.approvals.listPending().length, 0);
});

test("company: read tools run without an approval", async () => {
  const c = company("acmefive", ["alice"]);
  assert.ok(c.search, "search tool exists");
  await c.search.execute({ query: "invoice" });
  assert.equal(c.approvals.listPending().length, 0);
});