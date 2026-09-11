"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Loader2 } from "lucide-react";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" xmlns="http://www.w3.org/2000/svg"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
);
const GithubIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.463-1.11-1.463-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.379.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.418 22 12c0-5.523-4.477-10-10-10z"/></svg>
);
const DiscordIcon = () => (
  <svg viewBox="0 0 127.14 96.36" width="18" height="18" fill="currentColor" xmlns="http://www.w3.org/2000/svg"><path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.68,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.2,46,96.12,53,91.08,65.69,84.69,65.69Z"/></svg>
);
const SSOIcon = () => (
  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
);

export default function AuthPage() {
  const [mode, setMode] = useState<"signup" | "login">("signup");
  const [region, setRegion] = useState("US");
  const [cloud, setCloud] = useState("GCP");
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isCloudDropdownOpen, setIsCloudDropdownOpen] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert(mode === "signup" ? "Verification email sent!" : "Logged in successfully!");
    }, 1500);
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes float-flow {
          0% { transform: translateY(0) scale(1) translateX(0); opacity: 0.3; }
          33% { transform: translateY(-30px) scale(1.1) translateX(20px); opacity: 0.6; }
          66% { transform: translateY(20px) scale(0.9) translateX(-20px); opacity: 0.8; }
          100% { transform: translateY(0) scale(1) translateX(0); opacity: 0.3; }
        }
        .animated-blob { animation: float-flow 12s infinite ease-in-out; }
        .animated-blob-delay { animation: float-flow 15s infinite ease-in-out reverse; animation-delay: 2s; }
        .animated-blob-slow { animation: float-flow 20s infinite ease-in-out; animation-delay: 4s; }
      `}} />

      <main className="h-screen w-full bg-[#030612] text-white font-sans flex flex-col md:flex-row overflow-hidden">
        <div className="hidden md:flex w-[55%] h-full flex-col justify-between p-12 lg:p-24 relative overflow-hidden bg-[#030612] border-r border-[#1a2b4c]/30">
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
            <div className="absolute left-[-10%] top-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-[radial-gradient(circle_at_center,rgba(0,102,255,0.15)_0%,rgba(0,0,0,0)_60%)] mix-blend-screen"></div>
            <svg className="absolute left-[-5%] top-0 w-[120%] h-[120%] opacity-60" viewBox="0 0 1000 800" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#3ca6ff" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#3ca6ff" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="#3ca6ff" stopOpacity="0" />
                </linearGradient>
              </defs>
              <circle cx="0" cy="400" r="5" fill="#3ca6ff" className="shadow-[0_0_15px_#3ca6ff]" />
              <motion.path fill="none" stroke="url(#flowGrad)" strokeWidth="1.5" animate={{ d: [ "M 0 400 C 200 400, 400 100, 1000 50", "M 0 400 C 250 380, 450 150, 1000 80", "M 0 400 C 200 400, 400 100, 1000 50" ]}} transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }} />
              <motion.path fill="none" stroke="url(#flowGrad)" strokeWidth="2" animate={{ d: [ "M 0 400 C 300 400, 500 300, 1000 250", "M 0 400 C 350 420, 550 280, 1000 220", "M 0 400 C 300 400, 500 300, 1000 250" ]}} transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }} />
              <motion.path fill="none" stroke="url(#flowGrad)" strokeWidth="2.5" animate={{ d: [ "M 0 400 C 400 400, 600 400, 1000 400", "M 0 400 C 400 380, 600 420, 1000 400", "M 0 400 C 400 400, 600 400, 1000 400" ]}} transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }} />
            </svg>
          </div>

          <div className="relative z-10 flex-1 flex flex-col justify-center">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity mb-16 cursor-pointer w-max">
              <Image src="/aegisora-logo-white.png" alt="Aegisora" width={32} height={32} className="object-contain" priority />
              <span className="font-semibold text-[32px] tracking-[-0.03em] leading-none text-white">Aegisora</span>
            </Link>

            <h1 className="text-[48px] lg:text-[60px] font-medium leading-[1.05] tracking-tight mb-8 text-white">
              The platform for <br />
              agent engineering
            </h1>
            <p className="text-[18px] text-white/70 max-w-[500px] leading-relaxed font-mono">
              Observe, evaluate, and deploy your agents. Build agents without code.
            </p>
          </div>
        </div>

        <div className="w-full md:w-[45%] h-full flex items-center justify-center p-6 bg-[#030612] relative z-20 overflow-y-auto hide-scrollbar">
          <Link href="/" className="md:hidden absolute top-6 left-6 flex items-center gap-2 cursor-pointer">
             <Image src="/aegisora-logo-white.png" alt="Aegisora" width={24} height={24} className="object-contain" />
          </Link>

          <div className="w-full max-w-[460px] bg-[#0A0D18] border border-white/5 rounded-[24px] p-8 md:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] my-auto">
            <div className="flex items-center justify-center gap-6 mb-8 border-b border-white/5 pb-4">
              <button onClick={() => setMode("signup")} className={`text-[20px] font-medium transition-colors cursor-pointer ${mode === "signup" ? "text-white" : "text-white/40 hover:text-white/70"}`}>Sign Up</button>
              <button onClick={() => setMode("login")} className={`text-[20px] font-medium transition-colors cursor-pointer ${mode === "login" ? "text-white" : "text-white/40 hover:text-white/70"}`}>Log In</button>
            </div>

            <AnimatePresence mode="wait">
              <motion.div key={mode} initial={{ opacity: 0, x: mode === "signup" ? -10 : 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: mode === "signup" ? 10 : -10 }} transition={{ duration: 0.2 }}>
                <div className="flex flex-col mb-6">
                  <div className="flex items-center justify-center gap-2 mb-4">
                    <span className="text-white/70 text-[13px]">{mode === "signup" ? "First, choose a data region on" : "Data Region on"}</span>
                    <div className="relative">
                      <button onClick={() => setIsCloudDropdownOpen(!isCloudDropdownOpen)} className="flex items-center gap-1.5 text-white text-[13px] font-medium bg-transparent hover:bg-white/5 px-2 py-1 rounded transition-colors cursor-pointer">
                        <GoogleIcon /> {cloud} <ChevronDown size={14} className={isCloudDropdownOpen ? "rotate-180" : ""} />
                      </button>
                      {isCloudDropdownOpen && (
                        <div className="absolute right-0 top-full mt-1 w-32 bg-[#1A1A1A] border border-white/10 rounded-lg shadow-xl overflow-hidden z-50">
                          <button onClick={() => {setCloud("GCP"); setIsCloudDropdownOpen(false)}} className="w-full text-left px-4 py-2 text-[13px] text-white hover:bg-white/10 cursor-pointer">Google Cloud</button>
                          <button onClick={() => {setCloud("AWS"); setIsCloudDropdownOpen(false)}} className="w-full text-left px-4 py-2 text-[13px] text-white hover:bg-white/10 cursor-pointer">AWS</button>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-3">
                    {["US", "EU", "APAC"].map((r) => (
                      <button type="button" key={r} onClick={() => setRegion(r)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-[10px] border text-[13px] font-bold transition-colors cursor-pointer ${region === r ? "bg-transparent border-[#0066FF] text-white" : "bg-transparent border-white/10 text-white/50 hover:border-white/30 hover:text-white"}`}>
                        {region === r && <div className="w-1.5 h-1.5 rounded-full bg-[#0066FF]"></div>}{r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="relative flex items-center py-3 mb-4">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-white/90 text-[13px] font-medium">{mode === "signup" ? "Sign up with" : "Log in with"}</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <button type="button" className="flex items-center justify-center gap-2 bg-[#050810] hover:bg-[#111827] border border-white/10 rounded-[10px] py-3 text-[13px] font-medium transition-colors cursor-pointer"><GoogleIcon /> Google</button>
                  <button type="button" className="flex items-center justify-center gap-2 bg-[#050810] hover:bg-[#111827] border border-white/10 rounded-[10px] py-3 text-[13px] font-medium transition-colors cursor-pointer"><GithubIcon /> GitHub</button>
                  <button type="button" className="flex items-center justify-center gap-2 bg-[#050810] hover:bg-[#111827] border border-white/10 rounded-[10px] py-3 text-[13px] font-medium transition-colors cursor-pointer"><DiscordIcon /> Discord</button>
                  {mode === "login" && (
                    <button type="button" className="flex items-center justify-center gap-2 bg-[#050810] hover:bg-[#111827] border border-white/10 rounded-[10px] py-3 text-[13px] font-medium transition-colors cursor-pointer"><SSOIcon /> SSO</button>
                  )}
                </div>

                <div className="relative flex items-center py-2 mb-5">
                  <div className="flex-grow border-t border-white/10"></div>
                  <span className="flex-shrink-0 mx-4 text-white/50 text-[12px] font-medium">or continue with email</span>
                  <div className="flex-grow border-t border-white/10"></div>
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1">
                    <label className="text-[12px] text-white font-bold">Email</label>
                    <input type="email" required placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full bg-[#050810] border border-white/10 rounded-lg px-4 py-2.5 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-[#0066FF] transition-colors" />
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex justify-between items-center">
                       <label className="text-[12px] text-white font-bold">Password</label>
                       {mode === "login" && <Link href="#" className="text-[11px] text-[#0066FF] hover:underline cursor-pointer">Forgot password?</Link>}
                    </div>
                    <div className="relative">
                      <input type="password" required placeholder="Your password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#050810] border border-white/10 rounded-lg px-4 py-2.5 text-[13px] text-white placeholder-white/30 focus:outline-none focus:border-[#0066FF] transition-colors" />
                      <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white transition-colors cursor-pointer"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg></button>
                    </div>
                  </div>
                  <button type="submit" disabled={isLoading} className="w-full bg-transparent border border-[#0066FF] hover:bg-[#0066FF]/10 text-white font-medium text-[14px] py-2.5 rounded-lg mt-2 transition-colors flex items-center justify-center disabled:opacity-70 cursor-pointer">
                    {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Continue"}
                  </button>
                </form>

                <div className="mt-5 text-center">
                  <p className="text-white/50 text-[13px] mb-5">
                    {mode === "signup" ? "Already have an account? " : "Don't have an account? "}
                    <button onClick={() => setMode(mode === "signup" ? "login" : "signup")} className="text-white hover:underline font-bold cursor-pointer">{mode === "signup" ? "Log in" : "Sign up"}</button>
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </main>
    </>
  );
}
