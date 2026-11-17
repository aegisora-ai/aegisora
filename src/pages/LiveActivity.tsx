import { useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play } from "lucide-react";
import { fmtTime, shortId, useRows, type Row } from "../lib/db";
import { Badge, Btn, DataTable, Drawer, ErrorNote, Json, KV, PageHead, RiskBar, Select } from "../ui/kit";

const POLL_MS = 5000;

export default function LiveActivity() {
  const feed = useRows("decisions", { order: "created_at", limit: 200 });
  const [paused, setPaused] = useState(false);
  const [decision, setDecision] = useState("all");
  const [open, setOpen] = useState<Row | null>(null);
  const reloadRef = useRef(feed.reload);
  reloadRef.current = feed.reload;

  useEffect(() => {
    if (paused) return;
    const t = setInterval(() => reloadRef.current(), POLL_MS);
    return () => clearInterval(t);
  }, [paused]);

  const rows = useMemo(
    () => feed.rows.filter((r) => decision === "all" || String(r.decision).toUpperCase() === decision),
    [feed.rows, decision],
  );

  return (
    <>
      <PageHead
        title="Live Activity"
        subtitle="Every decision, refreshed every few seconds."
        actions={
          <>
            <span className={`conn ${paused ? "" : "on"}`}><i />{paused ? "paused" : "live"}</span>
            <Btn onClick={() => setPaused((p) => !p)}>{paused ? <><Play size={13} /> Resume</> : <><Pause size={13} /> Pause</>}</Btn>
          </>
        }
      />
      <ErrorNote errors={[["decisions", feed.error]]} />
      <DataTable
        exportName="live-activity"
        loading={feed.loading}
        rows={rows}
        onRow={setOpen}
        onReload={feed.reload}
        toolbar={<Select label="Decision" value={decision} onChange={setDecision} options={[{ key: "all", label: "All" }, { key: "ALLOW", label: "Allow" }, { key: "ESCALATE", label: "Escalate" }, { key: "BLOCK", label: "Block" }]} />}
        cols={[
          { key: "created_at", label: "Time", render: (r) => <span className="mono small-text">{fmtTime(r.created_at)}</span>, width: "170px" },
          { key: "agent_name", label: "Agent", render: (r) => <span className="mono">{r.agent_name ?? shortId(r.agent_id, 12)}</span> },
          { key: "action", label: "Action" },
          { key: "resource", label: "Resource", render: (r) => <span className="mono mute">{r.resource ?? "-"}</span> },
          { key: "decision", label: "Decision", render: (r) => <Badge value={r.decision} /> },
          { key: "risk_score", label: "Risk", render: (r) => (r.risk_score == null ? "-" : <RiskBar score={r.risk_score} />) },
        ]}
      />
      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.action ?? ""} subtitle={open ? fmtTime(open.created_at) : ""}>
        {open && (
          <>
            <KV items={[["Decision", <Badge value={open.decision} />], ["Agent", open.agent_name ?? open.agent_id], ["Resource", open.resource], ["Reason", open.reason], ["Trace", <span className="mono">{open.trace_id}</span>], ["Execution", <span className="mono">{open.execution_id}</span>]]} />
            <Json label="input" value={open.input} />
          </>
        )}
      </Drawer>
    </>
  );
}