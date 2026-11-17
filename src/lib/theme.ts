import { useSyncExternalStore } from "react";

export type ThemePref = "system" | "light" | "dark";
const KEY = "aegisora.theme";
const listeners = new Set<() => void>();
const mq = window.matchMedia("(prefers-color-scheme: dark)");

function readPref(): ThemePref {
  try {
    const v = localStorage.getItem(KEY);
    if (v === "light" || v === "dark" || v === "system") return v;
  } catch { /* ignore */ }
  return "system";
}

let pref: ThemePref = readPref();
function resolve(p: ThemePref): "light" | "dark" {
  return p === "system" ? (mq.matches ? "dark" : "light") : p;
}
let resolved: "light" | "dark" = resolve(pref);

function apply() {
  resolved = resolve(pref);
  document.documentElement.setAttribute("data-theme", resolved);
  try {
    (window as unknown as { aegisoraTheme?: { set: (m: string) => void } }).aegisoraTheme?.set(pref);
  } catch { /* ignore */ }
  listeners.forEach((l) => l());
}

mq.addEventListener("change", () => { if (pref === "system") apply(); });

export function setThemePref(p: ThemePref) {
  pref = p;
  try { localStorage.setItem(KEY, p); } catch { /* ignore */ }
  apply();
}

export function useTheme() {
  const snap = useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => { listeners.delete(cb); }; },
    () => pref + "|" + resolved,
  );
  const [p, r] = snap.split("|");
  return { pref: p as ThemePref, resolved: r as "light" | "dark" };
}

apply();