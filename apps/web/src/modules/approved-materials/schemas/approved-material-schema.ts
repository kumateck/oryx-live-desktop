import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);

/** A material with stock that has passed quality control and can be issued. */
export const approvedMaterialRowsSchema = z.array(z.object({
  material: z.object({ id: z.string().nullish(), code: text, name: text, kind: z.number().nullish() }).nullish(),
  unitOfMeasure: z.object({ symbol: text }).nullish(), totalAvailableQuantity: amount, reservedQuantity: amount,
})).nullish().transform((value) => (value ?? []).flatMap((item) => item.material?.id ? [{
  id: item.material.id, code: item.material.code, name: item.material.name ?? "Unnamed material", unit: item.unitOfMeasure?.symbol ?? null,
  available: item.totalAvailableQuantity, reserved: item.reservedQuantity,
}] : []));
export type ApprovedMaterialRow = z.infer<typeof approvedMaterialRowsSchema>[number];

export const materialHeaderSchema = z.object({ id: z.string().min(1), code: text, name: text, kind: z.number().nullish(), pharmacopoeia: text, description: text,
  materialCategory: z.object({ name: text }).nullish() })
  .transform((value) => ({ id: value.id, code: value.code, name: value.name ?? "Unnamed material", kind: value.kind === 1 ? 1 as const : 0 as const, pharmacopoeia: value.pharmacopoeia, category: value.materialCategory?.name ?? null }));

/** Stock of one batch on one shelf. */
export const shelfBatchRowsSchema = z.array(z.object({
  id: z.string().nullish(), quantity: amount, uoM: z.object({ id: z.string().nullish(), symbol: text }).nullish(),
  materialBatch: z.object({ id: z.string().nullish(), batchNumber: text, manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish(), retestDate: z.string().nullish(),
    material: z.object({ id: z.string().nullish(), code: text, name: text }).nullish() }).nullish(),
  warehouseLocationShelf: z.object({ id: z.string().nullish(), code: text, name: text,
    warehouseLocationRack: z.object({ name: text, warehouseLocation: z.object({ name: text, floorName: text }).nullish() }).nullish() }).nullish(),
})).nullish().transform((value) => (value ?? []).map((item, index) => ({
  id: item.id ?? `row-${index}`, shelfBatchId: item.id ?? null, quantity: item.quantity, unit: item.uoM?.symbol ?? null, unitId: item.uoM?.id ?? null,
  batchNumber: item.materialBatch?.batchNumber ?? null, manufacturingDate: item.materialBatch?.manufacturingDate ?? null, expiryDate: item.materialBatch?.expiryDate ?? null,
  retestDate: item.materialBatch?.retestDate ?? null,
  materialName: item.materialBatch?.material?.name ?? null, materialCode: item.materialBatch?.material?.code ?? null,
  shelf: item.warehouseLocationShelf?.code ?? item.warehouseLocationShelf?.name ?? null, shelfId: item.warehouseLocationShelf?.id ?? null,
  rack: item.warehouseLocationShelf?.warehouseLocationRack?.name ?? null,
  location: item.warehouseLocationShelf?.warehouseLocationRack?.warehouseLocation?.name ?? null,
  floor: item.warehouseLocationShelf?.warehouseLocationRack?.warehouseLocation?.floorName ?? null,
})));
export type ShelfBatchRow = z.infer<typeof shelfBatchRowsSchema>[number];

/** One entry on a material's bin card: stock received or issued, and the balance after it. */
export const binCardRowsSchema = z.array(z.object({
  id: z.string().nullish(), createdAt: z.string().nullish(), wayBill: text, arNumber: text, supplier: text, manufacturer: text, warehouseName: text, requisitionCode: text, productBatchNumber: text,
  quantityReceived: amount, quantityIssued: amount, balanceQuantity: amount, uoM: z.object({ symbol: text }).nullish(),
  materialBatch: z.object({ batchNumber: text, manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish() }).nullish(), product: z.object({ name: text }).nullish(),
})).nullish().transform((value) => (value ?? []).map((item, index) => {
  // The server writes "N/A" where there is nothing to record.
  const real = (entry: string | null) => entry && entry !== "N/A" ? entry : null;
  return { id: item.id ?? `entry-${index}`, date: item.createdAt ?? null, wayBill: real(item.wayBill), arNumber: real(item.arNumber), supplier: real(item.supplier), manufacturer: real(item.manufacturer),
    warehouse: item.warehouseName, requisition: item.requisitionCode, productBatch: item.productBatchNumber, product: item.product?.name ?? null,
    received: item.quantityReceived, issued: item.quantityIssued, balance: item.balanceQuantity, unit: item.uoM?.symbol ?? null,
    batchNumber: item.materialBatch?.batchNumber ?? null, manufacturingDate: item.materialBatch?.manufacturingDate ?? null, expiryDate: item.materialBatch?.expiryDate ?? null };
}));
export type BinCardRow = z.infer<typeof binCardRowsSchema>[number];

/** Stock set aside for a production batch. */
export const reservedRowsSchema = z.array(z.object({
  schedule: text, dateTime: z.string().nullish(), productName: text, productCode: text, productBatchNumber: text, materialBatchNumber: text, arNumber: text, uomSymbol: text,
  reservedQuantity: amount, balanceQuantity: amount, manufacturingDate: z.string().nullish(), expiryDate: z.string().nullish(),
})).nullish().transform((value) => (value ?? []).map((item, index) => ({ ...item, id: `reserved-${index}`, unit: item.uomSymbol, reserved: item.reservedQuantity, balance: item.balanceQuantity })));
export type ReservedRow = z.infer<typeof reservedRowsSchema>[number];
