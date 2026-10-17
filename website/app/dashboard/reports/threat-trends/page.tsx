"use client";

import { ShieldAlert, Zap, TrendingUp, Crosshair } from "lucide-react";
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell, BarChart, Bar
} from "recharts";

const trendData = [
  { day: "01 Aug", threats: 120, blocked: 115 },
  { day: "05 Aug", threats: 210, blocked: 200 },
  { day: "10 Aug", threats: 180, blocked: 175 },
  { day: "15 Aug", threats: 340, blocked: 330 },
  { day: "20 Aug", threats: 290, blocked: 285 },
  { day: "25 Aug", threats: 420, blocked: 410 },
  { day: "30 Aug", threats: 310, blocked: 305 },
];

const distributionData = [
  { name: "Prompt Injection", value: 45, color: "#f97316" }, // Orange
  { name: "Data Leakage", value: 30, color: "#ef4444" },     // Red
  { name: "Rate Limit Anomaly", value: 15, color: "#eab308" }, // Yellow
  { name: "Unauthorized API", value: 10, color: "#3b82f6" },   // Blue
];

const targetedAgents = [
  { name: "DataAnalyst Agent", attacks: 1420, risk: "High" },
  { name: "Support Bot", attacks: 850, risk: "Medium" },
  { name: "Billing Assistant", attacks: 610, risk: "High" },
  { name: "Internal Wiki AI", attacks: 240, risk: "Low" },
];

export default function ThreatTrendsPage() {
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">

      {/* SUMMARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Total Threats</span>
            <ShieldAlert className="w-4 h-4 text-orange-500" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">3,450</div>
          <div className="text-[11px] text-orange-400 flex items-center gap-1"><TrendingUp className="w-3 h-3" /> +14% vs last period</div>
        </div>
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Block Rate</span>
            <Zap className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">98.2%</div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">Successfully mitigated · sample data</div>
        </div>
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Top Threat</span>
            <Crosshair className="w-4 h-4 text-primary" strokeWidth={1.5} />
          </div>
          <div className="text-lg font-bold text-white mb-1">Prompt Injection</div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">45% of total volume</div>
        </div>
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Highest Risk Agent</span>
            <AlertTriangle className="w-4 h-4 text-decision-block" strokeWidth={1.5} />
          </div>
          <div className="text-lg font-bold text-white mb-1">DataAnalyst</div>
          <div className="text-[11px] text-muted-foreground flex items-center gap-1">1,420 attacks targeted</div>
        </div>
      </div>

      {/* CHARTS GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Trend Area Chart */}
        <div className="lg:col-span-2 bg-[#111113] border b order-border rounded-xl p-5 flex flex-col shado w-sm">
          <h3 className="text-[13px] font-bold text-white mb-6">Threat Volume Over Time</h3>
          <div className="flex-1 min-h-[250px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trendData} margin={{ top: 5, right: 0, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorThreats" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={10} axisLine={false} tickLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={10} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                <Area type="monotone" dataKey="threats" stroke="#f97316" strokeWidth={2} fill="url(#colorThreats)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Distribution Pie Chart */}
        <div className="bg-[#111113] border b order-border rounded-xl p-5 flex flex-col shado w-sm">
          <h3 className="text-[13px] font-bold text-white mb-2">Threat Distribution</h3>
          <div className="flex-1 min-h-[200px] w-full relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={distributionData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={2} dataKey="value">
                  {distributionData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} stroke="rgba(0,0,0,0)" />)}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#18181b', borderColor: 'var(--border)', borderRadius: '8px', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none flex-col mt-2">
              <span className="text-2xl font-bold text-white">4</span>
              <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">Signatures</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {distributionData.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* TARGETED AGENTS TABLE */}
      <div className="bg-[#111113] border b order-border rounded-xl overflo w-hidden shado w-sm">
        <div className="p-5 b order-b b order-border/50 bg-[#18181b]/50">
          <h3 className="text-[13px] font-bold text-white">Top Targeted Agents</h3>
        </div>
        <div className="overflo w-x-auto cf-scrollbar">
          <table className="w-full text-left b order-collapse whitespace-nowrap">
            <thead>
              <tr className="b order-b b order-border/50 bg-[#111113]">
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Agent Name</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Attack Volume</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Risk Posture</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {targetedAgents.map((agent, i) => (
                <tr key={i} className="b order-b b order-border/40 hover:bg-[#18181b]/80 transition-colors">
                  <td className="px-5 py-3 text-[13px] font-medium text-foreground">{agent.name}</td>
                  <td className="px-5 py-3 text-[13px] font-mono text-muted-foreground">{agent.attacks.toLocaleString()}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider border ${agent.risk === 'High' ? 'bg-decision-block/10 text-decision-block b order-decision-block/20' : agent.risk === 'Medium' ? 'bg-decision-escalate/10 text-decision-escalate b order-decision-escalate/20' : 'bg-decision-allow/10 text-decision-allow b order-decision-allow/20'}`}>
                      {agent.risk}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-[12px] text-emerald-400 flex items-center gap-1.5"><ShieldAlert className="w-3.5 h-3.5" /> Protected</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

// Eksik import'u eklemek için AlertTriangle'ı import ediyoruz.
import { AlertTriangle } from "lucide-react";
