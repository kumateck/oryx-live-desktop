import { z } from "zod";

const text = z.string().nullable();
const day = z.iso.date();
const instant = z.iso.datetime({ offset: true });
const row = z.object({
  id: z.uuid(), scheduleProductId: z.uuid(), productId: z.uuid(),
  productCode: text, productName: text, departmentId: z.uuid().nullable(), departmentName: text,
  scheduleCode: text, batchNumber: text, batchQuantity: z.number().finite(), batchUnit: text,
  packingStyle: text, manufacturingDate: instant.nullable(), expiryDate: instant.nullable(),
  issuedAt: instant, issuedById: z.uuid().nullable(), issuedByName: text,
  isArchived: z.boolean(), isCancelled: z.boolean(),
});

/** Refuse partial, duplicate or out-of-scope snapshots before preview, print or export. */
export const issuedBmrReportSchema = z.object({
  startDate: day, endDate: day, departmentId: z.uuid().nullable(), departmentName: text,
  generatedAt: instant, totalIssued: z.number().int().nonnegative(), rows: z.array(row),
}).superRefine((report, context) => {
  const start = Date.parse(`${report.startDate}T00:00:00Z`);
  const end = Date.parse(`${report.endDate}T00:00:00Z`) + 86400000;
  if (start >= end || report.totalIssued !== report.rows.length || new Set(report.rows.map((item) => item.id)).size !== report.rows.length
    || report.rows.some((item) => Date.parse(item.issuedAt) < start || Date.parse(item.issuedAt) >= end
      || (report.departmentId !== null && item.departmentId !== report.departmentId)))
    context.addIssue({ code: "custom", message: "The issued-BMR snapshot is incomplete or inconsistent." });
});
export type IssuedBmrReport = z.infer<typeof issuedBmrReportSchema>;
