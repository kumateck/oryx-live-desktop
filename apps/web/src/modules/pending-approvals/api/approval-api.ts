import { approvalsApi } from "@/shared/api/generated/approvals";

const queue = { type: "PendingApprovals" as const, id: "all" };
// A decision changes the document itself, so the lists it appears in are read again.
const decided = (_result: unknown, error: unknown) => error ? [] : [queue, "PurchaseOrderList" as const, "PurchaseOrder" as const, "BillingSheets" as const, "Shipments" as const, "MaterialDistribution" as const,
  "RequisitionList" as const, "Requisition" as const, "ActivityBoard" as const];

export const approvalApi = approvalsApi.enhanceEndpoints({
  endpoints: {
    getApiV1ApprovalMyPending: { providesTags: [queue] },
    getApiV1ApprovalMyPendingStats: { providesTags: [queue] },
    getApiV1ApprovalMyPendingDocumentCounts: { providesTags: [queue] },
    getApiV1ApprovalMyPendingByModelTypeAndModelId: { providesTags: [queue] },
    postApiV1ApprovalApproveByModelTypeAndModelId: { invalidatesTags: decided },
    postApiV1ApprovalRejectByModelTypeAndModelId: { invalidatesTags: decided },
  },
});
export const { useGetApiV1ApprovalMyPendingQuery, useGetApiV1ApprovalMyPendingStatsQuery, useGetApiV1ApprovalMyPendingDocumentCountsQuery, useGetApiV1ApprovalMyPendingByModelTypeAndModelIdQuery,
  usePostApiV1ApprovalApproveByModelTypeAndModelIdMutation, usePostApiV1ApprovalRejectByModelTypeAndModelIdMutation } = approvalApi;
