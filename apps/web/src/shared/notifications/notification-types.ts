import { eventLabels, eventValues } from "./event-catalog";
/** Type names are shared with the existing Alert Configuration editor. */
const destinations: Partial<Record<number, string>> = {
  0: "/production/activities",
  1: "/settings/shift-schedule",
  2: "/procurement/material-distribution",
  3: "/warehouse/materials/linked",
  4: "/warehouse/materials/linked",
  5: "/warehouse/materials/linked",
  6: "/warehouse/stock-requisition",
  7: "/warehouse/stock-requisition",
  8: "/production/activities",
  9: "/qa/pending-approvals?type=OvertimeRequest",
  10: "/qa/pending-approvals?type=LeaveRequest",
  11: "/qa/pending-approvals?type=StaffRequisition",
  12: "/access-management/audit-trail",
  13: "/production/activities",
  14: "/production/activities",
  15: "/warehouse/expired-materials",
  16: "/it/my-issues",
  17: "/it/my-issues",
  18: "/it/my-issues",
  19: "/it/my-issues",
  20: "/extrals/job-requests",
};
export function notificationLabel(type: number | null): string {
  const event = eventValues.find((value) => value === type);
  return event === undefined ? "Notification" : eventLabels[event];
}
export const notificationLink = (type: number | null, shipmentDocumentId?: string) =>
  type === 2 && shipmentDocumentId ? `/logistics/shipment-documents/${encodeURIComponent(shipmentDocumentId)}/details`
    : type === null ? undefined : destinations[type];
