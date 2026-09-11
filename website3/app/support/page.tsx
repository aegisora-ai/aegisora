"use client";

import { Navbar } from "@/components/aegisora/layout/Navbar";
import { Footer } from "@/components/aegisora/layout/Footer";
import { Server } from "lucide-react";

export default function GenericPage() {
  return (
    <main className="min-h-screen bg-[#030612] text-white font-sans flex flex-col relative overflow-hidden">
      <Navbar />
      
      {/* Arka Plan Efekti */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[radial-gradient(circle_at_center,rgba(0,102,255,0.1)_0%,rgba(0,0,0,0)_60%)] pointer-events-none -z-10 mix-blend-screen"></div>

      <section className="flex-1 flex flex-col items-center justify-center pt-[200px] pb-32 text-center px-6 relative z-10">
         <div className="w-16 h-16 bg-[#111624] border border-[#3ca6ff]/30 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(60,166,255,0.2)]">
            <Server className="text-[#3ca6ff]" size={30} />
         </div>
         <h1 className="text-4xl md:text-6xl font-medium tracking-tight mb-6">Support Center</h1>
         <p className="text-white/50 text-lg max-w-[500px] font-mono">
            This section of the Aegisora platform is currently under construction and will be deployed shortly.
         </p>
         <div className="mt-12 inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-full text-white/40 font-mono text-[13px]">
            Status: <span className="text-yellow-500">In Development</span>
         </div>
      </section>

      <div id="dark-section">
        <Footer />
      </div>
    </main>
  );
}
