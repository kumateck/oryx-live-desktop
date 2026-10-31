import { app, BrowserWindow, ipcMain, Menu, screen, Tray, nativeImage, type IpcMainEvent, type IpcMainInvokeEvent } from "electron";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { clampPlacement, windowSize, validSummary, type Point } from "./placement";
import { CompanionPanelWindow } from "./panel-window";
import { SystemAlerts, validSystemAlert } from "./system-alerts";
import { CompanionPreferenceStore } from "./preferences";
import { AlertPriority, CompanionCommand, type CompanionAlert, type CompanionPreferences, type CompanionView } from "./contract";

declare const COMPANION_WINDOW_VITE_DEV_SERVER_URL: string;
declare const COMPANION_WINDOW_VITE_NAME: string;

/** Dodo's isolated transparent-window pattern, restricted to local summary-only presentation. */
export class CompanionRuntime {
  private preferences = new CompanionPreferenceStore(path.join(app.getPath("userData"), "companion-preferences.json"));
  private systemAlerts: SystemAlerts;
  private pet: BrowserWindow | null = null;
  private enabled = true;
  private tray: Tray | null = null;
  private roaming = true;
  private quiet = false;
  private state: CompanionView = { unread: 0, connected: false, signedIn: false, focused: false, quiet: false, roaming: true };
  private panel: CompanionPanelWindow;
  /** Alert IDs already seen this sign-in; null until the first summary sets the baseline. */
  private known: Set<string> | null = null;
  private drag: { pointer: Point; origin: Point } | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  /**
   * Watches the pointer over the companion. macOS forwards mouse movement to a click-through
   * window only while Oryx is the active app, so after the alerts panel closes (or while you work
   * in another app) the companion would never learn the pointer is over it and clicks would fall
   * through. Checking the cursor here works whatever app is active.
   */
  private pointerTimer: ReturnType<typeof setInterval> | null = null;
  private pointerInside = false;
  private trackPointer(): void {
    if (this.pointerTimer) return;
    this.pointerTimer = setInterval(() => {
      const pet = this.pet;
      if (!pet || pet.isDestroyed() || this.drag) return;
      const cursor = screen.getCursorScreenPoint(), bounds = pet.getBounds();
      const inside = cursor.x >= bounds.x && cursor.x < bounds.x + bounds.width && cursor.y >= bounds.y && cursor.y < bounds.y + bounds.height;
      if (inside) pet.webContents.send("pet:pointer", { x: cursor.x - bounds.x, y: cursor.y - bounds.y });
      else if (this.pointerInside) pet.webContents.send("pet:pointer", { x: -1, y: -1 });
      this.pointerInside = inside;
    }, 50);
  }
  private localUrl = "";
  private saved = "";
  private position: Point | null = null;
  constructor(private owner: BrowserWindow, private directory: string, private siteOrigin: () => string) {
    this.systemAlerts = new SystemAlerts(owner);
    this.panel = new CompanionPanelWindow(directory, () => this.localUrl);
    this.panel.onVisible = (open) => this.update({ panelOpen: open });
  }
  async start(): Promise<void> {
    this.saved = path.join(app.getPath("userData"), "companion-hidden.txt");
    try { this.enabled = (await readFile(this.saved, "utf8")) !== "hidden"; } catch { /* default visible */ }
    try {
      const values = (await readFile(path.join(app.getPath("userData"), "companion-position.txt"), "utf8")).split(",").map(Number);
      const x = values[0], y = values[1];
      if (x !== undefined && y !== undefined && Number.isFinite(x) && Number.isFinite(y)) this.position = { x, y };
    } catch { /* first launch */ }
    const icon = nativeImage.createFromPath(path.join(app.getAppPath(), "build/icon.png"));
    if (!icon.isEmpty()) {
      this.tray = new Tray(icon.resize({ width: 20, height: 20 }));
      this.tray.setToolTip("Oryx Live — running in the background");
      this.tray.setContextMenu(Menu.buildFromTemplate([
        { label: "Open Oryx", click: () => { this.owner.show(); this.owner.focus(); } },
        { label: "Show / Hide companion", click: this.toggle },
        { type: "separator" }, { label: "Quit Oryx", click: () => app.quit() },
      ]));
      this.tray.on("click", () => { this.owner.show(); this.owner.focus(); });
    }
    const preferences = await this.preferences.load(this.enabled);
    this.enabled = preferences.visible; this.quiet = preferences.quiet; this.roaming = preferences.roaming;
    this.installIpc();
    this.owner.on("focus", () => this.update({ focused: true }));
    this.owner.on("blur", () => this.update({ focused: false }));
    this.owner.webContents.on("did-start-navigation", (_event, _url, _inPlace, mainFrame) => {
      if (mainFrame && !_inPlace) this.reset();
    });
    this.owner.on("closed", () => this.dispose());
    screen.on("display-removed", this.place);
    screen.on("display-metrics-changed", this.place);
    if (this.enabled) await this.show();
  }
  canRunInBackground(): boolean { return this.tray !== null; }
  reset(): void { this.systemAlerts.clear(); this.known = null; this.update({ unread: 0, signedIn: false, connected: false, alerts: [] }); }
  toggle = (): void => { void this.change(this.enabled ? CompanionCommand.Hide : CompanionCommand.Show).catch(console.error); };
  private async change(command: CompanionCommand): Promise<CompanionPreferences> {
    const next = await this.preferences.change(command);
    this.enabled = next.visible; this.quiet = next.quiet; this.roaming = next.roaming;
    if (command === CompanionCommand.ResetPosition) {
      this.position = null; this.place();
      const bounds = this.pet?.getBounds();
      if (bounds) await writeFile(path.join(app.getPath("userData"), "companion-position.txt"), `${bounds.x},${bounds.y}`, { mode: 0o600 });
    }
    if (this.enabled) await this.show(); else this.hide();
    this.update({});
    return next;
  }
  private update(change: Partial<CompanionView>): void {
    const preferences = this.preferences.current();
    this.state = { ...this.state, ...change, quiet: this.quiet, roaming: this.roaming, showIndicators: preferences.showIndicators, size: preferences.size ?? "medium" };
    if (this.pet) {
      const size = this.side();
      const bounds = this.pet.getBounds();
      if (bounds.width !== size || bounds.height !== size) {
        // Grow or shrink around the companion's feet so it does not jump on screen.
        const point = { x: bounds.x + Math.round((bounds.width - size) / 2), y: bounds.y + bounds.height - size };
        this.pet.setBounds({ ...clampPlacement(point, screen.getDisplayNearestPoint(bounds).workArea, size), width: size, height: size });
      }
    }
    this.pet?.webContents.send("pet:view", this.state);
    this.panel.update(this.state);
  }
  private side(): number { return windowSize(this.preferences.current().size ?? "medium"); }
  private anchor() { return this.pet?.getBounds() ?? null; }
  private openList(): void {
    const anchor = this.anchor();
    if (anchor) this.panel.show({ mode: "list", view: this.state }, anchor);
  }
  /** One card per batch of arrivals: the most important new alert, so a burst never stacks cards. */
  private announce(fresh: CompanionAlert[]): void {
    const anchor = this.anchor();
    if (!anchor || !fresh.length || !this.preferences.current().showIndicators || this.panel.mode() === "list") return;
    const first = fresh.reduce((best, alert) => alert.priority > best.priority ? alert : best, fresh[0] ?? { priority: AlertPriority.Unspecified } as CompanionAlert);
    if (first.id) this.panel.show({ mode: "card", view: this.state, alertId: first.id }, anchor);
  }
  private openAlert(id?: string): void {
    this.panel.hide();
    this.owner.show(); this.owner.focus();
    const alert = this.state.alerts?.find((item) => item.id === id);
    this.owner.webContents.send("companion:open", { id: alert?.id, direct: Boolean(alert), shipmentDocumentId: alert?.shipmentDocumentId, type: alert?.type });
  }
  private trusted(event: IpcMainEvent): boolean {
    return Boolean(this.pet && event.sender === this.pet.webContents && event.senderFrame === this.pet.webContents.mainFrame && event.senderFrame.url === this.localUrl);
  }
  private assertOwner(event: IpcMainInvokeEvent): void {
    const frame = event.senderFrame;
    if (event.sender !== this.owner.webContents || frame !== this.owner.webContents.mainFrame || !frame || !this.siteOrigin() || frame.origin !== this.siteOrigin()) throw new Error("Untrusted companion settings.");
  }
  private installIpc(): void {
    ipcMain.handle("companion:settings", (event) => { this.assertOwner(event); return this.preferences.current(); });
    ipcMain.handle("companion:command", (event, command: CompanionCommand) => {
      this.assertOwner(event);
      if (!Number.isInteger(command) || command < CompanionCommand.Show || command > CompanionCommand.SizeLarge) throw new Error("Invalid companion command.");
      return this.change(command);
    });
    ipcMain.handle("companion:notify", (event: IpcMainInvokeEvent, value: object): boolean => {
      const frame = event.senderFrame;
      if (event.sender !== this.owner.webContents || frame !== this.owner.webContents.mainFrame || !frame || !this.siteOrigin() || frame.origin !== this.siteOrigin()) throw new Error("Untrusted system alert.");
      if (!value || typeof value !== "object" || !validSystemAlert(value)) throw new Error("Invalid system alert.");
      return this.systemAlerts.show({ title: value.title, body: value.body, ...(value.id ? { id: value.id } : {}) });
    });
    ipcMain.handle("companion:summary", (event: IpcMainInvokeEvent, value: object) => {
      const frame = event.senderFrame;
      if (event.sender !== this.owner.webContents || frame !== this.owner.webContents.mainFrame || !frame || !this.siteOrigin() || frame.origin !== this.siteOrigin()) throw new Error("Untrusted companion summary.");
      if (!value || typeof value !== "object" || !validSummary(value)) throw new Error("Invalid companion summary.");
      // An open list stays and shows the signed-out state, so a brief sign-out during a reload does not close it.
      if (!value.signedIn) { this.systemAlerts.clear(); this.known = null; }
      const alerts = value.signedIn ? value.alerts ?? [] : [];
      const fresh = this.known ? alerts.filter((alert) => !this.known?.has(alert.id)) : [];
      if (value.signedIn) this.known = new Set(alerts.map((alert) => alert.id));
      this.update(value.signedIn ? { unread: value.unread, connected: value.connected, signedIn: true, alerts } : { unread: 0, connected: false, signedIn: false, alerts: [] });
      this.announce(fresh);
    });
    ipcMain.on("pet:ready", (event) => { if (this.trusted(event)) this.update({}); });
    ipcMain.on("pet:interactive", (event, value: boolean) => {
      if (this.trusted(event) && typeof value === "boolean" && !this.drag) this.pet?.setIgnoreMouseEvents(!value, { forward: true });
    });
    // A click on the companion toggles the list; main decides from the panel's real state, so the
    // companion's copy of it can never be out of step. false always closes.
    ipcMain.on("pet:panel", (event, open: boolean) => {
      if (!this.trusted(event) || typeof open !== "boolean") return;
      if (!open || this.panel.mode() === "list") this.panel.hide();
      else if (Date.now() - this.panel.hiddenAt > 300) this.openList();
    });
    ipcMain.on("panel:ready", (event) => { if (this.panel.trusted(event)) this.panel.resend(); });
    ipcMain.on("panel:open", (event, id?: string) => {
      if (!this.panel.trusted(event) || (id !== undefined && (typeof id !== "string" || id.length > 100))) return;
      this.openAlert(id);
    });
    ipcMain.on("panel:expand", (event) => { if (this.panel.trusted(event)) this.openList(); });
    ipcMain.on("panel:hover", (event, value: boolean) => { if (this.panel.trusted(event) && typeof value === "boolean") this.panel.hover(value); });
    ipcMain.on("panel:close", (event) => { if (this.panel.trusted(event)) this.panel.hide(); });
    ipcMain.on("pet:drag", (event, action: string) => {
      if (!this.trusted(event)) return;
      if (action === "start" && this.pet) {
        const bounds = this.pet.getBounds();
        this.dragStarted = Date.now();
        this.drag = { pointer: screen.getCursorScreenPoint(), origin: { x: bounds.x, y: bounds.y } };
        this.panel.hide();
        this.pet.setIgnoreMouseEvents(false);
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => this.move(), 16);
      } else if (action === "end") this.endDrag();
    });
    ipcMain.on("pet:open", (event, request: { id?: string; direct?: boolean } = {}) => {
      if (!this.trusted(event)) return;
      this.openAlert(request?.direct === true && typeof request.id === "string" ? request.id : undefined);
    });
    ipcMain.on("pet:menu", (event) => {
      if (!this.trusted(event)) return;
      const run = (...commands: CompanionCommand[]) => () => { void commands.reduce((done, command) => done.then(() => this.change(command)), Promise.resolve(this.preferences.current())).catch(console.error); };
      const size = this.preferences.current().size ?? "medium";
      const movement = this.quiet ? "still" : this.roaming ? "playful" : "subtle";
      Menu.buildFromTemplate([
        { label: "Show alerts", click: () => this.openList() },
        { label: "Open Oryx", click: () => { this.owner.show(); this.owner.focus(); } },
        { type: "separator" },
        { label: "Size", submenu: [
          { label: "Small", type: "radio", checked: size === "small", click: run(CompanionCommand.SizeSmall) },
          { label: "Medium", type: "radio", checked: size === "medium", click: run(CompanionCommand.SizeMedium) },
          { label: "Large", type: "radio", checked: size === "large", click: run(CompanionCommand.SizeLarge) },
        ] },
        { label: "Movement", submenu: [
          { label: "Still", type: "radio", checked: movement === "still", click: run(CompanionCommand.QuietOn) },
          { label: "Subtle", type: "radio", checked: movement === "subtle", click: run(CompanionCommand.QuietOff, CompanionCommand.RoamingOff) },
          { label: "Playful", type: "radio", checked: movement === "playful", click: run(CompanionCommand.QuietOff, CompanionCommand.RoamingOn) },
        ] },
        { label: "New alert cards", type: "checkbox", checked: this.preferences.current().showIndicators, click: run(this.preferences.current().showIndicators ? CompanionCommand.IndicatorsOff : CompanionCommand.IndicatorsOn) },
        { label: "Reset position", click: run(CompanionCommand.ResetPosition) },
        { type: "separator" },
        { label: "Hide companion", click: this.toggle },
      ]).popup({ window: this.pet ?? this.owner });
    });
  }
  private move(): void {
    if (!this.drag || !this.pet) return;
    const cursor = screen.getCursorScreenPoint();
    const point = { x: this.drag.origin.x + cursor.x - this.drag.pointer.x, y: this.drag.origin.y + cursor.y - this.drag.pointer.y };
    const display = screen.getDisplayNearestPoint(cursor);
    this.pet.setPosition(...this.coordinates(clampPlacement(point, display.workArea, this.pet.getBounds().height)));
    if (Date.now() - this.dragStarted > 15000) this.endDrag();
  }
  private dragStarted = 0;
  private coordinates(point: Point): [number, number] { return [point.x, point.y]; }
  private endDrag(): void {
    if (this.drag && this.pet) {
      const bounds = this.pet.getBounds();
      this.position = { x: bounds.x, y: bounds.y };
      void writeFile(path.join(app.getPath("userData"), "companion-position.txt"), `${bounds.x},${bounds.y}`, { mode: 0o600 }).catch(console.error);
    }
    this.drag = null;
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.pet?.setIgnoreMouseEvents(true, { forward: true });
  }
  private place = (): void => {
    const area = this.position ? screen.getDisplayNearestPoint(this.position).workArea : screen.getPrimaryDisplay().workArea;
    const size = this.side();
    const point = this.position ?? { x: area.x + area.width - size - 20, y: area.y + area.height - size };
    this.pet?.setPosition(...this.coordinates(clampPlacement(point, area, size)));
  };
  private async show(): Promise<void> {
    if (this.pet) { this.pet.showInactive(); return; }
    const pet = new BrowserWindow({ width: this.side(), height: this.side(), show: false, frame: false, transparent: true,
      backgroundColor: "#00000000", hasShadow: false, resizable: false, minimizable: false, maximizable: false,
      fullscreenable: false, focusable: false, skipTaskbar: true, title: "ORYX Companion",
      webPreferences: { preload: path.join(this.directory, "companion-preload.cjs"), partition: "oryx-companion", nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true, webviewTag: false },
    });
    this.pet = pet;
    pet.setAlwaysOnTop(true, "floating");
    pet.setIgnoreMouseEvents(true, { forward: true });
    pet.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
    pet.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
    pet.webContents.on("will-navigate", (event) => event.preventDefault());
    pet.webContents.on("will-attach-webview", (event) => event.preventDefault());
    this.localUrl = COMPANION_WINDOW_VITE_DEV_SERVER_URL || pathToFileURL(path.join(this.directory, `../renderer/${COMPANION_WINDOW_VITE_NAME}/index.html`)).href;
    pet.on("closed", () => { if (this.pet === pet) this.pet = null; });
    this.trackPointer();
    try { await pet.loadURL(this.localUrl); this.place(); pet.showInactive(); this.update({}); }
    catch (error) { console.error("Companion could not load", error); this.hide(); }
  }
  private hide(): void {
    this.endDrag(); this.panel.hide();
    if (this.pointerTimer) clearInterval(this.pointerTimer);
    this.pointerTimer = null; this.pointerInside = false;
    this.pet?.destroy(); this.pet = null;
  }
  private dispose(): void {
    this.hide();
    this.panel.destroy();
    this.systemAlerts.clear();
    this.tray?.destroy(); this.tray = null;
    screen.removeListener("display-removed", this.place);
    screen.removeListener("display-metrics-changed", this.place);
    ipcMain.removeHandler("companion:settings");
    ipcMain.removeHandler("companion:command");
    ipcMain.removeHandler("companion:summary");
    ipcMain.removeHandler("companion:notify");
    for (const channel of ["pet:ready", "pet:interactive", "pet:panel", "pet:drag", "pet:open", "pet:menu", "panel:ready", "panel:open", "panel:expand", "panel:hover", "panel:close"]) ipcMain.removeAllListeners(channel);
  }
}
