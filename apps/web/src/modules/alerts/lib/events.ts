import type { DomainEntitiesNotificationsNotificationType } from "@/shared/api/generated/settings";
export const eventValues = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20] as const;
export const eventLabels: Record<DomainEntitiesNotificationsNotificationType, string> = {
  0: "Production stage changed", 1: "Shift assigned", 2: "Shipment arrived", 3: "Material above maximum stock",
  4: "Material below minimum stock", 5: "Material reached reorder level", 6: "Stock requisition created",
  7: "Partial requisition created", 8: "Partial production request", 9: "Overtime request", 10: "Leave request",
  11: "Staff request", 12: "Audit log event", 13: "BMR/BPR requested", 14: "BMR/BPR approved", 15: "Expired material",
  16: "IT ticket created", 17: "IT ticket assigned", 18: "IT ticket status changed", 19: "IT ticket comment added", 20: "Job request assigned",
};
export const eventOptions = eventValues.map((value) => ({ value: String(value), label: eventLabels[value] }));
export const channelOptions = [{ value: "0", label: "Email" }, { value: "1", label: "In-app" }] as const;
