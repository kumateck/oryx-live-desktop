import { materialsApi } from "@/shared/api/generated/materials";
import { warehouseApi } from "@/shared/api/generated/warehouse";

const list = { type: "StockIssue" as const, id: "all" };
const swaps = { type: "SwapRequests" as const, id: "all" };

export const stockIssueApi = warehouseApi.enhanceEndpoints({
  endpoints: {
    getApiV1RequisitionDepartment: { providesTags: [list] },
    // Issuing moves the stock to production, so shelves and the requisition itself change.
    postApiV1RequisitionIssueStockRequisitionByStockRequisitionId: { invalidatesTags: (_result, error, arg) => error ? [] : [list, { type: "Requisition", id: arg.stockRequisitionId }, "RequisitionList", "StockOnShelves", "ActivityBoard"] },
    // What can be swapped changes whenever a swap is asked for or decided.
    getApiV1RequisitionByRequisitionIdAlternativeBatches: { providesTags: [swaps, "StockOnShelves"] },
    getApiV1WarehouseSwap: { providesTags: [swaps] },
    postApiV1WarehouseSwap: { invalidatesTags: (_result, error) => error ? [] : [swaps] },
  },
});
export const { useGetApiV1RequisitionDepartmentQuery, usePostApiV1RequisitionIssueStockRequisitionByStockRequisitionIdMutation, useGetApiV1RequisitionByRequisitionIdAlternativeBatchesQuery, useGetApiV1WarehouseSwapQuery,
  usePostApiV1WarehouseSwapMutation } = stockIssueApi;
export const { useLazyGetApiV1MaterialByMaterialIdShelfQuery } = materialsApi;
