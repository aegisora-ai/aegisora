import { useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { fmtTime, shortId, useRows, type Row } from "../lib/db";
import { useWorkspace } from "../lib/workspace";
import { Badge, Btn, DataTable, Drawer, ErrorNote, Json, KV, Notice, PageHead, Select } from "../ui/kit";

const uniq = (rows: Row[], key: string) => [...new Set(rows.map((r) => String(r[key] ?? "")).filter(Boolean))].sort();
const opts = (vals: string[]) => [{ key: "all", label: "All" }, ...vals.map((v) => ({ key: v, label: v.toLowerCase() }))];

export default function Incidents() {
  const { canAdmin } = useWorkspace();
  const [sev, setSev] = useState("all");
  const [status, setStatus] = useState("all");
  const inc = useRows("incidents", { order: "created_at", limit: 1000 });
  const [open, setOpen] = useState<Row | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const rows = useMemo(
    () => inc.rows.filter((r) => (sev === "all" || r.severity === sev) && (status === "all" || r.status === status)),
    [inc.rows, sev, status],
  );

  async function resolve() {
    if (!open) return;
    setBusy(true); setErr(null);
    const cur = String(open.status ?? "");
    const value = cur && cur === cur.toUpperCase() ? "RESOLVED" : "resolved";
    const { error } = await supabase.from("incidents").update({ status: value, resolved_at: new Date().toISOString() }).eq("id", open.id);
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setOpen(null); inc.reload();
  }

  const isOpen = !["resolved", "closed"].includes(String(open?.status ?? "").toLowerCase());

  return (
    <>
      <PageHead title="Incidents" subtitle="Operational problems raised by rules and runtime checks." />
      <ErrorNote errors={[["incidents", inc.error]]} />
      <DataTable
        exportName="incidents"
        loading={inc.loading}
        rows={rows}
        onRow={(r) => { setOpen(r); setErr(null); }}
        onReload={inc.reload}
        toolbar={<>
          <Select label="Severity" value={sev} onChange={setSev} options={opts(uniq(inc.rows, "severity"))} />
          <Select label="Status" value={status} onChange={setStatus} options={opts(uniq(inc.rows, "status"))} />
        </>}
        empty={<div className="empty"><b>No incidents</b><p className="mute">That is good news. Incidents raised by your rules show up here.</p></div>}
        cols={[
          { key: "created_at", label: "Opened", width: "170px", render: (r) => <span className="mono small-text">{fmtTime(r.created_at)}</span> },
          { key: "severity", label: "Severity", render: (r) => <Badge value={r.severity} /> },
          { key: "status", label: "Status", render: (r) => <Badge value={r.status} /> },
          { key: "title", label: "Title", render: (r) => <b>{r.title}</b> },
          { key: "decision_id", label: "Decision", render: (r) => <span className="mono mute">{shortId(r.decision_id, 10)}</span> },
        ]}
      />
      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.title ?? ""} subtitle={open ? shortId(open.id, 12) : ""}>
        {open && (
          <>
            <KV items={[["Severity", <Badge value={open.severity} />], ["Status", <Badge value={open.status} />], ["Decision", <span className="mono">{open.decision_id ?? "-"}</span>], ["Opened", fmtTime(open.created_at)], ["Resolved", fmtTime(open.resolved_at)]]} />
            {isOpen && canAdmin && (
              <div className="decide">
                {err && <div className="err">{err}</div>}
                <div className="row-btns"><Btn kind="primary" disabled={busy} onClick={resolve}>{busy ? "Saving..." : "Mark resolved"}</Btn></div>
              </div>
            )}
            {isOpen && !canAdmin && <Notice tone="warn">Only owners and admins can resolve incidents.</Notice>}
            <Json label="record" value={open} />
          </>
        )}
      </Drawer>
    </>
  );
}