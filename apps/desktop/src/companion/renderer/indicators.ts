import { AlertPriority, type CompanionView } from "../contract";
import { priorityLabel } from "../../../../../shared/alert-priority";
import { companionPanelHeight, companionSize } from "../placement";
export function indicatorText(view: CompanionView) {
  const hasAlerts = view.signedIn && view.unread > 0;
  const alerts = hasAlerts ? view.alerts ?? [] : [];
  return {
    alerts,
    empty: !view.signedIn ? "Sign in to view alerts" : view.unread > 0 && !alerts.length ? "Loading alerts…" : alerts.length ? "" : "All caught up",
    priority: priorityLabel(alerts.reduce((highest, alert) => Math.max(highest, alert.priority), AlertPriority.Unspecified)),
    priorityCode: alerts.reduce((highest, alert) => Math.max(highest, alert.priority), AlertPriority.Unspecified),
    count: `${view.signedIn ? view.unread : 0} unread`,
    status: `${view.quiet ? "Quiet · " : ""}${!view.signedIn ? "Not signed in" : view.connected ? "Live updates connected" : "Disconnected · checking periodically"}`,
  };
}
/** TextContent keeps metadata out of HTML; indicators stay visible independently of motion. */
export function renderIndicators(view: CompanionView): void {
  const text = indicatorText(view);
  const panel = document.getElementById("indicators");
  if (panel) {
    panel.hidden = view.showIndicators === false;
    const height = view.showIndicators === false ? 0 : companionPanelHeight(view.alerts?.length ?? 0);
    panel.style.height = `${height}px`; document.body.style.height = `${companionSize + height}px`;
    const companion = document.getElementById("companion"); if (companion) companion.style.height = `${companionSize + height}px`;
  }
  document.body.dataset.details = view.showIndicators === false ? "off" : "on";
  for (const [id, value] of [["alert-priority", text.priority], ["alert-count", text.count], ["alert-status", text.status]]) {
    const element = document.getElementById(id ?? "");
    if (element && value) { element.textContent = value; element.title = value; }
  }
  const priority = document.getElementById("alert-priority");
  if (priority) priority.dataset.priority = String(text.priorityCode);
  const feed = document.getElementById("alert-feed");
  const empty = document.getElementById("alert-empty");
  if (empty) { empty.textContent = text.empty; empty.hidden = Boolean(text.alerts.length); }
  if (feed) {
    const top = feed.scrollTop;
    const newestId = text.alerts[0]?.id ?? "";
    const newestChanged = newestId !== (feed.dataset.newestId ?? "");
    feed.replaceChildren(...text.alerts.map((alert) => {
      const item = document.createElement("button"); item.type = "button"; item.className = "alert-item";
      item.dataset.notificationId = alert.id; item.setAttribute("aria-label", `${alert.label}: ${alert.message}`);
      const label = document.createElement("span"); label.className = "alert-label"; label.textContent = alert.label;
      const message = document.createElement("span"); message.className = "alert-message"; message.textContent = alert.message;
      item.append(label, message); return item;
    }));
    feed.dataset.newestId = newestId;
    feed.scrollTop = newestChanged ? 0 : top;
  }
}
