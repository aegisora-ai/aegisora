export type NotifyPrefs = { escalate: boolean; block: boolean };
const KEY = "aegisora.notify";

export function readPrefs(): NotifyPrefs {
  try {
    const v = JSON.parse(localStorage.getItem(KEY) || "{}");
    return { escalate: v.escalate !== false, block: v.block !== false };
  } catch {
    return { escalate: true, block: true };
  }
}

export function writePrefs(p: NotifyPrefs) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch {}
}

type Bridge = {
  notify?: (p: { title: string; body: string; approvalId?: string }) => Promise<boolean>;
  onOpenApproval?: (cb: (id: string) => void) => () => void;
};

export function bridge(): Bridge | undefined {
  return (window as unknown as { aegisora?: Bridge }).aegisora;
}