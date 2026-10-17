import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

type Stats = { agents: number; policies: number; approvals: number; incidents: number; allow: number; escalate: number; block: number };
type Decision = { id: string; decision: string; reason: string | null; created_at: string };

async function count(table: string, f?: (q: any) => any): Promise<number> {
  let q: any = supabase.from(table).select("id", { count: "exact", head: true });
  if (f) q = f(q);
  const { count: c, error } = await q;
  if (error) throw new Error(`${table}: ${error.message}`);
  return c ?? 0;
}

export default function Overview() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<Decision[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    const day = (d: string) => (q: any) => q.eq("decision", d).gte("created_at", since);
    Promise.all([
      count("agents"), count("policies"), count("approvals", (q) => q.eq("status", "pending")), count("incidents"),
      count("decisions", day("ALLOW")), count("decisions", day("ESCALATE")), count("decisions", day("BLOCK")),
      supabase.from("decisions").select("id,decision,reason,created_at").order("created_at", { ascending: false }).limit(5),
    ])
      .then(([agents, policies, approvals, incidents, allow, escalate, block, rec]) => {
        setStats({ agents, policies, approvals, incidents, allow, escalate, block });
        setRecent((rec.data as Decision[]) ?? []);
      })
      .catch((e: Error) => setError(e.message));
  }, []);

  const s = stats;
  return (
    <>
      <h2 className="page-title">Overview</h2>
      <p className="mute">Live governance state of your workspace.</p>
      {error && <div className="err">Some data is unavailable: {error}</div>}

      <div className="card">
        <b>Get started</b>
        <ul className="checklist">
          <li>Create an API key</li>
          <li>Add a policy (or load the starter policies)</li>
          <li>Connect or import your agents</li>
          <li>Send your first test action</li>
        </ul>
      </div>

      <div className="stats">
        {[["AGENTS", s?.agents], ["POLICIES", s?.policies], ["PENDING APPROVALS", s?.approvals], ["INCIDENTS", s?.incidents]].map(([k, v]) => (
          <div className="card" key={k as string}><small className="label">{k}</small><div className="big">{v ?? "-"}</div></div>
        ))}
      </div>

      <div className="card">
        <b>Decisions, last 24 hours</b>
        <div className="row">
          <span className="ok">{s?.allow ?? "-"} allowed</span>
          <span className="warn">{s?.escalate ?? "-"} escalated</span>
          <span className="bad">{s?.block ?? "-"} blocked</span>
        </div>
      </div>

      <div className="card">
        <b>Recent activity</b>
        {recent.length === 0 ? (
          <p className="mute">Nothing yet. Decisions appear here the moment an agent calls the API.</p>
        ) : (
          recent.map((d) => (
            <div className="line" key={d.id}>
              <span className={d.decision === "ALLOW" ? "ok" : d.decision === "BLOCK" ? "bad" : "warn"}>{d.decision}</span>
              <span className="mute">{d.reason ?? ""}</span>
              <span className="mute small-text">{new Date(d.created_at).toLocaleString()}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}