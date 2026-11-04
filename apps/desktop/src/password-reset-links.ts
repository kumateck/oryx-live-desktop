import { BrowserWindow, dialog } from "electron";
import { randomUUID } from "node:crypto";
import { parseDesktopPasswordReset, passwordResetPage, type DesktopPasswordReset } from "../../../shared/password-reset-link";

/** Reset links never navigate the ERP window or expose its encrypted session. */
export class PasswordResetLinks {
  private ready = false;
  private pending: DesktopPasswordReset | null = null;
  private resetWindow: BrowserWindow | null = null;
  private address = "";
  private opening = false;
  constructor(private parent: () => BrowserWindow, private site: () => string) {}
  receive(value: string): void {
    const link = parseDesktopPasswordReset(value);
    if (!link) return;
    this.pending = link;
    if (this.ready) void this.open();
  }
  start(): void { this.ready = true; void this.open(); }
  private async open(): Promise<void> {
    if (this.opening || !this.pending) return;
    this.opening = true;
    const link = this.pending;
    this.pending = null;
    try {
      const parent = this.parent();
      if (parent.isMinimized()) parent.restore();
      parent.show();
      const address = passwordResetPage(link, this.site());
      if (!address) {
        await dialog.showMessageBox(parent, { type: "info", message: "Connect Oryx to the server from your reset email first.",
          detail: "This link belongs to a different or unconfigured server. Your current connection and open work have not changed. Connect to the correct server, then open the email link again." });
        return;
      }
      if (this.resetWindow && !this.resetWindow.isDestroyed()) {
        this.resetWindow.show(); this.resetWindow.focus();
        if (this.address !== address) await dialog.showMessageBox(this.resetWindow, { type: "info",
          message: "Finish or close the current password reset before opening another link." });
        return;
      }
      const reset = new BrowserWindow({ width: 1000, height: 760, minWidth: 540, minHeight: 440,
        parent, title: "Reset password — Oryx", autoHideMenuBar: true, show: false,
        webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true, webSecurity: true,
          partition: `password-reset-${randomUUID()}` },
      });
      this.resetWindow = reset;
      this.address = address;
      reset.removeMenu();
      reset.webContents.session.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
      reset.webContents.session.setPermissionCheckHandler(() => false);
      reset.webContents.setWindowOpenHandler(() => ({ action: "deny" }));
      const allowed = (value: string) => {
        try { const url = new URL(value); return url.origin === link.origin && !url.username && !url.password &&
          ["/reset-password", "/forgot-password", "/login"].includes(url.pathname); } catch { return false; }
      };
      reset.webContents.on("will-navigate", (event, value) => { if (!allowed(value)) event.preventDefault(); });
      reset.webContents.on("will-redirect", (event, value) => { if (!allowed(value)) event.preventDefault(); });
      reset.webContents.on("did-navigate-in-page", (_event, value, mainFrame) => {
        if (mainFrame && (!allowed(value) || new URL(value).pathname === "/login")) { reset.close(); parent.show(); parent.focus(); }
      });
      reset.on("closed", () => { this.resetWindow = null; this.address = ""; });
      await reset.loadURL(address);
      reset.show(); reset.focus();
    } catch {
      this.resetWindow?.destroy();
      await dialog.showMessageBox(this.parent(), { type: "error", message: "The password-reset page could not be opened.",
        detail: "Check the server connection and try the email link again, or continue in your browser." });
    } finally {
      this.opening = false;
      if (this.pending) void this.open();
    }
  }
}
