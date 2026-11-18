import { productionApi } from "@/shared/api/generated/production";
import { addTags } from "@/shared/api/add-tags";

export const productionUnstartApi = productionApi.enhanceEndpoints({ endpoints: {
  applyProductionUnstart: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags,
    (result, error, arg) => error ? [] : [{ type: "Activity", id: arg.activityId }, "ActivityBoard", "ScheduleList",
      ...(result?.scheduleId ? [{ type: "Schedule" as const, id: result.scheduleId }] : []),
      ...(result?.batchId ? [{ type: "ScheduleBatch" as const, id: result.batchId }] : []), "StockOnShelves", "BatchRecords",
      // Unstarting cancels the batch's requested-but-unissued stock requisitions: the issue queue, requisition lists and
      // their approvals must not keep showing them from cache.
      { type: "StockIssue" as const, id: "all" }, { type: "RequisitionList" as const, id: "all" }, "Requisition", "PendingApprovals", "SwapRequests"]); },
} });
export const { usePreviewProductionUnstartQuery, useApplyProductionUnstartMutation } = productionUnstartApi;
