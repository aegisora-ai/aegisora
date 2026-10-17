import {
  Activity, Bot, ScrollText, Scale, UserCheck, TriangleAlert, FileCheck,
  ClipboardList, GitBranch, Webhook, KeyRound, Settings, LayoutGrid, type LucideIcon,
} from "lucide-react";

export type NavItem = { label: string; path: string; icon: LucideIcon };
export const NAV: { group: string; items: NavItem[] }[] = [
  { group: "Runtime", items: [
    { label: "Overview", path: "", icon: LayoutGrid },
    { label: "Live Activity", path: "live-activity", icon: Activity },
    { label: "Agents", path: "agents", icon: Bot },
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
    { label: "API Keys", path: "api-keys", icon: KeyRound },
  ]},
  { group: "Organization", items: [
    { label: "Settings", path: "settings", icon: Settings },
  ]},
];