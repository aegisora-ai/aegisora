"use client";

import { useState, useEffect, useRef } from "react";
import { X, Sparkles, Send, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AskAIDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [messages, setMessages] = useState([
    { role: "ai", text: "What can I help you with regarding Aegisora Deep Agents?" }
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Navbar'dan gonderilen ozel acma sinyalini dinle
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener("open-ask-ai", handleOpen);
    return () => window.removeEventListener("open-ask-ai", handleOpen);
  }, []);

  // Mesaj eklendiginde en alta kaydir
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Kullanici mesajini ekle
    setMessages(prev => [...prev, { role: "user", text: query }]);
    setQuery("");
    setIsTyping(true);

    // AI yanitini simule et
    setTimeout(() => {
      setIsTyping(false);
      setMessages(prev => [
        ...prev, 
        { role: "ai", text: "Deep Agents allow you to build autonomous systems that can execute code, use tools, and manage long-running tasks. You can define secure boundaries using the Policy engine." }
      ]);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Arka plan karartmasi */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90] cursor-pointer"
          />

          {/* Sagdan acilan panel */}
          <motion.div 
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 h-full w-full sm:w-[450px] bg-[#0A0D18] border-l border-white/10 z-[100] shadow-2xl flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-white/10 bg-[#050505]">
              <div className="flex items-center gap-2 text-white font-medium">
                <Sparkles size={16} className="text-[#3ca6ff]" />
                Ask Aegisora AI
              </div>
              <button onClick={() => setIsOpen(false)} className="text-white/50 hover:text-white transition-colors cursor-pointer p-1">
                <X size={20} />
              </button>
            </div>

            {/* Chat Area */}
            <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {messages.map((msg, i) => (
                <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[85%] rounded-2xl px-5 py-3.5 text-[14px] leading-relaxed ${
                    msg.role === "user" 
                      ? "bg-[#3ca6ff] text-black font-medium rounded-tr-sm" 
                      : "bg-white/5 border border-white/10 text-white/90 rounded-tl-sm"
                  }`}>
                    {msg.text}
                  </div>
                </div>
              ))}
              
              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white/5 border border-white/10 text-white/90 rounded-2xl rounded-tl-sm px-5 py-4 flex items-center gap-2">
                    <Loader2 size={16} className="animate-spin text-[#3ca6ff]" />
                    <span className="text-[13px] text-white/50">Aegisora AI is thinking...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-5 bg-[#050505] border-t border-white/10">
              <form onSubmit={handleSubmit} className="relative flex items-center">
                <input 
                  type="text" 
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Ask a question about the docs..." 
                  className="w-full bg-[#0A0D18] border border-white/20 rounded-xl pl-4 pr-12 py-4 text-[14px] text-white placeholder-white/40 focus:outline-none focus:border-[#3ca6ff] transition-colors shadow-inner"
                />
                <button 
                  type="submit" 
                  disabled={!query.trim() || isTyping}
                  className="absolute right-3 p-2 bg-[#3ca6ff] text-black rounded-lg disabled:opacity-50 transition-colors cursor-pointer hover:bg-white"
                >
                  <Send size={16} />
                </button>
              </form>
              <div className="text-center mt-3 text-[11px] text-white/40 font-mono">
                AI can make mistakes. Verify critical information.
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
