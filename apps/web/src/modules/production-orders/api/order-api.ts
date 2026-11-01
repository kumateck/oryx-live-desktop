import { productionApi } from "@/shared/api/generated/production";
import { addTags } from "@/shared/api/add-tags";

const list = { type: "ProductionOrders" as const, id: "all" };
const goods = { type: "FinishedGoods" as const, id: "all" };

export const orderApi = productionApi.enhanceEndpoints({ endpoints: {
  getApiV1ProductionOrders: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); }, getApiV1ProductionOrdersById: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
  getApiV1ProductionScheduleApprovedProductsProductByProductId: (definition) => { definition.providesTags = addTags(definition.providesTags, [goods]); },
  // A packing list takes packs from approved batches and moves the order on.
  postApiV1ProductionOrdersAllocate: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [list, goods]); },
  putApiV1ProductionOrdersAllocateByAllocateProductionOrderId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [list, goods]); },
} });
export const { useGetApiV1ProductionOrdersQuery, useGetApiV1ProductionOrdersByIdQuery, useLazyGetApiV1ProductionScheduleApprovedProductsProductByProductIdQuery, usePostApiV1ProductionOrdersAllocateMutation, usePutApiV1ProductionOrdersAllocateByAllocateProductionOrderIdMutation } = orderApi;
