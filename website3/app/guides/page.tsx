"use client";

import { Navbar } from "@/components/aegisora/layout/Navbar";
import { Footer } from "@/components/aegisora/layout/Footer";
import { guidesData, filterCategories } from "@/lib/guides-data";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function GuidesPage() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [visibleCount, setVisibleCount] = useState(10);

  const filteredGuides = useMemo(() => {
    return guidesData.filter((guide) => {
      const matchesSearch = guide.title.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesFilter = activeFilter === "All" || guide.category === activeFilter;
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, activeFilter]);

  const displayedGuides = filteredGuides.slice(0, visibleCount);
  const hasMore = visibleCount < filteredGuides.length;

  return (
    <main className="min-h-screen bg-[#FDFDFD] text-[#111111] font-sans selection:bg-[#0066FF] selection:text-white relative overflow-hidden">
      <Navbar />

      {/* KESİKLİ ÇİZGİ ARKA PLAN (SVG Curve) */}
      <div className="absolute top-0 left-0 w-full h-[1200px] pointer-events-none z-0 overflow-hidden">
        <svg viewBox="0 0 1440 1200" fill="none" xmlns="http://www.w3.org/2000/svg" className="absolute top-0 left-0 w-full h-full opacity-40">
          <path d="M-100 800 C 200 600, 300 200, 1500 -100" stroke="#0066FF" strokeWidth="1" strokeDasharray="6 6" fill="none" />
        </svg>
      </div>

      <div className="pt-40 pb-24 px-6 max-w-[1400px] mx-auto relative z-10">
        
        {/* ANA BAŞLIK */}
        <div className="mb-16 md:mb-24">
          <h1 className="text-[56px] md:text-[80px] font-medium tracking-tight text-black">
            Guides
          </h1>
        </div>

        <div className="flex flex-col lg:flex-row gap-12 lg:gap-24 relative">
          
          {/* SOL: YAPIŞKAN FİLTRE & ARAMA MENÜSÜ */}
          <div className="lg:w-[280px] flex-shrink-0 relative">
            <div className="sticky top-[140px] flex flex-col gap-6">
              
              {/* Sol Taraf Mavi İnce Dikey Çizgi ve Nokta (Görseldeki gibi) */}
              <div className="hidden lg:block absolute left-[260px] top-[-100px] bottom-[-800px] w-[1px] bg-[#0066FF]/20 -z-10"></div>
              <div className="hidden lg:block absolute left-[258.5px] top-[20px] w-1 h-1 rounded-full bg-[#0066FF]"></div>

              {/* Arama Kutusu */}
              <div className="relative w-full md:w-[240px]">
                <input 
                  type="text" 
                  placeholder="Search" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-gray-200 rounded-md py-2.5 px-4 text-[14px] text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0066FF] transition-colors shadow-sm font-sans"
                />
              </div>

              {/* Filtre Butonları (Görseldeki gibi alt alta ve monospace) */}
              <div className="flex flex-col gap-1 w-full md:w-[240px]">
                {filterCategories.map(category => (
                  <button
                    type="button"
                    key={category}
                    onClick={() => { setActiveFilter(category); setVisibleCount(10); }}
                    className={`text-left px-4 py-2.5 rounded-md font-mono text-[13px] transition-all duration-200 cursor-pointer ${
                      activeFilter === category 
                        ? 'bg-[#111111] text-white shadow-md' 
                        : 'bg-transparent text-gray-500 hover:bg-gray-100 hover:text-black'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>

            </div>
          </div>

          {/* SAĞ: KART İÇERİK GRID'İ */}
          <div className="flex-1 flex flex-col items-center">
            
            <AnimatePresence mode="popLayout">
              <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-8">
                {displayedGuides.length > 0 ? displayedGuides.map((guide, idx) => (
                  <motion.div
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.3 }}
                    key={guide.slug + idx}
                  >
                    <Link href={`/guides/${guide.slug}`} className="group flex flex-col bg-[#0A0A0A] rounded-2xl overflow-hidden shadow-[0_10px_40px_rgba(0,0,0,0.1)] hover:shadow-[0_20px_60px_rgba(0,0,0,0.2)] hover:-translate-y-1 transition-all duration-300 border border-white/5 cursor-pointer h-full">
                      <div className={`h-[220px] w-full bg-gradient-to-br ${guide.coverGradient} relative overflow-hidden flex items-center justify-center p-8`}>
                        <div className={`absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/${guide.pattern}.png')] opacity-20 mix-blend-overlay group-hover:scale-110 transition-transform duration-700`}></div>
                        <h3 className="relative z-10 text-[26px] md:text-[30px] font-medium leading-[1.15] text-white/90 group-hover:text-white text-center tracking-tight">
                          {guide.title}
                        </h3>
                      </div>
                      <div className="p-6 md:p-8 flex flex-col bg-[#0A0A0A] flex-1">
                        <div className="inline-flex bg-white/5 border border-white/10 px-3 py-1 rounded text-white/50 font-mono text-[11px] font-bold mb-5 w-max">
                          {guide.category}
                        </div>
                        <h4 className="text-[18px] md:text-[20px] font-medium leading-[1.3] text-white/90 group-hover:text-white mb-8">
                          {guide.title}
                        </h4>
                        <div className="mt-auto">
                          <ArrowUpRight size={20} className="text-white/40 group-hover:text-white transition-colors" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                )) : (
                  <div className="col-span-full py-20 text-center text-gray-400 font-mono text-[14px]">
                    No guides found matching your criteria.
                  </div>
                )}
              </div>
            </AnimatePresence>

            {hasMore && (
              <button 
                onClick={() => setVisibleCount(prev => prev + 10)}
                className="mt-16 px-6 py-2.5 bg-white border border-gray-200 text-black font-mono text-[13px] font-bold rounded-md shadow-sm hover:bg-gray-50 hover:border-gray-300 transition-colors cursor-pointer"
              >
                Show more
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TEMA GEÇİŞ REFERANSI */}
      <div id="dark-section">
        {/* Footer'a devrettiğimiz için buradaki kopya <section> silindi */}
        <Footer />
      </div>

    </main>
  );
}
