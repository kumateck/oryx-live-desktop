import { expect, it } from "vitest";
import { companionAlerts } from "./companion-alert";
import { AlertPriority } from "../../../../../shared/companion";
import { eventLabels } from "./event-catalog";
import { notificationListSchema } from "./notification-api";
it("uses the same event name as Alert Configuration and does not infer priority from event or text", () => {
  expect(companionAlerts([{ id: "one", type: 15, message: "CRITICAL expired stock" }])).toEqual([{ id: "one", label: eventLabels[15], message: "CRITICAL expired stock", type: 15, priority: AlertPriority.Unspecified }]);
});
it("chooses the highest priority actually supplied by the backend", () => {
  const alerts = companionAlerts([{ id: "recent", type: 1, message: "Assigned", priority: "Low" }, { id: "older", type: 15, message: "Review", priority: "High" }]);
  expect(alerts.map((alert) => alert.id)).toEqual(["recent", "older"]); expect(alerts[1]?.priority).toBe(AlertPriority.High);
});
it("retains supplied priority through unread parsing and treats unsupported numeric priorities as unspecified", () => {
  const items = notificationListSchema.parse([{ id: "one", type: 4, message: "Review", priority: "Critical" }, { id: "two", type: 15, message: "Review", priority: 3 }]);
  expect(companionAlerts(items)[0]?.priority).toBe(AlertPriority.Critical);
  expect(companionAlerts(items.slice(1))[0]?.priority).toBe(AlertPriority.Unspecified);
});
it("clears displayed alert after the unread list is empty", () => { expect(companionAlerts([])).toEqual([]); });
