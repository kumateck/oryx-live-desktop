import { approvalsApi } from "@/shared/api/generated/approvals";
import { addTags } from "@/shared/api/add-tags";

const queue = { type: "PendingApprovals" as const, id: "all" };
// A decision changes the document itself, so the lists it appears in are read again.
const decided = (_result: unknown, error: unknown) => error ? [] : [queue, "PurchaseOrderList" as const, "PurchaseOrder" as const, "BillingSheets" as const, "Shipments" as const, "MaterialDistribution" as const,
  "RequisitionList" as const, "Requisition" as const, "ActivityBoard" as const];

export const approvalApi = approvalsApi.enhanceEndpoints({
  endpoints: {
    getApiV1ApprovalMyPending: (definition) => { definition.providesTags = addTags(definition.providesTags, [queue]); },
    getApiV1ApprovalMyPendingStats: (definition) => { definition.providesTags = addTags(definition.providesTags, [queue]); },
    getApiV1ApprovalMyPendingDocumentCounts: (definition) => { definition.providesTags = addTags(definition.providesTags, [queue]); },
    getApiV1ApprovalMyPendingByModelTypeAndModelId: (definition) => { definition.providesTags = addTags(definition.providesTags, [queue]); },
    postApiV1ApprovalApproveByModelTypeAndModelId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, decided); },
    postApiV1ApprovalRejectByModelTypeAndModelId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, decided); },
  },
});
export const { useGetApiV1ApprovalMyPendingQuery, useGetApiV1ApprovalMyPendingStatsQuery, useGetApiV1ApprovalMyPendingDocumentCountsQuery, useGetApiV1ApprovalMyPendingByModelTypeAndModelIdQuery,
  usePostApiV1ApprovalApproveByModelTypeAndModelIdMutation, usePostApiV1ApprovalRejectByModelTypeAndModelIdMutation } = approvalApi;
