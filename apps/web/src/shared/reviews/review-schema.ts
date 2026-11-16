import { z } from "zod";

/** `DocumentReviewStatus` on the server. */
export const reviewStatus = { awaitingReview: 0, returned: 1, confirmed: 2 } as const;
export type ReviewStatus = 0 | 1 | 2;
export const reviewStatusLabels: Record<ReviewStatus, string> = { 0: "Awaiting review", 1: "Returned for correction", 2: "Checked" };
/** `DocumentReviewAction` on the server. */
export const reviewActionLabels: Record<number, string> = { 0: "Sent for review", 1: "Corrected", 2: "Returned for correction", 3: "Sent back for review", 4: "Checked" };

const text = z.string().nullish();
const status = z.union([z.literal(0), z.literal(1), z.literal(2)]);
export const reviewPersonSchema = z.object({ id: z.string(), name: text, signature: text });
export type ReviewPerson = z.infer<typeof reviewPersonSchema>;

export const documentReviewStateSchema = z.object({
  modelType: z.string(), modelId: z.string(), code: text, reviewRequired: z.boolean(),
  review: z.object({
    id: z.string(), submission: z.number().int(), version: z.number().int(), status,
    preparedBy: reviewPersonSchema.nullish(), submittedAt: z.string(), reviewedBy: reviewPersonSchema.nullish(), reviewedAt: text, comments: text,
    events: z.array(z.object({ action: z.number().int(), actor: reviewPersonSchema.nullish(), comments: text, at: z.string() })),
  }).nullish(),
  canConfirm: z.boolean(), canReturn: z.boolean(), canResubmit: z.boolean(),
  signatures: z.object({
    preparedBy: reviewPersonSchema.nullish(), checkedBy: reviewPersonSchema.nullish(), checkedAt: text,
    approvedBy: reviewPersonSchema.nullish(), approvedAt: text,
  }),
});
export type DocumentReviewState = z.infer<typeof documentReviewStateSchema>;

export const pendingReviewsSchema = z.object({
  data: z.array(z.object({
    reviewId: z.string(), modelType: z.string(), documentLabel: text, modelId: z.string(), code: text, variant: z.number().int().nullish(), parentId: z.string().nullish(), status,
    preparedBy: reviewPersonSchema.nullish(), submittedAt: z.string(), comments: text,
  })),
  pageIndex: z.number().int(), pageCount: z.number().int(), totalRecordCount: z.number().int(),
});
export type PendingReviews = z.infer<typeof pendingReviewsSchema>;
export type PendingReview = PendingReviews["data"][number];

export const reviewTypesSchema = z.array(z.object({ itemType: z.string(), label: z.string(), alwaysReviewed: z.boolean() }));
export type ReviewDocumentType = z.infer<typeof reviewTypesSchema>[number];

const reference = z.object({ id: z.string(), name: text });
export const reviewSettingsSchema = z.array(z.object({
  id: z.string(), itemType: z.string(), label: text,
  assignees: z.array(z.object({ role: reference.nullish(), user: reference.nullish() })),
}));
export type ReviewConfiguration = z.infer<typeof reviewSettingsSchema>[number];
export interface SaveReviewConfiguration { itemType: string; assignees: { roleId?: string | null; userId?: string | null }[] }
