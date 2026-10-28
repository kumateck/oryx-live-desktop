import { materialsApi } from "@/shared/api/generated/materials";
import { productionApi } from "@/shared/api/generated/production";
import { addTags } from "@/shared/api/add-tags";
const stockApi = productionApi.enhanceEndpoints({ endpoints: {
  postApiV1ProductionScheduleStockTransfer: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [{ type: "StockTransfers" as const, id: "all" }]); },
} });
export const { useGetApiV1MaterialByMaterialIdDepartmentStockAndQuantityQuery, useLazyGetApiV1MaterialByMaterialIdDepartmentStockAndQuantityQuery } = materialsApi;
export const { usePostApiV1ProductionScheduleStockTransferMutation } = stockApi;
