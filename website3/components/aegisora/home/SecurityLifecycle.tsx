"use client";

import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import { ArrowUpRight, ShieldAlert, CheckCircle2, Fingerprint, BrainCircuit } from "lucide-react";
import Link from "next/link";

const steps = [
  {
    id: "intercept",
    label: "Intercept",
    title: "Catch the action before it executes.",
    desc: "Aegisora sits perfectly at the execution boundary. When an AI agent attempts a tool call, database query, or API request, we pause the execution instantly.",
    bullets: [
      { highlight: "Monitor", text: "agent workflows in real-time" },
      { highlight: "Intercept", text: "tool and API invocations" },
      { highlight: "Capture", text: "the complete execution context" }
    ],
    buttons: ["Real-time Monitoring", "Context API"],
    visual: (
      <div className="w-full h-[400px] lg:h-[600px] bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 flex flex-col font-mono text-[13px] relative overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 mb-6 border-b border-white/10 pb-4">
          <div className="w-3 h-3 rounded-full bg-red-500/20 flex items-center justify-center"><div className="w-1.5 h-1.5 rounded-full bg-red-500"></div></div>
          <span className="text-white/50 text-sm">Execution Paused</span>
        </div>
        <div className="text-[#3ca6ff] mb-2 text-lg">{"{"}</div>
        <div className="pl-6 text-white/80 flex flex-col gap-3 text-[15px]">
          <div><span className="text-white/40">"agent_id":</span> "agt_773x91",</div>
          <div><span className="text-white/40">"action":</span> "database.drop_table",</div>
          <div><span className="text-white/40">"target":</span> "production_users",</div>
          <div><span className="text-white/40">"status":</span> <span className="text-yellow-400 font-bold">"INTERCEPTED"</span></div>
        </div>
        <div className="text-[#3ca6ff] mt-2 text-lg">{"}"}</div>
      </div>
    )
  },
  {
    id: "analyze",
    label: "Analyze",
    title: "Evaluate risk in milliseconds.",
    desc: "Every intercepted action is analyzed against your enterprise security policies. We check context, intent, and historical behavior to detect anomalies.",
    bullets: [
      { highlight: "Deep context", text: "and prompt analysis" },
      { highlight: "Enterprise", text: "policy matching" },
      { highlight: "Risk scoring", text: "and anomaly detection" }
    ],
    buttons: ["Policy Engine", "Risk Evaluation"],
    visual: (
      <div className="w-full h-[400px] lg:h-[600px] bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 flex flex-col relative overflow-hidden shadow-2xl">
         <div className="text-white font-medium mb-8 flex items-center gap-3 text-lg border-b border-white/10 pb-4"><BrainCircuit size={24} className="text-[#3ca6ff]" /> Policy Evaluation Engine</div>
         <div className="space-y-6">
           <div className="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-white/5">
             <span className="text-white/80 text-[15px]">Data Access Policy</span>
             <span className="text-red-400 text-[13px] font-mono bg-red-400/10 px-3 py-1.5 rounded-md font-bold">VIOLATION</span>
           </div>
           <div className="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-white/5">
             <span className="text-white/80 text-[15px]">Rate Limit Check</span>
             <span className="text-green-400 text-[13px] font-mono bg-green-400/10 px-3 py-1.5 rounded-md font-bold">PASSED</span>
           </div>
           <div className="bg-white/5 p-4 rounded-xl flex items-center justify-between border border-white/5">
             <span className="text-white/80 text-[15px]">Overall Risk Score</span>
             <span className="text-white font-mono text-[15px]">94 / 100 <span className="text-red-500 ml-2 font-bold">Critical</span></span>
           </div>
         </div>
      </div>
    )
  },
  {
    id: "enforce",
    label: "Enforce",
    title: "ALLOW, BLOCK, or ESCALATE.",
    desc: "Aegisora acts as an impenetrable gate. Based on the analysis, the Decision Engine enforces the outcome before the action ever reaches your infrastructure.",
    bullets: [
      { highlight: "ALLOW", text: "safe actions to continue seamlessly" },
      { highlight: "BLOCK", text: "dangerous actions instantly" },
      { highlight: "ESCALATE", text: "ambiguous requests for human review" }
    ],
    buttons: ["Decision Engine"],
    visual: (
      <div className="w-full h-[400px] lg:h-[600px] bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 flex flex-col justify-center gap-6 relative overflow-hidden shadow-2xl">
         <div className="p-6 rounded-2xl border border-red-500/30 bg-red-500/5 flex items-center gap-6 transform scale-[1.02] shadow-[0_0_30px_rgba(239,68,68,0.1)]">
           <div className="w-14 h-14 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0"><ShieldAlert size={28} className="text-red-500" /></div>
           <div>
             <div className="text-red-500 font-bold text-xl tracking-wide mb-1">BLOCK</div>
             <div className="text-white/60 text-sm">Execution prevented. High risk policy violation.</div>
           </div>
         </div>
         <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex items-center gap-6 opacity-40">
           <div className="w-14 h-14 rounded-full bg-green-500/20 flex items-center justify-center flex-shrink-0"><CheckCircle2 size={28} className="text-green-500" /></div>
           <div>
             <div className="text-white font-bold text-xl tracking-wide mb-1">ALLOW</div>
             <div className="text-white/60 text-sm">Execution continues. Within policy limits.</div>
           </div>
         </div>
      </div>
    )
  },
  {
    id: "evidence",
    label: "Evidence",
    title: "Cryptographic proof for every decision.",
    desc: "Every ALLOW, BLOCK, or ESCALATE decision is logged with immutable cryptographic evidence. Total visibility and compliance readiness.",
    bullets: [
      { highlight: "Immutable", text: "audit trails" },
      { highlight: "Cryptographic hashes", text: "for compliance" },
      { highlight: "Full transparency", text: "for security teams" }
    ],
    buttons: ["Audit Logs", "Compliance"],
    visual: (
      <div className="w-full h-[400px] lg:h-[600px] bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 flex flex-col font-mono text-[14px] relative overflow-hidden shadow-2xl">
        <div className="text-white font-sans font-medium mb-8 flex items-center gap-3 border-b border-white/10 pb-4 text-lg"><Fingerprint size={24} className="text-[#3ca6ff]" /> Immutable Audit Log</div>
        <div className="flex flex-col gap-5">
          <div className="flex justify-between items-center"><span className="text-white/40">Trace ID</span><span className="text-white">7f3a2c6e...901f</span></div>
          <div className="flex justify-between items-center"><span className="text-white/40">Decision</span><span className="text-red-400 font-bold bg-red-400/10 px-3 py-1 rounded">BLOCK</span></div>
          <div className="flex justify-between items-center"><span className="text-white/40">Timestamp</span><span className="text-white">2026-09-09T21:45Z</span></div>
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="text-white/40 mb-3">Cryptographic Hash (SHA-256)</div>
            <div className="text-[#3ca6ff] break-all bg-[#050505] p-4 rounded-xl border border-[#3ca6ff]/20 text-[13px] leading-relaxed">
              e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
            </div>
          </div>
        </div>
      </div>
    )
  }
];

