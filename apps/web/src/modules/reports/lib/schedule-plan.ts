import type { DomainEntitiesProductionSchedulesProductionScheduleDto as Schedule } from "@/shared/api/generated/production";
import { reportSheet } from "@/shared/reports/report-data";
export interface PlannedProduct { productId: string; code: string | null; name: string; markets: Set<string>; batches: number }
export interface PlanRow { productId: string; code: string | null; name: string; market: string; packing: string; batches: number; expectedYield: number | null; packPerShipper: number | null; shippers: number | null; loose: number | null; unitPrice: number | null; priceUnit: string | null }
export function schedulePlan(schedules: readonly Schedule[], start: Date, end: Date, departmentId: string): PlanRow[] {
  const groups = new Map<string, PlanRow>();
  for (const schedule of schedules) {
    const from = Date.parse(schedule.scheduledStartTime ?? ""); const to = Date.parse(schedule.scheduledEndTime ?? "");
    if (!Number.isFinite(from) || !Number.isFinite(to)) throw new Error("A schedule has missing or invalid dates. The complete period cannot be verified.");
    if (from > end.getTime() || to < start.getTime()) continue;
    for (const batch of schedule.products ?? []) {
      if (batch.cancelled) continue;
      const product = batch.product;
      if (!product?.id || !product.department?.id) throw new Error("A planned batch has no product or department identity. Report scope cannot be verified.");
      if (product.department.id !== departmentId) continue;
      if (batch.batchSize !== 0 && batch.batchSize !== 1) throw new Error("A planned batch has an unrecognised batch size. Its quantity cannot be calculated.");
      const market = batch.marketType?.name ?? "No market recorded"; const packing = batch.productPacking;
      const key = [market, product.id, packing?.id ?? "none"].join("::"); const share = batch.batchSize === 1 ? 0.5 : 1;
      const row = groups.get(key) ?? { productId: product.id, code: product.code ?? null, name: product.name ?? "Unnamed product", market, packing: packing?.name ?? "No packing style", batches: 0, expectedYield: 0, packPerShipper: packing?.packPerShipper ?? null, shippers: null, loose: null, unitPrice: product.price ?? null, priceUnit: product.priceUoM ?? null };
      row.batches += share;
      row.expectedYield = row.expectedYield !== null && packing?.expectedYield != null ? row.expectedYield + share * packing.expectedYield : null;
      groups.set(key, row);
    }
  }
  return [...groups.values()].map((row) => {
    const expectedYield = row.expectedYield === null ? null : Math.round(row.expectedYield);
    const shippers = expectedYield !== null && row.packPerShipper !== null && row.packPerShipper > 0 ? Math.floor(expectedYield / row.packPerShipper) : null;
    return { ...row, expectedYield, shippers, loose: shippers !== null && expectedYield !== null && row.packPerShipper !== null ? expectedYield - shippers * row.packPerShipper : null };
  }).sort((a, b) => a.market.localeCompare(b.market) || a.name.localeCompare(b.name) || a.packing.localeCompare(b.packing));
}
export function plannedProducts(rows: readonly PlanRow[]): PlannedProduct[] {
  const result = new Map<string, PlannedProduct>();
  for (const row of rows) { const item = result.get(row.productId) ?? { productId: row.productId, code: row.code, name: row.name, markets: new Set<string>(), batches: 0 }; item.markets.add(row.market); item.batches += row.batches; result.set(row.productId, item); }
  return [...result.values()];
}
export const planSheet = (rows: readonly PlanRow[]) => reportSheet("Production plan", rows, [
  { label: "Market", read: (r) => r.market }, { label: "Product", read: (r) => r.name }, { label: "Code", read: (r) => r.code }, { label: "Packing style", read: (r) => r.packing }, { label: "Batches", read: (r) => r.batches },
  { label: "Expected yield", read: (r) => r.expectedYield }, { label: "Packs per shipper", read: (r) => r.packPerShipper }, { label: "Shippers", read: (r) => r.shippers }, { label: "Loose packs", read: (r) => r.loose }, { label: "Unit price", read: (r) => r.unitPrice }, { label: "Price unit", read: (r) => r.priceUnit },
]);
