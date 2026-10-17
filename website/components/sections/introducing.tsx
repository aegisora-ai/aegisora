"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

export default function Introducing() {
  const containerRef = useRef(null);
  // Performans Optimizasyonu: Animasyonlar sadece ekrandayken çalışır
  const isInView = useInView(containerRef, { once: false, margin: "100px" });

  return (
    <section
      ref={containerRef}
      id="product"
      className="relative py-32 md:py-48 bg-transparent b order-y b order-white/10 overflo w-hidden font-sans"
    >
      {/* İnce Üst Parlama Efekti */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-[#0066EE]/40 to-transparent" />

      <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20">
        <div className="grid lg:grid-cols-2 gap-20 items-center">
          {/* Sol Taraf: Kurumsal B2B Metin İçeriği */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col gap-6"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border b order-white/10 bg-white/5 w-fit shado w-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-[#0066EE] animate-pulse" />
              <span className="text-[11px] font-mono font-medium tracking-widest uppercase text-gray-400">
                Introducing Aegisora Core
              </span>
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-serif tracking-tight text-[#111111] dark:text-white leading-[1.1]">
              Invisible Governance. <br />
              <span className="text-[#0066EE]">Absolute Control.</span>
            </h2>

            <p className="text-sm sm:text-base font-mono text-gray-500 leading-relaxed max-w-md mt-4">
              Aegisora is an enterprise zero-trust proxy designed to seamlessly
              integrate into your AI infrastructure. It monitors, intercepts,
              and secures your agentic swarms at runtime without demanding
              changes to your codebase.
            </p>

            <ul className="mt-8 flex flex-col gap-4">
              {[
                "Zero-latency interception",
                "Private by architecture",
                "Deploy in under 2 minutes",
              ].map((item, i) => (
                <li
                  key={i}
                  className="flex items-center gap-3 text-sm font-medium text-gray-400 font-mono"
                >
                  <div className="w-5 h-5 rounded-full border b order-white/10 flex items-center justify-center bg-white/5">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#0066EE]" />
                  </div>
                  {item}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Sağ Taraf: GPU Hızlandırmalı AI Core Görseli */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            className="relative w-full aspect-[4/5] md:aspect-square rounded-[2.5rem] overflo w-hidden bg-[#0a0a0a] border b order-white/10 group shado w-[0_20px_50px_rgba(0,0,0,0.3)]"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-[#0066EE]/10 to-transparent opacity-50 group-hover:opacity-100 transition-opacity duration-1000" />

            <div className="absolute inset-0 flex items-center justify-center">
              {/* Yüzük yerine Zero-Trust Çekirdeği (AI Core) */}
              <motion.div
                animate={
                  isInView
                    ? { y: [-10, 10, -10], rotateX: [0, 5, 0] }
                    : { y: 0, rotateX: 0 }
                }
                transition={{
                  duration: 6,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="relative w-48 h-48 sm:w-64 sm:h-64 will-change-transform"
              >
                {/* Dış Radar Halkası */}
                <div className="absolute inset-0 rounded-full b order-[2px] b order-[#0066EE]/20 flex items-center justify-center b order-dashed animate-[spin_20s_linear_infinite]" />

                {/* İç Koruma Kalkanı */}
                <div className="absolute inset-4 rounded-full b order-[1px] b order-blue-400/30 flex items-center justify-center animate-[spin_15s_linear_infinite_reverse]" />

                {/* Merkez Aura Bulanıklığı */}
                <div className="absolute inset-12 rounded-full bg-gradient-to-tr from-[#0066EE]/40 to-indigo-500/40 blur-xl flex items-center justify-center" />

                {/* Merkez Fiziksel Core */}
                <div className="absolute inset-16 rounded-full border b order-white/20 bg-[#111111]/80 backdrop-blur-sm shado w-[0_0_50px_rgba(0,102,238,0.4)] flex items-center justify-center">
                  <div className="w-8 h-8 rounded-full bg-[#0066EE] animate-pulse shado w-[0_0_20px_#0066EE]"></div>
                </div>
              </motion.div>
            </div>

            {/* Alt Etiketler */}
            <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end text-gray-400 text-xs font-mono">
              <span className="opacity-50 uppercase tracking-widest">
                Enterprise Proxy
              </span>
              <span className="font-medium text-[#0066EE]">SOC 2 Readiness</span>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