export function SecurityLifecycle() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [activeStep, setActiveStep] = useState(0);

  // Sol taraftaki menü maddeleri için referanslar
  const stepRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const handleScroll = () => {
      // Her bir step'in ekrandaki pozisyonuna bakıp aktif olanı bul
      const scrollPosition = window.scrollY + window.innerHeight / 2;
      
      let currentStep = 0;
      stepRefs.current.forEach((ref, index) => {
        if (ref) {
          const { top } = ref.getBoundingClientRect();
          // Eğer elemanın üst kısmı ekranın ortasından yukarıdaysa, aktif say
          if (top < window.innerHeight / 2) {
            currentStep = index;
          }
        }
      });
      
      setActiveStep(currentStep);
    };

    window.addEventListener("scroll", handleScroll);
    handleScroll(); // İlk yüklemede çalıştır
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <section ref={containerRef} className="relative bg-[#050505] pt-24 pb-40">
      
      {/* ÜST ORTA SABİT BAŞLIK (Videodaki gibi) */}
      <div className="sticky top-[100px] z-30 flex justify-center pointer-events-none pb-20">
        <h2 className="text-[#3ca6ff] text-[32px] sm:text-[42px] lg:text-[52px] font-medium tracking-[-0.02em] text-center bg-[#050505]/80 backdrop-blur-md px-8 py-4 rounded-full shadow-[0_10px_40px_rgba(5,5,5,0.8)]">
          Securing the<br className="sm:hidden" /> Agent Development Lifecycle
        </h2>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 lg:px-12 relative flex mt-12 lg:mt-24">
        
        {/* SOL TARAF: Kavisli Yörünge Çizgisi ve Kaydırılan Metinler */}
        <div className="w-full lg:w-1/2 flex flex-col relative z-20 pr-0 lg:pr-12">
          
          {/* Sol Kenardaki Yörünge (Orbit) Çizgisi */}
          <div className="hidden lg:block absolute left-[-400px] top-0 bottom-0 w-[500px] border-r border-white/10 rounded-r-full pointer-events-none"></div>

          {/* Adımlar (Aşağı doğru sıralanmış) */}
          <div className="flex flex-col gap-[30vh] lg:gap-[50vh] pb-[30vh]">
            {steps.map((step, index) => (
              <div 
                key={step.id} 
                ref={(el) => { stepRefs.current[index] = el; }}
                className="relative pl-0 lg:pl-16 transition-opacity duration-500"
                style={{ opacity: activeStep === index ? 1 : 0.3 }}
              >
                
                {/* Yörünge üzerindeki Aktif Nokta ve Yazı (Sadece Desktop) */}
                <div className="hidden lg:flex absolute left-[-16px] top-4 items-center gap-8">
                  <div className={`w-[32px] h-[32px] rounded-full border-2 flex items-center justify-center bg-[#050505] transition-colors duration-500 ${activeStep === index ? 'border-[#3ca6ff]' : 'border-white/20'}`}>
                    <div className={`w-2.5 h-2.5 rounded-full transition-colors duration-500 ${activeStep === index ? 'bg-[#3ca6ff]' : 'bg-transparent'}`} />
                  </div>
                  <span className={`font-mono text-[14px] uppercase tracking-wider font-bold transition-colors duration-500 ${activeStep === index ? 'text-white' : 'text-white/40'}`}>
                    {step.label}
                  </span>
                </div>

                {/* Metin İçeriği */}
                <div className="mt-8 lg:mt-0">
                  <h3 className="text-white text-[32px] lg:text-[46px] font-medium leading-[1.1] mb-6 tracking-tight">
                    {step.label}
                  </h3>
                  <p className="text-white/80 text-[18px] lg:text-[22px] mb-8 leading-[1.5] font-sans">
                    {step.desc}
                  </p>
                  <ul className="flex flex-col gap-4 mb-10">
                    {step.bullets.map((bullet, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <div className="w-1.5 h-1.5 rounded-full bg-white mt-2.5 flex-shrink-0" />
                        <span className="text-white/70 text-[16px] lg:text-[18px] font-sans">
                          <strong className="text-white font-semibold">{bullet.highlight}</strong> {bullet.text}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* Butonlar (Videodaki hap tasarımı) */}
                  <div className="flex flex-wrap gap-3">
                    {step.buttons.map((btn, i) => (
                      <Link key={i} href="#" className="flex items-center gap-2 px-5 py-2.5 rounded-full border border-white/20 text-white text-[14px] font-medium hover:bg-white/10 hover:border-white/40 transition-all">
                        {btn} <ArrowUpRight size={16} className="opacity-70" />
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Mobilde görseli metnin hemen altında göster */}
                <div className="block lg:hidden mt-12">
                   {step.visual}
                </div>

              </div>
            ))}
          </div>
        </div>

        {/* SAĞ TARAF: Sabit (Sticky) Görsel Alanı (Sadece Desktop) */}
        <div className="hidden lg:block w-1/2 relative">
          <div className="sticky top-[25vh] h-[600px] w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                transition={{ duration: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full"
              >
                {steps[activeStep].visual}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

      </div>
    </section>
  );
}
