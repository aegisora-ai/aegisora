"use strict";
// One-time OAuth helper (loopback + PKCE). Saves tokens to .gmail-token.json (git-ignored).
//   set GOOGLE_CLIENT_ID=...   (OAuth client of type "Desktop app")
//   set GOOGLE_CLIENT_SECRET=...   (if your client has one)
//   node gmail-oauth.cjs
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
if (!CLIENT_ID) { console.error("Set GOOGLE_CLIENT_ID first."); process.exit(1); }

const PORT = 53682;
const REDIRECT = "http://127.0.0.1:" + PORT + "/callback";
const SCOPES = ["https://www.googleapis.com/auth/gmail.send", "https://www.googleapis.com/auth/gmail.readonly"].join(" ");
const verifier = crypto.randomBytes(32).toString("base64url");
const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
const state = crypto.randomBytes(16).toString("hex");

const authUrl = "https://accounts.google.com/o/oauth2/v2/auth?" + new URLSearchParams({
  client_id: CLIENT_ID, redirect_uri: REDIRECT, response_type: "code", scope: SCOPES,
  access_type: "offline", prompt: "consent", state, code_challenge: challenge, code_challenge_method: "S256",
}).toString();

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1:" + PORT);
  if (url.pathname !== "/callback") { res.writeHead(404); res.end(); return; }
  const done = (status, text) => { res.writeHead(status, { "Content-Type": "text/plain; charset=utf-8" }); res.end(text); };
  if (url.searchParams.get("state") !== state) { done(400, "State mismatch."); return; }
  const code = url.searchParams.get("code");
  if (!code) { done(400, "No code: " + (url.searchParams.get("error") || "unknown")); return; }
  try {
    const body = new URLSearchParams({ client_id: CLIENT_ID, code, code_verifier: verifier, grant_type: "authorization_code", redirect_uri: REDIRECT });
    if (CLIENT_SECRET) body.set("client_secret", CLIENT_SECRET);
    const r = await fetch("https://oauth2.googleapis.com/token", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body });
    const j = await r.json();
    if (!r.ok) throw new Error(j.error_description || j.error || r.status);
    fs.writeFileSync(path.join(__dirname, ".gmail-token.json"), JSON.stringify({
      access_token: j.access_token, refresh_token: j.refresh_token, scope: j.scope, expires_at: Date.now() + j.expires_in * 1000,
    }), { mode: 0o600 });
    done(200, "Done. You can close this tab.");
    console.log("Saved .gmail-token.json. Now run: set LIVE_GMAIL=1, set DEMO_TO=<your test address>, node server.cjs");
  } catch (e) {
    done(500, "Token exchange failed.");
    console.error("Token exchange failed:", e.message);
  }
  server.close();
});
server.listen(PORT, "127.0.0.1", () => {
  console.log("Open this URL in your browser and approve access with your TEST account:\n\n" + authUrl + "\n");
});
setTimeout(() => { console.error("Timed out."); process.exit(1); }, 5 * 60 * 1000).unref();