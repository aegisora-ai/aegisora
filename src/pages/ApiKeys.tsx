import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Copy, Plus, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { ago, fmtTime, useRows, type Row } from "../lib/db";
import { createApiKey } from "../lib/api";
import { useWorkspace } from "../lib/workspace";
import { Badge, Btn, DataTable, Drawer, ErrorNote, Field, Notice, PageHead } from "../ui/kit";

export default function ApiKeys() {
  const { canAdmin } = useWorkspace();
  const navigate = useNavigate();
  const keys = useRows("api_keys", { order: "created_at", limit: 200 });
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [fresh, setFresh] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [sel, setSel] = useState<Set<string>>(new Set());

  function close() { setOpen(false); setFresh(null); setName(""); setErr(null); setCopied(false); }

  async function create() {
    const n = name.trim();
    if (!n) { setErr("Give the key a name, for example production-agent."); return; }
    setBusy(true); setErr(null);
    const r = await createApiKey(n.slice(0, 80));
    setBusy(false);
    if (!r.key) { setErr(r.error ?? "Could not create the key."); return; }
    setFresh(r.key);
    keys.reload();
  }

  async function revoke(r: Row) {
    if (!window.confirm("Revoke key " + String(r.prefix ?? "") + "...? Agents using it stop working immediately.")) return;
    const { error } = await supabase.from("api_keys").update({ revoked_at: new Date().toISOString() }).eq("id", r.id);
    if (error) { window.alert("Could not revoke: " + error.message); return; }
    keys.reload();
  }

  function toggle(id: string) {
    setSel((p) => { const n = new Set(p); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  }

  async function removeKeys(ids: string[]) {
    if (!canAdmin || !ids.length) return;
    if (!window.confirm("Permanently delete " + ids.length + " revoked key" + (ids.length > 1 ? "s" : "") + "? This cannot be undone.")) return;
    const { data, error } = await supabase.from("api_keys").delete().in("id", ids).not("revoked_at", "is", null).select("id");
    if (error) { window.alert("Could not delete: " + error.message); return; }
    const n = data?.length ?? 0;
    if (n < ids.length) {
      window.alert(n === 0
        ? "Nothing was deleted. The database most likely has no delete permission for api_keys. Send me the table policies and I will add it."
        : "Deleted " + n + " of " + ids.length + ".");
    }
    setSel(new Set());
    keys.reload();
  }

  async function copy() {
    if (!fresh) return;
    try { await navigator.clipboard.writeText(fresh); setCopied(true); }
    catch { setErr("Copy failed. Select the key and press Ctrl+C."); }
  }

  return (
    <>
      <PageHead
        title="API Keys"
        subtitle="Credentials your agents use to call the control API."
        actions={<Btn kind="primary" disabled={!canAdmin} onClick={() => setOpen(true)}><Plus size={13} /> New API key</Btn>}
      />
      <Notice tone="warn">Keys are shown once when created. Only prefixes are listed. Creating or revoking needs an owner or admin with two-step verification.</Notice>
      <ErrorNote errors={[["api_keys", keys.error]]} />
      <DataTable
        exportName="api-keys"
        loading={keys.loading}
        rows={keys.rows}
        onReload={keys.reload}
        toolbar={canAdmin ? (
          <>
            {sel.size > 0 && <Btn kind="danger" onClick={() => void removeKeys(Array.from(sel))}><Trash2 size={13} /> Delete selected ({sel.size})</Btn>}
            {keys.rows.some((r) => r.revoked_at) && <Btn onClick={() => void removeKeys(keys.rows.filter((r) => r.revoked_at).map((r) => String(r.id)))}>Delete all revoked ({keys.rows.filter((r) => r.revoked_at).length})</Btn>}
          </>
        ) : undefined}
        empty={<div className="empty"><b>No API keys yet</b><p className="mute">Create a key, then connect your first agent.</p></div>}
        cols={[
          { key: "sel", label: "", hideCsv: true, render: (r) => (r.revoked_at && canAdmin ? <input type="checkbox" checked={sel.has(String(r.id))} onChange={() => toggle(String(r.id))} aria-label="Select key" /> : null) },
          { key: "name", label: "Name", render: (r) => <b>{String(r.name ?? "")}</b> },
          { key: "prefix", label: "Prefix", render: (r) => <span className="mono">{String(r.prefix ?? "")}...</span> },
          { key: "status", label: "Status", render: (r) => <Badge value={r.revoked_at ? "revoked" : "active"} /> },
          { key: "last_used_at", label: "Last used", render: (r) => <span className="mute">{r.last_used_at ? ago(r.last_used_at) : "never"}</span> },
          { key: "created_at", label: "Created", render: (r) => <span className="mute small-text">{fmtTime(r.created_at)}</span> },
          { key: "actions", label: "", render: (r) => (!canAdmin ? null : r.revoked_at ? <Btn kind="danger" onClick={() => void removeKeys([String(r.id)])}><Trash2 size={13} /> Delete</Btn> : <Btn kind="danger" onClick={() => void revoke(r)}>Revoke</Btn>) },
        ]}
      />
      <Drawer open={open} onClose={close} title="New API key" subtitle="Use it from your agent's code" width={560}>
        {!fresh ? (
          <div className="decide">
            <Field label="Key name"><input className="inp" value={name} onChange={(e) => setName(e.target.value)} placeholder="production-agent" /></Field>
            {err && <div className="err">{err}</div>}
            <div className="row-btns">
              <Btn kind="primary" disabled={busy} onClick={() => void create()}>Create key</Btn>
              <Btn onClick={() => navigate("/app/security")}>Open Security</Btn>
            </div>
          </div>
        ) : (
          <div className="decide">
            <Notice tone="warn">Copy this key now. You will not be able to see it again.</Notice>
            <input className="inp mono" readOnly value={fresh} onFocus={(e) => e.currentTarget.select()} />
            <div className="row-btns">
              <Btn kind="primary" onClick={() => void copy()}><Copy size={13} /> {copied ? "Copied" : "Copy key"}</Btn>
              <Btn onClick={() => navigate("/app/connect")}>Connect an agent</Btn>
            </div>
            {err && <div className="err">{err}</div>}
          </div>
        )}
      </Drawer>
    </>
  );
}