const { app, BrowserWindow, protocol, net, shell, session, ipcMain } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const DEV = process.env.MOSELL_DEV_URL;
const DIST = path.join(__dirname, "..", "dist");
const ICON = path.join(__dirname, "..", "build", "icon.png");

protocol.registerSchemesAsPrivileged([
  { scheme: "mosell", privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

if (!app.requestSingleInstanceLock()) app.quit();

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: "#0c0c0d",
    title: "Mosell",
    icon: fs.existsSync(ICON) ? ICON : undefined,
    titleBarStyle: "hidden",
    titleBarOverlay: { color: "#0c0c0d", symbolColor: "#8a8984", height: 44 },
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  win.setMenuBarVisibility(false);
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    const ok = DEV ? url.startsWith(DEV) : url.startsWith("mosell://app/");
    if (!ok) e.preventDefault();
  });
  win.loadURL(DEV || "mosell://app/index.html");
}

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, cb) => cb(false));

  protocol.handle("mosell", (req) => {
    const u = new URL(req.url);
    let rel = decodeURIComponent(u.pathname);
    if (rel === "/") rel = "/index.html";
    const file = path.normalize(path.join(DIST, rel));
    if (!file.startsWith(DIST)) return new Response("Forbidden", { status: 403 });
    const ok = fs.existsSync(file) && fs.statSync(file).isFile();
    return net.fetch(pathToFileURL(ok ? file : path.join(DIST, "index.html")).toString());
  });

  ipcMain.handle("open-external", (_e, url) => {
    try {
      const u = new URL(url);
      if (u.protocol === "https:" && (u.hostname === "aegisora.org" || u.hostname.endsWith(".aegisora.org"))) {
        return shell.openExternal(u.toString());
      }
    } catch {}
  });

  createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });