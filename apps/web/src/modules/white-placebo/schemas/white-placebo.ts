import { stockShelfSchema } from "@/shared/warehouse/stock-location";
import { z } from "zod";

const id = z.string().uuid();
const text = z.string();
const positive = z.number().finite().positive("Enter a quantity above zero").max(1_000_000_000_000);
export const materialSchema = z.object({ id, name: text, code: text, uoMId: id, unitSymbol: text, isWhitePlacebo: z.boolean() });
export const recipeSchema = z.object({ materialId: id, materialName: text, unitSymbol: text, revision: z.number().int().positive(),
  reference: text, instructions: text, storageConditions: text, holdHours: z.number().int().positive(), expectedQuantity: positive,
  ingredients: z.array(z.object({ materialId: id, name: text, code: text, uoMId: id, unitSymbol: text, quantity: positive })).min(1) });
export const stockSchema = z.object({ id, materialId: id, materialName: text, batchNumber: text, shelf: text, rack: text.nullish(), unitSymbol: text,
  quantity: positive, expiryDate: text.nullable() });
export const workspaceSchema = z.object({ recipe: recipeSchema.nullable(), materials: z.array(materialSchema), stock: z.array(stockSchema) });
export const preparationSchema = z.object({ id, batchNumber: text, materialName: text, unitSymbol: text, recipeRevision: z.number(),
  recipeReference: text, instructions: text, storageConditions: text, holdHours: z.number(), expectedQuantity: positive,
  actualQuantity: positive.nullable(), notes: text.nullish().transform((value) => value ?? ""), outputNotes: text.nullish().transform((value) => value ?? ""), requisitionId: id,
  approved: z.boolean(), rejected: z.boolean(), createdAt: text, issuedById: id.nullable(), issuedAt: text.nullable(),
  recordedById: id.nullable(), recordedAt: text.nullable(), preparedAt: text.nullable(), outputBatchId: id.nullable(), grnId: id.nullable(),
  qualityStatus: z.number().nullable(), useBy: text.nullable(), inputs: z.array(z.object({ id, materialId: id, materialBatchId: id,
    warehouseLocationShelf: stockShelfSchema, materialName: text, materialCode: text, batchNumber: text, unitSymbol: text, recipeQuantity: positive, quantity: positive })) });
export const preparationsSchema = z.array(preparationSchema);
export const preparationPageSchema = z.object({ items: preparationsSchema, totalRows: z.number().int().nonnegative() });
export type Workspace = z.infer<typeof workspaceSchema>;
export type Recipe = z.infer<typeof recipeSchema>;
export type Preparation = z.infer<typeof preparationSchema>;
export type Stock = z.infer<typeof stockSchema>;

const option = z.object({ value: id, label: text }).nullable().refine((value): boolean => value !== null, "Choose a material");
export const recipeFormSchema = z.object({ material: option, reference: z.string().trim().min(1).max(200),
  instructions: z.string().trim().min(1).max(4000), storageConditions: z.string().trim().min(1).max(1000),
  holdHours: z.number().int().min(1).max(8760), expectedQuantity: positive,
  ingredients: z.array(z.object({ materialId: id, quantity: positive })).min(1, "Add at least one ingredient").max(100),
}).superRefine((value, context) => {
  const seen = new Set<string>();
  value.ingredients.forEach((ingredient, index) => {
    if (seen.has(ingredient.materialId) || ingredient.materialId === value.material?.value)
      context.addIssue({ code: "custom", path: ["ingredients", index, "materialId"], message: "Choose a distinct ingredient other than White Placebo" });
    seen.add(ingredient.materialId);
  });
});
export type RecipeFormValues = z.infer<typeof recipeFormSchema>;
export const preparationFormSchema = z.object({ batchNumber: z.string().trim().min(1, "Enter the batch number").max(100),
  expectedQuantity: positive, notes: z.string().trim().max(2000),
  inputs: z.array(z.object({ shelfMaterialBatchId: id, quantity: positive })).min(1).max(200),
}).superRefine((value, context) => {
  const seen = new Set<string>();
  value.inputs.forEach((input, index) => {
    if (seen.has(input.shelfMaterialBatchId)) context.addIssue({ code: "custom", path: ["inputs", index, "shelfMaterialBatchId"], message: "This shelf batch is already selected" });
    seen.add(input.shelfMaterialBatchId);
  });
});
export type PreparationFormValues = z.infer<typeof preparationFormSchema>;
export const outputFormSchema = z.object({ quantity: positive, preparedAt: z.string().min(1, "Enter the actual preparation time")
  .refine((value) => Number.isFinite(new Date(value).getTime()), "Enter a valid date and time"), notes: z.string().trim().min(1, "Record weighing and variance notes").max(2000) });
export type OutputFormValues = z.infer<typeof outputFormSchema>;
