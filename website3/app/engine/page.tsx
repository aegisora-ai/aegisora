"use client";

import { Navbar } from "@/components/aegisora/layout/Navbar";
import { Footer } from "@/components/aegisora/layout/Footer";
import Link from "next/link";
import Image from "next/image"; // EKSİK OLAN IMPORT BURAYA EKLENDİ
import { ArrowUpRight, Play, Server, Code, Bug, Zap, ChevronDown, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function EnginePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      question: "What model do you use for Aegisora Engine?",
      answer: "Aegisora Engine uses LLMs provided through our secure gateways. We do not support bringing your own model for Engine so that we can control the full Engine experience and deliver the best results. We never train on your data."
    },
    {
      question: "What can I share with our security team on using Engine?",
      answer: "All model providers operate under zero data retention and are contractually prohibited from training or fine-tuning on your data. Aegisora enforces cryptographic execution boundaries."
    },
    {
      question: "How is Engine priced?",
      answer: "Aegisora Engine is a standalone agent that consumes Aegisora Compute Units (ACUs). ACUs are a normalized unit of work that account for compute, storage, memory, and LLM usage."
    }
  ];

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-[#111111] font-sans selection:bg-[#0066FF] selection:text-white relative overflow-hidden">
      
      {/* 1. HERO SECTION & VIDEO PLAYER */}
      <section className="bg-[#030612] text-white pt-[160px] lg:pt-[200px] pb-[100px] px-6 relative z-10 border-b border-white/5">
        <Navbar />
        
        {/* Siber Arka Plan */}
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-[0.03] pointer-events-none"></div>
        <div className="absolute top-[-20%] left-[-10%] w-[1000px] h-[800px] bg-[radial-gradient(ellipse_at_top_left,rgba(0,102,255,0.15)_0%,rgba(0,0,0,0)_60%)] pointer-events-none -z-10 mix-blend-screen"></div>

        <div className="max-w-[1300px] mx-auto flex flex-col lg:flex-row gap-16 lg:gap-20 items-center">
          
          <div className="w-full lg:w-1/2 flex flex-col relative z-10">
            <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-white/80 font-mono text-[13px] font-bold mb-8 w-max">
              <Server size={14} className="text-[#3ca6ff]" /> Aegisora Engine
            </div>
            
            <h1 className="text-[52px] md:text-[64px] lg:text-[76px] font-medium leading-[1.05] tracking-tighter mb-8">
              Your proactive <br/>
              <span className="text-[#3ca6ff]">agent engineer</span>
            </h1>
            
            <p className="text-[18px] md:text-[20px] text-white/60 leading-relaxed mb-10 max-w-[550px]">
              Aegisora Engine analyzes production traces, groups related failures, and recommends fixes so your team can improve agent quality faster.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Link href="/signup" className="flex items-center justify-center bg-white text-black font-mono text-[14px] font-bold px-8 py-3.5 rounded-[6px] hover:bg-gray-100 transition-colors w-full sm:w-auto">
                Get started
              </Link>
              <Link href="/contact" className="flex items-center justify-center bg-[#111624] text-white border border-[#3ca6ff]/30 font-mono text-[14px] font-bold px-8 py-3.5 rounded-[6px] hover:bg-[#3ca6ff]/10 transition-colors w-full sm:w-auto">
                Request a demo
              </Link>
            </div>
          </div>

          {/* Video Player Mockup */}
          <div className="w-full lg:w-1/2 relative group">
             <div className="absolute inset-0 bg-[#3ca6ff]/20 blur-[100px] rounded-full group-hover:bg-[#3ca6ff]/30 transition-colors duration-500 -z-10"></div>
             <div className="w-full aspect-[4/3] bg-[#0A0D18] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative flex items-center justify-center">
                {/* Fake Video UI */}
                <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10"></div>
                
                {/* Abstract Bar Chart Animation (Görseldeki gibi) */}
                <div className="absolute inset-0 flex items-end justify-center gap-4 p-8 opacity-40">
                  <motion.div className="w-16 bg-[#3ca6ff] rounded-t-lg" initial={{ height: "40%" }} animate={{ height: ["40%", "70%", "40%"] }} transition={{ duration: 4, repeat: Infinity }}></motion.div>
                  <motion.div className="w-16 bg-white rounded-t-lg" initial={{ height: "80%" }} animate={{ height: ["80%", "50%", "80%"] }} transition={{ duration: 5, repeat: Infinity }}></motion.div>
                  <motion.div className="w-16 bg-[#3ca6ff] rounded-t-lg" initial={{ height: "30%" }} animate={{ height: ["30%", "90%", "30%"] }} transition={{ duration: 3.5, repeat: Infinity }}></motion.div>
                  <motion.div className="w-16 bg-white rounded-t-lg" initial={{ height: "60%" }} animate={{ height: ["60%", "40%", "60%"] }} transition={{ duration: 4.5, repeat: Infinity }}></motion.div>
                </div>

                <button className="w-20 h-20 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center border border-white/20 hover:bg-white/20 hover:scale-105 transition-all z-20 cursor-pointer">
                  <Play className="text-white ml-2" size={32} fill="white" />
                </button>
             </div>
          </div>

        </div>

        </section>

      {/* ========================================== */}
      {/* 2. ÖZELLİKLER (Sol Sticky, Sağ Kayan Görseller) */}
      {/* ========================================== */}
      <section className="py-32 px-6 bg-white border-b border-gray-100">
        <div className="max-w-[1300px] mx-auto">
          
          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 mb-32">
            <div className="lg:w-1/3 flex flex-col">
              <div className="sticky top-[120px]">
                <div className="font-mono text-[#0066FF] text-[13px] font-bold uppercase tracking-widest mb-4">Detect</div>
                <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight leading-[1.1] mb-6">Automatically detect issues in production traces</h2>
                <p className="text-[18px] text-gray-600 leading-relaxed mb-8">
                  Engine analyzes Aegisora traces to look for patterns in unmet user expectations or agent failures. Engine will triage high severity issues, so you can understand where there's opportunity for improvement.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h4 className="font-bold text-[16px] mb-4">Engine can:</h4>
                  <ul className="flex flex-col gap-3 font-mono text-[14px] text-gray-700">
                    <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-[#0066FF] mt-0.5" /> Run automatically in the background</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-[#0066FF] mt-0.5" /> Cluster related traces into issues</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-[#0066FF] mt-0.5" /> Prioritize issues based on severity</li>
                  </ul>
                  <Link href="#" className="inline-flex items-center gap-2 mt-6 text-[#0066FF] font-mono text-[14px] font-bold hover:underline">Set up Engine <ArrowUpRight size={16}/></Link>
                </div>
              </div>
            </div>
            <div className="lg:w-2/3">
              <div className="bg-[#050505] rounded-2xl p-2 shadow-2xl border border-gray-200 overflow-hidden">
                <Image src="/image_26bc26.png" alt="Detect Feature" width={1000} height={600} className="w-full h-auto rounded-xl opacity-90 grayscale hover:grayscale-0 transition-all duration-500" />
              </div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-16 lg:gap-24 mb-32">
            <div className="lg:w-1/3 flex flex-col">
              <div className="sticky top-[120px]">
                <div className="font-mono text-[#0066FF] text-[13px] font-bold uppercase tracking-widest mb-4">Fix</div>
                <h2 className="text-[32px] md:text-[40px] font-medium tracking-tight leading-[1.1] mb-6">Engine writes the fix</h2>
                <p className="text-[18px] text-gray-600 leading-relaxed mb-8">
                  For each issue, Engine summarizes the failure mode, identifies what needs to change, and writes the prompt or code fix. If you connect your codebase, Engine can open a GitHub PR ready for your team to review.
                </p>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                  <h4 className="font-bold text-[16px] mb-4">Engine can:</h4>
                  <ul className="flex flex-col gap-3 font-mono text-[14px] text-gray-700">
                    <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-[#0066FF] mt-0.5" /> Write prompt and code changes</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-[#0066FF] mt-0.5" /> Show diffs with explanations</li>
                    <li className="flex items-start gap-2"><CheckCircle2 size={16} className="text-[#0066FF] mt-0.5" /> Open GitHub PRs for review</li>
                  </ul>
                  <Link href="#" className="inline-flex items-center gap-2 mt-6 text-[#0066FF] font-mono text-[14px] font-bold hover:underline">Configure Engine to write PRs <ArrowUpRight size={16}/></Link>
                </div>
              </div>
            </div>
            <div className="lg:w-2/3">
              <div className="bg-[#050505] rounded-2xl p-2 shadow-2xl border border-gray-200 overflow-hidden">
                {/* Kod Mockup */}
                <div className="w-full bg-[#1A1A1A] rounded-xl p-6 font-mono text-[13px] text-white/80 leading-relaxed">
                  <div className="text-gray-400 mb-4">// Engine Proposed Fix - GitHub PR #1042</div>
                  <div className="flex"><span className="text-red-400 mr-2">-</span> <span>const model = new ChatOpenAI({`{ temperature: 0.7 }`});</span></div>
                  <div className="flex bg-green-500/10"><span className="text-green-400 mr-2">+</span> <span>const model = new ChatOpenAI({`{`}</span></div>
                  <div className="flex bg-green-500/10 pl-6"><span className="text-green-400">temperature: 0.1, // Reduced to prevent hallucination loop</span></div>
                  <div className="flex bg-green-500/10 pl-6"><span className="text-green-400">modelName: "gpt-4o", // Upgraded for complex reasoning</span></div>
                  <div className="flex bg-green-500/10 pl-4"><span className="text-green-400">{`}`});</span></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================== */}
      {/* 3. KAYNAKLAR (Resources) */}
      {/* ========================================== */}
      <section className="py-32 px-6 bg-[#FDFDFD]">
        <div className="max-w-[1300px] mx-auto">
          <h2 className="text-[32px] md:text-[48px] font-medium tracking-tight mb-16">Resources for Aegisora Engine</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            <Link href="#" className="group">
              <div className="bg-[#050505] h-[240px] rounded-2xl overflow-hidden relative flex items-center justify-center border border-gray-200 mb-6 group-hover:shadow-xl transition-all">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-40"></div>
                <div className="w-[80%] h-[80%] bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-30 transform scale-150 group-hover:scale-100 transition-transform duration-700"></div>
              </div>
              <div className="font-mono text-[#0066FF] text-[12px] font-bold uppercase tracking-widest mb-3">docs</div>
              <h3 className="text-[24px] font-medium leading-[1.2] group-hover:text-[#0066FF] transition-colors">Get started with Aegisora Engine</h3>
            </Link>

            <Link href="#" className="group">
              <div className="bg-[#050505] h-[240px] rounded-2xl overflow-hidden relative flex items-center justify-center border border-gray-200 mb-6 group-hover:shadow-xl transition-all">
                <div className="absolute inset-0 bg-gradient-to-r from-[#0066FF]/20 to-transparent"></div>
                <div className="w-full h-1/2 bg-[url('https://www.transparenttextures.com/patterns/connected-dots.png')] opacity-40 group-hover:translate-y-4 transition-transform duration-700"></div>
              </div>
              <div className="font-mono text-[#0066FF] text-[12px] font-bold uppercase tracking-widest mb-3">blog</div>
              <h3 className="text-[24px] font-medium leading-[1.2] group-hover:text-[#0066FF] transition-colors">Introducing Aegisora Engine</h3>
            </Link>

            <Link href="#" className="group">
              <div className="bg-[#050505] h-[240px] rounded-2xl overflow-hidden relative flex items-center justify-center border border-gray-200 mb-6 group-hover:shadow-xl transition-all">
                <div className="absolute inset-0 bg-gradient-to-br from-[#111] to-[#222]"></div>
                <div className="w-[60%] h-[60%] border-4 border-dashed border-[#0066FF]/30 rounded-full animate-spin-slow"></div>
              </div>
              <div className="font-mono text-[#0066FF] text-[12px] font-bold uppercase tracking-widest mb-3">talk</div>
              <h3 className="text-[24px] font-medium leading-[1.2] group-hover:text-[#0066FF] transition-colors">How We Built Aegisora Engine | Interrupt 26</h3>
            </Link>

          </div>
        </div>
      </section>

      {/* ========================================== */}
      {/* 4. SIK SORULAN SORULAR (FAQ) */}
      {/* ========================================== */}
      <section className="py-24 px-6 bg-white border-t border-gray-100">
        <div className="max-w-[1000px] mx-auto flex flex-col md:flex-row gap-12">
          
          <div className="md:w-1/3">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-2 h-2 rounded-full bg-[#0066FF]"></div>
              <h2 className="text-[32px] font-medium tracking-tight leading-[1.1]">FAQs for <br/>Aegisora Engine</h2>
            </div>
          </div>

          <div className="md:w-2/3 flex flex-col">
            {faqs.map((faq, index) => (
              <div key={index} className="border-b border-gray-200">
                <button 
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                  className="w-full flex items-center justify-between py-6 text-left cursor-pointer group"
                >
                  <span className="text-[18px] font-medium group-hover:text-[#0066FF] transition-colors pr-8">{faq.question}</span>
                  <ChevronDown className={`transform transition-transform duration-300 ${openFaq === index ? 'rotate-180 text-[#0066FF]' : 'text-gray-400'}`} />
                </button>
                <AnimatePresence>
                  {openFaq === index && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <p className="pb-6 text-[15px] text-gray-600 leading-relaxed pr-8">{faq.answer}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>

        </div>
      </section>

      <div id="dark-section">
        <Footer />
      </div>

    </main>
  );
}

