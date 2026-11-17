import { useState } from "react";
import { bridge, readPrefs, writePrefs, type NotifyPrefs } from "../lib/notify";
import { Btn, Notice, PageHead } from "../ui/kit";

export default function Notifications() {
  const [prefs, setPrefs] = useState<NotifyPrefs>(readPrefs);
  const b = bridge();
  const desktop = Boolean(b?.notify);

  function set(p: Partial<NotifyPrefs>) {
    const next = { ...prefs, ...p };
    setPrefs(next);
    writePrefs(next);
  }

  return (
    <>
      <PageHead title="Notifications" subtitle="Desktop alerts while Aegisora is running, including in the tray." />
      {!desktop && <Notice tone="warn">Desktop notifications work only in the Aegisora desktop app.</Notice>}
      <div className="decide">
        <label className="row-btns">
          <input type="checkbox" checked={prefs.escalate} onChange={(e) => set({ escalate: e.target.checked })} />
          <span>Notify when an action needs approval (ESCALATE)</span>
        </label>
        <label className="row-btns">
          <input type="checkbox" checked={prefs.block} onChange={(e) => set({ block: e.target.checked })} />
          <span>Notify when an action is blocked (BLOCK)</span>
        </label>
        <div className="row-btns">
          <Btn
            disabled={!desktop}
            onClick={() => void b?.notify?.({ title: "Aegisora test", body: "Notifications are working.", approvalId: "test" })}
          >
            Send test notification
          </Btn>
        </div>
      </div>
    </>
  );
}