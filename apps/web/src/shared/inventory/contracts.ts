import { z } from "zod";
import { attachmentMetadata } from "@/shared/attachments/file-contract";
import { Store } from "./stores";
export enum Classification {
  Recoverable,
  NonRecoverable,
}
export const classifications = ["Recoverable", "Non-recoverable"];
export const inventoryAudit = { module: "General Stores", subModule: "General inventory configuration" };
export const itemSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  code: z.string().min(1),
  store: z.enum(Store),
  classification: z.enum(Classification),
  unitOfMeasure: z.object({ id: z.uuid(), name: z.string(), symbol: z.string().nullish() }),
  itemCategory: z.object({ id: z.uuid(), name: z.string() }).nullish(),
  minimumLevel: z.number().int().nonnegative(),
  maximumLevel: z.number().int().nonnegative(),
  reorderLevel: z.number().int().nonnegative(),
  availableQuantity: z.number().int(),
  isActive: z.boolean(),
  hasBatch: z.boolean().optional(),
  description: z.string().nullish(),
  createdAt: z.string().nullish(),
  createdBy: z.object({ id: z.uuid(), firstName: z.string().nullish(), lastName: z.string().nullish() }).nullish(),
  attachments: z
    .array(attachmentMetadata)
    .nullish()
    .transform((v) => v ?? []),
});
export type InventoryItem = z.infer<typeof itemSchema>;
export const itemPage = z.object({
  data: z.array(itemSchema),
  pageIndex: z.number().int().positive(),
  pageCount: z.number().int().nonnegative(),
  totalRecordCount: z.number().int().nonnegative(),
});
