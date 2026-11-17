import { useState } from "react";
import { fmtTime, useRows, type Row } from "../lib/db";
import { Badge, DataTable, Drawer, ErrorNote, Json, KV, Notice, PageHead } from "../ui/kit";

export default function Webhooks() {
  const hooks = useRows("webhooks", { select: "id,url,events,enabled,last_status,last_delivery_at,created_at", order: "created_at", limit: 200 });
  const [open, setOpen] = useState<Row | null>(null);
  return (
    <>
      <PageHead title="Webhooks" subtitle="Send governance events to your own systems." />
      <ErrorNote errors={[["webhooks", hooks.error]]} />
      <Notice>Endpoints are created through the Aegisora backend so that signing secrets never pass through the browser. This view is read-only and never shows the secret.</Notice>
      <DataTable
        exportName="webhooks"
        loading={hooks.loading}
        rows={hooks.rows}
        onRow={setOpen}
        onReload={hooks.reload}
        empty={<div className="empty"><b>No webhook endpoints</b><p className="mute">Once an endpoint exists, it appears here with its delivery health.</p></div>}
        cols={[
          { key: "url", label: "URL", render: (r) => <span className="mono">{r.url}</span> },
          { key: "enabled", label: "Status", render: (r) => <Badge value={r.enabled ? "active" : "disabled"} /> },
          { key: "events", label: "Events", render: (r) => (Array.isArray(r.events) ? r.events.length : 0) + " types" },
          { key: "last_status", label: "Last response", render: (r) => r.last_status ?? "-" },
          { key: "last_delivery_at", label: "Last delivery", render: (r) => <span className="mute">{fmtTime(r.last_delivery_at)}</span> },
        ]}
      />
      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.url ?? ""} subtitle="Webhook endpoint">
        {open && (
          <>
            <KV items={[["Status", <Badge value={open.enabled ? "active" : "disabled"} />], ["Last response", open.last_status], ["Last delivery", fmtTime(open.last_delivery_at)], ["Created", fmtTime(open.created_at)]]} />
            <Json label="events" value={open.events} />
          </>
        )}
      </Drawer>
    </>
  );
}