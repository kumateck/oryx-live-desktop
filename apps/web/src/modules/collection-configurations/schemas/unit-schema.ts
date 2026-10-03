import { z } from "zod";
import type { DomainEntitiesBaseCreateUnitOfMeasure } from "@/shared/api/generated/settings";

export const unitRecordSchema = z.object({
  id: z.string().min(1), name: z.string(), symbol: z.string(), description: z.string().nullish(),
  isScalable: z.boolean(), type: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  category: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3), z.literal(4)]),
});
export type UnitRecord = z.infer<typeof unitRecordSchema>;

export const unitTypes = [{ value: "0", label: "Raw material" }, { value: "1", label: "Packing" }, { value: "2", label: "Shipping" }, { value: "3", label: "Value" }] as const;
export const unitCategories = [{ value: "0", label: "Weight" }, { value: "1", label: "Volume" }, { value: "2", label: "Countable" }, { value: "3", label: "Length" }, { value: "4", label: "Area" }] as const;
const typeOption = z.object({ value: z.enum(["0", "1", "2", "3"]), label: z.string() });
const categoryOption = z.object({ value: z.enum(["0", "1", "2", "3", "4"]), label: z.string() });
export const unitFormSchema = z.object({
  name: z.string().trim().min(1, "Enter a name").max(255),
  symbol: z.string().trim().min(1, "Enter a symbol").max(20),
  description: z.string().trim().max(1000),
  scalable: z.boolean(),
  type: typeOption.nullable(),
  category: categoryOption.nullable(),
}).superRefine((values, context) => {
  if (!values.type) context.addIssue({ code: "custom", path: ["type"], message: "Choose a unit type" });
  if (!values.category) context.addIssue({ code: "custom", path: ["category"], message: "Choose a category" });
});
export type UnitValues = z.infer<typeof unitFormSchema>;

export function unitDefaults(record?: UnitRecord): UnitValues {
  return {
    name: record?.name ?? "", symbol: record?.symbol ?? "", description: record?.description ?? "", scalable: record?.isScalable ?? false,
    type: record ? unitTypes.find((item) => item.value === String(record.type)) ?? null : null,
    category: record ? unitCategories.find((item) => item.value === String(record.category)) ?? null : null,
  };
}

export function unitPayload(values: UnitValues): DomainEntitiesBaseCreateUnitOfMeasure {
  if (!values.type || !values.category) throw new Error("Choose the unit type and category");
  const types = { "0": 0, "1": 1, "2": 2, "3": 3 } as const;
  const categories = { "0": 0, "1": 1, "2": 2, "3": 3, "4": 4 } as const;
  return { name: values.name.trim(), symbol: values.symbol.trim(), description: values.description.trim(),
    isScalable: values.scalable, type: types[values.type.value], category: categories[values.category.value] };
}
