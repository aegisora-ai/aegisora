import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../components/Logo";
import TitleBar from "../components/TitleBar";
import { configured, supabase } from "../lib/supabase";
import "../auth.css";

export default function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"code" | "password">("code");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  async function sendCode() {
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { shouldCreateUser: true },
    });
    if (error) throw error;
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    setInfo(null);
    try {
      if (!configured) throw new Error("Supabase is not configured. Check the .env file.");
      if (mode === "password") {
        const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password: secret });
        if (error) throw error;
        nav("/app", { replace: true });
      } else if (step === "email") {
        await sendCode();
        setSecret("");
        setStep("verify");
      } else {
        const { error } = await supabase.auth.verifyOtp({ email: email.trim(), token: secret.trim(), type: "email" });
        if (error) throw error;
        nav("/app", { replace: true });
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    setBusy(true);
    setMsg(null);
    setInfo(null);
    try {
      await sendCode();
      setInfo("A new code is on its way.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Could not resend the code.");
    } finally {
      setBusy(false);
    }
  }

  function back() {
    setStep("email");
    setSecret("");
    setMsg(null);
    setInfo(null);
  }

  function switchMode() {
    setMode(mode === "code" ? "password" : "code");
    setStep("email");
    setSecret("");
    setMsg(null);
    setInfo(null);
  }

  const showSecret = mode === "password" || step === "verify";
  const label = mode === "password" ? "Sign in" : step === "email" ? "Continue with email" : "Verify code";

  return (
    <div className="window">
      <TitleBar />
      <main className="center">
        <Logo className="logo small"  alt="Aegisora" />
        <h1 className="serif">{step === "verify" ? "Check your email" : "Welcome to Aegisora"}</h1>
        <p className="mute">
          {step === "verify" ? `Enter the code we sent to ${email}` : "Sign in or create your account with your email"}
        </p>
        <form className="form" onSubmit={submit}>
          <input
            className="field" type="email" required autoFocus placeholder="Email address"
            value={email} onChange={(e) => setEmail(e.target.value)} disabled={step === "verify"}
          />
          {showSecret && (
            <input
              className={mode === "code" ? "field otp" : "field"} required autoFocus={step === "verify"}
              type={mode === "password" ? "password" : "text"}
              inputMode={mode === "password" ? undefined : "numeric"}
              autoComplete={mode === "password" ? "current-password" : "one-time-code"}
              placeholder={mode === "password" ? "Password" : "Verification code"}
              value={secret} onChange={(e) => setSecret(e.target.value.replace(/\s/g, ""))}
            />
          )}
          {info && <div className="info">{info}</div>}
          {msg && <div className="err" role="alert">{msg}</div>}
          <button className="btn" type="submit" disabled={busy}>{busy ? "Please wait..." : label}</button>
        </form>
        <div className="links">
          {mode === "code" && step === "verify" ? (
            <>
              <button className="link" type="button" onClick={resend} disabled={busy}>Resend code</button>
              <button className="link" type="button" onClick={back}>Use a different email</button>
            </>
          ) : (
            <button className="link" type="button" onClick={switchMode}>
              {mode === "code" ? "Use password instead" : "Use email code instead"}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}