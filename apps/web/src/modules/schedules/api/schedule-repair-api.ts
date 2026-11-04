import { productionApi } from "@/shared/api/generated/production";
import { addTags } from "@/shared/api/add-tags";

export const scheduleRepairApi = productionApi.enhanceEndpoints({ endpoints: {
  applyScheduleProductRepair: (definition) => {
    definition.invalidatesTags = addTags(definition.invalidatesTags, (result, error, arg) => error ? [] : [
      { type: "Schedule", id: arg.scheduleId }, "ScheduleBatch", "Activity", "ActivityBoard", "BatchRecords",
      ...(result?.requiringApproval ? ["PendingApprovals" as const] : []), "Requisition", "RequisitionList", "StockIssue", "StockOnShelves", "MaterialList",
    ]);
  },
} });
