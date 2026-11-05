import { monthYearValue, parseMonthYear } from "@/shared/date-pickers/date-utils";
import { formatQuantityNumber, toLargestUnit } from "@/shared/units/quantity";

export const forecastPermission = "CanViewProductionScheduleMaterialForecast";
export const forecastAudit = { module: "Warehouse", subModule: "Production Material Forecast" } as const;

export const currentMonth = (now = new Date()) => monthYearValue(now.getFullYear(), now.getMonth() + 1);

/** The month picker's `YYYY-MM` value as the report's year and month, or null when none is chosen. */
export function monthArg(value: string | null | undefined): { year: number; month: number } | null {
  const parsed = parseMonthYear(value);
  return parsed ? { year: parsed.year, month: parsed.month } : null;
}

export const batchSizeLabel = (size: 0 | 1) => size === 1 ? "Half batch" : "Full batch";

/** A calculated quantity in the material's unit, shown in its largest readable unit. */
export const showQuantity = (value: number, unit: string) =>
  toLargestUnit(value, unit || null, "calculated")?.text ?? formatQuantityNumber(value, "calculated");

/** How many of the product's batches can go ahead, and why not when some cannot. */
export function readiness(product: { batchCount: number; batchesSatisfiable: number; rawBatchesSatisfiable: number; packagingBatchesSatisfiable: number }) {
  const short = product.batchesSatisfiable < product.batchCount;
  return { short, text: `${product.batchesSatisfiable} of ${product.batchCount} ${product.batchCount === 1 ? "batch" : "batches"} covered`,
    detail: `Raw materials ${product.rawBatchesSatisfiable} · Packaging ${product.packagingBatchesSatisfiable}` };
}
