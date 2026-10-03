/** Where a requisition, or one of its lines, stands. The numbers are the server's. */
export const requisitionStatus = { new: 0, pending: 1, sourced: 2, completed: 3, rejected: 4 } as const;
export type RequisitionStatus = 0 | 1 | 2 | 3 | 4;
export const requisitionType = { stock: 0, purchase: 1, trial: 2 } as const;
export type RequisitionType = 0 | 1 | 2;

export const requisitionTypeLabels: Record<RequisitionType, string> = { 0: "Stock", 1: "Purchase", 2: "Trial" };

/**
 * What the status means for a purchase requisition: it waits for approval, then for Procurement
 * to choose suppliers, then for the order. A stock requisition waits for approval, then for the warehouse to issue it.
 */
export function statusLabel(status: RequisitionStatus, type: RequisitionType): string {
  if (status === requisitionStatus.new) return "Awaiting approval";
  if (status === requisitionStatus.pending) return type === requisitionType.purchase ? "Awaiting sourcing" : "Awaiting issue";
  if (status === requisitionStatus.sourced) return "Sourced";
  if (status === requisitionStatus.completed) return "Completed";
  return "Rejected";
}

export function statusTone(status: RequisitionStatus): "outline" | "secondary" | "default" | "destructive" {
  if (status === requisitionStatus.rejected) return "destructive";
  if (status === requisitionStatus.completed) return "default";
  if (status === requisitionStatus.new) return "outline";
  return "secondary";
}
