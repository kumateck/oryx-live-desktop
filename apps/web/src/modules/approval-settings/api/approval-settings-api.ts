import { approvalsApi } from "@/shared/api/generated/approvals";
import { addTags } from "@/shared/api/add-tags";
const list = { type: "ApprovalConfiguration" as const, id: "list" };
export const approvalSettingsAudit = { module: "Settings", subModule: "Approvals" };
export const approvalSettingsApi = approvalsApi.enhanceEndpoints({ addTagTypes: ["ApprovalConfiguration"], endpoints: {
  getApiV1Approval: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
  getApiV1ApprovalByApprovalId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_data, _error, arg) => [{ type: "ApprovalConfiguration", id: arg.approvalId }]); },
  postApiV1Approval: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_data, error) => error ? [] : [list]); },
  putApiV1ApprovalByApprovalId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_data, error, arg) => error ? [] : [list, { type: "ApprovalConfiguration", id: arg.approvalId }]); },
  deleteApiV1ApprovalByApprovalId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_data, error, arg) => error ? [] : [list, { type: "ApprovalConfiguration", id: arg.approvalId }]); },
} });
