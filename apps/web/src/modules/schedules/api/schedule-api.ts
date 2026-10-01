import { productionApi } from "@/shared/api/generated/production";
import { productsApi } from "@/shared/api/generated/products";
import { salesApi } from "@/shared/api/generated/sales";

const list = { type: "ScheduleList" as const, id: "all" };

export const scheduleApi = productionApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProductionSchedule: { providesTags: [list] },
    getApiV1ProductionScheduleByScheduleId: { providesTags: (_result, _error, arg) => [{ type: "Schedule", id: arg.scheduleId }] },
    postApiV1ProductionSchedule: { invalidatesTags: (_result, error) => error ? [] : [list] },
    putApiV1ProductionScheduleByScheduleId: { invalidatesTags: (_result, error, arg) => error ? [] : [list, { type: "Schedule", id: arg.scheduleId }] },
  },
});

export const {
  useGetApiV1ProductionScheduleQuery, useGetApiV1ProductionScheduleForecastQuery, useGetApiV1ProductionScheduleByScheduleIdQuery,
  usePostApiV1ProductionScheduleMutation, usePutApiV1ProductionScheduleByScheduleIdMutation,
} = scheduleApi;
// What a schedule's product lines choose from.
export const { useLazyGetApiV1ProductQuery, useGetApiV1ProductByProductIdPackingQuery } = productsApi;
export const { useGetApiV1CustomersQuery } = salesApi;
