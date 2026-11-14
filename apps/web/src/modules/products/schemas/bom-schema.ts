import { z } from "zod";

const option = z.object({ value: z.string().min(1), label: z.string() });

export const bomItemFormSchema = z.object({
  material: z.object({ value: z.string().min(1, "Choose a material"), label: z.string() }, { message: "Choose a material" }),
  baseQuantity: z.number({ message: "Enter the unit quantity" }).finite("Enter the unit quantity").positive("The unit quantity must be greater than 0"),
  useDensityConversion: z.boolean(),
  grade: z.string().trim().optional(),
  substitutes: z.array(option).optional(),
  /** Each substitute's own quantity per composition unit, by material id: a substitute may differ in strength or water content. */
  substituteQuantities: z.record(z.string(), z.number()).optional(),
}).superRefine((values, context) => {
  if (values.substitutes?.some((item) => item.value === values.material.value)) {
    context.addIssue({ code: "custom", path: ["substitutes"], message: "A material cannot substitute for itself" });
  }
  for (const substitute of values.substitutes ?? []) {
    const quantity = values.substituteQuantities?.[substitute.value];
    if (typeof quantity !== "number" || !Number.isFinite(quantity) || quantity <= 0)
      context.addIssue({ code: "custom", path: ["substituteQuantities", substitute.value], message: `Enter the quantity of ${substitute.label} that replaces this material` });
  }
});
export type BomItemFormValues = z.infer<typeof bomItemFormSchema>;

const text = z.string().nullish().transform((value) => value?.trim() ?? "");
const num = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : null);
const unit = z.object({ id: z.string().nullish(), symbol: z.string().nullish(), name: z.string().nullish() }).nullish();

/** A raw material as the material endpoints describe it, reduced to what a BOM line shows. */
export const bomMaterialSchema = z.object({
  id: z.string().min(1), name: text, code: text,
  materialCategory: z.object({ name: text }).nullish().transform((value) => value?.name ?? ""),
  specification: z.object({ specificationNumber: text }).nullish().transform((value) => value?.specificationNumber ?? ""),
});

/** The active bill of materials as the backend returns it; null when the product has none. */
export const savedBomSchema = z.object({
  version: num, effectiveDate: z.string().nullish(), isActive: z.boolean().nullish(),
  billOfMaterial: z.object({ items: z.array(z.object({
    id: z.string().nullish(), order: num, baseQuantity: num, grade: text, baseUoM: unit, useDensityConversion: z.boolean().nullish(), material: bomMaterialSchema.nullish(),
    substitutes: z.array(z.object({ substituteMaterial: bomMaterialSchema.nullish(), baseQuantity: num, baseUoM: unit }))
      .nullish().transform((value) => value ?? []),
  })).nullish().transform((value) => value ?? []) }).nullish(),
}).nullish();
export type SavedBom = z.infer<typeof savedBomSchema>;

/** A raw material the department can use, with the unit it is measured in. */
export const departmentMaterialSchema = z.object({ material: bomMaterialSchema, uoM: unit, density: num, densityUoM: unit });
