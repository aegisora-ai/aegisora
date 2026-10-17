"use client";

import { useState } from "react";
import { Search, Filter, Database, CheckCircle2, AlertCircle, RefreshCw, FileText, HardDrive, Link as LinkIcon } from "lucide-react";

const mockDatasets = [
  { id: "ds-001", name: "Internal Enterprise Wiki", source: "Confluence", type: "API Sync", size: "4.2 GB", lastSync: "10 mins ago", status: "Synced" },
  { id: "ds-002", name: "Customer Support Logs 2026", source: "AWS S3 Bucket", type: "Object Storage", size: "12.8 GB", lastSync: "Syncing...", status: "Syncing" },
  { id: "ds-003", name: "API Documentation v4", source: "GitHub Repository", type: "Git Hook", size: "156 MB", lastSync: "2 hours ago", status: "Synced" },
  { id: "ds-004", name: "Legal Contracts (Archived)", source: "Google Cloud Storage", type: "Object Storage", size: "84.5 GB", lastSync: "Yesterday", status: "Error" },
  { id: "ds-005", name: "Sales Transcripts Q2", source: "Salesforce", type: "API Sync", size: "1.1 GB", lastSync: "5 mins ago", status: "Synced" },
];

export default function DatasetsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredDatasets = mockDatasets.filter(d =>
    d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.source.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex flex-col animate-in fade-in duration-300">

      {/* SUMMARY METRICS */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Total Datasets</span>
            <Database className="w-4 h-4 text-primary" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">24</div>
          <div className="text-[11px] text-muted-foreground">Active data sources</div>
        </div>
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Total Storage</span>
            <HardDrive className="w-4 h-4 text-blue-500" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">102.6 GB</div>
          <div className="text-[11px] text-muted-foreground">Raw data ingested</div>
        </div>
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Sync Health</span>
            <RefreshCw className="w-4 h-4 text-emerald-500" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">96.4%</div>
          <div className="text-[11px] text-emerald-400 flex items-center gap-1">Pipelines operational · sample data</div>
        </div>
        <div className="bg-[#111113] border b order-border rounded-xl p-5 shado w-sm">
          <div className="flex justify-between items-start mb-2">
            <span className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground">Failed Syncs</span>
            <AlertCircle className="w-4 h-4 text-decision-block" strokeWidth={1.5} />
          </div>
          <div className="text-2xl font-bold text-white mb-1">1</div>
          <div className="text-[11px] text-decision-block flex items-center gap-1">Requires attention</div>
        </div>
      </div>

      {/* FILTER BAR */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search datasets or sources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#111113] border b order-border hover:b order-sidebar-ring rounded-lg pl-9 pr-4 py-2 text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:b order-primary transition-colors"
          />
        </div>
        <button className="flex items-center gap-2 bg-[#111113] border b order-border hover:bg-[#18181b] px-3 py-2 rounded-lg text-[12px] font-medium text-muted-foreground hover:text-foreground transition-colors outline-none w-full sm:w-auto justify-center cursor-pointer">
          <Filter className="w-3.5 h-3.5" /> Filter by Type
        </button>
      </div>

      {/* DATA TABLE */}
      <div className="bg-[#111113] border b order-border rounded-xl overflo w-hidden shado w-sm">
        <div className="overflo w-x-auto cf-scrollbar">
          <table className="w-full text-left b order-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-[#18181b] b order-b b order-border/50">
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Dataset Name</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Connection Source</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Size</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Last Sync</th>
                <th className="px-5 py-3 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredDatasets.map((dataset) => (
                <tr key={dataset.id} className="b order-b b order-border/40 hover:bg-[#18181b]/80 transition-colors cursor-pointer group">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-[#09090b] border b order-border flex items-center justify-center">
                        <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[13px] font-medium text-foreground">{dataset.name}</span>
                        <span className="text-[11px] font-mono text-muted-foreground">{dataset.id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex flex-col">
                      <span className="text-[13px] text-muted-foreground flex items-center gap-1.5"><LinkIcon className="w-3 h-3" /> {dataset.source}</span>
                      <span className="text-[11px] font-mono text-muted-foreground mt-0.5">{dataset.type}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[12px] font-mono text-foreground">{dataset.size}</td>
                  <td className="px-5 py-4 text-[12px] text-muted-foreground">{dataset.lastSync}</td>
                  <td className="px-5 py-4">
                    {dataset.status === 'Synced' ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-emerald-400 bg-emerald-500/10 border b order-emerald-500/20 px-2 py-0.5 rounded w-fit">
                        <CheckCircle2 className="w-3 h-3" /> Synced
                      </span>
                    ) : dataset.status === 'Syncing' ? (
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-primary bg-primary/10 border b order-primary/20 px-2 py-0.5 rounded w-fit">
                        <RefreshCw className="w-3 h-3 animate-spin" /> Syncing
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 text-[11px] font-medium text-decision-block bg-decision-block/10 border b order-decision-block/20 px-2 py-0.5 rounded w-fit">
                        <AlertCircle className="w-3 h-3" /> Error
                      </span>
                    )}
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
