import { approvalsApi } from "@/shared/api/generated/approvals";
import { addTags } from "@/shared/api/add-tags";

// Workflows are few and change rarely; one tag covers the list and each record.
const list = { type: "PendingApprovals" as const, id: "workflows" };
const changed = (_result: unknown, error: unknown) => error ? [] : [list];

export const workflowApi = approvalsApi.enhanceEndpoints({
  endpoints: {
    getApiV1Approval: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    getApiV1ApprovalByApprovalId: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    postApiV1Approval: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    putApiV1ApprovalByApprovalId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    deleteApiV1ApprovalByApprovalId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
  },
});
export const { useGetApiV1ApprovalQuery, useGetApiV1ApprovalByApprovalIdQuery, usePostApiV1ApprovalMutation, usePutApiV1ApprovalByApprovalIdMutation, useDeleteApiV1ApprovalByApprovalIdMutation } = workflowApi;
