const { app, BrowserWindow, protocol, net, shell, session, ipcMain, Tray, Menu, Notification, nativeImage } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const { pathToFileURL } = require("node:url");

const DEV = process.env.AEGISORA_DEV_URL;
const DIST = path.join(__dirname, "..", "dist");
const ICON = path.join(__dirname, "..", "build", "icon.png");
const HAS_ICON = fs.existsSync(ICON);

let mainWindow = null;
let tray = null;
let quitting = false;

protocol.registerSchemesAsPrivileged([
  { scheme: "aegisora", privileges: { standard: true, secure: true, supportFetchAPI: true } },
]);

if (!app.requestSingleInstanceLock()) app.quit();
app.setAppUserModelId("org.aegisora.desktop");

function trayImage() {
  if (HAS_ICON) return nativeImage.createFromPath(ICON).resize({ width: 16, height: 16 });
  const size = 16;
  const buf = Buffer.alloc(size * size * 4);
  for (let i = 0; i < size * size; i++) {
    buf[i * 4] = 0x3b;     // B
    buf[i * 4 + 1] = 0xa8; // G
    buf[i * 4 + 2] = 0xe0; // R
    buf[i * 4 + 3] = 0xff; // A
  }
  return nativeImage.createFromBitmap(buf, { width: size, height: size });
}

function showWindow() {
  if (!mainWindow || mainWindow.isDestroyed()) { createWindow(); return; }
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

function senderAllowed(e) {
  const url = (e.senderFrame && e.senderFrame.url) || "";
  return DEV ? url.startsWith(DEV) : url.startsWith("aegisora://app/");
}

function showNotification(payload) {
  if (!payload || typeof payload !== "object") return false;
  if (!Notification.isSupported()) return false;
  const title = String(payload.title || "Aegisora").slice(0, 120);
  const body = String(payload.body || "").slice(0, 300);
  const id = typeof payload.approvalId === "string" && /^[\w-]{1,64}$/.test(payload.approvalId) ? payload.approvalId : null;
  const n = new Notification({ title, body, icon: HAS_ICON ? ICON : undefined });
  n.on("click", () => {
    showWindow();
    if (id && mainWindow && !mainWindow.isDestroyed()) mainWindow.webContents.send("open-approval", id);
  });
  n.show();
  return true;
}

function createTray() {
  tray = new Tray(trayImage());
  tray.setToolTip("Aegisora");
  const items = [
    { label: "Aegisora'yı aç", click: showWindow },
    { type: "separator" },
  ];
  if (DEV) {
    items.push({
      label: "Test bildirimi (dev)",
      click: () => showNotification({ title: "Aegisora test", body: "ESCALATE: onay bekleyen eylem var", approvalId: "test-1" }),
    });
    items.push({ type: "separator" });
  }
  items.push({ label: "Çıkış", click: () => { quitting = true; app.quit(); } });
  tray.setContextMenu(Menu.buildFromTemplate(items));
  tray.on("click", showWindow);
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: require("electron").nativeTheme.shouldUseDarkColors ? "#0c0c0d" : "#f7f7f5",
    title: "Aegisora",
    icon: HAS_ICON ? ICON : undefined,
    titleBarStyle: "hidden",
    titleBarOverlay: { color: require("electron").nativeTheme.shouldUseDarkColors ? "#0c0c0d" : "#f7f7f5", symbolColor: require("electron").nativeTheme.shouldUseDarkColors ? "#8a8984" : "#5b5b57", height: 44 },
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });
  mainWindow = win;
  win.setMenuBarVisibility(false);
  win.on("close", (e) => {
    if (!quitting) { e.preventDefault(); win.hide(); }
  });
  win.on("closed", () => { if (mainWindow === win) mainWindow = null; });
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://")) shell.openExternal(url);
    return { action: "deny" };
  });
  win.webContents.on("will-navigate", (e, url) => {
    const ok = DEV ? url.startsWith(DEV) : url.startsWith("aegisora://app/");
    if (!ok) e.preventDefault();
  });
  win.loadURL(DEV || "aegisora://app/index.html");
}

app.on("second-instance", showWindow);
app.on("before-quit", () => { quitting = true; });

app.whenReady().then(() => {
  session.defaultSession.setPermissionRequestHandler((_wc, perm, cb) => cb(perm === "clipboard-sanitized-write"));

  protocol.handle("aegisora", (req) => {
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

  ipcMain.handle("notify", (e, payload) => (senderAllowed(e) ? showNotification(payload) : false));

  ipcMain.handle("api", async (e, req) => {
    const fail = (message) => ({ ok: false, status: 0, data: { error: { code: "blocked", message } } });
    if (!senderAllowed(e) || !req || typeof req !== "object") return fail("Request blocked.");
    const method = String(req.method || "GET").toUpperCase();
    const p = typeof req.path === "string" ? req.path : "";
    if (!["GET", "POST", "PATCH", "DELETE"].includes(method)) return fail("Method not allowed.");
    if (!/^\/api\/v1\/[A-Za-z0-9_\-\/]{1,200}$/.test(p) || p.includes("..")) return fail("Path not allowed.");
    if (typeof req.token !== "string" || !/^[A-Za-z0-9_\-.]{20,4096}$/.test(req.token)) return fail("Not signed in.");
    const headers = { Accept: "application/json", Authorization: "Bearer " + req.token };
    if (typeof req.workspaceId === "string" && /^[0-9a-f-]{36}$/i.test(req.workspaceId)) headers["X-Workspace-Id"] = req.workspaceId;
    let body;
    if (req.body !== undefined && method !== "GET") {
      body = JSON.stringify(req.body);
      if (body.length > 64000) return fail("Request too large.");
      headers["Content-Type"] = "application/json";
    }
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 15000);
    try {
      const r = await net.fetch("https://aegisora.org" + p, { method, headers, body, signal: ctrl.signal, redirect: "error" });
      let data = null;
      try { data = await r.json(); } catch {}
      return { ok: r.ok, status: r.status, data };
    } catch {
      return { ok: false, status: 0, data: { error: { code: "network", message: "Could not reach Aegisora." } } };
    } finally {
      clearTimeout(timer);
    }
  });

  createWindow();
  createTray();
  app.on("activate", showWindow);
});
// --- Aegisora tema IPC ---
{
  const { ipcMain: __ipc, nativeTheme: __nt, BrowserWindow: __BW } = require("electron");
  __ipc.on("theme:set", (_e, mode) => {
    const m = mode === "light" ? "light" : mode === "dark" ? "dark" : "system";
    __nt.themeSource = m;
    const dark = __nt.shouldUseDarkColors;
    for (const w of __BW.getAllWindows()) {
      try {
        w.setBackgroundColor(dark ? "#0c0c0d" : "#f7f7f5");
        w.setTitleBarOverlay({ color: dark ? "#0c0c0d" : "#f7f7f5", symbolColor: dark ? "#8a8984" : "#5b5b57", height: 44 });
      } catch { /* ignore */ }
    }
  });
}