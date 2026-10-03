import { analyticalApi } from "@/shared/api/generated/analytical";
import { productionApi } from "@/shared/api/generated/production";
import { settingsApi } from "@/shared/api/generated/settings";
import { warehouseApi } from "@/shared/api/generated/warehouse";

const board = { type: "ActivityBoard" as const, id: "all" };
const records = (batchId: string | undefined) => [{ type: "BatchRecords" as const, id: batchId ?? "unknown" }];

export const activityApi = productionApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProductionScheduleActivityOperationGrouped: { providesTags: [board] },
    getApiV1ProductionScheduleActivityByProductionActivityId: { providesTags: (_result, _error, arg) => [{ type: "Activity", id: arg.productionActivityId }] },
    // A status change moves the run on and can touch the batch's other records, so everything about runs is read again.
    putApiV1ProductionScheduleActivityStepByProductionStepIdStatus: { invalidatesTags: (_result, error) => error ? [] : ["Activity", board, "BatchRecords", "ScheduleBatch"] },
    postApiV1ProductionScheduleReturnBeforeProduction: { invalidatesTags: (_result, error) => error ? [] : ["Activity", board, "BatchRecords", "ScheduleBatch", "Schedule", { type: "ScheduleList", id: "all" }] },
    postApiV1ProductionScheduleExtraPackingByProductionScheduleProductId: { invalidatesTags: (_result, error, arg) => error ? [] : [...records(arg.productionScheduleProductId), "Activity"] },
    postApiV1ProductionScheduleFinalPacking: { invalidatesTags: (_result, error) => error ? [] : ["Activity", board, "BatchRecords", "ScheduleBatch"] },
    postApiV1ProductionScheduleReturnAfterProduction: { invalidatesTags: (_result, error) => error ? [] : ["BatchRecords", "ScheduleBatch"] },
    postApiV1ProductionScheduleFinishedGoodsTransferNote: { invalidatesTags: (_result, error) => error ? [] : ["Activity", board, "BatchRecords"] },
    getApiV1ProductionScheduleFinishedGoodsTransferNoteBmrByBatchManufacturingRecordId: { providesTags: (_result, _error, arg) => records(arg.batchManufacturingRecordId) },
    getApiV1ProductionScheduleFinalPackingProductByProductionScheduleProductId: { providesTags: (_result, _error, arg) => records(arg.productionScheduleProductId) },
    getApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductId: { providesTags: (_result, _error, arg) => records(arg.productionScheduleProductId) },
    getApiV1ProductionScheduleManufacturingProductByProductionScheduleProductId: { providesTags: (_result, _error, arg) => records(arg.productionScheduleProductId) },
    getApiV1ProductionScheduleStockRequisitionRawByProductionScheduleProductId: { providesTags: (_result, _error, arg) => records(arg.productionScheduleProductId) },
    getApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductId: { providesTags: (_result, _error, arg) => records(arg.productionScheduleProductId) },
  },
});

export const {
  useGetApiV1ProductionScheduleActivityOperationGroupedQuery, useGetApiV1ProductionScheduleActivityByProductionActivityIdQuery,
  usePutApiV1ProductionScheduleActivityStepByProductionStepIdStatusMutation, usePostApiV1ProductionScheduleReturnBeforeProductionMutation,
  usePostApiV1ProductionScheduleExtraPackingByProductionScheduleProductIdMutation,
  usePostApiV1ProductionScheduleFinalPackingMutation, usePostApiV1ProductionScheduleReturnAfterProductionMutation,
  usePostApiV1ProductionScheduleFinishedGoodsTransferNoteMutation, useGetApiV1ProductionScheduleFinishedGoodsTransferNoteBmrByBatchManufacturingRecordIdQuery,
  useGetApiV1ProductionScheduleFinalPackingProductByProductionScheduleProductIdQuery,
  useGetApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductIdQuery, useGetApiV1ProductionScheduleManufacturingProductByProductionScheduleProductIdQuery,
  useGetApiV1ProductionScheduleStockRequisitionRawByProductionScheduleProductIdQuery, useGetApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductIdQuery,
} = activityApi;

export const requisitionApi = warehouseApi.enhanceEndpoints({
  endpoints: {
    postApiV1Requisition: { invalidatesTags: (_result, error, arg) => error ? [] : ["Activity", board, ...records(arg.domainEntitiesRequisitionsRequestCreateRequisitionRequest.productionScheduleProductId ?? undefined)] },
  },
});
export const { usePostApiV1RequisitionMutation } = requisitionApi;
const atr = { type: "BatchRecords" as const, id: "atr" };
export const testRequestApi = analyticalApi.enhanceEndpoints({
  endpoints: {
    getApiV1QaAnalyticalTestsActivityStepByActivityStepId: { providesTags: [atr] },
    postApiV1QaAnalyticalTests: { invalidatesTags: (_result, error) => error ? [] : [atr, "Activity"] },
  },
});
export const { useGetApiV1QaAnalyticalTestsActivityStepByActivityStepIdQuery, usePostApiV1QaAnalyticalTestsMutation } = testRequestApi;
export const { usePostApiV1CollectionMutation } = settingsApi;
