import { z } from "zod";

const option = z.object({ value: z.string().min(1), label: z.string() });

export const packagingItemFormSchema = z.object({
  material: z.object({ value: z.string().min(1, "Choose a material"), label: z.string() }, { message: "Choose a material" }),
  packing: option.nullish(),
  prescribedQuantity: z.number({ message: "Enter the prescribed quantity" }).finite("Enter the prescribed quantity").positive("The prescribed quantity must be greater than 0"),
  packingExcessMargin: z.number({ message: "Enter the packing allowance" }).finite().min(0, "The packing allowance cannot be negative").nullish(),
});
export type PackagingItemFormValues = z.infer<typeof packagingItemFormSchema>;

const text = z.string().nullish().transform((value) => value?.trim() ?? "");
const num = z.number().nullish().transform((value) => typeof value === "number" && Number.isFinite(value) ? value : null);
const item = z.object({ id: z.string().nullish(), name: text, code: text }).nullish();

/** A product's packing materials as the backend returns them. */
export const savedPackagesSchema = z.array(z.object({
  id: z.string().nullish(), material: item, directLinkMaterial: item, productPacking: z.object({ id: z.string().nullish(), name: text }).nullish(),
  materialThickness: z.string().nullish(), otherStandards: z.string().nullish(), baseQuantity: num, unitCapacity: num,
  packingExcessMargin: num, prescribedQuantity: num,
  substitutes: z.array(z.object({ substituteMaterial: z.object({ id: z.string().nullish() }).nullish() })).nullish().transform((value) => value ?? []),
})).nullish().transform((value) => value ?? []);
export type SavedPackages = z.infer<typeof savedPackagesSchema>;
