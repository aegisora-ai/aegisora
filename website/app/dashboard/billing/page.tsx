"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Zap,
  ShieldCheck,
  Database,
  Cpu,
  Activity,
  ExternalLink,
  Check,
  Mail,
} from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function BillingPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<string | null>(null);
  const [metrics, setMetrics] = useState({
    agentCount: 0,
    incidentCount: 0,
    workspaceName: "Enterprise Workspace",
    createdAt: "2026-01-01",
  });

  useEffect(() => {
    async function fetchRealData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user) {
          const { data: wsData } = await supabase
            .from("workspaces")
            .select("name, created_at")
            .eq("owner_id", user.id)
            .single();

          if (wsData) {
            setMetrics((prev) => ({
              ...prev,
              workspaceName: wsData.name || "Enterprise Workspace",
              createdAt: wsData.created_at
                ? wsData.created_at.split("T")[0]
                : "2026-01-01",
            }));
          }
        }

        const { count: agentsCnt } = await supabase
          .from("agents")
          .select("*", { count: "exact", head: true });

        const { count: incCnt } = await supabase
          .from("incidents")
          .select("*", { count: "exact", head: true });

        setMetrics((prev) => ({
          ...prev,
          agentCount: agentsCnt || 0,
          incidentCount: incCnt || 0,
        }));
      } catch (err) {
        console.error("Error fetching workspace data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchRealData();
  }, [supabase]);

  // Lansmana özel aksiyon yönetimi (Beta aktivasyonu)
  const handleAction = async (planName: string, actionType: string) => {
    if (actionType === "current") return;

    setUpgrading(planName);

    setTimeout(() => {
      if (actionType === "contact") {
        window.location.href =
          "mailto:hello@aegisora.ai?subject=Enterprise Global Scale Inquiry";
      } else {
        alert(
          `🎉 Success! ${planName} features have been unlocked for your workspace during the Beta period.`,
        );
      }
      setUpgrading(null);
    }, 800);
  };

  return (
    <div className="p-6 sm:p-10 max-w-[1400px] mx-auto w-full flex flex-col gap-8 font-sans">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 b order-b b order-gray-800 pb-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
        >
          <h1 className="text-2xl font-serif text-white tracking-tight">
            Plans & Early Access
          </h1>
          <p className="text-xs font-mono text-gray-400 mt-1">
            Manage your beta access tiers, workspace limits, and database
            telemetry.
          </p>
        </motion.div>
      </div>

      {/* Aktif Workspace Durumu */}
      <div className="bg-[#121215] border b order-gray-800/80 rounded-2xl p-6 shado w-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#0066EE]/10 border b order-[#0066EE]/30 flex items-center justify-center text-[#0066EE]">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded uppercase tracking-wider">
              Active Workspace
            </span>
            <h3 className="text-xl font-serif font-semibold text-white mt-1">
              {metrics.workspaceName}
            </h3>
            <p className="text-xs font-mono text-gray-400">
              Established: {metrics.createdAt} • Zero-Trust Mode Enforced
            </p>
          </div>
        </div>

        <button className="flex items-center gap-2 bg-[#19191d] border b order-gray-700 hover:bg-gray-800 text-gray-300 px-5 py-2.5 rounded-xl text-xs font-mono font-semibold transition-all cursor-default outline-none">
          <span>Billing Paused (Beta Phase)</span>
          <Check className="w-3.5 h-3.5 text-emerald-400" />
        </button>
      </div>

      {/* PAKETLER */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          {
            name: "Starter Developer",
            price: "Free",
            period: "forever",
            desc: "For independent engineers and small AI agent prototypes.",
            features: [
              "Up to 5 AI Agents",
              "Basic Telemetry Logs",
              "Standard Security Proxy",
            ],
            actionText: "Current Plan",
            actionType: "current",
          },
          {
            name: "Pro Enterprise",
            price: "Free",
            period: "during beta",
            desc: "For growing companies scaling production AI fleets.",
            features: [
              "Unlimited AI Agents",
              "Real-time Threat Defense",
              "Compliance PDF Reports",
              "Priority Support",
            ],
            popular: true,
            actionText: "Activate Beta Pass",
            actionType: "upgrade",
          },
          {
            name: "Global Scale",
            price: "Custom",
            period: "on-premise",
            desc: "Custom zero-trust proxies and dedicated clusters.",
            features: [
              "Multi-region Clusters",
              "Custom LLM Firewalls",
              "Dedicated Account Manager",
              "SLA per agreement",
            ],
            actionText: "Contact Us",
            actionType: "contact",
          },
        ].map((plan, idx) => (
          <div
            key={idx}
            className={`bg-[#121215] border rounded-2xl p-6 flex flex-col justify-between shado w-xl transition-all relative ${
              plan.popular
                ? "b order-[#0066EE] shado w-blue-500/10"
                : "b order-gray-800/80"
            }`}
          >
            {plan.popular && (
              <span className="absolute -top-3 left-6 bg-[#0066EE] text-white text-[10px] font-mono px-3 py-1 rounded-full uppercase tracking-wider font-bold shado w-md">
                100% Free For Launch
              </span>
            )}
            <div>
              <div className="flex justify-between items-center mb-4 mt-2">
                <h4 className="text-sm font-mono text-white font-bold">
                  {plan.name}
                </h4>
              </div>
              <div className="text-3xl font-serif font-semibold text-white mb-2 flex items-end gap-1">
                {plan.price}
                <span className="text-xs font-mono text-gray-500 mb-1">
                  /{plan.period}
                </span>
              </div>
              <p className="text-xs font-mono text-gray-400 mb-6 min-h-[32px]">
                {plan.desc}
              </p>

              <div className="space-y-2 mb-8 b order-t b order-gray-800/80 pt-4">
                {plan.features.map((feat, fIdx) => (
                  <div
                    key={fIdx}
                    className="flex items-center gap-2 text-xs font-mono text-gray-300"
                  >
                    <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={() => handleAction(plan.name, plan.actionType)}
              disabled={
                upgrading === plan.name || plan.actionType === "current"
              }
              className={`w-full py-3 rounded-xl text-xs font-mono font-semibold transition-all flex items-center justify-center gap-2 outline-none ${
                plan.actionType === "current"
                  ? "bg-emerald-500/10 text-emerald-500 border b order-emerald-500/20 cursor-default"
                  : plan.popular
                    ? "bg-[#0066EE] hover:bg-blue-600 text-white shado w-lg shado w-blue-500/20 cursor-pointer"
                    : "bg-gray-800 hover:bg-gray-700 text-white cursor-pointer"
              }`}
            >
              {plan.actionType === "contact" ? (
                <Mail className="w-4 h-4" />
              ) : plan.actionType === "current" ? (
                <Check className="w-4 h-4" />
              ) : (
                <Zap className="w-4 h-4" />
              )}
              <span>
                {upgrading === plan.name ? "Processing..." : plan.actionText}
              </span>
            </button>
          </div>
        ))}
      </div>

      {/* Veritabanı Özet Metrikleri */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#121215] border b order-gray-800/80 rounded-2xl p-6 shado w-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-gray-400">
              Active Deployed Agents
            </span>
            <Cpu className="w-4 h-4 text-[#0066EE]" />
          </div>
          <div className="text-3xl font-serif font-semibold text-white mb-1">
            {loading ? "..." : metrics.agentCount}
          </div>
          <p className="text-[11px] font-mono text-gray-500">
            Live from agents table
          </p>
        </div>

        <div className="bg-[#121215] border b order-gray-800/80 rounded-2xl p-6 shado w-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-gray-400">
              Security Incidents Logged
            </span>
            <ShieldCheck className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-3xl font-serif font-semibold text-white mb-1">
            {loading ? "..." : metrics.incidentCount}
          </div>
          <p className="text-[11px] font-mono text-gray-500">
            Live from incidents table
          </p>
        </div>

        <div className="bg-[#121215] border b order-gray-800/80 rounded-2xl p-6 shado w-xl flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <span className="text-xs font-mono text-gray-400">
              Launch Phase Status
            </span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-serif font-semibold text-emerald-400 mb-1">
            Beta Active
          </div>
          <p className="text-[11px] font-mono text-emerald-500/70">
            100% Free Access Enabled
          </p>
        </div>
      </div>
    </div>
  );
}
