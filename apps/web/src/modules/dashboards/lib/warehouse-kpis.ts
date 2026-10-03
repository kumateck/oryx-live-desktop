import { z } from "zod";
import { toLargestUnit } from "@/shared/units/quantity";

const count = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const text = z.string().nullish().transform((value) => value?.trim() || null);
const list = <T extends z.ZodType>(item: T) => z.array(item).nullish().transform((value) => value ?? []);
/** Reads a report leniently: a report the server sent in an unexpected shape reads as empty rather than breaking the page. */
export function readList<T extends z.ZodType>(schema: T, data: unknown): z.infer<T> { const parsed = schema.safeParse(data ?? []); return parsed.success ? parsed.data : schema.parse([]); }

export const capacitySchema = list(z.object({ department: text, warehouse: text, warehouseType: z.number().nullish(), totalShelves: count, occupiedShelves: count, availableShelves: count, utilisationPercentage: count }));
export const dockSchema = list(z.object({ averageHours: count, medianHours: count, totalRecords: count, period: text }));
export const transferSchema = list(z.object({ totalTransfers: count, pending: count, approved: count, issued: count }));
export const receivingSchema = list(z.object({ pending: count, arrived: count, checked: count, grnGenerated: count, distributed: count, assigned: count, total: count }));
export const expirySchema = list(z.object({ expiryWindow: text, batchCount: count, totalQuantity: z.union([z.string(), z.number()]).nullish(), uom: text }));
export const reorderSchema = list(z.object({ department: text, material: text, materialCode: text, currentStock: count, reorderLevel: count, shortfall: count, uom: text }));
export const swapSchema = list(z.object({ period: text, pending: count, approved: count, rejected: count, total: count }));
export const movementSchema = list(z.object({ period: text, newPutaways: count, adjustments: count, totalMovements: count }));
export const freshnessSchema = list(z.object({ source: text, recordCount: count, lastChangedAt: text }));

const sum = <T,>(items: readonly T[], pick: (item: T) => number) => items.reduce((total, item) => total + pick(item), 0);

/** Shelves across every warehouse in scope, and the share of them in use. */
export function summariseCapacity(items: z.infer<typeof capacitySchema>) {
  const totalShelves = sum(items, (item) => item.totalShelves);
  const occupiedShelves = sum(items, (item) => item.occupiedShelves);
  return { totalShelves, occupiedShelves, availableShelves: sum(items, (item) => item.availableShelves), utilisation: totalShelves ? (occupiedShelves / totalShelves) * 100 : 0 };
}

/**
 * The average is weighted by how many receipts each warehouse had. A median cannot be combined across
 * warehouses, so it is only given when exactly one warehouse is in scope.
 */
export function summariseDockToStock(items: z.infer<typeof dockSchema>) {
  const totalRecords = sum(items, (item) => item.totalRecords);
  return { totalRecords, averageHours: totalRecords ? sum(items, (item) => item.averageHours * item.totalRecords) / totalRecords : 0, medianHours: items.length === 1 ? items[0]!.medianHours : null };
}

/** The server does not report rejected transfers; they are what is left of the total. */
export function summariseTransfers(items: z.infer<typeof transferSchema>) {
  const total = sum(items, (item) => item.totalTransfers), pending = sum(items, (item) => item.pending), approved = sum(items, (item) => item.approved), issued = sum(items, (item) => item.issued);
  return { total, pending, approved, issued, rejected: Math.max(0, total - pending - approved - issued), fulfilment: total ? (issued / total) * 100 : 0 };
}

export function summariseReceiving(items: z.infer<typeof receivingSchema>) {
  return { pending: sum(items, (item) => item.pending), arrived: sum(items, (item) => item.arrived), checked: sum(items, (item) => item.checked), grnGenerated: sum(items, (item) => item.grnGenerated),
    distributed: sum(items, (item) => item.distributed), assigned: sum(items, (item) => item.assigned), total: sum(items, (item) => item.total) };
}
export function summariseSwaps(items: z.infer<typeof swapSchema>) {
  return { pending: sum(items, (item) => item.pending), approved: sum(items, (item) => item.approved), rejected: sum(items, (item) => item.rejected), total: sum(items, (item) => item.total), period: items[0]?.period ?? null };
}
export function summariseMovements(items: z.infer<typeof movementSchema>) {
  return { newPutaways: sum(items, (item) => item.newPutaways), adjustments: sum(items, (item) => item.adjustments), totalMovements: sum(items, (item) => item.totalMovements), period: items[0]?.period ?? null };
}

/** The server's names for the expiry windows, soonest first. */
export const expiryWindows = ["≤ 30 days", "31–60 days", "61–90 days", "> 90 days"] as const;
/** Batches and quantities in each expiry window. Quantities in different units are kept apart, never added together. */
export function summariseExpiry(items: z.infer<typeof expirySchema>) {
  return expiryWindows.map((label) => {
    const rows = items.filter((item) => item.expiryWindow === label);
    const quantities = new Map<string, number>();
    for (const row of rows) { const amount = Number(row.totalQuantity ?? 0); quantities.set(row.uom ?? "units", (quantities.get(row.uom ?? "units") ?? 0) + (Number.isFinite(amount) ? amount : 0)); }
    return { label, batches: sum(rows, (row) => row.batchCount), quantities: [...quantities].map(([uom, quantity]) => ({ uom, quantity })) };
  });
}

/** A system-calculated quantity in the largest unit of its family. */
export const quantityText = (value: number, uom: string | null) => toLargestUnit(value, uom, "calculated")?.text ?? `${value.toLocaleString()} ${uom ?? ""}`.trim();
/** The alerts with the largest shortfall first. */
export const byShortfall = (items: z.infer<typeof reorderSchema>) => [...items].sort((a, b) => b.shortfall - a.shortfall);

export const divisionOptions = [{ value: 0, label: "Beta-lactam" }, { value: 1, label: "Non-beta-lactam" }] as const;
export const warehouseTypeOptions = [{ value: 0, label: "Raw material storage" }, { value: 1, label: "Packaging storage" }, { value: 3, label: "Production" }] as const;
export interface WarehouseScope { division?: 0 | 1; warehouseType?: 0 | 1 | 3; warehouseId?: string }
