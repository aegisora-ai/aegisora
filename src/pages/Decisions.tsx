import { useState } from "react";
import { fmtTime, RANGES, rangeMs, shortId, useRows, type Row } from "../lib/db";
import { Badge, DataTable, Drawer, ErrorNote, Json, KV, PageHead, RiskBar, Seg, Select } from "../ui/kit";

export default function Decisions() {
  const [range, setRange] = useState<string>("24h");
  const [decision, setDecision] = useState("all");
  const [open, setOpen] = useState<Row | null>(null);
  const dec = useRows("decisions", { order: "created_at", limit: 1000, since: { col: "created_at", ms: rangeMs(range) }, eq: { decision } });

  return (
    <>
      <PageHead title="Decisions" subtitle="Every allow, escalate and block, with the reason behind it." actions={<Seg value={range} onChange={setRange} options={RANGES.map((r) => ({ key: r.key, label: r.key }))} />} />
      <ErrorNote errors={[["decisions", dec.error]]} />
      <DataTable
        exportName="decisions"
        loading={dec.loading}
        rows={dec.rows}
        onRow={setOpen}
        onReload={dec.reload}
        toolbar={<Select label="Decision" value={decision} onChange={setDecision} options={[{ key: "all", label: "All" }, { key: "ALLOW", label: "Allow" }, { key: "ESCALATE", label: "Escalate" }, { key: "BLOCK", label: "Block" }]} />}
        cols={[
          { key: "created_at", label: "Time", width: "170px", render: (r) => <span className="mono small-text">{fmtTime(r.created_at)}</span> },
          { key: "decision", label: "Decision", render: (r) => <Badge value={r.decision} /> },
          { key: "agent_name", label: "Agent", render: (r) => <span className="mono">{r.agent_name ?? shortId(r.agent_id, 12)}</span> },
          { key: "action", label: "Action" },
          { key: "resource", label: "Resource", render: (r) => <span className="mono mute">{r.resource ?? "-"}</span> },
          { key: "reason", label: "Reason" },
          { key: "risk_score", label: "Score", render: (r) => <RiskBar score={r.risk_score} /> },
        ]}
      />
      <Drawer open={!!open} onClose={() => setOpen(null)} title={open ? `${open.decision} · ${open.agent_name ?? shortId(open.agent_id, 12)}` : ""} subtitle={open ? fmtTime(open.created_at) : ""} width={620}>
        {open && (
          <>
            <KV items={[["Decision", <Badge value={open.decision} />], ["Action", open.action], ["Resource", open.resource], ["Reason", open.reason], ["Risk", <RiskBar score={open.risk_score} />], ["Trace", <span className="mono">{open.trace_id ?? "-"}</span>], ["Policy", <span className="mono">{open.policy_id ?? "-"}</span>], ["Execution", <span className="mono">{open.execution_id ?? "-"}</span>]]} />
            <Json label="input" value={open.input} />
          </>
        )}
      </Drawer>
    </>
  );
}