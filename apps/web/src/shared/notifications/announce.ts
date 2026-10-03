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

const away = () => typeof document !== "undefined" && (document.visibilityState === "hidden" || !document.hasFocus());

/**
 * Tells the user something arrived: a message inside the app, and, when the window is not in front and
 * the user has allowed it, a notification from the operating system. `onOpen` opens the notification list.
 */
export function announce(notification: { message: string; type: number | null }, onOpen: () => void): void {
  const title = notificationLabel(notification.type);
  toast.info(title, { description: notification.message, duration: 8_000, action: { label: "View", onClick: onOpen } });
  if (away() && desktopPermission() === "granted") {
    try {
      const shown = new Notification(title, { body: notification.message, tag: `oryx-${notification.message}` });
      shown.onclick = () => { window.focus(); onOpen(); shown.close(); };
    } catch { /* the in-app message has been shown; the system one is a convenience */ }
  }
}
export function announceMany(count: number, onOpen: () => void): void {
  toast.info(`${count} new notifications`, { duration: 8_000, action: { label: "View", onClick: onOpen } });
  if (away() && desktopPermission() === "granted") {
    try { const shown = new Notification("Oryx", { body: `${count} new notifications`, tag: "oryx-many" }); shown.onclick = () => { window.focus(); onOpen(); shown.close(); }; } catch { /* as above */ }
  }
}
