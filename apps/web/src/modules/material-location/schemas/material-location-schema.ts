import { z } from "zod";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);

/** A material the department keeps, with its warehouse stock and the levels it is held to. Quantities are in the material's stored unit. */
export const materialStockRowsSchema = z.array(z.object({
  material: z.object({ id: z.string().nullish(), code: text, name: text }).nullish(), uoM: z.object({ symbol: text }).nullish(),
  reOrderLevel: amount, minimumStockLevel: amount, maximumStockLevel: amount, warehouseStock: amount, reservedQuantity: amount, expiredQuantity: amount,
})).nullish().transform((value) => (value ?? []).flatMap((item) => item.material?.id ? [{
  id: item.material.id, code: item.material.code, name: item.material.name ?? "Unnamed material", unit: item.uoM?.symbol ?? null,
  stock: item.warehouseStock, reorder: item.reOrderLevel, minimum: item.minimumStockLevel, maximum: item.maximumStockLevel, reserved: item.reservedQuantity, expired: item.expiredQuantity,
}] : []));
export type MaterialStockRow = z.infer<typeof materialStockRowsSchema>[number];
