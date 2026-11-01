import { z } from "zod";

const option = (message: string) => z.object({ value: z.string().min(1, message), label: z.string() }, { message });
const optionalText = z.string().trim().optional();
const amount = (label: string) => z.number({ message: `Enter the ${label}` }).finite(`Enter the ${label}`).positive(`The ${label} must be greater than 0`);

export const productFormSchema = z.object({
  name: z.string({ message: "Enter the product name" }).trim().min(1, "Enter the product name"),
  code: z.string({ message: "Enter the product code" }).trim().min(1, "Enter the product code")
    .refine((value) => value !== "undefined" && value !== "null", "Enter a valid product code"),
  genericName: optionalText,
  category: option("Choose a category"),
  department: option("Choose a department"),
  division: option("Choose a division"),
  baseUom: option("Choose the base unit"),
  baseQuantity: amount("composition quantity"),
  fullBatchSize: amount("full batch size"),
  filledWeight: optionalText,
  storageCondition: optionalText,
  shelfLife: optionalText,
  actionUse: optionalText,
  equipment: z.object({ value: z.string(), label: z.string() }).nullish(),
  fdaRegistrationNumber: optionalText,
  masterFormulaNumber: optionalText,
  documentNumber: optionalText,
  revisionNumber: z.number({ message: "Enter a whole number" }).int("Enter a whole number").min(0, "Cannot be negative").nullish(),
  description: z.string().optional(),
}).refine((values) => values.fullBatchSize >= values.baseQuantity, {
  path: ["fullBatchSize"], message: "The full batch cannot be smaller than one composition unit",
});
export type ProductFormValues = z.infer<typeof productFormSchema>;

const text = z.string().nullish().transform((value) => value?.trim() ?? "");
const ref = z.object({ id: z.string().nullish(), name: z.string().nullish() }).nullish()
  .transform((value) => value?.id ? { value: value.id, label: value.name?.trim() || "Unnamed" } : null);

/** The parts of a saved product the edit form starts from. */
export const productFormSourceSchema = z.object({
  id: z.uuid(), name: text, code: text, genericName: text, description: text, filledWeight: text, storageCondition: text,
  shelfLife: text, actionUse: text, fdaRegistrationNumber: text, masterFormulaNumber: text, documentNumber: text,
  revisionNumber: z.number().nullish(), baseQuantity: z.number().nullish(), fullBatchSize: z.number().nullish(),
  division: z.number().nullish(), category: ref, department: ref, equipment: ref,
  baseUoM: z.object({ id: z.string().nullish(), name: z.string().nullish(), symbol: z.string().nullish() }).nullish(),
});
export type ProductFormSource = z.infer<typeof productFormSourceSchema>;
