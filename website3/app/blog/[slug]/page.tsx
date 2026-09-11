"use client";

import { Navbar } from "@/components/aegisora/layout/Navbar";
import { Footer } from "@/components/aegisora/layout/Footer";
import { blogPosts } from "@/lib/blog-data";
import Link from "next/link";
import Image from "next/image";
import { useParams, notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";

// Saf SVG Ikonlar (Görseldeki "X", LinkedIn, GitHub, Link ikonlari)
const XIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M12.6.75h2.454l-5.36 6.142L16 15.25h-4.937l-3.867-5.07-4.425 5.07H.316l5.733-6.57L0 .75h5.063l3.495 4.633L12.601.75Zm-.86 13.028h1.36L4.323 2.145H2.865l8.875 11.633Z"/></svg>
);
const LinkedinIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M0 1.146C0 .513.526 0 1.175 0h13.65C15.474 0 16 .513 16 1.146v13.708c0 .633-.526 1.146-1.175 1.146H1.175C.526 16 0 15.487 0 14.854V1.146zm4.943 12.248V6.169H2.542v7.225h2.401zm-1.2-8.212c.837 0 1.358-.554 1.358-1.248-.015-.709-.52-1.248-1.342-1.248-.822 0-1.359.54-1.359 1.248 0 .694.521 1.248 1.327 1.248h.016zm4.908 8.212V9.359c0-.216.016-.432.08-.586.173-.431.568-.878 1.232-.878.869 0 1.216.662 1.216 1.634v3.865h2.401V9.25c0-2.22-1.184-3.252-2.764-3.252-1.299 0-1.89.722-2.208 1.226h.016V6.169h-2.4c.03.678 0 7.225 0 7.225h2.4z"/></svg>
);
const GithubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16"><path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.012 8.012 0 0 0 16 8c0-4.42-3.58-8-8-8z"/></svg>
);
const LinkIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
);

