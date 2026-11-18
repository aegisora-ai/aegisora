import type {
  GmailClient,
  GmailMessage,
  GmailMessageSummary,
  GmailSendRequest,
} from "./gmail";

export interface FetchResponseLike {
  readonly ok: boolean;
  readonly status: number;
  json(): Promise<unknown>;
}

export interface FetchInitLike {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
  signal?: unknown;
}

export type FetchLike = (url: string, init?: FetchInitLike) => Promise<FetchResponseLike>;

export interface GmailRestClientOptions {
  /** Returns a fresh OAuth access token. Token acquisition and refresh are the caller's job. */
  readonly getAccessToken: () => Promise<string>;
  /** Defaults to the global fetch (Node 18+). */
  readonly fetch?: FetchLike;
  /** Per-request timeout, 1000 to 60000 ms. Default 15000. */
  readonly timeoutMs?: number;
}

interface RuntimeGlobals {
  fetch?: FetchLike;
  Buffer?: { from(input: string, encoding: string): { toString(encoding: string): string } };
  AbortController?: new () => { signal: unknown; abort(): void };
  setTimeout?: (fn: () => void, ms: number) => unknown;
  clearTimeout?: (handle: unknown) => void;
}

const g = globalThis as unknown as RuntimeGlobals;
const BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const SUMMARY_HEADERS = "metadataHeaders=From&metadataHeaders=To&metadataHeaders=Subject&metadataHeaders=Date";

function rec(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as Record<string, unknown>) : {};
}

function toBase64(text: string): string {
  if (!g.Buffer) throw new Error("Buffer is not available in this runtime.");
  return g.Buffer.from(text, "utf8").toString("base64");
}

