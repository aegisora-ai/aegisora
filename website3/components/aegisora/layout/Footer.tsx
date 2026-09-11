import Link from "next/link";

const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z"/></svg>
);
const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.299 0-1.89.722-2.208 1.226h.016V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/></svg>
);
const GithubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
);

export function Footer() {
  return (
    <footer className="bg-[#050505] pt-20 pb-8 relative overflow-hidden font-mono border-t border-white/5">
      <div className="max-w-[1300px] mx-auto px-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-12 relative z-10">
        
        <div className="flex flex-col gap-4">
          <h4 className="text-[#3ca6ff] text-[18px] font-sans font-medium mb-2">Products</h4>
          <Link href="/core" className="text-white/50 hover:text-white text-[13px] transition-colors">Aegisora Core</Link>
          <Link href="/engine" className="text-white/50 hover:text-white text-[13px] transition-colors">Aegisora Engine</Link>
          <Link href="/shield" className="text-white/50 hover:text-white text-[13px] transition-colors">Aegisora Shield</Link>
          <Link href="/observability" className="text-white/50 hover:text-white text-[13px] transition-colors">Observability</Link>
          <Link href="/evaluation" className="text-white/50 hover:text-white text-[13px] transition-colors">Evaluation</Link>
          <Link href="/deploy" className="text-white/50 hover:text-white text-[13px] transition-colors">Deployment</Link>
          <Link href="/sandboxes" className="text-white/50 hover:text-white text-[13px] transition-colors">Sandboxes</Link>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="text-[#3ca6ff] text-[18px] font-sans font-medium mb-2">Resources</h4>
          <Link href="/blog" className="text-white/50 hover:text-white text-[13px] transition-colors">Blog</Link>
          <Link href="/customer-stories" className="text-white/50 hover:text-white text-[13px] transition-colors">Customer Stories</Link>
          <Link href="/guides" className="text-white/50 hover:text-white text-[13px] transition-colors">Guides</Link>
          <Link href="/community" className="text-white/50 hover:text-white text-[13px] transition-colors">Community</Link>
          <Link href="/changelog" className="text-white/50 hover:text-white text-[13px] transition-colors">Changelog</Link>
          <Link href="/docs" className="text-white/50 hover:text-white text-[13px] transition-colors">Docs</Link>
          <Link href="/support" className="text-white/50 hover:text-white text-[13px] transition-colors">Support</Link>
          <Link href="/academy" className="text-white/50 hover:text-white text-[13px] transition-colors">Aegisora Academy</Link>
        </div>

        <div className="flex flex-col gap-4">
          <h4 className="text-[#3ca6ff] text-[18px] font-sans font-medium mb-2">Company</h4>
          <Link href="/about" className="text-white/50 hover:text-white text-[13px] transition-colors">About</Link>
          <Link href="/careers" className="text-white/50 hover:text-white text-[13px] transition-colors">Careers</Link>
          <Link href="/partners" className="text-white/50 hover:text-white text-[13px] transition-colors">Partners</Link>
          <Link href="/trust-center" className="text-white/50 hover:text-white text-[13px] transition-colors">Trust Center</Link>
          <Link href="/brand-assets" className="text-white/50 hover:text-white text-[13px] transition-colors">Brand Assets</Link>
          <Link href="/events" className="text-white/50 hover:text-white text-[13px] transition-colors">Events</Link>
        </div>

        <div className="lg:col-span-2 flex flex-col">
          <h4 className="text-[#3ca6ff] text-[18px] font-sans font-medium mb-4 leading-snug">
            Sign up for our newsletter to stay<br />up to date
          </h4>
          <div className="flex flex-col gap-3 max-w-[350px]">
            <input type="email" placeholder="Your email" className="w-full bg-transparent border border-white/20 rounded-md px-4 py-3 text-[13px] text-white focus:outline-none focus:border-[#3ca6ff] transition-colors" />
            <button className="self-end bg-[#EAF2FF] text-black font-bold text-[13px] px-6 py-2.5 rounded-md hover:bg-white transition-colors">Subscribe</button>
          </div>
          
          <div className="flex items-center gap-5 mt-8 text-white/40">
            <Link href="https://www.linkedin.com/company/aegisora" target="_blank" className="hover:text-white transition-colors"><LinkedinIcon /></Link>
            <Link href="https://x.com/aegisora_ai" target="_blank" className="hover:text-white transition-colors"><XIcon /></Link>
            <Link href="https://github.com/aegisora-ai/aegisora" target="_blank" className="hover:text-white transition-colors"><GithubIcon /></Link>
          </div>
        </div>
      </div>

      {/* AEGISORA WATERMARK */}
      <div className="mt-20 mb-8 w-full flex justify-center items-center overflow-hidden pointer-events-none select-none px-4">
          <span className="text-[15vw] font-bold leading-[0.75] text-transparent font-sans tracking-tighter" style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}>
            AEGISORA
          </span>
      </div>

      <div className="max-w-[1300px] mx-auto px-6 flex flex-col sm:flex-row items-center justify-between pt-8 border-t border-white/10 text-[12px] text-white/40 relative z-10">
        <div className="flex items-center gap-2 mb-4 sm:mb-0">
          <div className="w-2 h-2 rounded-full bg-[#3ca6ff] shadow-[0_0_8px_#3ca6ff]"></div>
          <span>All systems operational</span>
        </div>
        <div className="flex items-center gap-6">
          <Link href="#" className="hover:text-white transition-colors">Privacy policy</Link>
          <Link href="#" className="hover:text-white transition-colors">Terms of service</Link>
        </div>
      </div>
    </footer>
  );
}
