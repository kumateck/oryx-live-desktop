import { showSystemAlert } from "./desktop-companion";
import { toast } from "sonner";
import { notificationLabel } from "./notification-types";

export type DesktopPermission = "granted" | "denied" | "default" | "unsupported";
export function desktopPermission(): DesktopPermission {
  return typeof Notification === "undefined" ? "unsupported" : Notification.permission;
}
/** Asks to show notifications outside the window. Only ever called from a button the user pressed. */
export async function requestDesktopPermission(): Promise<DesktopPermission> {
  if (typeof Notification === "undefined") return "unsupported";
  try { return await Notification.requestPermission(); } catch { return Notification.permission; }
}

/** Native alerts are shown even while Oryx is in front. Clicking never marks the item read. */
async function system(title: string, body: string, onOpen: () => void, id?: string): Promise<void> {
  if (await showSystemAlert(title, body, id)) return;
  if (desktopPermission() !== "granted") return;
  try {
    const shown = new Notification(title, { body, tag: id ?? `oryx-${body}`, requireInteraction: true });
    shown.onclick = () => { window.focus(); onOpen(); shown.close(); };
  } catch { /* The unread list and in-app alert remain available. */ }
}
export function announce(notification: { id?: string; message: string; type: number | null }, onOpen: () => void): void {
  const title = notificationLabel(notification.type);
  toast.info(title, { description: notification.message, duration: 8_000, action: { label: "View", onClick: onOpen } });
  void system(title, notification.message, onOpen, notification.id);
}
export function announceMany(count: number, onOpen: () => void): void {
  toast.info(`${count} new notifications`, { duration: 8_000, action: { label: "View", onClick: onOpen } });
  void system("Oryx", `${count} new notifications`, onOpen);
}
