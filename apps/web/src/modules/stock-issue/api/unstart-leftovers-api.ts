import { warehouseApi } from "@/shared/api/generated/warehouse";
import { addTags } from "@/shared/api/add-tags";

const refresh = ["Requisition", "RequisitionList", "StockIssue", "PendingApprovals", "SwapRequests"] as const;
export const unstartLeftoversApi = warehouseApi.enhanceEndpoints({ endpoints: {
  repairRawUnstartLeftovers: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : refresh); },
  repairPackagingUnstartLeftovers: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : refresh); },
} });
export const { usePreviewRawUnstartLeftoversQuery, usePreviewPackagingUnstartLeftoversQuery,
  useRepairRawUnstartLeftoversMutation, useRepairPackagingUnstartLeftoversMutation } = unstartLeftoversApi;
