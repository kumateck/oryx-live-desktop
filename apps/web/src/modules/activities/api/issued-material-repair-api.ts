import { productionApi } from "@/shared/api/generated/production";
import { addTags } from "@/shared/api/add-tags";

export const issuedMaterialRepairApi = productionApi.enhanceEndpoints({
  endpoints: {
    applyIssuedMaterialRepair: (definition) => {
      definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [
        "Activity", { type: "BatchRecords", id: arg.batchId }, { type: "ScheduleBatch", id: arg.batchId },
        "Requisition", "StockIssue", "StockOnShelves", "warehouse/bincardinformation",
      ]);
    },
  },
});
export const { usePreviewIssuedMaterialRepairQuery, useApplyIssuedMaterialRepairMutation } = issuedMaterialRepairApi;
