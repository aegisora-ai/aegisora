"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import {
  Send,
  CheckCircle2,
  Handshake,
  ShieldCheck,
  Loader2,
  Check,
} from "lucide-react";
import Navbar from "@/components/Navbar";

export default function PartnershipPage() {
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    companyName: "",
    message: "",
    accepted: false,
  });
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.message) {
      alert("Please fill in all required fields.");
      return;
    }
    if (!formData.accepted) {
      alert("You must accept the terms and conditions.");
      return;
    }

    setIsLoading(true);
    // Simüle edilmiş kurumsal ortaklık başvuru süreci
    setTimeout(() => {
      setIsLoading(false);
      setIsSubmitted(true);
    }, 1500);
  };

  return (
    <main className="min-h-screen w-full flex flex-col justify-between font-sans bg-zinc-950 text-white pt-28 selection:bg-blue-500/30 relative overflo w-hidden">
      {/* Arkaplan Işık Efektleri */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[500px] bg-[radial-gradient(ellipse_at_top,rgba(0,102,238,0.15)_0%,transparent_70%)] pointer-events-none" />

      {/* Üst Menü / Navbar */}
      <Navbar />

      {/* Ana İçerik */}
      <div className="relative z-10 max-w-[680px] w-full mx-auto px-4 py-16 flex flex-col items-center">
        <div className="text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-[11px] font-mono font-semibold uppercase tracking-widest text-blue-400 bg-blue-950/80 border b order-blue-800/50 px-3.5 py-1.5 rounded-full mb-6 inline-flex items-center gap-2"
          >
            <Handshake className="w-3.5 h-3.5" />
            Ecosystem & Alliances
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl lg:text-5xl font-serif tracking-tight mb-4 text-white"
          >
            Partner with Aegisora
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[13px] font-mono text-zinc-400 max-w-lg mx-auto leading-relaxed"
          >
            Join the Aegisora partner ecosystem. Whether you&apos;re an AI
            infrastructure provider, MSSP, or technology integrator, let&apos;s
            build the future of secure autonomous AI together.
          </motion.p>
        </div>

        {/* Form Kutusu (Enterprise Dark Mode & Glassmorphism) */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full rounded-[2.5rem] border b order-zinc-800/80 p-8 sm:p-12 shado w-2xl mb-12 bg-zinc-900/40 backdrop-blur-xl relative overflo w-hidden"
        >
          {/* Form İçi İnce Işık */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[300px] h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />

          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 text-center space-y-5"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/10 border b order-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto shado w-[0_0_30px_rgba(16,185,129,0.15)] relative">
                <CheckCircle2 className="w-8 h-8" />
                <div className="absolute inset-0 border b order-emerald-500/30 rounded-full animate-[ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
              </div>
              <h3 className="text-2xl font-serif text-white tracking-tight">
                Partnership Application Received
              </h3>
              <p className="text-[13px] font-mono text-zinc-400 max-w-sm mx-auto leading-relaxed">
                Thank you,{" "}
                <span className="text-white">{formData.fullName}</span>. Our
                partner channel management team will review your ecosystem
                proposal and reach out shortly.
              </p>
              <button
                onClick={() => {
                  setIsSubmitted(false);
                  setFormData({
                    fullName: "",
                    email: "",
                    companyName: "",
                    message: "",
                    accepted: false,
                  });
                }}
                className="mt-6 px-6 py-3 bg-zinc-950 border b order-zinc-800 text-zinc-300 text-xs font-mono rounded-xl hover:bg-zinc-900 hover:text-white transition-colors cursor-pointer outline-none shado w-sm"
              >
                Submit Another Application
              </button>
            </motion.div>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="flex flex-col gap-6 relative z-10"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {/* Full Name */}
                <div className="flex flex-col gap-2.5">
                  <label className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-widest">
                    Full name
                  </label>
                  <input
                    type="text"
                    placeholder="John Doe"
                    value={formData.fullName}
                    onChange={(e) =>
                      setFormData({ ...formData, fullName: e.target.value })
                    }
                    className="w-full rounded-xl px-4 py-3.5 text-[13px] font-mono border focus:outline-none transition-all focus:b order-blue-500/50 focus:ring-1 focus:ring-blue-500/50 bg-zinc-950/80 b order-zinc-800 text-white placeholder-zinc-600 shado w-inner"
                  />
                </div>

                {/* Email */}
                <div className="flex flex-col gap-2.5">
                  <label className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-widest">
                    Work email
                  </label>
                  <input
                    type="email"
                    placeholder="john@company.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full rounded-xl px-4 py-3.5 text-[13px] font-mono border focus:outline-none transition-all focus:b order-blue-500/50 focus:ring-1 focus:ring-blue-500/50 bg-zinc-950/80 b order-zinc-800 text-white placeholder-zinc-600 shado w-inner"
                  />
                </div>
              </div>

              {/* Company Name */}
              <div className="flex flex-col gap-2.5">
                <label className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-widest">
                  Company Name{" "}
                  <span className="text-zinc-600 font-normal normal-case tracking-normal">
                    (optional)
                  </span>
                </label>
                <input
                  type="text"
                  placeholder="The Company Inc."
                  value={formData.companyName}
                  onChange={(e) =>
                    setFormData({ ...formData, companyName: e.target.value })
                  }
                  className="w-full rounded-xl px-4 py-3.5 text-[13px] font-mono border focus:outline-none transition-all focus:b order-blue-500/50 focus:ring-1 focus:ring-blue-500/50 bg-zinc-950/80 b order-zinc-800 text-white placeholder-zinc-600 shado w-inner"
                />
              </div>

              {/* Message */}
              <div className="flex flex-col gap-2.5">
                <label className="text-[11px] font-mono font-medium text-zinc-400 uppercase tracking-widest">
                  Ecosystem Proposal
                </label>
                <textarea
                  rows={5}
                  placeholder="Tell us about your platform and how we can collaborate..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full rounded-xl p-4 text-[13px] font-mono border focus:outline-none transition-all focus:b order-blue-500/50 focus:ring-1 focus:ring-blue-500/50 resize-none bg-zinc-950/80 b order-zinc-800 text-white placeholder-zinc-600 shado w-inner"
                />
              </div>

              {/* Checkbox */}
              <div className="flex items-start sm:items-center gap-3 pt-2">
                <div className="relative flex items-center justify-center mt-0.5 sm:mt-0">
                  <input
                    type="checkbox"
                    id="accept"
                    checked={formData.accepted}
                    onChange={(e) =>
                      setFormData({ ...formData, accepted: e.target.checked })
                    }
                    className="w-4 h-4 rounded b order-zinc-700 bg-zinc-950 appearance-none checked:bg-blue-500 transition-colors cursor-pointer peer"
                  />
                  <Check
                    className="w-3 h-3 text-white absolute pointer-events-none opacity-0 peer-checked:opacity-100 transition-opacity"
                    strokeWidth={3}
                  />
                </div>
                <label
                  htmlFor="accept"
                  className="text-[11px] font-mono text-zinc-400 cursor-pointer leading-relaxed"
                >
                  I accept the{" "}
                  <Link
                    href="/legal/gdpr"
                    className="text-zinc-300 underline underline-offset-2 hover:text-blue-400 transition-colors"
                  >
                    terms and conditions
                  </Link>{" "}
                  and{" "}
                  <Link
                    href="/legal/gdpr"
                    className="text-zinc-300 underline underline-offset-2 hover:text-blue-400 transition-colors"
                  >
                    privacy policy
                  </Link>
                  .
                </label>
              </div>

              {/* Send Application Butonu */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-medium text-[13px] rounded-xl transition-all shado w-[0_8px_20px_rgba(0,102,238,0.2)] hover:shado w-[0_10px_25px_rgba(0,102,238,0.3)] cursor-pointer mt-4 outline-none flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Transmitting Application...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>Submit Partnership Application</span>
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] font-mono text-zinc-500 uppercase tracking-widest mt-2">
                <ShieldCheck className="w-3 h-3 text-emerald-500" />
                <span>End-to-End Encrypted</span>
              </div>
            </form>
          )}
        </motion.div>
      </div>

      {/* Yenilenmiş Aegisora Ana Footer (Dark Mode, Yeni Logo & GitHub) */}
      <footer className="relative z-10 w-full b order-t py-16 px-6 mt-10 b order-zinc-800 bg-zinc-950">
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
