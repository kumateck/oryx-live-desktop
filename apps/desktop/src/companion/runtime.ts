import { app, BrowserWindow, ipcMain, Menu, screen, Tray, nativeImage, type IpcMainEvent, type IpcMainInvokeEvent } from "electron";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { clampPlacement, companionSize, companionHeight, companionPanelHeight, validSummary, type Point } from "./placement";
import { SystemAlerts, validSystemAlert } from "./system-alerts";
import { CompanionPreferenceStore } from "./preferences";
import { CompanionCommand, type CompanionPreferences, type CompanionView } from "./contract";

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
  private drag: { pointer: Point; origin: Point } | null = null;
  private timer: ReturnType<typeof setInterval> | null = null;
  private localUrl = "";
  private saved = "";
  private position: Point | null = null;
  constructor(private owner: BrowserWindow, private directory: string, private siteOrigin: () => string) { this.systemAlerts = new SystemAlerts(owner); }
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
  reset(): void { this.systemAlerts.clear(); this.update({ unread: 0, signedIn: false, connected: false, alerts: [] }); }
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
    this.pet?.setSize(companionSize, next.showIndicators ? companionSize + companionPanelHeight(this.state.alerts?.length ?? 0) : companionSize);
    if (this.pet) { const bounds = this.pet.getBounds(); const area = screen.getDisplayNearestPoint(bounds).workArea; this.pet.setPosition(...this.coordinates(clampPlacement(bounds, area, bounds.height))); }
    this.update({});
    return next;
  }
  private update(change: Partial<CompanionView>): void {
    this.state = { ...this.state, ...change, quiet: this.quiet, roaming: this.roaming, showIndicators: this.preferences.current().showIndicators };
    if (this.pet) {
      const height = this.state.showIndicators ? companionSize + companionPanelHeight(this.state.alerts?.length ?? 0) : companionSize;
      this.pet.setSize(companionSize, height);
      const bounds = this.pet.getBounds(); const area = screen.getDisplayNearestPoint(bounds).workArea;
      this.pet.setPosition(...this.coordinates(clampPlacement(bounds, area, height)));
    }
    this.pet?.webContents.send("pet:view", this.state);
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
      if (!Number.isInteger(command) || command < CompanionCommand.Show || command > CompanionCommand.IndicatorsOff) throw new Error("Invalid companion command.");
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
      if (!value.signedIn) this.systemAlerts.clear();
      this.update(value.signedIn ? { unread: value.unread, connected: value.connected, signedIn: true, alerts: value.alerts ?? [] } : { unread: 0, connected: false, signedIn: false, alerts: [] });
    });
    ipcMain.on("pet:ready", (event) => { if (this.trusted(event)) this.update({}); });
    ipcMain.on("pet:interactive", (event, value: boolean) => {
      if (this.trusted(event) && typeof value === "boolean" && !this.drag) this.pet?.setIgnoreMouseEvents(!value, { forward: true });
    });
    ipcMain.on("pet:drag", (event, action: string) => {
      if (!this.trusted(event)) return;
      if (action === "start" && this.pet) {
        const bounds = this.pet.getBounds();
        this.dragStarted = Date.now();
        this.drag = { pointer: screen.getCursorScreenPoint(), origin: { x: bounds.x, y: bounds.y } };
        this.pet.setIgnoreMouseEvents(false);
        if (this.timer) clearInterval(this.timer);
        this.timer = setInterval(() => this.move(), 16);
      } else if (action === "end") this.endDrag();
    });
    ipcMain.on("pet:open", (event, request: { id?: string; direct?: boolean } = {}) => {
      if (!this.trusted(event)) return;
      this.owner.show(); this.owner.focus();
      const alert = this.state.alerts?.find((item) => item.id === request.id);
      this.owner.webContents.send("companion:open", { id: alert?.id, direct: request.direct === true && Boolean(alert), shipmentDocumentId: alert?.shipmentDocumentId, type: alert?.type });
    });
    ipcMain.on("pet:menu", (event) => {
      if (!this.trusted(event)) return;
      Menu.buildFromTemplate([
        { label: "Open Oryx", click: () => { this.owner.show(); this.owner.focus(); } },
        { label: "Quiet mode", type: "checkbox", checked: this.quiet, click: () => { void this.change(this.quiet ? CompanionCommand.QuietOff : CompanionCommand.QuietOn).catch(console.error); } },
        { label: "Limited roaming", type: "checkbox", checked: this.roaming, click: () => { void this.change(this.roaming ? CompanionCommand.RoamingOff : CompanionCommand.RoamingOn).catch(console.error); } },
        { label: "Reset position", click: () => { void this.change(CompanionCommand.ResetPosition).catch(console.error); } },
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
    const height = this.preferences.current().showIndicators ? companionSize + companionPanelHeight(this.state.alerts?.length ?? 0) : companionSize;
    const point = this.position ?? { x: area.x + area.width - companionSize - 20, y: area.y + area.height - height };
    this.pet?.setPosition(...this.coordinates(clampPlacement(point, area, height)));
  };
  private async show(): Promise<void> {
    if (this.pet) { this.pet.showInactive(); return; }
    const pet = new BrowserWindow({ width: companionSize, height: this.preferences.current().showIndicators ? companionSize + companionPanelHeight(this.state.alerts?.length ?? 0) : companionSize, show: false, frame: false, transparent: true,
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
    try { await pet.loadURL(this.localUrl); this.place(); pet.showInactive(); this.update({}); }
    catch (error) { console.error("Companion could not load", error); this.hide(); }
  }
  private hide(): void { this.endDrag(); this.pet?.destroy(); this.pet = null; }
  private dispose(): void {
    this.hide();
    this.systemAlerts.clear();
    this.tray?.destroy(); this.tray = null;
    screen.removeListener("display-removed", this.place);
    screen.removeListener("display-metrics-changed", this.place);
    ipcMain.removeHandler("companion:settings");
    ipcMain.removeHandler("companion:command");
    ipcMain.removeHandler("companion:summary");
    ipcMain.removeHandler("companion:notify");
    for (const channel of ["pet:ready", "pet:interactive", "pet:drag", "pet:open", "pet:menu"]) ipcMain.removeAllListeners(channel);
  }
}
