import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { apiCall, apiError, API_BASE, createApiKey } from "../lib/api";
import { Badge, Btn, Field, Notice, PageHead, Seg } from "../ui/kit";

const KEY_RE = /^aeg_live_[a-f0-9]{48}$/;

function snippet(lang: string, key: string, agent: string): string {
  const k = key || "aeg_live_YOUR_KEY";
  const a = agent || "my-agent";
  const url = API_BASE + "/api/v1/evaluate";
  if (lang === "curl") {
    return [
      "curl -X POST " + url + " \\",
      '  -H "Authorization: Bearer ' + k + '" \\',
      '  -H "Content-Type: application/json" \\',
      "  -d '{\"agent\":\"" + a + "\",\"action\":\"payments.send\",\"resource\":\"invoice-42\",\"risk\":70}'",
    ].join("\n");
  }
  if (lang === "node") {
    return [
      'const res = await fetch("' + url + '", {',
      '  method: "POST",',
      '  headers: { Authorization: "Bearer ' + k + '", "Content-Type": "application/json" },',
      '  body: JSON.stringify({ agent: "' + a + '", action: "payments.send", resource: "invoice-42", risk: 70 }),',
      "});",
      "const d = await res.json();",
      'if (d.effect === "ALLOW") { /* run the action */ }',
      'else if (d.effect === "ESCALATE") { /* poll GET /api/v1/decisions/<decision_id> until may_execute is true */ }',
      "else { /* BLOCK: do not run it */ }",
    ].join("\n");
  }
  return [
    "import requests",
    "",
    "r = requests.post(",
    '    "' + url + '",',
    '    headers={"Authorization": "Bearer ' + k + '"},',
    '    json={"agent": "' + a + '", "action": "payments.send", "resource": "invoice-42", "risk": 70},',
    ")",
    "d = r.json()",
    'if d["effect"] == "ALLOW":',
    "    pass  # run the action",
    'elif d["effect"] == "ESCALATE":',
    "    pass  # poll GET /api/v1/decisions/<decision_id> until may_execute is true",
    "else:",
    "    pass  # BLOCK: do not run it",
  ].join("\n");
}

export default function Connect() {
  const navigate = useNavigate();
  const [agent, setAgent] = useState("my-first-agent");
  const [key, setKey] = useState("");
  const [lang, setLang] = useState<string>("python");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [result, setResult] = useState<{ effect: string; reason: string } | null>(null);
  const [connected, setConnected] = useState(false);
  const startedAt = useRef(new Date().toISOString());

  useEffect(() => {
    if (connected || !agent.trim()) return;
    const t = setInterval(async () => {
      const { data } = await supabase
        .from("decisions")
        .select("id")
        .eq("agent_name", agent.trim())
        .neq("action", "aegisora.test")
        .gte("created_at", startedAt.current)
        .limit(1);
      if (data && data.length > 0) setConnected(true);
    }, 3000);
    return () => clearInterval(t);
  }, [agent, connected]);

  async function makeKey() {
    setBusy(true); setErr(null);
    const r = await createApiKey(("connect-" + agent.trim()).slice(0, 80));
    setBusy(false);
    if (r.key) setKey(r.key); else setErr(r.error ?? "Could not create the key.");
  }

  async function sendTest() {
    if (!KEY_RE.test(key.trim())) { setErr("Paste a valid API key (aeg_live_...) or create one first."); return; }
    if (!agent.trim() || agent.length > 120) { setErr("Agent name must be 1-120 characters."); return; }
    setBusy(true); setErr(null); setResult(null);
    const res = await apiCall({
      method: "POST",
      path: "/api/v1/evaluate",
      token: key.trim(),
      body: { agent: agent.trim(), action: "aegisora.test", resource: "aegisora/connect", risk: 5 },
    });
    setBusy(false);
    if (!res.ok) { setErr(apiError(res).message); return; }
    const d = res.data as { effect?: unknown; reason?: unknown };
    setResult({ effect: String(d.effect ?? ""), reason: String(d.reason ?? "") });
  }

  async function copyCode() {
    try { await navigator.clipboard.writeText(snippet(lang, key.trim(), agent.trim())); } catch { /* user can select the text */ }
  }

  const box = { padding: 12, borderRadius: 8, overflowX: "auto" as const, background: "rgba(255,255,255,0.04)", fontSize: 12, whiteSpace: "pre" as const };

  return (
    <>
      <PageHead title="Connect agent" subtitle="Four steps. Your agent appears in the list as soon as its first event arrives." />

      <div className="decide">
        <h3>1. Name your agent and get a key</h3>
        <Field label="Agent name"><input className="inp" value={agent} onChange={(e) => setAgent(e.target.value)} /></Field>
        <Field label="API key">
          <input className="inp mono" value={key} onChange={(e) => setKey(e.target.value)} placeholder="Paste a key or create a new one" />
        </Field>
        <div className="row-btns">
          <Btn kind="primary" disabled={busy} onClick={() => void makeKey()}>Create a new key</Btn>
          <Btn onClick={() => navigate("/app/security")}>Security (2-step)</Btn>
        </div>
      </div>

      <div className="decide">
        <h3>2. Add this to your agent</h3>
        <Seg value={lang} onChange={setLang} options={[{ key: "python", label: "Python" }, { key: "node", label: "Node" }, { key: "curl", label: "cURL" }]} />
        <pre className="mono" style={box}>{snippet(lang, key.trim(), agent.trim())}</pre>
        <div className="row-btns"><Btn onClick={() => void copyCode()}>Copy code</Btn></div>
      </div>

      <div className="decide">
        <h3>3. Send a test action</h3>
        <div className="row-btns">
          <Btn kind="primary" disabled={busy} onClick={() => void sendTest()}>Send test action</Btn>
        </div>
        {result && (
          <p>Result: <Badge value={result.effect} /> <span className="mute">{result.reason}</span></p>
        )}
        {result && result.effect === "BLOCK" && (
          <Notice tone="warn">BLOCK is expected until you add a policy that allows this action. The pipeline works.</Notice>
        )}
      </div>

      <div className="decide">
        <h3>4. First event from your code</h3>
        {connected ? (
          <>
            <p>Connected. Your agent sent its first event.</p>
            <div className="row-btns"><Btn kind="primary" onClick={() => navigate("/app/agents")}>Open Agents</Btn></div>
          </>
        ) : (
          <p className="mute">Waiting for the first event from "{agent.trim()}"... Run the code from step 2.</p>
        )}
      </div>
      {err && <div className="err">{err}</div>}
    </>
  );
}