import { materialsApi } from "@/shared/api/generated/materials";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { addTags } from "@/shared/api/add-tags";

const shelves = { type: "StockOnShelves" as const, id: "all" };

// Moving stock between shelves changes all of these lists, so they share one tag.
export const approvedMaterialApi = materialsApi.enhanceEndpoints({
  endpoints: {
    getApiV1MaterialApprovedMaterials: (definition) => { definition.providesTags = addTags(definition.providesTags, [shelves]); },
    getApiV1MaterialByMaterialIdBatchesV2AndDepartmentId: (definition) => { definition.providesTags = addTags(definition.providesTags, [shelves]); },
    getApiV1MaterialByMaterialIdShelf: (definition) => { definition.providesTags = addTags(definition.providesTags, [shelves]); },
    getApiV1MaterialByMaterialIdReserved: (definition) => { definition.providesTags = addTags(definition.providesTags, [shelves]); },
  },
});
export const {
  useGetApiV1MaterialApprovedMaterialsQuery, useGetApiV1MaterialByMaterialIdQuery, useGetApiV1MaterialByMaterialIdBatchesV2AndDepartmentIdQuery,
  useGetApiV1MaterialByMaterialIdReservedQuery,
} = approvedMaterialApi;
export const { useGetApiV1WarehouseBincardinformationByMaterialIdAndDepartmentIdQuery } = warehouseApi;
