import { z } from "zod";

const option = (message: string) => z.object({ value: z.string().min(1, message), label: z.string() }, { message });
const positive = (label: string) => z.number({ message: `Enter the ${label}` }).finite(`Enter the ${label}`).positive(`The ${label} must be greater than 0`);

const unitSchema = z.object({ uom: option("Choose a unit"), quantity: positive("quantity") });

export const packingStyleFormSchema = z.object({
  name: z.string({ message: "Enter a label" }).trim().min(1, "Enter a label"),
  basePackingUom: option("Choose the base packing unit"),
  basePackingQuantity: positive("base packing quantity"),
  expectedYield: z.number({ message: "Enter the expected yield" }).finite().min(0, "Cannot be negative").nullish(),
  packPerShipper: positive("packs per shipper"),
  isDefault: z.boolean(),
  description: z.string().trim().optional(),
  units: z.array(unitSchema).min(1, "Add at least one packing unit"),
}).superRefine((values, context) => {
  const seen = new Set<string>();
  values.units.forEach((unit, index) => {
    if (seen.has(unit.uom.value)) context.addIssue({ code: "custom", path: ["units", index, "uom"], message: "This unit is already listed" });
    seen.add(unit.uom.value);
  });
});
export type PackingStyleFormValues = z.infer<typeof packingStyleFormSchema>;

const text = z.string().nullish().transform((value) => value?.trim() ?? "");
const num = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : null);
const unit = z.object({ id: z.string().nullish(), name: z.string().nullish(), symbol: z.string().nullish() }).nullish();

/** Packing styles as the backend returns them. */
export const packingStyleListSchema = z.array(z.object({
  id: z.uuid(), name: text, description: text, packPerShipper: num, basePackingQuantity: num, expectedYield: num,
  isDefault: z.boolean().nullish().transform((value) => value ?? false), basePackingUoM: unit,
  packingLists: z.array(z.object({ uom: unit, quantity: num, order: num })).nullish().transform((value) => value ?? []),
}));
export type SavedPackingStyle = z.infer<typeof packingStyleListSchema>[number];
