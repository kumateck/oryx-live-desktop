import { z } from "zod";
import { batchRowsSchema } from "@/shared/material-batches/received-batch";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const item = z.object({
  id: text, quantity: z.number().nullish(), quantityDistributed: z.number().nullish(),
  warehouse: z.object({ id: text, name: text }).nullish(),
  uom: z.object({ id: text, symbol: text }).nullish(),
  requisitionItem: z.object({ material: z.object({ id: text }).nullish(), uoM: z.object({ id: text, symbol: text }).nullish() }).nullish(),
});
const checklist = z.object({
  material: z.object({ id: text, kind: z.number().nullish() }).nullish(),
  distributedRequisitionMaterial: z.object({ distributedRequisitionItems: z.array(item).nullish() }).nullish(),
});
const grn = z.object({ id: z.string().nullish(), grnNumber: text, createdAt: z.string().nullish(), carrierName: text, vehicleNumber: text, remarks: text, declarationNumber: text, status: z.number().nullish(), materialBatches: batchRowsSchema, checkLists: z.array(checklist).nullish() });

/** Batch Material is CollectionItemDto; the full material type lives on the GRN checklist. */
function resolvedBatches(entry: z.infer<typeof grn>) {
  const kinds = new Map<string, Set<number>>();
  const remember = (id: string | null, kind: number | null | undefined) => {
    if (!id || kind === null || kind === undefined) return;
    const key = id.toLowerCase();
    const values = kinds.get(key) ?? new Set<number>();
    values.add(kind);
    kinds.set(key, values);
  };
  for (const list of entry.checkLists ?? []) remember(list.material?.id ?? null, list.material?.kind);
  for (const batch of entry.materialBatches) remember(batch.materialId, batch.materialKind);
  return entry.materialBatches.map((batch) => {
    const values = kinds.get(batch.materialId?.toLowerCase() ?? "");
    const kind = values?.size === 1 ? values.values().next().value : null;
    return { ...batch, materialKind: kind === 0 || kind === 1 ? kind : null };
  });
}

function read(entry: z.infer<typeof grn>) {
  if (!entry.id) return null;
  return { id: entry.id, number: entry.grnNumber ?? "No number", createdAt: entry.createdAt ?? null, carrier: entry.carrierName, vehicle: entry.vehicleNumber, remarks: entry.remarks, declaration: entry.declarationNumber,
    status: entry.status ?? null, batches: resolvedBatches(entry), requests: (entry.checkLists ?? []).flatMap((list) =>
      (list.distributedRequisitionMaterial?.distributedRequisitionItems ?? []).map((request) => ({
        id: request.id, materialId: request.requisitionItem?.material?.id ?? list.material?.id ?? null,
        warehouseId: request.warehouse?.id ?? null, warehouseName: request.warehouse?.name ?? "Unnamed warehouse",
        quantity: request.quantity ?? null, distributed: request.quantityDistributed ?? null,
        unitId: request.uom?.id ?? request.requisitionItem?.uoM?.id ?? null,
        unit: request.uom?.symbol ?? request.requisitionItem?.uoM?.symbol ?? null,
      }))) };
}
/** A goods received note: the delivery it records and the batches it put into quarantine. */
export const grnSchema = grn.transform(read);
export const grnRowsSchema = z.array(grn).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = read(entry); return row ? [row] : []; }));
export type Grn = z.infer<typeof grnRowsSchema>[number];

export const distributionFormSchema = z.object({
  material: z.object({ value: z.uuid(), label: z.string() }).nullable()
    .refine((value): boolean => value !== null, "Choose an approved material"),
});
export type DistributionFormValues = z.infer<typeof distributionFormSchema>;
