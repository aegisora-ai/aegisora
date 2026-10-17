"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import {
  ShieldCheck,
  Shield,
  Network,
  UserCheck,
  Cloud,
  FileText,
} from "lucide-react";

export default function SecureByDefault() {
  const securityFeatures = [
    {
      icon: <ShieldCheck className="w-5 h-5 text-[#0066EE]" />,
      title: "GDPR Support",
    },
    {
      icon: (
        <div className="flex flex-col items-center justify-center text-[9px] font-bold text-[#0066EE] leading-tight">
          <span>AICPA</span>
          <span>SOC2</span>
        </div>
      ),
      title: "SOC 2 Readiness",
      sub: "(Certification in progress)",
    },
    {
      icon: (
        <div className="flex flex-col items-center justify-center text-[10px] font-bold text-[#0066EE] leading-tight">
          <div className="border b order-[#0066EE] rounded-full w-7 h-7 flex items-center justify-center">
            ISO
          </div>
        </div>
      ),
      title: "ISO 27001 Readiness",
      sub: "(Certification in progress)",
    },
    {
      icon: <Shield className="w-5 h-5 text-[#0066EE]" />,
      title: "Encryption at Rest",
    },
    {
      icon: (
        <svg
          className="w-5 h-5 text-[#0066EE]"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect x="5" y="11" width="14" height="10" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>
      ),
      title: "Encryption in Transit",
    },
    {
      icon: <Cloud className="w-5 h-5 text-[#0066EE]" />,
      title: "Zero-Data Retention",
    },
    {
      icon: <Network className="w-5 h-5 text-[#0066EE]" />,
      title: "Swarm-Level Access",
    },
    {
      icon: <UserCheck className="w-5 h-5 text-[#0066EE]" />,
      title: "Agent Permissions",
    },
    {
      icon: <FileText className="w-5 h-5 text-[#0066EE]" />,
      title: "Immutable Audit Logs",
    },
  ];

  return (
    <section className="relative w-full flex justify-center px-6 py-28 bg-transparent font-sans z-10 overflo w-hidden">
      {/* Scroll ile Ekrana Giren Premium Enterprise Kartı */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="w-full max-w-[1200px] bg-[#0a0a0a] rounded-[2.5rem] p-10 lg:p-16 flex flex-col lg:flex-row gap-16 lg:gap-12 items-center lg:items-start border b order-white/10 shado w-[0_20px_60px_rgba(0,0,0,0.4)]"
      >
        {/* Sol Taraf: Tipografi ve Buton */}
        <div className="w-full lg:w-[35%] flex flex-col items-start gap-6">
          <h2 className="text-4xl lg:text-[3.2rem] font-serif text-white leading-[1.1] tracking-tight">
            Secure by default.
          </h2>
          <p className="font-mono text-gray-400 text-[13.5px] leading-relaxed max-w-sm font-medium">
            Aegisora encrypts every reasoning trace and agentic tool call at
            rest and in transit, securing your autonomous ecosystem under strict
            SOC 2 and ISO standards.
          </p>
          <Link
            href="/trust-center"
            className="bg-[#0066EE] hover:bg-[#005bb5] cursor-pointer text-white font-mono text-[11px] px-6 py-3.5 rounded-full transition-colors mt-2 shado w-md outline-none"
          >
            View Trust Center
          </Link>
        </div>

        {/* Sağ Taraf: Özellikler Grid Yapısı (Kademeli Animasyon) */}
        <div className="w-full lg:w-[65%] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10 lg:pt-2">
          {securityFeatures.map((feature, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="flex items-center gap-4 group"
            >
              <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center flex-shrink-0 border b order-white/10 group-hover:bg-white/10 group-hover:scale-105 transition-all duration-300">
                {feature.icon}
              </div>
              <div className="flex flex-col">
                <span className="text-[14.5px] font-semibold text-gray-200 leading-tight">
                  {feature.title}
                </span>
                {feature.sub && (
                  <span className="text-[11px] text-gray-500 font-medium mt-0.5">
                    {feature.sub}
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
