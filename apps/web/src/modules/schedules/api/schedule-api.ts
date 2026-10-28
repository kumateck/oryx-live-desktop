import { productionApi } from "@/shared/api/generated/production";
import { productsApi } from "@/shared/api/generated/products";
import { salesApi } from "@/shared/api/generated/sales";
import { addTags } from "@/shared/api/add-tags";

const list = { type: "ScheduleList" as const, id: "all" };

export const scheduleApi = productionApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProductionSchedule: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    getApiV1ProductionScheduleByScheduleId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [{ type: "Schedule", id: arg.scheduleId }]); },
    postApiV1ProductionSchedule: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [list]); },
    putApiV1ProductionScheduleByScheduleIdAddProducts: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [list, { type: "Schedule", id: arg.scheduleId }]); },
    // Removing a batch is addressed by the batch, not the schedule, so every loaded schedule is refreshed.
    deleteApiV1ProductionScheduleProductByProductionScheduleProductId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [list, "Schedule"]); },
    postApiV1ProductionScheduleActivityStartByProductionScheduleProductId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [list, "Schedule", { type: "ScheduleBatch", id: arg.productionScheduleProductId }]); },
    getApiV1ProductionScheduleActivityProductByProductionScheduleProductId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [{ type: "ScheduleBatch", id: arg.productionScheduleProductId }]); },
    getApiV1ProductionScheduleMaterialStockByProductionScheduleProductId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [{ type: "ScheduleBatch", id: arg.productionScheduleProductId }]); },
    getApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [{ type: "ScheduleBatch", id: arg.productionScheduleProductId }]); },
    putApiV1ProductionScheduleByScheduleId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [list, { type: "Schedule", id: arg.scheduleId }]); },
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
