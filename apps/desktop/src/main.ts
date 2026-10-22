import { app, BrowserWindow, dialog, ipcMain, safeStorage, session, shell, type IpcMainInvokeEvent } from "electron";
import { readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { buildMenu } from "./menu";
import { parseSiteUrl } from "./site-config";
import { createSessionVault, type Cipher } from "./session-vault";
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

/**
 * OS encryption for the kept sign-in. On Linux without a keyring Electron falls back to a fixed key
 * ("basic_text"), which protects nothing, so the sign-in is not kept there.
 */
function osCipher(): Cipher | null {
  if (!safeStorage.isEncryptionAvailable()) return null;
  if (process.platform === "linux" && safeStorage.getSelectedStorageBackend() === "basic_text") return null;
  return { encrypt: (plain) => safeStorage.encryptString(plain), decrypt: (sealed) => safeStorage.decryptString(sealed) };
}
let vault: ReturnType<typeof createSessionVault>;

/** Only the top page of the connected server may read or keep its sign-in; never the setup page or a frame. */
function assertSitePage(event: IpcMainInvokeEvent): string {
  const frame = event.senderFrame;
  if (!siteUrl || !frame || frame !== window.webContents.mainFrame || frame.origin !== siteUrl) throw new Error("The sign-in is available only to the connected server's pages.");
  return siteUrl;
}

function assertConnectionPage(senderUrl: string): void {
  if (senderUrl !== connectionPageUrl) throw new Error("Connection settings are available only from the setup page.");
}

function status(): SiteStatus {
  return { siteUrl, error: connectionError };
}

async function showConnectionPage(): Promise<void> {
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    connectionPageUrl = new URL(MAIN_WINDOW_VITE_DEV_SERVER_URL).href;
    await window.loadURL(connectionPageUrl);
  } else {
    const file = path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`);
    connectionPageUrl = pathToFileURL(file).href;
    await window.loadFile(file);
  }
}

/** The Oryx web application names itself in its page; the backend API, or any other server, does not. */
async function isOryxSite(): Promise<boolean> {
  try {
    const name: unknown = await window.webContents.executeJavaScript(`document.querySelector('meta[name="application-name"]')?.getAttribute("content") ?? ""`);
    return name === "Oryx Live";
  } catch { return false; }
}

async function openSite(): Promise<void> {
  if (!siteUrl) { await showConnectionPage(); return; }
  try {
    await window.loadURL(siteUrl);
    if (await isOryxSite()) { connectionError = ""; return; }
    connectionError = "That address answered, but it is not the Oryx web application. Enter the address the Oryx web application is served from, not the backend API address.";
  } catch {
    connectionError = "The server could not be opened. Check the web application address, network, and certificate if using HTTPS.";
  }
  await showConnectionPage();
}

/** Back to the setup page, with the saved address filled in, so another server can be entered. */
function changeServer(): void {
  connectionError = "";
  void showConnectionPage();
}

/**
 * Forgets the saved server after asking. The sign-in kept for it goes too, so the next person to connect
 * starts from the sign-in page.
 */
async function forgetServer(): Promise<void> {
  const answer = await dialog.showMessageBox(window, { type: "warning", buttons: ["Cancel", "Forget Server"], defaultId: 0, cancelId: 0,
    message: `Forget ${siteUrl}?`, detail: "You will be signed out of this server and asked for a server address again. Nothing on the server is changed." });
  if (answer.response !== 1) return;
  await rm(configPath(), { force: true });
  await vault.forget();
  await session.defaultSession.clearStorageData();
  siteUrl = "";
  connectionError = "";
  refreshMenu();
  await showConnectionPage();
}

/** The pages of the connected server only: the setup page is never something to go back to. */
const onSite = () => Boolean(siteUrl) && window.webContents.getURL().startsWith(siteUrl);

function refreshMenu(): void {
  buildMenu({ siteUrl, reconnect: () => { void openSite(); }, changeServer, forgetServer: () => { void forgetServer(); },
    home: () => { void openSite(); },
    back: () => { const history = window.webContents.navigationHistory; if (onSite() && history.canGoBack()) history.goBack(); },
    forward: () => { const history = window.webContents.navigationHistory; if (onSite() && history.canGoForward()) history.goForward(); },
    print: () => { if (onSite()) window.webContents.print(); } });
}

async function createWindow(): Promise<void> {
  window = new BrowserWindow({
    width: 1366, height: 768, minWidth: 760, minHeight: 440,
    title: "Oryx Live Desktop", backgroundColor: "#151619",
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true,
    },
  });
  let closing = false;
  window.on("close", (event) => {
    if (closing) return;
    event.preventDefault();
    void vault.flush().finally(() => { closing = true; window.close(); });
  });
  // The app never opens windows of its own. A web link meant for a new window (an attachment's "Open in browser")
  // goes to the system browser instead; any other kind of address is refused.
  window.webContents.setWindowOpenHandler(({ url }) => {
    try { if (["http:", "https:"].includes(new URL(url).protocol)) void shell.openExternal(url); } catch { /* not an address */ }
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, destination) => {
    let allowed = destination === connectionPageUrl;
    try { allowed ||= Boolean(siteUrl && new URL(destination).origin === siteUrl); }
    catch { allowed = false; }
    if (!allowed) event.preventDefault();
  });
  try {
    siteUrl = parseSiteUrl((await readFile(configPath(), "utf8")).trim());
  } catch { siteUrl = ""; }
  refreshMenu();
  await openSite();
}

app.whenReady().then(async () => {
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  vault = createSessionVault(path.join(app.getPath("userData"), "session.bin"), osCipher);
  ipcMain.handle("session:load", (event): Promise<string | null> => vault.load(assertSitePage(event)));
  ipcMain.handle("session:save", (event, token: unknown): Promise<void> => {
    const origin = assertSitePage(event);
    if (token !== null && typeof token !== "string") throw new Error("Invalid sign-in.");
    return vault.save(origin, token);
  });
  ipcMain.handle("site:get-status", (event): SiteStatus => {
    assertConnectionPage(event.senderFrame?.url ?? "");
    return status();
  });
  ipcMain.handle("site:set-url", async (event, value: string): Promise<SiteStatus> => {
    assertConnectionPage(event.senderFrame?.url ?? "");
    if (typeof value !== "string") throw new Error("Invalid server address.");
    const next = parseSiteUrl(value);
    // A sign-in belongs to one server; it is not carried to another.
    if (next !== siteUrl) await vault.forget();
    siteUrl = next;
    await writeFile(configPath(), siteUrl, { mode: 0o600 });
    connectionError = "";
    refreshMenu();
    setTimeout(() => { void openSite(); }, 100);
    return status();
  });
  await createWindow();
  app.on("activate", () => { if (BrowserWindow.getAllWindows().length === 0) void createWindow(); });
}).catch((error: Error) => { console.error(error); app.quit(); });

app.on("window-all-closed", () => { if (process.platform !== "darwin") app.quit(); });

let quitting = false;
app.on("before-quit", (event) => {
  if (quitting || !vault) return;
  event.preventDefault();
  void vault.flush().finally(() => { quitting = true; app.quit(); });
});
