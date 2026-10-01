import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiV1Bom: build.mutation<PostApiV1BomApiResponse, PostApiV1BomApiArg>({
      query: (queryArg) => ({
        url: `/api/v1/bom`,
        method: "POST",
        body: queryArg.domainEntitiesBillOfMaterialsRequestCreateBillOfMaterialRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1BomByBillOfMaterialId: build.mutation<
      PutApiV1BomByBillOfMaterialIdApiResponse,
      PutApiV1BomByBillOfMaterialIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/bom/${queryArg.billOfMaterialId}`,
        method: "PUT",
        body: queryArg.domainEntitiesProductsCreateProductBillOfMaterialRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1BomByBillOfMaterialId: build.mutation<
      DeleteApiV1BomByBillOfMaterialIdApiResponse,
      DeleteApiV1BomByBillOfMaterialIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/bom/${queryArg.billOfMaterialId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1Material: build.mutation<
      PostApiV1MaterialApiResponse,
      PostApiV1MaterialApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material`,
        method: "POST",
        body: queryArg.domainEntitiesMaterialsCreateMaterialRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Material: build.query<
      GetApiV1MaterialApiResponse,
      GetApiV1MaterialApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          kind: queryArg.kind,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1MaterialByMaterialId: build.query<
      GetApiV1MaterialByMaterialIdApiResponse,
      GetApiV1MaterialByMaterialIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/${queryArg.materialId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1MaterialByMaterialId: build.mutation<
      PutApiV1MaterialByMaterialIdApiResponse,
      PutApiV1MaterialByMaterialIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/${queryArg.materialId}`,
        method: "PUT",
        body: queryArg.domainEntitiesMaterialsCreateMaterialRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1MaterialByMaterialId: build.mutation<
      DeleteApiV1MaterialByMaterialIdApiResponse,
      DeleteApiV1MaterialByMaterialIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/${queryArg.materialId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialNotLinkedToArds: build.query<
      GetApiV1MaterialNotLinkedToArdsApiResponse,
      GetApiV1MaterialNotLinkedToArdsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/not-linked-to-ards`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          kind: queryArg.kind,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          analysisType: queryArg.analysisType,
        },
      }),
    }),
    getApiV1MaterialCategory: build.query<
      GetApiV1MaterialCategoryApiResponse,
      GetApiV1MaterialCategoryApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/category`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    getApiV1MaterialAll: build.query<
      GetApiV1MaterialAllApiResponse,
      GetApiV1MaterialAllApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/all`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1MaterialByMaterialIdReorderLevel: build.mutation<
      PutApiV1MaterialByMaterialIdReorderLevelApiResponse,
      PutApiV1MaterialByMaterialIdReorderLevelApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/${queryArg.materialId}/reorder-level`,
        method: "PUT",
        body: queryArg.domainEntitiesMaterialsUpdateReOrderLevelRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialByMaterialIdStockLevel: build.query<
      GetApiV1MaterialByMaterialIdStockLevelApiResponse,
      GetApiV1MaterialByMaterialIdStockLevelApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/${queryArg.materialId}/stock-level`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialByMaterialIdBatches: build.query<
      GetApiV1MaterialByMaterialIdBatchesApiResponse,
      GetApiV1MaterialByMaterialIdBatchesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/${queryArg.materialId}/batches`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialByMaterialIdInTransit: build.query<
      GetApiV1MaterialByMaterialIdInTransitApiResponse,
      GetApiV1MaterialByMaterialIdInTransitApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/${queryArg.materialId}/in-transit`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1MaterialBatch: build.mutation<
      PostApiV1MaterialBatchApiResponse,
      PostApiV1MaterialBatchApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/batch`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialBatch: build.query<
      GetApiV1MaterialBatchApiResponse,
      GetApiV1MaterialBatchApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/batch`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1MaterialBatchByBatchId: build.query<
      GetApiV1MaterialBatchByBatchIdApiResponse,
      GetApiV1MaterialBatchByBatchIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/batch/${queryArg.batchId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1MaterialBatchByBatchIdApprove: build.mutation<
      PutApiV1MaterialBatchByBatchIdApproveApiResponse,
      PutApiV1MaterialBatchByBatchIdApproveApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/batch/${queryArg.batchId}/approve`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialByMaterialIdStockAndWarehouseId: build.query<
      GetApiV1MaterialByMaterialIdStockAndWarehouseIdApiResponse,
      GetApiV1MaterialByMaterialIdStockAndWarehouseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/${queryArg.materialId}/stock/${queryArg.warehouseId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialByMaterialIdStockAcrossWarehouses: build.query<
      GetApiV1MaterialByMaterialIdStockAcrossWarehousesApiResponse,
      GetApiV1MaterialByMaterialIdStockAcrossWarehousesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/${queryArg.materialId}/stock/across-warehouses`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialByMaterialIdStockPipeline: build.query<
      GetApiV1MaterialByMaterialIdStockPipelineApiResponse,
      GetApiV1MaterialByMaterialIdStockPipelineApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/${queryArg.materialId}/stock/pipeline`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialByMaterialIdDepartmentStockAndQuantity: build.query<
      GetApiV1MaterialByMaterialIdDepartmentStockAndQuantityApiResponse,
      GetApiV1MaterialByMaterialIdDepartmentStockAndQuantityApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/${queryArg.materialId}/department-stock/${queryArg.quantity}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1MaterialBatchStatus: build.mutation<
      PutApiV1MaterialBatchStatusApiResponse,
      PutApiV1MaterialBatchStatusApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/batch/status`,
        method: "PUT",
        body: queryArg.domainEntitiesMaterialsBatchUpdateBatchStatusRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1MaterialBatchByBatchIdRequestRetest: build.mutation<
      PostApiV1MaterialBatchByBatchIdRequestRetestApiResponse,
      PostApiV1MaterialBatchByBatchIdRequestRetestApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/batch/${queryArg.batchId}/request-retest`,
        method: "POST",
        body: queryArg.domainEntitiesMaterialsBatchRequestRetestDto,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1MaterialBatchByBatchIdCompleteRetest: build.mutation<
      PostApiV1MaterialBatchByBatchIdCompleteRetestApiResponse,
      PostApiV1MaterialBatchByBatchIdCompleteRetestApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/batch/${queryArg.batchId}/complete-retest`,
        method: "POST",
        body: queryArg.domainEntitiesMaterialsBatchCompleteRetestDto,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1MaterialBatchSupply: build.mutation<
      PostApiV1MaterialBatchSupplyApiResponse,
      PostApiV1MaterialBatchSupplyApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/batch/supply`,
        method: "POST",
        body: queryArg.domainEntitiesMaterialsBatchSupplyMaterialBatchRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialApprovedMaterials: build.query<
      GetApiV1MaterialApprovedMaterialsApiResponse,
      GetApiV1MaterialApprovedMaterialsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/approved-materials`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          kind: queryArg.kind,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1MaterialDepartmentApprovedMaterials: build.query<
      GetApiV1MaterialDepartmentApprovedMaterialsApiResponse,
      GetApiV1MaterialDepartmentApprovedMaterialsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/department/approved-materials`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          warehouseId: queryArg.warehouseId,
          departmentId: queryArg.departmentId,
          kind: queryArg.kind,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1MaterialDepartmentApprovedMaterialsV2: build.query<
      GetApiV1MaterialDepartmentApprovedMaterialsV2ApiResponse,
      GetApiV1MaterialDepartmentApprovedMaterialsV2ApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/department/approved-materials/v2`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          kind: queryArg.kind,
          materialCategoryId: queryArg.materialCategoryId,
        },
      }),
    }),
    getApiV1MaterialByMaterialIdBatchesV2AndDepartmentId: build.query<
      GetApiV1MaterialByMaterialIdBatchesV2AndDepartmentIdApiResponse,
      GetApiV1MaterialByMaterialIdBatchesV2AndDepartmentIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/${queryArg.materialId}/batches/v2/${queryArg.departmentId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1MaterialByMaterialIdStockWarehouses: build.query<
      GetApiV1MaterialByMaterialIdStockWarehousesApiResponse,
      GetApiV1MaterialByMaterialIdStockWarehousesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/${queryArg.materialId}/stock/warehouses`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialByMaterialIdStockDepartments: build.query<
      GetApiV1MaterialByMaterialIdStockDepartmentsApiResponse,
      GetApiV1MaterialByMaterialIdStockDepartmentsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/${queryArg.materialId}/stock/departments`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1MaterialDepartment: build.mutation<
      PostApiV1MaterialDepartmentApiResponse,
      PostApiV1MaterialDepartmentApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/department`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1MaterialDepartment: build.mutation<
      DeleteApiV1MaterialDepartmentApiResponse,
      DeleteApiV1MaterialDepartmentApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/department`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          materialId: queryArg.materialId,
        },
      }),
    }),
    getApiV1MaterialDepartment: build.query<
      GetApiV1MaterialDepartmentApiResponse,
      GetApiV1MaterialDepartmentApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/department`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          kind: queryArg.kind,
          materialCategoryId: queryArg.materialCategoryId,
          sortLabel: queryArg.sortLabel,
          sortDirection: queryArg.sortDirection,
        },
      }),
    }),
    getApiV1MaterialDepartmentNotLinked: build.query<
      GetApiV1MaterialDepartmentNotLinkedApiResponse,
      GetApiV1MaterialDepartmentNotLinkedApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/department/not-linked`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          kind: queryArg.kind,
        },
      }),
    }),
    getApiV1MaterialByMaterialIdUom: build.query<
      GetApiV1MaterialByMaterialIdUomApiResponse,
      GetApiV1MaterialByMaterialIdUomApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/${queryArg.materialId}/uom`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialHolding: build.query<
      GetApiV1MaterialHoldingApiResponse,
      GetApiV1MaterialHoldingApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/holding`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          withProcessed: queryArg.withProcessed,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          kind: queryArg.kind,
        },
      }),
    }),
    postApiV1MaterialBatchesImport: build.mutation<
      PostApiV1MaterialBatchesImportApiResponse,
      PostApiV1MaterialBatchesImportApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/batches/import`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialBatchesExpired: build.query<
      GetApiV1MaterialBatchesExpiredApiResponse,
      GetApiV1MaterialBatchesExpiredApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/batches/expired`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          warehouseIds: queryArg.warehouseIds,
          materialKind: queryArg.materialKind,
          pageSize: queryArg.pageSize,
          page: queryArg.page,
          sortLabel: queryArg.sortLabel,
          sortDirection: queryArg.sortDirection,
        },
      }),
    }),
    getApiV1MaterialBatchesAboutToExpire: build.query<
      GetApiV1MaterialBatchesAboutToExpireApiResponse,
      GetApiV1MaterialBatchesAboutToExpireApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/batches/about-to-expire`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          warehouseIds: queryArg.warehouseIds,
          materialKind: queryArg.materialKind,
          pageSize: queryArg.pageSize,
          page: queryArg.page,
          sortLabel: queryArg.sortLabel,
          sortDirection: queryArg.sortDirection,
        },
      }),
    }),
    getApiV1MaterialMaterialSpecsNotLinked: build.query<
      GetApiV1MaterialMaterialSpecsNotLinkedApiResponse,
      GetApiV1MaterialMaterialSpecsNotLinkedApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/material-specs/not-linked`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    getApiV1MaterialRejects: build.query<
      GetApiV1MaterialRejectsApiResponse,
      GetApiV1MaterialRejectsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/rejects`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          materialKind: queryArg.materialKind,
        },
      }),
    }),
    getApiV1MaterialByMaterialIdShelf: build.query<
      GetApiV1MaterialByMaterialIdShelfApiResponse,
      GetApiV1MaterialByMaterialIdShelfApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/${queryArg.materialId}/shelf`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          onlyAboutToExpire: queryArg.onlyAboutToExpire,
        },
      }),
    }),
    getApiV1MaterialShelf: build.query<
      GetApiV1MaterialShelfApiResponse,
      GetApiV1MaterialShelfApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/shelf`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    postApiV1MaterialDistributeMaterialMoveBatch: build.mutation<
      PostApiV1MaterialDistributeMaterialMoveBatchApiResponse,
      PostApiV1MaterialDistributeMaterialMoveBatchApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/distribute-material/move-batch`,
        method: "POST",
        body: queryArg.domainEntitiesMaterialsBatchSupplyMaterialBatchFromHMaterialDistribute,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1MaterialByMaterialIdReserved: build.query<
      GetApiV1MaterialByMaterialIdReservedApiResponse,
      GetApiV1MaterialByMaterialIdReservedApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/${queryArg.materialId}/reserved`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1MaterialDownloadStock: build.query<
      GetApiV1MaterialDownloadStockApiResponse,
      GetApiV1MaterialDownloadStockApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/download/stock`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          kind: queryArg.kind,
        },
      }),
    }),
    getApiV1MaterialBatchesDistinctByWarehouseId: build.query<
      GetApiV1MaterialBatchesDistinctByWarehouseIdApiResponse,
      GetApiV1MaterialBatchesDistinctByWarehouseIdApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/batches/distinct/${queryArg.warehouseId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          materialId: queryArg.materialId,
          materialKind: queryArg.materialKind,
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    getApiV1MaterialBatchesDepartments: build.query<
      GetApiV1MaterialBatchesDepartmentsApiResponse,
      GetApiV1MaterialBatchesDepartmentsApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/batches/departments`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
          kind: queryArg.kind,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1MaterialDiagnosticsInconsistencies: build.query<
      GetApiV1MaterialDiagnosticsInconsistenciesApiResponse,
      GetApiV1MaterialDiagnosticsInconsistenciesApiArg
    >({
      query: (queryArg) => ({
        url: `/api/v1/material/diagnostics/inconsistencies`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as materialsApi };
export type PostApiV1BomApiResponse = /** status 201 Created */ string;
export type PostApiV1BomApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateBillOfMaterialRequest object. */
  domainEntitiesBillOfMaterialsRequestCreateBillOfMaterialRequest: DomainEntitiesBillOfMaterialsRequestCreateBillOfMaterialRequest;
};
export type PutApiV1BomByBillOfMaterialIdApiResponse = void;
export type PutApiV1BomByBillOfMaterialIdApiArg = {
  /** The ID of the Bill of Material to be updated. */
  billOfMaterialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateProductBillOfMaterialRequest object containing updated data. */
  domainEntitiesProductsCreateProductBillOfMaterialRequest: DomainEntitiesProductsCreateProductBillOfMaterialRequest;
};
export type DeleteApiV1BomByBillOfMaterialIdApiResponse = void;
export type DeleteApiV1BomByBillOfMaterialIdApiArg = {
  /** The ID of the Bill of Material to be deleted. */
  billOfMaterialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1MaterialApiResponse = /** status 200 OK */ string;
export type PostApiV1MaterialApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateMaterialRequest object. */
  domainEntitiesMaterialsCreateMaterialRequest: DomainEntitiesMaterialsCreateMaterialRequest;
};
export type GetApiV1MaterialApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1MaterialApiArg = {
  /** The kind of material being requested */
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialByMaterialIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsMaterialDto;
export type GetApiV1MaterialByMaterialIdApiArg = {
  /** The ID of the material. */
  materialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1MaterialByMaterialIdApiResponse = void;
export type PutApiV1MaterialByMaterialIdApiArg = {
  /** The ID of the material to be updated. */
  materialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The UpdateMaterialRequest object containing updated material data. */
  domainEntitiesMaterialsCreateMaterialRequest: DomainEntitiesMaterialsCreateMaterialRequest;
};
export type DeleteApiV1MaterialByMaterialIdApiResponse = void;
export type DeleteApiV1MaterialByMaterialIdApiArg = {
  /** The ID of the material to be deleted. */
  materialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialNotLinkedToArdsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1MaterialNotLinkedToArdsApiArg = {
  /** The kind of material being requested */
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** The analysis type the ARD is being created for. */
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialCategoryApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsMaterialCategoryDto[];
export type GetApiV1MaterialCategoryApiArg = {
  /** The kind of material being requested */
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialAllApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsMaterialDto[];
export type GetApiV1MaterialAllApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1MaterialByMaterialIdReorderLevelApiResponse = void;
export type PutApiV1MaterialByMaterialIdReorderLevelApiArg = {
  /** The ID of the material to be updated. */
  materialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The new ReOrderLevel value. */
  domainEntitiesMaterialsUpdateReOrderLevelRequest: DomainEntitiesMaterialsUpdateReOrderLevelRequest;
};
export type GetApiV1MaterialByMaterialIdStockLevelApiResponse =
  /** status 200 OK */ number;
export type GetApiV1MaterialByMaterialIdStockLevelApiArg = {
  /** The ID of the material. */
  materialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialByMaterialIdBatchesApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsBatchMaterialBatchDtoRead[];
export type GetApiV1MaterialByMaterialIdBatchesApiArg = {
  /** The ID of the material. */
  materialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialByMaterialIdInTransitApiResponse =
  /** status 200 OK */ number;
export type GetApiV1MaterialByMaterialIdInTransitApiArg = {
  /** The ID of the material. */
  materialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1MaterialBatchApiResponse = void;
export type PostApiV1MaterialBatchApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateMaterialBatchRequest object. */
  body: DomainEntitiesMaterialsBatchCreateMaterialBatchRequest[];
};
export type GetApiV1MaterialBatchApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsBatchMaterialBatchDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1MaterialBatchApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialBatchByBatchIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsBatchMaterialBatchDtoRead;
export type GetApiV1MaterialBatchByBatchIdApiArg = {
  /** The ID of the material batch. */
  batchId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1MaterialBatchByBatchIdApproveApiResponse = void;
export type PutApiV1MaterialBatchByBatchIdApproveApiArg = {
  batchId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialByMaterialIdStockAndWarehouseIdApiResponse =
  /** status 200 OK */ number;
export type GetApiV1MaterialByMaterialIdStockAndWarehouseIdApiArg = {
  /** The ID of the material. */
  materialId: string;
  /** The ID of the warehouse. */
  warehouseId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialByMaterialIdStockAcrossWarehousesApiResponse =
  /** status 200 OK */ DomainEntitiesWarehousesWarehouseStockDto[];
export type GetApiV1MaterialByMaterialIdStockAcrossWarehousesApiArg = {
  /** The id of the material */
  materialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialByMaterialIdStockPipelineApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsMaterialPipelineStockDto[];
export type GetApiV1MaterialByMaterialIdStockPipelineApiArg = {
  materialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialByMaterialIdDepartmentStockAndQuantityApiResponse =
  /** status 200 OK */ DomainEntitiesDepartmentsDepartmentDto[];
export type GetApiV1MaterialByMaterialIdDepartmentStockAndQuantityApiArg = {
  /** The id of the material */
  materialId: string;
  /** The minimum quantity of the stock the department should have. */
  quantity: number;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1MaterialBatchStatusApiResponse = void;
export type PutApiV1MaterialBatchStatusApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The UpdateBatchStatusRequest object. */
  domainEntitiesMaterialsBatchUpdateBatchStatusRequest: DomainEntitiesMaterialsBatchUpdateBatchStatusRequest;
};
export type PostApiV1MaterialBatchByBatchIdRequestRetestApiResponse = void;
export type PostApiV1MaterialBatchByBatchIdRequestRetestApiArg = {
  batchId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesMaterialsBatchRequestRetestDto: DomainEntitiesMaterialsBatchRequestRetestDto;
};
export type PostApiV1MaterialBatchByBatchIdCompleteRetestApiResponse = void;
export type PostApiV1MaterialBatchByBatchIdCompleteRetestApiArg = {
  batchId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesMaterialsBatchCompleteRetestDto: DomainEntitiesMaterialsBatchCompleteRetestDto;
};
export type PostApiV1MaterialBatchSupplyApiResponse = void;
export type PostApiV1MaterialBatchSupplyApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The SupplyMaterialBatchRequest object. */
  domainEntitiesMaterialsBatchSupplyMaterialBatchRequest: DomainEntitiesMaterialsBatchSupplyMaterialBatchRequest;
};
export type GetApiV1MaterialApprovedMaterialsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialDetailsDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1MaterialApprovedMaterialsApiArg = {
  /** The kind of material needed. */
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialDepartmentApprovedMaterialsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialDetailsDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1MaterialDepartmentApprovedMaterialsApiArg = {
  /** The warehouse id for filtering results. */
  warehouseId?: string;
  /** The department id for filtering results. */
  departmentId?: string;
  /** The kind of material needed. */
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialDepartmentApprovedMaterialsV2ApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialDetailsDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1MaterialDepartmentApprovedMaterialsV2ApiArg = {
  /** The department id for filtering results. */
  departmentId?: string;
  /** The kind of material needed. */
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The material category id. */
  materialCategoryId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialByMaterialIdBatchesV2AndDepartmentIdApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericList601DomainEntitiesWarehousesShelfMaterialBatchDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1MaterialByMaterialIdBatchesV2AndDepartmentIdApiArg = {
  /** The ID of the material. */
  materialId: string;
  departmentId: string;
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search material */
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialByMaterialIdStockWarehousesApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsBatchMaterialStockByWarehouseDto[];
export type GetApiV1MaterialByMaterialIdStockWarehousesApiArg = {
  /** The ID of the material. */
  materialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialByMaterialIdStockDepartmentsApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsBatchMaterialStockByDepartmentDto[];
export type GetApiV1MaterialByMaterialIdStockDepartmentsApiArg = {
  /** The ID of the material. */
  materialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1MaterialDepartmentApiResponse = void;
export type PostApiV1MaterialDepartmentApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The list of material departments to create. */
  body: DomainEntitiesMaterialsCreateMaterialDepartment[];
};
export type DeleteApiV1MaterialDepartmentApiResponse = void;
export type DeleteApiV1MaterialDepartmentApiArg = {
  /** The material you want to unlink from your department */
  materialId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialDepartmentApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialDepartmentWithWarehouseStockDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1MaterialDepartmentApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** The material kind to filter */
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The material category */
  materialCategoryId?: string;
  /** The label to which to sort by. Options are 'materialcode' 'categoryname'
                and 'materialname' " */
  sortLabel?: string;
  /** The direction to sort the results. 1 for Ascending, 2 for Descending */
  sortDirection?: SharedSortDirection;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialDepartmentNotLinkedApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialWithWarehouseStockDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1MaterialDepartmentNotLinkedApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search material */
  searchQuery?: string;
  /** The material kind to filter */
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialByMaterialIdUomApiResponse =
  /** status 200 OK */ DomainEntitiesBaseUnitOfMeasureDto[];
export type GetApiV1MaterialByMaterialIdUomApiArg = {
  /** The material Id for which you need the uom */
  materialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialHoldingApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsHoldingMaterialTransferDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1MaterialHoldingApiArg = {
  /** Filter to include transferred holding materials */
  withProcessed?: boolean;
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** The material kind you want */
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1MaterialBatchesImportApiResponse = void;
export type PostApiV1MaterialBatchesImportApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  body: {
    file?: Blob;
  };
};
export type GetApiV1MaterialBatchesExpiredApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsBatchMaterialBatchDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1MaterialBatchesExpiredApiArg = {
  startDate?: string;
  endDate?: string;
  warehouseIds?: string[];
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  pageSize?: number;
  page?: number;
  sortLabel?: string;
  sortDirection?: SharedSortDirection;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialBatchesAboutToExpireApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsBatchMaterialBatchDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1MaterialBatchesAboutToExpireApiArg = {
  startDate?: string;
  endDate?: string;
  warehouseIds?: string[];
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  pageSize?: number;
  page?: number;
  sortLabel?: string;
  sortDirection?: SharedSortDirection;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialMaterialSpecsNotLinkedApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsMaterialDto[];
export type GetApiV1MaterialMaterialSpecsNotLinkedApiArg = {
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialRejectsApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsMaterialDto[];
export type GetApiV1MaterialRejectsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialByMaterialIdShelfApiResponse =
  /** status 200 OK */ DomainEntitiesWarehousesShelfMaterialBatchDtoRead[];
export type GetApiV1MaterialByMaterialIdShelfApiArg = {
  /** The ID of the material. */
  materialId: string;
  /** Optional department Id */
  departmentId?: string;
  /** Flag to include if only about to expire */
  onlyAboutToExpire?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialShelfApiResponse =
  /** status 200 OK */ DomainEntitiesWarehousesShelfMaterialBatchDtoRead[];
export type GetApiV1MaterialShelfApiArg = {
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1MaterialDistributeMaterialMoveBatchApiResponse = void;
export type PostApiV1MaterialDistributeMaterialMoveBatchApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The request containing batch supply details. */
  domainEntitiesMaterialsBatchSupplyMaterialBatchFromHMaterialDistribute: DomainEntitiesMaterialsBatchSupplyMaterialBatchFromHMaterialDistribute;
};
export type GetApiV1MaterialByMaterialIdReservedApiResponse =
  /** status 200 OK */ DomainEntitiesReportsWarehouseReservedMaterialReportDto[];
export type GetApiV1MaterialByMaterialIdReservedApiArg = {
  materialId: string;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialDownloadStockApiResponse =
  /** status 200 OK */ string;
export type GetApiV1MaterialDownloadStockApiArg = {
  departmentId?: string;
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialBatchesDistinctByWarehouseIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsBatchMaterialBatchCountDto;
export type GetApiV1MaterialBatchesDistinctByWarehouseIdApiArg = {
  /** The warehouse Id. */
  warehouseId: string;
  materialId?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialBatchesDepartmentsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialBatchDepartmentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1MaterialBatchesDepartmentsApiArg = {
  /** The department id for filtering results. */
  departmentId?: string;
  /** The kind of material needed. */
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1MaterialDiagnosticsInconsistenciesApiResponse =
  /** status 200 OK */ SharedBatchInconsistencyReportRead[];
export type GetApiV1MaterialDiagnosticsInconsistenciesApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type JsonValue = string | number | boolean | null | JsonValue[] | { [key: string]: JsonValue | undefined };
export type MicrosoftAspNetCoreMvcProblemDetails = {
  type?: string | null;
  title?: string | null;
  status?: number | null;
  detail?: string | null;
  instance?: string | null;
  [key: string]: JsonValue | undefined;
};
export type DomainEntitiesBillOfMaterialsRequestCreateBoMItemsRequest = {
  materialId?: string;
  uoMId?: string | null;
  isSubstitutable?: boolean;
  grade?: string | null;
  casNumber?: string | null;
  baseQuantity?: number;
  baseUoMId?: string | null;
  order?: number;
  prescribedQuantity?: number;
  substituteMaterialIds?: string[] | null;
};
export type DomainEntitiesBillOfMaterialsRequestCreateBillOfMaterialRequest = {
  productId?: string;
  items?: DomainEntitiesBillOfMaterialsRequestCreateBoMItemsRequest[] | null;
};
export type DomainEntitiesProductsCreateProductBillOfMaterialRequest = {
  componentMaterialId?: string | null;
  componentProductId?: string | null;
  quantity?: number;
  uoMId?: string;
  isSubstitutable?: boolean;
  substituteMaterialIds?: string[] | null;
};
export type DomainEntitiesMaterialsMaterialKind = 0 | 1;
export type DomainEntitiesMaterialsCreateMaterialRequest = {
  code?: string | null;
  name?: string | null;
  pharmacopoeia?: string | null;
  description?: string | null;
  alphabet?: string | null;
  materialCategoryId?: string | null;
  kind?: DomainEntitiesMaterialsMaterialKind;
  reOrderLevel?: number;
};
export type SharedDepartmentType = 0 | 1 | 2;
export type DomainEntitiesProductsDivision = 0 | 1;
export type SharedCollectionItemDto = {
  id?: string | null;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  symbol?: string | null;
  uom?: string | null;
};
export type DomainEntitiesDepartmentsDepartmentListDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  name?: string | null;
  type?: SharedDepartmentType;
  description?: string | null;
  division?: DomainEntitiesProductsDivision;
  parentDepartment?: SharedCollectionItemDto;
};
export type DomainEntitiesUsersUserDto = {
  id?: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  isDisabled?: boolean;
  avatar?: string | null;
  createdAt?: string;
  signature?: string | null;
  department?: DomainEntitiesDepartmentsDepartmentListDto;
};
export type DomainEntitiesMaterialsMaterialCategoryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
};
export type DomainEntitiesMaterialSpecificationsMaterialSpecificationReducedDto =
  {
    id?: string;
    specificationNumber?: string | null;
  };
export type DomainEntitiesCountriesCountryDto = {
  id?: string;
  name?: string | null;
  nationality?: string | null;
  code?: string | null;
};
export type DomainEntitiesCurrenciesCurrencyDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isBaseCurrency?: boolean;
};
export type DomainEntitiesProcurementSuppliersSupplierType = 0 | 1;
export type DomainEntitiesProcurementSuppliersSupplierStatus = 0 | 1 | 2;
export type DomainEntitiesProcurementSuppliersSupplierListDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  email?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  contactNumber?: string | null;
  country?: DomainEntitiesCountriesCountryDto;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  type?: DomainEntitiesProcurementSuppliersSupplierType;
  status?: DomainEntitiesProcurementSuppliersSupplierStatus;
  approvedAt?: string | null;
  requalificationDueDate?: string | null;
};
export type DomainEntitiesProcurementManufacturersManufacturerListDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  address?: string | null;
  email?: string | null;
  approvedAt?: string | null;
  validityDate?: string | null;
  country?: DomainEntitiesCountriesCountryDto;
};
export type DomainEntitiesMaterialsMaterialDto = {
  id?: string;
  code?: string | null;
  pharmacopoeia?: string | null;
  name?: string | null;
  description?: string | null;
  alphabet?: string | null;
  kind?: DomainEntitiesMaterialsMaterialKind;
  isUnlimited?: boolean;
  materialCategory?: DomainEntitiesMaterialsMaterialCategoryDto;
  specification?: DomainEntitiesMaterialSpecificationsMaterialSpecificationReducedDto;
  totalStock?: number;
  reservedStock?: number;
  suppliers?: DomainEntitiesProcurementSuppliersSupplierListDto[] | null;
  manufacturers?:
    DomainEntitiesProcurementManufacturersManufacturerListDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesMaterialsMaterialDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesQualityRoutinesAnalysisType = 0 | 1;
export type DomainEntitiesMaterialsUpdateReOrderLevelRequest = {
  reOrderLevel?: number;
};
export type DomainEntitiesShipmentsShipmentInvoiceListDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplierListDto;
  totalCost?: number;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  paidAt?: string | null;
  dueDate?: string | null;
  amountPaid?: number;
  outstandingBalance?: number;
  isUsed?: boolean;
};
export type DomainEntitiesBaseUnitOfMeasureType = 0 | 1 | 2 | 3;
export type DomainEntitiesBaseUnitOfMeasureCategory = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesBaseUnitOfMeasureDto = {
  id?: string;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isScalable?: boolean;
  isRawMaterial?: boolean;
  type?: DomainEntitiesBaseUnitOfMeasureType;
  category?: DomainEntitiesBaseUnitOfMeasureCategory;
  createdAt?: string;
};
export type DomainEntitiesShipmentsShipmentInvoiceItemDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  manufacturer?: SharedCollectionItemDto;
  purchaseOrder?: SharedCollectionItemDto;
  expectedQuantity?: number;
  receivedQuantity?: number;
  price?: number;
  priceUoM?: string | null;
  totalCost?: number;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  reason?: string | null;
};
export type DomainEntitiesProcurementDistributionMaterialItemDistributionDto = {
  shipmentInvoiceItem?: DomainEntitiesShipmentsShipmentInvoiceItemDto;
  quantity?: number;
};
export type DomainEntitiesWarehousesDistributedRequisitionMaterialStatus =
  0 | 1 | 2 | 3 | 4;
export type DomainEntitiesBasePackageStyleDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesMaterialsBatchBatchStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type DomainEntitiesMaterialsBatchSrDto = {
  srNumber?: string | null;
  grossWeight?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
};
export type DomainEntitiesMaterialsBatchDistributedMaterialBatchDto = {
  id?: string;
  material?: SharedCollectionItemDto;
  code?: string | null;
  batchNumber?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  numberOfContainers?: number;
  containerPackageStyle?: DomainEntitiesBasePackageStyleDto;
  quantityPerContainer?: number;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  quantityAssigned?: number;
  quantityUnassigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  quantityDistributed?: number;
  sampleWeights?: DomainEntitiesMaterialsBatchSrDto[] | null;
  reservedQuantity?: number;
};
export type DomainEntitiesChecklistsDistributedChecklistDto = {
  materialBatches?:
    DomainEntitiesMaterialsBatchDistributedMaterialBatchDto[] | null;
};
export type DomainEntitiesRequisitionsRequestStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesRequisitionsRequisitionItemListDto = {
  id?: string;
  material?: SharedCollectionItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  quantityReceived?: number;
  status?: DomainEntitiesRequisitionsRequestStatus;
};
export type DomainEntitiesWarehousesWarehouseType = 0 | 1 | 2 | 3;
export type DomainEntitiesWarehousesWarehouseWithoutLocationDto = {
  id?: string;
  name?: string | null;
  description?: string | null;
  type?: DomainEntitiesWarehousesWarehouseType;
};
export type DomainEntitiesWarehousesDistributedRequisitionItemDto = {
  id?: string;
  requisitionItem?: DomainEntitiesRequisitionsRequisitionItemListDto;
  uom?: DomainEntitiesBaseUnitOfMeasureDto;
  warehouse?: DomainEntitiesWarehousesWarehouseWithoutLocationDto;
  quantity?: number;
  quantityDistributed?: number;
};
export type DomainEntitiesWarehousesDistributedRequisitionItemDtoRead = {
  id?: string;
  requisitionItem?: DomainEntitiesRequisitionsRequisitionItemListDto;
  uom?: DomainEntitiesBaseUnitOfMeasureDto;
  warehouse?: DomainEntitiesWarehousesWarehouseWithoutLocationDto;
  quantity?: number;
  quantityDistributed?: number;
  fullyDistributed?: boolean;
};
export type DomainEntitiesWarehousesDistributedRequisitionMaterialDto = {
  id?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoiceListDto;
  quantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  arrivedAt?: string | null;
  checkedAt?: string | null;
  distributedAt?: string | null;
  grnGeneratedAt?: string | null;
  materialItemDistributions?:
    DomainEntitiesProcurementDistributionMaterialItemDistributionDto[] | null;
  status?: DomainEntitiesWarehousesDistributedRequisitionMaterialStatus;
  checklists?: DomainEntitiesChecklistsDistributedChecklistDto[] | null;
  distributedRequisitionItems?:
    DomainEntitiesWarehousesDistributedRequisitionItemDto[] | null;
  department?: DomainEntitiesDepartmentsDepartmentListDto;
};
export type DomainEntitiesWarehousesDistributedRequisitionMaterialDtoRead = {
  id?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoiceListDto;
  quantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  arrivedAt?: string | null;
  checkedAt?: string | null;
  distributedAt?: string | null;
  grnGeneratedAt?: string | null;
  materialItemDistributions?:
    DomainEntitiesProcurementDistributionMaterialItemDistributionDto[] | null;
  status?: DomainEntitiesWarehousesDistributedRequisitionMaterialStatus;
  checklists?: DomainEntitiesChecklistsDistributedChecklistDto[] | null;
  distributedRequisitionItems?:
    DomainEntitiesWarehousesDistributedRequisitionItemDtoRead[] | null;
  department?: DomainEntitiesDepartmentsDepartmentListDto;
};
export type DomainEntitiesProcurementManufacturersQuantityType = 0 | 1 | 2;
export type DomainEntitiesProcurementManufacturersQuantityPerPackOption = {
  type?: DomainEntitiesProcurementManufacturersQuantityType;
  min?: number | null;
  max?: number | null;
  values?: number[] | null;
};
export type DomainEntitiesProcurementManufacturersManufacturerMaterialDto = {
  material?: DomainEntitiesMaterialsMaterialDto;
  quantityType?: DomainEntitiesProcurementManufacturersQuantityType;
  quantityPerPackOption?: DomainEntitiesProcurementManufacturersQuantityPerPackOption;
};
export type DomainEntitiesProcurementManufacturersManufacturerDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  address?: string | null;
  email?: string | null;
  approvedAt?: string | null;
  validityDate?: string | null;
  country?: DomainEntitiesCountriesCountryDto;
  materials?:
    DomainEntitiesProcurementManufacturersManufacturerMaterialDto[] | null;
};
export type DomainEntitiesProcurementSuppliersSupplierManufacturerDto = {
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturerDto;
  material?: DomainEntitiesMaterialsMaterialDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  default?: boolean;
};
export type DomainEntitiesProcurementSuppliersSupplierDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  email?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  contactNumber?: string | null;
  country?: DomainEntitiesCountriesCountryDto;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  type?: DomainEntitiesProcurementSuppliersSupplierType;
  status?: DomainEntitiesProcurementSuppliersSupplierStatus;
  approvedAt?: string | null;
  requalificationDueDate?: string | null;
  associatedManufacturers?:
    DomainEntitiesProcurementSuppliersSupplierManufacturerDto[] | null;
};
export type DomainEntitiesShipmentsShipmentInvoiceDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  items?: DomainEntitiesShipmentsShipmentInvoiceItemDto[] | null;
  totalCost?: number;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  paidAt?: string | null;
  dueDate?: string | null;
  amountPaid?: number;
  outstandingBalance?: number;
  isUsed?: boolean;
};
export type DomainEntitiesChecklistsIntactness = 0 | 1;
export type DomainEntitiesChecklistsConsignmentCarrier = 0 | 1 | 2 | 3 | 4 | 5;
export type DomainEntitiesMaterialsBatchBatchChecklistDto = {
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterialDto;
  material?: DomainEntitiesMaterialsMaterialDto;
  checkedAt?: string | null;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoiceDto;
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturerDto;
  certificateOfAnalysisDelivered?: boolean;
  visibleLabelling?: boolean;
  intactnessStatus?: DomainEntitiesChecklistsIntactness;
  consignmentCarrierStatus?: DomainEntitiesChecklistsConsignmentCarrier;
};
export type DomainEntitiesMaterialsBatchBatchChecklistDtoRead = {
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterialDtoRead;
  material?: DomainEntitiesMaterialsMaterialDto;
  checkedAt?: string | null;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoiceDto;
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturerDto;
  certificateOfAnalysisDelivered?: boolean;
  visibleLabelling?: boolean;
  intactnessStatus?: DomainEntitiesChecklistsIntactness;
  consignmentCarrierStatus?: DomainEntitiesChecklistsConsignmentCarrier;
};
export type DomainEntitiesProductionSchedulesStockTransfersStockTransferStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesProductionSchedulesStockTransfersMaterialBatchStockTransferDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    code?: string | null;
    material?: DomainEntitiesMaterialsMaterialDto;
    uoM?: DomainEntitiesBaseUnitOfMeasureDto;
    product?: SharedCollectionItemDto;
    productionSchedule?: SharedCollectionItemDto;
    reason?: string | null;
    requiredQuantity?: number;
    status?: DomainEntitiesProductionSchedulesStockTransfersStockTransferStatus;
  };
export type DomainEntitiesMaterialsBatchCurrentLocationDto = {
  location?: SharedCollectionItemDto;
  quantityAtLocation?: number;
};
export type DomainEntitiesWarehousesWareHouseLocationDto = {
  id?: string;
  name?: string | null;
  floorName?: string | null;
  description?: string | null;
  warehouse?: SharedCollectionItemDto;
};
export type DomainEntitiesWarehousesWareHouseLocationRackDto = {
  id?: string;
  warehouseLocation?: DomainEntitiesWarehousesWareHouseLocationDto;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesWarehousesMaterialWarehouseLocationShelfDto = {
  id?: string;
  warehouseLocationRack?: DomainEntitiesWarehousesWareHouseLocationRackDto;
  code?: string | null;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesMaterialsBatchMaterialBatchReducedDto = {
  id?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  batchNumber?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  numberOfContainers?: number;
  containerPackageStyle?: DomainEntitiesBasePackageStyleDto;
  quantityPerContainer?: number;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  quantityAssigned?: number;
  quantityUnassigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  issueNumber?: string | null;
  issuedBy?: SharedCollectionItemDto;
  issuedAt?: string | null;
  supplierName?: string | null;
  manufacturerName?: string | null;
  arNumber?: string | null;
  sampledBy?: string | null;
  sampledOn?: string | null;
  sampleQuantity?: number;
  analysedBy?: string | null;
  analysedDate?: string | null;
};
export type DomainEntitiesMaterialsBatchMaterialBatchReducedDtoRead = {
  id?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  batchNumber?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  numberOfContainers?: number;
  containerPackageStyle?: DomainEntitiesBasePackageStyleDto;
  quantityPerContainer?: number;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  quantityAssigned?: number;
  quantityUnassigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  aboutToExpire?: boolean;
  expired?: boolean;
  issueNumber?: string | null;
  issuedBy?: SharedCollectionItemDto;
  issuedAt?: string | null;
  supplierName?: string | null;
  manufacturerName?: string | null;
  arNumber?: string | null;
  sampledBy?: string | null;
  sampledOn?: string | null;
  sampleQuantity?: number;
  analysedBy?: string | null;
  analysedDate?: string | null;
};
export type DomainEntitiesWarehousesShelfMaterialBatchDto = {
  id?: string;
  warehouseLocationShelf?: DomainEntitiesWarehousesMaterialWarehouseLocationShelfDto;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchReducedDto;
  quantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  note?: string | null;
};
export type DomainEntitiesWarehousesShelfMaterialBatchDtoRead = {
  id?: string;
  warehouseLocationShelf?: DomainEntitiesWarehousesMaterialWarehouseLocationShelfDto;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchReducedDtoRead;
  quantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  note?: string | null;
};
export type DomainEntitiesChecklistsMaterialBatchChecklistDto = {
  checkedAt?: string | null;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoiceDto;
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturerDto;
  certificateOfAnalysisDelivered?: boolean;
  visibleLabelling?: boolean;
  intactnessStatus?: DomainEntitiesChecklistsIntactness;
  consignmentCarrierStatus?: DomainEntitiesChecklistsConsignmentCarrier;
};
export type DomainEntitiesMaterialsBatchMaterialBatchListDto = {
  id?: string;
  material?: SharedCollectionItemDto;
  batchNumber?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  numberOfContainers?: number;
  containerPackageStyle?: DomainEntitiesBasePackageStyleDto;
  quantityPerContainer?: number;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  quantityAssigned?: number;
  quantityUnassigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  checklist?: DomainEntitiesChecklistsMaterialBatchChecklistDto;
  returnDate?: string | null;
  issueNumber?: string | null;
  supplierName?: string | null;
  manufacturerName?: string | null;
  arNumber?: string | null;
  sampledBy?: string | null;
  sampledOn?: string | null;
  sampleQuantity?: number;
  analysedBy?: string | null;
  analysedDate?: string | null;
  issuedBy?: SharedCollectionItemDto;
  issuedAt?: string | null;
};
export type DomainEntitiesMaterialsBatchMaterialBatchListDtoRead = {
  id?: string;
  material?: SharedCollectionItemDto;
  batchNumber?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  numberOfContainers?: number;
  containerPackageStyle?: DomainEntitiesBasePackageStyleDto;
  quantityPerContainer?: number;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  quantityAssigned?: number;
  quantityUnassigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  checklist?: DomainEntitiesChecklistsMaterialBatchChecklistDto;
  aboutToExpire?: boolean;
  expired?: boolean;
  returnDate?: string | null;
  isReturn?: boolean;
  issueNumber?: string | null;
  supplierName?: string | null;
  manufacturerName?: string | null;
  arNumber?: string | null;
  sampledBy?: string | null;
  sampledOn?: string | null;
  sampleQuantity?: number;
  analysedBy?: string | null;
  analysedDate?: string | null;
  issuedBy?: SharedCollectionItemDto;
  issuedAt?: string | null;
};
export type DomainEntitiesWarehousesWarehouseLocationShelfDto = {
  id?: string;
  warehouseLocationRack?: DomainEntitiesWarehousesWareHouseLocationRackDto;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  materialBatches?: DomainEntitiesWarehousesShelfMaterialBatchDto[] | null;
};
export type DomainEntitiesWarehousesWarehouseLocationShelfDtoRead = {
  id?: string;
  warehouseLocationRack?: DomainEntitiesWarehousesWareHouseLocationRackDto;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  materialBatches?: DomainEntitiesWarehousesShelfMaterialBatchDtoRead[] | null;
};
export type DomainEntitiesMaterialsBatchMaterialBatchReservedQuantityDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchListDto;
  warehouse?: SharedCollectionItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  warehouseLocationShelf?: DomainEntitiesWarehousesWarehouseLocationShelfDto;
  quantity?: number;
};
export type DomainEntitiesMaterialsBatchMaterialBatchReservedQuantityDtoRead = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchListDtoRead;
  warehouse?: SharedCollectionItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  warehouseLocationShelf?: DomainEntitiesWarehousesWarehouseLocationShelfDtoRead;
  quantity?: number;
};
export type DomainEntitiesMaterialsBatchMaterialBatchDto = {
  id?: string;
  material?: SharedCollectionItemDto;
  batchNumber?: string | null;
  checklist?: DomainEntitiesMaterialsBatchBatchChecklistDto;
  stockTransfer?: DomainEntitiesProductionSchedulesStockTransfersMaterialBatchStockTransferDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  numberOfContainers?: number;
  containerPackageStyle?: DomainEntitiesBasePackageStyleDto;
  quantityPerContainer?: number;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  quantityAssigned?: number;
  quantityUnassigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  sampleWeights?: DomainEntitiesMaterialsBatchSrDto[] | null;
  locations?: DomainEntitiesMaterialsBatchCurrentLocationDto[] | null;
  shelves?: DomainEntitiesWarehousesShelfMaterialBatchDto[] | null;
  reservedQuantities?:
    DomainEntitiesMaterialsBatchMaterialBatchReservedQuantityDto[] | null;
  reservedQuantity?: number;
  returnDate?: string | null;
  issueNumber?: string | null;
  supplierName?: string | null;
  manufacturerName?: string | null;
  arNumber?: string | null;
  sampledBy?: string | null;
  sampledOn?: string | null;
  sampleQuantity?: number;
  analysedBy?: string | null;
  analysedDate?: string | null;
  issuedBy?: DomainEntitiesUsersUserDto;
  issuedAt?: string | null;
};
export type DomainEntitiesMaterialsBatchMaterialBatchDtoRead = {
  id?: string;
  material?: SharedCollectionItemDto;
  batchNumber?: string | null;
  checklist?: DomainEntitiesMaterialsBatchBatchChecklistDtoRead;
  stockTransfer?: DomainEntitiesProductionSchedulesStockTransfersMaterialBatchStockTransferDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  numberOfContainers?: number;
  containerPackageStyle?: DomainEntitiesBasePackageStyleDto;
  quantityPerContainer?: number;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  quantityAssigned?: number;
  quantityUnassigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  sampleWeights?: DomainEntitiesMaterialsBatchSrDto[] | null;
  locations?: DomainEntitiesMaterialsBatchCurrentLocationDto[] | null;
  shelves?: DomainEntitiesWarehousesShelfMaterialBatchDtoRead[] | null;
  reservedQuantities?:
    DomainEntitiesMaterialsBatchMaterialBatchReservedQuantityDtoRead[] | null;
  reservedQuantity?: number;
  returnDate?: string | null;
  aboutToExpire?: boolean;
  expired?: boolean;
  issueNumber?: string | null;
  supplierName?: string | null;
  manufacturerName?: string | null;
  arNumber?: string | null;
  sampledBy?: string | null;
  sampledOn?: string | null;
  sampleQuantity?: number;
  analysedBy?: string | null;
  analysedDate?: string | null;
  issuedBy?: DomainEntitiesUsersUserDto;
  issuedAt?: string | null;
};
export type DomainEntitiesMaterialsBatchCreateSrRequest = {
  srNumber?: string | null;
  grossWeight?: number;
  uoMId?: string | null;
};
export type DomainEntitiesMaterialsBatchCreateMaterialBatchRequest = {
  materialId?: string;
  totalQuantity?: number;
  batchNumber?: string | null;
  manufacturingDate?: string | null;
  numberOfContainers?: number;
  containerPackageStyleId?: string | null;
  quantityPerContainer?: number;
  checklistId?: string | null;
  uoMId?: string | null;
  dateReceived?: string;
  expiryDate?: string;
  sampleWeights?: DomainEntitiesMaterialsBatchCreateSrRequest[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsBatchMaterialBatchDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesMaterialsBatchMaterialBatchDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsBatchMaterialBatchDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesMaterialsBatchMaterialBatchDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesWarehousesWarehouseDto = {
  id?: string;
  name?: string | null;
  description?: string | null;
  type?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  locations?: SharedCollectionItemDto[] | null;
};
export type DomainEntitiesWarehousesWarehouseStockDto = {
  warehouse?: DomainEntitiesWarehousesWarehouseDto;
  stockQuantity?: number;
  expiredQuantity?: number;
};
export type DomainEntitiesMaterialsMaterialPipelineStage =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export type DomainEntitiesRequisitionsProcurementSource = 0 | 1;
export type DomainEntitiesMaterialsMaterialPipelineStockDto = {
  id?: string;
  reference?: string | null;
  stage?: DomainEntitiesMaterialsMaterialPipelineStage;
  status?: string | null;
  quantity?: number;
  uom?: DomainEntitiesBaseUnitOfMeasureDto;
  route?: DomainEntitiesRequisitionsProcurementSource;
  supplierName?: string | null;
  expectedAvailabilityDate?: string | null;
  lastUpdatedAt?: string;
  departments?: string[] | null;
};
export type DomainEntitiesDepartmentsDepartmentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  name?: string | null;
  type?: SharedDepartmentType;
  description?: string | null;
  warehouses?: DomainEntitiesWarehousesWarehouseDto[] | null;
  division?: DomainEntitiesProductsDivision;
  parentDepartment?: SharedCollectionItemDto;
  isSeeded?: boolean;
};
export type DomainEntitiesMaterialsBatchUpdateBatchStatusRequest = {
  status?: string | null;
  materialBatchIds?: string[] | null;
};
export type DomainEntitiesMaterialsBatchRequestRetestDto = {
  reason?: string | null;
};
export type DomainEntitiesMaterialsBatchCompleteRetestDto = {
  extendedExpiryDate: string;
  notes?: string | null;
};
export type DomainEntitiesMaterialsBatchCreateShelfMaterialBatch = {
  warehouseLocationShelfId?: string;
  quantity?: number;
  uomId?: string | null;
  note?: string | null;
};
export type DomainEntitiesMaterialsBatchSupplyMaterialBatchRequest = {
  materialBatchId?: string;
  materialReturnNoteId?: string | null;
  shelfMaterialBatches?:
    DomainEntitiesMaterialsBatchCreateShelfMaterialBatch[] | null;
};
export type DomainEntitiesMaterialsMaterialDetailsDto = {
  material?: DomainEntitiesMaterialsMaterialDto;
  unitOfMeasure?: DomainEntitiesBaseUnitOfMeasureDto;
  totalAvailableQuantity?: number;
  reservedQuantity?: number;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialDetailsDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesMaterialsMaterialDetailsDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericList601DomainEntitiesWarehousesShelfMaterialBatchDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesWarehousesShelfMaterialBatchDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericList601DomainEntitiesWarehousesShelfMaterialBatchDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesWarehousesShelfMaterialBatchDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesMaterialsBatchMaterialStockByWarehouseDto = {
  warehouse?: SharedCollectionItemDto;
  totalQuantity?: number;
};
export type DomainEntitiesMaterialsBatchMaterialStockByDepartmentDto = {
  department?: SharedCollectionItemDto;
  totalQuantity?: number;
};
export type DomainEntitiesMaterialsCreateMaterialDepartment = {
  materialId?: string;
  uoMId?: string;
  density?: number;
  densityUoMId?: string | null;
  reOrderLevel?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
};
export type DomainEntitiesMaterialsMaterialDepartmentWithWarehouseStockDto = {
  material?: DomainEntitiesMaterialsMaterialDto;
  department?: SharedCollectionItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  density?: number;
  densityUoM?: DomainEntitiesBaseUnitOfMeasureDto;
  reOrderLevel?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
  warehouseStock?: number;
  pendingStockTransferQuantity?: number;
  reservedQuantity?: number;
  expiredQuantity?: number;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialDepartmentWithWarehouseStockDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?:
      DomainEntitiesMaterialsMaterialDepartmentWithWarehouseStockDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type SharedSortDirection = 0 | 1 | 2;
export type DomainEntitiesMaterialsMaterialWithWarehouseStockDto = {
  id?: string;
  code?: string | null;
  pharmacopoeia?: string | null;
  name?: string | null;
  description?: string | null;
  alphabet?: string | null;
  kind?: DomainEntitiesMaterialsMaterialKind;
  isUnlimited?: boolean;
  materialCategory?: DomainEntitiesMaterialsMaterialCategoryDto;
  specification?: DomainEntitiesMaterialSpecificationsMaterialSpecificationReducedDto;
  totalStock?: number;
  reservedStock?: number;
  suppliers?: DomainEntitiesProcurementSuppliersSupplierListDto[] | null;
  manufacturers?:
    DomainEntitiesProcurementManufacturersManufacturerListDto[] | null;
  warehouseStock?: number;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialWithWarehouseStockDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesMaterialsMaterialWithWarehouseStockDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesMaterialsHoldingMaterialTransferStatus = 0 | 1;
export type DomainEntitiesMaterialsHoldingMaterialTransferBatchDto = {
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchListDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  sourceWarehouse?: SharedCollectionItemDto;
  destinationWarehouse?: SharedCollectionItemDto;
};
export type DomainEntitiesMaterialsHoldingMaterialTransferBatchDtoRead = {
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchListDtoRead;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  sourceWarehouse?: SharedCollectionItemDto;
  destinationWarehouse?: SharedCollectionItemDto;
};
export type DomainEntitiesMaterialsHoldingMaterialTransferDto = {
  id?: string;
  status?: DomainEntitiesMaterialsHoldingMaterialTransferStatus;
  batches?: DomainEntitiesMaterialsHoldingMaterialTransferBatchDto[] | null;
};
export type DomainEntitiesMaterialsHoldingMaterialTransferDtoRead = {
  id?: string;
  status?: DomainEntitiesMaterialsHoldingMaterialTransferStatus;
  batches?: DomainEntitiesMaterialsHoldingMaterialTransferBatchDtoRead[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsHoldingMaterialTransferDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesMaterialsHoldingMaterialTransferDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsHoldingMaterialTransferDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesMaterialsHoldingMaterialTransferDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesMaterialsBatchSupplyMaterialBatchFromHMaterialDistribute =
  {
    materialBatchId?: string;
    distributeMaterialId?: string;
    shelfMaterialBatches?:
      DomainEntitiesMaterialsBatchCreateShelfMaterialBatch[] | null;
  };
export type DomainEntitiesReportsWarehouseReservedMaterialReportDto = {
  materialName?: string | null;
  materialCode?: string | null;
  reservedQuantity?: number;
  uomSymbol?: string | null;
  productName?: string | null;
  productCode?: string | null;
  warehouseName?: string | null;
  departmentName?: string | null;
  dateTime?: string;
  schedule?: string | null;
  productBatchNumber?: string | null;
  arNumber?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  balanceQuantity?: number;
  materialBatchNumber?: string | null;
};
export type DomainEntitiesMaterialsBatchMaterialBatchCountDto = {
  warehouseId?: string;
  warehouse?: DomainEntitiesWarehousesWarehouseDto;
  batchCount?: number;
};
export type DomainEntitiesMaterialsMaterialDepartmentDto = {
  material?: DomainEntitiesMaterialsMaterialDto;
  department?: SharedCollectionItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  density?: number;
  densityUoM?: DomainEntitiesBaseUnitOfMeasureDto;
  reOrderLevel?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
};
export type DomainEntitiesMaterialsMaterialBatchDepartmentDto = {
  material?: DomainEntitiesMaterialsMaterialDto;
  batches?: DomainEntitiesMaterialsBatchMaterialBatchDto[] | null;
  productionDepartments?: DomainEntitiesMaterialsMaterialDepartmentDto[] | null;
};
export type DomainEntitiesMaterialsMaterialBatchDepartmentDtoRead = {
  material?: DomainEntitiesMaterialsMaterialDto;
  batches?: DomainEntitiesMaterialsBatchMaterialBatchDtoRead[] | null;
  productionDepartments?: DomainEntitiesMaterialsMaterialDepartmentDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialBatchDepartmentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesMaterialsMaterialBatchDepartmentDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialBatchDepartmentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesMaterialsMaterialBatchDepartmentDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type SharedBatchInconsistencyReport = {
  batchId?: string;
  batchNumber?: string | null;
  status?: string | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  globalTotalQuantity?: number;
  globalConsumedQuantity?: number;
  globalQuantityAssigned?: number;
  actualShelfQuantity?: number;
  actualConsumedQuantity?: number;
  unassignedQuantity?: number;
  hasStatusMismatch?: boolean;
};
export type SharedBatchInconsistencyReportRead = {
  batchId?: string;
  batchNumber?: string | null;
  status?: string | null;
  warehouseId?: string | null;
  warehouseName?: string | null;
  globalTotalQuantity?: number;
  globalConsumedQuantity?: number;
  globalQuantityAssigned?: number;
  actualShelfQuantity?: number;
  actualConsumedQuantity?: number;
  unassignedQuantity?: number;
  isOverAssigned?: boolean;
  hasStatusMismatch?: boolean;
};
export const {
  usePostApiV1BomMutation,
  usePutApiV1BomByBillOfMaterialIdMutation,
  useDeleteApiV1BomByBillOfMaterialIdMutation,
  usePostApiV1MaterialMutation,
  useGetApiV1MaterialQuery,
  useLazyGetApiV1MaterialQuery,
  useGetApiV1MaterialByMaterialIdQuery,
  useLazyGetApiV1MaterialByMaterialIdQuery,
  usePutApiV1MaterialByMaterialIdMutation,
  useDeleteApiV1MaterialByMaterialIdMutation,
  useGetApiV1MaterialNotLinkedToArdsQuery,
  useLazyGetApiV1MaterialNotLinkedToArdsQuery,
  useGetApiV1MaterialCategoryQuery,
  useLazyGetApiV1MaterialCategoryQuery,
  useGetApiV1MaterialAllQuery,
  useLazyGetApiV1MaterialAllQuery,
  usePutApiV1MaterialByMaterialIdReorderLevelMutation,
  useGetApiV1MaterialByMaterialIdStockLevelQuery,
  useLazyGetApiV1MaterialByMaterialIdStockLevelQuery,
  useGetApiV1MaterialByMaterialIdBatchesQuery,
  useLazyGetApiV1MaterialByMaterialIdBatchesQuery,
  useGetApiV1MaterialByMaterialIdInTransitQuery,
  useLazyGetApiV1MaterialByMaterialIdInTransitQuery,
  usePostApiV1MaterialBatchMutation,
  useGetApiV1MaterialBatchQuery,
  useLazyGetApiV1MaterialBatchQuery,
  useGetApiV1MaterialBatchByBatchIdQuery,
  useLazyGetApiV1MaterialBatchByBatchIdQuery,
  usePutApiV1MaterialBatchByBatchIdApproveMutation,
  useGetApiV1MaterialByMaterialIdStockAndWarehouseIdQuery,
  useLazyGetApiV1MaterialByMaterialIdStockAndWarehouseIdQuery,
  useGetApiV1MaterialByMaterialIdStockAcrossWarehousesQuery,
  useLazyGetApiV1MaterialByMaterialIdStockAcrossWarehousesQuery,
  useGetApiV1MaterialByMaterialIdStockPipelineQuery,
  useLazyGetApiV1MaterialByMaterialIdStockPipelineQuery,
  useGetApiV1MaterialByMaterialIdDepartmentStockAndQuantityQuery,
  useLazyGetApiV1MaterialByMaterialIdDepartmentStockAndQuantityQuery,
  usePutApiV1MaterialBatchStatusMutation,
  usePostApiV1MaterialBatchByBatchIdRequestRetestMutation,
  usePostApiV1MaterialBatchByBatchIdCompleteRetestMutation,
  usePostApiV1MaterialBatchSupplyMutation,
  useGetApiV1MaterialApprovedMaterialsQuery,
  useLazyGetApiV1MaterialApprovedMaterialsQuery,
  useGetApiV1MaterialDepartmentApprovedMaterialsQuery,
  useLazyGetApiV1MaterialDepartmentApprovedMaterialsQuery,
  useGetApiV1MaterialDepartmentApprovedMaterialsV2Query,
  useLazyGetApiV1MaterialDepartmentApprovedMaterialsV2Query,
  useGetApiV1MaterialByMaterialIdBatchesV2AndDepartmentIdQuery,
  useLazyGetApiV1MaterialByMaterialIdBatchesV2AndDepartmentIdQuery,
  useGetApiV1MaterialByMaterialIdStockWarehousesQuery,
  useLazyGetApiV1MaterialByMaterialIdStockWarehousesQuery,
  useGetApiV1MaterialByMaterialIdStockDepartmentsQuery,
  useLazyGetApiV1MaterialByMaterialIdStockDepartmentsQuery,
  usePostApiV1MaterialDepartmentMutation,
  useDeleteApiV1MaterialDepartmentMutation,
  useGetApiV1MaterialDepartmentQuery,
  useLazyGetApiV1MaterialDepartmentQuery,
  useGetApiV1MaterialDepartmentNotLinkedQuery,
  useLazyGetApiV1MaterialDepartmentNotLinkedQuery,
  useGetApiV1MaterialByMaterialIdUomQuery,
  useLazyGetApiV1MaterialByMaterialIdUomQuery,
  useGetApiV1MaterialHoldingQuery,
  useLazyGetApiV1MaterialHoldingQuery,
  usePostApiV1MaterialBatchesImportMutation,
  useGetApiV1MaterialBatchesExpiredQuery,
  useLazyGetApiV1MaterialBatchesExpiredQuery,
  useGetApiV1MaterialBatchesAboutToExpireQuery,
  useLazyGetApiV1MaterialBatchesAboutToExpireQuery,
  useGetApiV1MaterialMaterialSpecsNotLinkedQuery,
  useLazyGetApiV1MaterialMaterialSpecsNotLinkedQuery,
  useGetApiV1MaterialRejectsQuery,
  useLazyGetApiV1MaterialRejectsQuery,
  useGetApiV1MaterialByMaterialIdShelfQuery,
  useLazyGetApiV1MaterialByMaterialIdShelfQuery,
  useGetApiV1MaterialShelfQuery,
  useLazyGetApiV1MaterialShelfQuery,
  usePostApiV1MaterialDistributeMaterialMoveBatchMutation,
  useGetApiV1MaterialByMaterialIdReservedQuery,
  useLazyGetApiV1MaterialByMaterialIdReservedQuery,
  useGetApiV1MaterialDownloadStockQuery,
  useLazyGetApiV1MaterialDownloadStockQuery,
  useGetApiV1MaterialBatchesDistinctByWarehouseIdQuery,
  useLazyGetApiV1MaterialBatchesDistinctByWarehouseIdQuery,
  useGetApiV1MaterialBatchesDepartmentsQuery,
  useLazyGetApiV1MaterialBatchesDepartmentsQuery,
  useGetApiV1MaterialDiagnosticsInconsistenciesQuery,
  useLazyGetApiV1MaterialDiagnosticsInconsistenciesQuery,
} = injectedRtkApi;