function toBase64Url(text: string): string {
  return toBase64(text).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(data: string): string {
  if (!g.Buffer) throw new Error("Buffer is not available in this runtime.");
  return g.Buffer.from(data.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
}

function headerMap(headers: unknown): Map<string, string> {
  const map = new Map<string, string>();
  if (!Array.isArray(headers)) return map;
  for (const h of headers) {
    const r = rec(h);
    if (typeof r.name === "string" && typeof r.value === "string") map.set(r.name.toLowerCase(), r.value);
  }
  return map;
}

function toSummary(raw: unknown): GmailMessageSummary {
  const r = rec(raw);
  if (typeof r.id !== "string") throw new Error("Unexpected Gmail API response.");
  const h = headerMap(rec(r.payload).headers);
  const from = h.get("from");
  const to = h.get("to");
  const subject = h.get("subject");
  const date = h.get("date");
  return {
    id: r.id,
    ...(typeof r.threadId === "string" ? { threadId: r.threadId } : {}),
    ...(from !== undefined ? { from } : {}),
    ...(to !== undefined ? { to: to.split(",").map((s) => s.trim()).filter(Boolean) } : {}),
    ...(subject !== undefined ? { subject } : {}),
    ...(typeof r.snippet === "string" ? { snippet: r.snippet } : {}),
    ...(date !== undefined ? { date } : {}),
  };
}

function findPlainText(part: unknown, depth: number): string | undefined {
  if (depth > 8) return undefined;
  const p = rec(part);
  const body = rec(p.body);
  if (p.mimeType === "text/plain" && typeof body.data === "string") return fromBase64Url(body.data);
  if (Array.isArray(p.parts)) {
    for (const child of p.parts) {
      const found = findPlainText(child, depth + 1);
      if (found !== undefined) return found;
    }
  }
  return undefined;
}

function noLineBreaks(value: string, field: string): string {
  if (/[\r\n]/.test(value)) throw new Error(`${field} must not contain line breaks.`);
  return value;
}

function encodeSubject(subject: string): string {
  // eslint-disable-next-line no-control-regex
  return /^[\x20-\x7e]*$/.test(subject) ? subject : `=?UTF-8?B?${toBase64(subject)}?=`;
}

function buildRfc822(request: GmailSendRequest): string {
  const to = request.to.map((a) => noLineBreaks(a, "to"));
  const cc = (request.cc ?? []).map((a) => noLineBreaks(a, "cc"));
  const subject = noLineBreaks(request.subject, "subject");
  const lines = [
    `To: ${to.join(", ")}`,
    ...(cc.length ? [`Cc: ${cc.join(", ")}`] : []),
    `Subject: ${encodeSubject(subject)}`,
    "MIME-Version: 1.0",
    'Content-Type: text/plain; charset="UTF-8"',
    "Content-Transfer-Encoding: base64",
    "",
    toBase64(request.body).replace(/.{1,76}/g, "$&\r\n").trimEnd(),
  ];
  return lines.join("\r\n");
}

/**
 * GmailClient on top of the Gmail REST API. No extra dependency.
 * Needed OAuth scopes: gmail.readonly and gmail.send. Never request delete scopes.
 */
export function createGmailRestClient(options: GmailRestClientOptions): GmailClient {
  if (!options || typeof options.getAccessToken !== "function") {
    throw new Error("getAccessToken is required.");
  }
  const maybeFetch = options.fetch ?? g.fetch;
  if (typeof maybeFetch !== "function") throw new Error("No fetch implementation available.");
  const doFetch: FetchLike = maybeFetch;
  const timeoutMs = options.timeoutMs ?? 15_000;
  if (!Number.isInteger(timeoutMs) || timeoutMs < 1000 || timeoutMs > 60_000) {
    throw new Error("timeoutMs must be an integer between 1000 and 60000.");
  }

  async function call(path: string, init: { method?: string; body?: string }): Promise<unknown> {
    const token = await options.getAccessToken();
    if (typeof token !== "string" || token.length === 0 || /[\s]/.test(token)) {
      throw new Error("Gmail access token is invalid.");
    }
    const controller = g.AbortController ? new g.AbortController() : undefined;
    const timer = controller && g.setTimeout ? g.setTimeout(() => controller.abort(), timeoutMs) : undefined;
    try {
      const response = await doFetch(BASE + path, {
        method: init.method ?? "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          ...(init.body !== undefined ? { "Content-Type": "application/json" } : {}),
        },
        ...(init.body !== undefined ? { body: init.body } : {}),
        ...(controller ? { signal: controller.signal } : {}),
      });
      if (!response.ok) throw new Error(`Gmail API request failed with status ${response.status}.`);
      return await response.json();
    } finally {
      if (timer !== undefined && g.clearTimeout) g.clearTimeout(timer);
    }
  }

  return {
    async searchMessages(query): Promise<GmailMessageSummary[]> {
      const qs = `maxResults=${query.maxResults}` + (query.query ? `&q=${encodeURIComponent(query.query)}` : "");
      const list = rec(await call(`/messages?${qs}`, {}));
      const ids = (Array.isArray(list.messages) ? list.messages : [])
        .map((m) => rec(m).id)
        .filter((x): x is string => typeof x === "string")
        .slice(0, query.maxResults);
      return Promise.all(
        ids.map(async (id) =>
          toSummary(await call(`/messages/${encodeURIComponent(id)}?format=metadata&${SUMMARY_HEADERS}`, {})),
        ),
      );
    },

    async getMessage(id): Promise<GmailMessage> {
      const raw = await call(`/messages/${encodeURIComponent(id)}?format=full`, {});
      const body = findPlainText(rec(raw).payload, 0);
      return { ...toSummary(raw), ...(body !== undefined ? { body } : {}) };
    },

    async sendMessage(request): Promise<{ id: string }> {
      const raw = buildRfc822(request);
      const sent = rec(await call("/messages/send", { method: "POST", body: JSON.stringify({ raw: toBase64Url(raw) }) }));
      if (typeof sent.id !== "string") throw new Error("Unexpected Gmail API response.");
      return { id: sent.id };
    },
  };
}