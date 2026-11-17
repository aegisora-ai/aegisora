import { useEffect, useState } from "react";
import { supabase } from "./supabase";
import { useWorkspace } from "./workspace";

export type Row = Record<string, any>;

export type Query = {
  select?: string;
  order?: string;
  asc?: boolean;
  limit?: number;
  since?: { col: string; ms: number } | null;
  eq?: Record<string, string | undefined | null>;
  scoped?: boolean; // filter by current workspace_id (default true)
};

export const RANGES = [
  { key: "1h", label: "1 hour", ms: 3600e3 },
  { key: "24h", label: "24 hours", ms: 24 * 3600e3 },
  { key: "7d", label: "7 days", ms: 7 * 24 * 3600e3 },
  { key: "30d", label: "30 days", ms: 30 * 24 * 3600e3 },
] as const;
export const rangeMs = (key: string) => RANGES.find((r) => r.key === key)?.ms ?? 24 * 3600e3;

export function useRows(table: string, q: Query, enabled = true) {
  const { current } = useWorkspace();
  const wsId = q.scoped === false ? null : current?.workspaceId ?? null;
  const key = JSON.stringify([q, wsId, enabled]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (!enabled) { setLoading(false); return; }
    let on = true;
    setLoading(true);
    (async () => {
      let b: any = supabase.from(table).select(q.select ?? "*");
      if (wsId) b = b.eq("workspace_id", wsId);
      if (q.since) b = b.gte(q.since.col, new Date(Date.now() - q.since.ms).toISOString());
      for (const [k, v] of Object.entries(q.eq ?? {})) if (v && v !== "all") b = b.eq(k, v);
      if (q.order) b = b.order(q.order, { ascending: q.asc ?? false });
      b = b.limit(q.limit ?? 500);
      const { data, error: err } = await b;
      if (!on) return;
      if (err) { setError(err.message); setRows([]); } else { setError(null); setRows((data ?? []) as Row[]); }
      setLoading(false);
    })();
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, key, tick]);

  return { rows, loading, error, reload: () => setTick((t) => t + 1) };
}

export const fmtTime = (v?: string | null) => (v ? new Date(v).toLocaleString() : "-");
export const shortId = (v?: string | null, n = 8) => (v ? (v.length > n + 2 ? v.slice(0, n) + "…" : v) : "-");
export function ago(v?: string | null) {
  if (!v) return "-";
  const s = Math.max(0, (Date.now() - new Date(v).getTime()) / 1000);
  if (s < 60) return `${Math.floor(s)}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

export function toCsv(rows: Row[], keys: string[]) {
  const esc = (v: unknown) => {
    const s = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [keys.join(","), ...rows.map((r) => keys.map((k) => esc(r[k])).join(","))].join("\n");
}

export function downloadText(name: string, text: string, mime = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}

export function newId(prefix: string) {
  return `${prefix}_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`;
}
