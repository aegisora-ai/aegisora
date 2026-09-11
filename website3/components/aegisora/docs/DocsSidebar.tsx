"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronRight } from "lucide-react";

type NavItem = {
  title: string;
  href?: string;
  items?: NavItem[];
};

type NavSection = {
  title?: string;
  items: NavItem[];
};

// Videodaki yapiya birebir uygun dökümantasyon agaci
const navConfig: NavSection[] = [
  {
    title: "AGENT DEVELOPMENT LIFECYCLE",
    items: [
      { title: "Build", href: "/docs/build" },
      { title: "Test", href: "/docs/test" },
      { title: "Deploy", href: "/docs/deploy" },
      { title: "Monitor", href: "/docs/monitor" },
    ],
  },
  {
    title: "PRODUCTS",
    items: [
      { title: "LLM Gateway", href: "/docs/gateway" },
      { title: "Engine", href: "/docs/engine" },
      { title: "No-code agents", href: "/docs/no-code" },
      { title: "Deep Agents Code", href: "/docs/code" },
    ],
  },
  {
    title: "AGENT FRAMEWORKS",
    items: [
      { title: "deepagents", href: "/docs/deepagents" },
      { title: "langgraph", href: "/docs/langgraph" },
      { title: "langchain", href: "/docs/langchain" },
    ],
  },
  {
    items: [
      {
        title: "Learn",
        items: [
          { title: "Blog", href: "/blog" },
          { title: "Customer Stories", href: "/customer-stories" },
          { title: "Guides", href: "/guides" },
        ],
      },
      {
        title: "Docs",
        items: [
          { title: "Introduction", href: "/docs" },
          { title: "Quickstart", href: "/docs/quickstart" },
          { title: "Architecture", href: "/docs/architecture" },
        ],
      },
      {
        title: "Company",
        items: [
          { title: "About", href: "/about" },
          { title: "Careers", href: "/careers" },
        ],
      },
    ],
  },
];

function NavItemComponent({ item, level = 0 }: { item: NavItem; level?: number }) {
  const pathname = usePathname();
  // Klasorlerin default acik/kapali durumu
  const [isOpen, setIsOpen] = useState(true);

  const isActive = item.href && pathname === item.href;
  const hasChildren = item.items && item.items.length > 0;

  if (hasChildren) {
    return (
      <div className="flex flex-col mb-1">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-between py-1.5 text-[14px] font-medium text-white/90 hover:text-white transition-colors cursor-pointer group"
        >
          {item.title}
          <ChevronRight 
            size={14} 
            className={`text-white/40 group-hover:text-white/80 transition-transform duration-200 ${isOpen ? "rotate-90" : ""}`} 
          />
        </button>
        {isOpen && (
          <div className="flex flex-col ml-3 mt-1 border-l border-white/10 pl-3 gap-2">
            {item.items!.map((subItem, index) => (
              <NavItemComponent key={index} item={subItem} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <Link
      href={item.href || "#"}
      className={`py-1 text-[13px] transition-colors cursor-pointer block ${
        isActive 
          ? "text-[#3ca6ff] font-medium" 
          : "text-white/60 hover:text-white"
      }`}
    >
      {item.title}
    </Link>
  );
}

export function DocsSidebar() {
  return (
    <aside className="w-[260px] shrink-0 border-r border-white/10 h-[calc(100vh-4rem)] overflow-y-auto hidden lg:block bg-[#030612] scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
      <div className="flex flex-col p-6 pt-8 pb-20">
        {navConfig.map((section, idx) => (
          <div key={idx} className={`flex flex-col ${idx !== 0 ? "mt-8" : ""}`}>
            {section.title && (
              <h4 className="text-[11px] font-mono font-bold uppercase tracking-widest text-white/40 mb-3">
                {section.title}
              </h4>
            )}
            <div className="flex flex-col gap-2">
              {section.items.map((item, itemIdx) => (
                <NavItemComponent key={itemIdx} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
}
