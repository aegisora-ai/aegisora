"use client";

import { Navbar } from "@/components/aegisora/layout/Navbar";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, ChevronDown, Globe, Shield, Lock, FileText } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const principles = [
  {
    title: "Build secure by default",
    content: "We're here to build the foundational security layer for the AI era. Security cannot be an afterthought; it must be embedded at the execution boundary. We aim high and don't settle for 'good enough' when it comes to enterprise safety."
  },
  {
    title: "Cryptographic transparency",
    content: "Trust is built on verifiable proof, not promises. Every decision, interception, and execution is hashed and logged immutably. We operate in the light so our customers can deploy agents with total confidence."
  },
  {
    title: "Maximum agency with guardrails",
    content: "We believe in empowering AI, not crippling it. Our goal is to provide the maximum possible autonomy to agents by wrapping them in impenetrable, policy-driven guardrails. Control enables scale."
  },
  {
    title: "Run to the roar",
    content: "We tackle the hardest problems in AI safety head-on. As the landscape of autonomous agents evolves at breakneck speed, we lean into the complexity, anticipating vulnerabilities before they are exploited."
  }
];

export default function AboutPage() {
  const [openPrinciple, setOpenPrinciple] = useState<number | null>(0);

  const togglePrinciple = (index: number) => {
    setOpenPrinciple(openPrinciple === index ? null : index);
  };

  return (
    <main className="relative min-h-screen bg-[#050505] text-white font-sans overflow-hidden">
      <Navbar />

      {/* ========================================================= */}
      {/* 1. HERO SECTION */}
      {/* ========================================================= */}
      <section className="pt-40 pb-20 px-6 max-w-[1200px] mx-auto text-center flex flex-col items-center">
        <div className="border border-white/10 bg-white/5 px-3 py-1 rounded-full text-white/70 text-[12px] font-mono uppercase tracking-widest mb-8">
          Company
        </div>
        <h1 className="text-[40px] sm:text-[56px] md:text-[72px] font-medium leading-[1.1] tracking-[-0.03em] mb-6 max-w-[900px]">
          Enabling every company to <span className="text-[#3ca6ff]">secure</span> their intelligence
        </h1>
        <p className="text-[18px] md:text-[22px] text-white/70 max-w-[800px] leading-relaxed mb-16">
          Aegisora provides the execution boundary platform and cryptographic policy frameworks teams need to build, control, and secure their autonomous agent intelligence.
        </p>

        {/* Hero Image / Team Placeholder */}
        <div className="w-full h-[300px] md:h-[500px] bg-[#0A0A0A] border border-white/10 rounded-2xl relative overflow-hidden shadow-2xl flex items-center justify-center group">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent"></div>
          <Shield className="w-24 h-24 text-white/5 group-hover:text-[#3ca6ff]/20 transition-colors duration-700" />
          <div className="absolute bottom-6 left-6 text-white/40 font-mono text-sm">AEGISORA TEAM 2026</div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 2. OUR MISSION */}
      {/* ========================================================= */}
      <section className="py-24 px-6 max-w-[1200px] mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div>
            <h2 className="text-[32px] md:text-[48px] font-medium tracking-tight mb-8">Our mission</h2>
            <div className="text-white/70 text-[16px] md:text-[18px] leading-relaxed space-y-6">
              <p>
                We believe that autonomous AI agents are extremely powerful. They are even more powerful when they can operate freely, knowing that a flawless execution boundary protects the enterprise from unintended actions.
              </p>
              <p>
                Generic AI can answer questions, but real agentic advantage comes from taking action—querying production databases, calling financial APIs, and modifying infrastructure. Aegisora gives companies absolute control over the layers that matter, so they can deploy agents and keep innovating without the fear of catastrophic breaches.
              </p>
              <p>
                Our mission is to enable every company to secure their own autonomous intelligence.
              </p>
            </div>
          </div>
          <div className="h-[400px] bg-[#0A0A0A] border border-white/10 rounded-2xl relative overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 bg-gradient-to-tr from-[#3ca6ff]/10 to-transparent"></div>
             <Lock className="w-16 h-16 text-[#3ca6ff]/40" />
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 3. THE STORY */}
      {/* ========================================================= */}
      <section className="py-24 px-6 max-w-[1200px] mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 md:gap-24 items-center">
          <div className="order-2 md:order-1 h-[400px] bg-[#0A0A0A] border border-white/10 rounded-2xl relative overflow-hidden flex items-center justify-center">
             <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(60,166,255,0.1)_0%,rgba(0,0,0,0)_70%)]"></div>
             <FileText className="w-16 h-16 text-[#3ca6ff]/40" />
          </div>
          <div className="order-1 md:order-2">
            <h2 className="text-[32px] md:text-[48px] font-medium tracking-tight mb-8">The Aegisora story</h2>
            <div className="text-white/70 text-[16px] md:text-[18px] leading-relaxed space-y-6">
              <p>
                Aegisora started as a dedicated project to address the most glaring vulnerability in the generative AI boom: the lack of a secure execution boundary for autonomous agents.
              </p>
              <p>
                As frameworks like LangChain and AutoGPT democratized agent creation in 2023 and 2024, the industry realized that building agents was easy, but trusting them with API keys and database credentials was terrifying. We saw a massive gap in tooling for testing, debugging, and fundamentally isolating agent actions.
              </p>
              <p>
                Today, we work with leading enterprises to provide the ultimate safety net. We ingest millions of execution traces daily, enforcing policies and providing cryptographic evidence for every tool call. We're headquartered globally, with a vision to make AI action completely fearless.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 4. OPERATING PRINCIPLES */}
      {/* ========================================================= */}
      <section className="py-24 px-6 max-w-[1200px] mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
          <div className="md:col-span-4">
            <h2 className="text-[32px] md:text-[48px] font-medium tracking-tight leading-[1.1] sticky top-32">
              Our operating principles
            </h2>
          </div>
          <div className="md:col-span-8 flex flex-col">
            {principles.map((principle, index) => (
              <div key={index} className="border-b border-white/10 last:border-0">
                <button 
                  onClick={() => togglePrinciple(index)}
                  className="w-full flex items-center justify-between py-8 text-left group"
                >
                  <span className="text-[20px] md:text-[24px] font-medium text-white group-hover:text-[#3ca6ff] transition-colors">
                    {principle.title}
                  </span>
                  <ChevronDown 
                    size={24} 
                    className={`text-white/50 transition-transform duration-300 ${openPrinciple === index ? 'rotate-180 text-[#3ca6ff]' : ''}`} 
                  />
                </button>
                <AnimatePresence>
                  {openPrinciple === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <p className="text-white/70 text-[16px] md:text-[18px] pb-8 pr-8 leading-relaxed">
                        {principle.content}
                      </p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 5. WE'RE HIRING (Globe Visual) */}
      {/* ========================================================= */}
      <section className="py-24 px-6 max-w-[1200px] mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
          {/* Abstract Particle Globe Representation */}
          <div className="relative w-full aspect-square max-w-[500px] mx-auto flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border border-white/5 bg-[#050505] shadow-[0_0_100px_rgba(60,166,255,0.1)] overflow-hidden">
               {/* Decorative dots simulating particles */}
               <div className="absolute inset-0 bg-[radial-gradient(#3ca6ff_1px,transparent_1px)] [background-size:20px_20px] opacity-20 rounded-full animate-[spin_60s_linear_infinite]"></div>
               <div className="absolute inset-0 bg-gradient-to-tr from-[#050505] via-transparent to-[#050505] rounded-full"></div>
            </div>
            <Globe size={100} className="text-[#3ca6ff]/30 absolute" strokeWidth={1} />
          </div>
          <div>
            <div className="text-white/50 text-[12px] uppercase tracking-wider mb-4 font-mono">Company</div>
            <h2 className="text-[32px] md:text-[48px] font-medium tracking-tight mb-6">
              We're hiring across all teams
            </h2>
            <p className="text-white/70 text-[16px] md:text-[18px] leading-relaxed mb-8">
              Aegisora has big ambitions, and we're hiring across the board. If you join us, you'll make a mark on how the world secures AI. Explore our open roles on our careers page.
            </p>
            <Link href="#" className="inline-flex items-center justify-center bg-white/5 border border-white/20 text-white font-mono text-[14px] font-bold px-6 py-3 rounded-[6px] hover:bg-white/10 transition-colors">
              Come join us
            </Link>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 6. BACKED BY THE BEST */}
      {/* ========================================================= */}
      <section className="py-24 px-6 max-w-[1200px] mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
          <div className="md:col-span-4">
            <h2 className="text-[32px] md:text-[42px] font-medium tracking-tight leading-[1.1]">
              Backed by the best<br />in the business
            </h2>
          </div>
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-[120px] bg-[#0A0A0A] border border-white/10 rounded-xl flex items-center justify-center hover:border-white/20 transition-colors">
              <span className="font-mono text-xl font-bold tracking-widest text-white/80">SEQUOIA</span>
            </div>
            <div className="h-[120px] bg-[#0A0A0A] border border-white/10 rounded-xl flex items-center justify-center hover:border-white/20 transition-colors">
              <span className="font-mono text-xl font-bold tracking-widest text-white/80">BENCHMARK</span>
            </div>
            <div className="h-[120px] bg-[#0A0A0A] border border-white/10 rounded-xl flex items-center justify-center hover:border-white/20 transition-colors">
              <span className="font-serif text-2xl font-bold tracking-widest text-white/80 italic">IVP</span>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 7. IN THE NEWS */}
      {/* ========================================================= */}
      <section className="py-24 px-6 max-w-[1200px] mx-auto border-t border-white/10">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16">
          <div className="md:col-span-4">
            <h2 className="text-[32px] md:text-[42px] font-medium tracking-tight leading-[1.1]">
              In the news
            </h2>
          </div>
          <div className="md:col-span-8 grid grid-cols-1 sm:grid-cols-2 gap-6">
            
            <Link href="#" className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 flex flex-col hover:border-white/30 transition-colors group">
              <div className="font-bold text-lg mb-4 text-white">FORTUNE</div>
              <p className="text-white/80 text-[18px] font-medium leading-snug mb-8 flex-1">
                Exclusive: Early AI securing startup Aegisora is now a unicorn with a fresh $125 million in funding
              </p>
              <div className="flex items-center gap-2 text-white/50 group-hover:text-white transition-colors font-mono text-[13px]">
                Full story <ArrowUpRight size={14} />
              </div>
            </Link>

            <Link href="#" className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 flex flex-col hover:border-white/30 transition-colors group">
              <div className="font-bold text-lg mb-4 text-[#00E676]">TechCrunch</div>
              <p className="text-white/80 text-[18px] font-medium leading-snug mb-8 flex-1">
                Execution boundary startup Aegisora hits $1.25B valuation as enterprises rush to secure AI agents
              </p>
              <div className="flex items-center gap-2 text-white/50 group-hover:text-white transition-colors font-mono text-[13px]">
                Full story <ArrowUpRight size={14} />
              </div>
            </Link>

            <Link href="#" className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 flex flex-col hover:border-white/30 transition-colors group sm:col-span-2">
              <div className="font-mono text-lg mb-4 text-white font-bold tracking-widest">SEQUOIA</div>
              <p className="text-white/80 text-[18px] font-medium leading-snug mb-8">
                Securing Our Way to Long-Horizon Agents: Aegisora's Execution Boundary
              </p>
              <div className="flex items-center gap-2 text-white/50 group-hover:text-white transition-colors font-mono text-[13px]">
                Full story <ArrowUpRight size={14} />
              </div>
            </Link>

          </div>
        </div>
      </section>

      {/* ========================================================= */}
      {/* 8. BOTTOM CTA */}
      {/* ========================================================= */}
      <section className="py-32 px-6 border-t border-white/10 bg-[#050505] relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(0,102,255,0.1)_0%,rgba(0,0,0,0)_60%)]"></div>
        <div className="max-w-[800px] mx-auto text-center relative z-10">
          <h2 className="text-[40px] md:text-[56px] font-medium tracking-tight mb-6">
            Secure your intelligence
          </h2>
          <p className="text-[18px] md:text-[22px] text-white/70 mb-12">
            See how Aegisora helps you build, test, deploy, monitor, and secure agents in one continuous execution loop.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link href="/signup" className="flex items-center justify-center bg-[#EAF2FF] text-black font-mono text-[14px] font-bold px-8 py-4 rounded-[6px] hover:bg-white transition-colors">
              Start building
            </Link>
            <Link href="/contact" className="flex items-center justify-center bg-transparent text-white border border-white/20 font-mono text-[14px] font-bold px-8 py-4 rounded-[6px] hover:bg-white/10 transition-colors">
              Get a demo
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
