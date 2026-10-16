import { analyticalApi } from "@/shared/api/generated/analytical";
import { formsApi } from "@/shared/api/generated/forms";
import { materialsApi } from "@/shared/api/generated/materials";
import { warehouseApi } from "@/shared/api/generated/warehouse";

// Everything about one received batch is tagged with it, so a step on the batch refreshes its note, its test and its results.
const grns = { type: "QcGrns" as const, id: "all" };
const batch = (id: string) => ({ type: "QcBatch" as const, id });
const fresh = (id: string) => (_result: unknown, error: unknown) => error ? [] : [grns, batch(id)];

export const qcGrnWarehouseApi = warehouseApi.enhanceEndpoints({ addTagTypes: ["QcGrns", "QcBatch"], endpoints: {
  getApiV1WarehouseGrnsQc: { providesTags: [grns] },
  getApiV1WarehouseGrnById: { providesTags: [grns] },
} });
export const qcGrnAnalyticalApi = analyticalApi.enhanceEndpoints({ addTagTypes: ["QcGrns", "QcBatch"], endpoints: {
  getApiV1MaterialArdMaterialBatchByMaterialBatchId: { providesTags: (_result, _error, arg) => [batch(arg.materialBatchId)] },
  getApiV1MaterialArdMaterialBatchDetailsByMaterialBatchId: { providesTags: (_result, _error, arg) => [batch(arg.materialBatchId)] },
  getApiV1MaterialSamplingsByGrnIdAndBatchId: { providesTags: (_result, _error, arg) => [batch(arg.batchId)] },
  postApiV1MaterialSamplings: { invalidatesTags: (_result, error, arg) => error ? [] : [grns, batch(arg.domainEntitiesMaterialSamplingCreateMaterialSamplingRequest.materialBatchId ?? "")] },
  putApiV1MaterialArdStartTestByMaterialBatchId: { invalidatesTags: (_result, error, arg) => fresh(arg.materialBatchId)(_result, error) },
} });
export const qcGrnMaterialsApi = materialsApi.enhanceEndpoints({ addTagTypes: ["QcGrns", "QcBatch"], endpoints: {
  getApiV1MaterialBatchByBatchId: { providesTags: (_result, _error, arg) => [batch(arg.batchId)] },
  postApiV1MaterialBatchByBatchIdRequestRetest: { invalidatesTags: (_result, error, arg) => fresh(arg.batchId)(_result, error) },
  postApiV1MaterialBatchByBatchIdCompleteRetest: { invalidatesTags: (_result, error, arg) => fresh(arg.batchId)(_result, error) },
} });
export const qcGrnFormsApi = formsApi.enhanceEndpoints({ addTagTypes: ["QcGrns", "QcBatch"], endpoints: {
  getApiV1FormAssigneesMaterialBatchByMaterialBatchId: { providesTags: (_result, _error, arg) => [batch(arg.materialBatchId)] },
  getApiV1FormResponsesMaterialBatchByMaterialBatchId: { providesTags: (_result, _error, arg) => [batch(arg.materialBatchId)] },
  postApiV1FormGenerateCertificateByMaterialBatchId: { invalidatesTags: (_result, error, arg) => fresh(arg.materialBatchId)(_result, error) },
} });
export const qcBatchTag = batch;
export const qcGrnsTag = grns;
