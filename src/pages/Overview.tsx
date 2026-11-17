import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check } from "lucide-react";
import { ago, rangeMs, RANGES, shortId, useRows } from "../lib/db";
import { Badge, Empty, ErrorNote, PageHead, RiskBar, Seg, Stat, StackedBars, type Bucket } from "../ui/kit";

const CLOSED = ["resolved", "closed"];
const up = (v: unknown) => String(v ?? "").toUpperCase();

export default function Overview() {
  const [range, setRange] = useState<string>("24h");
  const ms = rangeMs(range);
  const dec = useRows("decisions", { select: "id,agent_id,agent_name,action,decision,reason,risk_score,created_at", order: "created_at", limit: 2000, since: { col: "created_at", ms } });
  const appr = useRows("approvals", { select: "id,status,agent_id,agent_name,action,created_at", order: "created_at", limit: 200 });
  const inc = useRows("incidents", { select: "id,severity,status,title,created_at", order: "created_at", limit: 200 });
  const pol = useRows("policies", { select: "id", limit: 500 });
  const hooks = useRows("webhooks", { select: "id", limit: 200 });
  const exe = useRows("executions", { select: "id,duration_ms,created_at", order: "created_at", limit: 2000, since: { col: "created_at", ms } });

  const m = useMemo(() => {
    const rows = dec.rows;
    const allow = rows.filter((r) => up(r.decision) === "ALLOW").length;
    const escalate = rows.filter((r) => up(r.decision) === "ESCALATE").length;
    const block = rows.filter((r) => up(r.decision) === "BLOCK").length;
    const avg = rows.length ? Math.round(rows.reduce((s, r) => s + Number(r.risk_score ?? 0), 0) / rows.length) : 0;
    const start = Date.now() - ms, size = ms / 24;
    const buckets: Bucket[] = Array.from({ length: 24 }, (_, i) => ({
      label: new Date(start + i * size).toLocaleString([], ms > 36e5 * 30 ? { month: "short", day: "numeric" } : { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }),
      allow: 0, escalate: 0, block: 0,
    }));
    for (const r of rows) {
      const i = Math.min(23, Math.max(0, Math.floor((new Date(r.created_at).getTime() - start) / size)));
      const d = up(r.decision);
      if (d === "ALLOW") buckets[i].allow++; else if (d === "ESCALATE") buckets[i].escalate++; else if (d === "BLOCK") buckets[i].block++;
    }
    const durs = exe.rows.map((r) => Number(r.duration_ms)).filter((n) => Number.isFinite(n) && n > 0);
    return {
      total: rows.length, allow, escalate, block, avg, buckets,
      agents: new Set(rows.map((r) => r.agent_id)).size,
      executions: exe.rows.length,
      avgMs: durs.length ? Math.round(durs.reduce((s, n) => s + n, 0) / durs.length) : 0,
    };
  }, [dec.rows, exe.rows, ms]);

  const pending = appr.rows.filter((a) => String(a.status).toLowerCase() === "pending");
  const openInc = inc.rows.filter((i) => !CLOSED.includes(String(i.status).toLowerCase()));
  const blockRate = m.total ? Math.round((m.block / m.total) * 100) : 0;

  const steps = [
    { done: pol.rows.length > 0, label: "Add a policy", to: "/app/setup" },
    { done: hooks.rows.length > 0, label: "Connect a webhook", to: "/app/webhooks" },
    { done: m.total > 0, label: "Send your first test action", to: "/app/connect" },
    { done: appr.rows.length > 0, label: "Review an approval", to: "/app/approvals" },
  ];

  return (
    <>
      <PageHead
        title="Overview"
        subtitle="Live governance state of your workspace."
        actions={<Seg value={range} onChange={setRange} options={RANGES.map((r) => ({ key: r.key, label: r.key }))} />}
      />
      <ErrorNote errors={[["decisions", dec.error], ["approvals", appr.error], ["incidents", inc.error], ["policies", pol.error], ["webhooks", hooks.error], ["executions", exe.error]]} />

      {!steps.every((s) => s.done) && (
        <div className="panel">
          <b>Get started</b> <Link className="link" to="/app/setup">Open the setup guide</Link>
          <ul className="steps">
            {steps.map((s) => (
              <li key={s.label} className={s.done ? "done" : ""}>
                <span className="tick">{s.done && <Check size={11} />}</span>
                <Link to={s.to}>{s.label}</Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="kpis">
        <Stat label="Agents seen" value={m.agents} hint={`in the last ${range}`} />
        <Stat label="Decisions" value={m.total} hint={`${m.allow} allowed`} />
        <Stat label="Block rate" value={`${blockRate}%`} tone={blockRate > 25 ? "bad" : undefined} hint={`${m.block} blocked`} />
        <Stat label="Average risk" value={m.avg} hint="score out of 100" tone={m.avg >= 60 ? "warn" : undefined} />
        <Stat label="Pending approvals" value={pending.length} tone={pending.length ? "warn" : undefined} hint="waiting for a reviewer" />
        <Stat label="Open incidents" value={openInc.length} tone={openInc.length ? "bad" : undefined} hint="not yet resolved" />
      </div>

      <div className="grid-2">
        <div className="panel">
          <div className="panel-head"><b>Decisions over time</b>
            <span className="legend"><i className="dot ok" />Allow <i className="dot warn" />Escalate <i className="dot bad" />Block</span>
          </div>
          <StackedBars data={m.buckets} />
        </div>
        <div className="panel">
          <div className="panel-head"><b>Pending approvals</b><Link className="link" to="/app/approvals">View all</Link></div>
          {pending.length === 0 ? <Empty title="Nothing waiting" hint="Escalated actions that need a human appear here." /> : pending.slice(0, 5).map((a) => (
            <Link to="/app/approvals" className="line-item" key={a.id}>
              <span className="mono">{a.agent_name ?? shortId(a.agent_id, 12)}</span>
              <span className="mute grow">{a.action}</span>
            </Link>
          ))}
          <div className="sep" />
          <div className="panel-head"><b>Executions</b></div>
          <div className="big-sm">{m.executions.toLocaleString()} <span className="mute small-text">in {range}{m.avgMs ? `, ${m.avgMs} ms average` : ""}</span></div>
        </div>
      </div>

      <div className="panel">
        <div className="panel-head"><b>Recent decisions</b><Link className="link" to="/app/decisions">View all</Link></div>
        {dec.rows.length === 0 ? <Empty title="No decisions yet" hint="Decisions appear here the moment an agent calls the control API." /> : dec.rows.slice(0, 8).map((d) => (
          <div className="line-item" key={d.id}>
            <Badge value={d.decision} />
            <span className="mono">{d.agent_name ?? shortId(d.agent_id, 14)}</span>
            <span className="mute grow">{d.action ?? "-"}{d.reason ? ` · ${d.reason}` : ""}</span>
            <RiskBar score={d.risk_score} />
            <span className="mute small-text w80">{ago(d.created_at)}</span>
          </div>
        ))}
      </div>
    </>
  );
}