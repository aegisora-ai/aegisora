"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Check,
  X,
  ChevronDown,
  ShieldCheck,
  Zap,
  Activity,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";

export default function BusinessPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does Aegisora monitor AI agents?",
      a: "Aegisora integrates directly with your AI infrastructure. We track agent prompts, outputs, tool executions, and data access in real-time, automatically matching them against your enterprise governance and security policies.",
    },
    {
      q: "Does Aegisora track a compliance score?",
      a: "Yes. Aegisora compiles a health, security, and compliance score for every deployed AI agent and your overall infrastructure. It aggregates risk signals into a comprehensive profile, giving you a clear view of your AI security posture.",
    },
    {
      q: "Is our prompt and enterprise data safe?",
      a: "Absolutely. Your data is encrypted in transit and at rest, and handled in strict accordance with enterprise security standards. We never use your corporate data to train our own models; your environment remains completely isolated.",
    },
    {
      q: "What governance tools do you offer?",
      a: "Aegisora provides real-time monitoring dashboards, automated policy enforcement APIs, risk scoring, and comprehensive audit logging tailored for regulatory compliance and enterprise security teams.",
    },
    {
      q: "Are there limits to what AI platforms you support?",
      a: "We integrate seamlessly with major LLM providers, open-source models, and custom autonomous agent frameworks built within your organization.",
    },
    {
      q: "What type of risks do you prevent?",
      a: "We actively prevent data exfiltration, prompt injection, unauthorized tool execution, hallucinations, and any violations of your internal AI usage policies.",
    },
    {
      q: "How do I onboard my organization?",
      a: "You can sign up directly through our portal for standard deployments or contact our enterprise sales team for custom, infrastructure-wide integrations.",
    },
  ];

  const comparisonTable = [
    { feature: "Automated policy enforcement", without: false, with: true },
    { feature: "Agent action & output monitoring", without: false, with: true },
    { feature: "Real-time compliance alerts", without: false, with: true },
    { feature: "Automated rogue agent blocking", without: false, with: true },
    { feature: "Incident resolution tracking", without: false, with: true },
    {
      feature: "Continuous vulnerability scanning",
      without: false,
      with: true,
    },
    { feature: "Complete decision audit trail", without: false, with: true },
    {
      feature: "Monitored AI agents",
      without: "Depends on workload",
      with: "Unlimited",
    },
    {
      feature: "Time to detect policy violation",
      without: "Weeks / Months (If monitoring)",
      with: "Milliseconds-Minutes",
    },
    {
      feature: "Time to block risky action",
      without: "Days",
      with: "Real-time",
    },
    {
      feature: "Prioritization",
      without: '"What looks scary"',
      with: "Risk & intent scoring",
    },
    {
      feature: "Reporting",
      without: "Quarterly decks (If any)",
      with: "Real-time dashboard + audit reports",
    },
    {
      feature: "SLA",
      without: "None",
      with: "99.9% monitoring uptime (target)",
    },
  ];

  return (
    <main className="min-h-screen w-full flex flex-col justify-between font-sans bg-zinc-950 text-white pt-24 selection:bg-blue-500/30 relative overflo w-hidden">
      {/* Arkaplan Işık Efektleri */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1200px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(0,102,238,0.15)_0%,transparent_70%)] pointer-events-none" />

      {/* Üst Menü / Navbar */}
      <Navbar />

      {/* Hero / Business Başlığı */}
      <div className="relative z-10 max-w-[800px] w-full mx-auto px-6 pt-16 pb-16 text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] font-mono font-semibold uppercase tracking-widest text-blue-400 bg-blue-950/80 border b order-blue-800/50 px-3.5 py-1.5 rounded-full mb-8 inline-block"
        >
          Aegisora for Enterprise
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl font-serif tracking-tight mb-6 leading-[1.1] text-white"
        >
          Protect your enterprise by governing your AI agents.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm sm:text-base font-mono text-zinc-400 leading-relaxed mb-8 max-w-xl mx-auto"
        >
          Aegisora monitors AI behavior across your infrastructure so you can
          spot risks early, enforce compliance automatically, and deploy
          autonomous systems with confidence.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link href="/contact/sales">
            <button className="px-8 py-4 bg-blue-600 text-white text-[13px] font-medium rounded-full hover:bg-blue-500 transition-all shado w-[0_8px_20px_rgba(0,102,238,0.25)] hover:shado w-[0_10px_25px_rgba(0,102,238,0.35)] cursor-pointer outline-none flex items-center gap-2 mx-auto">
              <ShieldCheck className="w-4 h-4" />
              <span>Contact Enterprise Sales</span>
            </button>
          </Link>
        </motion.div>
      </div>

      {/* İstatistikler Bölümü */}
      <div className="relative z-10 max-w-[1000px] w-full mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="p-8 rounded-[2rem] bg-zinc-900/40 backdrop-blur-md border b order-zinc-800 flex flex-col justify-between shado w-lg shado w-black/20 hover:b order-zinc-700 transition-colors group"
        >
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">
            Cost of a compliance breach
          </span>
          <div>
            <p className="text-4xl font-serif font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">
              US$ 4.45M
            </p>
            <p className="text-xs font-mono text-zinc-400 mt-2 leading-relaxed">
              Average per incident—driven by data leaks, unauthorized access,
              and regulatory fines.
            </p>
          </div>
          <Link
            href="#"
            className="text-xs font-mono underline mt-6 text-blue-400 hover:text-white transition-colors"
          >
            Report Details
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="p-8 rounded-[2rem] bg-zinc-900/40 backdrop-blur-md border b order-zinc-800 flex flex-col justify-between shado w-lg shado w-black/20 hover:b order-zinc-700 transition-colors group"
        >
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">
            Shadow AI impact
          </span>
          <div>
            <p className="text-4xl font-serif font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">
              83%
            </p>
            <p className="text-xs font-mono text-zinc-400 mt-2 leading-relaxed">
              Of enterprises have unmonitored AI deployments. Unapproved
              autonomous agents are actively interacting with corporate data.
            </p>
          </div>
          <Link
            href="#"
            className="text-xs font-mono underline mt-6 text-blue-400 hover:text-white transition-colors"
          >
            Source: Enterprise AI Study
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="p-8 rounded-[2rem] bg-zinc-900/40 backdrop-blur-md border b order-zinc-800 flex flex-col justify-between shado w-lg shado w-black/20 hover:b order-zinc-700 transition-colors group"
        >
          <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest mb-4">
            Detection time
          </span>
          <div>
            <p className="text-4xl font-serif font-bold mb-2 text-white group-hover:text-blue-400 transition-colors">
              258 Days
            </p>
            <p className="text-xs font-mono text-zinc-400 mt-2 leading-relaxed">
              To identify rogue AI behavior. Unmonitored models can expose
              sensitive data or break compliance for months.
            </p>
          </div>
          <Link
            href="#"
            className="text-xs font-mono underline mt-6 text-blue-400 hover:text-white transition-colors"
          >
            Source: IBM Security Report
          </Link>
        </motion.div>
      </div>

      {/* Panel Önizleme / Dashboard Mockup */}
      <div className="relative z-10 max-w-[900px] w-full mx-auto px-6 py-16 text-center">
        <h2 className="text-3xl sm:text-4xl font-serif tracking-tight mb-4 text-white">
          Complete visibility into your AI infrastructure
        </h2>
        <p className="text-xs font-mono text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed">
          Connect your environments, define your policies, and let Aegisora map
          every point of AI interaction across your organization. Get a unified
          view of what&apos;s secure, what&apos;s vulnerable, and what needs
          immediate action — without weeks of setup.
        </p>

        {/* Dashboard Mockup Kartı (Enterprise Dark Mode) */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="p-8 rounded-[2rem] bg-zinc-900/60 backdrop-blur-xl border b order-zinc-800 text-left shado w-2xl relative overflo w-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(0,102,238,0.08)_0%,transparent_50%)] pointer-events-none" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4 relative z-10">
            <span className="text-sm font-semibold text-white tracking-wide flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-400" />
              AI Governance Health
            </span>
            <span className="px-3 py-1 bg-emerald-500/10 border b order-emerald-500/20 text-emerald-400 text-[10px] rounded-full font-mono uppercase tracking-widest flex items-center gap-2 shado w-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry Active
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-8 mb-8 pb-8 b order-b b order-zinc-800/80 relative z-10">
            <div className="w-24 h-24 rounded-full b order-[3px] b order-emerald-500/80 flex flex-col items-center justify-center font-serif text-3xl font-bold bg-zinc-950 text-white shado w-[0_0_20px_rgba(16,185,129,0.15)] relative">
              <div className="absolute inset-2 rounded-full border b order-dashed b order-emerald-500/30 animate-[spin_10s_linear_infinite]" />
              98
              <span className="text-[9px] font-mono text-emerald-400/80 uppercase tracking-widest mt-1">
                Secure
              </span>
            </div>
            <div className="text-center sm:text-left">
              <h4 className="text-white font-medium mb-1">
                Optimal Fleet Status
              </h4>
              <span className="text-[11px] font-mono text-zinc-500">
                Score: 98 / 100 • 0 Critical Incidents Detected
              </span>
            </div>
          </div>

          <div className="space-y-3 relative z-10">
            <div className="p-4 rounded-xl bg-zinc-950/60 border b order-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono shado w-inner gap-3">
              <span className="text-zinc-200">
                Customer Support Agent{" "}
                <span className="text-zinc-500 text-[10px] ml-2 tracking-widest uppercase">
                  v2.1 (Active Proxy)
                </span>
              </span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5 uppercase tracking-widest text-[10px] bg-emerald-500/10 px-2 py-1 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Compliant
              </span>
            </div>
            <div className="p-4 rounded-xl bg-zinc-950/60 border b order-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between text-xs font-mono shado w-inner gap-3">
              <span className="text-zinc-200">
                Internal Data Analyst{" "}
                <span className="text-zinc-500 text-[10px] ml-2 tracking-widest uppercase">
                  v1.4 (Active Proxy)
                </span>
              </span>
              <span className="text-emerald-400 font-semibold flex items-center gap-1.5 uppercase tracking-widest text-[10px] bg-emerald-500/10 px-2 py-1 rounded">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                Compliant
              </span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Plan Karşılaştırma Tablosu */}
      <div className="relative z-10 max-w-[1000px] w-full mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif tracking-tight mb-4 text-white">
            With Aegisora, you deploy AI with confidence
          </h2>
          <p className="text-xs font-mono text-zinc-400 max-w-lg mx-auto leading-relaxed">
            Aegisora gives your team continuous visibility into AI behavior, so
            you can detect risks earlier, enforce rules instantly, and scale
            with absolute security.
          </p>
        </div>

        {/* Tablo (Enterprise Dark Mode) */}
        <div className="w-full overflo w-x-auto rounded-[2rem] border b order-zinc-800/80 bg-zinc-900/40 backdrop-blur-md p-6 sm:p-8 shado w-xl">
          <table className="w-full text-left font-mono text-xs whitespace-nowrap sm:whitespace-normal">
            <thead>
              <tr className="b order-b b order-zinc-800 pb-4">
                <th className="pb-5 font-semibold text-white uppercase tracking-widest text-[10px]">
                  Enterprise capabilities
                </th>
                <th className="pb-5 font-semibold text-center text-zinc-500 uppercase tracking-widest text-[10px]">
                  Without Aegisora
                </th>
                <th className="pb-5 font-semibold text-center text-blue-400 uppercase tracking-widest text-[10px] bg-blue-950/20 rounded-t-xl px-2">
                  <span className="flex items-center justify-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" />
                    With Aegisora
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {comparisonTable.map((row, idx) => (
                <tr
                  key={idx}
                  className="group hover:bg-zinc-800/20 transition-colors"
                >
                  <td className="py-5 font-medium text-zinc-200">
                    {row.feature}
                  </td>
                  <td className="py-5 text-center text-zinc-500">
                    {typeof row.without === "boolean" ? (
                      row.without ? (
                        <Check className="w-4 h-4 mx-auto text-emerald-500" />
                      ) : (
                        <X className="w-4 h-4 mx-auto text-zinc-600" />
                      )
                    ) : (
                      row.without
                    )}
                  </td>
                  <td className="py-5 text-center font-semibold text-blue-300 bg-blue-950/10 px-2 group-last:rounded-b-xl">
                    {typeof row.with === "boolean" ? (
                      row.with ? (
                        <Check
                          className="w-4 h-4 mx-auto text-blue-400"
                          strokeWidth={3}
                        />
                      ) : (
                        <X
                          className="w-4 h-4 mx-auto text-red-500"
                          strokeWidth={3}
                        />
                      )
                    ) : (
                      row.with
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Team Invite Bölümü */}
      <div className="relative z-10 max-w-[800px] w-full mx-auto px-6 py-20 text-center">
        <div className="bg-zinc-900/60 border b order-zinc-800 rounded-[2.5rem] p-12 backdrop-blur-md shado w-2xl">
          <h2 className="text-3xl font-serif tracking-tight mb-4 text-white">
            Deploy governance in minutes.
          </h2>
          <p className="text-sm font-mono text-zinc-400 mb-10 max-w-md mx-auto leading-relaxed">
            Connect your infrastructure, set your policies, and let Aegisora
            start monitoring your AI agents. You&apos;ll get a clear view of
            what&apos;s active, what&apos;s compliant, and what needs
            action—without weeks of setup.
          </p>
          <Link href="/contact/sales">
            <button className="px-8 py-3.5 bg-white text-black text-[13px] font-bold rounded-full hover:bg-zinc-200 transition-all shado w-lg cursor-pointer outline-none flex items-center gap-2 mx-auto">
              <span>Start Enterprise Trial</span>
            </button>
          </Link>
        </div>
      </div>

      {/* Questions? (FAQ Akordeon) */}
      <div className="relative z-10 max-w-[800px] w-full mx-auto px-6 py-16">
        <div className="mb-10 text-center">
          <h2 className="text-4xl font-serif tracking-tight text-white mb-2">
            Questions?
          </h2>
          <p className="text-lg font-serif italic text-zinc-500">
            We&apos;ve got answers.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="border b order-zinc-800/80 rounded-2xl overflo w-hidden bg-zinc-900/40 backdrop-blur-sm transition-colors hover:b order-zinc-700"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full p-5 text-left flex items-center justify-between font-medium text-[13.5px] cursor-pointer hover:bg-zinc-800/40 transition-colors outline-none text-zinc-200"
              >
                <span>{faq.q}</span>
                <ChevronDown
                  className={`w-4 h-4 transition-transform duration-300 text-blue-400 ${
                    openFaq === idx ? "rotate-180" : ""
                  }`}
                />
              </button>
              <AnimatePresence>
                {openFaq === idx && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="px-5 pb-5 text-[13px] font-mono text-zinc-400 leading-relaxed b order-t b order-zinc-800/60 pt-4"
                  >
                    {faq.a}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>

      {/* Yenilenmiş Aegisora Ana Footer (Dark Mode, Yeni Logo & GitHub) */}
      <footer className="relative z-10 w-full b order-t py-16 px-6 mt-20 b order-zinc-800 bg-zinc-950">
        <div className="max-w-[1100px] mx-auto flex flex-col items-center">
          {/* Logo Alanı */}
          <Link
            href="/"
            className="flex items-center gap-3 group cursor-pointer mb-6 outline-none"
          >
            <div className="relative w-8 h-8 flex items-center justify-center">
              <Image
                src="/logo-white.png"
                alt="Aegisora Logo"
                fill
                className="object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                sizes="32px"
              />
            </div>
            <span className="text-xl font-serif font-bold tracking-tight text-white">
              Aegisora
            </span>
          </Link>

          <p className="text-[13px] text-zinc-500 font-mono text-center max-w-[500px] leading-relaxed">
            You deserve control over your autonomous systems. Aegisora
            intercepts unauthorized tool calls, enforces dynamic zero-trust
            policies, and helps keep raw payloads within your perimeter.
          </p>

          <div className="flex items-center gap-5 text-zinc-500 mt-8 mb-16">
            <Link
              href="https://aegisora.ai"
              target="_blank" rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors outline-none"
            >
              <svg
                className="w-[20px] h-[20px]"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                viewBox="0 0 24 24"
              >
                <circle cx="12" cy="12" r="10" />
                <line x1="2" y1="12" x2="22" y2="12" />
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
              </svg>
            </Link>
            <Link
              href="https://x.com/aegisora_ai"
              target="_blank" rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors outline-none"
            >
              <svg
                className="w-[16px] h-[16px]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z" />
              </svg>
            </Link>
            <Link
              href="https://www.linkedin.com/company/aegisora"
              target="_blank" rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors outline-none"
            >
              <svg
                className="w-[20px] h-[20px]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.847-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.588 0 4.257 2.36 4.257 5.39v6.351zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
              </svg>
            </Link>
            <Link
              href="https://github.com/aegisora"
              target="_blank" rel="noopener noreferrer"
              className="hover:text-blue-400 transition-colors outline-none"
            >
              <svg
                className="w-[20px] h-[20px]"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"
                />
              </svg>
            </Link>
          </div>

          <div className="w-full grid grid-cols-2 md:grid-cols-6 gap-8 pt-10 b order-t b order-zinc-800/80 text-[11.5px] font-mono text-zinc-500">
            <div className="flex flex-col gap-2.5">
              <span className="font-bold text-zinc-300 mb-1">Company</span>
              <Link
                href="/about"
                className="hover:text-white transition-colors"
              >
                About
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Careers
              </Link>
              <Link href="/blog" className="hover:text-white transition-colors">
                Blog
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="font-bold text-zinc-300 mb-1">Help</span>
              <Link
                href="/contact/support"
                className="hover:text-white transition-colors"
              >
                Support
              </Link>
              <Link href="#" className="hover:text-white transition-colors">
                Status
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="font-bold text-zinc-300 mb-1">Security</span>
              <Link
                href="/security"
                className="hover:text-white transition-colors"
              >
                Our Practices
              </Link>
              <Link
                href="/legal/gdpr"
                className="hover:text-white transition-colors"
              >
                GDPR
              </Link>
              <Link
                href="/legal/dpa"
                className="hover:text-white transition-colors"
              >
                DPA
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="font-bold text-zinc-300 mb-1">Product</span>
              <Link
                href="/get-started"
                className="hover:text-white transition-colors"
              >
                Sign up
              </Link>
              <Link
                href="/login"
                className="hover:text-white transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/business"
                className="hover:text-white transition-colors"
              >
                For businesses
              </Link>
              <Link
                href="/pricing"
                className="hover:text-white transition-colors"
              >
                Pricing
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="font-bold text-zinc-300 mb-1">Contact</span>
              <Link
                href="/contact/sales"
                className="hover:text-white transition-colors"
              >
                Contact Sales
              </Link>
              <Link
                href="/contact/business-inquiry"
                className="hover:text-white transition-colors"
              >
                Business inquiry
              </Link>
              <Link
                href="/contact/partnership"
                className="hover:text-white transition-colors"
              >
                Partnership
              </Link>
            </div>
            <div className="flex flex-col gap-2.5">
              <span className="font-bold text-zinc-300 mb-1">Legal</span>
              <Link
                href="/legal/dpa"
                className="hover:text-white transition-colors"
              >
                Acceptable Use
              </Link>
              <Link
                href="/legal/gdpr"
                className="hover:text-white transition-colors"
              >
                Terms of Service
              </Link>
            </div>
          </div>

          <div className="w-full flex flex-col md:flex-row items-center justify-between pt-8 pb-2 mt-12 b order-t b order-zinc-800/80 text-[11px] font-mono text-zinc-500">
            <span className="mb-4 md:mb-0">
              © 2026 Aegisora. All rights reserved.
            </span>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-zinc-300 transition-colors">
                AI Info
              </Link>
              <Link href="#" className="hover:text-zinc-300 transition-colors">
                AI Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  );
}
