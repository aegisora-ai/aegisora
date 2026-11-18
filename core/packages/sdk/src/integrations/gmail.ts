import type {
  AegisoraTaskContract,
  AegisoraToolDefinition,
  ProtectToolsOptions,
} from "../integration/types";

/** Exact capability names. There is deliberately no delete capability. */
export const GMAIL_TOOL_NAMES = Object.freeze({
  search: "gmail.search_messages",
  read: "gmail.read_message",
  send: "gmail.send_message",
} as const);

export interface GmailMessageSummary {
  id: string;
  threadId?: string;
  from?: string;
  to?: string[];
  subject?: string;
  snippet?: string;
  date?: string;
}

export interface GmailMessage extends GmailMessageSummary {
  body?: string;
}

export interface GmailSendRequest {
  to: string[];
  cc?: string[];
  subject: string;
  body: string;
}

/**
 * Minimal Gmail surface the connector needs. Implement it with the Gmail API,
 * IMAP or a mock. The connector never receives credentials itself.
 * No delete method exists on purpose.
 */
export interface GmailClient {
  searchMessages(query: { query?: string; maxResults: number }): Promise<GmailMessageSummary[]>;
  getMessage(id: string): Promise<GmailMessage>;
  sendMessage(request: GmailSendRequest): Promise<{ id: string }>;
}

export interface GmailConnectorOptions {
  readonly agentId: string;
  readonly contractId: string;
  readonly expiresAt?: string;
  readonly maxExecutions?: number;
  /** Default true. When false, no send tool is offered and the contract omits it. */
  readonly allowSend?: boolean;
  /** Optional. When set, every recipient must belong to one of these domains. */
  readonly allowedRecipientDomains?: readonly string[];
}

const MESSAGE_ID = /^[A-Za-z0-9_-]{1,128}$/;
const EMAIL = /^[^\s@<>(),;:"]+@[^\s@<>(),;:"]+\.[^\s@<>(),;:"]+$/;
const MAX_RECIPIENTS = 20;
const MAX_SUBJECT = 200;
const MAX_BODY_SEND = 50_000;
const MAX_BODY_READ = 20_000;
const MAX_QUERY = 500;
const DEFAULT_RESULTS = 10;
const MAX_RESULTS = 25;

function asRecord(input: unknown, tool: string): Record<string, unknown> {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error(`${tool}: input must be an object.`);
  }
  return input as Record<string, unknown>;
}

