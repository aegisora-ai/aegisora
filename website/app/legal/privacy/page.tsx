"use client";
import React from "react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen flex flex-col bg-white font-sans">
      <Navbar />
      <div className="max-w-[800px] mx-auto px-6 py-20 flex-1">
        <h1 className="text-[36px] font-black text-slate-900 tracking-tight mb-4">Privacy Policy</h1>
        <p className="text-[14px] text-slate-400 font-medium mb-10">Last updated: August 28, 2026</p>

        <div className="prose prose-slate max-w-none space-y-6 text-[16px] text-slate-700 leading-relaxed">
          <p>
            At Aegisora, accessible from aegisora.org, one of our main priorities is the privacy of our visitors. This Privacy Policy document contains types of information that is collected and recorded by Aegisora and how we use it.
          </p>
          <h2 className="text-[22px] font-bold text-slate-900 pt-4">Zero Data Retention Commitment</h2>
          <p>
            Our core architecture is designed so that LLM payloads processed through our runtime gateway are handled strictly in-memory. We do not store, log, or train models on proprietary enterprise data.
          </p>
          <h2 className="text-[22px] font-bold text-slate-900 pt-4">Log Files</h2>
          <p>
            Aegisora follows a standard procedure of using log files. These files log visitors when they visit websites. The information collected includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date and time stamp, referring/exit pages, and possibly the number of clicks.
          </p>
        </div>
      </div>
      <Footer />
    </div>
  );
}
