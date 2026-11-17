import { useCallback, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Btn, Field, Notice, PageHead } from "../ui/kit";

type Factor = { id: string; status: string; factor_type: string };

export default function Security() {
  const [aal, setAal] = useState("aal1");
  const [factors, setFactors] = useState<Factor[]>([]);
  const [enroll, setEnroll] = useState<{ id: string; qr: string; secret: string } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const load = useCallback(async () => {
    const lvl = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    setAal(lvl.data?.currentLevel ?? "aal1");
    const list = await supabase.auth.mfa.listFactors();
    const all = (list.data?.all ?? []) as unknown as Factor[];
    setFactors(all.filter((f) => f.factor_type === "totp"));
  }, []);

  useEffect(() => { void load(); }, [load]);

  const verified = factors.filter((f) => f.status === "verified");

  async function startEnroll() {
    setBusy(true); setErr(null);
    for (const f of factors.filter((x) => x.status !== "verified")) {
      await supabase.auth.mfa.unenroll({ factorId: f.id });
    }
    const { data, error } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Aegisora " + new Date().toISOString().slice(0, 16),
    });
    setBusy(false);
    if (error || !data) { setErr(error?.message ?? "Could not start setup."); return; }
    setEnroll({ id: data.id, qr: data.totp.qr_code, secret: data.totp.secret });
    setCode("");
  }

  async function confirm(factorId: string) {
    setBusy(true); setErr(null);
    const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.trim() });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    setEnroll(null); setCode("");
    await load();
  }

  return (
    <>
      <PageHead title="Security" subtitle="Two-step verification unlocks API keys, approvals, policies and team changes." />
      <div className="decide">
        <h3>Session security</h3>
        {aal === "aal2" ? (
          <p>Verified. This session can manage keys, approvals and policies.</p>
        ) : (
          <Notice tone="warn">This session is email-code only (aal1). Admin actions are locked until you verify.</Notice>
        )}

        {aal !== "aal2" && verified.length > 0 && !enroll && (
          <>
            <Field label="6-digit code from your authenticator app">
              <input className="inp mono" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
            </Field>
            <div className="row-btns">
              <Btn kind="primary" disabled={busy || code.trim().length !== 6} onClick={() => void confirm(verified[0].id)}>Verify this session</Btn>
            </div>
          </>
        )}

        {verified.length === 0 && !enroll && (
          <div className="row-btns">
            <Btn kind="primary" disabled={busy} onClick={() => void startEnroll()}>Set up authenticator app</Btn>
          </div>
        )}

        {enroll && (
          <>
            <p>1. Scan this QR code with Google Authenticator, Microsoft Authenticator or 1Password.</p>
            <img src={enroll.qr} alt="Authenticator QR code" width={180} height={180} style={{ background: "#fff", padding: 8, borderRadius: 8 }} />
            <p className="mute small-text">Cannot scan? Enter this key manually: <span className="mono">{enroll.secret}</span></p>
            <p>2. Enter the 6-digit code it shows.</p>
            <Field label="Code">
              <input className="inp mono" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" />
            </Field>
            <div className="row-btns">
              <Btn kind="primary" disabled={busy || code.trim().length !== 6} onClick={() => void confirm(enroll.id)}>Confirm and enable</Btn>
            </div>
          </>
        )}
        {err && <div className="err">{err}</div>}
      </div>
    </>
  );
}