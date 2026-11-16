import { z } from "zod";

const text = z.string().nullable();
const amount = z.number().finite().nullable();
const instant = z.iso.datetime({ offset: true });

/** One planned batch from `GET report/production-monthly`. */
export const productionBatchSchema = z.object({
  scheduleProductId: z.uuid(), scheduleCode: text, scheduleStart: instant, productId: z.uuid(), productCode: text, productName: text,
  departmentId: z.uuid().nullable(), departmentName: text, marketId: z.uuid().nullable(), marketName: text, batchNumber: text,
  batchSize: z.number().int(), batchShare: z.number().finite(), productPackingId: z.uuid().nullable(), packingStyle: text,
  packsPerShipper: z.number().int().nullable(), expectedYield: amount, packed: z.boolean(), actualYield: amount, retainedSamples: amount,
  bottlesPerShipper: amount, fullShippers: amount, leftOver: amount, transferredToWarehouse: amount, transferUnit: text,
  transferNotes: z.number().int().nonnegative(), unitPrice: amount, priceUnit: text, currency: text,
});
export type ProductionBatch = z.infer<typeof productionBatchSchema>;

/** Refuse a month whose rows fall outside it or repeat a batch. */
export const productionMonthlySchema = z.object({
  year: z.number().int(), month: z.number().int().min(1).max(12), departmentId: z.uuid().nullable(), departmentName: text,
  generatedAt: instant, rows: z.array(productionBatchSchema),
}).superRefine((report, context) => {
  const start = Date.UTC(report.year, report.month - 1, 1); const end = Date.UTC(report.year, report.month, 1);
  if (new Set(report.rows.map((row) => row.scheduleProductId)).size !== report.rows.length
    || report.rows.some((row) => Date.parse(row.scheduleStart) < start || Date.parse(row.scheduleStart) >= end
      || (report.departmentId !== null && row.departmentId !== report.departmentId)))
    context.addIssue({ code: "custom", message: "The production month snapshot is incomplete or inconsistent." });
});
export type ProductionMonthly = z.infer<typeof productionMonthlySchema>;

/** One line of `GET report/stock-issued`: a material batch issued against a requisition, or an extra packing issue. */
export const stockIssuedRowSchema = z.object({
  id: z.uuid(), source: z.union([z.literal(0), z.literal(1)]), issuedAt: instant, issuedByName: text, requisitionCode: text,
  productId: z.uuid().nullable(), productCode: text, productName: text, departmentId: z.uuid().nullable(), departmentName: text,
  batchNumber: text, materialId: z.uuid().nullable(), materialCode: text, materialName: text, materialKind: z.number().int().nullable(),
  materialBatchNumber: text, arNumber: text, quantity: z.number().finite(), unit: text, warehouseName: text,
});
export const stockIssuedSchema = z.object({
  departmentId: z.uuid().nullable(), departmentName: text, productId: z.uuid().nullable(), batchNumber: text,
  startDate: z.iso.date().nullable(), endDate: z.iso.date().nullable(), generatedAt: instant, rows: z.array(stockIssuedRowSchema),
}).superRefine((report, context) => {
  if (new Set(report.rows.map((row) => row.id)).size !== report.rows.length
    || report.rows.some((row) => (report.productId !== null && row.productId !== report.productId)
      || (report.departmentId !== null && row.departmentId !== report.departmentId)))
    context.addIssue({ code: "custom", message: "The stock issued snapshot is incomplete or inconsistent." });
});
export type StockIssued = z.infer<typeof stockIssuedSchema>;
