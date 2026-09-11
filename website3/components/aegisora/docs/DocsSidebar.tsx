"use client";

import Link from "next/link";

export function DocsSidebar() {
  return (
    <aside className="w-[260px] shrink-0 border-r border-white/10 h-[calc(100vh-4rem)] overflow-y-auto hidden lg:block bg-[#030612] p-6">
      <div className="text-[11px] font-mono font-bold uppercase tracking-widest text-white/40 mb-4">Stage 2: Navigation</div>
      <div className="flex flex-col gap-3 text-[14px] text-white/70">
        <Link href="#" className="hover:text-white">Get Started</Link>
        <Link href="#" className="hover:text-white">Quickstart</Link>
        <Link href="#" className="hover:text-white">Architecture</Link>
      </div>
    </aside>
  );
}
