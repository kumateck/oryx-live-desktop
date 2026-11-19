import { z } from "zod";

const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const text = z.string().nullish().transform((value) => value?.trim() ?? "");

/** What one batch needs of each material, and where that material stands in the warehouse. */
export const batchMaterialsSchema = z.array(z.object({
  material: z.object({ id: z.string().nullish(), code: text, name: text, totalStock: amount }).nullish(),
  materialDepartment: z.object({ uoM: z.object({ id: z.string().nullish(), symbol: text }).nullish() }).nullish(),
  baseUoM: z.object({ symbol: text }).nullish(),
  quantityNeeded: amount, quantityOnHand: amount, frozenQuantity: amount, totalFrozenQuantity: amount,
  status: z.number().nullish(),
  // A substitute the batch may use instead of its main material (parentMaterial), listed by the server as its own row.
  isSubstitute: z.boolean().nullish(), parentMaterial: z.object({ id: z.string().nullish(), code: text, name: text }).nullish(),
  // Why a substitute cannot be chosen (no quantity of its own on the BOM, not linked); null when it can.
  substituteUnavailableReason: z.string().nullish(),
}).transform((item) => ({
  unusableReason: item.isSubstitute ? item.substituteUnavailableReason?.trim() || null : null,
  materialId: item.material?.id ?? null,
  substituteFor: item.isSubstitute && item.parentMaterial?.id ? { id: item.parentMaterial.id, code: item.parentMaterial.code, name: item.parentMaterial.name || "its main material" } : null,
  code: item.material?.code ?? "", name: item.material?.name || "Unnamed material",
  unit: item.materialDepartment?.uoM?.symbol || item.baseUoM?.symbol || null, unitId: item.materialDepartment?.uoM?.id ?? null,
  needed: item.quantityNeeded, onHand: item.quantityOnHand,
  // Stock set aside for this batch, and stock set aside for any batch.
  reserved: item.frozenQuantity, reservedByAll: item.totalFrozenQuantity,
  elsewhere: item.material?.totalStock ?? 0, source: item.status ?? null,
}))).nullish().transform((value) => (value ?? []).map((item, index) => ({ ...item, id: `${item.materialId ?? "material"}-${index}` })));
export type BatchMaterial = z.infer<typeof batchMaterialsSchema>[number];

/** The production run of a batch that has started. */
export const batchActivitySchema = z.object({
  id: z.string().nullish(),
  currentStep: z.object({ order: z.number().nullish(), status: z.number().nullish(), operation: z.object({ name: text }).nullish() }).nullish(),
}).nullish().transform((value) => value?.id ? { id: value.id, step: value.currentStep?.operation?.name || null, order: value.currentStep?.order ?? null } : null);
export type BatchActivity = NonNullable<z.infer<typeof batchActivitySchema>>;
