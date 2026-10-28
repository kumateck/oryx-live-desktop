import { z } from "zod";
import { attachmentFiles } from "@/shared/attachments/file-contract";
import type { InventoryItem } from "@/shared/inventory/contracts";
const option = z.object({ value: z.uuid(), label: z.string() });
const level = z.number().int("Use whole numbers, as required by the inventory API.").min(0).max(2147483647);
export const editorSchema = z
  .object({
    name: z.string().trim().min(3).max(200),
    code: z.string().trim().min(1).max(100),
    unit: option.nullable(),
    category: option.nullable(),
    classification: z.object({ value: z.enum(["0", "1"]), label: z.string() }).nullable(),
    minimumLevel: level,
    maximumLevel: level,
    reorderLevel: level,
    isActive: z.boolean(),
    description: z.string().max(20000),
    files: attachmentFiles,
  })
  .superRefine((v, c) => {
    if (!v.unit) c.addIssue({ code: "custom", path: ["unit"], message: "Choose a unit of measure." });
    if (!v.classification) c.addIssue({ code: "custom", path: ["classification"], message: "Choose an inventory classification." });
  });
export type ItemValues = z.infer<typeof editorSchema>;
export const defaults = (r: InventoryItem | null): ItemValues => ({
  name: r?.name ?? "",
  code: r?.code ?? "",
  unit: r ? { value: r.unitOfMeasure.id, label: r.unitOfMeasure.name } : null,
  category: r?.itemCategory ? { value: r.itemCategory.id, label: r.itemCategory.name } : null,
  classification: r ? { value: r.classification === 0 ? "0" : "1", label: r.classification === 0 ? "Recoverable" : "Non-recoverable" } : null,
  minimumLevel: r?.minimumLevel ?? 0,
  maximumLevel: r?.maximumLevel ?? 0,
  reorderLevel: r?.reorderLevel ?? 0,
  isActive: r?.isActive ?? true,
  description: r?.description ?? "",
  files: [],
});
export function itemBody(v: ItemValues, store: InventoryItem["store"]) {
  if (!v.unit || !v.classification) throw new Error("Choose unit and classification.");
  return {
    name: v.name,
    code: v.code,
    store,
    classification: v.classification.value === "0" ? (0 as const) : (1 as const),
    unitOfMeasureId: v.unit.value,
    itemCategoryId: v.category?.value ?? null,
    minimumLevel: v.minimumLevel,
    maximumLevel: v.maximumLevel,
    reorderLevel: v.reorderLevel,
    isActive: v.isActive,
    description: v.description,
  };
}
export function savedItemMatches(row: InventoryItem, body: ReturnType<typeof itemBody>) {
  return (
    row.name === body.name &&
    row.code === body.code &&
    row.store === body.store &&
    row.classification === body.classification &&
    row.unitOfMeasure.id === body.unitOfMeasureId &&
    (row.itemCategory?.id ?? null) === body.itemCategoryId &&
    row.minimumLevel === body.minimumLevel &&
    row.maximumLevel === body.maximumLevel &&
    row.reorderLevel === body.reorderLevel &&
    row.isActive === body.isActive &&
    (row.description ?? "") === body.description
  );
}
