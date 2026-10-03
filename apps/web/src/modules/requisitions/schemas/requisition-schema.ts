import { z } from "zod";
import type { RequisitionStatus, RequisitionType } from "../lib/requisition-status";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const status = z.number().nullish().transform((value): RequisitionStatus => value === 1 || value === 2 || value === 3 || value === 4 ? value : 0);
const type = z.number().nullish().transform((value): RequisitionType => value === 1 || value === 2 ? value : 0);
const named = z.object({ id: z.string().nullish(), name: text }).nullish();

const item = z.object({
  id: z.string().nullish(), quantity: amount, status,
  material: z.object({ id: z.string().nullish(), code: text, name: text }).nullish(),
  uoM: z.object({ id: z.string().nullish(), symbol: text }).nullish(),
});
const requisition = z.object({
  id: z.string().min(1), code: text, requisitionType: type, status, approved: z.boolean().nullish(), comments: text,
  requestedBy: named, department: named, createdAt: z.string().nullish(), expectedDelivery: z.string().nullish(), items: z.array(item).nullish(),
  productionScheduleProduct: z.object({ product: z.object({ name: text }).nullish() }).nullish(),
});

function read(value: z.infer<typeof requisition>) {
  return {
    id: value.id, code: value.code ?? "No number", type: value.requisitionType, status: value.status, approved: value.approved === true, comments: value.comments,
    requestedBy: value.requestedBy?.name ?? null, department: value.department?.name ?? null, createdAt: value.createdAt ?? null, expectedDelivery: value.expectedDelivery ?? null,
    product: value.productionScheduleProduct?.product?.name ?? null,
    items: (value.items ?? []).map((line, index) => ({
      id: line.id ?? `line-${index}`, materialId: line.material?.id ?? null, materialName: line.material?.name ?? "Unnamed material", materialCode: line.material?.code ?? null,
      quantity: line.quantity, unit: line.uoM?.symbol ?? null, unitId: line.uoM?.id ?? null, status: line.status,
    })),
  };
}

export const requisitionSchema = requisition.transform(read);
/** A page of requisitions. One the app cannot read is left out rather than failing the whole page. */
export const requisitionRowsSchema = z.array(z.unknown()).nullish().transform((value) => (value ?? []).flatMap((entry) => {
  const parsed = requisitionSchema.safeParse(entry);
  return parsed.success ? [parsed.data] : [];
}));
export type Requisition = z.infer<typeof requisitionSchema>;
export type RequisitionLine = Requisition["items"][number];

/** A material the department keeps, as offered when raising a purchase requisition. Quantities are in the material's stored unit. */
export const pickRowsSchema = z.array(z.object({
  material: z.object({ id: z.string().nullish(), code: text, name: text, totalStock: amount, materialCategory: z.object({ name: text }).nullish() }).nullish(),
  uoM: z.object({ id: z.string().nullish(), symbol: text }).nullish(),
  warehouseStock: amount, reOrderLevel: amount, minimumStockLevel: amount, maximumStockLevel: amount, expiredQuantity: amount,
})).nullish().transform((value) => (value ?? []).flatMap((entry) => entry.material?.id ? [{
  id: entry.material.id, code: entry.material.code, name: entry.material.name ?? "Unnamed material", category: entry.material.materialCategory?.name ?? null,
  unit: entry.uoM?.symbol ?? null, unitId: entry.uoM?.id ?? null, stock: entry.warehouseStock,
  // What the rest of the company holds: everything, less what is already in this department's warehouse.
  elsewhere: Math.max(entry.material.totalStock - entry.warehouseStock, 0),
  reorder: entry.reOrderLevel, minimum: entry.minimumStockLevel, maximum: entry.maximumStockLevel, expired: entry.expiredQuantity,
}] : []));
export type PickRow = z.infer<typeof pickRowsSchema>[number];

export const categoryOptionsSchema = z.array(z.object({ id: z.string().nullish(), name: text })).nullish()
  .transform((value) => (value ?? []).flatMap((entry) => entry.id && entry.name ? [{ value: entry.id, label: entry.name }] : []));

export const purchaseRequisitionFormSchema = z.object({
  code: z.string().trim().min(1, "Enter the requisition number"),
  expectedDelivery: z.date().nullish(),
  comments: z.string().trim().max(2000, "Keep the remarks under 2,000 characters").nullish(),
});
export type PurchaseRequisitionFormValues = z.infer<typeof purchaseRequisitionFormSchema>;
