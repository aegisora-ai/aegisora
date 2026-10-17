"use client";
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ShieldCheck, FileCheck, Lock, Server, ArrowRight, ExternalLink } from "lucide-react";

export default function TrustCenterPage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] font-sans">
      <Navbar />

      {/* Hero Section */}
      <section className="bg-slate-900 text-white py-24 px-6 b order-b b order-slate-800">
        <div className="max-w-[1000px] mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border b order-white/20 mb-8">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span className="text-[13px] font-bold tracking-wider uppercase text-slate-200">Aegisora Trust Center</span>
          </div>
          <h1 className="text-[44px] md:text-[64px] font-black tracking-tight mb-6 leading-tight">Security & Privacy <br/>at the Core</h1>
          <p className="text-[18px] md:text-[20px] text-slate-400 font-medium max-w-2xl mx-auto leading-relaxed">
            We hold ourselves to the highest standards of data protection. Aegisora is engineered to secure your AI workflows without compromising your proprietary data.
          </p>
        </div>
      </section>

      {/* Compliance Certifications */}
      <section className="py-20 px-6">
        <div className="max-w-[1200px] mx-auto">
          <h2 className="text-[24px] font-bold text-slate-900 mb-8 b order-b b order-slate-200 pb-4">Global Compliance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white border b order-slate-200 p-8 rounded-2xl shado w-sm">
              <div className="w-14 h-14 bg-blue-50 rounded-xl flex items-center justify-center mb-6 border b order-blue-100">
                <FileCheck className="w-7 h-7 text-[#0066FF]" />
              </div>
              <h3 className="text-[20px] font-bold text-slate-900 mb-3">SOC 2 Readiness</h3>
              <p className="text-[15px] text-slate-600 leading-relaxed mb-6">Independently audited to ensure we maintain strict security, availability, and confidentiality controls.</p>
              <button className="text-[14px] font-bold text-[#0066FF] flex items-center gap-1.5 hover:underline">Request Report <ArrowRight className="w-4 h-4"/></button>
            </div>
            <div className="bg-white border b order-slate-200 p-8 rounded-2xl shado w-sm">
              <div className="w-14 h-14 bg-emerald-50 rounded-xl flex items-center justify-center mb-6 border b order-emerald-100">
                <Lock className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-[20px] font-bold text-slate-900 mb-3">GDPR Support</h3>
              <p className="text-[15px] text-slate-600 leading-relaxed mb-6">Designed to support EU data protection (GDPR) obligations. We process data transparently and provide complete user control.</p>
              <button className="text-[14px] font-bold text-[#0066FF] flex items-center gap-1.5 hover:underline">View DPA <ArrowRight className="w-4 h-4"/></button>
            </div>
            <div className="bg-white border b order-slate-200 p-8 rounded-2xl shado w-sm">
              <div className="w-14 h-14 bg-rose-50 rounded-xl flex items-center justify-center mb-6 border b order-rose-100">
                <Server className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="text-[20px] font-bold text-slate-900 mb-3">HIPAA (roadmap)</h3>
              <p className="text-[15px] text-slate-600 leading-relaxed mb-6">Aegisora enterprise environments support Business Associate Agreements (BAAs) for healthcare workloads.</p>
              <button className="text-[14px] font-bold text-[#0066FF] flex items-center gap-1.5 hover:underline">Learn More <ArrowRight className="w-4 h-4"/></button>
            </div>
          </div>
        </div>
      </section>

      {/* Security Features */}
      <section className="py-12 px-6 pb-32">
        <div className="max-w-[800px] mx-auto bg-white border b order-slate-200 rounded-2xl shado w-sm overflo w-hidden">
          <div className="p-8 b order-b b order-slate-100 bg-slate-50">
            <h2 className="text-[24px] font-bold text-slate-900">Platform Security</h2>
            <p className="text-[15px] text-slate-500 mt-2">How we protect your data at the infrastructure level.</p>
          </div>
          <div className="divide-y divide-slate-100">
            <div className="p-6 flex items-start gap-4">
               <ShieldCheck className="w-6 h-6 text-slate-400 shrink-0" />
               <div>
                 <h4 className="text-[16px] font-bold text-slate-900 mb-1">Zero Data Retention (ZDR)</h4>
                 <p className="text-[14px] text-slate-600">Aegisora does not store your LLM prompts or responses. Data is processed in-memory for validation and immediately discarded.</p>
               </div>
            </div>
            <div className="p-6 flex items-start gap-4">
               <Lock className="w-6 h-6 text-slate-400 shrink-0" />
               <div>
                 <h4 className="text-[16px] font-bold text-slate-900 mb-1">Encryption In Transit & At Rest</h4>
                 <p className="text-[14px] text-slate-600">All traffic is secured via TLS 1.3. Persistent configuration data is encrypted at rest using AES-256 block-level encryption.</p>
               </div>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
