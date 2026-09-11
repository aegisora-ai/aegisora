"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export type Tab = {
  id: string;
  label: string;
  code: React.ReactNode;
};

export function CodeTabs({ tabs }: { tabs: Tab[] }) {
  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [copied, setCopied] = useState(false);

  const activeCodeObj = tabs.find(t => t.id === activeTab);

  const handleCopy = () => {
    // Sadece demo amacli basit bir kopyalama
    navigator.clipboard.writeText("Code copied from Aegisora Docs!");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="my-8 rounded-xl border border-white/10 bg-[#0A0D18] overflow-hidden shadow-2xl">
      <div className="flex items-center justify-between px-4 bg-[#050505] border-b border-white/10">
        <div className="flex gap-6">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-3 text-[13px] font-mono font-medium border-b-2 transition-colors cursor-pointer ${
                activeTab === tab.id
                  ? "border-[#3ca6ff] text-[#3ca6ff]"
                  : "border-transparent text-white/50 hover:text-white/80"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button onClick={handleCopy} className="text-white/40 hover:text-white transition-colors cursor-pointer flex items-center gap-2 text-[12px] font-mono">
          {copied ? <><Check size={14} className="text-green-500" /> Copied</> : <><Copy size={14} /> Copy code</>}
        </button>
      </div>
      <div className="p-6 overflow-x-auto text-[13px] md:text-[14px] font-mono leading-relaxed text-white/80">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
          >
            {activeCodeObj?.code}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
