import { analyticalApi } from "@/shared/api/generated/analytical";
import { formsApi } from "@/shared/api/generated/forms";
import { materialsApi } from "@/shared/api/generated/materials";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { addTags } from "@/shared/api/add-tags";

// Everything about one received batch is tagged with it, so a step on the batch refreshes its note, its test and its results.
const grns = { type: "QcGrns" as const, id: "all" };
const batch = (id: string) => ({ type: "QcBatch" as const, id });
const fresh = (id: string) => (_result: unknown, error: unknown) => error ? [] : [grns, batch(id)];

export const qcGrnWarehouseApi = warehouseApi.enhanceEndpoints({ addTagTypes: ["QcGrns", "QcBatch"], endpoints: {
  getApiV1WarehouseGrnsQc: (definition) => { definition.providesTags = addTags(definition.providesTags, [grns]); },
  getApiV1WarehouseGrnById: (definition) => { definition.providesTags = addTags(definition.providesTags, [grns]); },
} });
export const qcGrnAnalyticalApi = analyticalApi.enhanceEndpoints({ addTagTypes: ["QcGrns", "QcBatch"], endpoints: {
  getApiV1MaterialArdMaterialBatchByMaterialBatchId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [batch(arg.materialBatchId)]); },
  getApiV1MaterialArdMaterialBatchDetailsByMaterialBatchId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [batch(arg.materialBatchId)]); },
  getApiV1MaterialSamplingsByGrnIdAndBatchId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [batch(arg.batchId)]); },
  postApiV1MaterialSamplings: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [grns, batch(arg.domainEntitiesMaterialSamplingCreateMaterialSamplingRequest.materialBatchId ?? "")]); },
  putApiV1MaterialArdStartTestByMaterialBatchId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => fresh(arg.materialBatchId)(_result, error)); },
} });
export const qcGrnMaterialsApi = materialsApi.enhanceEndpoints({ addTagTypes: ["QcGrns", "QcBatch"], endpoints: {
  getApiV1MaterialBatchByBatchId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [batch(arg.batchId)]); },
  postApiV1MaterialBatchByBatchIdRequestRetest: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => fresh(arg.batchId)(_result, error)); },
  postApiV1MaterialBatchByBatchIdCompleteRetest: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => fresh(arg.batchId)(_result, error)); },
} });
export const qcGrnFormsApi = formsApi.enhanceEndpoints({ addTagTypes: ["QcGrns", "QcBatch"], endpoints: {
  getApiV1FormAssigneesMaterialBatchByMaterialBatchId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [batch(arg.materialBatchId)]); },
  getApiV1FormResponsesMaterialBatchByMaterialBatchId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [batch(arg.materialBatchId)]); },
  postApiV1FormGenerateCertificateByMaterialBatchId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => fresh(arg.materialBatchId)(_result, error)); },
  // Assigning analysts moves the batch to "Test assigned", where it can be started.
  postApiV1FormAssignees: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => { const id = arg.domainEntitiesFormsRequestCreateFormAssigneeRequest.materialBatchId; return id ? fresh(id)(_result, error) : []; }); },
} });
export const qcBatchTag = batch;
export const qcGrnsTag = grns;
