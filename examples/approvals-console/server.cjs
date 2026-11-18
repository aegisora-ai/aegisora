"use strict";
// Local approvals console for demos. Binds to 127.0.0.1 only.
// The "agent" runs in this same process so the demo can resume a send after approval.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { AegisoraClient, gmailConnector, GMAIL_TOOL_NAMES, createHmacApproverVerifier } = require("../../core/packages/sdk/dist/index.js");

const HOST = "127.0.0.1";
const PORT = Number(process.env.PORT || 4545);
const LIVE = process.env.LIVE_GMAIL === "1";
const DEMO_TO = process.env.DEMO_TO || "";
const secret = process.env.APPROVER_SECRET || crypto.randomBytes(32).toString("hex");
const approvers = (process.env.APPROVERS || "reviewer").split(",").map((s) => s.trim()).filter(Boolean);

if (LIVE && !DEMO_TO) {
  console.error("LIVE_GMAIL=1 requires DEMO_TO (the address the demo email is really sent to).");
  process.exit(1);
}

const verifier = createHmacApproverVerifier({ secret, allowedActors: approvers });

let gmail;
if (LIVE) {
  gmail = require("./gmail-rest.cjs").createGmailRest();
} else {
  let n = 0;
  gmail = {
    async searchMessages() { return []; },
    async getMessage(id) { return { id }; },
    async sendMessage(msg) { n += 1; console.log("[fake gmail] send:", JSON.stringify(msg).slice(0, 200)); return { id: "fake-" + n }; },
  };
}

const AGENT_ID = "support-agent";
const client = new AegisoraClient();
client.agent({ name: AGENT_ID });
client.useApproverVerifier(verifier);
const tools = client.protectTools(gmailConnector(gmail, { agentId: AGENT_ID, contractId: "task-demo" }));
const sendTool = tools.find((t) => t.name === GMAIL_TOOL_NAMES.send);
const inputs = new Map();

async function simulate(long) {
  const input = {
    to: [DEMO_TO || "customer@example.com"],
    subject: "Your refund has been processed",
    body: long ? "Details follow.\n" + "Refund line item. ".repeat(300) : "Hello, your refund of 49.90 EUR has been processed and will arrive in 3-5 business days.",
  };
  const before = new Set(client.approvals.listPending().map((p) => p.approvalId));
  try {
    const result = await sendTool.execute(input);
    return { outcome: "sent-without-approval", result };
  } catch (e) {
    const message = String((e && e.message) || e);
    if (!/ENFORCEMENT:ESCALATE/i.test(message)) return { outcome: "blocked", message };
    const created = client.approvals.listPending().find((p) => !before.has(p.approvalId));
    if (created) inputs.set(created.approvalId, input);
    return { outcome: "awaiting-approval", approvalId: created ? created.approvalId : null };
  }
}

const STATIC = {
  "/": ["index.html", "text/html; charset=utf-8"],
  "/app.js": ["app.js", "text/javascript; charset=utf-8"],
  "/app.css": ["app.css", "text/css; charset=utf-8"],
};
const BASE_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "Referrer-Policy": "no-referrer",
  "Content-Security-Policy": "default-src 'none'; script-src 'self'; style-src 'self'; connect-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
};

function sendJson(res, status, obj) {
  res.writeHead(status, { ...BASE_HEADERS, "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(obj));
}
function serveStatic(res, entry) {
  fs.readFile(path.join(__dirname, entry[0]), (err, data) => {
    if (err) return sendJson(res, 404, { error: "not found" });
    res.writeHead(200, { ...BASE_HEADERS, "Content-Type": entry[1] });
    res.end(data);
  });
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];
    req.on("data", (c) => {
      size += c.length;
      if (size > 65536) { reject(new Error("body too large")); req.destroy(); return; }
      chunks.push(c);
    });
    req.on("end", () => {
      if (chunks.length === 0) return resolve({});
      try { resolve(JSON.parse(Buffer.concat(chunks).toString("utf8"))); } catch { reject(new Error("invalid JSON")); }
    });
    req.on("error", reject);
  });
}
function authenticate(req) {
  const h = String(req.headers.authorization || "");
  if (!h.startsWith("Bearer ")) return null;
  try { return verifier.verify(h.slice(7)); } catch { return null; }
}

const server = http.createServer(async (req, res) => {
  try {
    const host = String(req.headers.host || "");
    if (host !== HOST + ":" + PORT && host !== "localhost:" + PORT) return sendJson(res, 403, { error: "forbidden host" });
    const url = new URL(req.url || "/", "http://" + host);
    if (req.method === "GET" && STATIC[url.pathname]) return serveStatic(res, STATIC[url.pathname]);
    if (!url.pathname.startsWith("/api/")) return sendJson(res, 404, { error: "not found" });

    const who = authenticate(req);
    if (!who) return sendJson(res, 401, { error: "invalid or expired credential" });
    const token = String(req.headers.authorization).slice(7);

    if (req.method === "GET" && url.pathname === "/api/whoami") return sendJson(res, 200, { actorId: who.actorId, live: LIVE });
    if (req.method === "GET" && url.pathname === "/api/pending") return sendJson(res, 200, { pending: client.approvals.listPending() });
    if (req.method !== "POST") return sendJson(res, 405, { error: "method not allowed" });

    const body = await readBody(req);
    if (url.pathname === "/api/simulate") return sendJson(res, 200, await simulate(body.long === true));
    if (url.pathname === "/api/approve") {
      const rec = client.approvals.approve({ approvalId: body.approvalId, credential: token });
      const input = inputs.get(body.approvalId);
      let sent = null;
      if (input) { sent = await sendTool.execute(input, { approvalId: body.approvalId }); inputs.delete(body.approvalId); }
      return sendJson(res, 200, { status: rec.status, sent });
    }
    if (url.pathname === "/api/reject") {
      const rec = client.approvals.reject({ approvalId: body.approvalId, credential: token, ...(typeof body.reason === "string" && body.reason ? { reason: body.reason } : {}) });
      inputs.delete(body.approvalId);
      return sendJson(res, 200, { status: rec.status });
    }
    return sendJson(res, 404, { error: "not found" });
  } catch (e) {
    return sendJson(res, 400, { error: String((e && e.message) || e) });
  }
});

server.listen(PORT, HOST, () => {
  console.log("Approvals console: http://" + HOST + ":" + PORT + "/  (" + (LIVE ? "LIVE Gmail" : "fake Gmail") + ")");
  console.log("Sign in with one of these credentials (demo only; in production they come from your SSO):");
  for (const a of approvers) console.log("  " + a + ": " + verifier.issue(a));
});