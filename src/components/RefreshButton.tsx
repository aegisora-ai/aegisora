import { useRef, useState } from "react";
import type { ReactNode } from "react";

export default function RefreshButton({ onReload, icon }: { onReload: () => unknown; icon: ReactNode }) {
  const [spin, setSpin] = useState(false);
  const busy = useRef(false);
  async function click() {
    if (busy.current) return;
    busy.current = true;
    setSpin(true);
    try {
      await Promise.all([Promise.resolve(onReload()), new Promise((r) => setTimeout(r, 700))]);
    } catch { /* ignore */ }
    finally { busy.current = false; setSpin(false); }
  }
  return (
    <button className={"icon-btn sm" + (spin ? " spinning" : "")} onClick={() => void click()} title="Refresh" aria-busy={spin}>
      {icon}
    </button>
  );
}