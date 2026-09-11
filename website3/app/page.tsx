"use client";

import { Navbar } from "@/components/aegisora/layout/Navbar";
import { Footer } from "@/components/aegisora/layout/Footer";
import Link from "next/link";
import { ArrowUpRight, Terminal, Shield, Eye, Zap, Lock, Code2 } from "lucide-react";
import { motion } from "framer-motion";

export default function HomePage() {
  // useRef ve useScroll kaldirildi, boylece 'not hydrated' hatasi cozuldu.

  return (
    <main className="min-h-screen bg-[#030612] text-white font-sans selection:bg-[#0066FF] selection:text-white flex flex-col relative overflow-hidden">
      
      <Navbar />

      {/* ========================================== */}
      {/* 1. HERO SECTION & TERMINAL KUTUSU */}
      {/* ========================================== */}
      <section className="relative pt-[160px] lg:pt-[200px] pb-[80px] px-6 flex flex-col items-center text-center z-10">
        
        <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1000px] h-[800px] bg-[radial-gradient(ellipse_at_top,rgba(0,102,255,0.15)_0%,rgba(0,0,0,0)_60%)] pointer-events-none -z-10 mix-blend-screen"></div>

        <div className="max-w-[1100px] mx-auto flex flex-col items-center mb-16">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
            <h1 className="text-[52px] md:text-[72px] lg:text-[88px] font-medium leading-[1.05] tracking-tighter text-white flex items-center justify-center flex-wrap gap-x-2 md:gap-x-4 mb-2">
              Meet Aegisora Engine
              <ArrowUpRight className="text-[#3ca6ff] w-10 h-10 md:w-14 md:h-14 stroke-[2.5] relative top-[-10px] md:top-[-15px]" />
            </h1>
            <h2 className="text-[48px] md:text-[64px] lg:text-[80px] font-medium leading-[1.05] tracking-tighter text-[#3ca6ff] mb-8">
              Control Autonomous AI
            </h2>
          </motion.div>
          
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="text-[18px] md:text-[22px] text-white/70 max-w-[700px] leading-relaxed mb-12">
            Govern every model call, tool invocation, and agent action before it executes. Real-time policy enforcement with cryptographic evidence.
          </motion.p>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/signup" className="flex items-center justify-center bg-[#EAF2FF] text-black font-mono text-[14px] md:text-[15px] font-bold px-8 py-4 rounded-[6px] hover:bg-white transition-colors w-full sm:w-auto">
              Start building
            </Link>
            <Link href="/contact" className="flex items-center justify-center bg-transparent text-white border border-white/20 font-mono text-[14px] md:text-[15px] font-bold px-8 py-4 rounded-[6px] hover:bg-white/10 transition-colors w-full sm:w-auto">
              Get a demo
            </Link>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.7, delay: 0.4 }}
          className="w-full max-w-[1000px] mx-auto bg-[#0A0D18] border border-white/10 rounded-[16px] overflow-hidden shadow-[0_30px_100px_rgba(0,102,255,0.15)] text-left flex flex-col"
        >
          <div className="h-10 bg-[#111624] border-b border-white/10 flex items-center px-4 gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
            <div className="ml-4 font-mono text-[12px] text-white/40 flex gap-4">
              <span className="text-[#3ca6ff]">agent_policy.ts</span>
              <span>trace_eval.py</span>
            </div>
          </div>
          <div className="p-6 md:p-8 font-mono text-[13px] md:text-[14px] leading-loose text-white/80 overflow-x-auto">
            <div className="flex"><span className="text-[#c678dd] mr-2">import</span> <span className="text-white">{"{ AegisoraGuard, Policy }"}</span> <span className="text-[#c678dd] mx-2">from</span> <span className="text-[#98c379]">"@aegisora/engine"</span>;</div>
            <br/>
            <div className="flex"><span className="text-[#c678dd]">const</span> <span className="text-[#e5c07b]">guard</span> = <span className="text-[#c678dd]">new</span> <span className="text-[#61afef]">AegisoraGuard</span>({`{`}</div>
            <div className="flex text-white/50 pl-4">// 1. Define cryptographically secure execution boundaries</div>
            <div className="flex pl-4"><span className="text-[#e06c75]">identity</span>: <span className="text-[#98c379]">"finops-agent-prod"</span>,</div>
            <div className="flex pl-4"><span className="text-[#e06c75]">strictMode</span>: <span className="text-[#d19a66]">true</span>,</div>
            <div className="flex pl-4"><span className="text-[#e06c75]">policies</span>: [</div>
            <div className="flex pl-8"><span className="text-[#e5c07b]">Policy</span>.<span className="text-[#61afef]">BlockPII</span>(),</div>
            <div className="flex pl-8"><span className="text-[#e5c07b]">Policy</span>.<span className="text-[#61afef]">RequireApproval</span>({`{ limit: `}<span className="text-[#d19a66]">5000</span>{`, currency: `}<span className="text-[#98c379]">"USD"</span>{` }`})</div>
            <div className="flex pl-4">]</div>
            <div className="flex">{`});`}</div>
            <br/>
            <div className="flex text-[#3ca6ff]"><span className="text-[#c678dd] mr-2">await</span> guard.execute(agentTask); <span className="text-white/40 ml-4">{'// Automatically traced, evaluated, and secured.'}</span></div>
          </div>
        </motion.div>
      </section>

      {/* ========================================== */}
      {/* 2. THE ECOSYSTEM (Ürün Sütunları) */}
      {/* ========================================== */}
      <section className="py-24 px-6 relative z-10 border-t border-white/5 bg-[#03050B]">
        <div className="max-w-[1300px] mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-[36px] md:text-[52px] font-medium tracking-tight mb-6">The Aegisora Stack</h2>
            <p className="text-[18px] text-white/50 max-w-[600px] mx-auto">A unified ecosystem to build, observe, and secure autonomous agents at enterprise scale.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#0A0D18] border border-white/10 rounded-2xl p-8 hover:border-[#3ca6ff]/50 transition-colors group">
              <div className="w-14 h-14 bg-[#111624] rounded-xl flex items-center justify-center mb-8 border border-white/5 group-hover:bg-[#3ca6ff]/10 transition-colors">
                <Code2 className="text-[#3ca6ff]" size={28} />
              </div>
              <h3 className="text-[24px] font-medium mb-4 tracking-tight">Aegisora Core</h3>
              <p className="text-[15px] text-white/50 leading-relaxed mb-8">The open-source framework for building deep agents. Connect any LLM, any tool, and define complex cognitive architectures.</p>
              <Link href="#" className="text-[#3ca6ff] font-mono text-[14px] font-bold flex items-center gap-2 hover:underline">Explore Core <ArrowUpRight size={16}/></Link>
            </div>
            
            <div className="bg-[#0A0D18] border border-white/10 rounded-2xl p-8 hover:border-[#3ca6ff]/50 transition-colors group">
              <div className="w-14 h-14 bg-[#111624] rounded-xl flex items-center justify-center mb-8 border border-white/5 group-hover:bg-[#3ca6ff]/10 transition-colors">
                <Eye className="text-[#3ca6ff]" size={28} />
              </div>
              <h3 className="text-[24px] font-medium mb-4 tracking-tight">Aegisora Engine</h3>
              <p className="text-[15px] text-white/50 leading-relaxed mb-8">The observability and evaluation platform. Debug every thought process, run rigorous evals, and fine-tune agent performance.</p>
              <Link href="#" className="text-[#3ca6ff] font-mono text-[14px] font-bold flex items-center gap-2 hover:underline">Explore Engine <ArrowUpRight size={16}/></Link>
            </div>

            <div className="bg-[#0A0D18] border border-white/10 rounded-2xl p-8 hover:border-[#3ca6ff]/50 transition-colors group">
              <div className="w-14 h-14 bg-[#111624] rounded-xl flex items-center justify-center mb-8 border border-white/5 group-hover:bg-[#3ca6ff]/10 transition-colors">
                <Shield className="text-[#3ca6ff]" size={28} />
              </div>
              <h3 className="text-[24px] font-medium mb-4 tracking-tight">Aegisora Shield</h3>
              <p className="text-[15px] text-white/50 leading-relaxed mb-8">The enterprise deployment gateway. Enforce stateless protocols, manage credentials, and deploy sandboxes in one click.</p>
              <Link href="#" className="text-[#3ca6ff] font-mono text-[14px] font-bold flex items-center gap-2 hover:underline">Explore Shield <ArrowUpRight size={16}/></Link>
            </div>
          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 3. STICKY SCROLL (Özellik Hikayesi) */}
      {/* ========================================== */}
      <section className="py-32 px-6 relative z-10 border-t border-white/5 pb-[15vh]">
        <div className="max-w-[1300px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-24 relative">
          
          <div className="lg:w-1/2 relative hidden lg:block">
            <div className="sticky top-[150px] w-full h-[500px] bg-[#0A0D18] border border-white/10 rounded-[24px] flex items-center justify-center overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-[#3ca6ff]/20 blur-[100px] rounded-full"></div>
              
              <div className="relative z-10 flex flex-col items-center gap-6">
                <div className="w-20 h-20 bg-[#111624] border border-[#3ca6ff]/50 rounded-2xl flex items-center justify-center shadow-[0_0_30px_rgba(60,166,255,0.2)]">
                  <Terminal className="text-[#3ca6ff]" size={36} />
                </div>
                <div className="font-mono text-[16px] text-white/80 text-center">
                  <span className="text-[#98c379]">Status:</span> Secure Payload Active<br/>
                  <span className="text-[#61afef]">Policy:</span> Enforced at Runtime
                </div>
              </div>
            </div>
          </div>

          <div className="lg:w-1/2 flex flex-col gap-[15vh] lg:gap-[30vh]">
            
            <div className="flex flex-col">
              <div className="w-12 h-12 bg-[#3ca6ff]/10 rounded-xl flex items-center justify-center mb-6 border border-[#3ca6ff]/20">
                <Eye className="text-[#3ca6ff]" size={24} />
              </div>
              <h3 className="text-[32px] md:text-[40px] font-medium tracking-tight mb-6">See exactly what your agents are doing</h3>
              <p className="text-[18px] text-white/60 leading-relaxed">
                Agents are non-deterministic. Aegisora provides full x-ray vision into every execution trace. Understand exactly which prompt, model, and tool led to an outcome.
              </p>
            </div>

            <div className="flex flex-col">
              <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center mb-6 border border-purple-500/20">
                <Zap className="text-purple-400" size={24} />
              </div>
              <h3 className="text-[32px] md:text-[40px] font-medium tracking-tight mb-6">Evaluate & Improve autonomously</h3>
              <p className="text-[18px] text-white/60 leading-relaxed">
                Stop guessing if your new prompt is better. Run automated evaluations on thousands of traces, establish baselines, and deploy updates with absolute confidence.
              </p>
            </div>

            <div className="flex flex-col">
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center mb-6 border border-green-500/20">
                <Lock className="text-green-400" size={24} />
              </div>
              <h3 className="text-[32px] md:text-[40px] font-medium tracking-tight mb-6">Govern with cryptographic certainty</h3>
              <p className="text-[18px] text-white/60 leading-relaxed">
                Move beyond simple API keys. Implement stateless protocols and runtime execution boundaries. Your agent only performs actions it is explicitly authorized to do.
              </p>
            </div>

          </div>
        </div>
      </section>

      <div id="dark-section" className="bg-[#030612] w-full">
        <Footer />
      </div>

    </main>
  );
}
