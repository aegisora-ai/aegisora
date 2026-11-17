import { Monitor, Moon, Sun } from "lucide-react";
import { setThemePref, useTheme } from "../lib/theme";
import type { ThemePref } from "../lib/theme";

const order: ThemePref[] = ["system", "light", "dark"];
const label: Record<ThemePref, string> = { system: "Theme: System", light: "Theme: Light", dark: "Theme: Dark" };

export default function ThemeToggle() {
  const { pref } = useTheme();
  const next = order[(order.indexOf(pref) + 1) % order.length];
  const Icon = pref === "light" ? Sun : pref === "dark" ? Moon : Monitor;
  return (
    <button className="icon-btn" onClick={() => setThemePref(next)} title={label[pref] + " (click to change)"}>
      <Icon size={15} />
    </button>
  );
}