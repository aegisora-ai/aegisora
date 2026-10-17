"use client";

import { Activity, Clock, Server, Zap, CheckCircle2, AlertTriangle, ArrowRight } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

const latencyData = [
  { time: "00:00", p50: 120, p90: 240, p99: 450 },
  { time: "04:00", p50: 115, p90: 220, p99: 420 },
  { time: "08:00", p50: 140, p90: 310, p99: 890 },
  { time: "12:00", p50: 180, p90: 450, p99: 1200 },
  { time: "16:00", p50: 165, p90: 380, p99: 980 },
  { time: "20:00", p50: 130, p90: 260, p99: 510 },
  { time: "24:00", p50: 125, p90: 250, p99: 460 },
];

const mockSlowTraces = [
  { id: "trace_819a", agent: "DataAnalyst", duration: "1.24s", bottleneck: "Vector DB Query", timestamp: "5 mins ago", status: "Warning" },
  { id: "trace_818b", agent: "LegalReviewer", duration: "3.80s", bottleneck: "Provider Inference (Anthropic)", timestamp: "12 mins ago", status: "Critical" },
  { id: "trace_817c", agent: "BillingAI", duration: "840ms", bottleneck: "Stripe API", timestamp: "24 mins ago", status: "Normal" },
  { id: "trace_816d", agent: "SupportBot", duration: "1.10s", bottleneck: "Provider Inference (OpenAI)", timestamp: "1 hour ago", status: "Warning" },
];

export default function PerformancePage() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">

      {/* SUMMARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Global P90 Latency</span>
            <Clock className="w-4 h-4 text-orange-500" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">310ms</div>
          <div className="text-[11px] text-muted-foreground">End-to-end execution</div>
        </div>
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Edge Cache Hit Rate</span>
            <Zap className="w-4 h-4 text-primary" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">84.2%</div>
          <div className="text-[11px] text-emerald-400">Optimal cache utilization · sample data</div>
        </div>
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Total Invocations</span>
            <Activity className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">2.4M</div>
          <div className="text-[11px] text-muted-foreground">Last 24 hours</div>
        </div>
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Compute Health</span>
            <Server className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">100%</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">All regions operational</div>
        </div>
      </div>

      {/* LATENCY CHART */}
      <div className="bg-[#111113] border b order-border rounded-xl p-5 flex flex-col shado w-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-[13px] font-bold text-white">Execution Latency Distribution (ms)</h3>
          <div className="flex items-center gap-4 text-[11px] font-mono text-muted-foreground">
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-orange-500/80" /> P99</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-primary/80" /> P90</span>
            <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500/80" /> P50</span>
          </div>
        </div>
        <div className="flex-1 min-h-[250px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={latencyData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="time" stroke="var(--muted-foreground)" fontSize={10} axisLine={false} tickLine={false} />
              <YAxis stroke="var(--muted-foreground)" fontSize={10} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
              <Area type="monotone" dataKey="p99" stroke="#f97316" strokeWidth={1} fill="#f97316" fillOpacity={0.1} />
              <Area type="monotone" dataKey="p90" stroke="var(--primary)" strokeWidth={1} fill="var(--primary)" fillOpacity={0.2} />
              <Area type="monotone" dataKey="p50" stroke="#10b981" strokeWidth={2} fill="#10b981" fillOpacity={0.3} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SLOW TRACES TABLE */}
      <div className="bg-[#111113] border b order-border rounded-xl overflo w-hidden shado w-sm">
        <div className="p-5 b order-b b order-border/50 bg-[#18181b]/50">
          <h3 className="text-[13px] font-bold text-white">Latency Bottleneck Traces</h3>
        </div>
        <div className="overflo w-x-auto cf-scrollbar">
          <table className="w-full text-left b order-collapse whitespace-nowrap">
            <thead>
              <tr className="b order-b b order-border/50 bg-[#111113]">
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Trace ID</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Agent</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Total Duration</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Identified Bottleneck</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Timestamp</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right"></th>
              </tr>
            </thead>
            <tbody>
              {mockSlowTraces.map((trace, i) => (
                <tr key={i} className="b order-b b order-border/40 hover:bg-[#18181b]/80 transition-colors cursor-pointer group">
                  <td className="px-5 py-3 text-[12px] font-mono text-muted-foreground group-hover:text-primary transition-colors">{trace.id}</td>
                  <td className="px-5 py-3 text-[13px] font-medium text-foreground">{trace.agent}</td>
                  <td className="px-5 py-3">
                    <span className={`text-[12px] font-mono font-semibold ${trace.status === 'Critical' ? 'text-decision-block' : trace.status === 'Warning' ? 'text-decision-escalate' : 'text-decision-allow'}`}>
                      {trace.duration}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-muted-foreground">{trace.bottleneck}</td>
                  <td className="px-5 py-3 text-[12px] text-muted-foreground">{trace.timestamp}</td>
                  <td className="px-5 py-3 text-right">
                    <button className="text-[11px] text-muted-foreground hover:text-foreground flex items-center gap-1 ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                      Inspect <ArrowRight className="w-3 h-3" />
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
