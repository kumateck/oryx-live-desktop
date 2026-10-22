import { productionApi } from "@/shared/api/generated/production";
import { addTags } from "@/shared/api/add-tags";
const tags = [{ type: "StockTransfers" as const, id: "all" }];
export const productionTransfersApi = productionApi.enhanceEndpoints({ endpoints: {
  getApiV1ProductionScheduleStockTransferInBound: (definition) => { definition.providesTags = addTags(definition.providesTags, tags); },
  getApiV1ProductionScheduleStockTransferOutBound: (definition) => { definition.providesTags = addTags(definition.providesTags, tags); },
  getApiV1ProductionScheduleStockTransferByStockTransferId: (definition) => { definition.providesTags = addTags(definition.providesTags, tags); },
  putApiV1ProductionScheduleStockTransferApproveByStockTransferId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : tags); },
  putApiV1ProductionScheduleStockTransferRejectByStockTransferId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : tags); },
} });
