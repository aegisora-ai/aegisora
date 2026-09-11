"use client";

import { Navbar } from "@/components/aegisora/layout/Navbar";
import { Footer } from "@/components/aegisora/layout/Footer";
import { blogPosts, allCategories } from "@/lib/blog-data";
import Link from "next/link";
import { Search, Filter, Clock } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function BlogPage() {
  const [activeTab, setActiveTab] = useState("View All");
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  
  const filterRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) {
        setIsFilterOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleFilter = (category: string) => {
    setSelectedFilters(prev => 
      prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]
    );
  };

  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === "View All" || post.category === activeTab;
    const matchesCheckbox = selectedFilters.length === 0 || selectedFilters.includes(post.category);
    return matchesSearch && matchesTab && matchesCheckbox;
  });

  const isFiltering = searchQuery !== "" || selectedFilters.length > 0 || activeTab !== "View All";
  const displayFeatured = !isFiltering && filteredPosts.find(post => post.featured);
  const displayGrid = displayFeatured ? filteredPosts.filter(post => !post.featured) : filteredPosts;

  const topTabs = ["View All", "LangChain Labs", "Agent Architecture", "Observability & Evals", "Case Studies"];

  return (
    <main className="min-h-screen bg-[#050505] text-white font-sans flex flex-col">
      <Navbar />

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      <div className="flex-1 max-w-[1300px] w-full mx-auto px-6 pt-32 pb-24">
        
        {/* ÇİZGİLİ HEADER & ARAMA/FİLTRE */}
        <div className="relative mb-12 flex flex-col items-center">
          {/* Arka plan çizgileri */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10 -z-10 hidden md:block"></div>
          <div className="absolute top-1/2 left-1/4 w-1.5 h-1.5 bg-[#3ca6ff] rounded-full -translate-y-1/2 hidden md:block"></div>
          <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-[#3ca6ff] rounded-full -translate-y-1/2 hidden md:block"></div>

          <h1 className="text-[32px] md:text-[42px] font-medium tracking-tight bg-[#050505] px-6 z-10 mb-8">Featured stories</h1>
          
          <div className="w-full flex flex-col lg:flex-row items-center justify-between gap-6 bg-[#050505] z-10">
            {/* Sol Tabs */}
            <div className="flex items-center gap-2 overflow-x-auto hide-scrollbar w-full lg:w-auto pb-2 lg:pb-0">
              {topTabs.map(tab => (
                <button 
                  key={tab}
                  type="button" 
                  onClick={() => setActiveTab(tab)}
                  className={`text-[13px] font-mono px-4 py-2 rounded-md whitespace-nowrap transition-colors border ${activeTab === tab ? 'bg-white/10 text-white border-white/20' : 'bg-[#0A0A0A] text-white/60 border-white/5 hover:text-white hover:border-white/20'}`}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Sağ Arama/Filtre */}
            <div className="flex items-center gap-3 w-full lg:w-auto relative" ref={filterRef}>
              <div className="relative w-full sm:w-[250px]">
                <input 
                  type="text" 
                  placeholder="Search articles" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#0A0A0A] border border-white/10 rounded-md py-2 pl-4 pr-10 text-[13px] text-white focus:outline-none focus:border-white/30 transition-colors font-mono"
                />
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40" size={16} />
              </div>
              
              <button 
                type="button" 
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`flex items-center justify-center gap-2 border rounded-md py-2 px-4 text-[13px] font-mono text-white transition-colors whitespace-nowrap ${isFilterOpen ? 'bg-white/10 border-white/30' : 'bg-[#0A0A0A] border-white/10 hover:bg-white/5'}`}
              >
                <Filter size={14} /> Filter by
                {selectedFilters.length > 0 && <span className="bg-[#3ca6ff] text-[#050505] text-[10px] font-bold px-1.5 py-0.5 rounded-sm ml-1">{selectedFilters.length}</span>}
              </button>

              <AnimatePresence>
                {isFilterOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 5 }}
                    className="absolute right-0 top-full mt-2 w-[260px] bg-[#0A0A0A] border border-white/10 rounded-md shadow-2xl z-50 max-h-[400px] overflow-y-auto hide-scrollbar py-2"
                  >
                    {allCategories.map(cat => {
                      const isChecked = selectedFilters.includes(cat);
                      return (
                        <label key={cat} className="flex items-center gap-3 px-4 py-2 cursor-pointer group hover:bg-white/5 transition-colors">
                          <div className={`relative flex items-center justify-center w-[14px] h-[14px] border rounded-sm flex-shrink-0 transition-colors ${isChecked ? 'bg-transparent border-[#3ca6ff]' : 'border-white/30 group-hover:border-white/60'}`}>
                            <input type="checkbox" className="hidden" checked={isChecked} onChange={() => toggleFilter(cat)} />
                            {isChecked && <div className="w-2 h-2 bg-[#3ca6ff] rounded-[1px]"></div>}
                          </div>
                          <span className="font-mono text-[12px] text-white/80 group-hover:text-white transition-colors">{cat}</span>
                        </label>
                      );
                    })}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Featured Post Card */}
        {displayFeatured && (
          <Link href={`/blog/${displayFeatured.slug}`} className="block group mb-16 cursor-pointer">
            <div className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden flex flex-col md:flex-row group-hover:border-white/30 transition-colors shadow-lg">
              <div className="p-8 md:p-12 md:w-[45%] flex flex-col justify-center relative z-10">
                <div className="inline-flex bg-white/5 border border-white/10 px-3 py-1 rounded-md text-white/60 font-mono text-[11px] font-bold mb-6 w-max">
                  {displayFeatured.category}
                </div>
                <h2 className="text-[32px] md:text-[42px] font-medium leading-[1.1] tracking-tight mb-8 text-[#8AC7FF] group-hover:text-white transition-colors">
                  {displayFeatured.title}
                </h2>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-[url('https://i.pravatar.cc/100?img=11')] bg-cover"></div>
                    <div>
                      <div className="font-bold text-[14px]">{displayFeatured.author}</div>
                      <div className="text-white/50 text-[12px]">{displayFeatured.date}</div>
                    </div>
                  </div>
                  <div className="text-white/40 text-[12px] font-mono flex items-center gap-1.5 bg-white/5 px-3 py-1.5 rounded-md border border-white/5">
                    <Clock size={12} /> {displayFeatured.readTime}
                  </div>
                </div>
              </div>
              <div className={`md:w-[55%] h-[300px] md:h-auto bg-gradient-to-br ${displayFeatured.coverGradient} border-l border-white/10 relative overflow-hidden flex flex-col items-start justify-end p-12`}>
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
                 <div className="absolute top-8 left-8 w-12 h-12 bg-[#3ca6ff]/20 rounded-xl flex items-center justify-center border border-[#3ca6ff]/30">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 22H22L12 2Z" fill="#3ca6ff"/>
                    </svg>
                 </div>
                 <h2 className="relative z-10 text-white text-[48px] md:text-[64px] font-medium leading-[1] tracking-tight">Own Your<br/>Intelligence</h2>
                 <div className="absolute right-[-10%] bottom-[-20%] w-[80%] h-[150%] bg-[url('https://www.transparenttextures.com/patterns/connected-dots.png')] opacity-40 transform rotate-12"></div>
              </div>
            </div>
          </Link>
        )}

        {/* Recent Stories Header */}
        <div className="relative mb-12 flex flex-col items-center">
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/10 -z-10"></div>
          <div className="absolute top-1/2 left-1/4 w-1.5 h-1.5 bg-[#3ca6ff] rounded-full -translate-y-1/2 hidden md:block"></div>
          <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-[#3ca6ff] rounded-full -translate-y-1/2 hidden md:block"></div>
          <h2 className="text-[28px] font-medium tracking-tight bg-[#050505] px-6 z-10">Recent stories</h2>
        </div>

        {/* Grid Posts */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
          {displayGrid.length > 0 ? displayGrid.map((post) => (
            <Link href={`/blog/${post.slug}`} key={post.slug} className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden flex flex-col group hover:border-white/30 transition-colors cursor-pointer shadow-lg">
              <div className={`h-[220px] w-full bg-gradient-to-br ${post.coverGradient} border-b border-white/5 relative overflow-hidden flex flex-col items-center justify-center p-8`}>
                 <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20 mix-blend-overlay"></div>
                 <div className="absolute top-4 right-4 w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center border border-white/10">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2L2 22H22L12 2Z" fill="white" className="opacity-80"/>
                    </svg>
                 </div>
                 <h4 className="relative z-10 text-[24px] font-medium leading-[1.2] text-white/90 group-hover:text-white transition-colors text-center">{post.title}</h4>
                 <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-full h-[60px] opacity-40 bg-[radial-gradient(ellipse_at_top,rgba(255,255,255,0.2)_0%,rgba(0,0,0,0)_60%)]"></div>
              </div>
              <div className="p-6 flex flex-col flex-1 bg-[#0A0A0A]">
                <div className="inline-flex bg-white/5 border border-white/10 px-2.5 py-1 rounded text-white/50 font-mono text-[10px] font-bold mb-4 w-max uppercase tracking-wider">
                  {post.category}
                </div>
                <h3 className="text-[18px] font-medium leading-[1.4] mb-6 text-[#8AC7FF] group-hover:text-white transition-colors">{post.title}</h3>
                <div className="mt-auto flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3ca6ff] to-[#0A0A0A]"></div>
                    <div className="text-white/80 text-[13px] font-bold">{post.author}<div className="text-white/40 text-[11px] font-normal">{post.date}</div></div>
                  </div>
                  <div className="text-white/40 text-[12px] font-mono flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded border border-white/5">
                     <Clock size={12} /> {post.readTime}
                  </div>
                </div>
              </div>
            </Link>
          )) : (
            <div className="col-span-full py-20 text-center text-white/40 font-mono text-[14px]">No articles found matching your criteria.</div>
          )}
        </div>

        {/* Newsletter Inline Banner (Alt kısım) */}
        <div className="max-w-[1000px] mx-auto bg-[#0A0A0A] border border-[#3ca6ff]/20 rounded-2xl p-2 pl-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(60,166,255,0.05)] mb-8">
          <div className="flex items-center gap-4 py-2">
            <div className="w-12 h-12 bg-[#111111] rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2L2 22H22L12 2Z" fill="#3ca6ff"/>
              </svg>
            </div>
            <span className="text-[#8AC7FF] font-mono text-[14px] font-medium tracking-wide">
              Sign up for our newsletter to stay up to date
            </span>
          </div>
          <div className="flex w-full md:w-[400px] bg-[#050505] border border-white/10 rounded-xl overflow-hidden h-[50px]">
            <input type="email" placeholder="john.doe@acme.com" className="w-full bg-transparent px-4 text-[13px] font-mono text-white focus:outline-none" />
            <button type="button" className="bg-[#111] border-l border-white/10 text-white/80 font-mono text-[13px] font-bold px-6 hover:bg-white/5 transition-colors whitespace-nowrap">Subscribe</button>
          </div>
        </div>

      </div>

      <Footer />
    </main>
  );
}
