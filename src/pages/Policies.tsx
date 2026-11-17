import { useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "../lib/supabase";
import { fmtTime, useRows, type Row } from "../lib/db";
import { useWorkspace } from "../lib/workspace";
import { Badge, Btn, DataTable, Drawer, ErrorNote, Field, Json, KV, Modal, Notice, PageHead } from "../ui/kit";

const EMPTY = { name: "", decision: "BLOCK", action_pattern: "", resource_pattern: "", priority: "100", min_risk: "", enabled: true };

const TEMPLATES = [
  { label: "Block deletes", name: "Block deletes", decision: "BLOCK", action_pattern: "*.delete", min_risk: "" },
  { label: "Approve payments", name: "Approve payments", decision: "ESCALATE", action_pattern: "payments.*", min_risk: "" },
  { label: "Approve high risk", name: "Approve high-risk actions", decision: "ESCALATE", action_pattern: "*", min_risk: "70" },
  { label: "Allow reads", name: "Allow reads", decision: "ALLOW", action_pattern: "*.read", min_risk: "" },
];

function describe(conditions: unknown): string {
  if (!Array.isArray(conditions) || conditions.length === 0) return "Always (no extra conditions)";
  return conditions.map((c) => {
    const x = c as { field?: unknown; op?: unknown; value?: unknown };
    return String(x.field) + " " + String(x.op) + " " + JSON.stringify(x.value);
  }).join(" and ");
}

function friendly(message: string): string {
  return /row-level security/i.test(message)
    ? "Changing policies needs two-step verification. Open Security and verify this session."
    : message;
}

export default function Policies() {
  const { current, canWrite } = useWorkspace();
  const pol = useRows("policies", { order: "updated_at", limit: 500 });
  const [open, setOpen] = useState<Row | null>(null);
  const ver = useRows("policy_versions", { order: "version", limit: 100, eq: { policy_id: open?.id ?? "none" } }, !!open);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    setErr(null);
    if (!current) { setErr("No workspace selected."); return; }
    if (form.name.trim().length < 2) { setErr("Give the policy a name."); return; }
    const priority = Number(form.priority);
    if (!Number.isInteger(priority) || priority < 0 || priority > 10000) { setErr("Priority must be a whole number from 0 to 10000."); return; }
    let minRisk: number | null = null;
    if (form.min_risk.trim() !== "") {
      minRisk = Number(form.min_risk);
      if (!Number.isInteger(minRisk) || minRisk < 0 || minRisk > 100) { setErr("Minimum risk must be a whole number from 0 to 100."); return; }
    }
    setSaving(true);
    const { error } = await supabase.from("policies").insert({
      workspace_id: current.workspaceId,
      name: form.name.trim(),
      decision: form.decision,
      action_pattern: form.action_pattern.trim() || null,
      resource_pattern: form.resource_pattern.trim() || null,
      priority,
      enabled: form.enabled,
      ...(minRisk !== null ? { conditions: [{ field: "risk", op: "gte", value: minRisk }] } : {}),
    });
    setSaving(false);
    if (error) { setErr("Could not create policy: " + friendly(error.message)); return; }
    setCreating(false); setForm(EMPTY); pol.reload();
  }

  async function toggle() {
    if (!open) return;
    setErr(null);
    const next = !open.enabled;
    const { error } = await supabase.from("policies").update({ enabled: next }).eq("id", open.id);
    if (error) { setErr(friendly(error.message)); return; }
    setOpen({ ...open, enabled: next });
    pol.reload();
  }

  async function remove() {
    if (!open) return;
    if (!window.confirm("Delete policy \"" + String(open.name) + "\"? Agents are no longer governed by it.")) return;
    setErr(null);
    const { error } = await supabase.from("policies").delete().eq("id", open.id);
    if (error) { setErr(friendly(error.message)); return; }
    setOpen(null);
    pol.reload();
  }

  return (
    <>
      <PageHead title="Policies" subtitle="Rules that decide whether an agent action is allowed, escalated or blocked." actions={canWrite ? <Btn kind="primary" onClick={() => { setErr(null); setCreating(true); }}><Plus size={13} /> New policy</Btn> : undefined} />
      <Notice>If several policies match, BLOCK wins over ESCALATE, and ESCALATE wins over ALLOW. With no match, the workspace default applies (BLOCK unless changed).</Notice>
      <ErrorNote errors={[["policies", pol.error]]} />
      <DataTable
        exportName="policies"
        loading={pol.loading}
        rows={pol.rows}
        onReload={pol.reload}
        onRow={(r) => { setOpen(r); setErr(null); }}
        empty={<div className="empty"><b>No policies yet</b><p className="mute">Use the Setup guide for a ready-made pack, or create one yourself.</p></div>}
        cols={[
          { key: "name", label: "Name", render: (r) => <b>{r.name}</b> },
          { key: "decision", label: "Decision", render: (r) => <Badge value={r.decision} /> },
          { key: "enabled", label: "State", render: (r) => <Badge value={r.enabled ? "active" : "disabled"} />, value: (r) => (r.enabled ? 1 : 0) },
          { key: "action_pattern", label: "Action", render: (r) => <span className="mono">{r.action_pattern ?? "*"}</span> },
          { key: "priority", label: "Priority", align: "right" },
          { key: "version", label: "Version", align: "right" },
          { key: "updated_at", label: "Updated", render: (r) => <span className="mute">{fmtTime(r.updated_at)}</span> },
        ]}
      />
      <Drawer open={!!open} onClose={() => setOpen(null)} title={open?.name ?? ""} subtitle={open ? String(open.scope ?? "workspace") : ""} width={640}>
        {open && (
          <>
            <KV items={[["State", <Badge value={open.enabled ? "active" : "disabled"} />], ["Decision", <Badge value={open.decision} />], ["Action pattern", <span className="mono">{open.action_pattern ?? "*"}</span>], ["Resource pattern", <span className="mono">{open.resource_pattern ?? "*"}</span>], ["Applies when", describe(open.conditions)], ["Priority", open.priority], ["Version", open.version], ["Created", fmtTime(open.created_at)]]} />
            {canWrite && (
              <div className="row-btns">
                <Btn onClick={() => void toggle()}>{open.enabled ? "Disable policy" : "Enable policy"}</Btn>
                <Btn kind="danger" onClick={() => void remove()}>Delete policy</Btn>
              </div>
            )}
            {err && <div className="err">{err}</div>}
            <Json label="conditions" value={open.conditions} />
            <h4 className="sub">Versions</h4>
            {ver.error && <Notice tone="warn">{ver.error}</Notice>}
            {!ver.loading && !ver.rows.length && !ver.error && <p className="mute">No saved versions yet.</p>}
            {ver.rows.map((v) => (
              <details className="ver" key={v.id}>
                <summary><b>v{v.version}</b> <Badge value={v.decision} /> <span className="mute small-text">{fmtTime(v.created_at)}</span></summary>
                <Json label="version" value={{ conditions: v.conditions, metadata: v.metadata }} />
              </details>
            ))}
          </>
        )}
      </Drawer>
      <Modal open={creating} onClose={() => setCreating(false)} title="New policy" footer={<><Btn onClick={() => setCreating(false)}>Cancel</Btn><Btn kind="primary" onClick={() => void create()} disabled={saving || !form.name}>{saving ? "Creating..." : "Create policy"}</Btn></>}>
        <div>
          <span className="mute small-text">Start from a template</span>
          <div className="row-btns">
            {TEMPLATES.map((t) => (
              <Btn key={t.label} onClick={() => setForm({ ...form, name: t.name, decision: t.decision, action_pattern: t.action_pattern, min_risk: t.min_risk })}>{t.label}</Btn>
            ))}
          </div>
        </div>
        <Field label="Name"><input className="inp" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></Field>
        <Field label="Decision"><select className="inp" value={form.decision} onChange={(e) => setForm({ ...form, decision: e.target.value })}>{["ALLOW", "ESCALATE", "BLOCK"].map((d) => <option key={d}>{d}</option>)}</select></Field>
        <Field label="Action pattern" hint="For example db.execute or payments.*. Leave empty to match every action."><input className="inp" value={form.action_pattern} onChange={(e) => setForm({ ...form, action_pattern: e.target.value })} /></Field>
        <Field label="Resource pattern" hint="Optional."><input className="inp" value={form.resource_pattern} onChange={(e) => setForm({ ...form, resource_pattern: e.target.value })} /></Field>
        <Field label="Only when risk score is at least" hint="Optional, 0 to 100. The agent sends the risk score with each request."><input className="inp" type="number" value={form.min_risk} onChange={(e) => setForm({ ...form, min_risk: e.target.value })} /></Field>
        <Field label="Priority" hint="Lower numbers are listed first."><input className="inp" type="number" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })} /></Field>
        <label className="fld"><span>Enabled</span><input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /></label>
        {err && <div className="err">{err}</div>}
      </Modal>
    </>
  );
}