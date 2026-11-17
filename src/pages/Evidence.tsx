import { useState } from "react";
import { fmtTime, RANGES, rangeMs, shortId, useRows, type Row } from "../lib/db";
import { Badge, DataTable, Drawer, ErrorNote, Json, KV, Notice, PageHead, Seg, Select } from "../ui/kit";

export default function Evidence() {
  const [range, setRange] = useState<string>("7d");
  const [dec, setDec] = useState("all");
  const ev = useRows("evidence", { order: "created_at", limit: 1000, since: { col: "created_at", ms: rangeMs(range) }, eq: { decision: dec } });
  const [open, setOpen] = useState<Row | null>(null);
  return (
    <>
      <PageHead title="Evidence" subtitle="Append-only proof of what each agent tried to do and what was decided." actions={<Seg value={range} onChange={setRange} options={RANGES.map((r) => ({ key: r.key, label: r.key }))} />} />
      <ErrorNote errors={[["evidence", ev.error]]} />
      <DataTable
        exportName="evidence"
        loading={ev.loading}
        rows={ev.rows}
        onRow={setOpen}
        onReload={ev.reload}
        toolbar={<Select label="Decision" value={dec} onChange={setDec} options={[{ key: "all", label: "All" }, { key: "ALLOW", label: "Allow" }, { key: "ESCALATE", label: "Escalate" }, { key: "BLOCK", label: "Block" }]} />}
        cols={[
          { key: "created_at", label: "Recorded", width: "170px", render: (r) => <span className="mono small-text">{fmtTime(r.created_at)}</span> },
          { key: "seq", label: "Seq", align: "right" },
          { key: "decision", label: "Decision", render: (r) => <Badge value={r.decision} /> },
          { key: "agent_id", label: "Agent", render: (r) => <span className="mono">{shortId(r.agent_id, 12)}</span> },
          { key: "action", label: "Action" },
          { key: "hash", label: "Hash", render: (r) => <span className="mono mute">{shortId(r.hash, 12)}</span> },
        ]}
      />
      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.action ?? ""} subtitle={open ? `#${open.seq ?? "-"}` : ""} width={620}>
        {open && (
          <>
            <KV items={[["Decision", <Badge value={open.decision} />], ["Agent", <span className="mono">{open.agent_id}</span>], ["Trace", <span className="mono">{open.trace_id ?? "-"}</span>], ["Execution", <span className="mono">{open.execution_id ?? "-"}</span>], ["Hash", <span className="mono">{open.hash ?? "-"}</span>], ["Previous hash", <span className="mono">{open.prev_hash ?? "-"}</span>], ["Hash version", open.hash_version]]} />
            <Notice>Evidence is chained by hash and cannot be edited or deleted by any client role.</Notice>
            <Json label="payload" value={open.payload} />
          </>
        )}
      </Drawer>
    </>
  );
}