"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { ChevronDown, Menu, X, Server, Shield, Eye, Code2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const pathname = usePathname();
  
  const isLightRoute = pathname.includes('/guides') || pathname.includes('/blog') || pathname.includes('/docs');
  
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null); 
  
  const [theme, setTheme] = useState<"dark" | "light">(isLightRoute ? "light" : "dark");

  useEffect(() => {
    setTheme(isLightRoute ? "light" : "dark");
    setIsMobileMenuOpen(false); 
  }, [pathname, isLightRoute]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
      if (window.scrollY < 50) {
        setTheme(isLightRoute ? "light" : "dark");
      }
    };
    window.addEventListener("scroll", handleScroll);
    
    const darkClasses = ['bg-[#030612]', 'bg-[#050505]', 'bg-[#0A0D18]', 'bg-[#111111]', 'bg-[#000000]', 'bg-black'];
    const lightClasses = ['bg-white', 'bg-[#FDFDFD]', 'bg-gray-50', 'bg-gray-100'];
    const elements = document.querySelectorAll('main, section, footer, div#dark-section');

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const className = entry.target.className || "";
          const id = entry.target.id || "";
          const isDarkElement = id === 'dark-section' || darkClasses.some(c => className.includes(c));
          const isLightElement = lightClasses.some(c => className.includes(c));
          if (isLightElement) setTheme("light");
          else if (isDarkElement) setTheme("dark");
        }
      });
    }, { rootMargin: "-80px 0px -80% 0px" });

    elements.forEach(el => observer.observe(el));

    return () => {
      window.removeEventListener("scroll", handleScroll);
      elements.forEach(el => observer.unobserve(el));
    };
  }, [isLightRoute]);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobileMenuOpen]);

  const toggleMobile = (menu: string) => {
    setMobileExpanded(mobileExpanded === menu ? null : menu);
  };

  const isDark = theme === "dark";
  const textColor = isDark ? "text-white" : "text-[#111111]";
  const hoverBg = isDark ? "hover:bg-white/10" : "hover:bg-black/5";

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
      isMobileMenuOpen 
        ? `h-[100dvh] overflow-y-auto ${isDark ? "bg-[#030612]" : "bg-white"}` 
        : (isScrolled ? "pt-4 px-4 md:px-6" : "pt-6 px-4 md:px-6")
    }`}>
      
      <div className={`max-w-[1400px] mx-auto transition-all duration-500 ${
        isMobileMenuOpen
          ? "pt-6 px-2 bg-transparent border-transparent" 
          : `rounded-2xl border ${isScrolled ? (isDark ? "bg-black bg-opacity-95 backdrop-blur-xl border-white/10 shadow-lg" : "bg-white bg-opacity-95 backdrop-blur-xl border-gray-200 shadow-lg") : "bg-transparent border-transparent"}`
      }`}>
        <nav className="flex items-center justify-between px-6 py-4 relative">
          
          <Link href="/" className="flex items-center gap-2 z-50 cursor-pointer" onClick={() => setIsMobileMenuOpen(false)}>
            <Image src="/aegisora-logo-white.png" alt="Aegisora" width={24} height={24} className={`object-contain transition-all duration-500 ${isDark ? "" : "invert"}`} priority />
            <span className={`font-semibold text-[20px] tracking-tight transition-colors duration-500 ${textColor}`}>Aegisora</span>
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden lg:flex items-center gap-8">
            <div className="relative" onMouseEnter={() => setActiveDropdown("products")} onMouseLeave={() => setActiveDropdown(null)}>
              <button className={`flex items-center gap-1.5 text-[14px] font-medium transition-colors duration-500 ${textColor} opacity-80 hover:opacity-100 cursor-pointer`}>Products <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === "products" ? "rotate-180" : ""}`} /></button>
              <AnimatePresence>
                {activeDropdown === "products" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }} className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[600px] rounded-2xl border p-6 grid grid-cols-2 gap-6 shadow-2xl ${isDark ? "bg-[#0A0D18] border-white/10" : "bg-white border-gray-200"}`}>
                    <div className="flex flex-col gap-6">
                      <h3 className={`text-[12px] font-mono font-bold uppercase tracking-widest ${isDark ? "text-white/40" : "text-black/40"}`}>Agent Improvement</h3>
                      <Link href="/engine" className="flex gap-4 items-start group cursor-pointer"><div className={`p-2 rounded-lg border transition-colors ${isDark ? "bg-white/5 border-white/10 group-hover:bg-[#3ca6ff]/10 group-hover:border-[#3ca6ff]/30" : "bg-gray-50 border-gray-200 group-hover:bg-[#3ca6ff]/10 group-hover:border-[#3ca6ff]/30"}`}><Server size={20} className="text-[#3ca6ff]" /></div><div><div className={`font-bold text-[15px] mb-1 group-hover:text-[#3ca6ff] transition-colors ${textColor}`}>Engine</div><div className={`text-[13px] leading-snug ${isDark ? "text-white/60" : "text-gray-500"}`}>Improve agents autonomously</div></div></Link>
                      <Link href="#" className="flex gap-4 items-start group cursor-pointer"><div className={`p-2 rounded-lg border transition-colors ${isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}><Eye size={20} className="text-[#3ca6ff]" /></div><div><div className={`font-bold text-[15px] mb-1 ${textColor}`}>Observability</div><div className={`text-[13px] leading-snug ${isDark ? "text-white/60" : "text-gray-500"}`}>See exactly what your agents are doing</div></div></Link>
                    </div>
                    <div className="flex flex-col gap-6">
                      <h3 className={`text-[12px] font-mono font-bold uppercase tracking-widest ${isDark ? "text-white/40" : "text-black/40"}`}>Agent Infrastructure</h3>
                      <Link href="#" className="flex gap-4 items-start group cursor-pointer"><div className={`p-2 rounded-lg border transition-colors ${isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}><Shield size={20} className="text-[#3ca6ff]" /></div><div><div className={`font-bold text-[15px] mb-1 ${textColor}`}>Shield (Gateway)</div><div className={`text-[13px] leading-snug ${isDark ? "text-white/60" : "text-gray-500"}`}>Control agent model calls and deployments</div></div></Link>
                      <Link href="#" className="flex gap-4 items-start group cursor-pointer"><div className={`p-2 rounded-lg border transition-colors ${isDark ? "bg-white/5 border-white/10" : "bg-gray-50 border-gray-200"}`}><Code2 size={20} className="text-[#3ca6ff]" /></div><div><div className={`font-bold text-[15px] mb-1 ${textColor}`}>Sandboxes</div><div className={`text-[13px] leading-snug ${isDark ? "text-white/60" : "text-gray-500"}`}>Run agent-generated code safely</div></div></Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="relative" onMouseEnter={() => setActiveDropdown("learn")} onMouseLeave={() => setActiveDropdown(null)}>
              <button className={`flex items-center gap-1.5 text-[14px] font-medium transition-colors duration-500 ${textColor} opacity-80 hover:opacity-100 cursor-pointer`}>Learn <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === "learn" ? "rotate-180" : ""}`} /></button>
              <AnimatePresence>
                {activeDropdown === "learn" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }} className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[200px] rounded-xl border py-2 shadow-2xl flex flex-col ${isDark ? "bg-[#0A0D18] border-white/10" : "bg-white border-gray-200"}`}>
                    <Link href="/blog" className={`px-4 py-2.5 text-[14px] font-medium ${textColor} ${hoverBg} transition-colors cursor-pointer`}>Blog</Link>
                    <Link href="/guides" className={`px-4 py-2.5 text-[14px] font-medium ${textColor} ${hoverBg} transition-colors cursor-pointer`}>Guides</Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/docs" className={`text-[14px] font-medium transition-colors duration-500 ${textColor} opacity-80 hover:opacity-100 cursor-pointer`}>Docs</Link>
            
            <div className="relative" onMouseEnter={() => setActiveDropdown("company")} onMouseLeave={() => setActiveDropdown(null)}>
              <button className={`flex items-center gap-1.5 text-[14px] font-medium transition-colors duration-500 ${textColor} opacity-80 hover:opacity-100 cursor-pointer`}>Company <ChevronDown size={14} className={`transition-transform duration-200 ${activeDropdown === "company" ? "rotate-180" : ""}`} /></button>
              <AnimatePresence>
                {activeDropdown === "company" && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.2 }} className={`absolute top-full left-1/2 -translate-x-1/2 mt-4 w-[200px] rounded-xl border py-2 shadow-2xl flex flex-col ${isDark ? "bg-[#0A0D18] border-white/10" : "bg-white border-gray-200"}`}>
                    <Link href="/about" className={`px-4 py-2.5 text-[14px] font-medium ${textColor} ${hoverBg} transition-colors cursor-pointer`}>About Us</Link>
                    <Link href="/contact" className={`px-4 py-2.5 text-[14px] font-medium ${textColor} ${hoverBg} transition-colors cursor-pointer`}>Contact</Link>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <Link href="/pricing" className={`text-[14px] font-medium transition-colors duration-500 ${textColor} opacity-80 hover:opacity-100 cursor-pointer`}>Pricing</Link>
          </div>

          <div className="hidden lg:flex items-center gap-4 z-50">
            <Link href="/signup" className={`text-[13px] font-mono font-bold px-5 py-2.5 rounded-md transition-colors cursor-pointer ${isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"}`}>Try Aegisora</Link>
            <Link href="/contact" className={`text-[13px] font-mono font-bold px-5 py-2.5 rounded-md border transition-colors cursor-pointer ${isDark ? "text-white border-white/20 hover:bg-white/10" : "text-black border-gray-300 hover:bg-black/5"}`}>Get a demo</Link>
          </div>

          <button className="lg:hidden z-[60] relative cursor-pointer" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
            {isMobileMenuOpen 
              ? <X size={28} className={isDark ? "text-white" : "text-black"} /> 
              : <Menu size={28} className={textColor} />
            }
          </button>
        </nav>
      </div>

      {/* MOBILE FULL SCREEN MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className={`w-full max-w-[1400px] mx-auto px-8 pt-4 pb-32 flex flex-col lg:hidden ${textColor}`}
          >
            {/* 1. Products */}
            <div className={`border-b ${isDark ? "border-white/10" : "border-gray-200"}`}>
              <button onClick={() => toggleMobile("products")} className={`cursor-pointer w-full flex justify-between items-center py-5 text-[18px] font-medium transition-colors ${mobileExpanded === "products" ? "text-[#3ca6ff]" : ""}`}>
                Products <ChevronDown size={20} className={`transition-transform duration-300 ${mobileExpanded === "products" ? "rotate-180 text-[#3ca6ff]" : "opacity-50"}`} />
              </button>
              <AnimatePresence>
                {mobileExpanded === "products" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="flex flex-col gap-8 py-4 pb-8">
                      <div className="flex flex-col gap-5">
                        <div className={`text-[12px] font-mono font-bold uppercase tracking-widest ${isDark ? "text-white/40" : "text-gray-400"}`}>Agent Improvement</div>
                        <Link href="/engine" className="cursor-pointer flex flex-col gap-1 group" onClick={() => setIsMobileMenuOpen(false)}>
                          <span className="text-[17px] font-bold group-hover:text-[#3ca6ff] transition-colors">Aegisora Engine</span>
                        </Link>
                        <Link href="/observability" className="cursor-pointer flex flex-col gap-1 group" onClick={() => setIsMobileMenuOpen(false)}>
                          <span className="text-[17px] font-bold group-hover:text-[#3ca6ff] transition-colors">Observability</span>
                        </Link>
                        <Link href="/evaluation" className="cursor-pointer flex flex-col gap-1 group" onClick={() => setIsMobileMenuOpen(false)}>
                          <span className="text-[17px] font-bold group-hover:text-[#3ca6ff] transition-colors">Evaluation</span>
                        </Link>
                      </div>
                      <div className="flex flex-col gap-5">
                        <div className={`text-[12px] font-mono font-bold uppercase tracking-widest ${isDark ? "text-white/40" : "text-gray-400"}`}>Agent Infrastructure</div>
                        <Link href="/shield" className="cursor-pointer flex flex-col gap-1 group" onClick={() => setIsMobileMenuOpen(false)}>
                          <span className="text-[17px] font-bold group-hover:text-[#3ca6ff] transition-colors">Shield (Gateway)</span>
                        </Link>
                        <Link href="/sandboxes" className="cursor-pointer flex flex-col gap-1 group" onClick={() => setIsMobileMenuOpen(false)}>
                          <span className="text-[17px] font-bold group-hover:text-[#3ca6ff] transition-colors">Sandboxes</span>
                        </Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 2. Learn */}
            <div className={`border-b ${isDark ? "border-white/10" : "border-gray-200"}`}>
              <button onClick={() => toggleMobile("learn")} className={`cursor-pointer w-full flex justify-between items-center py-5 text-[18px] font-medium transition-colors ${mobileExpanded === "learn" ? "text-[#3ca6ff]" : ""}`}>
                Learn <ChevronDown size={20} className={`transition-transform duration-300 ${mobileExpanded === "learn" ? "rotate-180 text-[#3ca6ff]" : "opacity-50"}`} />
              </button>
              <AnimatePresence>
                {mobileExpanded === "learn" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="flex flex-col gap-8 py-4 pb-8">
                      <div className="flex flex-col gap-5">
                        <div className={`text-[12px] font-mono font-bold uppercase tracking-widest ${isDark ? "text-white/40" : "text-gray-400"}`}>Resources</div>
                        <Link href="/blog" className="cursor-pointer text-[17px] font-bold hover:text-[#3ca6ff] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Blog</Link>
                        <Link href="/customer-stories" className="cursor-pointer text-[17px] font-bold hover:text-[#3ca6ff] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Customer Stories</Link>
                        <Link href="/guides" className="cursor-pointer text-[17px] font-bold hover:text-[#3ca6ff] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Guides</Link>
                      </div>
                      <div className="flex flex-col gap-5">
                        <div className={`text-[12px] font-mono font-bold uppercase tracking-widest ${isDark ? "text-white/40" : "text-gray-400"}`}>How-To</div>
                        <Link href="/academy" className="cursor-pointer text-[17px] font-bold hover:text-[#3ca6ff] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Aegisora Academy</Link>
                        <Link href="/docs" className="cursor-pointer text-[17px] font-bold hover:text-[#3ca6ff] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Documentation</Link>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 3. Docs */}
            <Link href="/docs" className={`cursor-pointer block py-5 text-[18px] font-medium border-b ${isDark ? "border-white/10" : "border-gray-200"}`} onClick={() => setIsMobileMenuOpen(false)}>
              Docs
            </Link>

            {/* 4. Company */}
            <div className={`border-b ${isDark ? "border-white/10" : "border-gray-200"}`}>
              <button onClick={() => toggleMobile("company")} className={`cursor-pointer w-full flex justify-between items-center py-5 text-[18px] font-medium transition-colors ${mobileExpanded === "company" ? "text-[#3ca6ff]" : ""}`}>
                Company <ChevronDown size={20} className={`transition-transform duration-300 ${mobileExpanded === "company" ? "rotate-180 text-[#3ca6ff]" : "opacity-50"}`} />
              </button>
              <AnimatePresence>
                {mobileExpanded === "company" && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <div className="flex flex-col gap-5 py-4 pb-8">
                      <Link href="/about" className="cursor-pointer text-[17px] font-bold hover:text-[#3ca6ff] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>About Us</Link>
                      <Link href="/careers" className="cursor-pointer text-[17px] font-bold hover:text-[#3ca6ff] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Careers</Link>
                      <Link href="/partners" className="cursor-pointer text-[17px] font-bold hover:text-[#3ca6ff] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Partners</Link>
                      <Link href="/events" className="cursor-pointer text-[17px] font-bold hover:text-[#3ca6ff] transition-colors" onClick={() => setIsMobileMenuOpen(false)}>Events</Link>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 5. Pricing */}
            <Link href="/pricing" className={`cursor-pointer block py-5 text-[18px] font-medium border-b ${isDark ? "border-white/10" : "border-gray-200"}`} onClick={() => setIsMobileMenuOpen(false)}>
              Pricing
            </Link>

            {/* Mobile CTAs */}
            <div className="mt-10 flex flex-col gap-4">
              <Link href="/signup" className={`cursor-pointer text-center font-mono font-bold text-[15px] py-4 rounded-xl transition-colors ${isDark ? "bg-white text-black hover:bg-gray-200" : "bg-black text-white hover:bg-gray-800"}`} onClick={() => setIsMobileMenuOpen(false)}>
                Try Aegisora
              </Link>
              <Link href="/contact" className={`cursor-pointer text-center font-mono font-bold text-[15px] py-4 rounded-xl border transition-colors ${isDark ? "border-white/20 text-white hover:bg-white/10" : "border-gray-300 text-black hover:bg-black/5"}`} onClick={() => setIsMobileMenuOpen(false)}>
                Get a demo
              </Link>
            </div>
            
          </motion.div>
        )}
      </AnimatePresence>

    </header>
  );
}
