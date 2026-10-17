"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import Link from "next/link";
import {
  Activity,
  Lock,
  Shield,
  Terminal,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";

const architectureTabs = [
  {
    id: "proxy",
    title: "Zero-Trust Proxy",
    subtitle: "Active payload interception",
    icon: Activity,
    badge: "Runtime Enforced",
    description:
      "Zero-latency interception of every reasoning trace, API request, and autonomous tool call across your entire agentic ecosystem.",
    codeSnippet: `[Aegisora Core] Intercepting tool call: execute_sql_query()\n-> Payload inspected: 0 PII leaks detected.\n-> Status: ALLOWED (Policy #402-B)`,
  },
  {
    id: "masking",
    title: "PII Masking Engine",
    subtitle: "Automated data redaction",
    icon: Lock,
    badge: "GDPR support",
    description:
      "Instantly detect, redact, and tokenize sensitive enterprise data (PII, API keys, secrets) before it ever reaches external LLM endpoints.",
    codeSnippet: `[Masking Guard] Scanning outbound payload...\n-> Detected: SSN & Corporate Email.\n-> Action: Tokenized securely. [REDACTED_ENTITY_77]`,
  },
  {
    id: "firewall",
    title: "Neural Firewall",
    subtitle: "Threat & injection prevention",
    icon: Shield,
    badge: "Zero-Day Shield",
    description:
      "Block adversarial prompt injections, model jailbreaks, and unauthorized privilege escalations autonomously in real-time.",
    codeSnippet: `[Neural Firewall] Threat signature matched: Prompt Injection (Jailbreak v4).\n-> Action: BLOCKED instantly.\n-> Alert dispatched to SecOps Slack channel.`,
  },
  {
    id: "command",
    title: "Command Center",
    subtitle: "Centralized compliance oversight",
    icon: Terminal,
    badge: "SOC 2 readiness",
    description:
      "Centralized operational oversight. Monitor active agents, blocked threats, and compliance scores in a single unified glass pane.",
    codeSnippet: `[Telemetry Hub] Syncing immutable audit logs...\n-> Active Swarm Nodes: 14\n-> Compliance Score: N/A (demo output)`,
  },
];

export default function PrivacyAutopilot() {
  const containerRef = useRef(null);
  const isInView = useInView(containerRef, { once: false, margin: "100px" });
  const [activeTab, setActiveTab] = useState(0);

  const currentFeature = architectureTabs[activeTab];
  const IconComponent = currentFeature.icon;

  return (
    <section
      ref={containerRef}
      className="w-full py-28 px-6 bg-transparent font-sans flex flex-col items-center relative z-10 overflo w-hidden text-white"
    >
      {/* Üst Başlık Alanı */}
      <div className="text-center mb-16 flex flex-col items-center max-w-3xl mx-auto">
        <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-blue-400 bg-blue-950/80 border b order-blue-800/50 px-3.5 py-1.5 rounded-full mb-4">
          Zero-Trust Architecture
        </span>
        <h2 className="text-4xl sm:text-5xl font-bold font-serif mb-5 tracking-tight text-white">
          Built for absolute scale & control.
        </h2>
        <p className="font-mono text-[13px] sm:text-sm text-zinc-400 max-w-xl leading-relaxed mb-8">
          Move beyond passive monitoring. Aegisora actively intercepts reasoning
          traces and enforces strict security policies at runtime.
        </p>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-medium px-6 py-3 rounded-full transition-all shado w-lg shado w-blue-600/20 cursor-pointer outline-none inline-flex items-center justify-center gap-2"
          >
            Explore Architecture <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="https://github.com/ozereray/aegisora.ai"
            target="_blank" rel="noopener noreferrer"
            className="text-zinc-400 hover:text-white text-[13px] font-medium px-4 py-2 transition-colors cursor-pointer outline-none inline-flex items-center justify-center"
          >
            Read the Docs
          </Link>
        </div>
      </div>

      {/* Ana İnteraktif Mimari Konsolu */}
      <div className="w-full max-w-[1100px] bg-zinc-950/80 backdrop-blur-2xl border b order-zinc-800/80 rounded-[2.5rem] p-6 sm:p-10 shado w-[0_20px_50px_rgba(0,0,0,0.5)] grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
        {/* Sol Sütun: Özellik Seçim Sekmeleri */}
        <div className="lg:col-span-5 flex flex-col gap-3">
          {architectureTabs.map((tab, idx) => {
            const TabIcon = tab.icon;
            const isActive = activeTab === idx;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(idx)}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl transition-all duration-300 flex items-start gap-4 cursor-pointer outline-none border ${
                  isActive
                    ? "bg-zinc-900 b order-blue-500/50 shado w-[0_10px_30px_rgba(0,102,238,0.15)]"
                    : "bg-zinc-950/40 b order-zinc-900 hover:bg-zinc-900/50 hover:b order-zinc-800"
                }`}
              >
                <div
                  className={`p-2.5 rounded-xl border mt-0.5 ${isActive ? "bg-blue-600/10 b order-blue-500/30 text-blue-400" : "bg-zinc-900 b order-zinc-800 text-zinc-400"}`}
                >
                  <TabIcon className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className={`text-sm sm:text-base font-semibold ${isActive ? "text-white" : "text-zinc-300"}`}
                    >
                      {tab.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-zinc-900 border b order-zinc-800 text-zinc-400">
                      {tab.badge}
                    </span>
                  </div>
                  <p className="text-xs text-zinc-400 font-mono">
                    {tab.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Sağ Sütun: Canlı Terminal & Açıklama Ekranı */}
        <div className="lg:col-span-7 bg-zinc-900/90 border b order-zinc-800 rounded-3xl p-6 sm:p-8 flex flex-col justify-between min-h-[400px] relative overflo w-hidden shado w-inner">
          <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[80px] rounded-full pointer-events-none" />

          <div>
            <div className="flex items-center justify-between mb-6 pb-4 b order-b b order-zinc-800">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yello w-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
                <span className="text-xs font-mono text-zinc-400 ml-2">
                  aegisora-runtime-v2.4
                </span>
              </div>
              <span className="text-xs font-mono text-blue-400 flex items-center gap-1.5 bg-blue-950/60 border b order-blue-800/40 px-3 py-1 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5" /> Active Node
              </span>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentFeature.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 tracking-tight">
                    {currentFeature.title}
                  </h3>
                  <p className="text-zinc-300 text-xs sm:text-sm leading-relaxed">
                    {currentFeature.description}
                  </p>
                </div>

                {/* Simüle Edilmiş Terminal Çıktısı */}
                <div className="bg-zinc-950 border b order-zinc-800/80 rounded-2xl p-4 sm:p-5 font-mono text-xs text-blue-300/90 leading-relaxed shado w-2xl relative overflo w-hidden">
                  <div className="absolute top-2 right-3 text-[10px] text-zinc-600 uppercase tracking-widest font-bold">
                    Live Stream
                  </div>
                  <pre className="whitespace-pre-wrap font-mono">
                    {currentFeature.codeSnippet}
                  </pre>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="mt-8 pt-4 b order-t b order-zinc-800/80 flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Security Standard: ISO 27001 / SOC 2 (roadmap)</span>
            <span className="text-emerald-400">● System Operational</span>
          </div>
        </div>
      </div>
    </section>
  );
}
