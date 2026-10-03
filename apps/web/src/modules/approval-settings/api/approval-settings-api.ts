import { approvalsApi } from "@/shared/api/generated/approvals";
const list = { type: "ApprovalConfiguration" as const, id: "list" };
export const approvalSettingsAudit = { module: "Settings", subModule: "Approvals" };
export const approvalSettingsApi = approvalsApi.enhanceEndpoints({ addTagTypes: ["ApprovalConfiguration"], endpoints: {
  getApiV1Approval: { providesTags: [list] },
  getApiV1ApprovalByApprovalId: { providesTags: (_data, _error, arg) => [{ type: "ApprovalConfiguration", id: arg.approvalId }] },
  postApiV1Approval: { invalidatesTags: (_data, error) => error ? [] : [list] },
  putApiV1ApprovalByApprovalId: { invalidatesTags: (_data, error, arg) => error ? [] : [list, { type: "ApprovalConfiguration", id: arg.approvalId }] },
  deleteApiV1ApprovalByApprovalId: { invalidatesTags: (_data, error, arg) => error ? [] : [list, { type: "ApprovalConfiguration", id: arg.approvalId }] },
} });
