import type { DomainEntitiesProductionSchedulesCreateProductionScheduleProduct as ScheduleProduct } from "@/shared/api/generated/production";
import { toLargestUnit } from "@/shared/units/quantity";

export const batchSizes = [{ value: "0", label: "Full" }, { value: "1", label: "Half" }] as const;
export const halfBatch = "1";

/** What the schedule form needs to know about a product: its full batch size and the unit it is measured in. */
export interface ProductFacts { fullBatchSize: number | null; unit: string | null }

/** The quantity of one batch, or null when the product has no full batch size to work from. */
export function batchQuantity(facts: ProductFacts | null, sizeType: string | null | undefined): number | null {
  if (!facts?.fullBatchSize || facts.fullBatchSize <= 0) return null;
  return sizeType === halfBatch ? facts.fullBatchSize / 2 : facts.fullBatchSize;
}

export interface ScheduleLine { productId: string; packingId: string; sizeType: string; marketTypeId: string | null; count: number; quantity: number }

/** One entry per batch: a line for three batches becomes three products on the schedule. */
export function toScheduleProducts(lines: readonly ScheduleLine[]): ScheduleProduct[] {
  return lines.flatMap((line) => Array.from({ length: line.count }, () => ({
    productId: line.productId, quantity: line.quantity, batchSize: line.sizeType === halfBatch ? 1 as const : 0 as const,
    productPackingId: line.packingId, marketTypeId: line.marketTypeId,
  })));
}

interface ScheduledProduct { productId: string | null; name: string; unit: string | null; quantity: number }

/** A schedule's batches summed up for the list: "Wormee (1,500 L) ×3". Batches of the same product and size are counted together. */
export function summarizeBatches(products: readonly ScheduledProduct[]): string[] {
  const groups = new Map<string, { label: string; count: number }>();
  for (const item of products) {
    const key = `${item.productId ?? item.name}::${item.quantity}`;
    const group = groups.get(key);
    if (group) { group.count += 1; continue; }
    const size = toLargestUnit(item.quantity, item.unit, "calculated")?.text;
    groups.set(key, { label: size ? `${item.name} (${size})` : item.name, count: 1 });
  }
  return [...groups.values()].map((group) => group.count > 1 ? `${group.label} ×${group.count}` : group.label);
}
