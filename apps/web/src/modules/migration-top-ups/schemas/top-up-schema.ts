import { z } from "zod";

const option = z.object({ value: z.string().min(1), label: z.string() });
const startOfToday = () => { const now = new Date(); return new Date(now.getFullYear(), now.getMonth(), now.getDate()); };

/** One lot in the add/edit dialog. The quantity is held in the material's department unit. */
export const topUpLineFormSchema = z.object({
  kind: z.enum(["0", "1"]),
  material: option.nullable().refine((value) => value !== null, "Choose the material"),
  shelf: option.nullable().refine((value) => value !== null, "Choose the shelf it is stored on"),
  batchNumber: z.string().trim().min(1, "Enter the batch number on the label").max(500, "At most 500 characters"),
  arNumber: z.string().trim().max(500, "At most 500 characters"),
  grn: z.string().trim().max(500, "At most 500 characters"),
  quantity: z.number({ message: "Enter the quantity in stock" }).finite("Enter the quantity in stock").positive("The quantity must be greater than 0").nullable()
    .refine((value) => value !== null, "Enter the quantity in stock"),
  manufactured: z.date().nullable(),
  expiry: z.date().nullable(),
  retest: z.date().nullable(),
}).superRefine((values, context) => {
  const { manufactured, expiry, retest } = values;
  if (manufactured && manufactured > startOfToday())
    context.addIssue({ code: "custom", path: ["manufactured"], message: "The manufacturing date cannot be in the future" });
  if (manufactured && expiry && expiry < manufactured)
    context.addIssue({ code: "custom", path: ["expiry"], message: "The expiry date cannot be before the manufacturing date" });
  if (retest && expiry && retest > expiry)
    context.addIssue({ code: "custom", path: ["retest"], message: "The retest date cannot be after the expiry date" });
  if (retest && manufactured && retest < manufactured)
    context.addIssue({ code: "custom", path: ["retest"], message: "The retest date cannot be before the manufacturing date" });
});
export type TopUpLineFormValues = z.input<typeof topUpLineFormSchema>;

export const topUpHeaderSchema = z.object({
  reason: z.string().trim().min(10, "Explain where this stock came from (at least 10 characters)").max(2000, "At most 2,000 characters"),
});
export type TopUpHeaderValues = z.infer<typeof topUpHeaderSchema>;

const text = z.string().nullish().transform((value) => value?.trim() ?? "");
/** A department material as the picker endpoint returns it: the material and its department unit. */
export const departmentMaterialRowSchema = z.object({
  material: z.object({ id: z.string().min(1), code: text, name: text }),
  uoM: z.object({ symbol: text }).nullish().transform((value) => value?.symbol ?? ""),
});

/** A shelf of the department's raw or packaging store. */
export const departmentShelfSchema = z.object({
  id: z.string().min(1), name: text, code: text,
  warehouseLocationRack: z.object({ name: text, warehouseLocation: z.object({ name: text, warehouse: z.object({ name: text }).nullish() }).nullish() }).nullish(),
});
