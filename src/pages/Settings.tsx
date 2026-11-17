import { useCallback, useEffect, useState } from "react";
import { apiCall, apiError, type ApiRes } from "../lib/api";
import { fmtTime, shortId, useRows } from "../lib/db";
import { useSession } from "../lib/useSession";
import { useWorkspace } from "../lib/workspace";
import { Badge, Btn, DataTable, Field, KV, Modal, Notice, PageHead, Stat } from "../ui/kit";

type Member = { user_id: string; email: string | null; name: string | null; role: string; status: string; created_at: string };
type Usage = { total: number; allow: number; block: number; escalate: number; start: string };

function problem(res: ApiRes): string {
  const e = apiError(res);
  return e.code === "mfa_required" ? "Two-step verification is required. Open Security and verify this session." : e.message;
}

export default function Settings() {
  const { session } = useSession();
  const { current, memberships, select, canAdmin, userId } = useWorkspace();
  const ent = useRows("workspace_entitlements", { limit: 1 });
  const [members, setMembers] = useState<Member[]>([]);
  const [loadingM, setLoadingM] = useState(true);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("OPERATOR");
  const [busy, setBusy] = useState(false);
  const wsId = current?.workspaceId;
  const isOwner = String(current?.role ?? "").toUpperCase() === "OWNER";

  const load = useCallback(async () => {
    if (!wsId) return;
    setLoadingM(true);
    const m = await apiCall({ method: "GET", path: "/api/v1/workspace/members", workspaceId: wsId });
    setLoadingM(false);
    if (m.ok) setMembers(((m.data as { members?: Member[] })?.members ?? []));
    else setErr(problem(m));
    const u = await apiCall({ method: "GET", path: "/api/v1/workspace/usage", workspaceId: wsId });
    if (u.ok) {
      const d = u.data as { evaluations?: { total: number; allow: number; block: number; escalate: number }; window?: { start: string } };
      if (d.evaluations) setUsage({ ...d.evaluations, start: d.window?.start ?? "" });
    }
  }, [wsId]);

  useEffect(() => { void load(); }, [load]);

  async function memberCall(method: string, body: unknown): Promise<boolean> {
    if (!wsId) return false;
    setErr(null);
    const res = await apiCall({ method, path: "/api/v1/workspace/members", workspaceId: wsId, body });
    if (!res.ok) { setErr(problem(res)); return false; }
    return true;
  }

  async function invite() {
    setBusy(true);
    const done = await memberCall("POST", { email: email.trim().toLowerCase(), role });
    setBusy(false);
    if (done) { setInviting(false); setEmail(""); void load(); }
  }

  const plan = ent.rows[0];
  const roleOptions = isOwner ? ["ADMIN", "OPERATOR", "VIEWER"] : ["OPERATOR", "VIEWER"];

  return (
    <>
      <PageHead title="Settings" subtitle="Workspace, plan, usage and team." actions={canAdmin ? <Btn kind="primary" onClick={() => { setErr(null); setInviting(true); }}>Invite member</Btn> : undefined} />
      <div className="panel">
        <b>Workspace</b>
        <KV items={[["Name", current?.name], ["Slug", <span className="mono">{current?.slug}</span>], ["Your role", <Badge value={current?.role} tone="info" />], ["Plan", plan ? <span><Badge value={plan.plan_key} tone="info" /> <Badge value={plan.status} /></span> : "No plan yet"], ["Workspace id", <span className="mono">{current?.workspaceId}</span>], ["Signed in as", session?.user.email]]} />
        {memberships.length > 1 && (
          <label className="sel" style={{ marginTop: 12 }}><span className="mute">Switch workspace</span>
            <select value={current?.workspaceId} onChange={(e) => select(e.target.value)}>
              {memberships.map((m) => <option key={m.workspaceId} value={m.workspaceId}>{m.name}</option>)}
            </select>
          </label>
        )}
      </div>

      <h3 className="sec">Usage this month</h3>
      <div className="kpis">
        <Stat label="Decisions" value={usage ? usage.total.toLocaleString() : "-"} hint={usage?.start ? "since " + fmtTime(usage.start) : undefined} />
        <Stat label="Allowed" value={usage ? usage.allow.toLocaleString() : "-"} tone="ok" />
        <Stat label="Escalated" value={usage ? usage.escalate.toLocaleString() : "-"} tone="warn" />
        <Stat label="Blocked" value={usage ? usage.block.toLocaleString() : "-"} tone="bad" />
      </div>

      <h3 className="sec">Team</h3>
      {err && <Notice tone="bad">{err}</Notice>}
      <DataTable
        exportName="members"
        loading={loadingM}
        onReload={() => void load()}
        rows={members.map((m) => ({ ...m, id: m.user_id }))}
        empty={<div className="empty"><b>No members loaded</b><p className="mute">Members appear here once the connection to Aegisora works.</p></div>}
        cols={[
          { key: "email", label: "Member", render: (r) => <span><b>{r.email ?? r.name ?? shortId(r.user_id, 10)}</b>{r.user_id === userId ? <span className="mute"> (you)</span> : null}</span> },
          {
            key: "role", label: "Role",
            render: (r) => {
              const rowOwner = String(r.role).toUpperCase() === "OWNER";
              const rowAdmin = String(r.role).toUpperCase() === "ADMIN";
              const editable = canAdmin && r.user_id !== userId && !rowOwner && (isOwner || !rowAdmin);
              if (!editable) return <Badge value={r.role} tone="info" />;
              return (
                <select className="inp" value={String(r.role).toUpperCase()} onChange={(e) => void memberCall("PATCH", { user_id: r.user_id, role: e.target.value }).then((d) => { if (d) void load(); })}>
                  {roleOptions.map((o) => <option key={o}>{o}</option>)}
                </select>
              );
            },
          },
          { key: "status", label: "Status", render: (r) => <Badge value={r.status} /> },
          { key: "created_at", label: "Added", render: (r) => <span className="mute small-text">{fmtTime(r.created_at)}</span> },
          {
            key: "actions", label: "",
            render: (r) => {
              const rowOwner = String(r.role).toUpperCase() === "OWNER";
              const rowAdmin = String(r.role).toUpperCase() === "ADMIN";
              if (!canAdmin || r.user_id === userId || rowOwner || (!isOwner && rowAdmin)) return null;
              return <Btn kind="danger" onClick={() => { if (window.confirm("Remove " + String(r.email ?? r.user_id) + " from this workspace?")) void memberCall("DELETE", { user_id: r.user_id }).then((d) => { if (d) void load(); }); }}>Remove</Btn>;
            },
          },
        ]}
      />

      <Modal open={inviting} onClose={() => setInviting(false)} title="Invite a team member" footer={<><Btn onClick={() => setInviting(false)}>Cancel</Btn><Btn kind="primary" disabled={busy || !email.includes("@")} onClick={() => void invite()}>{busy ? "Sending..." : "Send invitation"}</Btn></>}>
        <Field label="Email"><input className="inp" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" /></Field>
        <Field label="Role" hint="Operators run agents and see everything. Viewers are read-only. Admins also manage policies, keys and the team."><select className="inp" value={role} onChange={(e) => setRole(e.target.value)}>{roleOptions.map((o) => <option key={o}>{o}</option>)}</select></Field>
        {err && <div className="err">{err}</div>}
      </Modal>
    </>
  );
}