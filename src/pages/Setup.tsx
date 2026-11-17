import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Check } from "lucide-react";
import { supabase } from "../lib/supabase";
import { bridge } from "../lib/notify";
import { useRows } from "../lib/db";
import { useWorkspace } from "../lib/workspace";
import { Btn, Notice, PageHead } from "../ui/kit";

type Item = { name: string; decision: "ALLOW" | "BLOCK" | "ESCALATE"; action: string; priority: number; minRisk?: number };
type Pack = { label: string; hint: string; items: Item[] };

const PACKS: Record<string, Pack> = {
  safe: {
    label: "Safe start",
    hint: "Blocks secrets access and deletes, asks a person for payments, external email and high-risk actions, allows read-only work.",
    items: [
      { name: "Safe start: block secrets access", decision: "BLOCK", action: "secrets.*", priority: 10 },
      { name: "Safe start: block deletes", decision: "BLOCK", action: "*.delete", priority: 20 },
      { name: "Safe start: approve payments", decision: "ESCALATE", action: "payments.*", priority: 30 },
      { name: "Safe start: approve external email", decision: "ESCALATE", action: "email.send", priority: 40 },
      { name: "Safe start: approve high-risk actions", decision: "ESCALATE", action: "*", priority: 50, minRisk: 70 },
      { name: "Safe start: allow reads", decision: "ALLOW", action: "*.read", priority: 100 },
      { name: "Safe start: allow search", decision: "ALLOW", action: "search.*", priority: 110 },
    ],
  },
  finance: {
    label: "Finance",
    hint: "Every payment, transfer and refund needs a person. Reads are allowed.",
    items: [
      { name: "Finance: approve payments", decision: "ESCALATE", action: "payments.*", priority: 10 },
      { name: "Finance: approve transfers", decision: "ESCALATE", action: "transfers.*", priority: 20 },
      { name: "Finance: approve refunds", decision: "ESCALATE", action: "refunds.*", priority: 30 },
      { name: "Finance: block secrets access", decision: "BLOCK", action: "secrets.*", priority: 40 },
      { name: "Finance: allow reads", decision: "ALLOW", action: "*.read", priority: 100 },
    ],
  },
  data: {
    label: "Data protection",
    hint: "Blocks destructive database and file actions, asks a person before writes and exports.",
    items: [
      { name: "Data protection: block db.execute", decision: "BLOCK", action: "db.execute", priority: 10 },
      { name: "Data protection: block deletes", decision: "BLOCK", action: "*.delete", priority: 20 },
      { name: "Data protection: approve writes", decision: "ESCALATE", action: "db.write", priority: 30 },
      { name: "Data protection: approve exports", decision: "ESCALATE", action: "*.export", priority: 40 },
      { name: "Data protection: allow reads", decision: "ALLOW", action: "*.read", priority: 100 },
    ],
  },
};

function Step({ n, done, title, text, children }: { n: number; done: boolean; title: string; text: string; children?: ReactNode }) {
  return (
    <div className="panel">
      <div className="panel-head">
        <b>{n}. {title}</b>
        {done ? <span className="badge ok"><Check size={11} /> Done</span> : <span className="badge warn">To do</span>}
      </div>
      <p className="mute" style={{ margin: "0 0 10px" }}>{text}</p>
      {children}
    </div>
  );
}

