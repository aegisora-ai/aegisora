import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ago, fmtTime, shortId, useRows, type Row } from "../lib/db";
import { useWorkspace } from "../lib/workspace";
import { Badge, DataTable, Drawer, ErrorNote, Json, Notice, PageHead } from "../ui/kit";

type Step = { at: string; source: string; title: string; decision?: string };

const SOURCES: { table: string; title: (r: Row) => string; decision?: (r: Row) => string }[] = [
  { table: "decisions", title: (r) => `decision: ${r.action ?? "-"}`, decision: (r) => r.decision },
  { table: "executions", title: (r) => `execution ${r.state ?? ""}: ${r.action ?? "-"}`, decision: (r) => r.decision },
  { table: "evidence", title: (r) => `evidence #${r.seq ?? "-"}: ${r.action ?? "-"}`, decision: (r) => r.decision },
];

export default function Traces() {
  const { current } = useWorkspace();
  const tr = useRows("traces", { order: "created_at", limit: 500 });
  const [open, setOpen] = useState<Row | null>(null);
  const [steps, setSteps] = useState<Step[]>([]);
  const [loading, setLoading] = useState(false);
  const [manual, setManual] = useState("");

  const traceId: string | null = open ? String(open.trace_id ?? "") : null;

  useEffect(() => {
    if (!traceId || !current) return;
    let on = true;
    setLoading(true);
    Promise.all(SOURCES.map(async (s) => {
      const { data } = await supabase.from(s.table).select("*").eq("workspace_id", current.workspaceId).eq("trace_id", traceId).limit(200);
      return ((data ?? []) as Row[]).map((r): Step => ({ at: String(r.created_at), source: s.table, title: s.title(r), decision: s.decision?.(r) }));
    })).then((all) => {
      if (!on) return;
      setSteps(all.flat().sort((a, b) => (a.at > b.at ? 1 : -1)));
      setLoading(false);
    });
    return () => { on = false; };
  }, [traceId, current]);

  return (
    <>
      <PageHead title="Traces" subtitle="Follow one agent request from the first event to the final evidence." />
      <ErrorNote errors={[["traces", tr.error]]} />
      <div className="toolbar-row">
        <input className="inp" style={{ maxWidth: 360 }} placeholder="Open a trace by id..." value={manual} onChange={(e) => setManual(e.target.value)} onKeyDown={(e) => e.key === "Enter" && manual.trim() && setOpen({ trace_id: manual.trim() })} />
      </div>
      <DataTable
        exportName="traces"
        loading={tr.loading}
        rows={tr.rows}
        onReload={tr.reload}
        onRow={setOpen}
        cols={[
          { key: "created_at", label: "Started", render: (r) => <span className="mute">{ago(r.created_at)}</span>, width: "110px" },
          { key: "trace_id", label: "Trace", render: (r) => <span className="mono">{shortId(r.trace_id, 14)}</span> },
          { key: "name", label: "Name", render: (r) => r.name ?? "-" },
          { key: "agent_name", label: "Agent", render: (r) => <span className="mono">{r.agent_name ?? shortId(r.agent_id, 12)}</span> },
          { key: "status", label: "Status", render: (r) => <Badge value={r.status} /> },
          { key: "duration_ms", label: "Duration", align: "right", render: (r) => (r.duration_ms == null ? "-" : `${r.duration_ms} ms`) },
        ]}
      />
      <Drawer open={!!open} onClose={() => setOpen(null)} title="Trace timeline" subtitle={traceId ?? ""} width={640}>
        {loading && <p className="mute">Loading records for this trace...</p>}
        {!loading && !steps.length && <Notice>No decisions, executions or evidence were found for this trace id in this workspace.</Notice>}
        <ol className="timeline">
          {steps.map((s, i) => (
            <li key={i}>
              <i className={`tl-dot ${String(s.decision).toUpperCase() === "BLOCK" ? "bad" : String(s.decision).toUpperCase() === "ESCALATE" ? "warn" : "ok"}`} />
              <div>
                <b>{s.title}</b> {s.decision && <Badge value={s.decision} />}
                <div className="mute small-text">{s.source} · {fmtTime(s.at)}</div>
              </div>
            </li>
          ))}
        </ol>
        {open?.spans != null && <Json label="spans" value={open.spans} />}
      </Drawer>
    </>
  );
}