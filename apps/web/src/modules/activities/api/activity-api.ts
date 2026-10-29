import { analyticalApi } from "@/shared/api/generated/analytical";
import { productionApi } from "@/shared/api/generated/production";
import { settingsApi } from "@/shared/api/generated/settings";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { addTags } from "@/shared/api/add-tags";

const board = { type: "ActivityBoard" as const, id: "all" };
const records = (batchId: string | undefined) => [{ type: "BatchRecords" as const, id: batchId ?? "unknown" }];

export const activityApi = productionApi.enhanceEndpoints({
  endpoints: {
    getProductionStepRecords: (definition) => { definition.providesTags = addTags(definition.providesTags,
      (result, _error, arg) => [{ type: "Activity", id: arg.activityId }, ...records(result?.productionScheduleProductId)]); },
    getApiV1ProductionScheduleActivityOperationGrouped: (definition) => { definition.providesTags = addTags(definition.providesTags, [board]); },
    getApiV1ProductionScheduleActivityByProductionActivityId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [{ type: "Activity", id: arg.productionActivityId }]); },
    // A status change moves the run on and can touch the batch's other records, so everything about runs is read again.
    putApiV1ProductionScheduleActivityStepByProductionStepIdStatus: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : ["Activity", board, "BatchRecords", "ScheduleBatch"]); },
    postApiV1ProductionScheduleReturnBeforeProduction: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : ["Activity", board, "BatchRecords", "ScheduleBatch", "Schedule", { type: "ScheduleList", id: "all" }]); },
    postApiV1ProductionScheduleExtraPackingByProductionScheduleProductId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [...records(arg.productionScheduleProductId), "Activity"]); },
    postApiV1ProductionScheduleFinalPacking: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : ["Activity", board, "BatchRecords", "ScheduleBatch"]); },
    postApiV1ProductionScheduleReturnAfterProduction: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : ["BatchRecords", "ScheduleBatch"]); },
    postApiV1ProductionScheduleFinishedGoodsTransferNote: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : ["Activity", board, "BatchRecords"]); },
    getApiV1ProductionScheduleFinishedGoodsTransferNoteBmrByBatchManufacturingRecordId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => records(arg.batchManufacturingRecordId)); },
    getApiV1ProductionScheduleFinalPackingProductByProductionScheduleProductId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => records(arg.productionScheduleProductId)); },
    getApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => records(arg.productionScheduleProductId)); },
    getApiV1ProductionScheduleManufacturingProductByProductionScheduleProductId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => records(arg.productionScheduleProductId)); },
    getApiV1ProductionScheduleStockRequisitionRawByProductionScheduleProductId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => records(arg.productionScheduleProductId)); },
    getApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => records(arg.productionScheduleProductId)); },
  },
});

export const {
  useGetProductionStepRecordsQuery,
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
    postApiV1Requisition: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : ["Activity", board, ...records(arg.domainEntitiesRequisitionsRequestCreateRequisitionRequest.productionScheduleProductId ?? undefined)]); },
  },
});
export const { usePostApiV1RequisitionMutation } = requisitionApi;
const atr = { type: "BatchRecords" as const, id: "atr" };
export const testRequestApi = analyticalApi.enhanceEndpoints({
  endpoints: {
    getApiV1QaAnalyticalTestsActivityStepByActivityStepId: (definition) => { definition.providesTags = addTags(definition.providesTags, [atr]); },
    postApiV1QaAnalyticalTests: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [atr, "Activity"]); },
  },
});
export const { useGetApiV1QaAnalyticalTestsActivityStepByActivityStepIdQuery, usePostApiV1QaAnalyticalTestsMutation } = testRequestApi;
export const { usePostApiV1CollectionMutation } = settingsApi;
