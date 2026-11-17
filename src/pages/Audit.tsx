import { useMemo, useState } from "react";
import { fmtTime, RANGES, rangeMs, useRows, type Row } from "../lib/db";
import { Badge, DataTable, Drawer, ErrorNote, Json, KV, Notice, PageHead, Seg, Select } from "../ui/kit";

export default function Audit() {
  const [range, setRange] = useState<string>("7d");
  const [type, setType] = useState("all");
  const au = useRows("audit_events", { order: "created_at", limit: 1000, since: { col: "created_at", ms: rangeMs(range) } });
  const [open, setOpen] = useState<Row | null>(null);

  const types = useMemo(() => [...new Set(au.rows.map((r) => String(r.event_type ?? "")).filter(Boolean))].sort(), [au.rows]);
  const rows = useMemo(() => au.rows.filter((r) => type === "all" || r.event_type === type), [au.rows, type]);

  return (
    <>
      <PageHead title="Audit" subtitle="The permanent record of governance events." actions={<Seg value={range} onChange={setRange} options={RANGES.map((r) => ({ key: r.key, label: r.key }))} />} />
      <ErrorNote errors={[["audit_events", au.error]]} />
      <DataTable
        exportName="audit"
        loading={au.loading}
        rows={rows}
        onRow={setOpen}
        onReload={au.reload}
        toolbar={<Select label="Event" value={type} onChange={setType} options={[{ key: "all", label: "All" }, ...types.map((k) => ({ key: k, label: k }))]} />}
        cols={[
          { key: "created_at", label: "Time", width: "170px", render: (r) => <span className="mono small-text">{fmtTime(r.created_at)}</span> },
          { key: "event_type", label: "Event", render: (r) => <Badge value={r.event_type} tone="info" /> },
          { key: "actor", label: "Actor", render: (r) => <span className="mono mute">{r.actor ?? r.actor_user_id ?? "-"}</span> },
          { key: "action", label: "Action", render: (r) => r.action ?? "-" },
          { key: "summary", label: "Summary", render: (r) => <span className="mute">{r.summary ?? "-"}</span> },
        ]}
      />
      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.summary ?? open?.event_type ?? ""} subtitle={open ? fmtTime(open.created_at) : ""} width={620}>
        {open && (
          <>
            <KV items={[["Event", open.event_type], ["Action", open.action], ["Actor", open.actor], ["Actor user", <span className="mono">{open.actor_user_id ?? "-"}</span>], ["Resource", `${open.resource_type ?? open.target_type ?? "-"}: ${open.resource_id ?? open.target_id ?? "-"}`], ["Summary", open.summary]]} />
            <Notice>The audit log is append-only.</Notice>
            <Json label="metadata" value={open.metadata ?? open.meta} />
          </>
        )}
      </Drawer>
    </>
  );
}