import { z } from "zod";
import { utcBoundary } from "@/shared/format/date-boundary";
import { convertUnit, relatedUnits } from "@/shared/units/quantity";

export const adjustmentsPath = "/warehouse/stock-adjustments";
export const newAdjustmentPath = `${adjustmentsPath}/new`;
export const adjustmentPath = (id: string) => `${adjustmentsPath}/${id}`;
export const adjustmentPermissions = { view: "CanViewMaterialStockAdjustment", create: "CanCreateMaterialStockAdjustment" } as const;
export const audit = { module: "Warehouse", subModule: "Stock Adjustments" } as const;
/** What a count is made against. The numbers are the server's: a general-store item, one batch of a material on one shelf, or a finished goods transfer note. */
export type AdjustmentTarget = 0 | 1 | 2;
export const materialTarget = 1;
export const itemTarget = 0;
export const productTarget = 2;
export const targetTabs: readonly { value: AdjustmentTarget; label: string }[] = [{ value: 1, label: "Materials" }, { value: 0, label: "General store items" }, { value: 2, label: "Finished products" }];
export const targetLabel = (target: AdjustmentTarget) => targetTabs.find((tab) => tab.value === target)?.label ?? "Materials";
/** The target named in the address (`?target=`), materials when it names none. */
export function parseTarget(value: string | null): AdjustmentTarget {
  return value === "0" ? 0 : value === "2" ? 2 : 1;
}
export const adjustmentsPathFor = (target: AdjustmentTarget) => `${adjustmentsPath}?target=${target}`;
export const newAdjustmentPathFor = (target: AdjustmentTarget) => `${newAdjustmentPath}?target=${target}`;
/** Why a count differs from the system. The numbers are the server's. */
export const reasons = [{ value: "0", label: "Physical count" }, { value: "1", label: "Damage" }, { value: "2", label: "Theft" }, { value: "3", label: "Expiry" }, { value: "4", label: "Data entry error" }, { value: "5", label: "Returned goods" }, { value: "6", label: "Other" }] as const;

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
/** A count sent for approval. */
export const adjustmentRowsSchema = z.array(z.object({ id: z.string().nullish(), adjustmentNumber: text, adjustmentDate: z.string().nullish(), linesProcessed: amount, approved: z.boolean().nullish() })).nullish()
  .transform((value) => (value ?? []).flatMap((entry) => entry.id ? [{ id: entry.id, number: entry.adjustmentNumber ?? "No number", date: entry.adjustmentDate ?? null, lines: entry.linesProcessed, approved: entry.approved === true }] : []));
export type Adjustment = z.infer<typeof adjustmentRowsSchema>[number];

/** A quantity of one batch on one shelf, as the count is made against it. */
export const shelfStockSchema = z.array(z.object({ id: z.string().nullish(), quantity: amount, uoM: z.object({ symbol: text }).nullish(), materialBatch: z.object({ batchNumber: text, expiryDate: z.string().nullish() }).nullish(),
  warehouseLocationShelf: z.object({ name: text, code: text, warehouseLocationRack: z.object({ name: text }).nullish() }).nullish() })).nullish()
  .transform((value) => (value ?? []).flatMap((entry) => entry.id ? [{ id: entry.id, quantity: entry.quantity, unit: entry.uoM?.symbol ?? null, batchNumber: entry.materialBatch?.batchNumber ?? null,
    shelf: [entry.warehouseLocationShelf?.warehouseLocationRack?.name, entry.warehouseLocationShelf?.name ?? entry.warehouseLocationShelf?.code].filter(Boolean).join(" / ") || "Unnamed shelf" }] : []));
export type ShelfStock = z.infer<typeof shelfStockSchema>[number];

/** Counts are typed in the largest unit of the stock's family and sent in the unit the shelf record is kept in. */
export const countUnit = (unit: string | null) => relatedUnits(unit).at(-1) ?? unit ?? "";
export const systemInCountUnit = (stock: Pick<ShelfStock, "quantity" | "unit">) => convertUnit(stock.quantity, stock.unit, countUnit(stock.unit)) ?? stock.quantity;
export const countInStoredUnit = (counted: number, unit: string | null) => convertUnit(counted, countUnit(unit), unit) ?? counted;

const option = z.object({ value: z.string().min(1), label: z.string() });
const chosen = (message: string) => option.nullable().refine((value): boolean => Boolean(value), message);
const line = z.object({ material: chosen("Choose the material"), stock: chosen("Choose the batch and shelf that was counted"), counted: z.number({ message: "Enter what was counted" }).refine((value) => value >= 0, "A count cannot be negative"),
  reason: chosen("Choose the reason"), notes: z.string().trim().max(500, "Keep the note under 500 characters"),
  // Filled in when the stock is chosen: what the system holds there, and in which unit.
  system: z.number(), unit: z.string().nullable() });
const header = {
  number: z.string().trim().min(1, "Enter the adjustment number").max(50, "Keep the number under 50 characters"),
  date: z.date({ message: "Choose the date of the count" }).nullable().refine((value): boolean => Boolean(value), "Choose the date of the count").refine((value) => !value || value.getTime() <= Date.now() + 86_400_000, "The count cannot be dated in the future"),
};
export const adjustmentFormSchema = z.object({
  ...header,
  lines: z.array(line).min(1, "Add at least one line"),
}).superRefine((values, context) => {
  const seen = new Set<string>();
  values.lines.forEach((entry, index) => {
    if (entry.stock) { if (seen.has(entry.stock.value)) context.addIssue({ code: "custom", path: ["lines", index, "stock"], message: "This batch on this shelf is already on another line" }); seen.add(entry.stock.value); }
    // A count that agrees with the system is not an adjustment.
    if (entry.stock && Number.isFinite(entry.counted) && Math.abs(countInStoredUnit(entry.counted, entry.unit) - entry.system) < 1e-9) context.addIssue({ code: "custom", path: ["lines", index, "counted"], message: "The count is the same as the system's; there is nothing to adjust" });
    // "Other" says nothing by itself.
    if (entry.reason?.value === "6" && !entry.notes) context.addIssue({ code: "custom", path: ["lines", index, "notes"], message: "Say what the reason is" });
  });
});
export type AdjustmentFormValues = z.infer<typeof adjustmentFormSchema>;
export const emptyLine = (): AdjustmentFormValues["lines"][number] => ({ material: null, stock: null, counted: Number.NaN, reason: null, notes: "", system: 0, unit: null });

