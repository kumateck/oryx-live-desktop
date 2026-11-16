import { api } from "@/shared/api/base-api";
import { documentReviewStateSchema, pendingReviewsSchema, reviewSettingsSchema, reviewTypesSchema, type DocumentReviewState, type PendingReviews,
  type ReviewConfiguration, type ReviewDocumentType, type SaveReviewConfiguration } from "./review-schema";

/** The server's document review contract (`api/v1/document-review`), checked against its schemas. */
const base = "/api/v1/document-review";
const headers = (subModule: string) => ({ Module: "Document review", SubModule: subModule });
const recordTag = (modelType: string, modelId: string) => ({ type: "DocumentReview" as const, id: `${modelType}:${modelId}` });
export interface ReviewRecord { modelType: string; modelId: string }
export interface ReviewActionArgs extends ReviewRecord { comments?: string | null; version?: number | null }
/** What a review action changes: the record's review, the pending list, and the record itself (its status moves on). */
const changed = (_result: unknown, error: unknown, arg: ReviewActionArgs) => error ? [] : [recordTag(arg.modelType, arg.modelId),
  { type: "PendingReviews" as const, id: "all" }, { type: "PurchaseOrderList" as const, id: "all" }, { type: "PurchaseOrder" as const, id: arg.modelId },
  { type: "RequisitionList" as const, id: "all" }, { type: "Requisition" as const, id: arg.modelId }, { type: "PendingApprovals" as const, id: "all" }];
const action = (name: "confirm" | "return" | "resubmit") => ({ modelType, modelId, comments, version }: ReviewActionArgs) => ({
  url: `${base}/${encodeURIComponent(modelType)}/${encodeURIComponent(modelId)}/${name}`, method: "POST", body: { comments: comments ?? null, version: version ?? null },
  headers: headers("Review"),
});

export const reviewApi = api.injectEndpoints({ endpoints: (build) => ({
  readDocumentReview: build.query<DocumentReviewState, ReviewRecord>({
    query: ({ modelType, modelId }) => ({ url: `${base}/${encodeURIComponent(modelType)}/${encodeURIComponent(modelId)}`, headers: headers("Review") }),
    transformResponse: (response) => documentReviewStateSchema.parse(response), providesTags: (_result, _error, arg) => [recordTag(arg.modelType, arg.modelId)],
  }),
  confirmDocumentReview: build.mutation<void, ReviewActionArgs>({ query: action("confirm"), invalidatesTags: changed }),
  returnDocumentReview: build.mutation<void, ReviewActionArgs>({ query: action("return"), invalidatesTags: changed }),
  resubmitDocumentReview: build.mutation<void, ReviewActionArgs>({ query: action("resubmit"), invalidatesTags: changed }),
  readPendingReviews: build.query<PendingReviews, { page: number; pageSize: number }>({
    query: (params) => ({ url: `${base}/pending`, params, headers: headers("Pending reviews") }),
    transformResponse: (response) => pendingReviewsSchema.parse(response), providesTags: [{ type: "PendingReviews", id: "all" }],
  }),
  readReviewTypes: build.query<ReviewDocumentType[], void>({
    query: () => ({ url: `${base}/types`, headers: headers("Review settings") }), transformResponse: (response) => reviewTypesSchema.parse(response),
  }),
  readReviewSettings: build.query<ReviewConfiguration[], void>({
    query: () => ({ url: `${base}/settings`, headers: headers("Review settings") }),
    transformResponse: (response) => reviewSettingsSchema.parse(response), providesTags: [{ type: "ReviewSettings", id: "all" }],
  }),
  saveReviewSettings: build.mutation<void, SaveReviewConfiguration>({
    query: (body) => ({ url: `${base}/settings`, method: "PUT", body, headers: headers("Review settings") }),
    invalidatesTags: (_result, error) => error ? [] : [{ type: "ReviewSettings", id: "all" }, "DocumentReview"],
  }),
  deleteReviewSettings: build.mutation<void, { itemType: string }>({
    query: ({ itemType }) => ({ url: `${base}/settings/${encodeURIComponent(itemType)}`, method: "DELETE", headers: headers("Review settings") }),
    invalidatesTags: (_result, error) => error ? [] : [{ type: "ReviewSettings", id: "all" }, "DocumentReview"],
  }),
}) });

export const { useReadDocumentReviewQuery, useConfirmDocumentReviewMutation, useReturnDocumentReviewMutation, useResubmitDocumentReviewMutation,
  useReadPendingReviewsQuery, useReadReviewTypesQuery, useReadReviewSettingsQuery, useSaveReviewSettingsMutation, useDeleteReviewSettingsMutation } = reviewApi;