function requireText(value: unknown, field: string, max: number, allowNewlines: boolean): string {
  if (typeof value !== "string" || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
  if (value.length > max) {
    throw new Error(`${field} is too long (max ${max} characters).`);
  }
  if (!allowNewlines && /[\r\n]/.test(value)) {
    throw new Error(`${field} must not contain line breaks.`);
  }
  return value;
}

function parseRecipients(value: unknown, field: string, required: boolean): string[] {
  if (value === undefined) {
    if (required) throw new Error(`${field} is required.`);
    return [];
  }
  if (!Array.isArray(value) || (required && value.length === 0) || value.length > MAX_RECIPIENTS) {
    throw new Error(`${field} must be a list of 1 to ${MAX_RECIPIENTS} addresses.`);
  }
  const seen = new Set<string>();
  for (const item of value) {
    if (typeof item !== "string") throw new Error(`${field} contains an invalid address.`);
    const address = item.trim().toLowerCase();
    if (address.length > 254 || !EMAIL.test(address)) {
      throw new Error(`${field} contains an invalid address.`);
    }
    seen.add(address);
  }
  return [...seen];
}

function enforceDomains(addresses: string[], allowed: Set<string> | undefined, field: string): void {
  if (!allowed) return;
  for (const address of addresses) {
    const domain = address.slice(address.lastIndexOf("@") + 1);
    if (!allowed.has(domain)) {
      throw new Error(`${field} contains a recipient outside the allowed domains.`);
    }
  }
}

function toSummary(m: GmailMessageSummary): GmailMessageSummary {
  return {
    id: m.id,
    ...(m.threadId !== undefined ? { threadId: m.threadId } : {}),
    ...(m.from !== undefined ? { from: m.from } : {}),
    ...(m.to !== undefined ? { to: m.to } : {}),
    ...(m.subject !== undefined ? { subject: m.subject } : {}),
    ...(m.snippet !== undefined ? { snippet: m.snippet } : {}),
    ...(m.date !== undefined ? { date: m.date } : {}),
  };
}

/**
 * Build the Gmail tool set and its matching task contract. The result can be
 * passed directly to protectTools(runtime, gmailConnector(client, options)).
 */
export function gmailConnector(client: GmailClient, options: GmailConnectorOptions): ProtectToolsOptions {
  if (!options || typeof options !== "object") throw new Error("Gmail connector options are required.");
  if (!client || typeof client !== "object") throw new Error("A GmailClient is required.");

  const allowSend = options.allowSend !== false;
  const domains = options.allowedRecipientDomains
    ? new Set(options.allowedRecipientDomains.map((d) => String(d).trim().toLowerCase()).filter(Boolean))
    : undefined;
  if (domains && domains.size === 0) {
    throw new Error("allowedRecipientDomains must not be empty when provided.");
  }

  const tools: AegisoraToolDefinition[] = [
    {
      name: GMAIL_TOOL_NAMES.search,
      description: "Search Gmail messages and return short summaries (read-only).",
      async execute(input: unknown): Promise<unknown> {
        const args = asRecord(input ?? {}, GMAIL_TOOL_NAMES.search);
        let maxResults = DEFAULT_RESULTS;
        if (args.maxResults !== undefined) {
          if (!Number.isInteger(args.maxResults) || (args.maxResults as number) < 1 || (args.maxResults as number) > MAX_RESULTS) {
            throw new Error(`maxResults must be an integer between 1 and ${MAX_RESULTS}.`);
          }
          maxResults = args.maxResults as number;
        }
        const query = args.query === undefined ? undefined : requireText(args.query, "query", MAX_QUERY, false);
        const found = await client.searchMessages({ ...(query !== undefined ? { query } : {}), maxResults });
        return found.slice(0, maxResults).map(toSummary);
      },
    },
    {
      name: GMAIL_TOOL_NAMES.read,
      description: "Read one Gmail message by id (read-only).",
      async execute(input: unknown): Promise<unknown> {
        const args = asRecord(input, GMAIL_TOOL_NAMES.read);
        if (typeof args.id !== "string" || !MESSAGE_ID.test(args.id)) {
          throw new Error("id is invalid.");
        }
        const message = await client.getMessage(args.id);
        return {
          ...toSummary(message),
          ...(message.body !== undefined ? { body: message.body.slice(0, MAX_BODY_READ) } : {}),
        };
      },
    },
  ];

  if (allowSend) {
    tools.push({
      name: GMAIL_TOOL_NAMES.send,
      description: "Send an email. Always requires human approval.",
      preflight(input: unknown): void {
        const args = asRecord(input, GMAIL_TOOL_NAMES.send);
        enforceDomains(parseRecipients(args.to, "to", true), domains, "to");
        enforceDomains(parseRecipients(args.cc, "cc", false), domains, "cc");
      },
      async execute(input: unknown): Promise<unknown> {
        const args = asRecord(input, GMAIL_TOOL_NAMES.send);
        const to = parseRecipients(args.to, "to", true);
        const cc = parseRecipients(args.cc, "cc", false);
        enforceDomains(to, domains, "to");
        enforceDomains(cc, domains, "cc");
        const subject = requireText(args.subject, "subject", MAX_SUBJECT, false);
        const body = requireText(args.body, "body", MAX_BODY_SEND, true);
        const sent = await client.sendMessage({ to, ...(cc.length ? { cc } : {}), subject, body });
        return { id: sent.id };
      },
    });
  }

  const contract: AegisoraTaskContract = {
    contractId: options.contractId,
    agentId: options.agentId,
    allowedTools: tools.map((t) => t.name),
    ...(allowSend ? { approvalRequiredTools: [GMAIL_TOOL_NAMES.send] } : {}),
    ...(options.expiresAt !== undefined ? { expiresAt: options.expiresAt } : {}),
    ...(options.maxExecutions !== undefined ? { maxExecutions: options.maxExecutions } : {}),
  };

  return { agentId: options.agentId, contract, tools };
}