export default function BlogPostPage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const post = blogPosts.find((p) => p.slug === slug);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!post?.toc) return;
    const handleScroll = () => {
      const scrollPosition = window.scrollY + 200;
      let current = "";
      post.toc.forEach(item => {
        const element = document.getElementById(item.id);
        if (element && element.offsetTop <= scrollPosition) {
          current = item.id;
        }
      });
      setActiveId(current);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [post]);

  if (!post) {
    notFound();
  }

  const relatedPosts = blogPosts.filter((p) => p.slug !== slug).slice(0, 3);

  // Ortak Paylasim Bileseni (İstediğin URL'lerle)
  const ShareWidget = () => (
    <div className="inline-flex items-center gap-5 bg-[#F8FAFC] border border-gray-100 px-5 py-3 rounded-xl text-[#5A7184] shadow-sm">
      <span className="font-mono text-[14px] font-bold tracking-wide mt-[2px]">Share</span>
      <Link href="https://www.linkedin.com/company/aegisora" target="_blank" rel="noopener noreferrer" className="hover:text-[#0066FF] transition-colors"><LinkedinIcon /></Link>
      <Link href="https://x.com/aegisora_ai" target="_blank" rel="noopener noreferrer" className="hover:text-[#0066FF] transition-colors"><XIcon /></Link>
      <Link href="https://github.com/aegisora-ai/aegisora" target="_blank" rel="noopener noreferrer" className="hover:text-[#0066FF] transition-colors"><GithubIcon /></Link>
      <button onClick={() => navigator.clipboard.writeText(window.location.href)} className="hover:text-[#0066FF] transition-colors"><LinkIcon /></button>
    </div>
  );

  return (
    <main className="min-h-screen bg-white text-[#111111] font-sans selection:bg-[#0066FF] selection:text-white">
      <Navbar />

      <article className="pt-40 pb-24 px-6 max-w-[1400px] mx-auto flex flex-col lg:flex-row gap-16 relative">
        <div className="hidden lg:flex flex-col w-[280px] flex-shrink-0">
          <div className="sticky top-[120px] flex flex-col">
            <Link href="/blog" className="flex items-center gap-2 text-[#0066FF] hover:underline font-mono text-[13px] font-bold transition-colors mb-12 cursor-pointer">
              <ArrowLeft size={16} /> Go back to blog
            </Link>
            
            {post.toc && post.toc.length > 0 && (
              <div className="flex flex-col gap-4 border-l-2 border-gray-100 pl-4 mb-12 relative">
                {post.toc.map(item => (
                  <a 
                    key={item.id} 
                    href={`#${item.id}`} 
                    className={`font-mono text-[13px] leading-relaxed transition-colors relative cursor-pointer ${activeId === item.id ? 'text-[#0066FF] font-bold' : 'text-gray-500 hover:text-black'}`}
                  >
                    {item.title}
                    {activeId === item.id && (
                      <span className="absolute -left-[23px] top-1.5 w-2 h-2 rounded-full bg-[#0066FF]"></span>
                    )}
                  </a>
                ))}
              </div>
            )}

            <ShareWidget />
          </div>
        </div>

        <div className="flex-1 max-w-[850px]">
          <div className="mb-10 text-center lg:text-left flex flex-col items-center lg:items-start">
            <div className="inline-flex items-center justify-center bg-gray-100 px-4 py-1.5 rounded-md text-gray-600 font-mono text-[12px] font-bold mb-6 uppercase tracking-wider">
              {post.category}
            </div>
            <h1 className="text-[42px] md:text-[54px] font-bold leading-[1.1] tracking-tight mb-8 text-black">
              {post.title}
            </h1>
            
            <div className="flex items-center gap-4 py-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#0066FF] to-[#0A0A0A]"></div>
              <div className="flex items-center gap-3">
                <span className="font-bold text-[15px]">{post.author}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="text-gray-500 text-[14px]">{post.date}</span>
                <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                <span className="text-[#0066FF] text-[14px] font-mono font-bold flex items-center gap-1">
                  {post.readTime}
                </span>
              </div>
            </div>
          </div>

          <div className={`w-full h-[300px] md:h-[450px] bg-gradient-to-br ${post.coverGradient} rounded-2xl mb-16 relative overflow-hidden flex flex-col justify-end p-8 md:p-12 shadow-2xl`}>
             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-30 mix-blend-overlay"></div>
             <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(ellipse_at_right,rgba(0,102,255,0.4)_0%,rgba(0,0,0,0)_70%)]"></div>
             <div className="relative z-10 w-full md:w-2/3">
               <h2 className="text-white text-[32px] md:text-[48px] font-medium leading-[1.1] tracking-tight mb-4">{post.title}</h2>
             </div>
          </div>

          <div 
            className="prose prose-lg max-w-none prose-headings:tracking-tight prose-headings:font-bold prose-p:text-gray-800 prose-a:text-[#0066FF] prose-a:no-underline hover:prose-a:underline prose-li:text-gray-800"
            dangerouslySetInnerHTML={{ __html: post.content }}
          />

          <div className="flex lg:hidden mt-12 pt-8 border-t border-gray-100 justify-center">
            <ShareWidget />
          </div>
        </div>
      </article>

      <div id="dark-section">
        <section className="bg-[#050505] text-white pt-24 pb-16">
          <div className="max-w-[1300px] mx-auto px-6">
            <h3 className="text-[32px] text-[#8AC7FF] font-medium tracking-tight mb-12">Related content</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {relatedPosts.map((related) => (
                <Link href={`/blog/${related.slug}`} key={related.slug} className="bg-[#0A0A0A] border border-white/10 rounded-xl overflow-hidden flex flex-col group hover:border-white/30 transition-colors cursor-pointer">
                  <div className={`h-[180px] w-full bg-[#0F111A] border-b border-white/5 relative overflow-hidden flex items-center justify-center p-6`}>
                     <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-10"></div>
                     <h4 className="relative z-10 text-[22px] font-medium leading-[1.2] text-white/90 group-hover:text-white transition-colors text-center">{related.title}</h4>
                     <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-full h-[60px] opacity-40 bg-[radial-gradient(ellipse_at_top,rgba(60,166,255,0.5)_0%,rgba(0,0,0,0)_60%)]"></div>
                  </div>
                  <div className="p-6 flex flex-col flex-1 bg-[#0A0A0A]">
                    <div className="inline-flex bg-white/5 border border-white/10 px-3 py-1 rounded-md text-white/50 font-mono text-[11px] font-bold mb-5 w-max">
                      {related.category}
                    </div>
                    <h4 className="text-[20px] font-medium leading-[1.3] mb-8 text-[#8AC7FF] group-hover:text-white transition-colors">{related.title}</h4>
                    <div className="mt-auto flex items-center justify-between border-t border-white/5 pt-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#3ca6ff] to-[#0A0A0A]"></div>
                        <div className="text-white/80 text-[13px] font-bold">{related.author}<div className="text-white/40 text-[11px] font-normal">{related.date}</div></div>
                      </div>
                      <div className="text-white/40 text-[12px] font-mono flex items-center gap-1">
                         <span className="w-3 h-3 border border-white/40 rounded-full flex items-center justify-center text-[8px]">L</span> {related.readTime}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* AEGISORA LOGOLU NEWSLETTER */}
        <section className="bg-[#050505] pb-24 px-6">
          <div className="max-w-[1000px] mx-auto bg-[#0A0A0A] border border-[#3ca6ff]/20 rounded-2xl p-2 pl-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-[0_0_30px_rgba(60,166,255,0.05)]">
            <div className="flex items-center gap-4 py-2">
              <div className="w-12 h-12 bg-[#111111] rounded-xl flex items-center justify-center border border-white/10 shadow-inner">
                <Image src="/aegisora-logo-white.png" alt="Aegisora" width={22} height={22} className="object-contain opacity-90" />
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
        </section>

        <Footer />
      </div>
    </main>
  );
}
