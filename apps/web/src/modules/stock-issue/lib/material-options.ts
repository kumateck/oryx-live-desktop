import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const date = z.string().nullish().transform((value) => value && new Date(value).getFullYear() >= 1900 ? value : null);
const material = z.object({ id: z.string().nullish(), name: text, code: text }).nullish();

const option = z.object({
  material, isMain: z.boolean().nullish(), isCurrent: z.boolean().nullish(), quantity: amount, unit: z.object({ symbol: text }).nullish(),
  available: amount, covers: z.boolean().nullish(), earliestExpiry: date,
  batches: z.array(z.object({ materialBatchId: z.string().nullish(), batchNumber: text, quantity: amount, expiry: date })).nullish(),
});
const line = z.object({
  requisitionItemId: z.string().nullish(), sourceMaterial: material, currentMaterialId: z.string().nullish(), revision: z.number().int().nullish(),
  canChange: z.boolean().nullish(), reason: text, options: z.array(option).nullish(),
});

/** The BOM lines of a stock requisition the store can issue as another material, as the backend describes them. */
export const materialOptionsSchema = z.array(line).transform((lines) => lines.flatMap((entry, index) => {
  if (!entry.sourceMaterial?.id || !entry.currentMaterialId) return [];
  const options = (entry.options ?? []).flatMap((item) => item.material?.id ? [{
    materialId: item.material.id, name: item.material.name ?? "Unnamed material", code: item.material.code,
    isMain: item.isMain === true, isCurrent: item.isCurrent === true, quantity: item.quantity, unit: item.unit?.symbol ?? null,
    available: item.available, covers: item.covers === true, earliestExpiry: item.earliestExpiry,
    batches: (item.batches ?? []).map((batch, position) => ({ key: `${batch.materialBatchId ?? "batch"}-${position}`, number: batch.batchNumber, quantity: batch.quantity, expires: batch.expiry })),
  }] : []);
  return [{ key: entry.requisitionItemId ?? `line-${index}`, sourceMaterialId: entry.sourceMaterial.id, sourceName: entry.sourceMaterial.name ?? "Unnamed material",
    currentMaterialId: entry.currentMaterialId, revision: entry.revision ?? 0, canChange: entry.canChange === true, locked: entry.reason, options }];
}));
export type MaterialOptionLine = z.output<typeof materialOptionsSchema>[number];
export type MaterialOption = MaterialOptionLine["options"][number];

/** Raw-material lines only: the store's choice between a BOM material and its substitutes. */
export const choosePermission = "CanChooseRawMaterialRequisitionSubstitute";

/** The option that expires first among those with enough stock: the store's usual first pick. */
export function earliestCovering(line: MaterialOptionLine): MaterialOption | null {
  const covering = line.options.filter((item) => item.covers);
  const time = (item: MaterialOption) => item.earliestExpiry ? new Date(item.earliestExpiry).getTime() : Number.POSITIVE_INFINITY;
  return [...covering].sort((a, b) => time(a) - time(b))[0] ?? null;
}
