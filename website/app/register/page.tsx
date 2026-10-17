"use client";
import React from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import { Check } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] font-sans">
      <Navbar />
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-[900px] bg-white rounded-2xl border b order-slate-200 shado w-xl overflo w-hidden flex flex-col md:flex-row">

          {/* Sol Taraf - Özellikler */}
          <div className="w-full md:w-[400px] bg-slate-900 p-10 text-white flex flex-col justify-between hidden md:flex">
            <div>
              <img src="/logo.png" alt="Aegisora" className="h-8 w-auto mb-10 invert brightness-0" />
              <h2 className="text-[28px] font-bold leading-tight mb-6">Build safer AI with Aegisora Runtime</h2>
              <ul className="space-y-4">
                <li className="flex items-center gap-3 text-slate-300 text-[14px]"><Check className="w-5 h-5 text-[#0066FF]"/> Zero-Trust Architecture</li>
                <li className="flex items-center gap-3 text-slate-300 text-[14px]"><Check className="w-5 h-5 text-[#0066FF]"/> PII Redaction & Detection</li>
                <li className="flex items-center gap-3 text-slate-300 text-[14px]"><Check className="w-5 h-5 text-[#0066FF]"/> Real-time Hallucination Checks</li>
                <li className="flex items-center gap-3 text-slate-300 text-[14px]"><Check className="w-5 h-5 text-[#0066FF]"/> Audit logging to support SOC 2 & HIPAA programs</li>
              </ul>
            </div>
            <div className="mt-12 text-slate-400 text-[12px]">© 2026 Aegisora AI. All rights reserved.</div>
          </div>

          {/* Sağ Taraf - Form */}
          <div className="flex-1 p-8 md:p-12">
            <h1 className="text-[24px] font-black text-slate-900 tracking-tight mb-2">Create your account</h1>
            <p className="text-slate-500 text-[14px] font-medium mb-8">Start securing your AI models in minutes.</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">First Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg border b order-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:b order-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-[14px]" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Last Name</label>
                  <input type="text" className="w-full px-4 py-3 rounded-lg border b order-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:b order-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-[14px]" />
                </div>
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Work Email</label>
                <input type="email" className="w-full px-4 py-3 rounded-lg border b order-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:b order-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-[14px]" />
              </div>
              <div>
                <label className="block text-[12px] font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Password</label>
                <input type="password" className="w-full px-4 py-3 rounded-lg border b order-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:b order-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 text-[14px]" />
              </div>

              <Link href="/hub" className="block w-full text-center py-3 bg-[#FFC107] hover:bg-[#FFCA28] text-slate-900 rounded-lg font-bold text-[14px] transition-colors mt-6 shado w-sm">
                Get Started for Free
              </Link>
            </div>

            <div className="mt-8 pt-6 b order-t b order-slate-100 text-center">
              <p className="text-[14px] text-slate-600 font-medium">
                Already have an account? <Link href="/login" className="text-[#0066FF] font-bold hover:underline">Log In</Link>
              </p>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
