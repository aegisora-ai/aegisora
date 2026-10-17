"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowUp,
  Shield,
  Server,
  Code,
  Globe,
  Cpu,
  Zap,
  Lock,
  TerminalSquare,
  Binary,
  ShieldAlert,
  CheckCircle2,
  Loader2,
  Terminal,
} from "lucide-react";
import Link from "next/link";

const changingTexts = [
  "Deploy zero-trust policy to engineering swarm...",
  "Intercept all external tool calls containing PII...",
  "Analyze reasoning traces for strict fail-closed enforcement...",
];

const liveTerminalLogs = [
  "[System Boot] Aegisora Enterprise Runtime v3.4 initialized.",
  "[Telemetry] Listening for autonomous agent tool invocations...",
  "[Policy Engine] Zero-trust perimeter active: fail-closed enforced.",
  "[Neural Firewall] 0 unauthorized prompt injection vectors detected.",
  "[Compliance] Immutable audit logging stream operational (demo output).",
];

const AegisoraSpark = ({
  className = "w-4 h-4 text-blue-400",
  isThinking = false,
}) => {
  return (
    <motion.div
      animate={
        isThinking
          ? { rotate: [0, 180, 360], scale: [1, 1.2, 1] }
          : { rotate: 0, scale: 1 }
      }
      transition={
        isThinking
          ? { duration: 2, ease: "linear", repeat: Infinity }
          : { duration: 0.3 }
      }
      className={`flex-shrink-0 ${className}`}
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-full h-full">
        <path d="M11.25 1.5L12.75 1.5L12.75 9L19.5 4.5L20.25 5.5L14.25 10.5L22.5 11.25L22.5 12.75L14.25 13.5L20.25 18.5L19.5 19.5L12.75 15L12.75 22.5L11.25 22.5L11.25 15L4.5 19.5L3.75 18.5L9.75 13.5L1.5 12.75L1.5 11.25L9.75 10.5L3.75 5.5L4.5 4.5L11.25 9L11.25 1.5Z" />
      </svg>
    </motion.div>
  );
};

