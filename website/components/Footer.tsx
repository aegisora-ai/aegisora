import React from "react";
import Link from "next/link";
import { ShieldCheck, FileCheck } from "lucide-react";

// RESMÃƒÆ’Ã†â€™Ãƒ¢Ã¢â€š¬Ã‚ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚° VE KUSURSUZ SVG ÃƒÆ’Ã†â€™Ãƒ¢Ã¢â€š¬Ã‚ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚°KONLARI
function DiscordIcon(props: React.ComponentProps<"svg">) { return (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z"/></svg>); }
function TwitterIcon(props: React.ComponentProps<"svg">) { return (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>); }
function LinkedinIcon(props: React.ComponentProps<"svg">) { return (<svg {...props} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>); }

// --- AKAN MAVÃƒâ€Ã‚° DALGA (TOPOLOJÃƒâ€Ã‚°K) ANÃƒâ€Ã‚°MASYONU ---
// --- PURE CSS & SVG DITHERED GRADIENT MESH ---
const AnimatedBlueWave = () => (
  <div className="absolute inset-0 overflo w-hidden bg-white">
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes gradientMesh {
        0% { transform: translate(0, 0) scale(1); }
        33% { transform: translate(8%, -8%) scale(1.15); }
        66% { transform: translate(-8%, 8%) scale(0.85); }
        100% { transform: translate(0, 0) scale(1); }
      }
      .mesh-blob { animation: gradientMesh 18s infinite alternate ease-in-out; }
      .mesh-delay-1 { animation-delay: -6s; }
      .mesh-delay-2 { animation-delay: -12s; }
    `}} />

    {/* KATMAN 1: Halftone Dot Pattern (Beyaz zemin üzerine Siyah noktalar) */}
    <div className="absolute inset-0" style={{
      backgroundColor: '#ffffff',
      backgroundImage: 'radial-gradient(circle, #000000 1.5px, #ffffff 2px)',
      backgroundSize: '10px 10px',
      backgroundPosition: 'center'
    }}></div>

    {/* KATMAN 2: Hareketli Mavi Gradyanlar (Screen Modu)
        Harika CSS Hilesi: "Screen" modu, siyah noktaları maviye çevirir, beyaz zemini ise bembeyaz bırakır!
    */}
    <div className="absolute inset-0 mix-blend-screen filter blur-[60px] opacity-90">
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-[#0066FF] rounded-full mes h-blob"></div>
      <div className="absolute top-[20%] right-[-20%] w-[80%] h-[80%] bg-[#33CCFF] rounded-full mes h-blob mes h-delay-1"></div>
      <div className="absolute bottom-[-30%] left-[10%] w-[90%] h-[90%] bg-[#002299] rounded-full mes h-blob mes h-delay-2"></div>
    </div>

    {/* KATMAN 3: Organik SVG Grain/Noise (Kumlu, Dithered Hissi) */}
    <svg className="absolute inset-0 w-full h-full opacity-[0.25] pointer-events-none mix-blend-multiply">
      <filter id="grainy-noise">
        <feTurbulence type="fractalNoise" baseFrequency="0.65" numOctaves="3" stitchTiles="stitch"/>
      </filter>
      <rect width="100%" height="100%" filter="url(#grainy-noise)" />
    </svg>
  </div>
);

export default function Footer() {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="w-full bg-[#0066FF] pt-20 pb-10 px-4 sm:px-6">
      {/* ARTIK OVERLAP/NEGATÃƒÆ’Ã†â€™Ãƒ¢Ã¢â€š¬Ã‚ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚°F MARGÃƒÆ’Ã†â€™Ãƒ¢Ã¢â€š¬Ã‚ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚°N YOK.
        TÃƒÆ’Ã†â€™Ãƒâ€ 'ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚¼m bileÃƒÆ’Ã†â€™Ãƒ¢Ã¢â€š¬Ã‚¦ÃƒÆ’…Ãƒâ€šÃ‚¸enler aynÃƒÆ’Ã†â€™Ãƒ¢Ã¢â€š¬Ã‚ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚± Mavi Arka Plan (bg-[#0066FF]) iÃƒÆ’Ã†â€™Ãƒâ€ 'ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚§inde flex-col ile gÃƒÆ’Ã†â€™Ãƒâ€ 'ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚¼venle alt alta sÃƒÆ’Ã†â€™Ãƒ¢Ã¢â€š¬Ã‚ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚±ralanÃƒÆ’Ã†â€™Ãƒ¢Ã¢â€š¬Ã‚ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚±yor.
      */}
      <div className="max-w-[1200px] mx-auto flex flex-col gap-12 md:gap-16">

        {/* 1. ENTERPRISE READY */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 b order-b b order-white/20 pb-12">
          <div className="md:col-span-1">
            <h2 className="text-4xl md:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Enterprise <br className="hidden md:block"/> Ready
            </h2>
          </div>
          <div className="md:col-span-2 flex flex-col">
            <div className="pb-6 b order-b b order-white/20">
              <h3 className="text-lg font-bold mb-2 text-white">Deployment Flexibility</h3>
              <p className="text-blue-100/90 text-[14px] leading-relaxed">
                Run in your environment. Keep sensitive test scenarios and evaluation results within your security perimeter.
              </p>
            </div>
            <div className="py-6 b order-b b order-white/20">
              <h3 className="text-lg font-bold mb-2 text-white">Security & Compliance</h3>
              <p className="text-blue-100/90 text-[14px] leading-relaxed">
                SOC 2 readiness in progress. Built for regulated industries with strict data handling requirements.
              </p>
            </div>
            <div className="pt-6">
              <h3 className="text-lg font-bold mb-2 text-white">Reliability</h3>
              <p className="text-blue-100/90 text-[14px] leading-relaxed">
                SLA per agreement. Dedicated support for enterprise customers.
              </p>
            </div>
          </div>
        </div>

        {/* 2. BEYAZ CTA KUTUSU */}
        <div className="w-full bg-white rounded-2xl p-8 sm:p-10 md:p-14 shado w-xl">
          <h2 className="text-[32px] sm:text-[40px] md:text-[56px] lg:text-[64px] font-bold text-slate-900 leading-[1.05] tracking-tighter mb-8 max-w-4xl">
            Start securing thousands of realistic scenarios automatically
          </h2>
          <Link
            href="/get-started"
            className="inline-flex items-center justify-center px-8 py-4 text-[15px] font-bold text-slate-900 bg-[#FFC107] hover:bg-[#FFCA28] rounded-lg transition-colors"
          >
            Get started
          </Link>
        </div>

        {/* 3. BENTO GRID (Kutu Kutu Footer) */}
        <div className="flex flex-col border b order-white/20 rounded-2xl overflo w-hidden bg-[#005CE6]">

          {/* ÃƒÆ’Ã†â€™Ãƒâ€ 'ÃƒÆ’…Ãƒ¢Ã¢â€š¬Ã…â€œST SATIR: Logo | Sertifikalar */}
          <div className="flex flex-col md:flex-row b order-b b order-white/20">
            <div className="w-full md:w-[60%] p-6 md:p-8 md:b order-r b order-white/20 flex items-center gap-4">
              <img src="/logo.png" alt="Aegisora" className="h-8 md:h-10 w-auto brightness-0 invert" />
              <span className="text-[24px] md:text-[28px] font-extrabold tracking-tight text-white">Aegisora</span>
            </div>
            <div className="w-full md:w-[40%] p-6 md:p-8 flex items-center flex-wrap gap-6 b order-t md:b order-t-0 b order-white/20">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border b order-white/30 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-white" />
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest leading-tight text-white">SOC 2<br/>READINESS<br/>IN PROGRESS</div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full border b order-white/30 flex items-center justify-center shrink-0">
                  <FileCheck className="w-5 h-5 text-white" />
                </div>
                <div className="text-[9px] font-bold uppercase tracking-widest leading-tight text-white">HIPAA<br/>ROADMAP</div>
              </div>
            </div>
          </div>

          {/* ALT SATIR: Sol (Linkler + Sosyal) | SaÃƒÆ’Ã†â€™Ãƒ¢Ã¢â€š¬Ã‚ÃƒÆ’…Ãƒâ€šÃ‚¸ (Animasyon) */}
          <div className="flex flex-col md:flex-row">

            {/* ALT SOL KISIM */}
            <div className="w-full md:w-[60%] flex flex-col md:b order-r b order-white/20">

              {/* Linkler (Mobilde yan yana hizalandÃƒÆ’Ã†â€™Ãƒ¢Ã¢â€š¬Ã‚ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚±) */}
              <div className="flex-1 p-6 md:p-8 flex flex-col sm:grid sm:grid-cols-3 gap-8 b order-b b order-white/20">
                <div className="flex flex-col gap-3">
                  <h4 className="text-white font-bold text-[15px] mb-1">Product</h4>
                  <div className="flex sm:flex-col gap-4 sm:gap-3">
                    <Link href="/platform" className="text-[14px] font-medium text-blue-100 hover:text-white transition-colors">Snowglobe</Link>
                    <Link href="/security" className="text-[14px] font-medium text-blue-100 hover:text-white transition-colors">Guardrails</Link>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <h4 className="text-white font-bold text-[15px] mb-1">Resources</h4>
                  <div className="flex sm:flex-col gap-4 sm:gap-3">
                    <Link href="/blog" className="text-[14px] font-medium text-blue-100 hover:text-white transition-colors">Blog</Link>
                    <Link href="/docs" className="text-[14px] font-medium text-blue-100 hover:text-white transition-colors">Docs</Link>
                  </div>
                </div>
                <div className="flex flex-col gap-3">
                  <h4 className="text-white font-bold text-[15px] mb-1">Legal</h4>
                  <div className="flex sm:flex-col gap-4 sm:gap-3">
                    <Link href="/trust" className="text-[14px] font-medium text-blue-100 hover:text-white transition-colors">Terms of Use</Link>
                    <Link href="/trust" className="text-[14px] font-medium text-blue-100 hover:text-white transition-colors">Privacy Policy</Link>
                  </div>
                </div>
              </div>

              {/* Sosyal ÃƒÆ’Ã†â€™Ãƒ¢Ã¢â€š¬Ã‚ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚°konlar */}
              <div className="p-6 md:p-8 flex items-center flex-wrap gap-6 sm:gap-8">
                <a href="https://discord.com" className="flex items-center gap-2.5 text-[14px] font-bold text-white hover:text-blue-200 transition-colors">
                  <DiscordIcon className="w-5 h-5" /> Discord
                </a>
                <a href="https://linkedin.com/company/aegisora" className="flex items-center gap-2.5 text-[14px] font-bold text-white hover:text-blue-200 transition-colors">
                  <LinkedinIcon className="w-5 h-5" /> LinkedIn
                </a>
                <a href="https://twitter.com/aegisora" className="flex items-center gap-2.5 text-[14px] font-bold text-white hover:text-blue-200 transition-colors">
                  <TwitterIcon className="w-5 h-5" /> X/Twitter
                </a>
              </div>
            </div>

            {/* ALT SAÃƒÆ’Ã†â€™Ãƒ¢Ã¢â€š¬Ã‚ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚ KISIM: Animasyon Kutusu */}
            <div className="w-full md:w-[40%] relative min-h-[200px] md:min-h-0 b order-t md:b order-t-0 b order-white/20 bg-white">
              <AnimatedBlueWave />
            </div>
          </div>
        </div>

        {/* COPYRIGHT */}
        <div className="flex flex-col sm:flex-row justify-between items-center text-[12px] font-medium text-blue-200 px-2 gap-4 mt-8">
          <div>@{currentYear} Aegisora AI. All rights reserved.</div>
          <div>made by aegisora & modern execution</div>
        </div>

      </div>
    </footer>
  );
}
