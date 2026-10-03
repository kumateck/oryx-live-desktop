import { productionApi } from "@/shared/api/generated/production";

const list = { type: "ProductionOrders" as const, id: "all" };
const goods = { type: "FinishedGoods" as const, id: "all" };

export const orderApi = productionApi.enhanceEndpoints({ endpoints: {
  getApiV1ProductionOrders: { providesTags: [list] }, getApiV1ProductionOrdersById: { providesTags: [list] },
  getApiV1ProductionScheduleApprovedProductsProductByProductId: { providesTags: [goods] },
  // A packing list takes packs from approved batches and moves the order on.
  postApiV1ProductionOrdersAllocate: { invalidatesTags: (_result, error) => error ? [] : [list, goods] },
} });
export const { useGetApiV1ProductionOrdersQuery, useGetApiV1ProductionOrdersByIdQuery, useLazyGetApiV1ProductionScheduleApprovedProductsProductByProductIdQuery, usePostApiV1ProductionOrdersAllocateMutation } = orderApi;
