import { z } from "zod";
import { monthOfIso } from "@/shared/batch-dates/batch-dates";
import { toLargestUnit } from "@/shared/units/quantity";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const product = z.object({ id: z.string().nullish(), code: text, name: text, department: z.object({ name: text }).nullish(), baseUoM: z.object({ symbol: text }).nullish() }).nullish();

/** A batch manufacturing record production has asked QA to issue. Issued once the server records an issue date. */
export const bmrSchema = z.object({
  id: z.string().min(1), createdAt: z.string().nullish(), batchNumber: text, manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish(),
  batchQuantity: amount, issuedDate: z.string().nullish(),
  productionScheduleProduct: z.object({ id: z.string().nullish(), productionSchedule: z.object({ code: text }).nullish(), product,
    productPacking: z.object({ id: z.string().nullish(), name: text }).nullish() }).nullish(),
}).transform((item) => ({
  id: item.id, requestedAt: item.createdAt ?? null, batchNumber: item.batchNumber, made: monthOfIso(item.manufacturingDate), expires: monthOfIso(item.expiryDate),
  quantity: item.batchQuantity, unit: item.productionScheduleProduct?.product?.baseUoM?.symbol ?? null, issuedAt: item.issuedDate ?? null,
  scheduleProductId: item.productionScheduleProduct?.id ?? null, schedule: item.productionScheduleProduct?.productionSchedule?.code ?? null,
  productCode: item.productionScheduleProduct?.product?.code ?? null, productName: item.productionScheduleProduct?.product?.name ?? null,
  department: item.productionScheduleProduct?.product?.department?.name ?? null,
  packingId: item.productionScheduleProduct?.productPacking?.id ?? null, packing: item.productionScheduleProduct?.productPacking?.name ?? null,
}));
export const bmrRowsSchema = z.array(bmrSchema);
export type Bmr = z.infer<typeof bmrSchema>;

/** Batch size as the person will edit it: the largest unit that keeps the number at one or more. */
export const bmrSize = (bmr: Bmr) => { const shown = toLargestUnit(bmr.quantity, bmr.unit); return { value: shown?.value ?? bmr.quantity, unit: shown?.unit ?? bmr.unit ?? "" }; };

/** One material the batch needs, and what the warehouse and the rest of the company hold of it. */
export const bmrMaterialsSchema = z.array(z.object({
  material: z.object({ id: z.string().nullish(), code: text, name: text, totalStock: amount }).nullish(),
  materialDepartment: z.object({ uoM: z.object({ symbol: text }).nullish() }).nullish(),
  quantityNeeded: amount, quantityOnHand: amount,
})).nullish().transform((rows) => (rows ?? []).map((row, index) => ({
  id: `${row.material?.id ?? "material"}-${index}`, materialId: row.material?.id ?? null, code: row.material?.code ?? null, name: row.material?.name ?? "Unnamed material",
  unit: row.materialDepartment?.uoM?.symbol ?? null, needed: row.quantityNeeded, onHand: row.quantityOnHand, elsewhere: row.material?.totalStock ?? 0,
})));
export type BmrMaterial = z.infer<typeof bmrMaterialsSchema>[number];
