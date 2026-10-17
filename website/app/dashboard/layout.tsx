"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  AlertOctagon,
  BarChart3,
  Bell,
  BookOpen,
  Box,
  ClipboardList,
  Cpu,
  FileCheck2,
  LayoutDashboard,
  LockKeyhole,
  Puzzle,
  Search,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Users,
  Users2,
  Wrench,
  Zap,
  type LucideIcon,
} from "lucide-react";
import EnterpriseMark from "@/components/EnterpriseMark";

type DashboardNavItem = [string, string, LucideIcon];

type DashboardNavGroup = {
  label: string;
  items: DashboardNavItem[];
};

const groups: DashboardNavGroup[] = [
  {
    label: "Governance",
    items: [
      ["Overview", "/dashboard", LayoutDashboard],
      ["Agents", "/dashboard/agents", Users],
      ["Policies", "/dashboard/policies", ShieldCheck],
      ["Approvals", "/dashboard/policies/approvals", FileCheck2],
      ["Risk Center", "/dashboard/risk-center", AlertOctagon],
    ],
  },
  {
    label: "Security",
    items: [
      ["Security", "/dashboard/audit", ShieldAlert],
      ["Audit & Evidence", "/dashboard/audit/evidence", ClipboardList],
      ["Live Monitor", "/dashboard/live-monitor", Activity],
      ["Runtime", "/dashboard/runtime", Zap],
    ],
  },
  {
    label: "Infrastructure",
    items: [
      ["Providers", "/dashboard/providers", Cpu],
      ["Models", "/dashboard/models", Box],
      ["Tools", "/dashboard/tools", Wrench],
      ["Integrations", "/dashboard/integrations", Puzzle],
      ["Knowledge", "/dashboard/knowledge", BookOpen],
    ],
  },
  {
    label: "Operations",
    items: [
      ["Reports", "/dashboard/reports", BarChart3],
      ["Team", "/dashboard/team", Users2],
      ["Settings", "/dashboard/settings", Settings],
    ],
  },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#F6F8FB] text-slate-950">
      <aside className="fixed inset-y-0 left-0 z-50 hidden w-[254px] border-r border-slate-200 bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center border-b border-slate-200 px-5">
          <EnterpriseMark />
        </div>

        <div className="border-b border-slate-200 px-4 py-4">
          <div className="rounded-xl bg-slate-950 px-4 py-3 text-white">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-[12px] font-black">Enterprise Workspace</div>
                <div className="mt-1 text-[10px] font-medium text-slate-400">
                  Sample tenant · v1.5
                </div>
              </div>

              <LockKeyhole className="h-4 w-4 text-blue-300" />
            </div>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.label} className="mb-6">
              <div className="px-3 pb-2 text-[9px] font-black uppercase tracking-[0.18em] text-slate-400">
                {group.label}
              </div>

              <div className="space-y-0.5">
                {group.items.map(([name, href, Icon]) => {
                  const active =
                    pathname === href ||
                    (href !== "/dashboard" && pathname.startsWith(href));

                  return (
                    <Link
                      key={String(href)}
                      href={String(href)}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-bold transition ${
                        active
                          ? "bg-blue-50 text-[#2563EB]"
                          : "text-slate-500 hover:bg-slate-50 hover:text-slate-950"
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? "text-[#2563EB]" : "text-slate-400"}`} />
                      <span>{name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        <div className="border-t border-slate-200 p-4">
          <div className="flex items-center justify-between rounded-xl bg-slate-50 px-3 py-3">
            <div>
              <div className="text-[11px] font-black">Operator</div>
              <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                Admin
              </div>
            </div>
            <Settings className="h-4 w-4 text-slate-400" />
          </div>
        </div>
      </aside>

      <div className="lg:pl-[254px]">
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-5 backdrop-blur md:px-8">
          <div className="flex items-center gap-3">
            <div className="text-[11px] font-black uppercase tracking-[0.15em] text-slate-400">
              AEGISORA
            </div>
            <div className="text-slate-300">/</div>
            <div className="text-[12px] font-bold capitalize text-slate-900">
              {pathname === "/dashboard"
                ? "Overview"
                : pathname.split("/").filter(Boolean).pop()?.replaceAll("-", " ")}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                placeholder="Search workspace"
                className="h-9 w-60 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-[12px] outline-none transition focus:border-[#2563EB] focus:bg-white"
              />
            </div>

            <button className="relative">
              <Bell className="h-4 w-4 text-slate-400" />
              <span className="absolute -right-1 -top-1 h-2 w-2 rounded-full bg-[#2563EB]" />
            </button>
          </div>
        </header>

        <main className="min-h-[calc(100vh-64px)] p-5 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}