import { z } from "zod";

const text = z.string().nullish().transform(value => value?.trim() ?? "");
const date = z.string().nullish().transform(value => value ?? null);
export const issuedBmrRowSchema = z.object({
  id: z.string().min(1), scheduleProductId: z.string().min(1), productId: z.string().min(1),
  productName: text, productCode: text, departmentName: text, scheduleCode: text, batchNumber: text,
  manufacturingDate: date, expiryDate: date, issuedAt: z.string().min(1), isRetired: z.boolean(), pendingRevisions: z.number().int().nonnegative(),
});
export type IssuedBmr = z.infer<typeof issuedBmrRowSchema>;
export const issuedBmrPageSchema = z.object({ data: z.array(issuedBmrRowSchema), pageIndex: z.number().int().positive(),
  pageCount: z.number().int().nonnegative(), totalRecordCount: z.number().int().nonnegative() });
const reason = z.string().trim().min(3, "Record a reason of at least 3 characters.").max(1000);
export const numberCorrectionSchema = z.object({ batchNumber: z.string().trim().min(1, "Enter the batch number.").max(100), reason });
export type NumberCorrection = z.infer<typeof numberCorrectionSchema>;
export const dateRevisionSchema = z.object({ made: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose the manufacturing month."),
  expires: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Choose the expiry month."), reason })
  .refine(value => value.expires > value.made, { path: ["expires"], message: "Expiry must be after the manufacturing month." });
export type DateRevision = z.infer<typeof dateRevisionSchema>;
export const reviewSchema = z.object({ reason });
export type Review = z.infer<typeof reviewSchema>;
export const revisionSchema = z.object({ id: z.string().min(1), requestedByName: text, requestedAt: z.string(), reason: text,
  batchNumber: text, previousManufacturingDate: date, previousExpiryDate: date, manufacturingDate: z.string(), expiryDate: z.string(),
  status: z.union([z.literal(0), z.literal(1), z.literal(2)]), reviewedByName: text, reviewedAt: date, reviewReason: text, isRequester: z.boolean() });
export type Revision = z.infer<typeof revisionSchema>;
export const historySchema = z.object({ revisions: z.array(revisionSchema), changes: z.array(z.object({ id: z.string().min(1), revisionId: date,
  actorName: text, occurredAt: z.string(), reason: text, previousBatchNumber: text, batchNumber: text,
  previousManufacturingDate: date, previousExpiryDate: date, manufacturingDate: date, expiryDate: date })) });

export const expectedBmr = (row: IssuedBmr) => ({ expectedBatchNumber: row.batchNumber,
  expectedManufacturingDate: row.manufacturingDate, expectedExpiryDate: row.expiryDate });
