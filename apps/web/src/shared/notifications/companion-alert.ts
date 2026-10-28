import { AlertPriority, type CompanionAlert } from "../../../../../shared/companion";
import { priorityFromName } from "../../../../../shared/alert-priority";
import { notificationLabel } from "./notification-types";
import type { Unread } from "./arrivals";
/** Preserve backend ordering and explicit priority for every unread item. */
export function companionAlerts(items: readonly Unread[]): CompanionAlert[] {
  return items.map((item) => ({
    id: item.id, label: notificationLabel(item.type), message: item.message.slice(0, 4000), type: item.type,
    priority: priorityFromName(item.priority), ...(item.shipmentDocumentId ? { shipmentDocumentId: item.shipmentDocumentId } : {}),
  }));
}
