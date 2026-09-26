"use client";

import { useEffect, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  CheckCircle2,
  CircleAlert,
  FileCheck2,
  ShieldCheck,
  TimerReset,
  Workflow,
} from "lucide-react";

const events = [
  {
    time: "12:42:18",
    agent: "payments-agent",
    action: "create_payout",
    decision: "ESCALATE",
    result: "human_review",
  },
  {
    time: "12:41:51",
    agent: "support-agent",
    action: "read_customer_record",
    decision: "ALLOW",
    result: "executed",
  },
  {
    time: "12:40:26",
    agent: "research-agent",
    action: "fetch_external_url",
    decision: "BLOCK",
    result: "prevented",
  },
  {
    time: "12:38:07",
    agent: "ops-agent",
    action: "deploy_change",
    decision: "ALLOW",
    result: "executed",
  },
];

const policyRows = [
  ["PII access", "418", "blocked"],
  ["External execution", "163", "blocked"],
  ["Privilege escalation", "27", "blocked"],
  ["Human approval", "19", "escalated"],
];

export default function DashboardOverview() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="mx-auto max-w-[1400px]">
      <div className="mb-8 flex flex-col justify-between gap-4 md:flex-row md:items-end">
        <div>
          <div className="text-[10px] font-black uppercase tracking-[0.18em] text-[#2563EB]">
            Enterprise workspace
          </div>
          <h1 className="mt-2 text-[32px] font-black tracking-[-0.045em]">
            Security control plane
          </h1>
          <p className="mt-2 max-w-2xl text-[14px] font-medium leading-6 text-slate-500">
            Sample enterprise telemetry for an Aegisora 1.5 deployment. The
            workspace is designed to make agent behavior, enforcement and
            evidence immediately observable.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 self-start rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Enforcement boundary healthy
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric icon={<Activity />} label="Governed actions" value="1.24M" delta="+12.5%" />
        <Metric icon={<ShieldCheck />} label="Blocked" value="14,209" delta="+4.2%" />
        <Metric icon={<TimerReset />} label="Decision p99" value="12ms" delta="stable" />
        <Metric icon={<Workflow />} label="Active agents" value="42" delta="+2 active" />
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <section className="aegis-panel">
          <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
            <div>
              <div className="text-[13px] font-black">Execution activity</div>
              <div className="mt-1 text-[11px] font-medium text-slate-400">
                Representative event stream
              </div>
            </div>
            <button className="inline-flex items-center gap-1 text-[11px] font-black text-[#2563EB]">
              Open monitor
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {events.map((event) => (
              <div key={`${event.time}-${event.agent}`} className="grid grid-cols-[80px_1fr_auto] gap-4 px-5 py-4">
                <div className="aegis-mono text-[10px] text-slate-400">
                  {event.time}
                </div>

                <div className="min-w-0">
                  <div className="truncate text-[12px] font-black text-slate-900">
                    {event.agent}
                  </div>
                  <div className="aegis-mono mt-1 truncate text-[10px] text-slate-400">
                    {event.action}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1">
                  <DecisionBadge value={event.decision} />
                  <span className="text-[10px] font-bold text-slate-400">
                    {event.result}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="aegis-panel">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="text-[13px] font-black">Control posture</div>
            <div className="mt-1 text-[11px] font-medium text-slate-400">
              Current policy and evidence state
            </div>
          </div>

          <div className="space-y-3 p-5">
            <PostureRow label="Policy engine" value="Enforced" tone="green" />
            <PostureRow label="Identity checks" value="Enabled" tone="green" />
            <PostureRow label="Evidence persistence" value="Healthy" tone="green" />
            <PostureRow label="Human approvals" value="3 pending" tone="amber" />
            <PostureRow label="Active incidents" value="1 monitored" tone="red" />
          </div>
        </section>
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[1fr_1fr]">
        <section className="aegis-panel">
          <div className="flex items-center gap-3 border-b border-slate-200 px-5 py-4">
            <FileCheck2 className="h-4 w-4 text-[#2563EB]" />
            <div className="text-[13px] font-black">Evidence integrity</div>
          </div>

          <div className="aegis-grid p-5">
            <div className="grid gap-3 md:grid-cols-3">
              <EvidenceCard title="Persisted" value="99.98%" />
              <EvidenceCard title="Correlated" value="100%" />
              <EvidenceCard title="Queryable" value="100%" />
            </div>
          </div>
        </section>

        <section className="aegis-panel">
          <div className="border-b border-slate-200 px-5 py-4">
            <div className="text-[13px] font-black">Policy interventions</div>
          </div>

          <div className="divide-y divide-slate-100">
            {policyRows.map(([policy, count, status]) => (
              <div key={policy} className="flex items-center justify-between px-5 py-3.5">
                <div>
                  <div className="text-[12px] font-black">{policy}</div>
                  <div className="mt-0.5 text-[10px] font-medium text-slate-400">
                    {status}
                  </div>
                </div>
                <div className="aegis-mono text-[12px] font-black">{count}</div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="text-[12px] font-black text-blue-950">
              Demo workspace
            </div>
            <div className="mt-1 text-[11px] font-medium leading-5 text-blue-900/70">
              Sample telemetry is illustrative. Connect a runtime to replace
              this data with your organization&apos;s live governance events.
            </div>
          </div>
          <button className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-950 px-4 py-2.5 text-[11px] font-black text-white">
            Connect runtime
            <ArrowUpRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  delta,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  delta: string;
}) {
  return (
    <div className="aegis-panel p-5">
      <div className="flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-950 text-white">
          {icon}
        </div>
        <div className="text-[10px] font-black text-slate-400">{delta}</div>
      </div>

      <div className="mt-6 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400">
        {label}
      </div>
      <div className="mt-1 text-[30px] font-black tracking-[-0.04em]">{value}</div>
    </div>
  );
}

function DecisionBadge({ value }: { value: string }) {
  const tone =
    value === "ALLOW"
      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
      : value === "BLOCK"
        ? "bg-rose-50 text-rose-700 border-rose-200"
        : "bg-amber-50 text-amber-700 border-amber-200";

  return (
    <span className={`rounded-full border px-2 py-1 text-[9px] font-black ${tone}`}>
      {value}
    </span>
  );
}

function PostureRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: "green" | "amber" | "red";
}) {
  const map = {
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
  };

  return (
    <div className="flex items-center justify-between rounded-xl border border-slate-200 px-4 py-3">
      <div className="text-[11px] font-bold text-slate-600">{label}</div>
      <div className={`rounded-full px-2.5 py-1 text-[9px] font-black ${map[tone]}`}>
        {value}
      </div>
    </div>
  );
}

function EvidenceCard({
  title,
  value,
}: {
  title: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="text-[9px] font-black uppercase tracking-[0.14em] text-slate-400">
        {title}
      </div>
      <div className="mt-2 text-[24px] font-black">{value}</div>
      <div className="mt-1 text-[10px] font-medium text-slate-400">
        sample metric
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-[1400px] animate-pulse">
      <div className="mb-8">
        <div className="h-3 w-40 rounded bg-slate-200" />
        <div className="mt-3 h-8 w-72 rounded bg-slate-200" />
        <div className="mt-3 h-4 w-96 rounded bg-slate-200" />
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="aegis-panel p-5">
            <div className="h-9 w-9 rounded-lg bg-slate-200" />
            <div className="mt-6 h-3 w-20 rounded bg-slate-200" />
            <div className="mt-2 h-7 w-24 rounded bg-slate-200" />
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.6fr_1fr]">
        <div className="aegis-panel h-80" />
        <div className="aegis-panel h-80" />
      </div>
    </div>
  );
}