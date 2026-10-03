import { z } from "zod";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

export const availableStockPath = "/stock/available";
export const audit = { module: "Logistics", subModule: "Available Stock" } as const;
export const stockPermissions: Record<MaterialKind, string> = { 0: "CanViewRawMaterialStock", 1: "CanViewPackingMaterialStock" };

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);

/** A material's approved stock in one department, or in all of them. */
export const availableStockSchema = z.array(z.object({
  material: z.object({ id: z.string().nullish(), code: text, name: text, materialCategory: z.object({ name: text }).nullish() }).nullish(),
  unitOfMeasure: z.object({ symbol: text, name: text }).nullish(), totalAvailableQuantity: amount, reservedQuantity: amount,
})).nullish().transform((value) => (value ?? []).flatMap((item, index) => item.material ? [{
  id: item.material.id ?? `row-${index}`, code: item.material.code, name: item.material.name ?? "Unnamed material", category: item.material.materialCategory?.name ?? null,
  unit: item.unitOfMeasure?.symbol ?? null, unitName: item.unitOfMeasure?.name ?? null, stock: item.totalAvailableQuantity, reserved: item.reservedQuantity,
  // What can still be promised: stock that is not already set aside for production.
  free: Math.max(0, item.totalAvailableQuantity - item.reservedQuantity),
}] : []));
export type AvailableStockRow = z.infer<typeof availableStockSchema>[number];

export const departmentOptionsSchema = z.array(z.object({ id: z.string().nullish(), name: text })).nullish()
  .transform((value) => (value ?? []).flatMap((department) => department.id ? [{ value: department.id, label: department.name ?? "Unnamed department" }] : []));
