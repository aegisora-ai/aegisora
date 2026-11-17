import {
  Activity, Bot, ScrollText, Scale, UserCheck, TriangleAlert, FileCheck,
  Bell, Lock, Plug, Rocket, ClipboardList, GitBranch, Webhook, KeyRound, Settings, LayoutGrid, ShieldCheck, type LucideIcon, LayoutTemplate, Cable, Sparkles } from "lucide-react";

export type NavItem = { label: string; path: string; icon: LucideIcon };
export const NAV: { group: string; items: NavItem[] }[] = [
  { group: "Runtime", items: [
    { label: "Overview", path: "", icon: LayoutGrid },
    { label: "Setup guide", path: "setup", icon: Rocket },
    { label: "Live Activity", path: "live-activity", icon: Activity },
    { label: "Agents", path: "agents", icon: Bot },
    { label: "Connect agent", path: "connect", icon: Plug },
    { label: "Policies", path: "policies", icon: ScrollText },
  ]},
  { group: "Governance", items: [
    { label: "Decisions", path: "decisions", icon: Scale },
    { label: "Approvals", path: "approvals", icon: UserCheck },
    { label: "Incidents", path: "incidents", icon: TriangleAlert },
    { label: "Evidence", path: "evidence", icon: FileCheck },
    { label: "Audit", path: "audit", icon: ClipboardList },
    { label: "Traces", path: "traces", icon: GitBranch },
  ]},
  { group: "Platform", items: [
    { label: "Webhooks", path: "webhooks", icon: Webhook },
    { label: "Connectors", path: "connectors", icon: Cable },
    { label: "Presets", path: "presets", icon: LayoutTemplate },
    { label: "Skills", path: "skills", icon: Sparkles },
    { label: "API Keys", path: "api-keys", icon: KeyRound },
    { label: "Diagnostics", path: "diagnostics", icon: ShieldCheck },
    { label: "Notifications", path: "notifications", icon: Bell },
  ]},
  { group: "Organization", items: [
    { label: "Security", path: "security", icon: Lock },
    { label: "Settings", path: "settings", icon: Settings },
  ]},
];
