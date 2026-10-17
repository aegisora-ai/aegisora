"use client";

import { useSyncExternalStore } from "react";
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Menu, X, Sun, Moon, Check, Zap, Shield, Building, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function PricingPage() {
  const mounted = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [annual, setAnnual] = useState(true);
  const { theme, setTheme } = useTheme();
return (
    <div className="min-h-screen bg-white dark:bg-[#0a0a0c] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-100 dark:selection:bg-blue-900/50 flex flex-col">

      {/* HEADER */}
      <header className="flex items-center justify-between px-6 py-4 b order-b b order-slate-200 dark:b order-white/10 bg-white/90 dark:bg-[#0a0a0c]/90 backdrop-blur-md sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 outline-none">
          <img src="/aegisora-logo-blue.png" alt="Aegisora" className="h-7 w-auto dark:hidden" />
          <img src="/aegisora-logo-white.png" alt="Aegisora" className="h-7 w-auto hidden dark:block" />
          <span className="text-[18px] font-bold text-slate-900 dark:text-white tracking-tight">Aegisora AI</span>
        </Link>
        <nav className="hidden lg:flex items-center gap-6 text-[14px] font-semibold text-slate-600 dark:text-slate-300">
          <Link href="/platform/security" className="hover:text-blue-600 transition-colors">Product</Link>
          <Link href="/hub" className="hover:text-blue-600 transition-colors">Hub</Link>
          <Link href="/docs" className="hover:text-blue-600 transition-colors">Docs</Link>
          <Link href="/pricing" className="text-blue-600 dark:text-blue-400">Pricing</Link>
        </nav>
        <div className="flex items-center gap-4 lg:gap-6">
          {mounted && (<button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors">{theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}</button>)}
          <Link href="/login" className="hidden lg:block text-[14px] font-semibold text-slate-900 dark:text-white hover:text-blue-600 transition-colors">Log in</Link>
          <Link href="/contact" className="hidden lg:block bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-md text-[14px] font-bold transition-colors">Contact Sales</Link>
          <button onClick={() => setIsMobileMenuOpen(true)} className="lg:hidden p-1 text-slate-500"><Menu className="w-6 h-6" /></button>
        </div>
      </header>

      {/* MOBILE MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.2 }} className="fixed inset-0 z-[100] bg-[#f8fafc] dark:bg-[#0a0a0c] flex flex-col overflo w-y-auto lg:hidden">
            <div className="flex items-center justify-between px-6 py-5 b order-b b order-slate-200 dark:b order-white/10 bg-white dark:bg-[#0d0d0f]">
               <Link href="/" className="flex items-center outline-none"><span className="text-[18px] font-bold">Aegisora AI</span></Link>
               <button onClick={() => setIsMobileMenuOpen(false)} className="p-1 text-slate-500"><X className="w-7 h-7" /></button>
            </div>
            <div className="flex flex-col px-4 py-4 flex-1 gap-2">
               <Link href="/platform/security" className="px-4 py-3 text-[16px] font-bold">Product</Link>
               <Link href="/hub" className="px-4 py-3 text-[16px] font-bold">Hub</Link>
               <Link href="/docs" className="px-4 py-3 text-[16px] font-bold">Docs</Link>
               <Link href="/pricing" className="px-4 py-3 text-[16px] font-bold text-blue-600">Pricing</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 py-20 px-6">
        <div className="max-w-[1200px] mx-auto text-center mb-16">
          <h1 className="text-[40px] md:text-[64px] font-bold text-slate-900 dark:text-white tracking-tight leading-[1.1] mb-6">
            Secure your AI <br className="hidden md:block" /> without slowing down.
          </h1>
          <p className="text-[18px] md:text-[20px] text-slate-600 dark:text-slate-400 max-w-2xl mx-auto mb-10">
            Transparent pricing designed for scale. Start for free, upgrade when you hit production volumes, or deploy in your own VPC for maximum security.
          </p>

          <div className="inline-flex items-center p-1 bg-slate-100 dark:bg-[#111113] rounded-xl border b order-slate-200 dark:b order-slate-800">
            <button onClick={() => setAnnual(false)} className={`px-6 py-2.5 rounded-lg text-[14px] font-bold transition-all ${!annual ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shado w-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>Monthly</button>
            <button onClick={() => setAnnual(true)} className={`px-6 py-2.5 rounded-lg text-[14px] font-bold transition-all flex items-center gap-2 ${annual ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shado w-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}>
              Annually <span className="px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[10px] uppercase tracking-wider">Save 20%</span>
            </button>
          </div>
        </div>

        {/* PRICING CARDS */}
        <div className="max-w-[1200px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">

          {/* Developer */}
          <div className="bg-white dark:bg-[#111113] border b order-slate-200 dark:b order-white/10 rounded-3xl p-8 flex flex-col">
            <div className="mb-8">
              <div className="flex items-center gap-2 text-slate-500 mb-4"><Zap className="w-5 h-5"/> <span className="font-bold uppercase tracking-wider text-[12px]">Developer</span></div>
              <div className="text-[40px] font-bold text-slate-900 dark:text-white mb-2">$0</div>
              <p className="text-[14px] text-slate-500">Perfect for prototyping and testing local AI agents.</p>
            </div>
            <Link href="/login" className="w-full py-3.5 rounded-xl border b order-slate-200 dark:b order-white/10 font-bold text-slate-900 dark:text-white text-center hover:bg-slate-50 dark:hover:bg-white/5 transition-colors mb-8">Start Building</Link>
            <ul className="space-y-4 text-[14px] text-slate-600 dark:text-slate-400 flex-1">
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-500 shrink-0"/> Up to 10,000 requests / mo</li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-500 shrink-0"/> Access to 60+ Hub Validators</li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-500 shrink-0"/> Standard Latency (~10ms)</li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-emerald-500 shrink-0"/> Community Discord Support</li>
            </ul>
          </div>

          {/* Scale */}
          <div className="bg-slate-900 dark:bg-slate-800 rounded-3xl p-8 flex flex-col border b order-blue-500 shado w-2xl relative transform md:-translate-y-4">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-500 text-white px-4 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider">Most Popular</div>
            <div className="mb-8">
              <div className="flex items-center gap-2 text-blue-400 mb-4"><Shield className="w-5 h-5"/> <span className="font-bold uppercase tracking-wider text-[12px]">Scale</span></div>
              <div className="text-[40px] font-bold text-white mb-2 flex items-end gap-2">${annual ? '899' : '1,129'}<span className="text-[16px] text-slate-400 font-normal mb-2">/mo</span></div>
              <p className="text-[14px] text-slate-400">For production AI workloads requiring high availability.</p>
            </div>
            <Link href="/login" className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 font-bold text-white text-center transition-colors mb-8">Upgrade to Scale</Link>
            <ul className="space-y-4 text-[14px] text-slate-300 flex-1">
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-blue-400 shrink-0"/> Up to 2.5M requests / mo</li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-blue-400 shrink-0"/> Custom Python/TS Validators</li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-blue-400 shrink-0"/> Low Latency Edge Network (&lt;2ms)</li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-blue-400 shrink-0"/> 7-day Audit Log Retention</li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-blue-400 shrink-0"/> Priority Email Support</li>
            </ul>
          </div>

          {/* Enterprise */}
          <div className="bg-white dark:bg-[#111113] border b order-slate-200 dark:b order-white/10 rounded-3xl p-8 flex flex-col">
            <div className="mb-8">
              <div className="flex items-center gap-2 text-slate-900 dark:text-white mb-4"><Building className="w-5 h-5"/> <span className="font-bold uppercase tracking-wider text-[12px]">Enterprise</span></div>
              <div className="text-[40px] font-bold text-slate-900 dark:text-white mb-2">Custom</div>
              <p className="text-[14px] text-slate-500">For strictly regulated industries (Finance, Mobility, Health).</p>
            </div>
            <Link href="/contact" className="w-full py-3.5 rounded-xl border b order-slate-200 dark:b order-white/10 font-bold text-slate-900 dark:text-white text-center hover:bg-slate-50 dark:hover:bg-white/5 transition-colors mb-8">Contact Sales</Link>
            <ul className="space-y-4 text-[14px] text-slate-600 dark:text-slate-400 flex-1">
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-slate-400 shrink-0"/> Unlimited volume</li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-slate-400 shrink-0"/> VPC & On-Premise Deployment</li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-slate-400 shrink-0"/> SAML SSO & Advanced RBAC</li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-slate-400 shrink-0"/> Unlimited WORM Audit Logs</li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-slate-400 shrink-0"/> SOC 2 / ISO 26262 evidence mapping</li>
              <li className="flex items-start gap-3"><Check className="w-5 h-5 text-slate-400 shrink-0"/> Dedicated Solutions Engineer</li>
            </ul>
          </div>

        </div>
      </main>
    </div>
  );
}
