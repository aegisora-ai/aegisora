import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import logo from "../assets/logo";
import TitleBar from "../components/TitleBar";
import { configured, supabase } from "../lib/supabase";

export default function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState<"code" | "password">("code");
  const [step, setStep] = useState<"email" | "verify">("email");
  const [email, setEmail] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      if (!configured) throw new Error("Supabase is not configured. Check the .env file.");
      if (mode === "password") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: secret });
        if (error) throw error;
        nav("/app", { replace: true });
      } else if (step === "email") {
        const { error } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
        if (error) throw error;
        setSecret("");
        setStep("verify");
      } else {
        const { error } = await supabase.auth.verifyOtp({ email, token: secret.trim(), type: "email" });
        if (error) throw error;
        nav("/app", { replace: true });
      }
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  function switchMode() {
    setMode(mode === "code" ? "password" : "code");
    setStep("email");
    setSecret("");
    setMsg(null);
  }

  const showSecret = mode === "password" || step === "verify";
  const label = mode === "password" ? "Sign in" : step === "email" ? "Continue with email" : "Verify code";

  return (
    <div className="window">
      <TitleBar />
      <main className="center">
        <img className="logo small" src={logo} alt="Mosell" />
        <h1 className="serif">{step === "verify" ? "Check your email" : "Welcome to Mosell"}</h1>
        <p className="mute">
          {step === "verify" ? `Enter the code we sent to ${email}` : "Sign in with your Aegisora account"}
        </p>
        <form className="form" onSubmit={submit}>
          <input
            className="field" type="email" required autoFocus placeholder="Email address"
            value={email} onChange={(e) => setEmail(e.target.value)} disabled={step === "verify"}
          />
          {showSecret && (
            <input
              className="field" required autoFocus={step === "verify"}
              type={mode === "password" ? "password" : "text"}
              inputMode={mode === "password" ? undefined : "numeric"}
              autoComplete={mode === "password" ? "current-password" : "one-time-code"}
              placeholder={mode === "password" ? "Password" : "Verification code"}
              value={secret} onChange={(e) => setSecret(e.target.value)}
            />
          )}
          {msg && <div className="err" role="alert">{msg}</div>}
          <button className="btn" type="submit" disabled={busy}>{busy ? "Please wait..." : label}</button>
        </form>
        <div className="links">
          <button className="link" type="button" onClick={switchMode}>
            {mode === "code" ? "Use password instead" : "Use email code instead"}
          </button>
          <button className="link" type="button" onClick={() => window.mosell?.openExternal("https://www.aegisora.org")}>
            Create an account
          </button>
        </div>
      </main>
    </div>
  );
}