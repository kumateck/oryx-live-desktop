import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);

/** A batch of a material sent to the department's store, waiting to be put on shelves. */
export const distributedRowsSchema = z.array(z.object({
  id: z.string().nullish(), createdAt: z.string().nullish(), quantity: amount, warehouse: z.object({ name: text }).nullish(), uoM: z.object({ id: z.string().nullish(), symbol: text }).nullish(),
  materialBatch: z.object({ id: z.string().nullish(), batchNumber: text, expiryDate: z.string().nullish(), material: z.object({ code: text, name: text }).nullish() }).nullish(),
})).nullish().transform((value) => (value ?? []).flatMap((entry) => entry.id ? [{
  id: entry.id, batchId: entry.materialBatch?.id ?? null, batchNumber: entry.materialBatch?.batchNumber ?? null, materialName: entry.materialBatch?.material?.name ?? "Unnamed material",
  materialCode: entry.materialBatch?.material?.code ?? null, expiryDate: entry.materialBatch?.expiryDate ?? null, quantity: entry.quantity, unit: entry.uoM?.symbol ?? null, unitId: entry.uoM?.id ?? null,
  store: entry.warehouse?.name ?? null, receivedAt: entry.createdAt ?? null,
}] : []));
export type DistributedStock = z.infer<typeof distributedRowsSchema>[number];
