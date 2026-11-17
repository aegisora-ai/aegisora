import RefreshButton from "../components/RefreshButton";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Copy, Check, Download, Inbox, RefreshCw, Search, X, ChevronLeft, ChevronRight, ArrowUp, ArrowDown } from "lucide-react";
import { downloadText, toCsv, type Row } from "../lib/db";

/* ---------- page header ---------- */
export function PageHead({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="page-head">
      <div>
        <h2 className="page-title">{title}</h2>
        {subtitle && <p className="mute page-sub">{subtitle}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

/* ---------- badge ---------- */
export function toneOf(v: unknown): "ok" | "warn" | "bad" | "info" | "neutral" {
  const s = String(v ?? "").toLowerCase();
  if (["allow", "low", "approved", "active", "succeeded", "resolved", "closed", "executed", "valid", "published", "ok"].includes(s)) return "ok";
  if (["escalate", "medium", "pending", "investigating", "retrying", "acknowledged", "escalated", "delivering", "draft", "not_validated"].includes(s)) return "warn";
  if (["block", "high", "critical", "rejected", "failed", "blocked", "invalid", "prevented", "expired", "disabled"].includes(s)) return "bad";
  if (["open", "consumed", "archived"].includes(s)) return "info";
  return "neutral";
}
export function Badge({ value, tone }: { value: unknown; tone?: "ok" | "warn" | "bad" | "info" | "neutral" }) {
  if (value == null || value === "") return <span className="mute">-</span>;
  return <span className={`badge ${tone ?? toneOf(value)}`}>{String(value)}</span>;
}

/* ---------- misc ---------- */
export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "bad"; children: ReactNode }) {
  return <div className={`notice ${tone}`}>{children}</div>;
}
export function ErrorNote({ errors }: { errors: [string, string | null | undefined][] }) {
  const list = errors.filter(([, e]) => e);
  if (!list.length) return null;
  return (
    <Notice tone="warn">
      <b>Some data could not be loaded.</b> Check that the migration for these tables is applied and that your role can read them.
      <ul className="notice-list">{list.map(([k, e]) => <li key={k}><code>{k}</code>: {e}</li>)}</ul>
    </Notice>
  );
}
export function Empty({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="empty">
      <Inbox size={26} />
      <b>{title}</b>
      {hint && <p className="mute">{hint}</p>}
      {action}
    </div>
  );
}
export function Stat({ label, value, hint, tone }: { label: string; value: ReactNode; hint?: string; tone?: "ok" | "warn" | "bad" }) {
  return (
    <div className="kpi">
      <span className="kpi-label">{label}</span>
      <span className={`kpi-value ${tone ?? ""}`}>{value}</span>
      {hint && <span className="kpi-hint mute">{hint}</span>}
    </div>
  );
}
export function Seg<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: { key: T; label: string }[] }) {
  return (
    <div className="seg" role="tablist">
      {options.map((o) => (
        <button key={o.key} role="tab" aria-selected={value === o.key} className={value === o.key ? "on" : ""} onClick={() => onChange(o.key)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}
export function Select({ value, onChange, options, label }: { value: string; onChange: (v: string) => void; options: { key: string; label: string }[]; label: string }) {
  return (
    <label className="sel">
      <span className="mute">{label}</span>
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((o) => <option key={o.key} value={o.key}>{o.label}</option>)}
      </select>
    </label>
  );
}
export function Btn({ children, onClick, kind = "ghost", disabled, title }: { children: ReactNode; onClick?: () => void; kind?: "primary" | "ghost" | "danger"; disabled?: boolean; title?: string }) {
  return <button className={`bt ${kind}`} onClick={onClick} disabled={disabled} title={title}>{children}</button>;
}

/* ---------- drawer ---------- */
export function Drawer({ open, onClose, title, subtitle, children, width = 560 }: { open: boolean; onClose: () => void; title: string; subtitle?: ReactNode; children: ReactNode; width?: number }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="overlay" onMouseDown={onClose}>
      <aside className="drawer" style={{ width }} onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <header className="drawer-head">
          <div>
            <b>{title}</b>
            {subtitle && <div className="mute small-text">{subtitle}</div>}
          </div>
          <button className="icon-btn" onClick={onClose} title="Close (Esc)"><X size={15} /></button>
        </header>
        <div className="drawer-body">{children}</div>
      </aside>
    </div>
  );
}
export function Modal({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="overlay center-ov" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-label={title}>
        <header className="drawer-head"><b>{title}</b><button className="icon-btn" onClick={onClose}><X size={15} /></button></header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  );
}
export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="fld">
      <span>{label}</span>
      {children}
      {hint && <small className="mute">{hint}</small>}
    </label>
  );
}

/* ---------- key/value + json ---------- */
export function KV({ items }: { items: [string, ReactNode][] }) {
  return (
    <dl className="kv">
      {items.map(([k, v]) => (
        <div key={k}><dt>{k}</dt><dd>{v ?? "-"}</dd></div>
      ))}
    </dl>
  );
}
export function Json({ value, label }: { value: unknown; label?: string }) {
  const [copied, setCopied] = useState(false);
  const text = useMemo(() => JSON.stringify(value, null, 2), [value]);
  return (
    <div className="json">
      <div className="json-bar">
        <span className="mute small-text">{label ?? "JSON"}</span>
        <button className="link" onClick={() => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 1200); }}>
          {copied ? <><Check size={13} /> Copied</> : <><Copy size={13} /> Copy</>}
        </button>
      </div>
      <pre>{text}</pre>
    </div>
  );
}

