import { BrowserWindow, screen, type IpcMainEvent, type Rectangle } from "electron";
import path from "node:path";
import { panelPosition, panelSizes } from "./placement";
import type { CompanionView, PanelState } from "./contract";

/** How long a new-alert card stays up when the pointer is not over it. */
export const cardDurationMs = 8000;

/**
 * The window beside the companion: the alerts list, or a short card for a newly arrived alert.
 * It loads the companion's own local page and preload, and receives only the summary the
 * companion already has: no session, API or record access.
 */
export class CompanionPanelWindow {
  private window: BrowserWindow | null = null;
  private state: PanelState | null = null;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private hovered = false;
  private url = "";
  /** When the panel last closed; a click on the companion right after a blur-close must not reopen it. */
  hiddenAt = 0;
  /** Told whenever the panel opens or closes, so the companion can hold still meanwhile. */
  onVisible: (open: boolean) => void = () => undefined;
  constructor(private directory: string, private pageUrl: () => string) {}

  mode(): PanelState["mode"] | undefined { return this.window?.isVisible() ? this.state?.mode : undefined; }

  show(state: PanelState, anchor: Rectangle): void {
    const window = this.window ?? this.create();
    this.state = state;
    const size = panelSizes[state.mode];
    const area = screen.getDisplayMatching(anchor).workArea;
    window.setBounds({ ...panelPosition(anchor, size, area), ...size });
    this.send();
    clearTimeout(this.timer);
    this.onVisible(true);
    if (state.mode === "card") { window.showInactive(); this.schedule(); }
    else { this.shownAt = Date.now(); window.show(); window.focus(); }
  }
  /** When the list last opened: macOS can move focus once more right after a click on the companion. */
  private shownAt = 0;

  /** Refreshes the open panel's content without moving or refocusing it. */
  update(view: CompanionView): void {
    if (!this.state || !this.window?.isVisible()) return;
    if (this.state.mode === "card") {
      const alertId = this.state.alertId;
      if (!view.signedIn || !view.alerts?.some((alert) => alert.id === alertId)) { this.hide(); return; }
      this.state = { mode: "card", view, alertId };
    } else this.state = { mode: "list", view };
    this.send();
  }

  hover(value: boolean): void {
    this.hovered = value;
    if (value) clearTimeout(this.timer); else this.schedule();
  }

  hide(): void {
    clearTimeout(this.timer);
    this.hovered = false;
    if (this.window?.isVisible()) { this.window.hide(); this.hiddenAt = Date.now(); this.onVisible(false); }
  }

  /** Accepts IPC only from the panel's own top frame on its own local page. */
  trusted(event: IpcMainEvent): boolean {
    const window = this.window;
    return Boolean(window && !window.isDestroyed() && event.sender === window.webContents
      && event.senderFrame === window.webContents.mainFrame && event.senderFrame.url === this.url);
  }

  resend(): void { this.send(); }

  destroy(): void {
    clearTimeout(this.timer);
    const window = this.window;
    this.window = null;
    if (window && !window.isDestroyed()) window.destroy();
  }

  private schedule(): void {
    if (this.state?.mode !== "card") return;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => { if (!this.hovered) this.hide(); }, cardDurationMs);
  }

  private send(): void {
    if (this.state && this.window && !this.window.isDestroyed()) this.window.webContents.send("panel:state", this.state);
  }

  private create(): BrowserWindow {
    const window = new BrowserWindow({
      show: false, frame: false, transparent: true, backgroundColor: "#00000000", hasShadow: false,
      // A macOS panel takes keyboard focus without activating Oryx, so the main window is not
      // brought forward and does not take the focus straight back.
      ...(process.platform === "darwin" ? { type: "panel" } : {}),
      resizable: false, minimizable: false, maximizable: false, fullscreenable: false, skipTaskbar: true,
      alwaysOnTop: true, title: "ORYX alerts",
      webPreferences: { preload: path.join(this.directory, "companion-preload.cjs"), partition: "oryx-companion", nodeIntegration: false,
        contextIsolation: true, sandbox: true, webSecurity: true, webviewTag: false, spellcheck: false },
    });
    this.window = window;
    window.setAlwaysOnTop(true, "floating");
    window.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    window.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    window.webContents.on("will-navigate", (event) => event.preventDefault());
    window.webContents.on("will-attach-webview", (event) => event.preventDefault());
    window.webContents.on("did-finish-load", () => this.send());
    // Clicking elsewhere closes the list, but not a focus change in the first moments after opening.
    window.on("blur", () => {
      if (this.state?.mode !== "list") return;
      if (Date.now() - this.shownAt < 600) { if (!window.isDestroyed() && window.isVisible()) window.focus(); return; }
      this.hide();
    });
    window.on("closed", () => { if (this.window === window) this.window = null; });
    const page = new URL(this.pageUrl());
    page.hash = "panel";
    this.url = page.href;
    void window.loadURL(this.url).catch((error: Error) => console.error("Companion panel could not load", error));
    return window;
  }
}
