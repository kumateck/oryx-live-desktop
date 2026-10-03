import { approvalsApi } from "@/shared/api/generated/approvals";

// Workflows are few and change rarely; one tag covers the list and each record.
const list = { type: "PendingApprovals" as const, id: "workflows" };
const changed = (_result: unknown, error: unknown) => error ? [] : [list];

export const workflowApi = approvalsApi.enhanceEndpoints({
  endpoints: {
    getApiV1Approval: { providesTags: [list] },
    getApiV1ApprovalByApprovalId: { providesTags: [list] },
    postApiV1Approval: { invalidatesTags: changed },
    putApiV1ApprovalByApprovalId: { invalidatesTags: changed },
    deleteApiV1ApprovalByApprovalId: { invalidatesTags: changed },
  },
});
export const { useGetApiV1ApprovalQuery, useGetApiV1ApprovalByApprovalIdQuery, usePostApiV1ApprovalMutation, usePutApiV1ApprovalByApprovalIdMutation, useDeleteApiV1ApprovalByApprovalIdMutation } = workflowApi;
