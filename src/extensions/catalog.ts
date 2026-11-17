import type { ExtensionItem, ExtensionKind } from "./types";

export const KIND_META: Record<
  ExtensionKind,
  { title: string; subtitle: string; empty: string }
> = {
  connectors: {
    title: "Connectors",
    subtitle:
      "Connect your agents and tools. Every connected agent goes through Aegisora before it acts.",
    empty: "No connectors match your search.",
  },
  presets: {
    title: "Presets",
    subtitle:
      "Ready-made rule packs. Pick one and your agents know what is allowed, what needs approval, and what is blocked.",
    empty: "No presets match your search.",
  },
  skills: {
    title: "Skills",
    subtitle:
      "Add governance abilities to your agents: sealed executions, approvals, evidence, and more.",
    empty: "No skills match your search.",
  },
};

// To add something new, add one entry here. Nothing else changes.
export const CATALOG: ExtensionItem[] = [
  {
    id: "preset-safe-coding-agent",
    kind: "presets",
    name: "Safe Coding Agent",
    category: "Development",
    status: "ready",
    description:
      "Lets coding agents read freely, asks before writing or pushing, and blocks destructive actions.",
    rules: [
      { action: "files.read", decision: "ALLOW" },
      { action: "files.write", decision: "ESCALATE" },
      { action: "shell.exec", decision: "ESCALATE" },
      { action: "git.push", decision: "ESCALATE" },
      { action: "files.delete", decision: "BLOCK" },
      { action: "secrets.read", decision: "BLOCK" },
    ],
  },
  {
    id: "preset-personal-finance",
    kind: "presets",
    name: "Personal Finance",
    category: "Finance",
    status: "ready",
    description:
      "Reading invoices is fine. Sending money needs your approval. Exporting bank data is blocked.",
    rules: [
      { action: "invoices.read", decision: "ALLOW" },
      { action: "payments.send", decision: "ESCALATE" },
      { action: "payments.refund", decision: "ESCALATE" },
      { action: "bank.export", decision: "BLOCK" },
      { action: "secrets.export", decision: "BLOCK" },
    ],
  },
  {
    id: "preset-secrets-guard",
    kind: "presets",
    name: "Secrets Guard",
    category: "Security",
    status: "ready",
    description:
      "Keeps keys, tokens, and credentials away from agents. The safest first preset for any team.",
    rules: [
      { action: "secrets.read", decision: "BLOCK" },
      { action: "secrets.export", decision: "BLOCK" },
      { action: "credentials.write", decision: "BLOCK" },
      { action: "env.read", decision: "ESCALATE" },
    ],
  },
  {
    id: "preset-customer-support",
    kind: "presets",
    name: "Customer Support",
    category: "Operations",
    status: "ready",
    description:
      "Agents can read and answer tickets. Refunds need approval. Customer data export is blocked.",
    rules: [
      { action: "tickets.read", decision: "ALLOW" },
      { action: "tickets.reply", decision: "ALLOW" },
      { action: "refunds.issue", decision: "ESCALATE" },
      { action: "customer.export", decision: "BLOCK" },
    ],
  },
  {
    id: "preset-data-privacy",
    kind: "presets",
    name: "Data Privacy",
    category: "Compliance",
    status: "ready",
    description:
      "Personal data access needs approval, exports and deletions are blocked, plain queries pass.",
    rules: [
      { action: "database.query", decision: "ALLOW" },
      { action: "pii.read", decision: "ESCALATE" },
      { action: "pii.export", decision: "BLOCK" },
      { action: "database.delete", decision: "BLOCK" },
    ],
  },
  {
    id: "skill-continuity-seal",
    kind: "skills",
    name: "Continuity Seal",
    category: "Execution integrity",
    status: "ready",
    description:
      "Seals every authorized action. If the action, input, or authority changes before execution, it is blocked.",
  },
  {
    id: "skill-evidence-ledger",
    kind: "skills",
    name: "Evidence Ledger",
    category: "Audit",
    status: "ready",
    description:
      "Every decision is recorded in a tamper-evident, hash-chained evidence trail.",
  },
  {
    id: "skill-approval-workflow",
    kind: "skills",
    name: "Approval Workflow",
    category: "Human in the loop",
    status: "ready",
    description:
      "Escalated actions wait for a human decision: approved, rejected, or expired.",
  },
  {
    id: "skill-spend-limit",
    kind: "skills",
    name: "Spend Limit",
    category: "Finance",
    status: "preview",
    description: "Hard daily and per-action spending limits for payment tools.",
  },
  {
    id: "skill-pii-shield",
    kind: "skills",
    name: "PII Shield",
    category: "Privacy",
    status: "preview",
    description: "Detects and masks personal data before it leaves your systems.",
  },
  {
    id: "skill-injection-shield",
    kind: "skills",
    name: "Prompt Injection Shield",
    category: "Security",
    status: "preview",
    description: "Flags tool calls that were triggered by untrusted content.",
  },
  {
    id: "skill-phone-approval",
    kind: "skills",
    name: "Phone Approval",
    category: "Human in the loop",
    status: "preview",
    description: "Approve or reject agent actions from your phone with biometric confirmation.",
  },
  {
    id: "conn-langchain",
    kind: "connectors",
    name: "LangChain / LangGraph",
    category: "Agent framework",
    status: "ready",
    description: "Wrap LangChain and LangGraph agents so every tool call is governed.",
    setup: "Uses the Aegisora SDK. See Connect agent.",
  },
  {
    id: "conn-webhooks",
    kind: "connectors",
    name: "Webhooks",
    category: "Notifications",
    status: "ready",
    description: "Send governance events to your own systems with signed requests.",
    setup: "Manage endpoints on the Webhooks page.",
  },
  {
    id: "conn-mcp-gateway",
    kind: "connectors",
    name: "MCP Gateway",
    category: "Protocol",
    status: "preview",
    description: "One gateway between your agents and any MCP server.",
  },
  {
    id: "conn-claude-code",
    kind: "connectors",
    name: "Claude Code",
    category: "Coding agent",
    status: "preview",
    description: "Govern what Claude Code is allowed to run and change.",
  },
  {
    id: "conn-cursor",
    kind: "connectors",
    name: "Cursor",
    category: "Coding agent",
    status: "preview",
    description: "Govern tool use of Cursor agents through the MCP Gateway.",
  },
  {
    id: "conn-slack",
    kind: "connectors",
    name: "Slack Approvals",
    category: "Notifications",
    status: "preview",
    description: "Approve or reject escalated actions without leaving Slack.",
  },
  {
    id: "conn-n8n",
    kind: "connectors",
    name: "n8n",
    category: "Automation",
    status: "preview",
    description: "Put a governance step in front of any n8n workflow action.",
  },
  {
    id: "conn-openai-agents",
    kind: "connectors",
    name: "OpenAI Agents SDK",
    category: "Agent framework",
    status: "preview",
    description: "Governed tool execution for OpenAI Agents SDK projects.",
  },
];