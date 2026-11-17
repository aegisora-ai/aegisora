import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "./supabase";
import { bridge, readPrefs } from "./notify";

type Rec = Record<string, unknown>;
type Item = { kind: "approval" | "block"; title: string; body: string; approvalId?: string };

const text = (v: unknown, d: string) => (typeof v === "string" && v ? v : d);
const WINDOW_MS = 2500;
const MAX_SINGLE = 2;
const SUMMARY_GAP_MS = 20000;

export default function NotifyBridge() {
  const navigate = useNavigate();

  useEffect(() => {
    const b = bridge();
    if (!b?.onOpenApproval) return;
    return b.onOpenApproval((id) => navigate("/app/approvals?open=" + encodeURIComponent(id)));
  }, [navigate]);

  useEffect(() => {
    const b = bridge();
    if (!b?.notify) return;
    const notify = b.notify;
    const seen = new Set<string>();
    const once = (k: string) => { if (seen.has(k)) return false; seen.add(k); return true; };

    const queue: Item[] = [];
    let timer: ReturnType<typeof setTimeout> | null = null;
    let lastSummary = 0;

    const send = (it: Item) => { void notify({ title: it.title, body: it.body, approvalId: it.approvalId }); };

    const flush = () => {
      timer = null;
      if (queue.length === 0) return;
      if (queue.length <= MAX_SINGLE) { queue.splice(0).forEach(send); return; }
      const wait = SUMMARY_GAP_MS - (Date.now() - lastSummary);
      if (wait > 0) { timer = setTimeout(flush, wait); return; }
      const items = queue.splice(0);
      lastSummary = Date.now();
      const approvals = items.filter((i) => i.kind === "approval").length;
      const blocks = items.length - approvals;
      void notify({
        title: items.length + " new alerts",
        body: [approvals ? approvals + " need approval" : "", blocks ? blocks + " blocked" : ""].filter(Boolean).join(", "),
      });
    };

    const push = (it: Item) => {
      queue.push(it);
      if (!timer) timer = setTimeout(flush, WINDOW_MS);
    };

    const channel = supabase
      .channel("aegisora-alerts")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "approvals" }, (payload) => {
        const r = payload.new as Rec;
        if (String(r.status ?? "").toLowerCase() !== "pending") return;
        if (!readPrefs().escalate || !once("a:" + String(r.id))) return;
        push({
          kind: "approval",
          title: "Approval needed",
          body: text(r.agent_name, "An agent") + ": " + text(r.action, "action") + (r.resource ? " on " + String(r.resource) : ""),
          approvalId: typeof r.id === "string" ? r.id : undefined,
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "decisions" }, (payload) => {
        const r = payload.new as Rec;
        if (String(r.decision ?? "").toUpperCase() !== "BLOCK") return;
        if (!readPrefs().block || !once("d:" + String(r.id))) return;
        push({
          kind: "block",
          title: "Action blocked",
          body: text(r.agent_name, "An agent") + ": " + text(r.action, "action") + " - " + text(r.reason, "policy"),
        });
      })
      .subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      void supabase.removeChannel(channel);
    };
  }, []);

  return null;
}