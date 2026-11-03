import { productionApi } from "@/shared/api/generated/production";
import { addTags } from "@/shared/api/add-tags";

const liveTags = ["production-schedule", "report", "requisition", "work-order", "qa", "qc"] as const;
export const issuedBmrApi = productionApi.enhanceEndpoints({ endpoints: {
  correctIssuedBmrBatchNumber: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [...liveTags]); },
  reviewIssuedBmrRevision: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [...liveTags]); },
} });
export const { useListIssuedBmrRecordsQuery, useGetIssuedBmrHistoryQuery, useCorrectIssuedBmrBatchNumberMutation,
  useRequestIssuedBmrRevisionMutation, useReviewIssuedBmrRevisionMutation } = issuedBmrApi;
