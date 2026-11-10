import { materialsApi } from "@/shared/api/generated/materials";
import { addTags } from "@/shared/api/add-tags";

export const expiryApi = materialsApi.enhanceEndpoints({
  endpoints: {
    getApiV1MaterialBatchByBatchId: (definition) => {
      definition.providesTags = addTags(definition.providesTags, [{ type: "StockOnShelves", id: "all" }]);
    },
    putApiV1MaterialBatchByBatchIdMigrationRetestDate: (definition) => {
      definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [
        "StockOnShelves", "Requisition", "RequisitionList", "SwapRequests",
      ]);
    },
  },
});
