"use client";
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Shield } from "lucide-react";

export default function EnterprisePage() {
  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] font-sans">
      <Navbar />
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-24 text-center">
        <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
          <Shield className="w-10 h-10 text-[#0066FF]" />
        </div>
        <h1 className="text-[48px] font-black text-slate-900 mb-4 tracking-tight">Aegisora Enterprise</h1>
        <p className="text-[18px] text-slate-600 max-w-2xl mb-8">Dedicated infrastructure, SLA terms per agreement, and advanced policy configurations for the world's most demanding AI environments.</p>
        <button className="px-8 py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-colors">Contact Sales</button>
      </main>
      <Footer />
    </div>
  );
}
