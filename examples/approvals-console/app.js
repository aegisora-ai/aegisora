"use strict";
const $ = (id) => document.getElementById(id);
let token = "";
let timer = null;
try { token = sessionStorage.getItem("aegisora.token") || ""; } catch (_) { token = ""; }

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
}
function log(msg) {
  const li = el("li", "", new Date().toLocaleTimeString() + "  " + msg);
  $("log").prepend(li);
}
async function api(path, method, body) {
  const res = await fetch(path, {
    method: method || "GET",
    headers: { "Authorization": "Bearer " + token, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  let data = {};
  try { data = await res.json(); } catch (_) { data = {}; }
  if (!res.ok) throw new Error(data.error || ("HTTP " + res.status));
  return data;
}
function field(label, value) {
  const d = el("div", "field");
  d.append(el("b", "", label), el("span", "", value));
  return d;
}
function renderCard(p) {
  const card = el("div", "card");
  const preview = p.preview || {};
  const input = preview.input && typeof preview.input === "object" ? preview.input : {};
  card.append(el("h3", "", preview.tool || "Tool request"));
  card.append(el("div", "meta", "Approval " + p.approvalId));
  if (input.to !== undefined) card.append(field("To", Array.isArray(input.to) ? input.to.join(", ") : String(input.to)));
  if (input.subject !== undefined) card.append(field("Subject", String(input.subject)));
  if (preview.truncated) {
    card.append(el("div", "warning", "Content was shortened. You are approving a request you have not seen in full."));
  }
  card.append(el("pre", "", JSON.stringify(preview.input === undefined ? null : preview.input, null, 2)));
  const actions = el("div", "actions");
  const reason = el("input");
  reason.placeholder = "Reason (optional, for reject)";
  reason.maxLength = 500;
  const approve = el("button", "ok", "Approve");
  const reject = el("button", "bad", "Reject");
  approve.onclick = async () => {
    approve.disabled = reject.disabled = true;
    try {
      const r = await api("/api/approve", "POST", { approvalId: p.approvalId });
      log("Approved " + p.approvalId + (r.sent ? " - email sent (id " + r.sent.id + ")" : ""));
    } catch (e) { log("Approve failed: " + e.message); }
    refresh();
  };
  reject.onclick = async () => {
    approve.disabled = reject.disabled = true;
    try {
      await api("/api/reject", "POST", { approvalId: p.approvalId, reason: reason.value });
      log("Rejected " + p.approvalId);
    } catch (e) { log("Reject failed: " + e.message); }
    refresh();
  };
  actions.append(reason, approve, reject);
  card.append(actions);
  return card;
}
// Cards are kept between refreshes so text typed into a card (the reject reason) is not wiped.
const cards = new Map();
async function refresh() {
  try {
    const { pending } = await api("/api/pending");
    const box = $("pending");
    const ids = new Set(pending.map((p) => p.approvalId));
    for (const [id, node] of cards) {
      if (!ids.has(id)) { node.remove(); cards.delete(id); }
    }
    for (const p of pending) {
      if (!cards.has(p.approvalId)) {
        const node = renderCard(p);
        cards.set(p.approvalId, node);
        box.append(node);
      }
    }
    let note = box.querySelector(".empty");
    if (cards.size === 0) {
      if (!note) { note = el("p", "meta empty", "Nothing waiting for approval."); box.append(note); }
    } else if (note) {
      note.remove();
    }
  } catch (e) {
    signOut(e.message);
  }
}
async function simulate(long) {
  try {
    const r = await api("/api/simulate", "POST", { long });
    log("Agent attempted to send an email: " + r.outcome);
  } catch (e) { log("Simulation failed: " + e.message); }
  refresh();
}
function signOut(msg) {
  if (timer) clearInterval(timer);
  timer = null;
  cards.clear();
  $("pending").replaceChildren();
  try { sessionStorage.removeItem("aegisora.token"); } catch (_) {}
  token = "";
  $("app").hidden = true;
  $("login").hidden = false;
  $("who").textContent = "";
  $("loginError").textContent = msg || "";
}
async function signIn() {
  token = $("token").value.trim();
  $("token").value = "";
  try {
    const me = await api("/api/whoami");
    try { sessionStorage.setItem("aegisora.token", token); } catch (_) {}
    $("who").textContent = "Signed in as " + me.actorId + (me.live ? " (LIVE Gmail)" : "");
    $("login").hidden = true;
    $("app").hidden = false;
    $("loginError").textContent = "";
    refresh();
    timer = setInterval(refresh, 2000);
  } catch (e) {
    signOut("Sign-in failed: " + e.message);
  }
}
$("signin").onclick = signIn;
$("simShort").onclick = () => simulate(false);
$("simLong").onclick = () => simulate(true);
if (token) { $("token").value = token; signIn(); }