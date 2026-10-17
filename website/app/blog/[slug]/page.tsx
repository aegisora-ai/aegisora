"use client";

import Link from "next/link";
import Image from "next/image";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles, Terminal } from "lucide-react";
import Navbar from "@/components/Navbar";

export default function BlogPostPage() {
  const params = useParams();
  const slug = params?.slug || "security-insights";

  return (
    <main className="min-h-screen w-full flex flex-col justify-between font-sans bg-zinc-950 text-white pt-28 selection:bg-blue-500/30 relative overflo w-hidden">
      {/* Arkaplan Işık Efektleri */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(0,102,238,0.1)_0%,transparent_70%)] pointer-events-none" />

      {/* Üst Menü / Navbar */}
      <Navbar />

      {/* Blog İçerik Alanı */}
      <div className="relative z-10 max-w-[760px] w-full mx-auto px-6 py-12">
        {/* Geri Dönüş Linki */}
        <motion.div
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-10"
        >
          <Link
            href="/blog"
            className="inline-flex items-center gap-2 text-xs font-mono text-zinc-500 hover:text-blue-400 transition-colors group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            <span>Back to Intelligence & Insights</span>
          </Link>
        </motion.div>

        {/* Blog Başlığı ve Detayları */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono text-zinc-500 mb-6 uppercase tracking-widest">
            <span>May 18, 2026</span>
            <span className="text-zinc-700">•</span>
            <span className="text-blue-400 font-semibold bg-blue-950/60 border b order-blue-800/50 px-3 py-1 rounded-full">
              Zero-Trust Security
            </span>
            <span className="text-zinc-700 hidden sm:inline">•</span>
            <span className="text-zinc-600 hidden sm:inline lowercase tracking-normal">
              slug: {String(slug)}
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-serif tracking-tight mb-8 leading-tight text-white">
            Securing Autonomous AI Agents: 12 Runtime Vulnerabilities to Watch
          </h1>

          <div className="flex items-center gap-4">
            <div className="w-11 h-11 rounded-full bg-zinc-900 border b order-zinc-800 text-zinc-300 flex items-center justify-center font-mono font-bold text-xs shado w-sm">
              EÖ
            </div>
            <div className="text-left flex flex-col">
              <span className="text-[13px] font-semibold text-white tracking-tight">
                Eray Özer
              </span>
              <span className="text-[11px] font-mono text-blue-400/80">
                Founder & System Architect
              </span>
            </div>
          </div>
        </motion.div>

        {/* Blog Kapak Görseli Simülasyonu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="w-full h-64 sm:h-80 bg-zinc-900/50 rounded-[2rem] mb-12 flex flex-col items-center justify-center border b order-zinc-800/80 shado w-2xl relative overflo w-hidden backdrop-blur-sm"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,102,238,0.15)_0,transparent_70%)] pointer-events-none" />
          <Terminal className="w-8 h-8 text-zinc-700 mb-3 relative z-10" />
          <span className="text-[10px] font-mono text-zinc-500 tracking-widest uppercase relative z-10">
            Aegisora Threat Intelligence Unit
          </span>
        </motion.div>

        {/* Makale Gövdesi */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-8 text-[14px] font-mono text-zinc-400 leading-relaxed"
        >
          <p className="text-zinc-300 text-[15px] leading-loose">
            How do enterprise security teams know if their autonomous AI swarms
            have been compromised? As organizations rapidly deploy LLM agents
            with native tool-calling capabilities, traditional perimeter
            defenses fall short. Hackers and malicious actors are targeting
            reasoning traces rather than standard endpoints.
          </p>

          <div className="space-y-4 pt-6 b order-t b order-zinc-900">
            <h2 className="text-2xl font-serif text-white tracking-tight">
              1. Unexplained Tool Execution & Shadow Workflows
            </h2>
            <p>
              If your AI agents suddenly initiate API requests to unauthorized
              external endpoints or execute database queries outside their
              predefined constitution, your runtime environment may be
              compromised by a sophisticated prompt injection vector.
            </p>
          </div>

          <div className="space-y-4 pt-4">
            <h2 className="text-2xl font-serif text-white tracking-tight">
              2. PII Exfiltration via Hidden Prompts
            </h2>
            <p>
              Attackers frequently embed recursive instructions inside user
              input to trick language models into leaking sensitive customer
              data or internal API keys. Without real-time PII masking at the
              proxy level, these leaks happen invisibly.
            </p>
          </div>

          <div className="space-y-4 pt-4 pb-8 b order-b b order-zinc-900">
            <h2 className="text-2xl font-serif text-white tracking-tight">
              3. Lack of Immutable Audit Trails
            </h2>
            <p>
              Can your SecOps team reconstruct the exact chain of thought that
              led to an autonomous agent decision? If not, meeting compliance
              standards like SOC 2 and GDPR becomes an insurmountable hurdle.
            </p>
          </div>
        </motion.div>

        {/* Yazara Dönüş / Geri Dön Butonu */}
        <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-6">
          <Link
            href="/blog"
            className="text-xs font-mono text-zinc-500 hover:text-blue-400 transition-colors flex items-center gap-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Articles
          </Link>
          <Link
            href="/get-started"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-[13px] font-medium rounded-full transition-all shado w-lg shado w-blue-600/20 outline-none flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4" />
            <span>Secure Your Swarm</span>
          </Link>
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
              target="_blank"
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
              target="_blank"
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
              target="_blank"
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
              target="_blank"
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
