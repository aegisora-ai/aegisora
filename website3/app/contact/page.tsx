"use client";

import { Navbar } from "@/components/aegisora/layout/Navbar";
import { Footer } from "@/components/aegisora/layout/Footer";
import Link from "next/link";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    message: ""
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      alert("Thank you! Our sales team will contact you shortly.");
      setFormData({ firstName: "", lastName: "", email: "", message: "" });
    }, 1500);
  };

  return (
    <main className="min-h-screen bg-[#030612] text-white font-sans selection:bg-[#0066FF] selection:text-white flex flex-col relative overflow-hidden">
      
      <Navbar />

      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_top,rgba(0,102,255,0.1)_0%,rgba(0,0,0,0)_70%)] pointer-events-none -z-10 mix-blend-screen"></div>

      <section className="pt-[160px] lg:pt-[200px] pb-[100px] px-6 relative z-10 flex-1 flex flex-col justify-center">
        <div className="max-w-[1100px] mx-auto w-full flex flex-col lg:flex-row gap-16 lg:gap-24">
          
          <div className="lg:w-1/2 flex flex-col justify-center">
            <h1 className="text-[42px] md:text-[52px] font-medium leading-[1.1] tracking-tight text-[#8AC7FF] mb-8">
              See Aegisora in action
            </h1>
            
            <div className="text-[16px] md:text-[17px] text-white/70 leading-relaxed mb-6 space-y-6">
              <p>
                Aegisora brings testing, deployment, and monitoring together so teams can continuously improve their agents, compound intelligence, and govern them at scale.
              </p>
              <p>
                Get in touch with our team to see how Aegisora can help you iterate faster through the Agent Development Lifecycle. We'll answer your questions and walk you through a tailored demo.
              </p>
            </div>

            <div className="mt-16 text-[14px] text-white/60">
              Looking for support? Visit our support portal <Link href="#" className="text-[#3ca6ff] hover:underline transition-colors">here</Link>.
            </div>
          </div>

          <div className="lg:w-1/2 flex items-start">
            <div className="w-full bg-[#050810]/80 backdrop-blur-md border border-[#1a2b4c]/60 rounded-[16px] p-8 md:p-10 shadow-[0_0_50px_rgba(0,102,255,0.03)]">
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex flex-col">
                    <label className="text-[14px] font-medium text-white mb-2">First name <span className="text-[#3ca6ff]">*</span></label>
                    <input type="text" required placeholder="Jane" value={formData.firstName} onChange={(e) => setFormData({...formData, firstName: e.target.value})} className="w-full bg-[#030612] border border-white/10 rounded-md px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#3ca6ff] transition-colors" />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-[14px] font-medium text-white mb-2">Last name <span className="text-[#3ca6ff]">*</span></label>
                    <input type="text" required placeholder="Smith" value={formData.lastName} onChange={(e) => setFormData({...formData, lastName: e.target.value})} className="w-full bg-[#030612] border border-white/10 rounded-md px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#3ca6ff] transition-colors" />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-[14px] font-medium text-white mb-2">Work email <span className="text-[#3ca6ff]">*</span></label>
                  <input type="email" required placeholder="jane@company.com" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-[#030612] border border-white/10 rounded-md px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#3ca6ff] transition-colors" />
                </div>
                <div className="flex flex-col mb-2">
                  <label className="text-[14px] font-medium text-white mb-2">Message <span className="text-[#3ca6ff]">*</span></label>
                  <textarea required rows={4} placeholder="Tell us how we can help..." value={formData.message} onChange={(e) => setFormData({...formData, message: e.target.value})} className="w-full bg-[#030612] border border-white/10 rounded-md px-4 py-3 text-[14px] text-white focus:outline-none focus:border-[#3ca6ff] transition-colors resize-y"></textarea>
                </div>
                <button type="submit" disabled={isLoading} className="w-full bg-[#EAF2FF] hover:bg-white text-black font-medium text-[15px] py-3.5 rounded-md transition-colors flex items-center justify-center gap-2 disabled:opacity-70">
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : <>Continue <ArrowRight size={18} /></>}
                </button>
              </form>
            </div>
          </div>

        </div>
      </section>

      <div id="dark-section">
        <Footer />
      </div>

    </main>
  );
}
