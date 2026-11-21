import type { PendingReview } from "@/shared/reviews/review-schema";

/**
 * The page where a record is reviewed: its own detail page, which carries the Review panel. The paths are the detail
 * routes of the owning modules.
 */
const pages: Record<string, (id: string) => string> = {
  CostingPriceList: (id) => `/finance/costing/revisions/${id}`,
  BillingSheet: (id) => `/logistics/billing-sheets/${id}`,
  StaffRequisition: (id) => `/hr/staff-requisition/${id}`,
  OvertimeRequest: (id) => `/hr/overtime-management/${id}/details`,
  LeaveRequest: (id) => `/hr/leave-management/${id}/details`,
  JobRequest: (id) => `/extrals/job-requests/${id}/details`,
  AllocateProductionOrder: (id) => `/crm/allocations/${id}`,
  ApprovedVendorList: (id) => `/qa/approved-vendor-list/${id}/details`,
};

export function reviewDocumentPath(row: Pick<PendingReview, "modelType" | "modelId" | "variant"> & { parentId?: string | null | undefined }): string | null {
  const id = encodeURIComponent(row.modelId);
  // A stock issue is checked on its requisition's page; a formula revision on its question's review page.
  if (row.modelType === "StockRequisitionIssue") return row.parentId ? `/warehouse/stock-requisition/${encodeURIComponent(row.parentId)}` : null;
  if (row.modelType === "FormulaRevision") return row.parentId ? `/qa/formula-reviews/${encodeURIComponent(row.parentId)}?revisionId=${id}` : null;
  if (row.modelType === "PurchaseOrder") return row.variant === 0 || row.variant === 1 ? `/procurement/purchase-orders/${id}?type=${row.variant}` : null;
  if (row.modelType === "PurchaseRequisition" || row.modelType === "RawStockRequisition" || row.modelType === "PackageStockRequisition")
    return `/production/requisition/${id}/details`;
  return pages[row.modelType]?.(id) ?? null;
}

const labels: Record<string, string> = { CostingPriceList: "Costing price list", PurchaseOrder: "Purchase order", PurchaseRequisition: "Purchase requisition",
  RawStockRequisition: "Raw material stock requisition", PackageStockRequisition: "Packaging material stock requisition",
  BillingSheet: "Billing sheet", StaffRequisition: "Staff requisition", OvertimeRequest: "Overtime request", LeaveRequest: "Leave request",
  JobRequest: "Job request", AllocateProductionOrder: "Packing list", StockRequisitionIssue: "Stock issue check", FormulaRevision: "QC formula revision",
  ApprovedVendorList: "Approved vendor list" };
export const reviewDocumentLabel = (row: Pick<PendingReview, "modelType" | "documentLabel">) => labels[row.modelType] ?? row.documentLabel ?? row.modelType;
