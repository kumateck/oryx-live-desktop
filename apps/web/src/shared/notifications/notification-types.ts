/** What a notification is about, and the page where the user can act on it. The numbers are the server's. */
const types: Record<number, { label: string; to?: string }> = {
  0: { label: "Production stage changed", to: "/production/activities" },
  1: { label: "Shift assigned" },
  2: { label: "Shipment arrived", to: "/procurement/material-distribution" },
  3: { label: "Stock above maximum", to: "/warehouse/materials/linked" },
  4: { label: "Stock below minimum", to: "/warehouse/materials/linked" },
  5: { label: "Stock at re-order level", to: "/warehouse/materials/linked" },
  6: { label: "Stock requisition", to: "/warehouse/stock-requisition" },
  7: { label: "Partial requisition", to: "/warehouse/stock-requisition" },
  8: { label: "Partial production request", to: "/production/activities" },
  9: { label: "Overtime request", to: "/qa/pending-approvals?type=OvertimeRequest" },
  10: { label: "Leave request", to: "/qa/pending-approvals?type=LeaveRequest" },
  11: { label: "Staff request", to: "/qa/pending-approvals?type=StaffRequisition" },
  12: { label: "Audit log" },
  13: { label: "Batch record requested", to: "/production/activities" },
  14: { label: "Batch record approved", to: "/production/activities" },
  15: { label: "Expired material", to: "/warehouse/expired-materials" },
  16: { label: "Ticket created" },
  17: { label: "Ticket assigned" },
  18: { label: "Ticket status changed" },
  19: { label: "Ticket comment" },
  20: { label: "Job request assigned" },
};
export const notificationLabel = (type: number | null) => (type === null ? undefined : types[type]?.label) ?? "Notification";
export const notificationLink = (type: number | null) => type === null ? undefined : types[type]?.to;
