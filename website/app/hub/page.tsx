"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Search, Box, ShieldAlert, Cpu, Check, Tag } from "lucide-react";

// --- VERİ LİSTESİ ---
const initialValidators = [
  { id: "v1", name: "Ban List", desc: "Validates that the output does not contain banned words, using fuzzy search.", tags: ["STRING", "BRAND RISK"], date: "UPDATED 3 WEEKS AGO", icon: "ML" },
  { id: "v2", name: "Bert Toxic Language Validator", desc: "Validates that the input string does not contain toxic language based on a BERT model.", tags: ["BRAND RISK"], date: "UPDATED 3 WEEKS AGO", icon: "ML" },
  { id: "v3", name: "Bias Check", desc: "Validates that the text is free from biases related to age, gender, sex, ethnicity, religion, etc.", tags: ["STRING", "BRAND RISK"], date: "UPDATED 3 WEEKS AGO", icon: "ML" },
  { id: "v4", name: "Competitor Check", desc: "Flags mentions of competitors. Fixes responses by filtering out competitor names.", tags: ["STRING", "BRAND RISK"], date: "UPDATED 3 WEEKS AGO", icon: "ML" },
  { id: "v5", name: "Ban List (Test)", desc: "A Aegisora AI validator to check if the LLM-generated text contains a substring.", tags: ["STRING", "FORMATTING"], date: "UPDATED 3 WEEKS AGO", icon: "Rules", href: "/hub/ban-list" },
  { id: "v6", name: "Cucumber Expression Match", desc: "Validates that the input string matches a specified cucumber expression.", tags: ["STRING", "BRAND RISK"], date: "UPDATED 3 WEEKS AGO", icon: "Rules" },
  { id: "v7", name: "Detect Jailbreak", desc: "Detects jailbreak attempts using the Rebuff prompt library.", tags: ["JAILBREAKING"], date: "UPDATED 3 WEEKS AGO", icon: "ML" },
  { id: "v8", name: "Detect PII", desc: "Detects personally identifiable information (PII) in text, using Microsoft Presidio.", tags: ["DATA LEAKAGE"], date: "UPDATED 3 WEEKS AGO", icon: "ML" },
];

