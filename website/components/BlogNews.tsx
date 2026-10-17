"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ShieldCheck, Terminal, Cpu, Lock } from "lucide-react";

const featuredPost = {
  title: "The Architecture of a Zero-Trust AI Swarm",
  description:
    "Deploying a single AI agent is easy. Governing an entire autonomous swarm across an enterprise introduces complex vulnerabilities. Discover how Aegisora enforces runtime constitutions to maintain absolute control...",
  date: "Aug 04, 2026",
  readTime: "8 min read",
  category: "Featured",
  author: {
    name: "Eray Özer",
    role: "Founder & CEO",
  },
  slug: "/blog/architecture-of-a-zero-trust-ai-swarm",
};

const blogPosts = [
  {
    title: "Securing AI Against Prompt Injection",
    description:
      "As enterprises scale AI agents, prompt injection becomes a critical threat vector. Learn how Aegisora's zero-trust proxy intercepts malicious tool calls at runtime before they...",
    date: "Aug 02, 2026",
    category: "Security",
    author: {
      name: "Eray Özer",
      role: "Founder & CEO",
    },
    slug: "/blog/securing-ai-against-prompt-injection",
  },
  {
    title: "Shadow AI: The Hidden Risk in Your Stack",
    description:
      "What happens when unmonitored AI models access your corporate databases? Shadow AI opens direct routes into secure infrastructure. Here is how our platform restores...",
    date: "Jul 28, 2026",
    category: "Enterprise",
    author: {
      name: "Eray Özer",
      role: "Founder & CEO",
    },
    slug: "/blog/shadow-ai-hidden-risk",
  },
  {
    title: "Immutable Logs for AI Compliance",
    description:
      "Regulators demand transparency in autonomous decisions. Here is how continuous runtime logging and SOC 2/ISO-aligned controls help secure your entire agentic ecosystem...",
    date: "Jul 15, 2026",
    category: "Governance",
    author: {
      name: "Eray Özer",
      role: "Founder & CEO",
    },
    slug: "/blog/immutable-logs-for-ai-compliance",
  },
];

export default function BlogNews() {
  return (
    <section className="relative w-full py-28 px-6 bg-transparent font-sans flex flex-col items-center z-10 text-white">
      {/* Üst Başlık ve Buton */}
      <div className="w-full max-w-[1200px] flex items-center justify-between mb-16">
        <div>
          <span className="text-[11px] font-mono font-semibold uppercase tracking-widest text-blue-400 bg-blue-950/80 border b order-blue-800/50 px-3.5 py-1.5 rounded-full mb-3 inline-block">
            Intelligence &amp; Insights
          </span>
          <h2 className="text-4xl sm:text-5xl font-bold font-serif text-white tracking-tight">
            Blog &amp; News
          </h2>
        </div>
        <Link
          href="/blog"
          className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-mono px-5 py-2.5 rounded-full transition-colors shado w-lg shado w-blue-600/20 inline-flex items-center justify-center cursor-pointer"
        >
          All articles
        </Link>
      </div>

      {/* Ana Grid */}
      <div className="w-full max-w-[1200px] flex flex-col gap-8">
        {/* Öne Çıkan (Featured) Büyük Blog Kartı - Görsel Alanı Dolduruldu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="bg-zinc-950/90 backdrop-blur-2xl border b order-zinc-800/90 rounded-[2.5rem] p-8 lg:p-12 flex flex-col lg:flex-row gap-8 items-center shado w-2xl hover:b order-zinc-700 transition-all duration-300 group"
        >
          {/* Sol: Profesyonel Enterprise Görsel / UI Simülasyon Alanı */}
          <div className="w-full lg:w-1/2 h-[280px] sm:h-[320px] bg-gradient-to-br from-zinc-900 via-zinc-950 to-blue-950/40 border b order-zinc-800 rounded-3xl overflo w-hidden relative flex flex-col items-center justify-center shado w-inner p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,102,238,0.15)_0,transparent_70%)] pointer-events-none" />

            {/* Kart içi sahte terminal/şema ögesi */}
            <div className="relative z-10 w-full max-w-[280px] bg-zinc-900/90 border b order-zinc-800 rounded-2xl p-4 shado w-2xl space-y-3">
              <div className="flex items-center justify-between b order-b b order-zinc-800 pb-2">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-blue-400">
                    Zero-Trust Protocol
                  </span>
                </div>
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="space-y-1.5 font-mono text-[10px] text-zinc-400">
                <div className="text-zinc-200">
                  {">"} Intercepting agent trace...
                </div>
                <div className="text-emerald-400">
                  {">"} Perimeter constitution enforced.
                </div>
                <div className="text-zinc-500">
                  {">"} Status: Secure (Fail-closed)
                </div>
              </div>
            </div>

            <div className="absolute bottom-4 left-6 flex items-center gap-2 text-[10px] font-mono text-zinc-500">
              <Terminal className="w-3.5 h-3.5 text-blue-400" />
              <span>Aegisora Threat Intelligence Unit</span>
            </div>
          </div>

          {/* Sağ: Metin Alanı */}
          <div className="w-full lg:w-1/2 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-mono text-zinc-400">
                  {featuredPost.date}
                </span>
                <span className="text-[10px] font-mono bg-blue-950/80 text-blue-400 border b order-blue-800/50 px-3 py-1 rounded-full">
                  {featuredPost.category}
                </span>
              </div>

              <Link
                href={featuredPost.slug}
                className="group-hover:text-blue-400 transition-colors"
              >
                <h3 className="text-2xl sm:text-3xl font-bold font-serif text-white mb-3 tracking-tight">
                  {featuredPost.title}
                </h3>
              </Link>

              <p className="text-xs sm:text-sm text-zinc-400 font-mono leading-relaxed mb-6">
                {featuredPost.description}
              </p>

              <span className="text-xs font-mono text-zinc-500">
                {featuredPost.readTime}
              </span>
            </div>

            <div className="flex items-center gap-3 pt-6 b order-t b order-zinc-800/80">
              <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-bold font-mono shado w-md">
                EÖ
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-semibold text-white">
                  {featuredPost.author.name}
                </span>
                <span className="text-[10px] font-mono text-zinc-400">
                  {featuredPost.author.role}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Alt 3'lü Blog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {blogPosts.map((post, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="bg-zinc-950/90 backdrop-blur-2xl border b order-zinc-800/90 rounded-[2rem] p-6 sm:p-8 flex flex-col justify-between shado w-xl hover:b order-zinc-700 transition-all duration-300 group"
            >
              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-mono text-zinc-400">
                    {post.date}
                  </span>
                  <span className="text-[10px] font-mono bg-zinc-900 text-zinc-300 border b order-zinc-800 px-2.5 py-0.5 rounded-full">
                    {post.category}
                  </span>
                </div>

                <Link
                  href={post.slug}
                  className="group-hover:text-blue-400 transition-colors"
                >
                  <h4 className="text-lg sm:text-xl font-bold font-serif text-white mb-3 tracking-tight">
                    {post.title}
                  </h4>
                </Link>

                <p className="text-xs text-zinc-400 font-mono leading-relaxed mb-6 line-clamp-3">
                  {post.description}
                </p>
              </div>

              <div className="flex items-center gap-3 pt-4 b order-t b order-zinc-800/80">
                <div className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-300 flex items-center justify-center text-[10px] font-bold font-mono">
                  EÖ
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-semibold text-white">
                    {post.author.name}
                  </span>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {post.author.role}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
