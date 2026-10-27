import { app, BrowserWindow, ipcMain, type IpcMainInvokeEvent } from "electron";
import { spawn } from "node:child_process";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import type { DesktopUpdateState } from "../../../../shared/desktop-updates";
import { DesktopUpdater } from "./controller";

declare const UPDATE_WINDOW_VITE_DEV_SERVER_URL: string;
declare const UPDATE_WINDOW_VITE_NAME: string;
declare const ORYX_DESKTOP_UPDATE_PUBLIC_KEY: string;
interface Callbacks { site: () => string; connection: () => string; beforeInstall: () => Promise<boolean>; quit: () => void }
export class DesktopUpdateRuntime {
  readonly updater: DesktopUpdater;
  private panel: BrowserWindow | null = null;
  private panelUrl = "";
  private timer: ReturnType<typeof setInterval>;
  constructor(private owner: BrowserWindow, private directory: string, private callbacks: Callbacks) {
    this.updater = new DesktopUpdater({ version: app.getVersion(), arch: process.arch === "ia32" ? "ia32" : "x64", publicKey: ORYX_DESKTOP_UPDATE_PUBLIC_KEY, cache: join(app.getPath("userData"), "desktop-updates"),
      supported: process.platform === "win32" && ["ia32", "x64"].includes(process.arch), changed: (state) => this.changed(state), prompt: () => { void this.open().catch((error: Error) => console.error(error.message)); },
      beforeInstall: () => this.callbacks.beforeInstall(),
      install: async (file) => {
        await new Promise<void>((resolve, reject) => {
          // Standard electron-builder NSIS switches: replace the per-user install and reopen afterwards.
          const child = spawn(file, ["--updated", "/S", "--force-run"], { detached: true, stdio: "ignore", shell: false });
          child.once("error", reject); child.once("spawn", () => { child.unref(); resolve(); });
        });
        this.panel?.destroy();
        this.callbacks.quit();
      },
    });
    ipcMain.handle("updates:status", (event) => { this.assertCaller(event); return this.updater.state; });
    ipcMain.handle("updates:open", async (event) => { this.assertCaller(event); await this.open(); });
    ipcMain.handle("updates:action", async (event, action: string) => {
      this.assertPanel(event);
      switch (action) {
        case "check": await this.updater.check(); break;
        case "download": await this.updater.download(); break;
        case "cancel": this.updater.cancel(); break;
        case "install": await this.updater.install(); break;
        case "later": this.updater.remindLater(); this.panel?.close(); break;
        default: throw new Error("Unsupported update action");
      }
    });
    this.timer = setInterval(() => { void this.updater.check(); }, 30 * 60_000);
    this.owner.once("closed", () => {
      clearInterval(this.timer); this.updater.cancel(); this.panel?.destroy();
      for (const channel of ["updates:status", "updates:open", "updates:action"]) ipcMain.removeHandler(channel);
    });
  }
  private assertPanel(event: IpcMainInvokeEvent): void {
    if (!this.panel || event.sender !== this.panel.webContents || !event.senderFrame || event.senderFrame !== event.sender.mainFrame || event.senderFrame.url !== this.panelUrl) throw new Error("Untrusted installer action");
  }
  private assertCaller(event: IpcMainInvokeEvent): void {
    if (this.panel && event.sender === this.panel.webContents) { this.assertPanel(event); return; }
    const frame = event.senderFrame;
    if (event.sender !== this.owner.webContents || !frame || frame !== this.owner.webContents.mainFrame || (frame.url !== this.callbacks.connection() && (!this.callbacks.site() || frame.origin !== this.callbacks.site()))) throw new Error("Untrusted update request");
  }
  private changed(state: DesktopUpdateState): void {
    if (!this.owner.isDestroyed()) this.owner.webContents.send("updates:status", state);
    if (this.panel && !this.panel.isDestroyed()) this.panel.webContents.send("updates:status", state);
  }
  connect(origin: string): void { this.updater.connect(origin); }
  async minimumForSite(): Promise<string | null> { return this.updater.minimumForSite(); }
  async open(): Promise<void> {
    if (this.panel && !this.panel.isDestroyed()) { this.panel.show(); this.panel.focus(); return; }
    const panel = new BrowserWindow({ parent: this.owner, modal: true, width: 480, height: 390, minWidth: 360, minHeight: 300, show: false, resizable: true, title: "Oryx updates",
      webPreferences: { preload: join(this.directory, "update-preload.cjs"), nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true },
    });
    this.panel = panel;
    panel.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    panel.webContents.on("will-navigate", (event) => event.preventDefault());
    panel.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    panel.on("close", (event) => { if (this.updater.state.phase === "installing") event.preventDefault(); else this.updater.remindLater(); });
    panel.once("closed", () => { if (this.panel === panel) this.panel = null; });
    this.panelUrl = UPDATE_WINDOW_VITE_DEV_SERVER_URL || pathToFileURL(join(this.directory, `../renderer/${UPDATE_WINDOW_VITE_NAME}/index.html`)).href;
    await panel.loadURL(this.panelUrl);
    panel.show();
    if (["idle", "error", "current"].includes(this.updater.state.phase)) void this.updater.check();
  }
}