export default function HubIndex() {
  const [mounted, setMounted] = useState(false);

  // Seçili Filtreler State'i
  const [selectedFilters, setSelectedFilters] = useState<string[]>(["RAG"]);

  // Seçili Validator Kartları State'i
  const [selectedValidators, setSelectedValidators] = useState<string[]>([]);

  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  // Filtre Toggle Fonksiyonu
  const toggleFilter = (filterName: string) => {
    setSelectedFilters(prev =>
      prev.includes(filterName)
        ? prev.filter(f => f !== filterName)
        : [...prev, filterName]
    );
  };

  // Validator Seçme/Bırakma Fonksiyonu
  const toggleValidator = (id: string) => {
    setSelectedValidators(prev =>
      prev.includes(id)
        ? prev.filter(v => v !== id)
        : [...prev, id]
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAFA] font-sans">
      <Navbar />

      {/* Top Banner */}
      <div className="w-full bg-white b order-b b order-slate-200 py-12 px-6">
        <div className="max-w-[1400px] mx-auto flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
          <div>
            <h1 className="text-[32px] md:text-[40px] font-black text-slate-900 tracking-tight mb-2">The Aegisora Hub</h1>
            <p className="text-[16px] text-slate-500 font-medium">Search and explore vast world of validators through lightning-fast search</p>
          </div>
          <div className="w-full md:w-[400px] relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search Validators..."
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border b order-slate-200 rounded-xl focus:outline-none focus:b order-[#0066FF] focus:ring-2 focus:ring-[#0066FF]/20 transition-all font-medium text-slate-900"
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto w-full flex-1 flex flex-col md:flex-row px-6 py-8 gap-8">

        {/* Left Sidebar Filters */}
        <aside className="w-full md:w-[260px] flex-shrink-0 space-y-8">
          <div className="flex items-center justify-between font-bold text-slate-900 b order-b b order-slate-200 pb-2">
            <span>FILTERS</span>
            <span className="text-[12px] bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{selectedFilters.length}</span>
          </div>

          {/* Use Cases Filters */}
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Use Cases</div>
            <div className="space-y-2">
              {["Chatbot", "Customer Support", "Structured Data", "RAG", "Codegen", "Summarization"].map((item) => {
                const isSelected = selectedFilters.includes(item);
                return (
                  <label key={item} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleFilter(item)}>
                    {/* Checkbox Kutusu - Tıklanınca İçi Mavi Olur */}
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#0066FF] b order-[#0066FF]' : 'b order-slate-300 group-hover:b order-[#0066FF]'}`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-[13px] font-medium transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>{item}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Risk Category Filters */}
          <div>
            <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Risk Category</div>
            <div className="space-y-2">
              {["Brand Risk", "Formatting", "Etiquette", "Jailbreaking", "Data Leakage", "Code Exploits", "Factuality"].map((item) => {
                const isSelected = selectedFilters.includes(item);
                return (
                  <label key={item} className="flex items-center gap-3 cursor-pointer group" onClick={() => toggleFilter(item)}>
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${isSelected ? 'bg-[#0066FF] b order-[#0066FF]' : 'b order-slate-300 group-hover:b order-[#0066FF]'}`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-[13px] font-medium transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-600 group-hover:text-slate-900'}`}>{item}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Main Content (Grid) */}
        <main className="flex-1 relative pb-32">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-[16px] font-bold text-slate-900">Validators <span className="text-slate-400 font-normal ml-2">65 / 65</span></h2>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {initialValidators.map((val) => {
              const isSelected = selectedValidators.includes(val.id);

              return (
              <div
                key={val.id}
                className={`bg-white border rounded-xl p-5 transition-all flex flex-col justify-between group ${
                  isSelected ? 'b order-[#0066FF] shado w-md ring-1 ring-[#0066FF]/20' : 'b order-slate-200 hover:b order-[#0066FF]/40 hover:shado w-sm'
                }`}
              >
                <div>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="text-[10px] font-bold text-slate-400 mb-1">{val.date}</div>
                      <Link href={val.href || "#"} className={`text-[18px] font-bold transition-colors flex items-center gap-2 ${isSelected ? 'text-[#0066FF]' : 'text-slate-900 group-hover:text-[#0066FF]'}`}>
                        <Box className="w-5 h-5 text-emerald-500" /> {val.name}
                      </Link>
                    </div>

                    {/* Seçme (Select) Butonu - Tıklanınca Rengi ve Yazısı Değişir */}
                    <button
                      onClick={() => toggleValidator(val.id)}
                      className={`px-4 py-1.5 border rounded-md text-[13px] font-bold transition-all ${
                        isSelected
                          ? 'bg-[#0066FF] b order-[#0066FF] text-white'
                          : 'b order-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {isSelected ? 'Selected' : 'Select'}
                    </button>

                  </div>
                  <p className="text-[14px] text-slate-600 leading-relaxed font-medium mb-6">{val.desc}</p>
                </div>
                <div className="flex justify-between items-center pt-4 b order-t b order-slate-100">
                  <div className="flex gap-2">
                    {val.tags.map(tag => (
                      <span key={tag} className="flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-600 text-[10px] font-bold rounded uppercase tracking-wider">
                        <Tag className="w-3 h-3" /> {tag}
                      </span>
                    ))}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 flex items-center gap-1">
                    {val.icon === 'ML' ? <Cpu className="w-3 h-3"/> : <ShieldAlert className="w-3 h-3"/>} {val.icon}
                  </span>
                </div>
              </div>
            )})}
          </div>
        </main>
      </div>

      {/*
        Bottom Sticky Action Bar
        SADECE EN AZ 1 KART SEÇİLDİĞİNDE AÅAĞIDAN YUKARI KAYARAK AÇILIR
      */}
      <AnimatePresence>
        {selectedValidators.length > 0 && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed bottom-0 left-0 w-full bg-slate-900 b order-t b order-slate-800 p-4 z-50 shado w-[0_-10px_40px_rgba(0,0,0,0.2)]"
          >
            <div className="max-w-[1400px] mx-auto flex items-center justify-center gap-8">
              <div className="text-white font-bold text-[14px]">{selectedValidators.length} VALIDATORS SELECTED</div>
              <button className="px-6 py-2.5 rounded-lg text-[14px] font-bold bg-[#FFC107] text-slate-900 hover:bg-[#FFCA28] transition-colors">
                Generate Code
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
