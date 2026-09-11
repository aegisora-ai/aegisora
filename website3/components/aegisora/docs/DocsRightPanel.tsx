"use client";

import { useEffect, useState } from "react";

const tocItems = [
  { id: "overview", title: "Deep Agents overview" },
  { id: "core-capabilities", title: "Core capabilities" },
  { id: "try-it", title: "Try it" },
];

export function DocsRightPanel() {
  const [activeId, setActiveId] = useState<string>("overview");

  useEffect(() => {
    // Sayfadaki basliklari izleyen radar sistemi
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -60% 0px" } // Sayfanin ust kismina gelindiginde tetikler
    );

    tocItems.forEach((item) => {
      const el = document.getElementById(item.id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  // Yumusak kaydirma (Smooth Scroll)
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      // Navbarin altinda kalmamasi icin 100px bosluk birakarak kaydir
      const y = el.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top: y, behavior: "smooth" });
    }
  };

  return (
    <aside className="w-[240px] shrink-0 h-[calc(100vh-4rem)] overflow-y-auto hidden xl:block bg-[#030612] p-6 sticky top-16 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <div className="text-[13px] font-bold text-white mb-4">On this page</div>
      <div className="flex flex-col gap-2.5 text-[13px] border-l border-white/10 pl-3">
        {tocItems.map((item) => (
          <a
            key={item.id}
            href={`#${item.id}`}
            onClick={(e) => handleClick(e, item.id)}
            className={`transition-colors cursor-pointer ${
              activeId === item.id 
                ? "text-[#3ca6ff] font-medium" 
                : "text-white/50 hover:text-white"
            }`}
          >
            {item.title}
          </a>
        ))}
      </div>
    </aside>
  );
}
