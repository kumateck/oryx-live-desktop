import { Notification, type BrowserWindow } from "electron";
import type { SystemAlert } from "./contract";

export function validSystemAlert(value: object): value is SystemAlert {
  return "title" in value && typeof value.title === "string" && value.title.length > 0 && value.title.length <= 160
    && "body" in value && typeof value.body === "string" && value.body.length > 0 && value.body.length <= 4000
    && (!("id" in value) || (typeof value.id === "string" && value.id.length <= 100));
}
/** OS notification history complements, but never replaces, the backend's durable unread list. */
export class SystemAlerts {
  private active = new Set<Notification>();
  private seen = new Map<string, number>();
  constructor(private owner: BrowserWindow) {}
  show(value: SystemAlert): boolean {
    if (!Notification.isSupported()) return false;
    const now = Date.now();
    for (const [key, at] of this.seen) if (now - at > 120000) this.seen.delete(key);
    const key = value.id ?? `${value.title}:${value.body}`;
    if (this.seen.has(key)) return true;
    const notification = new Notification({ title: value.title, body: value.body, timeoutType: "never" });
    notification.on("click", () => {
      if (this.owner.isDestroyed()) return;
      this.owner.show(); this.owner.focus(); this.owner.webContents.send("companion:open", value.id?.startsWith("backlog:") ? undefined : value.id);
    });
    notification.on("close", () => this.active.delete(notification));
    notification.on("failed", () => { this.seen.delete(key); this.active.delete(notification); });
    this.active.add(notification);
    try { notification.show(); this.seen.set(key, now); return true; }
    catch { this.active.delete(notification); return false; }
  }
  clear(): void {
    for (const notification of this.active) notification.close();
    this.active.clear(); this.seen.clear();
  }
}
