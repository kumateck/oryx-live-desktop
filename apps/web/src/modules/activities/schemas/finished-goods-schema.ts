import { z } from "zod";
import { packingLayout } from "@/shared/packing/packs";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);

/** The batch record with the packing style its finished goods are counted in. */
export const transferBatchRecordSchema = z.object({
  id: z.string().min(1), batchNumber: text, manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish(),
  productionScheduleProduct: z.object({ productPacking: z.object({
    id: z.string().nullish(), name: text, packPerShipper: z.number().nullish(),
    basePackingUoM: z.object({ id: z.string().nullish(), name: text, symbol: text }).nullish(),
    packingLists: z.array(z.object({ uom: z.object({ name: z.string().nullish(), symbol: z.string().nullish() }).nullish(), quantity: z.number().nullish(), order: z.number().nullish() })).nullish(),
  }).nullish() }).nullish(),
}).transform((record) => { const packing = record.productionScheduleProduct?.productPacking; return {
  id: record.id, batchNumber: record.batchNumber, manufacturingDate: record.manufacturingDate ?? null, expiryDate: record.expiryDate ?? null,
  packing: packing?.id ? { id: packing.id, name: packing.name ?? "Unnamed style", packsPerShipper: packing.packPerShipper && packing.packPerShipper > 0 ? packing.packPerShipper : null,
    unit: packing.basePackingUoM?.id ? { id: packing.basePackingUoM.id, name: packing.basePackingUoM.name ?? packing.basePackingUoM.symbol ?? "unit" } : null,
    /** What final packing counted into the store: the pack unit, e.g. "Outer Carton". */
    packName: packingLayout(packing).packName } : null,
}; });
export type TransferBatchRecord = z.infer<typeof transferBatchRecordSchema>;

export const finalPackingTotalsSchema = z.object({ totalQuantityPacked: amount, yieldTotalQuantityPacked: amount })
  .transform((value) => ({ packed: value.totalQuantityPacked, yieldPacked: value.yieldTotalQuantityPacked }));

export const transferNotesSchema = z.array(z.object({
  id: z.string().nullish(), transferNoteNumber: text, totalQuantity: amount, createdAt: z.string().nullish(), isPartial: z.boolean().nullish(), isFulfilled: z.boolean().nullish(), isApproved: z.boolean().nullish(),
})).nullish().transform((value) => (value ?? []).map((note, index) => ({
  id: note.id ?? `note-${index}`, number: note.transferNoteNumber, quantity: note.totalQuantity, createdAt: note.createdAt ?? null,
  state: note.isFulfilled ? "Received" : note.isApproved ? "Approved" : "Waiting to be received",
})));
export type TransferNote = z.infer<typeof transferNotesSchema>[number];

export const transferFormSchema = z.object({
  quantity: z.number({ message: "Enter the quantity to transfer" }).finite("Enter the quantity to transfer").positive("The quantity must be above zero"),
});
export type TransferFormValues = z.infer<typeof transferFormSchema>;
