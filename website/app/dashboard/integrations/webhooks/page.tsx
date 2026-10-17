"use client";

import { useState } from "react";
import { Search, Activity, Share2, AlertCircle, CheckCircle2, ChevronRight, XCircle } from "lucide-react";

const mockWebhooks = [
  { id: "wh-9281a", name: "SIEM Forwarder", url: "https://splunk.internal.aegisora.com/hec", events: ["incident.created", "policy.updated"], status: "Active", lastFired: "2 mins ago" },
  { id: "wh-9280b", name: "Security Alerts", url: "https://hooks.slack.com/services/T0000...", events: ["agent.quarantined", "risk.critical"], status: "Active", lastFired: "1 hour ago" },
  { id: "wh-9279c", name: "Custom Billing Sync", url: "https://api.acme.corp/v1/aegisora/usage", events: ["billing.limit_reached"], status: "Failing", lastFired: "12 hours ago" },
];

export default function WebhooksPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredHooks = mockWebhooks.filter(wh =>
    wh.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    wh.url.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col animate-in fade-in duration-300">

      {/* SUMMARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Total Endpoints</span>
            <Share2 className="w-4 h-4 text-primary" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">3</div>
          <div className="text-[11px] text-muted-foreground">Configured webhook routes</div>
        </div>
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Delivery Rate</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">98.5%</div>
          <div className="text-[11px] text-emerald-400">Successful deliveries (24h) · sample data</div>
        </div>
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Failing Hooks</span>
            <AlertCircle className="w-4 h-4 text-decision-block" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">1</div>
          <div className="text-[11px] text-decision-block flex items-center gap-1">Requires attention</div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text" placeholder="Search webhooks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111113] border b order-border hover:b order-sidebar-ring rounded-lg pl-9 pr-4 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:b order-primary transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 bg-[#111113] border b order-border hover:bg-[#18181b] px-4 py-2 rounded-lg text-[12px] font-medium text-foreground transition-colors outline-none w-full sm:w-auto justify-center cursor-pointer">
          Add Webhook
        </button>
      </div>

      {/* WEBHOOKS TABLE */}
      <div className="bg-[#111113] border b order-border rounded-xl overflo w-hidden shado w-sm">
        <div className="overflo w-x-auto cf-scrollbar">
          <table className="w-full text-left b order-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#18181b] b order-b b order-border/50">
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Webhook Name & ID</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Endpoint URL</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Subscribed Events</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider text-right">Last Fired</th>
              </tr>
            </thead>
            <tbody>
              {filteredHooks.map((wh) => (
                <tr key={wh.id} className="b order-b b order-border/40 hover:bg-[#18181b]/80 transition-colors cursor-pointer group">
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-[13px] font-medium text-foreground">{wh.name}</span>
                      <span className="text-[11px] font-mono text-muted-foreground mt-0.5">{wh.id}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[200px] block">
                      {wh.url}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-1.5 flex-wrap max-w-[250px]">
                      {wh.events.map((ev, i) => (
                        <span key={i} className="text-[10px] font-mono bg-[#18181b] border b order-border px-1.5 py-0.5 rounded text-muted-foreground">
                          {ev}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    {wh.status === 'Active' ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border b order-emerald-500/20 px-2 py-0.5 rounded w-fit">
                        <Activity className="w-3 h-3" /> Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-decision-block bg-decision-block/10 border b order-decision-block/20 px-2 py-0.5 rounded w-fit">
                        <XCircle className="w-3 h-3" /> Failing
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-3">
                      <span className="text-[11px] text-muted-foreground">{wh.lastFired}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
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
