"use client";
import React, { useState } from "react";
import { Settings2, Building2, CreditCard, Trash2, Save, Hexagon } from "lucide-react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("workspace");

  return (
    <div className="max-w-[1000px] mx-auto animate-in fade-in duration-500">

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-[24px] font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Settings2 className="w-6 h-6 text-slate-400" /> Workspace Settings
        </h1>
        <p className="text-[14px] text-slate-500 font-medium mt-1">Manage your enterprise workspace, billing, and global preferences.</p>
      </div>

      {/* Tabs */}
      <div className="flex b order-b b order-slate-200 mb-8">
        <button
          onClick={() => setActiveTab("workspace")}
          className={`flex items-center gap-2 pb-3 px-4 text-[14px] font-bold transition-colors ${activeTab === 'workspace' ? 'b order-b-2 b order-[#0066FF] text-[#0066FF]' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <Building2 className="w-4 h-4" /> General
        </button>
        <button
          onClick={() => setActiveTab("billing")}
          className={`flex items-center gap-2 pb-3 px-4 text-[14px] font-bold transition-colors ${activeTab === 'billing' ? 'b order-b-2 b order-[#0066FF] text-[#0066FF]' : 'text-slate-500 hover:text-slate-900'}`}
        >
          <CreditCard className="w-4 h-4" /> Billing & Plan
        </button>
      </div>

      {/* Tab Content: Workspace */}
      {activeTab === "workspace" && (
        <div className="space-y-8">

          {/* Workspace Info */}
          <div className="bg-white border b order-slate-200 rounded-xl shado w-sm overflo w-hidden">
            <div className="p-6 b order-b b order-slate-100">
              <h3 className="text-[16px] font-bold text-slate-900 mb-1">Workspace Identity</h3>
              <p className="text-[13px] text-slate-500">This is your organization's presence on Aegisora.</p>
            </div>
            <div className="p-6 flex flex-col gap-6">
              <div className="flex items-center gap-6">
                 <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shado w-inner">
                   <Hexagon className="w-8 h-8 text-white" />
                 </div>
                 <div>
                   <button className="px-4 py-2 bg-slate-100 text-slate-700 text-[13px] font-bold rounded-lg hover:bg-slate-200 transition-colors">Upload Logo</button>
                   <p className="text-[12px] text-slate-500 mt-2">Recommended size: 256x256px.</p>
                 </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-2 uppercase tracking-wide">Workspace Name</label>
                  <input type="text" defaultValue="Acme Corp" className="w-full px-4 py-2.5 bg-slate-50 border b order-slate-200 rounded-lg text-[14px] font-medium text-slate-900 focus:outline-none focus:b order-[#0066FF] focus:bg-white transition-colors" />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-slate-700 mb-2 uppercase tracking-wide">Workspace Slug</label>
                  <input type="text" defaultValue="acme-corp" className="w-full px-4 py-2.5 bg-slate-50 border b order-slate-200 rounded-lg text-[14px] font-mono text-slate-900 focus:outline-none focus:b order-[#0066FF] focus:bg-white transition-colors" />
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex justify-end b order-t b order-slate-100">
              <button className="flex items-center gap-2 px-4 py-2 bg-slate-900 text-white text-[13px] font-bold rounded-lg shado w-sm hover:bg-slate-800 transition-colors">
                <Save className="w-4 h-4" /> Save Changes
              </button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="border b order-rose-200 rounded-xl overflo w-hidden bg-white shado w-sm">
            <div className="p-6 b order-b b order-rose-100 bg-rose-50/30">
              <h3 className="text-[16px] font-bold text-rose-700 mb-1 flex items-center gap-2"><Trash2 className="w-4 h-4"/> Danger Zone</h3>
              <p className="text-[13px] text-rose-600/80">Irreversible and destructive actions for this workspace.</p>
            </div>
            <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <h4 className="text-[14px] font-bold text-slate-900">Delete Workspace</h4>
                <p className="text-[13px] text-slate-500 mt-1 max-w-md">Permanently remove your workspace and all of its configurations, agents, policies, and audit logs. This action cannot be undone.</p>
              </div>
              <button className="px-4 py-2 bg-rose-100 text-rose-700 hover:bg-rose-600 hover:text-white text-[13px] font-bold rounded-lg transition-colors whitespace-nowrap">
                Delete Workspace
              </button>
            </div>
          </div>

        </div>
      )}

      {/* Tab Content: Billing */}
      {activeTab === "billing" && (
        <div className="space-y-8">
          <div className="bg-white border b order-slate-200 rounded-xl shado w-sm p-6">
            <div className="flex justify-between items-start mb-6 b order-b b order-slate-100 pb-6">
               <div>
                 <h3 className="text-[18px] font-black text-slate-900 mb-1">Enterprise Plan</h3>
                 <p className="text-[13px] text-slate-500">You are currently on the Enterprise tier. SLA terms per agreement.</p>
               </div>
               <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-[11px] font-bold uppercase tracking-wider rounded-md">Active</span>
            </div>
            <div className="flex justify-between items-center">
              <div>
                <p className="text-[14px] font-bold text-slate-700">Next billing cycle</p>
                <p className="text-[13px] text-slate-500 mt-1">September 1, 2026</p>
              </div>
              <button className="px-4 py-2 bg-slate-100 text-slate-700 text-[13px] font-bold rounded-lg hover:bg-slate-200 transition-colors">Manage Subscription</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