/* ---------- data table ---------- */
export type Col = {
  key: string;
  label: string;
  render?: (r: Row) => ReactNode;
  value?: (r: Row) => string | number;
  width?: string;
  align?: "right";
  hideCsv?: boolean;
};

export function DataTable({
  cols, rows, loading, onRow, toolbar, empty, pageSize = 25, exportName, onReload, csvKeys,
}: {
  cols: Col[]; rows: Row[]; loading?: boolean; onRow?: (r: Row) => void; toolbar?: ReactNode;
  empty?: ReactNode; pageSize?: number; exportName?: string; onReload?: () => void; csvKeys?: string[];
}) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let out = needle ? rows.filter((r) => JSON.stringify(r).toLowerCase().includes(needle)) : rows;
    if (sort) {
      const col = cols.find((c) => c.key === sort.key);
      const val = (r: Row) => (col?.value ? col.value(r) : r[sort.key]);
      out = [...out].sort((a, b) => {
        const x = val(a), y = val(b);
        if (x == null) return 1;
        if (y == null) return -1;
        return (x > y ? 1 : x < y ? -1 : 0) * sort.dir;
      });
    }
    return out;
  }, [rows, q, sort, cols]);

  useEffect(() => setPage(0), [q, sort, rows]);
  const pages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const view = filtered.slice(page * pageSize, page * pageSize + pageSize);

  function exportCsv() {
    const keys = csvKeys ?? cols.filter((c) => !c.hideCsv).map((c) => c.key);
    downloadText(`${exportName ?? "export"}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(filtered, keys), "text/csv");
  }

  return (
    <div className="tbl-wrap">
      <div className="tbl-bar">
        <div className="tbl-search">
          <Search size={14} />
          <input placeholder="Filter rows…" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Filter rows" />
          {q && <button className="link" onClick={() => setQ("")} title="Clear"><X size={13} /></button>}
        </div>
        {toolbar}
        <div className="spacer" />
        <span className="mute small-text">{filtered.length}{filtered.length !== rows.length ? ` of ${rows.length}` : ""} rows</span>
        {onReload && <RefreshButton onReload={onReload} icon={<RefreshCw size={13} />} />}
        {exportName && <button className="bt ghost" onClick={exportCsv} disabled={!filtered.length}><Download size={13} /> CSV</button>}
      </div>
      <div className="tbl-scroll">
        <table className="tbl">
          <thead>
            <tr>
              {cols.map((c) => (
                <th key={c.key} style={{ width: c.width, textAlign: c.align }} onClick={() => setSort((s) => (s?.key === c.key ? (s.dir === 1 ? { key: c.key, dir: -1 } : null) : { key: c.key, dir: 1 }))}>
                  <span>{c.label}{sort?.key === c.key && (sort.dir === 1 ? <ArrowUp size={11} /> : <ArrowDown size={11} />)}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && !rows.length
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="skel">{cols.map((c) => <td key={c.key}><span /></td>)}</tr>
                ))
              : view.map((r, i) => (
                  <tr key={r.id ?? r.event_id ?? i} className={onRow ? "click" : ""} onClick={() => onRow?.(r)}>
                    {cols.map((c) => (
                      <td key={c.key} style={{ textAlign: c.align }}>{c.render ? c.render(r) : String(r[c.key] ?? "-")}</td>
                    ))}
                  </tr>
                ))}
          </tbody>
        </table>
        {!loading && !filtered.length && (empty ?? <Empty title="No rows" hint={q ? "Nothing matches this filter." : "There is nothing here yet."} />)}
      </div>
      {filtered.length > pageSize && (
        <div className="pager">
          <button className="icon-btn sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}><ChevronLeft size={14} /></button>
          <span className="mute small-text">Page {page + 1} of {pages}</span>
          <button className="icon-btn sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}><ChevronRight size={14} /></button>
        </div>
      )}
    </div>
  );
}

/* ---------- charts (plain SVG) ---------- */
export type Bucket = { label: string; allow: number; escalate: number; block: number };
export function StackedBars({ data, height = 150 }: { data: Bucket[]; height?: number }) {
  const w = 720, pad = 22;
  const max = Math.max(1, ...data.map((d) => d.allow + d.escalate + d.block));
  const bw = (w - pad) / Math.max(1, data.length);
  const total = data.reduce((s, d) => s + d.allow + d.escalate + d.block, 0);
  if (!total) return <Empty title="No decisions in this range" hint="Bars appear as soon as an agent calls the control API." />;
  return (
    <svg viewBox={`0 0 ${w} ${height + 20}`} className="chart" role="img" aria-label="Decisions over time">
      {[0, 0.5, 1].map((t) => (
        <g key={t}>
          <line x1={pad} x2={w} y1={height - t * height} y2={height - t * height} stroke="var(--line)" strokeDasharray="3 4" />
          <text x={0} y={height - t * height + 4} fontSize="10" fill="var(--mute)">{Math.round(max * t)}</text>
        </g>
      ))}
      {data.map((d, i) => {
        const x = pad + i * bw + 2;
        const hA = (d.allow / max) * height, hE = (d.escalate / max) * height, hB = (d.block / max) * height;
        return (
          <g key={i}>
            <title>{`${d.label}: ${d.allow} allow, ${d.escalate} escalate, ${d.block} block`}</title>
            <rect x={x} y={height - hA} width={bw - 4} height={hA} fill="var(--ok)" rx="1.5" />
            <rect x={x} y={height - hA - hE} width={bw - 4} height={hE} fill="var(--warn)" />
            <rect x={x} y={height - hA - hE - hB} width={bw - 4} height={hB} fill="var(--bad)" rx="1.5" />
          </g>
        );
      })}
      <text x={pad} y={height + 14} fontSize="10" fill="var(--mute)">{data[0]?.label}</text>
      <text x={w} y={height + 14} fontSize="10" fill="var(--mute)" textAnchor="end">{data[data.length - 1]?.label}</text>
    </svg>
  );
}

export function RiskBar({ score }: { score: number | null | undefined }) {
  const s = Math.max(0, Math.min(100, Number(score ?? 0)));
  const color = s >= 80 ? "var(--bad)" : s >= 50 ? "var(--warn)" : "var(--ok)";
  return (
    <span className="riskbar" title={`Risk score ${s}`}>
      <span className="riskbar-track"><span style={{ width: `${s}%`, background: color }} /></span>
      <span className="mono">{s}</span>
    </span>
  );
}
