import { DocsNavbar } from "@/components/aegisora/docs/DocsNavbar";
import { DocsSidebar } from "@/components/aegisora/docs/DocsSidebar";
import { DocsRightPanel } from "@/components/aegisora/docs/DocsRightPanel";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen bg-[#030612] text-white font-sans selection:bg-[#0066FF] selection:text-white">
      <DocsNavbar />
      <div className="flex flex-1 overflow-hidden max-w-[1600px] w-full mx-auto">
        <DocsSidebar />
        <main className="flex-1 h-[calc(100vh-4rem)] overflow-y-auto p-6 md:p-10 lg:p-12">
          {children}
        </main>
        <DocsRightPanel />
      </div>
    </div>
  );
}
