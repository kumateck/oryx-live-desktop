import { z } from "zod";
import { averageOf, count, list, sumOf, text } from "@/shared/dashboard/report-values";

const schedule = z.object({ newScheduleCount: count, inProgressScheduleCount: count, delayedScheduleCount: count, completedScheduleCount: count, cancelledScheduleCount: count });
const transfers = z.object({ inProgressCount: count, approvedCount: count, issuedCount: count, rejectedCount: count });
export const snapshotSchema = z.object({
  requisitionReport: z.object({ newRequisitionsCount: count, pendingRequisitionsCount: count, sourcedRequisitionsCount: count, completedRequisitionsCount: count }).nullish(),
  productionScheduleReport: schedule.nullish(), stockTransferReport: transfers.nullish(),
  materialsBelowReorderLevel: list(z.object({ materialName: text, materialCode: text, currentQuantity: count, reOrderLevel: count, uomSymbol: text })) });
export const adherenceSchema = list(z.object({ department: text, onTime: count, delayed: count, adherencePercentage: count }));
export const bmrSchema = list(z.object({ totalBmrs: count, issued: count }));
export const yieldSchema = list(z.object({ expectedYield: count, actualQuantityPacked: count, batchCount: count }));
export const outputSchema = list(z.object({ department: text, totalBatchCount: count }));
export const atrSchema = list(z.object({ department: text, totalBacklog: count, testing: count, oldestWaitingDays: count }));
export const returnSchema = list(z.object({ department: text, totalIssuedQuantity: count, totalReturnedQuantity: count, returnRatePercentage: count }));
export const requisitionPendingSchema = list(z.object({ inProgress: count }));
export const fgtnApprovalSchema = list(z.object({ pendingApproval: count }));
export const deliverySchema = list(z.object({ orderCount: count, delivered: count }));

/** Completed schedules as a share of every schedule, cancelled ones included. */
export function scheduleFulfilment(value: z.infer<typeof schedule> | null | undefined): number {
  if (!value) return 0;
  const total = value.newScheduleCount + value.inProgressScheduleCount + value.completedScheduleCount + value.delayedScheduleCount + value.cancelledScheduleCount;
  return total ? (value.completedScheduleCount / total) * 100 : 0;
}
/** The plain average of each department's adherence. */
export const averageAdherence = (rows: z.infer<typeof adherenceSchema>) => averageOf(rows, (row) => row.adherencePercentage);
export const averageReturnRate = (rows: z.infer<typeof returnSchema>) => averageOf(rows, (row) => row.returnRatePercentage);
export function bmrRelease(rows: z.infer<typeof bmrSchema>) { const total = sumOf(rows, (row) => row.totalBmrs), issued = sumOf(rows, (row) => row.issued); return { total, issued, rate: total ? (issued / total) * 100 : 0 }; }
/** What was packed against what was expected, over every completed batch. */
export function yieldPerformance(rows: z.infer<typeof yieldSchema>) { const expected = sumOf(rows, (row) => row.expectedYield); return { batches: sumOf(rows, (row) => row.batchCount), rate: expected ? (sumOf(rows, (row) => row.actualQuantityPacked) / expected) * 100 : 0 }; }
export const oldestWait = (rows: z.infer<typeof atrSchema>) => rows.reduce((oldest, row) => Math.max(oldest, row.oldestWaitingDays), 0);
/** Transfers still to be issued. */
export const pendingTransfers = (value: z.infer<typeof transfers> | null | undefined) => (value?.inProgressCount ?? 0) + (value?.approvedCount ?? 0);
/** A return rate of 15% or more is alarming, 5% or more worth watching. */
export const returnTone = (rate: number) => rate >= 15 ? "danger" as const : rate >= 5 ? "warning" as const : "success" as const;
