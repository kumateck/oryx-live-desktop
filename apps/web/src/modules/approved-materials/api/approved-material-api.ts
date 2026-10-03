import { materialsApi } from "@/shared/api/generated/materials";
import { warehouseApi } from "@/shared/api/generated/warehouse";

const shelves = { type: "StockOnShelves" as const, id: "all" };

// Moving stock between shelves changes all of these lists, so they share one tag.
export const approvedMaterialApi = materialsApi.enhanceEndpoints({
  endpoints: {
    getApiV1MaterialApprovedMaterials: { providesTags: [shelves] },
    getApiV1MaterialByMaterialIdBatchesV2AndDepartmentId: { providesTags: [shelves] },
    getApiV1MaterialByMaterialIdShelf: { providesTags: [shelves] },
    getApiV1MaterialByMaterialIdReserved: { providesTags: [shelves] },
  },
});
export const {
  useGetApiV1MaterialApprovedMaterialsQuery, useGetApiV1MaterialByMaterialIdQuery, useGetApiV1MaterialByMaterialIdBatchesV2AndDepartmentIdQuery,
  useGetApiV1MaterialByMaterialIdReservedQuery,
} = approvedMaterialApi;
export const { useGetApiV1WarehouseBincardinformationByMaterialIdAndDepartmentIdQuery } = warehouseApi;
