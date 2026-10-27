import { z } from "zod";
export const stockDiscrepancySchema = z.object({
  id: z.string().min(1), shelfMaterialBatchId: z.string().min(1), batchNumber: z.string(), materialName: z.string(), unit: z.string(),
  systemQuantitySnapshot: z.number().finite(), physicalQuantity: z.number().finite().nonnegative(), variance: z.number().finite(),
  reasonCode: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6)]), notes: z.string(),
  approved: z.boolean(), rejected: z.boolean(), reconciledAt: z.string().nullish(), createdAt: z.string(),
});
export type StockDiscrepancy = z.infer<typeof stockDiscrepancySchema>;
export const shelfSchema = z.object({ id: z.string().min(1), quantity: z.number().finite(),
  materialBatch: z.object({ id: z.string().min(1), batchNumber: z.string().nullish(), material: z.object({ name: z.string().nullish() }).nullish() }),
  uoM: z.object({ symbol: z.string().nullish() }).nullish(), warehouseLocationShelf: z.object({ name: z.string().nullish() }).nullish(),
});
export const stockDiscrepancyAudit = { module: "Warehouse", subModule: "Stock Discrepancies" };
export const stockDiscrepancyPath = (id: string) => `/warehouse/stock-discrepancies/${encodeURIComponent(id)}`;
export const stockDiscrepancyStatus = (row: StockDiscrepancy) => row.reconciledAt ? "Reconciled" : row.rejected ? "Rejected" : row.approved ? "Approved, awaiting reconciliation" : "Pending approval";
export const discrepancyReasons = ["Physical count", "Damage", "Theft", "Expiry", "Data entry error", "Returned goods", "Other"] as const;
