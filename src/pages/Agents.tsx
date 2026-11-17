import { useMemo, useState } from "react";
import { ago, fmtTime, RANGES, rangeMs, shortId, useRows, type Row } from "../lib/db";
import { Badge, DataTable, Drawer, ErrorNote, Json, KV, PageHead, RiskBar, Seg } from "../ui/kit";

const up = (v: unknown) => String(v ?? "").toUpperCase();

export default function Agents() {
  const [range, setRange] = useState<string>("7d");
  const [open, setOpen] = useState<Row | null>(null);
  const reg = useRows("agents", { order: "last_seen_at", limit: 500 });
  const dec = useRows("decisions", { select: "id,agent_id,agent_name,decision,risk_score,reason,action,created_at", order: "created_at", limit: 5000, since: { col: "created_at", ms: rangeMs(range) } });

  const agents = useMemo((): Row[] => {
    const stats = new Map<string, { total: number; allow: number; escalate: number; block: number }>();
    for (const r of dec.rows) {
      const s = stats.get(r.agent_id) ?? { total: 0, allow: 0, escalate: 0, block: 0 };
      s.total++;
      const d = up(r.decision);
      if (d === "ALLOW") s.allow++; else if (d === "ESCALATE") s.escalate++; else if (d === "BLOCK") s.block++;
      stats.set(r.agent_id, s);
    }
    return reg.rows.map((a): Row => ({ ...a, ...(stats.get(a.id) ?? { total: 0, allow: 0, escalate: 0, block: 0 }) }));
  }, [reg.rows, dec.rows]);

  const recent = dec.rows.filter((r) => r.agent_id === open?.id).slice(0, 15);

  return (
    <>
      <PageHead title="Agents" subtitle="Every agent registered in this workspace." actions={<Seg value={range} onChange={setRange} options={RANGES.map((r) => ({ key: r.key, label: r.key }))} />} />
      <ErrorNote errors={[["agents", reg.error], ["decisions", dec.error]]} />
      <DataTable
        exportName="agents"
        loading={reg.loading}
        rows={agents}
        onReload={() => { reg.reload(); dec.reload(); }}
        onRow={setOpen}
        cols={[
          { key: "name", label: "Agent", render: (r) => <b>{r.name ?? shortId(r.id, 12)}</b> },
          { key: "state", label: "State", render: (r) => <Badge value={r.state} /> },
          { key: "model", label: "Model", render: (r) => <span className="mute">{[r.provider, r.model].filter(Boolean).join(" / ") || "-"}</span> },
          { key: "total", label: "Decisions", align: "right" },
          { key: "escalate", label: "Escalated", align: "right", render: (r) => <span className="warn">{r.escalate}</span> },
          { key: "block", label: "Blocked", align: "right", render: (r) => <span className="bad">{r.block}</span> },
          { key: "risk_score", label: "Risk", render: (r) => <RiskBar score={r.risk_score} /> },
          { key: "last_seen_at", label: "Last seen", render: (r) => <span className="mute">{ago(r.last_seen_at)}</span> },
        ]}
      />
      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ""} subtitle="Agent details" width={620}>
        {open && (
          <>
            <KV items={[["State", <Badge value={open.state} />], ["Provider", open.provider], ["Model", open.model], ["Framework", open.framework], ["Source", open.source], ["External id", <span className="mono">{open.external_id ?? "-"}</span>], ["Risk score", <RiskBar score={open.risk_score} />], ["Decisions in range", open.total], ["Blocked", open.block], ["Last seen", fmtTime(open.last_seen_at)], ["Description", open.description]]} />
            <h4 className="sub">Recent decisions</h4>
            {recent.length === 0 && <p className="mute">No decisions in this range.</p>}
            {recent.map((r) => (
              <div className="line-item" key={r.id}>
                <Badge value={r.decision} /><span className="mute grow">{r.action ?? "-"}{r.reason ? ` · ${r.reason}` : ""}</span><RiskBar score={r.risk_score} /><span className="mute small-text w80">{ago(r.created_at)}</span>
              </div>
            ))}
            <Json label="metadata" value={open.metadata} />
          </>
        )}
      </Drawer>
    </>
  );
}