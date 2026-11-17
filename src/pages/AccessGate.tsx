import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from "react";
import Logo from "../components/Logo";
import TitleBar from "../components/TitleBar";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/useSession";
import "../auth.css";

type Phase = "checking" | "workspace" | "mfa-verify" | "mfa-enroll" | "ok";

type FactorLite = { id: string; factor_type: string; status: string };

function Frame({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="window">
      <TitleBar />
      <main className="center">
        <Logo className="logo small"  alt="Aegisora" />
        <h1 className="serif">{title}</h1>
        {sub && <p className="mute">{sub}</p>}
        {children}
      </main>
    </div>
  );
}

function CreateWorkspace() {
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    const { data, error } = await supabase.rpc("create_workspace", { p_name: name });
    if (error) {
      setMsg(error.message);
      setBusy(false);
      return;
    }
    if (data) localStorage.setItem("aegisora.workspace", String(data));
    window.location.reload();
  }

  return (
    <Frame title="Create your workspace" sub="A workspace holds your agents, policies and approvals">
      <form className="form" onSubmit={submit}>
        <input
          className="field" required autoFocus placeholder="Workspace name" maxLength={80}
          value={name} onChange={(e) => setName(e.target.value)}
        />
        {msg && <div className="err" role="alert">{msg}</div>}
        <button className="btn" type="submit" disabled={busy || name.trim().length < 2}>
          {busy ? "Creating..." : "Create workspace"}
        </button>
      </form>
      <div className="links">
        <button className="link" type="button" onClick={() => void supabase.auth.signOut()}>Sign out</button>
      </div>
    </Frame>
  );
}

function MfaVerify({ onDone }: { onDone: () => void }) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const list = await supabase.auth.mfa.listFactors();
      if (list.error) throw list.error;
      const factor = list.data.totp[0];
      if (!factor) throw new Error("No authenticator is set up for this account.");
      const res = await supabase.auth.mfa.challengeAndVerify({ factorId: factor.id, code: code.trim() });
      if (res.error) throw res.error;
      onDone();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Frame title="Two-step verification" sub="Enter the 6-digit code from your authenticator app">
      <form className="form" onSubmit={submit}>
        <input
          className="field otp" required autoFocus inputMode="numeric" autoComplete="one-time-code"
          placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
        />
        {msg && <div className="err" role="alert">{msg}</div>}
        <button className="btn" type="submit" disabled={busy}>{busy ? "Please wait..." : "Verify"}</button>
      </form>
      <div className="links">
        <button className="link" type="button" onClick={() => void supabase.auth.signOut()}>Sign out</button>
      </div>
    </Frame>
  );
}

function MfaEnroll({ onDone, onSkip }: { onDone: () => void; onSkip: () => void }) {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [qr, setQr] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    (async () => {
      const list = await supabase.auth.mfa.listFactors();
      const all = ((list.data as unknown as { all?: FactorLite[] } | null)?.all ?? []);
      for (const f of all) {
        if (f.factor_type === "totp" && f.status === "unverified") {
          await supabase.auth.mfa.unenroll({ factorId: f.id });
        }
      }
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: "totp",
        friendlyName: `Aegisora ${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      });
      if (!on) return;
      if (error) { setMsg(error.message); return; }
      setFactorId(data.id);
      setQr(data.totp.qr_code);
      setSecret(data.totp.secret);
    })();
    return () => { on = false; };
  }, []);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!factorId) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
      if (res.error) throw res.error;
      onDone();
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Verification failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Frame title="Secure your account" sub="Owners and admins need an authenticator app to approve and change policies">
      {qr ? <div className="qrbox"><img src={qr} alt="Authenticator QR code" /></div> : <p className="mute">Preparing...</p>}
      {secret && <div className="secret">{secret}</div>}
      <p className="note">Scan the code with Google Authenticator, 1Password or similar, then enter the 6-digit code.</p>
      <form className="form" onSubmit={submit}>
        <input
          className="field otp" required inputMode="numeric" autoComplete="one-time-code"
          placeholder="000000" value={code} onChange={(e) => setCode(e.target.value.replace(/\s/g, ""))}
        />
        {msg && <div className="err" role="alert">{msg}</div>}
        <button className="btn" type="submit" disabled={busy || !factorId}>{busy ? "Please wait..." : "Turn on"}</button>
      </form>
      <div className="links">
        <button className="link" type="button" onClick={onSkip}>Skip for now</button>
        <button className="link" type="button" onClick={() => void supabase.auth.signOut()}>Sign out</button>
      </div>
    </Frame>
  );
}

export default function AccessGate({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const userId = session?.user.id ?? null;
  const [phase, setPhase] = useState<Phase>("checking");

  const check = useCallback(async () => {
    if (!userId) return;
    const mem = await supabase.from("workspace_members").select("workspace_id,role").eq("user_id", userId);
    if (mem.error) { setPhase("ok"); return; } // never lock the user out because of a read error
    const rows = (mem.data ?? []) as { workspace_id: string; role: string }[];
    if (rows.length === 0) { setPhase("workspace"); return; }
    const privileged = rows.some((r) => ["OWNER", "ADMIN"].includes(String(r.role).toUpperCase()));
    if (privileged && sessionStorage.getItem("aegisora.mfaSkip") !== "1") {
      const aal = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (!aal.error && aal.data.currentLevel === "aal1") {
        setPhase(aal.data.nextLevel === "aal2" ? "mfa-verify" : "mfa-enroll");
        return;
      }
    }
    setPhase("ok");
  }, [userId]);

  useEffect(() => {
    setPhase("checking");
    void check();
  }, [check]);

  if (phase === "checking") return <div className="center full"><Logo className="logo"  alt="Aegisora" /></div>;
  if (phase === "workspace") return <CreateWorkspace />;
  if (phase === "mfa-verify") return <MfaVerify onDone={() => setPhase("ok")} />;
  if (phase === "mfa-enroll") {
    return (
      <MfaEnroll
        onDone={() => setPhase("ok")}
        onSkip={() => { sessionStorage.setItem("aegisora.mfaSkip", "1"); setPhase("ok"); }}
      />
    );
  }
  return <>{children}</>;
}