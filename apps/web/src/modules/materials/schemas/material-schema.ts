import { z } from "zod";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";

const text = z.string().nullish().transform((value) => value?.trim() || null);
const amount = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : 0);
const named = z.object({ id: z.string().nullish(), name: text }).nullish();

const material = z.object({ id: z.string().nullish(), code: text, name: text, description: text, pharmacopoeia: text, alphabet: text, kind: z.number().nullish(), isUnlimited: z.boolean().nullish(), materialCategory: named,
  specification: z.object({ specificationNumber: text }).nullish(), totalStock: amount, reservedStock: amount, warehouseStock: z.number().nullish(), suppliers: z.array(named).nullish(), manufacturers: z.array(named).nullish() });
function read(entry: z.infer<typeof material>) {
  if (!entry.id) return null;
  return { id: entry.id, code: entry.code ?? "", name: entry.name ?? "Unnamed material", description: entry.description, pharmacopoeia: entry.pharmacopoeia, alphabet: entry.alphabet, kind: (entry.kind === 1 ? 1 : 0) as MaterialKind, unlimited: entry.isUnlimited === true,
    category: entry.materialCategory?.id ? { id: entry.materialCategory.id, name: entry.materialCategory.name ?? "Unnamed category" } : null, specification: entry.specification?.specificationNumber ?? null,
    totalStock: entry.totalStock, reservedStock: entry.reservedStock, storeStock: typeof entry.warehouseStock === "number" ? entry.warehouseStock : null,
    suppliers: (entry.suppliers ?? []).flatMap((item) => item?.name ? [item.name] : []), manufacturers: (entry.manufacturers ?? []).flatMap((item) => item?.name ? [item.name] : []) };
}
/** A material in the master list: what it is, and how much of it the company holds. */
export const materialSchema = material.transform(read);
export const materialRowsSchema = z.array(material).nullish().transform((value) => (value ?? []).flatMap((entry) => { const row = read(entry); return row ? [row] : []; }));
export type Material = z.infer<typeof materialRowsSchema>[number];

const unit = z.object({ id: z.string().nullish(), symbol: text, name: text }).nullish();
/** A material the department keeps, with the stock levels it has set for it. Quantities are in the smallest unit of the unit's family. */
export const linkRowsSchema = z.array(z.object({ material, uoM: unit, density: amount, densityUoM: unit, reOrderLevel: amount, minimumStockLevel: amount, maximumStockLevel: amount, warehouseStock: amount, reservedQuantity: amount, expiredQuantity: amount,
  pendingStockTransferQuantity: amount })).nullish().transform((value) => (value ?? []).flatMap((entry) => { const item = read(entry.material);
    return item ? [{ id: item.id, material: item, unit: entry.uoM?.symbol ?? entry.uoM?.name ?? null, unitId: entry.uoM?.id ?? null, density: entry.density, densityUnitId: entry.densityUoM?.id ?? null, reorder: entry.reOrderLevel,
      minimum: entry.minimumStockLevel, maximum: entry.maximumStockLevel, stock: entry.warehouseStock, reserved: entry.reservedQuantity, expired: entry.expiredQuantity, incoming: entry.pendingStockTransferQuantity }] : []; }));
export type MaterialLink = z.infer<typeof linkRowsSchema>[number];

const option = z.object({ value: z.string().min(1), label: z.string() });
export const materialFormSchema = z.object({
  name: z.string().trim().min(1, "Enter the material's name").max(200, "Keep the name under 200 characters"),
  code: z.string().trim().min(1, "Enter the material's code").max(100, "Keep the code under 100 characters"),
  category: option.nullable().refine((value): boolean => Boolean(value), "Choose the category"),
  pharmacopoeia: z.string().trim().max(200, "Keep this under 200 characters"),
  description: z.string().trim().max(1000, "Keep the description under 1000 characters"),
});
export type MaterialFormValues = z.infer<typeof materialFormSchema>;

const level = (message: string) => z.number({ message }).refine((value) => value > 0, message);
/** Stock levels in the order they have to stand: minimum, then re-order, then maximum. */
export const linkFormSchema = z.object({
  unit: option.nullable().refine((value): boolean => Boolean(value), "Choose the unit the stock is counted in"),
  minimum: level("Enter a minimum level above zero"), reorder: level("Enter a re-order level above zero"), maximum: level("Enter a maximum level above zero"),
}).superRefine((values, context) => {
  if (!(values.minimum > 0 && values.reorder > 0 && values.maximum > 0)) return;
  if (values.reorder < values.minimum) context.addIssue({ code: "custom", path: ["reorder"], message: "The re-order level cannot be below the minimum" });
  if (values.reorder > values.maximum) context.addIssue({ code: "custom", path: ["reorder"], message: "The re-order level cannot be above the maximum" });
  if (values.minimum > values.maximum) context.addIssue({ code: "custom", path: ["minimum"], message: "The minimum cannot be above the maximum" });
});
export type LinkFormValues = z.infer<typeof linkFormSchema>;
