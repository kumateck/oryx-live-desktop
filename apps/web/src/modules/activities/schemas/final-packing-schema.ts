import { z } from "zod";

const positive = (message: string) => z.number({ message }).finite(message).positive(message);
const count = (label: string) => z.number({ message: `Enter the ${label}, or 0` }).finite().int(`The ${label} must be a whole number`).min(0, `The ${label} cannot be negative`).max(Number.MAX_SAFE_INTEGER);

export const finalPackingFormSchema = z.object({
  received: positive("Enter how much was received"),
  averageFilled: positive("Enter the average fill"),
  actualPacked: count("actual quantity packed").positive("Enter the actual quantity packed"),
  qcSample: count("QC sample"), retained: count("retained sample"), stability: count("stability sample"),
  reason: z.string().trim().nullish(),
});
export type FinalPackingFormValues = z.infer<typeof finalPackingFormSchema>;

const text = z.string().nullish().transform((value) => value?.trim() ?? "");
const amount = z.number().finite().nonnegative();

/** The packaging materials issued to the batch on its stock requisition. */
export const issuedPackagingSchema = z.object({ items: z.array(z.object({
  material: z.object({ id: z.string().min(1), name: text, code: text }), uoM: z.object({ id: z.string().nullish(), symbol: text }).nullish(), quantity: amount,
})) }).nullish().transform((value) => (value?.items ?? []).map((item) => ({
  materialId: item.material.id, name: item.material.name || "Unnamed material", code: item.material.code, unit: item.uoM?.symbol || null, unitId: item.uoM?.id ?? null, quantity: item.quantity })));

export const extraIssuedSchema = z.array(z.object({ material: z.object({ id: z.string().min(1) }), quantity: amount,
  uoM: z.object({ id: z.string().nullish() }).nullish() })).nullish()
  .transform((value) => (value ?? []).map((item) => ({ materialId: item.material.id, quantity: item.quantity, unitId: item.uoM?.id ?? null })));

/** The batch record's packing style, with what the yield section needs from it. */
export const packingSourceSchema = z.object({
  batchNumber: z.string().nullish(), manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish(),
  productionScheduleProduct: z.object({ productPacking: z.object({
    id: z.string().nullish(), name: text, packPerShipper: z.number().nullish(), expectedYield: z.number().nullish(), basePackingUoM: z.object({ name: z.string().nullish() }).nullish(),
  }).nullish() }).nullish(),
}).transform((record) => { const packing = record.productionScheduleProduct?.productPacking; return {
  batchNumber: record.batchNumber ?? null, manufacturingDate: record.manufacturingDate ?? null, expiryDate: record.expiryDate ?? null,
  packing: packing?.id ? { id: packing.id, name: packing.name || "Unnamed style", packsPerShipper: packing.packPerShipper && packing.packPerShipper > 0 ? packing.packPerShipper : null,
    expectedYield: packing.expectedYield ?? 0, unitName: packing.basePackingUoM?.name ?? null } : null,
}; });

/** A final packing already recorded for the batch. */
export const recordedPackingSchema = z.object({
  id: z.string().min(1), createdAt: z.string().nullish(), totalQuantityPacked: amount, nUmberOfFullShipperPacked: amount, leftOver: amount, numberOfBottlesPerShipper: amount,
  yieldTotalQuantityPacked: amount, totalGainOrLoss: z.number().finite(), expectedYield: amount, percentageVarianceDescription: z.string().nullish(),
}).transform((value) => ({ id: value.id, createdAt: value.createdAt ?? null, totalPacked: value.totalQuantityPacked, fullShippers: value.nUmberOfFullShipperPacked, leftOver: value.leftOver,
  perShipper: value.numberOfBottlesPerShipper, actualPacked: value.yieldTotalQuantityPacked, gainOrLoss: value.totalGainOrLoss, expected: value.expectedYield, reason: value.percentageVarianceDescription?.trim() || null }));
export type RecordedPacking = z.infer<typeof recordedPackingSchema>;
