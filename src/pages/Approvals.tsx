import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Check, X } from "lucide-react";
import { apiCall, apiError } from "../lib/api";
import { ago, fmtTime, shortId, useRows, type Row } from "../lib/db";
import { useWorkspace } from "../lib/workspace";
import { Badge, Btn, DataTable, Drawer, ErrorNote, Field, Json, KV, Notice, PageHead, Seg } from "../ui/kit";

const TABS = ["pending", "approved", "rejected", "expired", "all"] as const;

export default function Approvals() {
  const { canAdmin } = useWorkspace();
  const [tab, setTab] = useState<string>("pending");
  const [open, setOpen] = useState<Row | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const appr = useRows("approvals", { order: "created_at", limit: 1000 });

  const [sp, setSp] = useSearchParams();
  const tries = useRef(0);
  useEffect(() => {
    const id = sp.get("open");
    if (!id || appr.loading) return;
    const hit = appr.rows.find((r) => String(r.id) === id);
    if (hit) {
      setTab("all"); setOpen(hit); setErr(null); setNote("");
      tries.current = 0; setSp({}, { replace: true });
    } else if (tries.current < 3) {
      tries.current += 1; appr.reload();
    } else {
      tries.current = 0; setSp({}, { replace: true });
    }
  }, [sp, appr.loading, appr.rows]);

  const rows = useMemo(
    () => appr.rows.filter((r) => tab === "all" || String(r.status ?? "").toLowerCase() === tab),
    [appr.rows, tab],
  );

  async function resolve(kind: "approved" | "rejected") {
    if (!open) return;
    if (!note.trim()) { setErr("A reason is required. It is stored in the audit trail and evidence."); return; }
    setBusy(true); setErr(null);
    const res = await apiCall({
      method: "PATCH",
      path: "/api/v1/workspace/approvals/" + String(open.id),
      body: { status: kind, note: note.trim() },
    });
    setBusy(false);
    if (!res.ok) {
      const e = apiError(res);
      setErr(e.code === "mfa_required" ? "Two-step verification is required. Open Security and verify this session." : e.message);
      return;
    }
    setOpen(null); setNote(""); appr.reload();
  }

  const isPending = String(open?.status ?? "").toLowerCase() === "pending";

  return (
    <>
      <PageHead title="Approvals" subtitle="Actions that stopped and are waiting for a person to decide." actions={<Seg value={tab} onChange={setTab} options={TABS.map((t) => ({ key: t, label: t }))} />} />
      <ErrorNote errors={[["approvals", appr.error]]} />
      <DataTable
        exportName={`approvals-${tab}`}
        loading={appr.loading}
        rows={rows}
        onRow={(r) => { setOpen(r); setErr(null); setNote(""); }}
        onReload={appr.reload}
        empty={<div className="empty"><b>{tab === "pending" ? "No approvals waiting" : "Nothing in this state"}</b><p className="mute">Escalated agent actions appear here for review.</p></div>}
        cols={[
          { key: "requested_at", label: "Requested", render: (r) => <span className="mute">{ago(r.requested_at ?? r.created_at)}</span>, width: "110px" },
          { key: "status", label: "Status", render: (r) => <Badge value={r.status} /> },
          { key: "agent_name", label: "Agent", render: (r) => <span className="mono">{r.agent_name ?? shortId(r.agent_id, 12)}</span> },
          { key: "action", label: "Action" },
          { key: "resource", label: "Resource", render: (r) => <span className="mono mute">{r.resource ?? "-"}</span> },
          { key: "expires_at", label: "Expires", render: (r) => <span className="mute small-text">{fmtTime(r.expires_at)}</span> },
        ]}
      />
      <Drawer open={!!open} onClose={() => setOpen(null)} title={open ? open.action ?? "Approval" : ""} subtitle={open ? open.agent_name ?? shortId(open.agent_id, 12) : ""} width={600}>
        {open && (
          <>
            <KV items={[["Status", <Badge value={open.status} />], ["Resource", <span className="mono">{open.resource ?? "-"}</span>], ["Requested", fmtTime(open.requested_at ?? open.created_at)], ["Expires", fmtTime(open.expires_at)], ["Resolved", fmtTime(open.resolved_at)], ["Decision id", <span className="mono">{open.decision_id ?? "-"}</span>], ["Note", open.note]]} />
            {isPending && (
              canAdmin ? (
                <div className="decide">
                  <Field label="Reason (required)"><textarea className="inp" rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why are you approving or rejecting this?" /></Field>
                  {err && <div className="err">{err}</div>}
                  <div className="row-btns">
                    <Btn kind="primary" disabled={busy} onClick={() => void resolve("approved")}><Check size={13} /> Approve</Btn>
                    <Btn kind="danger" disabled={busy} onClick={() => void resolve("rejected")}><X size={13} /> Reject</Btn>
                  </div>
                </div>
              ) : <Notice tone="warn">Only owners and admins can approve or reject.</Notice>
            )}
            <Json label="record" value={open} />
          </>
        )}
      </Drawer>
    </>
  );
}