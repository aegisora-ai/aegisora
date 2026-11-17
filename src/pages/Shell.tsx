import { useEffect, useMemo, useRef, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { Building2, CornerDownLeft, LogOut, Search } from "lucide-react";
import Logo from "../components/Logo";
import ThemeToggle from "../components/ThemeToggle";
import TitleBar from "../components/TitleBar";
import { supabase } from "../lib/supabase";
import { useSession } from "../lib/useSession";
import { WorkspaceProvider, useWorkspace } from "../lib/workspace";
import { NAV } from "../nav";

function Palette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const nav = useNavigate();
  const [q, setQ] = useState("");
  const [idx, setIdx] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const items = useMemo(
    () => NAV.flatMap((g) => g.items.map((i) => ({ ...i, group: g.group, to: i.path === "" ? "/app" : `/app/${i.path}` })))
      .filter((i) => (i.label + " " + i.group).toLowerCase().includes(q.toLowerCase())),
    [q],
  );
  useEffect(() => { if (open) { setQ(""); setIdx(0); setTimeout(() => input.current?.focus(), 0); } }, [open]);
  useEffect(() => setIdx(0), [q]);
  if (!open) return null;
  const go = (to: string) => { nav(to); onClose(); };
  return (
    <div className="overlay center-ov top" onMouseDown={onClose}>
      <div className="palette" onMouseDown={(e) => e.stopPropagation()}>
        <div className="palette-in"><Search size={15} />
          <input ref={input} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Jump to a page…"
            onKeyDown={(e) => {
              if (e.key === "Escape") onClose();
              if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(items.length - 1, i + 1)); }
              if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
              if (e.key === "Enter" && items[idx]) go(items[idx].to);
            }} />
        </div>
        <div className="palette-list">
          {items.length === 0 && <p className="mute" style={{ padding: 14 }}>No page matches “{q}”.</p>}
          {items.map((i, n) => (
            <button key={i.to} className={n === idx ? "on" : ""} onMouseEnter={() => setIdx(n)} onClick={() => go(i.to)}>
              <i.icon size={15} /><span>{i.label}</span><small className="mute">{i.group}</small>{n === idx && <CornerDownLeft size={13} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Frame() {
  const nav = useNavigate();
  const loc = useLocation();
  const { session } = useSession();
  const { current, memberships, select } = useWorkspace();
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setPalette((p) => !p); } };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, []);

  const page = NAV.flatMap((g) => g.items).find((i) => (i.path === "" ? loc.pathname === "/app" : loc.pathname.startsWith(`/app/${i.path}`)));

  async function signOut() {
    await supabase.auth.signOut();
    nav("/login", { replace: true });
  }
  return (
    <div className="window">
      <TitleBar />
      <div className="shell">
        <aside className="side">
          <div className="brand"><Logo  alt="" /><div><b>Aegisora</b><small>Control</small></div></div>
          <nav>
            {NAV.map((g) => (
              <div className="nav-group" key={g.group}>
                <div className="nav-title">{g.group}</div>
                {g.items.map((i) => (
                  <NavLink key={i.label} to={i.path === "" ? "/app" : `/app/${i.path}`} end={i.path === ""} className={({ isActive }) => "nav-item" + (isActive ? " active" : "")}>
                    <i.icon size={15} />
                    {i.label}
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </aside>
        <div className="main-col">
          <header className="top">
            <div className="crumbs"><Building2 size={14} />
              {memberships.length > 1 ? (
                <select value={current?.workspaceId} onChange={(e) => select(e.target.value)} aria-label="Workspace">
                  {memberships.map((m) => <option key={m.workspaceId} value={m.workspaceId}>{m.name}</option>)}
                </select>
              ) : <span>{current?.name ?? "No workspace"}</span>}
              <span className="mute">/</span><b>{page?.label ?? "Aegisora"}</b>
            </div>
            <button className="search" onClick={() => setPalette(true)}><Search size={14} /> Search pages <kbd>Ctrl K</kbd></button>
            <div className="spacer" />
            <span className="mute small-text">{session?.user.email}</span>
            <ThemeToggle /><button className="icon-btn" onClick={signOut} title="Sign out"><LogOut size={15} /></button>
          </header>
          <div className="content"><Outlet /></div>
        </div>
      </div>
      <Palette open={palette} onClose={() => setPalette(false)} />
    </div>
  );
}

export default function Shell() {
  return <WorkspaceProvider><Frame /></WorkspaceProvider>;
}
