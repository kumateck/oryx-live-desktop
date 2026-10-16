import { productionApi } from "@/shared/api/generated/production";

const records = { type: "BatchManufacturingRecords" as const, id: "all" };
const record = (id: string) => ({ type: "BatchManufacturingRecords" as const, id });

export const issueBmrApi = productionApi.enhanceEndpoints({ addTagTypes: ["BatchManufacturingRecords"], endpoints: {
  getApiV1ProductionScheduleManufacturing: { providesTags: [records] },
  getApiV1ProductionScheduleManufacturingByBatchManufacturingRecordId: { providesTags: (_result, _error, arg) => [record(arg.batchManufacturingRecordId)] },
  putApiV1ProductionScheduleManufacturingById: { invalidatesTags: (_result, error, arg) => error ? [] : [records, record(arg.id)] },
  putApiV1ProductionScheduleManufacturingIssueById: { invalidatesTags: (_result, error, arg) => error ? [] : [records, record(arg.id)] },
} });

export const {
  useGetApiV1ProductionScheduleManufacturingQuery, useGetApiV1ProductionScheduleManufacturingByBatchManufacturingRecordIdQuery,
  usePutApiV1ProductionScheduleManufacturingByIdMutation, usePutApiV1ProductionScheduleManufacturingIssueByIdMutation,
  useGetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdQuery, useGetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdQuery,
} = issueBmrApi;
