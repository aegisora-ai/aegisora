"use client";

import { Blocks, TestTubes, Rocket, Activity } from "lucide-react";

export default function DocsPage() {
  return (
    <div className="max-w-4xl">
      <h1 className="text-[32px] md:text-[40px] font-bold tracking-tight mb-6">
        The open agent engineering ecosystem
      </h1>
      <p className="text-[16px] text-white/70 leading-relaxed mb-12">
        Aegisora provides open-source, model-agnostic frameworks for building agents. The platform is the framework-agnostic platform for testing, deploying, monitoring, and improving them across the agent development lifecycle. You control every layer of your agent system, and keep improving it with what you learn in production.
      </p>

      <h2 className="text-[24px] font-semibold mb-6">Agent development lifecycle</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Build */}
        <div className="bg-[#0A0D18] border border-white/10 rounded-xl p-6 hover:border-white/30 transition-colors cursor-pointer group">
          <Blocks className="text-white/60 mb-4 group-hover:text-white transition-colors" size={24} />
          <h3 className="text-[16px] font-bold mb-2">Build</h3>
          <p className="text-[14px] text-white/60 mb-4">Build agents with code using Aegisora Core and Deep Agents.</p>
          <span className="text-[13px] text-[#3ca6ff] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Get started &gt;</span>
        </div>

        {/* Test */}
        <div className="bg-[#0A0D18] border border-white/10 rounded-xl p-6 hover:border-white/30 transition-colors cursor-pointer group">
          <TestTubes className="text-white/60 mb-4 group-hover:text-white transition-colors" size={24} />
          <h3 className="text-[16px] font-bold mb-2">Test</h3>
          <p className="text-[14px] text-white/60 mb-4">Evaluate agents with datasets, evaluations, and prompt engineering.</p>
          <span className="text-[13px] text-[#3ca6ff] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Get started &gt;</span>
        </div>

        {/* Deploy */}
        <div className="bg-[#0A0D18] border border-white/10 rounded-xl p-6 hover:border-white/30 transition-colors cursor-pointer group">
          <Rocket className="text-white/60 mb-4 group-hover:text-white transition-colors" size={24} />
          <h3 className="text-[16px] font-bold mb-2">Deploy</h3>
          <p className="text-[14px] text-white/60 mb-4">Deploy and serve agents at scale with production-ready endpoints.</p>
          <span className="text-[13px] text-[#3ca6ff] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Get started &gt;</span>
        </div>

        {/* Monitor */}
        <div className="bg-[#0A0D18] border border-white/10 rounded-xl p-6 hover:border-white/30 transition-colors cursor-pointer group">
          <Activity className="text-white/60 mb-4 group-hover:text-white transition-colors" size={24} />
          <h3 className="text-[16px] font-bold mb-2">Monitor</h3>
          <p className="text-[14px] text-white/60 mb-4">Trace, debug, and observe agents dynamically in production.</p>
          <span className="text-[13px] text-[#3ca6ff] font-medium flex items-center gap-1 group-hover:gap-2 transition-all">Get started &gt;</span>
        </div>
      </div>
    </div>
  );
}
