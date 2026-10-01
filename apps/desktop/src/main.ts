import { app, BrowserWindow, ipcMain, session } from "electron";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { parseSiteUrl } from "./site-config";
import type { SiteStatus } from "./bridge";

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string;
declare const MAIN_WINDOW_VITE_NAME: string;

let window: BrowserWindow;
let connectionPageUrl = "";
let siteUrl = "";
let connectionError = "";

function configPath(): string {
  return path.join(app.getPath("userData"), "site-url.txt");
}

function assertConnectionPage(senderUrl: string): void {
  if (senderUrl !== connectionPageUrl) throw new Error("Connection settings are available only from the setup page.");
}

function status(): SiteStatus {
  return { siteUrl, error: connectionError };
}

async function showConnectionPage(): Promise<void> {
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    connectionPageUrl = MAIN_WINDOW_VITE_DEV_SERVER_URL;
    await window.loadURL(connectionPageUrl);
  } else {
    const file = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
    connectionPageUrl = pathToFileURL(file).href;
    await window.loadFile(file);
  }
}

async function openSite(): Promise<void> {
  if (!siteUrl) { await showConnectionPage(); return; }
  try {
    await window.loadURL(siteUrl);
    connectionError = "";
  } catch {
    connectionError = "The server could not be opened. Check the address, network, and trusted certificate.";
    await showConnectionPage();
  }
}

async function createWindow(): Promise<void> {
  window = new BrowserWindow({
    width: 1366, height: 768, minWidth: 760, minHeight: 440,
    title: "Oryx Live Desktop", backgroundColor: "#151619",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true,
    },
  });
  window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
  window.webContents.on("will-navigate", (event, destination) => {
    let allowed = destination === connectionPageUrl;
    try { allowed ||= Boolean(siteUrl && new URL(destination).origin === siteUrl); }
    catch { allowed = false; }
    if (!allowed) event.preventDefault();
  });
  try {
    siteUrl = parseSiteUrl((await readFile(configPath(), "utf8")).trim(), !app.isPackaged);
  } catch { siteUrl = ""; }
  await openSite();
}

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  ipcMain.handle("site:get-status", (event): SiteStatus => {
    assertConnectionPage(event.senderFrame?.url ?? "");
    return status();
  });
  ipcMain.handle("site:set-url", async (event, value: string): Promise<SiteStatus> => {
    assertConnectionPage(event.senderFrame?.url ?? "");
    if (typeof value !== "string") throw new Error("Invalid server address.");
    siteUrl = parseSiteUrl(value, !app.isPackaged);
    await writeFile(configPath(), siteUrl, { mode: 0o600 });
    connectionError = "";
    setTimeout(() => { void openSite(); }, 100);
    return status();
  });
  await createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) void createWindow(); });
}).catch((error: Error) => { console.error(error); app.quit(); });

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });
