import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const date = z.string().nullish().transform((value) => value && new Date(value).getFullYear() >= 1900 ? value : null);
const shelf = z.object({ quantity: amount, warehouseLocationShelf: z.object({ name: text, code: text, warehouseLocationRack: z.object({ name: text }).nullish() }).nullish() });

const batch = z.object({ id: z.string().nullish(), batchNumber: text, arNumber: text, manufacturingDate: date, expiryDate: date, totalQuantity: amount, remainingQuantity: amount, uoM: z.object({ symbol: text }).nullish(),
  material: z.object({ name: text, code: text }).nullish(), supplierName: text, manufacturerName: text, shelves: z.array(shelf).nullish() });
/** A batch of material with its expiry date and where it sits. */
export const expiryRowsSchema = z.array(batch).nullish().transform((value) => (value ?? []).flatMap((entry, index) => [{ id: entry.id ?? `batch-${index}`, batchNumber: entry.batchNumber, arNumber: entry.arNumber, made: entry.manufacturingDate, expires: entry.expiryDate,
  total: entry.totalQuantity, remaining: entry.remainingQuantity, unit: entry.uoM?.symbol ?? null, materialName: entry.material?.name ?? "Unnamed material", materialCode: entry.material?.code ?? null, supplier: entry.supplierName, manufacturer: entry.manufacturerName,
  shelves: (entry.shelves ?? []).flatMap((item) => { const name = [item.warehouseLocationShelf?.warehouseLocationRack?.name, item.warehouseLocationShelf?.name ?? item.warehouseLocationShelf?.code].filter(Boolean).join(" / "); return name ? [name] : []; }) }]));
export type ExpiryBatch = z.infer<typeof expiryRowsSchema>[number];

/** A calendar day as the server's date filter takes it. */
export const apiDay = (value: Date) => `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
/** The month today falls in, as the month range picker holds it. */
export function monthOf(today: Date = new Date()): { from: string; to: string } {
  const month = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;
  return { from: month, to: month };
}
/** Whole days from today until a batch expires; negative once it has. */
export function daysToExpiry(expires: string | null, today: Date = new Date()): number | null {
  if (!expires) return null;
  const date = new Date(expires);
  if (Number.isNaN(date.getTime())) return null;
  const day = (value: Date) => Date.UTC(value.getFullYear(), value.getMonth(), value.getDate());
  return Math.round((day(date) - day(today)) / 86_400_000);
}
