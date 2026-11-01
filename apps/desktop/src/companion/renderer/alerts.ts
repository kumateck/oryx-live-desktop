import { AlertPriority, type CompanionAlert, type CompanionView } from "../contract";
import { priorityLabel } from "../../../../../shared/alert-priority";

export type AlertCategory = "production" | "stock" | "warehouse" | "people" | "logistics" | "it" | "work" | "audit" | "general";
/** Groups notification types (shared with Alert Configuration) by the area of work they come from. */
export function alertCategory(type: number | null): AlertCategory {
  switch (type) {
    case 0: case 8: case 13: case 14: return "production";
    case 3: case 4: case 5: case 15: return "stock";
    case 6: case 7: return "warehouse";
    case 1: case 9: case 10: case 11: return "people";
    case 2: return "logistics";
    case 16: case 17: case 18: case 19: return "it";
    case 20: return "work";
    case 12: return "audit";
    default: return "general";
  }
}
export const categoryName: Record<AlertCategory, string> = {
  production: "Production", stock: "Stock", warehouse: "Warehouse", people: "People", logistics: "Logistics",
  it: "IT support", work: "Job requests", audit: "Audit", general: "Notification",
};

/** Short, scannable time: "Now", "5m", "3h", "Yesterday", "12 Oct". */
export function since(at: string | undefined, now = Date.now()): string {
  const time = at ? Date.parse(at) : NaN;
  if (!Number.isFinite(time)) return "";
  const minutes = Math.max(0, Math.round((now - time) / 60000));
  if (minutes < 1) return "Now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const day = new Date(time), today = new Date(now);
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  if (day.getFullYear() === yesterday.getFullYear() && day.getMonth() === yesterday.getMonth() && day.getDate() === yesterday.getDate()) return "Yesterday";
  return day.toLocaleDateString([], { day: "numeric", month: "short", ...(day.getFullYear() === today.getFullYear() ? {} : { year: "numeric" }) });
}
/** Full date and time for the detail view and tooltips. */
export function exactTime(at: string | undefined): string {
  const time = at ? Date.parse(at) : NaN;
  return Number.isFinite(time) ? new Date(time).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "";
}

export interface AlertGroup { title: string; alerts: CompanionAlert[] }
/** Newest first (backend order breaks ties), grouped into Today and Earlier when times are known. */
export function groupAlerts(alerts: readonly CompanionAlert[], now = Date.now()): AlertGroup[] {
  const start = new Date(now); start.setHours(0, 0, 0, 0);
  const today: CompanionAlert[] = [], earlier: CompanionAlert[] = [], unknown: CompanionAlert[] = [];
  for (const alert of alerts) {
    const time = alert.at ? Date.parse(alert.at) : NaN;
    (!Number.isFinite(time) ? unknown : time >= start.getTime() ? today : earlier).push(alert);
  }
  const groups: AlertGroup[] = [];
  if (today.length) groups.push({ title: "Today", alerts: today });
  if (earlier.length) groups.push({ title: "Earlier", alerts: earlier });
  if (unknown.length) groups.push({ title: groups.length ? "Other" : "Unread", alerts: unknown });
  return groups;
}

/** Only explicit high and critical priorities earn a chip; unset priority is never guessed. */
export function priorityChip(priority: AlertPriority): { text: string; tone: "high" | "critical" } | null {
  if (priority === AlertPriority.Critical) return { text: "Critical", tone: "critical" };
  if (priority === AlertPriority.High) return { text: "High", tone: "high" };
  return null;
}

/** Plain-language status for the panel header, tooltips and screen readers. */
export function alertSummary(view: CompanionView) {
  const alerts = view.signedIn && view.unread > 0 ? view.alerts ?? [] : [];
  const highest = alerts.reduce((top, alert) => Math.max(top, alert.priority), AlertPriority.Unspecified);
  const unread = view.signedIn ? view.unread : 0;
  return {
    alerts,
    unread,
    count: unread === 1 ? "1 unread" : `${unread} unread`,
    priority: priorityLabel(highest),
    priorityCode: highest,
    empty: !view.signedIn ? "Sign in to Oryx to see your alerts" : view.unread > 0 && !alerts.length ? "Loading alerts…" : alerts.length ? "" : "You're all caught up",
    status: !view.signedIn ? "Not signed in" : view.connected ? "Live" : "Reconnecting · checking every minute",
  };
}
