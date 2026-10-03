import { materialsApi } from "@/shared/api/generated/materials";
import { procurementApi } from "@/shared/api/generated/procurement";

const waiting = { type: "DistributedStock" as const, id: "all" };

const listApi = procurementApi.enhanceEndpoints({ endpoints: { getApiV1ProcurementDistributeMaterial: { providesTags: [waiting] } } });
// Shelved stock leaves this list and appears on the racks and in approved stock.
const shelveApi = materialsApi.enhanceEndpoints({ endpoints: { postApiV1MaterialDistributeMaterialMoveBatch: { invalidatesTags: (_result, error) => error ? [] : [waiting, { type: "StockOnShelves", id: "all" }] } } });

export const { useGetApiV1ProcurementDistributeMaterialQuery } = listApi;
export const { usePostApiV1MaterialDistributeMaterialMoveBatchMutation } = shelveApi;
