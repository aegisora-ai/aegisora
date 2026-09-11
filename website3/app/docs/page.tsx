"use client";

import { CodeTabs } from "@/components/aegisora/docs/CodeTabs";
import { Terminal, Box, FileText, Users, Cog, Target } from "lucide-react";

export default function DocsPage() {
  const codeExamples = [
    {
      id: "python",
      label: "Python",
      code: (
        <>
          <div className="text-white/50 mb-4"># Install the Aegisora SDK</div>
          <div><span className="text-[#c678dd]">pip install</span> <span className="text-[#98c379]">aegisora-deepagents</span></div>
          <br />
          <div className="text-white/50 mb-4"># Create and run a basic agent</div>
          <div><span className="text-[#c678dd]">from</span> aegisora <span className="text-[#c678dd]">import</span> Agent, Policy</div>
          <br />
          <div><span className="text-[#e5c07b]">agent</span> = Agent.<span className="text-[#61afef]">create</span>(</div>
          <div className="pl-4"><span className="text-[#e06c75]">name</span>=<span className="text-[#98c379]">"research_assistant"</span>,</div>
          <div className="pl-4"><span className="text-[#e06c75]">model</span>=<span className="text-[#98c379]">"aegisora-fast-v2"</span>,</div>
          <div className="pl-4"><span className="text-[#e06c75]">tools</span>=[<span className="text-[#98c379]">"web_search"</span>, <span className="text-[#98c379]">"calculator"</span>],</div>
          <div className="pl-4"><span className="text-[#e06c75]">policies</span>=[Policy.<span className="text-[#61afef]">StrictCostLimit</span>(<span className="text-[#d19a66]">10.0</span>)]</div>
          <div>)</div>
          <br />
          <div><span className="text-[#e5c07b]">response</span> = agent.<span className="text-[#61afef]">run</span>(<span className="text-[#98c379]">"Analyze the Q3 financial reports."</span>)</div>
          <div><span className="text-[#56b6c2]">print</span>(response.<span className="text-[#e06c75]">output</span>)</div>
        </>
      )
    },
    {
      id: "typescript",
      label: "TypeScript",
      code: (
        <>
          <div className="text-white/50 mb-4">// Install the Aegisora SDK</div>
          <div><span className="text-[#c678dd]">npm install</span> <span className="text-[#98c379]">@aegisora/deepagents</span></div>
          <br />
          <div className="text-white/50 mb-4">// Create and run a basic agent</div>
          <div><span className="text-[#c678dd]">import</span> {`{ Agent, Policy }`} <span className="text-[#c678dd]">from</span> <span className="text-[#98c379]">"@aegisora/deepagents"</span>;</div>
          <br />
          <div><span className="text-[#c678dd]">const</span> <span className="text-[#e5c07b]">agent</span> = <span className="text-[#c678dd]">await</span> Agent.<span className="text-[#61afef]">create</span>({`{`}</div>
          <div className="pl-4"><span className="text-[#e06c75]">name</span>: <span className="text-[#98c379]">"research_assistant"</span>,</div>
          <div className="pl-4"><span className="text-[#e06c75]">model</span>: <span className="text-[#98c379]">"aegisora-fast-v2"</span>,</div>
          <div className="pl-4"><span className="text-[#e06c75]">tools</span>: [<span className="text-[#98c379]">"web_search"</span>, <span className="text-[#98c379]">"calculator"</span>],</div>
          <div className="pl-4"><span className="text-[#e06c75]">policies</span>: [Policy.<span className="text-[#61afef]">StrictCostLimit</span>(<span className="text-[#d19a66]">10.0</span>)]</div>
          <div>{`});`}</div>
          <br />
          <div><span className="text-[#c678dd]">const</span> <span className="text-[#e5c07b]">response</span> = <span className="text-[#c678dd]">await</span> agent.<span className="text-[#61afef]">run</span>(<span className="text-[#98c379]">"Analyze the Q3 financial reports."</span>);</div>
          <div><span className="text-[#e5c07b]">console</span>.<span className="text-[#61afef]">log</span>(response.<span className="text-[#e06c75]">output</span>);</div>
        </>
      )
    }
  ];

  return (
    <div className="max-w-4xl pb-40">
      <div className="text-[13px] font-mono text-[#3ca6ff] mb-4 uppercase tracking-widest font-bold">Deep Agents</div>
      
      {/* ID eklendi */}
      <h1 id="overview" className="text-[36px] md:text-[44px] font-bold tracking-tight mb-6 pt-4 scroll-mt-24">
        Deep Agents overview
      </h1>
      <p className="text-[16px] text-white/70 leading-relaxed mb-6">
        Aegisora Deep Agents (ADA) is the simplest way to build and deploy production-grade autonomous agents. You focus on what your agent does; ADA focuses on how to serve it securely. There are no servers to provision and no infrastructure to wire together.
      </p>
      <p className="text-[16px] text-white/70 leading-relaxed mb-12">
        You write the agent's intelligence: its instructions, the tools it can call, the skills it follows, and you select the model that drives it. ADA provides everything underneath.
      </p>

      {/* ID eklendi */}
      <h2 id="core-capabilities" className="text-[24px] font-semibold mb-6 tracking-tight border-b border-white/10 pb-4 pt-4 scroll-mt-24">
        Core capabilities
      </h2>
      <p className="text-[16px] text-white/70 leading-relaxed mb-8">
        Deep Agents comes with the following capabilities out-of-the-box:
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
        <div className="bg-[#050810] border border-white/10 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-[#3ca6ff]/10 rounded-lg"><Terminal size={18} className="text-[#3ca6ff]" /></div>
            <h3 className="font-bold text-[16px]">Execution Environment</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[13px] font-mono text-white/80">Code Interpreter</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[13px] font-mono text-white/80">Sandboxes</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[13px] font-mono text-white/80">Filesystem</span>
          </div>
        </div>

        <div className="bg-[#050810] border border-white/10 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-500/10 rounded-lg"><Users size={18} className="text-purple-400" /></div>
            <h3 className="font-bold text-[16px]">Delegation</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[13px] font-mono text-white/80">Planning</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[13px] font-mono text-white/80">Subagents</span>
          </div>
        </div>

        <div className="bg-[#050810] border border-white/10 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-500/10 rounded-lg"><Box size={18} className="text-green-400" /></div>
            <h3 className="font-bold text-[16px]">Context Management</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[13px] font-mono text-white/80">Skills</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[13px] font-mono text-white/80">Memory</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[13px] font-mono text-white/80">Summarization</span>
          </div>
        </div>

        <div className="bg-[#050810] border border-white/10 p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-500/10 rounded-lg"><Target size={18} className="text-orange-400" /></div>
            <h3 className="font-bold text-[16px]">Steering</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[13px] font-mono text-white/80">Human-in-the-loop</span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 rounded-md text-[13px] font-mono text-white/80">Prompt Caching</span>
          </div>
        </div>
      </div>

      {/* ID eklendi */}
      <h2 id="try-it" className="text-[24px] font-semibold mb-4 tracking-tight border-b border-white/10 pb-4 pt-4 scroll-mt-24">
        Try it
      </h2>
      <p className="text-[16px] text-white/70 leading-relaxed mb-4">
        Start with building a basic autonomous agent that can use tools and execute code. Select your preferred environment below:
      </p>

      <CodeTabs tabs={codeExamples} />
      
    </div>
  );
}
