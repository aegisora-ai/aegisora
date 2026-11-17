const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("aegisora", {
  platform: process.platform,
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  notify: (payload) => ipcRenderer.invoke("notify", payload),
  api: (req) => ipcRenderer.invoke("api", req),
  onOpenApproval: (cb) => {
    const h = (_e, id) => cb(id);
    ipcRenderer.on("open-approval", h);
    return () => ipcRenderer.removeListener("open-approval", h);
  },
});
// --- Aegisora tema koprusu ---
{
  const { contextBridge: __cb, ipcRenderer: __ir } = require("electron");
  __cb.exposeInMainWorld("aegisoraTheme", { set: (m) => __ir.send("theme:set", String(m)) });
}