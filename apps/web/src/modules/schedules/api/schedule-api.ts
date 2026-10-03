import { productionApi } from "@/shared/api/generated/production";
import { productsApi } from "@/shared/api/generated/products";
import { salesApi } from "@/shared/api/generated/sales";

const list = { type: "ScheduleList" as const, id: "all" };

export const scheduleApi = productionApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProductionSchedule: { providesTags: [list] },
    getApiV1ProductionScheduleByScheduleId: { providesTags: (_result, _error, arg) => [{ type: "Schedule", id: arg.scheduleId }] },
    postApiV1ProductionSchedule: { invalidatesTags: (_result, error) => error ? [] : [list] },
    putApiV1ProductionScheduleByScheduleIdAddProducts: { invalidatesTags: (_result, error, arg) => error ? [] : [list, { type: "Schedule", id: arg.scheduleId }] },
    // Removing a batch is addressed by the batch, not the schedule, so every loaded schedule is refreshed.
    deleteApiV1ProductionScheduleProductByProductionScheduleProductId: { invalidatesTags: (_result, error) => error ? [] : [list, "Schedule"] },
    postApiV1ProductionScheduleActivityStartByProductionScheduleProductId: { invalidatesTags: (_result, error, arg) => error ? [] : [list, "Schedule", { type: "ScheduleBatch", id: arg.productionScheduleProductId }] },
    getApiV1ProductionScheduleActivityProductByProductionScheduleProductId: { providesTags: (_result, _error, arg) => [{ type: "ScheduleBatch", id: arg.productionScheduleProductId }] },
    getApiV1ProductionScheduleMaterialStockByProductionScheduleProductId: { providesTags: (_result, _error, arg) => [{ type: "ScheduleBatch", id: arg.productionScheduleProductId }] },
    getApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductId: { providesTags: (_result, _error, arg) => [{ type: "ScheduleBatch", id: arg.productionScheduleProductId }] },
    putApiV1ProductionScheduleByScheduleId: { invalidatesTags: (_result, error, arg) => error ? [] : [list, { type: "Schedule", id: arg.scheduleId }] },
  },
});

export const {
  useGetApiV1ProductionScheduleQuery, useGetApiV1ProductionScheduleForecastQuery, useGetApiV1ProductionScheduleByScheduleIdQuery,
  usePostApiV1ProductionScheduleMutation, usePutApiV1ProductionScheduleByScheduleIdMutation,
  usePutApiV1ProductionScheduleByScheduleIdAddProductsMutation, useDeleteApiV1ProductionScheduleProductByProductionScheduleProductIdMutation,
  usePostApiV1ProductionScheduleActivityStartByProductionScheduleProductIdMutation,
  useGetApiV1ProductionScheduleActivityProductByProductionScheduleProductIdQuery,
  useGetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdQuery,
  useGetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdQuery,
} = scheduleApi;
// What a schedule's product lines choose from.
export const { useLazyGetApiV1ProductQuery, useGetApiV1ProductByProductIdPackingQuery } = productsApi;
export const { useGetApiV1CustomersQuery } = salesApi;
