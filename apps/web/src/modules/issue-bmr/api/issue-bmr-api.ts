import { productionApi } from "@/shared/api/generated/production";
import { addTags } from "@/shared/api/add-tags";

const records = { type: "BatchManufacturingRecords" as const, id: "all" };
const record = (id: string) => ({ type: "BatchManufacturingRecords" as const, id });

export const issueBmrApi = productionApi.enhanceEndpoints({ addTagTypes: ["BatchManufacturingRecords"], endpoints: {
  getApiV1ProductionScheduleManufacturing: (definition) => { definition.providesTags = addTags(definition.providesTags, [records]); },
  getApiV1ProductionScheduleManufacturingByBatchManufacturingRecordId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [record(arg.batchManufacturingRecordId)]); },
  putApiV1ProductionScheduleManufacturingById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [records, record(arg.id)]); },
  putApiV1ProductionScheduleManufacturingIssueById: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [records, record(arg.id)]); },
} });

export const {
  useGetApiV1ProductionScheduleManufacturingQuery, useGetApiV1ProductionScheduleManufacturingByBatchManufacturingRecordIdQuery,
  usePutApiV1ProductionScheduleManufacturingByIdMutation, usePutApiV1ProductionScheduleManufacturingIssueByIdMutation,
  useGetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdQuery, useGetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdQuery,
} = issueBmrApi;
