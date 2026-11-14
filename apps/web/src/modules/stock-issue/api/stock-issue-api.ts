import { materialsApi } from "@/shared/api/generated/materials";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { addTags } from "@/shared/api/add-tags";

const list = { type: "StockIssue" as const, id: "all" };
const swaps = { type: "SwapRequests" as const, id: "all" };

export const stockIssueApi = warehouseApi.enhanceEndpoints({
  endpoints: {
    getApiV1RequisitionDepartment: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    // Issuing moves the stock to production, so shelves and the requisition itself change.
    postApiV1RequisitionIssueStockRequisitionByStockRequisitionId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [list, { type: "Requisition", id: arg.stockRequisitionId }, "RequisitionList", "StockOnShelves", "ActivityBoard"]); },
    // What can be swapped changes whenever a swap is asked for or decided.
    getApiV1RequisitionByRequisitionIdAlternativeBatches: (definition) => { definition.providesTags = addTags(definition.providesTags, [swaps, "StockOnShelves"]); },
    // The store's choice of BOM material or substitute: it moves the reservation and rewrites the requisition line.
    getApiV1RequisitionByRequisitionIdMaterialOptions: (definition) => { definition.providesTags = addTags(definition.providesTags, [swaps, "StockOnShelves"]); },
    postApiV1RequisitionByRequisitionIdMaterialOptions: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [list, swaps, { type: "Requisition", id: arg.requisitionId }, "RequisitionList", "StockOnShelves", "ActivityBoard"]); },
    getApiV1WarehouseSwap: (definition) => { definition.providesTags = addTags(definition.providesTags, [swaps]); },
    postApiV1WarehouseSwap: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [swaps]); },
  },
});
export const { useGetApiV1RequisitionByRequisitionIdMaterialOptionsQuery, usePostApiV1RequisitionByRequisitionIdMaterialOptionsMutation } = stockIssueApi;
export const { useGetApiV1RequisitionDepartmentQuery, usePostApiV1RequisitionIssueStockRequisitionByStockRequisitionIdMutation, useGetApiV1RequisitionByRequisitionIdAlternativeBatchesQuery, useGetApiV1WarehouseSwapQuery,
  usePostApiV1WarehouseSwapMutation } = stockIssueApi;
export const { useLazyGetApiV1MaterialByMaterialIdShelfQuery } = materialsApi;
