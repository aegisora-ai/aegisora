"use strict";
// Minimal Gmail REST client for the live demo. No dependencies, Node 18+.
// Argument shapes (to/cc/subject/body, query/maxResults) match the demo's usage;
// check them against gmailConnector before relying on this elsewhere.
const fs = require("node:fs");
const path = require("node:path");

const TOKEN_FILE = path.join(__dirname, ".gmail-token.json");
const API = "https://gmail.googleapis.com/gmail/v1/users/me";

function loadTokens() {
  if (process.env.GMAIL_ACCESS_TOKEN) return { access_token: process.env.GMAIL_ACCESS_TOKEN };
  return JSON.parse(fs.readFileSync(TOKEN_FILE, "utf8"));
}

async function accessToken() {
  const t = loadTokens();
  if (t.access_token && (!t.expires_at || t.expires_at > Date.now() + 60000)) return t.access_token;
  if (!t.refresh_token) throw new Error("Gmail token expired. Run gmail-oauth.cjs again.");
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID || "",
    refresh_token: t.refresh_token,
    grant_type: "refresh_token",
  });
  if (process.env.GOOGLE_CLIENT_SECRET) body.set("client_secret", process.env.GOOGLE_CLIENT_SECRET);
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Token refresh failed: " + (j.error || res.status));
  const next = { ...t, access_token: j.access_token, expires_at: Date.now() + j.expires_in * 1000 };
  fs.writeFileSync(TOKEN_FILE, JSON.stringify(next), { mode: 0o600 });
  return next.access_token;
}

async function call(pathname, init) {
  const res = await fetch(API + pathname, {
    ...(init || {}),
    headers: { "Authorization": "Bearer " + (await accessToken()), "Content-Type": "application/json" },
  });
  const j = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error("Gmail API " + res.status + ": " + ((j.error && j.error.message) || "error"));
  return j;
}

function headerValue(v) {
  const s = String(v);
  if (/[\r\n]/.test(s)) throw new Error("Invalid header value.");
  return s;
}
function list(x) {
  if (x === undefined || x === null) return [];
  return (Array.isArray(x) ? x : [x]).map(headerValue);
}
function wrap76(s) { return s.replace(/(.{76})/g, "$1\r\n"); }

function createGmailRest() {
  return {
    async searchMessages(args) {
      const q = typeof args === "string" ? args : (args && args.query) || "";
      const max = Math.min(Number((args && args.maxResults) || 10), 50);
      const j = await call("/messages?maxResults=" + max + "&q=" + encodeURIComponent(q));
      return j.messages || [];
    },
    async getMessage(id) {
      if (typeof id !== "string" || !/^[A-Za-z0-9_-]+$/.test(id)) throw new Error("Invalid message id.");
      return call("/messages/" + id + "?format=full");
    },
    async sendMessage(msg) {
      const to = list(msg && msg.to);
      if (to.length === 0) throw new Error("At least one recipient is required.");
      const cc = list(msg && msg.cc);
      const subject = headerValue((msg && msg.subject) || "");
      const body = String((msg && msg.body) || "");
      const lines = [
        "To: " + to.join(", "),
        ...(cc.length ? ["Cc: " + cc.join(", ")] : []),
        "Subject: =?UTF-8?B?" + Buffer.from(subject, "utf8").toString("base64") + "?=",
        "MIME-Version: 1.0",
        "Content-Type: text/plain; charset=UTF-8",
        "Content-Transfer-Encoding: base64",
        "",
        wrap76(Buffer.from(body, "utf8").toString("base64")),
      ];
      const raw = Buffer.from(lines.join("\r\n"), "utf8").toString("base64url");
      const j = await call("/messages/send", { method: "POST", body: JSON.stringify({ raw }) });
      return { id: j.id, threadId: j.threadId };
    },
  };
}

module.exports = { createGmailRest };