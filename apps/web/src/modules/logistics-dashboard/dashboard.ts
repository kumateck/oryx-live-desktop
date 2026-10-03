import { z } from "zod";

export const audit = { module: "Logistics", subModule: "Dashboard" } as const;
export type Period = "all" | "week" | "month";
export const periods: { value: Period; label: string }[] = [{ value: "all", label: "All" }, { value: "week", label: "This week" }, { value: "month", label: "This month" }];
/** The server's own filter for its status summaries: 1 this week, 2 this month, 3 everything. */
export const periodFilter: Record<Period, 1 | 2 | 3> = { week: 1, month: 2, all: 3 };

/** The dates a period covers, from its first moment until now. The week starts on Monday. */
export function periodRange(period: Period, now: Date = new Date()): { startDate?: string; endDate?: string } {
  if (period === "all") return {};
  const end = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
  const start = period === "month" ? new Date(now.getFullYear(), now.getMonth(), 1) : new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return { startDate: start.toISOString(), endDate: end.toISOString() };
}

const count = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
export const logisticsSchema = z.object({ numberOfInvoices: count, numberOfPaidInvoices: count, numberOfUnpaidInvoices: count, numberOfShipments: count, numberOfNewShipments: count, numberOfInTransitShipments: count,
  numberOfArrivedShipments: count, numberOfClearedShipments: count, numberOfBillingSheets: count, numberOfPaidBillingSheets: count, numberOfPendingBillingSheets: count, numberOfWaybills: count,
  numberOfNewWaybills: count, numberOfInTransitWaybills: count, numberOfArrivedWaybills: count, numberOfClearedWaybills: count });
export type LogisticsFigures = z.infer<typeof logisticsSchema>;
export const distributionCountSchema = z.object({ materialDistributionStatus: z.object({ pendingCount: count, distributedCount: count }).nullish() }).nullish()
  .transform((value) => ({ pending: value?.materialDistributionStatus?.pendingCount ?? 0, distributed: value?.materialDistributionStatus?.distributedCount ?? 0 }));
export const stagesSchema = z.object({ newCount: count, atPortCount: count, clearedCount: count, inTransitCount: count, arrivedCount: count });
const text = z.string().nullish().transform((value) => value?.trim() || null);
export const shipmentReportSchema = z.array(z.object({ supplierName: text, billOfLadingNo: text, demurrageStarts: text, freeDays: text, containerSize: text, status: text })).nullish().transform((value) => value ?? []);

/** Where shipments and waybills sit, stage by stage. */
export function pipeline(figures: LogisticsFigures): { stage: string; shipments: number; waybills: number }[] {
  return [{ stage: "New", shipments: figures.numberOfNewShipments, waybills: figures.numberOfNewWaybills }, { stage: "In transit", shipments: figures.numberOfInTransitShipments, waybills: figures.numberOfInTransitWaybills },
    { stage: "Arrived", shipments: figures.numberOfArrivedShipments, waybills: figures.numberOfArrivedWaybills }, { stage: "Cleared", shipments: figures.numberOfClearedShipments, waybills: figures.numberOfClearedWaybills }];
}

/** Whole days since demurrage began to be charged; 0 when it has not started or the date cannot be read. */
export function demurrageDays(starts: string | null, now: Date = new Date()): number {
  if (!starts) return 0;
  const date = new Date(starts);
  return Number.isNaN(date.getTime()) ? 0 : Math.max(0, Math.floor((now.getTime() - date.getTime()) / 86_400_000));
}
/** The shipments that have been on demurrage longest. */
export function longestOnDemurrage<T extends { demurrageStarts: string | null }>(rows: readonly T[], now: Date = new Date(), limit = 5): (T & { days: number })[] {
  return rows.filter((row) => row.demurrageStarts && !Number.isNaN(new Date(row.demurrageStarts).getTime())).map((row) => ({ ...row, days: demurrageDays(row.demurrageStarts, now) })).sort((a, b) => b.days - a.days).slice(0, limit);
}
