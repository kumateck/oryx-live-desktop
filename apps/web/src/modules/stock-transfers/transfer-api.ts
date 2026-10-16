import { api } from "@/shared/api/base-api";
import { materialsApi } from "@/shared/api/generated/materials";
import { productionApi } from "@/shared/api/generated/production";
import { addTags } from "@/shared/api/add-tags";

const list = { type: "StockTransfers" as const, id: "all" };
const held = { type: "StockTransfers" as const, id: "held" };

export const transferApi = productionApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProductionScheduleStockTransferInBound: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    getApiV1ProductionScheduleStockTransferOutBound: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    getApiV1ProductionScheduleStockTransferByStockTransferId: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    getApiV1ProductionScheduleStockTransferBatchByStockTransferId: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    // Issuing takes the stock off this store's shelves and puts it in the other department's holding.
    putApiV1ProductionScheduleStockTransferIssueByStockTransferId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [list, held, "StockOnShelves"]); },
  },
});
export const heldApi = materialsApi.enhanceEndpoints({ endpoints: { getApiV1MaterialHolding: (definition) => { definition.providesTags = addTags(definition.providesTags, [held]); } } });

export interface ShelveHeldRequest { materialBatchId: string; holdingMaterialId: string; shelfMaterialBatches: { warehouseLocationShelfId: string; quantity: number; uomId: string | null; note: string }[] }
/** The server's action for shelving transferred stock is not in its published contract, so it is declared here. */
const moveApi = api.injectEndpoints({
  endpoints: (build) => ({
    shelveHeldStock: build.mutation<void, { body: ShelveHeldRequest; module: string; subModule: string }>({
      query: ({ body, module, subModule }) => ({ url: "/api/v1/material/holding/move", method: "POST", body, headers: { Module: module, SubModule: subModule } }),
      invalidatesTags: (_result, error) => error ? [] : [held, "StockOnShelves"],
    }),
  }),
});
export const { useGetApiV1ProductionScheduleStockTransferInBoundQuery, useGetApiV1ProductionScheduleStockTransferOutBoundQuery, useGetApiV1ProductionScheduleStockTransferByStockTransferIdQuery,
  useGetApiV1ProductionScheduleStockTransferBatchByStockTransferIdQuery, usePutApiV1ProductionScheduleStockTransferIssueByStockTransferIdMutation } = transferApi;
export const { useGetApiV1MaterialHoldingQuery } = heldApi;
export const { useShelveHeldStockMutation } = moveApi;
