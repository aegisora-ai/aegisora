"use client";

import { useState } from "react";
import { Search, Filter, Terminal, CheckCircle2, XCircle, Clock, ChevronRight, Activity } from "lucide-react";

const mockExecutions = [
  { id: "req_9f8a7d", agent: "DataAnalyst", timestamp: "Just now", duration: "1.2s", tokens: "4,201", status: "Success" },
  { id: "req_3b2c1e", agent: "SupportBot", timestamp: "5s ago", duration: "850ms", tokens: "1,054", status: "Success" },
  { id: "req_7d6e5f", agent: "LegalReviewer", timestamp: "12s ago", duration: "14.5s", tokens: "8,920", status: "Timeout" },
  { id: "req_1a2b3c", agent: "BillingAI", timestamp: "18s ago", duration: "240ms", tokens: "0", status: "Error" },
  { id: "req_4e5f6g", agent: "DataAnalyst", timestamp: "22s ago", duration: "2.1s", tokens: "6,102", status: "Success" },
  { id: "req_8h9i0j", agent: "InternalWiki", timestamp: "35s ago", duration: "410ms", tokens: "512", status: "Success" },
];

export default function ExecutionsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredExecutions = mockExecutions.filter(e =>
    e.agent.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col animate-in fade-in duration-300">

      {/* SUMMARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Requests (24h)</span>
            <Activity className="w-4 h-4 text-primary" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">14.2K</div>
          <div className="text-[11px] text-muted-foreground">Total inferences</div>
        </div>
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Success Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">99.8%</div>
          <div className="text-[11px] text-emerald-400">Healthy · sample data</div>
        </div>
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">P95 Latency</span>
            <Clock className="w-4 h-4 text-orange-500" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">1.8s</div>
          <div className="text-[11px] text-muted-foreground">End-to-end execution</div>
        </div>
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Failed Traces</span>
            <XCircle className="w-4 h-4 text-decision-block" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">28</div>
          <div className="text-[11px] text-decision-block">Errors or timeouts</div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Request ID or Agent..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111113] border b order-border hover:b order-sidebar-ring rounded-lg pl-9 pr-4 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:b order-primary transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 bg-[#111113] border b order-border hover:bg-[#18181b] px-3 py-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors outline-none w-full sm:w-auto justify-center cursor-pointer">
          <Filter className="w-3.5 h-3.5" /> Filter Errors
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-[#111113] border b order-border rounded-xl overflo w-hidden shado w-sm">
        <div className="overflo w-x-auto cf-scrollbar">
          <table className="w-full text-left b order-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#18181b] b order-b b order-border/50">
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Request ID</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Agent</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Duration</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Tokens</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right"></th>
              </tr>
            </thead>
            <tbody>
              {filteredExecutions.map((exec) => (
                <tr key={exec.id} className="b order-b b order-border/40 hover:bg-[#18181b]/80 transition-colors cursor-pointer group">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <Terminal className="w-3.5 h-3.5 text-muted-foreground" />
                      <span className="text-[12px] font-mono text-muted-foreground group-hover:text-primary transition-colors">{exec.id}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-[13px] font-medium text-foreground">{exec.agent}</td>
                  <td className="px-5 py-3 text-[12px] text-muted-foreground">{exec.timestamp}</td>
                  <td className="px-5 py-3 text-[12px] font-mono text-foreground">{exec.duration}</td>
                  <td className="px-5 py-3 text-[12px] font-mono text-muted-foreground">{exec.tokens}</td>
                  <td className="px-5 py-3">
                    {exec.status === 'Success' ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border b order-emerald-500/20 px-2 py-0.5 rounded w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Success
                      </span>
                    ) : exec.status === 'Timeout' ? (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-orange-400 bg-orange-500/10 border b order-orange-500/20 px-2 py-0.5 rounded w-fit">
                        <Clock className="w-3 h-3" /> Timeout
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[11px] font-medium text-decision-block bg-decision-block/10 border b order-decision-block/20 px-2 py-0.5 rounded w-fit">
                        <XCircle className="w-3 h-3" /> Error
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      Inspect Trace <ChevronRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
