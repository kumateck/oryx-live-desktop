import { AlertPriority } from "./companion.js";
/** Only explicit backend priority names are accepted; numeric values have no agreed contract yet. */
export function priorityFromName(value: string | null | undefined): AlertPriority {
  switch (value?.trim().toLowerCase()) {
    case "low": return AlertPriority.Low;
    case "medium": return AlertPriority.Medium;
    case "high": return AlertPriority.High;
    case "critical": return AlertPriority.Critical;
    default: return AlertPriority.Unspecified;
  }
}
export function priorityLabel(priority: AlertPriority): string {
  switch (priority) {
    case AlertPriority.Low: return "Low priority";
    case AlertPriority.Medium: return "Medium priority";
    case AlertPriority.High: return "High priority";
    case AlertPriority.Critical: return "Critical priority";
    default: return "Priority not set";
  }
}