export default function Setup() {
  const nav = useNavigate();
  const { current, canAdmin } = useWorkspace();
  const pol = useRows("policies", { select: "id", limit: 1 });
  const keys = useRows("api_keys", { select: "id", limit: 1 });
  const agents = useRows("agents", { select: "id", limit: 1 });
  const [aal, setAal] = useState("aal1");
  const [pack, setPack] = useState("safe");
  const [busy, setBusy] = useState(false);
  const [ok, setOk] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [tested, setTested] = useState(false);
  const notify = bridge()?.notify;

  useEffect(() => {
    void supabase.auth.mfa.getAuthenticatorAssuranceLevel().then(({ data }) => setAal(data?.currentLevel ?? "aal1"));
  }, []);

  async function applyPack() {
    if (!current) return;
    setBusy(true); setErr(null); setOk(null);
    const existing = await supabase.from("policies").select("name").eq("workspace_id", current.workspaceId);
    if (existing.error) { setBusy(false); setErr(existing.error.message); return; }
    const have = new Set((existing.data ?? []).map((r: { name: string }) => r.name));
    const rows = PACKS[pack].items.filter((i) => !have.has(i.name)).map((i) => ({
      workspace_id: current.workspaceId,
      name: i.name,
      decision: i.decision,
      action_pattern: i.action,
      priority: i.priority,
      enabled: true,
      ...(i.minRisk != null ? { conditions: [{ field: "risk", op: "gte", value: i.minRisk }] } : {}),
    }));
    if (rows.length === 0) { setBusy(false); setOk("These policies already exist."); return; }
    const { error } = await supabase.from("policies").insert(rows);
    setBusy(false);
    if (error) {
      setErr(/row-level security/i.test(error.message)
        ? "Creating policies needs two-step verification. Finish step 1 first."
        : error.message);
      return;
    }
    setOk(rows.length + " policies created.");
    pol.reload();
  }

  async function testNotify() {
    if (!notify) return;
    await notify({ title: "Aegisora test", body: "Notifications are working." });
    setTested(true);
  }

  function finish() {
    try { localStorage.setItem("aegisora.setup.done", "1"); } catch { /* ignore */ }
    nav("/app");
  }

  const s1 = aal === "aal2";
  const s2 = pol.rows.length > 0;
  const s3 = keys.rows.length > 0;
  const s4 = agents.rows.length > 0;
  const s5 = tested;
  const doneCount = [s1, s2, s3, s4, s5].filter(Boolean).length;

  return (
    <>
      <PageHead title="Setup guide" subtitle={doneCount + " of 5 steps done. About five minutes."} />
      {!canAdmin && <Notice tone="warn">Only owners and admins can finish the setup.</Notice>}

      <Step n={1} done={s1} title="Secure your account" text="Two-step verification unlocks policies, API keys and approvals.">
        {!s1 && <div className="row-btns"><Btn kind="primary" onClick={() => nav("/app/security")}>Open Security</Btn></div>}
      </Step>

      <Step n={2} done={s2} title="Choose your first policies" text={PACKS[pack].hint}>
        <div className="row-btns" style={{ marginBottom: 10 }}>
          {Object.entries(PACKS).map(([k, p]) => (
            <Btn key={k} kind={pack === k ? "primary" : "ghost"} onClick={() => setPack(k)}>{p.label}</Btn>
          ))}
        </div>
        <div className="row-btns">
          <Btn kind="primary" disabled={busy || !canAdmin} onClick={() => void applyPack()}>{busy ? "Creating..." : "Add " + PACKS[pack].label + " policies"}</Btn>
          <Btn onClick={() => nav("/app/policies")}>Open Policies</Btn>
        </div>
        {ok && <p className="ok">{ok}</p>}
        {err && <div className="err">{err}</div>}
      </Step>

      <Step n={3} done={s3} title="Create an API key" text="Your agents use this key to ask Aegisora for a decision.">
        {!s3 && <div className="row-btns"><Btn kind="primary" onClick={() => nav("/app/api-keys")}>Open API Keys</Btn></div>}
      </Step>

      <Step n={4} done={s4} title="Connect your first agent" text="Copy the code, run it once, and the agent appears in the list.">
        {!s4 && <div className="row-btns"><Btn kind="primary" onClick={() => nav("/app/connect")}>Open Connect agent</Btn></div>}
      </Step>

      <Step n={5} done={s5} title="Turn on alerts" text="Aegisora shows a desktop alert when an action needs approval or is blocked, even from the tray.">
        <div className="row-btns">
          <Btn disabled={!notify} onClick={() => void testNotify()}>Send a test alert</Btn>
          <Btn onClick={() => nav("/app/notifications")}>Alert settings</Btn>
        </div>
        {!notify && <p className="mute small-text">Alerts work in the desktop app.</p>}
      </Step>

      <div className="row-btns">
        <Btn kind="primary" onClick={finish}>{doneCount === 5 ? "Finish" : "Continue later"}</Btn>
      </div>
    </>
  );
}