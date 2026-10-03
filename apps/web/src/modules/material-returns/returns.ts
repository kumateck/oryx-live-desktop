import { z } from "zod";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

export const returnsPath = "/warehouse/material-returns";
export const returnPath = (id: string) => `${returnsPath}/${id}/details`;
export const audit = { module: "Warehouse", subModule: "Material Returns Note" } as const;

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const unit = z.object({ id: z.string().nullish(), symbol: text }).nullish();
const material = z.object({ name: text, code: text, kind: z.number().nullish() }).nullish();
const batch = z.object({ id: z.string().nullish(), batchNumber: text, material, uoM: unit }).nullish();

const note = z.object({ id: z.string().nullish(), returnDate: z.string().nullish(), batchNumber: text, isFullReturn: z.boolean().nullish(), status: z.number().nullish(),
  createdBy: z.object({ firstName: text, lastName: text, department: z.object({ name: text }).nullish() }).nullish(),
  productionScheduleProduct: z.object({ product: z.object({ name: text, code: text }).nullish(), productionSchedule: z.object({ code: text }).nullish() }).nullish(),
  fullReturns: z.array(z.object({ returned: z.boolean().nullish(), materialBatchReservedQuantity: z.object({ quantity: amount, materialBatch: batch }).nullish() })).nullish(),
  partialReturns: z.array(z.object({ returned: z.boolean().nullish(), quantity: amount, material, materialBatch: batch, uoM: unit })).nullish() });

function read(entry: z.infer<typeof note>) {
  if (!entry.id) return null;
  const full = entry.isFullReturn === true;
  // A full return sends back everything that was reserved; a partial one names its own quantities.
  const lines = full ? (entry.fullReturns ?? []).map((item) => ({ returned: item.returned === true, quantity: item.materialBatchReservedQuantity?.quantity ?? 0, batch: item.materialBatchReservedQuantity?.materialBatch, material: item.materialBatchReservedQuantity?.materialBatch?.material, unit: item.materialBatchReservedQuantity?.materialBatch?.uoM }))
    : (entry.partialReturns ?? []).map((item) => ({ returned: item.returned === true, quantity: item.quantity, batch: item.materialBatch, material: item.material ?? item.materialBatch?.material, unit: item.uoM ?? item.materialBatch?.uoM }));
  return { id: entry.id, returnDate: entry.returnDate ?? null, batchNumber: entry.batchNumber, full, product: entry.productionScheduleProduct?.product?.name ?? null, productCode: entry.productionScheduleProduct?.product?.code ?? null,
    schedule: entry.productionScheduleProduct?.productionSchedule?.code ?? null, returnedBy: [entry.createdBy?.firstName, entry.createdBy?.lastName].filter(Boolean).join(" ") || null, department: entry.createdBy?.department?.name ?? null,
    lines: lines.map((line, index) => ({ key: `${line.batch?.id ?? "line"}-${index}`, batchId: line.batch?.id ?? null, batchNumber: line.batch?.batchNumber ?? null, materialName: line.material?.name ?? "Unnamed material", materialCode: line.material?.code ?? null,
      kind: (line.material?.kind === 1 ? 1 : 0) as MaterialKind, quantity: line.quantity, unit: line.unit?.symbol ?? null, unitId: line.unit?.id ?? null, returned: line.returned })) };
}
/** Materials production did not use on a batch, sent back to the store to be put on shelves again. */
export const returnNoteSchema = note.transform(read);
export const returnNoteRowsSchema = z.array(note).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = read(entry); return row ? [row] : []; }));
export type ReturnNote = z.infer<typeof returnNoteRowsSchema>[number];
export type ReturnLine = ReturnNote["lines"][number];

export type Restocked = "none" | "part" | "all";
/** How much of a note is back on shelves. */
export function restocked(note: Pick<ReturnNote, "lines">): Restocked {
  const done = note.lines.filter((line) => line.returned).length;
  return note.lines.length > 0 && done === note.lines.length ? "all" : done > 0 ? "part" : "none";
}
export const restockedLabels: Record<Restocked, string> = { none: "Waiting to be restocked", part: "Partly restocked", all: "Restocked" };
