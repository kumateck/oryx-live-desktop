import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const num = z.number().nullish().transform((value) => value !== null && value !== undefined && Number.isFinite(value) ? value : null);

/** What the monthly plan needs from a schedule in the list: its dates and each batch's product, packing and market. */
const planBatch = z.object({
  cancelled: z.boolean().nullish(), batchSize: z.number().nullish(),
  product: z.object({ id: z.string().nullish(), name: text, code: text, price: num, priceUoM: text }).nullish(),
  productPacking: z.object({ id: z.string().nullish(), name: text, expectedYield: num, packPerShipper: num }).nullish(),
  marketType: z.object({ id: z.string().nullish(), name: text }).nullish(),
});
export const planScheduleSchema = z.object({
  id: z.string(), scheduledStartTime: z.string().nullish(), scheduledEndTime: z.string().nullish(),
  products: z.array(planBatch).nullish().transform((value) => value ?? []),
});
export type PlanSchedule = z.infer<typeof planScheduleSchema>;

export const noMarket = "No market recorded";

export interface MonthlyPlanRow {
  key: string; market: string; productId: string; productName: string; productCode: string | null; packingStyle: string;
  /** A half batch counts as half. */
  batches: number;
  unitPrice: number | null; priceUoM: string | null;
  /** Packs expected from the batches, from the packing style's expected yield per batch. */
  expectedYield: number;
  /** Null when the packing style does not say how many packs go in a shipper. */
  shippers: number | null; loose: number | null;
}

export interface MonthRange { start: Date; end: Date }

/** The calendar month containing `month`, in local time, from its first instant to its last. */
export function monthRange(month: Date): MonthRange {
  return { start: new Date(month.getFullYear(), month.getMonth(), 1), end: new Date(month.getFullYear(), month.getMonth() + 1, 1, 0, 0, 0, -1) };
}

export function shiftMonth(month: Date, by: number): Date {
  return new Date(month.getFullYear(), month.getMonth() + by, 1);
}

/**
 * Every batch of a schedule that runs at any time in the month, grouped by market, product and packing style.
 * Cancelled batches are left out. The same rule as Oryx Next, so both clients print the same plan.
 */
export function buildMonthlyPlan(schedules: readonly PlanSchedule[], month: Date): MonthlyPlanRow[] {
  const { start, end } = monthRange(month);
  const groups = new Map<string, Omit<MonthlyPlanRow, "shippers" | "loose"> & { perShipper: number | null }>();
  for (const schedule of schedules) {
    const from = schedule.scheduledStartTime ? Date.parse(schedule.scheduledStartTime) : Number.NaN;
    const to = schedule.scheduledEndTime ? Date.parse(schedule.scheduledEndTime) : Number.NaN;
    if (!Number.isFinite(from) || !Number.isFinite(to) || from > end.getTime() || to < start.getTime()) continue;
    for (const batch of schedule.products) {
      const productId = batch.product?.id;
      if (batch.cancelled || !productId) continue;
      const market = batch.marketType?.name ?? noMarket;
      const key = [market, productId, batch.productPacking?.id ?? "none"].join("::");
      const share = batch.batchSize === 1 ? 0.5 : 1;
      const row = groups.get(key) ?? {
        key, market, productId, productName: batch.product?.name ?? "Unnamed product", productCode: batch.product?.code ?? null,
        packingStyle: batch.productPacking?.name ?? "No packing style", batches: 0, unitPrice: batch.product?.price ?? null,
        priceUoM: batch.product?.priceUoM ?? null, expectedYield: 0, perShipper: batch.productPacking?.packPerShipper ?? null,
      };
      row.batches += share;
      row.expectedYield += share * (batch.productPacking?.expectedYield ?? 0);
      groups.set(key, row);
    }
  }
  return [...groups.values()].map(({ perShipper, ...row }) => {
    const expectedYield = Math.round(row.expectedYield);
    const shippers = perShipper && perShipper > 0 ? Math.floor(expectedYield / perShipper) : null;
    return { ...row, expectedYield, shippers, loose: shippers === null || !perShipper ? null : expectedYield - shippers * perShipper };
  }).sort((a, b) => marketOrder(a.market, b.market) || a.productName.localeCompare(b.productName) || a.packingStyle.localeCompare(b.packingStyle));
}

/** Markets alphabetically, with batches that have no market last. */
function marketOrder(a: string, b: string): number {
  if (a === b) return 0;
  if (a === noMarket) return 1;
  if (b === noMarket) return -1;
  return a.localeCompare(b);
}

export interface MarketGroup { market: string; rows: MonthlyPlanRow[] }

export function groupByMarket(rows: readonly MonthlyPlanRow[]): MarketGroup[] {
  const groups: MarketGroup[] = [];
  for (const row of rows) {
    const last = groups.at(-1);
    if (last?.market === row.market) last.rows.push(row);
    else groups.push({ market: row.market, rows: [row] });
  }
  return groups;
}

export interface PlanTotals { batches: number; expectedYield: number; shippers: number | null; loose: number | null }

/** Totals for the plan. Shippers and loose packs are only added up when every row has them, so a total is never partial. */
export function planTotals(rows: readonly MonthlyPlanRow[]): PlanTotals {
  const complete = rows.length > 0 && rows.every((row) => row.shippers !== null);
  return {
    batches: rows.reduce((sum, row) => sum + row.batches, 0),
    expectedYield: rows.reduce((sum, row) => sum + row.expectedYield, 0),
    shippers: complete ? rows.reduce((sum, row) => sum + (row.shippers ?? 0), 0) : null,
    loose: complete ? rows.reduce((sum, row) => sum + (row.loose ?? 0), 0) : null,
  };
}
