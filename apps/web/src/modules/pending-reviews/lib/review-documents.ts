import type { PendingReview } from "@/shared/reviews/review-schema";

/**
 * The page where a record is reviewed: its own detail page, which carries the Review panel. The paths are the routes
 * of the purchase-orders and requisitions modules.
 */
export function reviewDocumentPath(row: Pick<PendingReview, "modelType" | "modelId" | "variant">): string | null {
  const id = encodeURIComponent(row.modelId);
  if (row.modelType === "PurchaseOrder") return row.variant === 0 || row.variant === 1 ? `/procurement/purchase-orders/${id}?type=${row.variant}` : null;
  if (row.modelType === "PurchaseRequisition" || row.modelType === "RawStockRequisition" || row.modelType === "PackageStockRequisition")
    return `/production/requisition/${id}/details`;
  return null;
}

const labels: Record<string, string> = { PurchaseOrder: "Purchase order", PurchaseRequisition: "Purchase requisition",
  RawStockRequisition: "Raw material stock requisition", PackageStockRequisition: "Packaging material stock requisition" };
export const reviewDocumentLabel = (row: Pick<PendingReview, "modelType" | "documentLabel">) => labels[row.modelType] ?? row.documentLabel ?? row.modelType;