/** The request as the server takes it. */
export function adjustmentRequest(values: AdjustmentFormValues) {
  return { adjustmentNumber: values.number, adjustmentDate: utcBoundary(values.date ?? new Date()), targetType: materialTarget as 1,
    lines: values.lines.flatMap((entry) => entry.stock && entry.reason ? [{ modelId: entry.stock.value, physicalCount: countInStoredUnit(entry.counted, entry.unit), reasonCode: Number(entry.reason.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6, notes: entry.notes || null }] : []) };
}
/** A number for a new adjustment. Only a suggestion; it can be changed. */
export const suggestedNumber = (now: Date = new Date()) => `ADJ-${String(now.getFullYear()).slice(-2)}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}-${String(now.getTime()).slice(-4)}`;

/** A line counted against a general-store item or a finished goods transfer note: the record, and what the system holds of it. */
const recordLine = z.object({ record: chosen("Choose what was counted"), counted: z.number({ message: "Enter what was counted" }).refine((value) => value >= 0, "A count cannot be negative"),
  reason: chosen("Choose the reason"), notes: z.string().trim().max(500, "Keep the note under 500 characters"), system: z.number(), unit: z.string().nullable() });
export const recordAdjustmentFormSchema = (target: 0 | 2) => z.object({ ...header, lines: z.array(recordLine).min(1, "Add at least one line") }).superRefine((values, context) => {
  const seen = new Set<string>();
  values.lines.forEach((entry, index) => {
    if (entry.record) { if (seen.has(entry.record.value)) context.addIssue({ code: "custom", path: ["lines", index, "record"], message: "This is already on another line" }); seen.add(entry.record.value); }
    // The server keeps an item's quantity as a whole number and drops any fraction when the adjustment is applied.
    if (target === itemTarget && Number.isFinite(entry.counted) && !Number.isInteger(entry.counted)) context.addIssue({ code: "custom", path: ["lines", index, "counted"], message: "Items are counted in whole units" });
    if (entry.record && Number.isFinite(entry.counted) && Math.abs(entry.counted - entry.system) < 1e-9) context.addIssue({ code: "custom", path: ["lines", index, "counted"], message: "The count is the same as the system's; there is nothing to adjust" });
    if (entry.reason?.value === "6" && !entry.notes) context.addIssue({ code: "custom", path: ["lines", index, "notes"], message: "Say what the reason is" });
  });
});
export type RecordAdjustmentFormValues = z.infer<ReturnType<typeof recordAdjustmentFormSchema>>;
export const emptyRecordLine = (): RecordAdjustmentFormValues["lines"][number] => ({ record: null, counted: Number.NaN, reason: null, notes: "", system: 0, unit: null });

/** Items and transfer notes are counted in the unit the server keeps them in, so nothing is converted. */
export function recordAdjustmentRequest(values: RecordAdjustmentFormValues, target: 0 | 2) {
  return { adjustmentNumber: values.number, adjustmentDate: utcBoundary(values.date ?? new Date()), targetType: target,
    lines: values.lines.flatMap((entry) => entry.record && entry.reason ? [{ modelId: entry.record.value, physicalCount: entry.counted, reasonCode: Number(entry.reason.value) as 0 | 1 | 2 | 3 | 4 | 5 | 6, notes: entry.notes || null }] : []) };
}

/** What a count can be made against, with what the system holds of it. */
export interface CountableRecord { value: string; label: string; system: number; unit: string | null }
const itemsSchema = z.array(z.object({ id: z.string().nullish(), name: text, code: text, availableQuantity: amount, unitOfMeasure: z.object({ symbol: text }).nullish() })).nullish();
export function itemRecords(data: unknown): CountableRecord[] {
  const parsed = itemsSchema.safeParse(data);
  return parsed.success ? (parsed.data ?? []).flatMap((item) => item.id ? [{ value: item.id, label: [item.code, item.name ?? "Unnamed item"].filter(Boolean).join(" · "), system: item.availableQuantity, unit: item.unitOfMeasure?.symbol ?? null }] : []) : [];
}
const notesSchema = z.array(z.object({ id: z.string().nullish(), transferNoteNumber: text, totalQuantity: amount, uoM: z.object({ symbol: text }).nullish(),
  batchManufacturingRecord: z.object({ batchNumber: text, productionScheduleProduct: z.object({ product: z.object({ name: text }).nullish() }).nullish() }).nullish() })).nullish();
export function transferNoteRecords(data: unknown): CountableRecord[] {
  const parsed = notesSchema.safeParse(data);
  return parsed.success ? (parsed.data ?? []).flatMap((note) => note.id ? [{ value: note.id,
    label: [note.transferNoteNumber ?? "No number", note.batchManufacturingRecord?.productionScheduleProduct?.product?.name, note.batchManufacturingRecord?.batchNumber ? `batch ${note.batchManufacturingRecord.batchNumber}` : null].filter(Boolean).join(" · "),
    system: note.totalQuantity, unit: note.uoM?.symbol ?? null }] : []) : [];
}