export default function MadeForAnyone() {
  const router = useRouter();
  const [textIndex, setTextIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [activeLogIndex, setActiveLogIndex] = useState(0);

  useEffect(() => {
    if (isProcessing || isSuccess) return;
    const interval = setInterval(() => {
      setTextIndex((prev) => (prev + 1) % changingTexts.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isProcessing, isSuccess]);

  // Canlı terminal log akışı simülasyonu
  useEffect(() => {
    const logInterval = setInterval(() => {
      setActiveLogIndex((prev) => (prev + 1) % liveTerminalLogs.length);
    }, 2500);
    return () => clearInterval(logInterval);
  }, []);

  const handleProcessAction = () => {
    if (isProcessing || isSuccess) return;

    setIsProcessing(true);

    setTimeout(() => {
      setIsProcessing(false);
      setIsSuccess(true);

      setTimeout(() => {
        router.push("/login");
      }, 1200);
    }, 2500);
  };

  const leftBadges = [
    {
      text: "Security Operations (SecOps)",
      icon: <Shield className="w-3.5 h-3.5 text-blue-400" />,
      top: "10%",
      left: "8%",
    },
    {
      text: "AI Infrastructure Teams",
      icon: <Server className="w-3.5 h-3.5 text-blue-400" />,
      top: "30%",
      left: "18%",
    },
    {
      text: "Machine Learning Engineers",
      icon: <Code className="w-3.5 h-3.5 text-blue-400" />,
      top: "50%",
      left: "2%",
    },
    {
      text: "Enterprise Governance",
      icon: <Globe className="w-3.5 h-3.5 text-blue-400" />,
      top: "70%",
      left: "12%",
    },
    {
      text: "Chief Information Security Officers",
      icon: <Cpu className="w-3.5 h-3.5 text-blue-400" />,
      top: "88%",
      left: "6%",
    },
  ];

  const rightBadges = [
    {
      text: "Data Privacy Officers",
      icon: <Lock className="w-3.5 h-3.5 text-blue-400" />,
      top: "12%",
      right: "8%",
    },
    {
      text: "DevSecOps Engineers",
      icon: <TerminalSquare className="w-3.5 h-3.5 text-blue-400" />,
      top: "32%",
      right: "2%",
    },
    {
      text: "AI Agent Developers",
      icon: <Binary className="w-3.5 h-3.5 text-blue-400" />,
      top: "52%",
      right: "16%",
    },
    {
      text: "Compliance Auditors",
      icon: <ShieldAlert className="w-3.5 h-3.5 text-blue-400" />,
      top: "72%",
      right: "6%",
    },
    {
      text: "Platform Engineering",
      icon: <Zap className="w-3.5 h-3.5 text-blue-400" />,
      top: "90%",
      right: "14%",
    },
  ];

  const renderGridLines = () => {
    const lines = [];
    for (let i = 0; i < 20; i++) {
      lines.push(
        <div
          key={`h-${i}`}
          className="absolute w-full h-[1px] bg-blue-500/10"
          style={{ top: `${(i / 20) * 100}%` }}
        />,
      );
      lines.push(
        <div
          key={`v-${i}`}
          className="absolute h-full w-[1px] bg-blue-500/10"
          style={{ left: `${(i / 20) * 100}%` }}
        />,
      );
    }
    return lines;
  };

  return (
    <section className="relative w-full flex flex-col items-center justify-center pt-24 pb-32 px-6 bg-transparent font-sans z-10 text-white">
      {/* Heading and CTAs */}
      <div className="text-center max-w-3xl mb-16 z-20 flex flex-col items-center">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-blue-400 bg-blue-950/80 border b order-blue-800/50 px-3.5 py-1.5 rounded-full mb-4">
          Enterprise Ecosystem
        </span>

        <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold font-serif text-white leading-[1.1] tracking-tight mb-6">
          Built for AI-Native Enterprises.
        </h2>

        <p className="font-mono text-zinc-400 text-[13px] md:text-[14px] leading-relaxed max-w-[600px] mb-8 font-medium">
          Whether you&apos;re securing a single agent or governing an entire
          swarm of autonomous systems — Aegisora enforces your runtime perimeter
          with strict fail-closed security.
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-medium px-6 py-3 rounded-full transition-colors shado w-lg shado w-blue-600/20 cursor-pointer inline-flex items-center justify-center"
          >
            Explore Architecture
          </Link>
          <Link
            href="/contact/sales"
            className="text-zinc-400 hover:text-white text-[13px] font-medium transition-colors px-2 cursor-pointer inline-flex items-center"
          >
            Contact Sales
          </Link>
        </div>
      </div>

      {/* Floating badges + central card */}
      <div className="relative w-full max-w-[1200px] h-[650px] flex items-center justify-center">
        {/* Left badges */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none z-30">
          {leftBadges.map((badge, idx) => (
            <motion.div
              key={`left-${idx}`}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="absolute bg-zinc-950/90 backdrop-blur-md border b order-zinc-800 shado w-[0_10px_25px_rgba(0,0,0,0.5)] rounded-full px-5 py-2.5 flex items-center gap-3 text-zinc-200 pointer-events-auto hover:bg-zinc-900 hover:b order-blue-500/40 hover:scale-105 transition-all cursor-default"
              style={{ top: badge.top, left: badge.left }}
            >
              <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center border b order-blue-500/20">
                {badge.icon}
              </div>
              <span className="text-[12px] font-mono tracking-tight text-zinc-300">
                {badge.text}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Right badges */}
        <div className="hidden lg:block absolute inset-0 pointer-events-none z-30">
          {rightBadges.map((badge, idx) => (
            <motion.div
              key={`right-${idx}`}
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="absolute bg-zinc-950/90 backdrop-blur-md border b order-zinc-800 shado w-[0_10px_25px_rgba(0,0,0,0.5)] rounded-full px-5 py-2.5 flex items-center gap-3 text-zinc-200 pointer-events-auto hover:bg-zinc-900 hover:b order-blue-500/40 hover:scale-105 transition-all cursor-default"
              style={{ top: badge.top, right: badge.right }}
            >
              <div className="w-6 h-6 rounded-full bg-blue-500/10 flex items-center justify-center border b order-blue-500/20">
                {badge.icon}
              </div>
              <span className="text-[12px] font-mono tracking-tight text-zinc-300">
                {badge.text}
              </span>
            </motion.div>
          ))}
        </div>

        {/* Central interactive card (Dolu ve Canlı Terminal Konsolu) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className={`relative w-full max-w-[380px] h-[540px] bg-zinc-950 rounded-[2.5rem] overflo w-hidden z-20 flex flex-col justify-between p-6 border transition-all duration-500 ${isProcessing ? "b order-blue-500/50 shado w-[0_0_50px_rgba(0,102,238,0.3)]" : isSuccess ? "b order-emerald-500/50 shado w-[0_0_50px_rgba(52,211,153,0.2)]" : "b order-zinc-800 shado w-2xl"}`}
        >
          {/* Neural-network grid overlay */}
          <div className="absolute inset-0 z-0 overflo w-hidden opacity-25">
            {renderGridLines()}
          </div>

          {/* Kart İçi Üst Başlık / Durum Çubuğu */}
          <div className="relative z-20 bg-zinc-900/80 backdrop-blur-md border b order-zinc-800 rounded-2xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-blue-500/10 border b order-blue-500/20 flex items-center justify-center">
                <Terminal className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <div className="flex flex-col text-left">
                <span className="text-xs font-semibold text-white">
                  Runtime Telemetry
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  ● Secure Perimeter Active
                </span>
              </div>
            </div>
            <span className="text-[10px] font-mono bg-blue-950/80 text-blue-400 border b order-blue-800/50 px-2 py-0.5 rounded-full">
              Live Feed
            </span>
          </div>

          {/* Kart İçi Canlı Terminal Log Akışı */}
          <div className="relative z-20 bg-zinc-900/50 backdrop-blur-md border b order-zinc-800/80 rounded-2xl p-4 font-mono text-[11px] text-zinc-300 h-[220px] flex flex-col justify-end overflo w-hidden">
            <div className="absolute top-2.5 left-3 text-[9px] text-zinc-500 uppercase tracking-widest font-bold">
              Autonomous Swarm Stream
            </div>
            <div className="space-y-1.5 pt-4">
              {liveTerminalLogs.slice(0, activeLogIndex + 1).map((log, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="truncate"
                >
                  <span className="text-blue-400 mr-1.5">{">"}</span>
                  {log}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Scanner sweep effect */}
          <AnimatePresence>
            {isProcessing && (
              <motion.div
                initial={{ top: "0%", opacity: 0 }}
                animate={{ top: "100%", opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute left-0 w-full h-[2px] bg-blue-400 shado w-[0_0_20px_#3b82f6] z-10"
              />
            )}
          </AnimatePresence>

          {/* Processing / success overlay */}
          <AnimatePresence>
            {(isProcessing || isSuccess) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute inset-x-6 top-1/2 -translate-y-1/2 z-30 flex flex-col items-center justify-center bg-zinc-900/95 backdrop-blur-xl border b order-zinc-800 rounded-2xl p-6 shado w-2xl"
              >
                {isProcessing ? (
                  <>
                    <AegisoraSpark
                      isThinking={true}
                      className="w-10 h-10 text-blue-400 mb-4"
                    />
                    <span className="text-blue-400 font-mono text-[11px] uppercase tracking-widest animate-pulse">
                      Executing Protocol...
                    </span>
                    <span className="text-zinc-400 font-mono text-[10px] mt-2 text-center">
                      Enforcing strict fail-closed matrix
                      <br />
                      within secure perimeter.
                    </span>
                  </>
                ) : (
                  <>
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center mb-4 border b order-emerald-500/30"
                    >
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    </motion.div>
                    <span className="text-emerald-400 font-mono text-[11px] uppercase tracking-widest">
                      Redirecting to Login
                    </span>
                    <span className="text-zinc-400 font-mono text-[10px] mt-2 text-center">
                      Launching secure gateway...
                    </span>
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Alt Kısım: İnteraktif Arama / Komut Çubuğu */}
          <div className="relative z-30 w-full bg-zinc-900/90 backdrop-blur-2xl border b order-zinc-800 rounded-[1.25rem] p-2.5 pl-4 flex items-center gap-3 shado w-2xl">
            <div className="w-5 h-5 rounded-full bg-blue-500/10 flex items-center justify-center border b order-blue-500/20">
              <AegisoraSpark isThinking={!isProcessing && !isSuccess} />
            </div>

            <div className="flex-1 relative h-5 overflo w-hidden flex items-center">
              <AnimatePresence mode="wait">
                <motion.p
                  key={
                    isProcessing
                      ? "processing"
                      : isSuccess
                        ? "success"
                        : textIndex
                  }
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                  className={`text-[11px] font-mono absolute w-full truncate ${isProcessing ? "text-blue-400" : isSuccess ? "text-emerald-400" : "text-zinc-300"}`}
                >
                  <span className="mr-2 text-zinc-500">{">"}</span>
                  {isProcessing
                    ? "Applying fail-closed governance..."
                    : isSuccess
                      ? "Redirecting to portal..."
                      : changingTexts[textIndex]}
                </motion.p>
              </AnimatePresence>
            </div>

            <button
              onClick={handleProcessAction}
              disabled={isProcessing || isSuccess}
              aria-label="Run demo and continue to login"
              className={`w-8 h-8 rounded-full transition-all flex items-center justify-center flex-shrink-0 shado w-md outline-none
                ${isProcessing || isSuccess ? "bg-zinc-800 border b order-zinc-700 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-500 cursor-pointer"}
              `}
            >
              {isProcessing ? (
                <Loader2 className="w-4 h-4 text-blue-300 animate-spin" />
              ) : isSuccess ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <ArrowUp className="w-4 h-4 text-white" />
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
