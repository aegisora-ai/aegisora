const { contextBridge, ipcRenderer } = require("electron");
contextBridge.exposeInMainWorld("mosell", {
  platform: process.platform,
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
});