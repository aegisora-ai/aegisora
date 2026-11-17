import { useCallback, useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useWorkspace } from "../lib/workspace";
import { Badge, Btn, PageHead, Notice } from "../ui/kit";

const TABLES = [
  "workspaces", "workspace_members", "workspace_settings", "profiles", "agents", "decisions", "executions",
  "approvals", "incidents", "evidence", "audit_events", "traces", "policies", "policy_versions",
  "policy_change_requests", "risk_rules", "webhooks", "api_keys",
];

type Result = { table: string; ok: boolean; count: number | null; ms: number; error?: string };

export default function Diagnostics() {
  const { current, memberships, error } = useWorkspace();
  const [results, setResults] = useState<Result[]>([]);
  const [running, setRunning] = useState(false);
  const [aal, setAal] = useState<string>("...");

  const run = useCallback(async () => {
    setRunning(true);
    const out = await Promise.all(TABLES.map(async (table): Promise<Result> => {
      const t0 = performance.now();
      const { count, error: e } = await supabase.from(table).select("*", { count: "exact", head: true });
      return { table, ok: !e, count: count ?? null, ms: Math.round(performance.now() - t0), error: e?.message };
    }));
    setResults(out);
    const level = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setAal(level.error ? "unknown" : level.data.currentLevel ?? "unknown");
    setRunning(false);
  }, []);
  useEffect(() => { void run(); }, [run]);

  const okN = results.filter((r) => r.ok).length;
  const url = (import.meta.env.VITE_SUPABASE_URL as string | undefined) ?? "";
  return (
    <>
      <PageHead title="Diagnostics" subtitle="Check that every table the control plane depends on is reachable from this app." actions={<Btn onClick={run} disabled={running}><RefreshCw size={13} /> {running ? "Checking..." : "Run checks"}</Btn>} />
      {error && <Notice tone="bad">Workspace lookup failed: {error}</Notice>}
      <div className="kpis">
        <div className="kpi"><span className="kpi-label">Tables reachable</span><span className={`kpi-value ${results.length && okN === results.length ? "ok" : "warn"}`}>{okN}/{TABLES.length}</span></div>
        <div className="kpi"><span className="kpi-label">Workspace</span><span className="kpi-value sm">{current?.name ?? "none"}</span><span className="kpi-hint mute">role: {current?.role ?? "-"}</span></div>
        <div className="kpi"><span className="kpi-label">Session security</span><span className={`kpi-value sm ${aal === "aal2" ? "ok" : "warn"}`}>{aal === "aal2" ? "two-step verified" : "email code only"}</span><span className="kpi-hint mute">{aal}</span></div>
        <div className="kpi"><span className="kpi-label">Memberships</span><span className="kpi-value">{memberships.length}</span></div>
        <div className="kpi"><span className="kpi-label">Project</span><span className="kpi-value sm mono">{url.replace("https://", "").split(".")[0] || "unset"}</span></div>
      </div>
      <div className="tbl-wrap">
        <div className="tbl-scroll">
          <table className="tbl">
            <thead><tr><th>Table</th><th>Status</th><th style={{ textAlign: "right" }}>Visible rows</th><th style={{ textAlign: "right" }}>Latency</th><th>Detail</th></tr></thead>
            <tbody>
              {results.map((r) => (
                <tr key={r.table}>
                  <td><span className="mono">{r.table}</span></td>
                  <td><Badge value={r.ok ? "ok" : "failed"} /></td>
                  <td style={{ textAlign: "right" }}>{r.count ?? "-"}</td>
                  <td style={{ textAlign: "right" }} className="mute">{r.ms} ms</td>
                  <td className="mute">{r.error ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <Notice>A table showing zero visible rows can be correct: row level security only returns rows for workspaces where you are a member. Owner and admin tables such as API keys also need a two-step verified session.</Notice>
    </>
  );
}