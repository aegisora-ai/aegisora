"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, Sparkles } from "lucide-react"; // Github importu kaldirildi

// Lucide paketine bagimli kalmamak icin ozel SVG ikonumuz
const GithubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
);

export function DocsNavbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0A0D18] text-white">
      <div className="flex h-16 items-center px-4 md:px-6 gap-4">
        {/* Logo & Home Link */}
        <div className="flex items-center gap-6 w-[240px] shrink-0">
          <Link href="/" className="flex items-center gap-2 cursor-pointer">
            <Image src="/aegisora-logo-white.png" alt="Aegisora" width={20} height={20} className="object-contain" priority />
            <span className="font-semibold text-[16px] tracking-tight">Aegisora Docs</span>
          </Link>
          <Link href="/" className="hidden md:flex text-[13px] text-white/60 hover:text-white transition-colors cursor-pointer">
            Home
          </Link>
        </div>

        {/* Search Bar (Orta) */}
        <div className="flex-1 flex justify-center max-w-2xl mx-auto hidden lg:flex">
          <button className="flex items-center gap-2 w-full max-w-[400px] bg-white/5 border border-white/10 hover:border-white/20 transition-colors rounded-lg px-3 py-1.5 text-white/50 text-[13px] cursor-pointer">
            <Search size={14} />
            <span className="flex-1 text-left">Search...</span>
            <span className="border border-white/20 rounded px-1.5 text-[10px]">Ctrl K</span>
          </button>
        </div>

        {/* Sag Taraf (Ask AI, GitHub, CTA) */}
        <div className="flex items-center gap-4 shrink-0 ml-auto">
          <button className="hidden md:flex items-center gap-2 text-[13px] font-medium text-white/80 hover:text-white transition-colors cursor-pointer">
            <Sparkles size={14} className="text-[#3ca6ff]" />
            Ask AI
          </button>
          
          <Link href="https://github.com/aegisora-ai/aegisora" target="_blank" className="hidden md:flex items-center gap-2 text-[13px] font-medium text-white/80 hover:text-white transition-colors cursor-pointer">
            <GithubIcon />
            GitHub
          </Link>
          
          <Link href="/signup" className="hidden sm:flex text-[13px] font-mono font-bold px-4 py-2 bg-[#0066FF] hover:bg-[#3ca6ff] text-white rounded-md transition-colors cursor-pointer">
            Try Aegisora
          </Link>
        </div>
      </div>
    </header>
  );
}
