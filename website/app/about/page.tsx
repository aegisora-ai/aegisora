"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ChevronDown, Sparkles, Shield, Network, Cpu } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";

export default function AboutPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const faqs = [
    {
      q: "How does Aegisora monitor AI agents?",
      a: "Aegisora integrates seamlessly into your AI infrastructure via a local VPC sidecar proxy to monitor agent actions, prompts, and outputs in real-time, instantly matching them against your enterprise security and governance policies.",
    },
    {
      q: "Does Aegisora track a compliance score?",
      a: "Yes. Aegisora compiles a comprehensive health and compliance score for every deployed AI agent and your overall infrastructure, giving your team instant visibility into your risk posture.",
    },
    {
      q: "Is our enterprise data safe?",
      a: "Absolutely. Aegisora is designed to help keep raw payloads within your secure perimeter. Data is encrypted in transit and at rest, handled in strict accordance with enterprise security standards. We never use your proprietary corporate data or agent logs to train our own models.",
    },
    {
      q: "What governance tools do you offer?",
      a: "Aegisora provides real-time monitoring dashboards, automated policy enforcement APIs, continuous vulnerability scanning, and comprehensive immutable audit logs tailored for SOC2 / ISO compliance.",
    },
    {
      q: "Are there limits to the agents you can monitor?",
      a: "Aegisora scales with your enterprise. Whether you have 10 autonomous agents or 10,000, our infrastructure provides continuous monitoring without performance bottlenecks, supporting strict fail-closed enforcement.",
    },
    {
      q: "What type of risks do you prevent?",
      a: "We actively prevent data exfiltration, prompt injection, unauthorized external tool execution, shadow AI routing, and any deviations from your internal AI usage guidelines.",
    },
    {
      q: "How do I onboard my organization?",
      a: "You can start with our developer sandbox to test the platform on a limited scale, or contact our enterprise sales team for a custom, infrastructure-wide deployment.",
    },
  ];

  return (
    <main className="min-h-screen w-full flex flex-col justify-between font-sans bg-zinc-950 text-white pt-24 selection:bg-blue-500/30 relative overflo w-hidden">
      {/* Arkaplan Işık Efektleri */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(0,102,238,0.15)_0%,transparent_70%)] pointer-events-none" />

      {/* Üst Menü / Navbar */}
      <Navbar />

      {/* Hero / Vizyon Bölümü */}
      <div className="relative z-10 max-w-[800px] w-full mx-auto px-6 pt-16 pb-16 text-center">
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[11px] font-mono font-semibold uppercase tracking-widest text-blue-400 bg-blue-950/80 border b order-blue-800/50 px-3.5 py-1.5 rounded-full mb-8 inline-block"
        >
          Company &amp; Vision
        </motion.span>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl sm:text-6xl font-serif tracking-tight mb-8 leading-[1.1] text-white"
        >
          We&apos;re building the foundation of secure autonomous AI
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm sm:text-base font-mono text-zinc-400 leading-relaxed mb-6 max-w-2xl mx-auto"
        >
          In a world where AI agents act autonomously across enterprise
          pipelines, Aegisora ensures they do so safely. We&apos;re crafting a
          control plane where enterprise innovation is never compromised by
          compliance or security blind spots.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-sm sm:text-base font-mono text-zinc-400 leading-relaxed max-w-2xl mx-auto"
        >
          Our runtime guardrails aren&apos;t just about restricting models; they
          give your security and engineering teams the freedom to scale AI with
          total governance and absolute visibility.
        </motion.p>
      </div>

      {/* Our Story Bölümü */}
      <div className="relative z-10 max-w-[720px] w-full mx-auto px-6 py-16 b order-t b order-zinc-800/80">
        <h2 className="text-3xl font-serif tracking-tight mb-6 text-white">
          Our story
        </h2>
        <div className="space-y-6 text-sm font-mono text-zinc-400 leading-relaxed">
          <p>
            At Aegisora, we are driven by a foundational principle: enterprise
            innovation must never compromise operational security. Born from a
            shared frustration with black-box agent models and reactive
            compliance audits, we started as a collective of security
            researchers and systems engineers determined to bring strict order
            to autonomous workflows.
          </p>
          <p>
            What began as deep-dive architectural discussions evolved into a
            mission to redefine AI governance at runtime. We launched Aegisora
            to empower organizations to intercept tool calls, enforce strict
            fail-closed policies, and audit multi-agent ecosystems in real time
            within their own perimeters.
          </p>
          <p>
            Aegisora is much more than a security middleware—it is the
            operational trust layer for the agentic enterprise. We are committed
            to securing your path toward autonomous operations.
          </p>
        </div>
      </div>

      {/* What We Believe Bölümü */}
      <div className="relative z-10 max-w-[900px] w-full mx-auto px-6 py-16">
        <h2 className="text-3xl font-serif tracking-tight mb-10 text-center text-white">
          What We Believe
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-8 rounded-[2rem] bg-zinc-900/40 backdrop-blur-md border b order-zinc-800 flex flex-col justify-between hover:b order-zinc-700 transition-colors group shado w-lg shado w-black/20">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border b order-blue-500/20 flex items-center justify-center mb-6 shado w-sm group-hover:bg-blue-500/20 transition-colors">
              <Network className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-medium mb-3 text-white tracking-tight">
                Total Visibility Into Agentic Workflows
              </h3>
              <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                To scale autonomous systems safely, you must understand every
                reasoning trace, tool invocation, and data payload in real time.
                We empower engineering and SecOps teams with complete,
                uncompromised telemetry.
              </p>
            </div>
          </div>
          <div className="p-8 rounded-[2rem] bg-zinc-900/40 backdrop-blur-md border b order-zinc-800 flex flex-col justify-between hover:b order-zinc-700 transition-colors group shado w-lg shado w-black/20">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border b order-blue-500/20 flex items-center justify-center mb-6 shado w-sm group-hover:bg-blue-500/20 transition-colors">
              <Shield className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-serif font-medium mb-3 text-white tracking-tight">
                Proactive Runtime Governance Is Essential
              </h3>
              <p className="text-xs font-mono text-zinc-400 leading-relaxed">
                Waiting for an AI security incident post-execution exposes your
                core infrastructure to severe risk. Aegisora enforces strict,
                dynamic perimeter policies that neutralize threats before
                execution.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* We're hiring Bölümü */}
      <div className="relative z-10 max-w-[800px] w-full mx-auto px-6 py-24 text-center">
        <div className="bg-zinc-900/40 border b order-zinc-800 rounded-[2.5rem] p-12 backdrop-blur-md">
          <h2 className="text-3xl font-serif tracking-tight mb-4 text-white">
            We&apos;re hiring
          </h2>
          <p className="text-sm font-mono text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed">
            We are scaling our core engineering team and looking for exceptional
            talent passionate about distributed systems and AI safety.
          </p>
          <Link
            href="/contact/sales"
            className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-blue-600 text-white text-[13px] font-medium rounded-full hover:bg-blue-500 transition-all shado w-[0_8px_20px_rgba(0,102,238,0.25)] hover:shado w-[0_10px_25px_rgba(0,102,238,0.35)] cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>View Open Positions</span>
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
            className="flex items-center gap-3 group cursor-pointer mb-6"
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
              className="hover:text-blue-400 transition-colors"
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
              className="hover:text-blue-400 transition-colors"
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
              className="hover:text-blue-400 transition-colors"
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
              className="hover:text-blue-400 transition-colors"
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
        </div>
      </footer>
    </main>
  );
}
