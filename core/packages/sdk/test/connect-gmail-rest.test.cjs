const test = require("node:test");
const assert = require("node:assert/strict");
const { createGmailRestClient } = require("../dist/index.js");

const TOKEN = "secret-token-123";
function makeFetch(handler) {
  const calls = [];
  const f = async (url, init = {}) => {
    calls.push({ url, init });
    const r = handler(url, init);
    const status = r.status ?? 200;
    return { ok: status < 400, status, json: async () => r.json };
  };
  return { f, calls };
}
const client = (f) => createGmailRestClient({ getAccessToken: async () => TOKEN, fetch: f });
const b64 = (s) => Buffer.from(s, "utf8").toString("base64url");
const unb64 = (s) => Buffer.from(s, "base64url").toString("utf8");

test("search lists ids then fetches metadata, sends bearer token", async () => {
  const { f, calls } = makeFetch((url) => {
    if (url.includes("/messages?")) return { json: { messages: [{ id: "a1" }, { id: "b2" }] } };
    const id = url.includes("/a1?") ? "a1" : "b2";
    return { json: { id, threadId: "t" + id, snippet: "snip", payload: { headers: [
      { name: "From", value: "x@y.com" }, { name: "To", value: "p@q.com, r@s.com" },
      { name: "Subject", value: "Hello" }, { name: "Date", value: "Mon" } ] } } };
  });
  const out = await client(f).searchMessages({ query: "from:x@y.com is:unread", maxResults: 5 });
  assert.equal(out.length, 2);
  assert.deepEqual(out[0].to, ["p@q.com", "r@s.com"]);
  assert.equal(out[0].subject, "Hello");
  assert.equal(calls.length, 3);
  assert.ok(calls[0].url.includes("maxResults=5"));
  assert.ok(calls[0].url.includes(encodeURIComponent("from:x@y.com is:unread")));
  assert.equal(calls[0].init.headers.Authorization, "Bearer " + TOKEN);
});

test("read extracts the plain text part from multipart messages", async () => {
  const { f } = makeFetch(() => ({ json: { id: "m1", payload: { mimeType: "multipart/alternative", headers: [], parts: [
    { mimeType: "text/html", body: { data: b64("<p>x</p>") } },
    { mimeType: "text/plain", body: { data: b64("Merhaba ğüş") } } ] } } }));
  const m = await client(f).getMessage("m1");
  assert.equal(m.body, "Merhaba ğüş");
});

test("send builds a MIME message and returns only the id", async () => {
  const { f, calls } = makeFetch(() => ({ json: { id: "sent1", threadId: "t" } }));
  const r = await client(f).sendMessage({ to: ["a@b.com"], cc: ["c@d.com"], subject: "Hello", body: "Selam dünya" });
  assert.deepEqual(r, { id: "sent1" });
  assert.equal(calls[0].init.method, "POST");
  const raw = unb64(JSON.parse(calls[0].init.body).raw);
  assert.ok(raw.includes("To: a@b.com"));
  assert.ok(raw.includes("Cc: c@d.com"));
  assert.ok(raw.includes("Subject: Hello"));
  const encoded = raw.split("\r\n\r\n")[1].replace(/\r\n/g, "");
  assert.equal(Buffer.from(encoded, "base64").toString("utf8"), "Selam dünya");
});

test("non-ASCII subject is RFC 2047 encoded", async () => {
  const { f, calls } = makeFetch(() => ({ json: { id: "s" } }));
  await client(f).sendMessage({ to: ["a@b.com"], subject: "Merhaba şef", body: "x" });
  const raw = unb64(JSON.parse(calls[0].init.body).raw);
  assert.ok(raw.includes("Subject: =?UTF-8?B?"));
});

test("line breaks in addresses or subject are rejected before any request", async () => {
  const { f, calls } = makeFetch(() => ({ json: { id: "s" } }));
  const c = client(f);
  await assert.rejects(() => c.sendMessage({ to: ["a@b.com"], subject: "s\r\nBcc: x@y.com", body: "b" }));
  await assert.rejects(() => c.sendMessage({ to: ["a@b.com\nBcc: x@y.com"], subject: "s", body: "b" }));
  assert.equal(calls.length, 0);
});

test("API errors expose only the status, never token or body", async () => {
  const { f } = makeFetch(() => ({ status: 500, json: { error: "private mail content " + TOKEN } }));
  await assert.rejects(() => client(f).getMessage("m1"), (e) => {
    assert.ok(e.message.includes("500"));
    assert.ok(!e.message.includes(TOKEN) && !e.message.includes("private"));
    return true;
  });
});

test("invalid token and options are rejected", async () => {
  const { f, calls } = makeFetch(() => ({ json: {} }));
  const bad = createGmailRestClient({ getAccessToken: async () => "", fetch: f });
  await assert.rejects(() => bad.getMessage("m1"));
  assert.equal(calls.length, 0);
  assert.throws(() => createGmailRestClient({}));
  assert.throws(() => createGmailRestClient({ getAccessToken: async () => "t", fetch: f, timeoutMs: 5 }));
});