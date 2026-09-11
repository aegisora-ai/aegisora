"use client";

export function DocsRightPanel() {
  return (
    <aside className="w-[240px] shrink-0 h-[calc(100vh-4rem)] overflow-y-auto hidden xl:block bg-[#030612] p-6">
      <div className="text-[13px] font-bold text-white mb-4">On this page</div>
      <div className="flex flex-col gap-2.5 text-[13px] text-white/50 border-l border-white/10 pl-3">
        <span className="text-[#3ca6ff] cursor-pointer">The open agent ecosystem</span>
        <span className="hover:text-white cursor-pointer transition-colors">Agent development lifecycle</span>
        <span className="hover:text-white cursor-pointer transition-colors">Products</span>
      </div>
    </aside>
  );
}
