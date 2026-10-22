import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiV1DamagedGoods: build.mutation<
      PostApiV1DamagedGoodsApiResponse,
      PostApiV1DamagedGoodsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "damaged-good", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/damaged-goods`,
        method: "POST",
        body: queryArg.domainEntitiesDamagedStocksCreateDamagedStockRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1DamagedGoods: build.query<
      GetApiV1DamagedGoodsApiResponse,
      GetApiV1DamagedGoodsApiArg
    >({
      providesTags: [{ type: "damaged-good", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/damaged-goods`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          store: queryArg.store,
          damageStatus: queryArg.damageStatus,
        },
      }),
    }),
    getApiV1DamagedGoodsById: build.query<
      GetApiV1DamagedGoodsByIdApiResponse,
      GetApiV1DamagedGoodsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "damaged-good", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/damaged-goods/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1DamagedGoodsById: build.mutation<
      PutApiV1DamagedGoodsByIdApiResponse,
      PutApiV1DamagedGoodsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "damaged-good", id: "LIST" }, { type: "damaged-good", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/damaged-goods/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesDamagedStocksCreateDamagedStockRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1DamagedGoodsById: build.mutation<
      DeleteApiV1DamagedGoodsByIdApiResponse,
      DeleteApiV1DamagedGoodsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "damaged-good", id: "LIST" }, { type: "damaged-good", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/damaged-goods/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1Requisition: build.mutation<
      PostApiV1RequisitionApiResponse,
      PostApiV1RequisitionApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "requisition", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/requisition`,
        method: "POST",
        body: queryArg.domainEntitiesRequisitionsRequestCreateRequisitionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Requisition: build.query<
      GetApiV1RequisitionApiResponse,
      GetApiV1RequisitionApiArg
    >({
      providesTags: [{ type: "requisition", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/requisition`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
          type: queryArg["type"],
        },
      }),
    }),
    getApiV1RequisitionDepartment: build.query<
      GetApiV1RequisitionDepartmentApiResponse,
      GetApiV1RequisitionDepartmentApiArg
    >({
      providesTags: [{ type: "requisition/department", id: "LIST" }, { type: "requisition", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/requisition/department`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
          type: queryArg["type"],
          kind: queryArg.kind,
        },
      }),
    }),
    getApiV1RequisitionByRequisitionId: build.query<
      GetApiV1RequisitionByRequisitionIdApiResponse,
      GetApiV1RequisitionByRequisitionIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "requisition", id: queryArg.requisitionId }],
      query: (queryArg) => ({
        url: `/api/v1/requisition/${queryArg.requisitionId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1RequisitionByRequisitionIdAlternativeBatches: build.query<
      GetApiV1RequisitionByRequisitionIdAlternativeBatchesApiResponse,
      GetApiV1RequisitionByRequisitionIdAlternativeBatchesApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "requisition", id: queryArg.requisitionId }],
      query: (queryArg) => ({
        url: `/api/v1/requisition/${queryArg.requisitionId}/alternative-batches`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1RequisitionIssueStockRequisitionByStockRequisitionId:
      build.mutation<
        PostApiV1RequisitionIssueStockRequisitionByStockRequisitionIdApiResponse,
        PostApiV1RequisitionIssueStockRequisitionByStockRequisitionIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/requisition/issue-stock-requisition/${queryArg.stockRequisitionId}`,
          method: "POST",
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postApiV1RequisitionIssueTrialRequisitionByRequisitionId: build.mutation<
      PostApiV1RequisitionIssueTrialRequisitionByRequisitionIdApiResponse,
      PostApiV1RequisitionIssueTrialRequisitionByRequisitionIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "requisition/issue-trial-requisition", id: "LIST" }, { type: "requisition", id: "LIST" }, { type: "requisition/issue-trial-requisition", id: queryArg.requisitionId }]),
      query: (queryArg) => ({
        url: `/api/v1/requisition/issue-trial-requisition/${queryArg.requisitionId}`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1RequisitionSource: build.mutation<
      PostApiV1RequisitionSourceApiResponse,
      PostApiV1RequisitionSourceApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "requisition/source", id: "LIST" }, { type: "requisition", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/requisition/source`,
        method: "POST",
        body: queryArg.domainEntitiesRequisitionsRequestCreateSourceRequisitionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1RequisitionSource: build.query<
      GetApiV1RequisitionSourceApiResponse,
      GetApiV1RequisitionSourceApiArg
    >({
      providesTags: [{ type: "requisition/source", id: "LIST" }, { type: "requisition", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/requisition/source`,
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
    getApiV1RequisitionSourceBySourceRequisitionId: build.query<
      GetApiV1RequisitionSourceBySourceRequisitionIdApiResponse,
      GetApiV1RequisitionSourceBySourceRequisitionIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "requisition/source", id: queryArg.sourceRequisitionId }],
      query: (queryArg) => ({
        url: `/api/v1/requisition/source/${queryArg.sourceRequisitionId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1RequisitionSourceBySourceRequisitionId: build.mutation<
      PutApiV1RequisitionSourceBySourceRequisitionIdApiResponse,
      PutApiV1RequisitionSourceBySourceRequisitionIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "requisition/source", id: "LIST" }, { type: "requisition", id: "LIST" }, { type: "requisition/source", id: queryArg.sourceRequisitionId }]),
      query: (queryArg) => ({
        url: `/api/v1/requisition/source/${queryArg.sourceRequisitionId}`,
        method: "PUT",
        body: queryArg.domainEntitiesRequisitionsRequestCreateSourceRequisitionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1RequisitionSourceBySourceRequisitionId: build.mutation<
      DeleteApiV1RequisitionSourceBySourceRequisitionIdApiResponse,
      DeleteApiV1RequisitionSourceBySourceRequisitionIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "requisition/source", id: "LIST" }, { type: "requisition", id: "LIST" }, { type: "requisition/source", id: queryArg.sourceRequisitionId }]),
      query: (queryArg) => ({
        url: `/api/v1/requisition/source/${queryArg.sourceRequisitionId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1RequisitionSourceItems: build.query<
      GetApiV1RequisitionSourceItemsApiResponse,
      GetApiV1RequisitionSourceItemsApiArg
    >({
      providesTags: [{ type: "requisition/source", id: "LIST" }, { type: "requisition", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/requisition/source/items`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          source: queryArg.source,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    getApiV1RequisitionSourceSupplier: build.query<
      GetApiV1RequisitionSourceSupplierApiResponse,
      GetApiV1RequisitionSourceSupplierApiArg
    >({
      providesTags: [{ type: "requisition/source", id: "LIST" }, { type: "requisition", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/requisition/source/supplier`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          source: queryArg.source,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          sent: queryArg.sent,
        },
      }),
    }),
    getApiV1RequisitionSourceSupplierBySupplierId: build.query<
      GetApiV1RequisitionSourceSupplierBySupplierIdApiResponse,
      GetApiV1RequisitionSourceSupplierBySupplierIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "requisition/source", id: queryArg.supplierId }],
      query: (queryArg) => ({
        url: `/api/v1/requisition/source/supplier/${queryArg.supplierId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1RequisitionPendingBySupplierId: build.query<
      GetApiV1RequisitionPendingBySupplierIdApiResponse,
      GetApiV1RequisitionPendingBySupplierIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "requisition/pending", id: queryArg.supplierId }],
      query: (queryArg) => ({
        url: `/api/v1/requisition/pending/${queryArg.supplierId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1RequisitionSourceSupplierBySupplierIdSendQuotation: build.mutation<
      PostApiV1RequisitionSourceSupplierBySupplierIdSendQuotationApiResponse,
      PostApiV1RequisitionSourceSupplierBySupplierIdSendQuotationApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "requisition/source", id: "LIST" }, { type: "requisition", id: "LIST" }, { type: "requisition/source", id: queryArg.supplierId }]),
      query: (queryArg) => ({
        url: `/api/v1/requisition/source/supplier/${queryArg.supplierId}/send-quotation`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1RequisitionSourceSupplierQuotation: build.query<
      GetApiV1RequisitionSourceSupplierQuotationApiResponse,
      GetApiV1RequisitionSourceSupplierQuotationApiArg
    >({
      providesTags: [{ type: "requisition/source", id: "LIST" }, { type: "requisition", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/requisition/source/supplier/quotation`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          supplierType: queryArg.supplierType,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          received: queryArg.received,
        },
      }),
    }),
    getApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotation:
      build.query<
        GetApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationApiResponse,
        GetApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/requisition/source/supplier/${queryArg.supplierQuotationId}/quotation`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationReceive:
      build.mutation<
        PostApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationReceiveApiResponse,
        PostApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationReceiveApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/requisition/source/supplier/${queryArg.supplierQuotationId}/quotation/receive`,
          method: "POST",
          body: queryArg.body,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1RequisitionSourceMaterialPriceComparison: build.query<
      GetApiV1RequisitionSourceMaterialPriceComparisonApiResponse,
      GetApiV1RequisitionSourceMaterialPriceComparisonApiArg
    >({
      providesTags: [{ type: "requisition/source", id: "LIST" }, { type: "requisition", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/requisition/source/material/price-comparison`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          supplierType: queryArg.supplierType,
        },
      }),
    }),
    getApiV1RequisitionSourceMaterialPriceComparisonByMaterial: build.query<
      GetApiV1RequisitionSourceMaterialPriceComparisonByMaterialApiResponse,
      GetApiV1RequisitionSourceMaterialPriceComparisonByMaterialApiArg
    >({
      providesTags: [{ type: "requisition/source", id: "LIST" }, { type: "requisition", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/requisition/source/material/price-comparison/by-material`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          supplierType: queryArg.supplierType,
          materialId: queryArg.materialId,
          purchaseOrderId: queryArg.purchaseOrderId,
          status: queryArg.status,
        },
      }),
    }),
    postApiV1RequisitionSourceQuotationProcessPurchaseOrder: build.mutation<
      PostApiV1RequisitionSourceQuotationProcessPurchaseOrderApiResponse,
      PostApiV1RequisitionSourceQuotationProcessPurchaseOrderApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "requisition/source", id: "LIST" }, { type: "requisition", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/requisition/source/quotation/process-purchase-order`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          supplierType: queryArg.supplierType,
        },
      }),
    }),
    postApiV1StockAdjustment: build.mutation<
      PostApiV1StockAdjustmentApiResponse,
      PostApiV1StockAdjustmentApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "stock-adjustment", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/stock-adjustment`,
        method: "POST",
        body: queryArg.domainEntitiesStockAdjustmentsCreateStockAdjustmentRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1StockAdjustment: build.query<
      GetApiV1StockAdjustmentApiResponse,
      GetApiV1StockAdjustmentApiArg
    >({
      providesTags: [{ type: "stock-adjustment", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/stock-adjustment`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          approved: queryArg.approved,
          targetType: queryArg.targetType,
        },
      }),
    }),
    getApiV1StockAdjustmentById: build.query<
      GetApiV1StockAdjustmentByIdApiResponse,
      GetApiV1StockAdjustmentByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "stock-adjustment", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/stock-adjustment/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1Warehouse: build.mutation<
      PostApiV1WarehouseApiResponse,
      PostApiV1WarehouseApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "warehouse", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/warehouse`,
        method: "POST",
        body: queryArg.domainEntitiesWarehousesRequestCreateWarehouseRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Warehouse: build.query<
      GetApiV1WarehouseApiResponse,
      GetApiV1WarehouseApiArg
    >({
      providesTags: [{ type: "warehouse", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          type: queryArg["type"],
        },
      }),
    }),
    getApiV1WarehouseByWarehouseId: build.query<
      GetApiV1WarehouseByWarehouseIdApiResponse,
      GetApiV1WarehouseByWarehouseIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "warehouse", id: queryArg.warehouseId }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/${queryArg.warehouseId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1WarehouseByWarehouseId: build.mutation<
      PutApiV1WarehouseByWarehouseIdApiResponse,
      PutApiV1WarehouseByWarehouseIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "warehouse", id: "LIST" }, { type: "warehouse", id: queryArg.warehouseId }]),
      query: (queryArg) => ({
        url: `/api/v1/warehouse/${queryArg.warehouseId}`,
        method: "PUT",
        body: queryArg.domainEntitiesWarehousesRequestCreateWarehouseRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1WarehouseByWarehouseId: build.mutation<
      DeleteApiV1WarehouseByWarehouseIdApiResponse,
      DeleteApiV1WarehouseByWarehouseIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "warehouse", id: "LIST" }, { type: "warehouse", id: queryArg.warehouseId }]),
      query: (queryArg) => ({
        url: `/api/v1/warehouse/${queryArg.warehouseId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1WarehouseDepartmentByDepartmentId: build.query<
      GetApiV1WarehouseDepartmentByDepartmentIdApiResponse,
      GetApiV1WarehouseDepartmentByDepartmentIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "warehouse/department", id: queryArg.departmentId }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/department/${queryArg.departmentId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1WarehouseByWarehouseIdLocation: build.mutation<
      PostApiV1WarehouseByWarehouseIdLocationApiResponse,
      PostApiV1WarehouseByWarehouseIdLocationApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "warehouse", id: "LIST" }, { type: "warehouse", id: queryArg.warehouseId }]),
      query: (queryArg) => ({
        url: `/api/v1/warehouse/${queryArg.warehouseId}/location`,
        method: "POST",
        body: queryArg.domainEntitiesWarehousesRequestCreateWarehouseLocationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1WarehouseLocationByLocationId: build.query<
      GetApiV1WarehouseLocationByLocationIdApiResponse,
      GetApiV1WarehouseLocationByLocationIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "warehouse/location", id: queryArg.locationId }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/location/${queryArg.locationId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1WarehouseLocationByLocationId: build.mutation<
      PutApiV1WarehouseLocationByLocationIdApiResponse,
      PutApiV1WarehouseLocationByLocationIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "warehouse/location", id: "LIST" }, { type: "warehouse", id: "LIST" }, { type: "warehouse/location", id: queryArg.locationId }]),
      query: (queryArg) => ({
        url: `/api/v1/warehouse/location/${queryArg.locationId}`,
        method: "PUT",
        body: queryArg.domainEntitiesWarehousesRequestCreateWarehouseLocationRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1WarehouseLocationByLocationId: build.mutation<
      DeleteApiV1WarehouseLocationByLocationIdApiResponse,
      DeleteApiV1WarehouseLocationByLocationIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "warehouse/location", id: "LIST" }, { type: "warehouse", id: "LIST" }, { type: "warehouse/location", id: queryArg.locationId }]),
      query: (queryArg) => ({
        url: `/api/v1/warehouse/location/${queryArg.locationId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1WarehouseLocation: build.query<
      GetApiV1WarehouseLocationApiResponse,
      GetApiV1WarehouseLocationApiArg
    >({
      providesTags: [{ type: "warehouse/location", id: "LIST" }, { type: "warehouse", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/location`,
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
    postApiV1WarehouseByLocationIdRack: build.mutation<
      PostApiV1WarehouseByLocationIdRackApiResponse,
      PostApiV1WarehouseByLocationIdRackApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "warehouse", id: "LIST" }, { type: "warehouse", id: queryArg.locationId }]),
      query: (queryArg) => ({
        url: `/api/v1/warehouse/${queryArg.locationId}/rack`,
        method: "POST",
        body: queryArg.domainEntitiesWarehousesRequestCreateWarehouseLocationRackRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1WarehouseRackByRackId: build.query<
      GetApiV1WarehouseRackByRackIdApiResponse,
      GetApiV1WarehouseRackByRackIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "warehouse/rack", id: queryArg.rackId }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/rack/${queryArg.rackId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1WarehouseRackByRackId: build.mutation<
      PutApiV1WarehouseRackByRackIdApiResponse,
      PutApiV1WarehouseRackByRackIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "warehouse/rack", id: "LIST" }, { type: "warehouse", id: "LIST" }, { type: "warehouse/rack", id: queryArg.rackId }]),
      query: (queryArg) => ({
        url: `/api/v1/warehouse/rack/${queryArg.rackId}`,
        method: "PUT",
        body: queryArg.domainEntitiesWarehousesRequestCreateWarehouseLocationRackRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1WarehouseRackByRackId: build.mutation<
      DeleteApiV1WarehouseRackByRackIdApiResponse,
      DeleteApiV1WarehouseRackByRackIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "warehouse/rack", id: "LIST" }, { type: "warehouse", id: "LIST" }, { type: "warehouse/rack", id: queryArg.rackId }]),
      query: (queryArg) => ({
        url: `/api/v1/warehouse/rack/${queryArg.rackId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1WarehouseRack: build.query<
      GetApiV1WarehouseRackApiResponse,
      GetApiV1WarehouseRackApiArg
    >({
      providesTags: [{ type: "warehouse/rack", id: "LIST" }, { type: "warehouse", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/rack`,
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
    getApiV1WarehouseRackByDepartment: build.query<
      GetApiV1WarehouseRackByDepartmentApiResponse,
      GetApiV1WarehouseRackByDepartmentApiArg
    >({
      providesTags: [{ type: "warehouse/rack", id: "LIST" }, { type: "warehouse", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/rack/by-department`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          kind: queryArg.kind,
        },
      }),
    }),
    getApiV1WarehouseRackByDepartmentSummary: build.query<
      GetApiV1WarehouseRackByDepartmentSummaryApiResponse,
      GetApiV1WarehouseRackByDepartmentSummaryApiArg
    >({
      providesTags: [{ type: "warehouse/rack", id: "LIST" }, { type: "warehouse", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/rack/by-department/summary`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          kind: queryArg.kind,
        },
      }),
    }),
    postApiV1WarehouseByRackIdShelf: build.mutation<
      PostApiV1WarehouseByRackIdShelfApiResponse,
      PostApiV1WarehouseByRackIdShelfApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "warehouse", id: "LIST" }, { type: "warehouse", id: queryArg.rackId }]),
      query: (queryArg) => ({
        url: `/api/v1/warehouse/${queryArg.rackId}/shelf`,
        method: "POST",
        body: queryArg.domainEntitiesWarehousesRequestCreateWarehouseLocationShelfRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1WarehouseShelfByShelfId: build.query<
      GetApiV1WarehouseShelfByShelfIdApiResponse,
      GetApiV1WarehouseShelfByShelfIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "warehouse/shelf", id: queryArg.shelfId }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/shelf/${queryArg.shelfId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1WarehouseShelfByShelfId: build.mutation<
      PutApiV1WarehouseShelfByShelfIdApiResponse,
      PutApiV1WarehouseShelfByShelfIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "warehouse/shelf", id: "LIST" }, { type: "warehouse", id: "LIST" }, { type: "warehouse/shelf", id: queryArg.shelfId }]),
      query: (queryArg) => ({
        url: `/api/v1/warehouse/shelf/${queryArg.shelfId}`,
        method: "PUT",
        body: queryArg.domainEntitiesWarehousesRequestCreateWarehouseLocationShelfRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1WarehouseShelfByShelfId: build.mutation<
      DeleteApiV1WarehouseShelfByShelfIdApiResponse,
      DeleteApiV1WarehouseShelfByShelfIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "warehouse/shelf", id: "LIST" }, { type: "warehouse", id: "LIST" }, { type: "warehouse/shelf", id: queryArg.shelfId }]),
      query: (queryArg) => ({
        url: `/api/v1/warehouse/shelf/${queryArg.shelfId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1WarehouseShelf: build.query<
      GetApiV1WarehouseShelfApiResponse,
      GetApiV1WarehouseShelfApiArg
    >({
      providesTags: [{ type: "warehouse/shelf", id: "LIST" }, { type: "warehouse", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/shelf`,
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
    getApiV1WarehouseShelfByDepartment: build.query<
      GetApiV1WarehouseShelfByDepartmentApiResponse,
      GetApiV1WarehouseShelfByDepartmentApiArg
    >({
      providesTags: [{ type: "warehouse/shelf", id: "LIST" }, { type: "warehouse", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/shelf/by-department`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          kind: queryArg.kind,
        },
      }),
    }),
    getApiV1WarehouseByWarehouseIdShelvesByMaterialAndMaterialId: build.query<
      GetApiV1WarehouseByWarehouseIdShelvesByMaterialAndMaterialIdApiResponse,
      GetApiV1WarehouseByWarehouseIdShelvesByMaterialAndMaterialIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "warehouse", id: queryArg.warehouseId }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/${queryArg.warehouseId}/shelves/by-material/${queryArg.materialId}`,
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
    getApiV1WarehouseByWarehouseIdShelvesByMaterialbatchAndMaterialBatchId:
      build.query<
        GetApiV1WarehouseByWarehouseIdShelvesByMaterialbatchAndMaterialBatchIdApiResponse,
        GetApiV1WarehouseByWarehouseIdShelvesByMaterialbatchAndMaterialBatchIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/warehouse/${queryArg.warehouseId}/shelves/by-materialbatch/${queryArg.materialBatchId}`,
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
    getApiV1WarehouseRackByRackIdShelves: build.query<
      GetApiV1WarehouseRackByRackIdShelvesApiResponse,
      GetApiV1WarehouseRackByRackIdShelvesApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "warehouse/rack", id: queryArg.rackId }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/rack/${queryArg.rackId}/shelves`,
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
    getApiV1WarehouseByWarehouseIdShelves: build.query<
      GetApiV1WarehouseByWarehouseIdShelvesApiResponse,
      GetApiV1WarehouseByWarehouseIdShelvesApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "warehouse", id: queryArg.warehouseId }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/${queryArg.warehouseId}/shelves`,
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
    getApiV1WarehouseByWarehouseIdArrivalLocation: build.query<
      GetApiV1WarehouseByWarehouseIdArrivalLocationApiResponse,
      GetApiV1WarehouseByWarehouseIdArrivalLocationApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "warehouse", id: queryArg.warehouseId }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/${queryArg.warehouseId}/arrival-location`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1WarehouseDistributedRequisitionMaterials: build.query<
      GetApiV1WarehouseDistributedRequisitionMaterialsApiResponse,
      GetApiV1WarehouseDistributedRequisitionMaterialsApiArg
    >({
      providesTags: [{ type: "warehouse/distributed-requisition-material", id: "LIST" }, { type: "warehouse", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/distributed-requisition-materials`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          kind: queryArg.kind,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
        },
      }),
    }),
    getApiV1WarehouseFinishedGoodsDetails: build.query<
      GetApiV1WarehouseFinishedGoodsDetailsApiResponse,
      GetApiV1WarehouseFinishedGoodsDetailsApiArg
    >({
      providesTags: [{ type: "warehouse/finished-goods-detail", id: "LIST" }, { type: "warehouse", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/finished-goods-details`,
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
    getApiV1WarehouseStockTransferDetails: build.query<
      GetApiV1WarehouseStockTransferDetailsApiResponse,
      GetApiV1WarehouseStockTransferDetailsApiArg
    >({
      providesTags: [{ type: "warehouse/stock-transfer-detail", id: "LIST" }, { type: "warehouse", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/stock-transfer-details`,
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
    getApiV1WarehouseDistributedMaterialById: build.query<
      GetApiV1WarehouseDistributedMaterialByIdApiResponse,
      GetApiV1WarehouseDistributedMaterialByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "warehouse/distributed-material", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/distributed-material/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1WarehouseChecklistById: build.query<
      GetApiV1WarehouseChecklistByIdApiResponse,
      GetApiV1WarehouseChecklistByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "warehouse/checklist", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/checklist/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1WarehouseDistributedMaterialByDistributedMaterialIdMaterialBatch:
      build.query<
        GetApiV1WarehouseDistributedMaterialByDistributedMaterialIdMaterialBatchApiResponse,
        GetApiV1WarehouseDistributedMaterialByDistributedMaterialIdMaterialBatchApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/warehouse/distributed-material/${queryArg.distributedMaterialId}/material-batch`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postApiV1WarehouseDistributedMaterialMaterialBatch: build.mutation<
      PostApiV1WarehouseDistributedMaterialMaterialBatchApiResponse,
      PostApiV1WarehouseDistributedMaterialMaterialBatchApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "warehouse/distributed-material", id: "LIST" }, { type: "warehouse", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/warehouse/distributed-material/material-batch`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1WarehouseDistributedMaterialByDistributedMaterialIdChecklist:
      build.query<
        GetApiV1WarehouseDistributedMaterialByDistributedMaterialIdChecklistApiResponse,
        GetApiV1WarehouseDistributedMaterialByDistributedMaterialIdChecklistApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/warehouse/distributed-material/${queryArg.distributedMaterialId}/checklist`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1WarehouseGrnById: build.query<
      GetApiV1WarehouseGrnByIdApiResponse,
      GetApiV1WarehouseGrnByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "warehouse/grn", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/grn/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1WarehouseGrns: build.query<
      GetApiV1WarehouseGrnsApiResponse,
      GetApiV1WarehouseGrnsApiArg
    >({
      providesTags: [{ type: "warehouse/grn", id: "LIST" }, { type: "warehouse", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/grns`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          status: queryArg.status,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          kind: queryArg.kind,
        },
      }),
    }),
    getApiV1WarehouseGrnsQc: build.query<
      GetApiV1WarehouseGrnsQcApiResponse,
      GetApiV1WarehouseGrnsQcApiArg
    >({
      providesTags: [{ type: "warehouse/grn", id: "LIST" }, { type: "warehouse", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/grns/qc`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          status: queryArg.status,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          kind: queryArg.kind,
          onlyApproved: queryArg.onlyApproved,
        },
      }),
    }),
    getApiV1WarehouseBincardinformationByMaterialIdAndDepartmentId: build.query<
      GetApiV1WarehouseBincardinformationByMaterialIdAndDepartmentIdApiResponse,
      GetApiV1WarehouseBincardinformationByMaterialIdAndDepartmentIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "warehouse/bincardinformation", id: queryArg.materialId }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/bincardinformation/${queryArg.materialId}/${queryArg.departmentId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          date: queryArg.date,
        },
      }),
    }),
    getApiV1WarehouseBincardinformationByProductIdProduct: build.query<
      GetApiV1WarehouseBincardinformationByProductIdProductApiResponse,
      GetApiV1WarehouseBincardinformationByProductIdProductApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "warehouse/bincardinformation", id: queryArg.productId }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/bincardinformation/${queryArg.productId}/product`,
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
    postApiV1WarehouseSwap: build.mutation<
      PostApiV1WarehouseSwapApiResponse,
      PostApiV1WarehouseSwapApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "warehouse/swap", id: "LIST" }, { type: "warehouse", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/warehouse/swap`,
        method: "POST",
        body: queryArg.domainEntitiesWarehousesCreateSwapRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1WarehouseSwap: build.query<
      GetApiV1WarehouseSwapApiResponse,
      GetApiV1WarehouseSwapApiArg
    >({
      providesTags: [{ type: "warehouse/swap", id: "LIST" }, { type: "warehouse", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/swap`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          searchQuery: queryArg.searchQuery,
          departmentId: queryArg.departmentId,
          direction: queryArg.direction,
          status: queryArg.status,
          pageSize: queryArg.pageSize,
          page: queryArg.page,
          sortLabel: queryArg.sortLabel,
          sortDirection: queryArg.sortDirection,
        },
      }),
    }),
    getApiV1WarehouseSwapById: build.query<
      GetApiV1WarehouseSwapByIdApiResponse,
      GetApiV1WarehouseSwapByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "warehouse/swap", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/warehouse/swap/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1WarehouseSwapByIdApprove: build.mutation<
      PutApiV1WarehouseSwapByIdApproveApiResponse,
      PutApiV1WarehouseSwapByIdApproveApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "warehouse/swap", id: "LIST" }, { type: "warehouse", id: "LIST" }, { type: "warehouse/swap", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/warehouse/swap/${queryArg.id}/approve`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as warehouseApi };
export type PostApiV1DamagedGoodsApiResponse = /** status 200 OK */ string;
export type PostApiV1DamagedGoodsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesDamagedStocksCreateDamagedStockRequest: DomainEntitiesDamagedStocksCreateDamagedStockRequest;
};
export type GetApiV1DamagedGoodsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesDamagedStocksDamagedStockDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1DamagedGoodsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  store?: DomainEntitiesItemsStore;
  damageStatus?: DomainEntitiesDamagedStocksDamageStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1DamagedGoodsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesDamagedStocksDamagedStockDto;
export type GetApiV1DamagedGoodsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1DamagedGoodsByIdApiResponse = void;
export type PutApiV1DamagedGoodsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesDamagedStocksCreateDamagedStockRequest: DomainEntitiesDamagedStocksCreateDamagedStockRequest;
};
export type DeleteApiV1DamagedGoodsByIdApiResponse = void;
export type DeleteApiV1DamagedGoodsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1RequisitionApiResponse = void;
export type PostApiV1RequisitionApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateRequisitionRequest object. */
  domainEntitiesRequisitionsRequestCreateRequisitionRequest: DomainEntitiesRequisitionsRequestCreateRequisitionRequest;
};
export type GetApiV1RequisitionApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRequisitionsRequisitionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1RequisitionApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** Filter by status of the requisition. */
  status?: DomainEntitiesRequisitionsRequestStatus;
  /** Filter between stock and purchase requisitions. (Stock = 0, Purchase =  1) */
  type?: DomainEntitiesRequisitionsRequisitionType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1RequisitionDepartmentApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRequisitionsRequisitionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1RequisitionDepartmentApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** Filter by status of the requisition. */
  status?: DomainEntitiesRequisitionsRequestStatus;
  /** Filter between stock and purchase requisitions. (Stock = 0, Purchase =  1) */
  type?: DomainEntitiesRequisitionsRequisitionType;
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1RequisitionByRequisitionIdApiResponse =
  /** status 200 OK */ DomainEntitiesRequisitionsRequisitionDtoRead;
export type GetApiV1RequisitionByRequisitionIdApiArg = {
  /** The ID of the Stock Requisition. */
  requisitionId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1RequisitionByRequisitionIdAlternativeBatchesApiResponse =
  /** status 200 OK */ DomainEntitiesRequisitionsMaterialAlternativeBatchesDtoRead[];
export type GetApiV1RequisitionByRequisitionIdAlternativeBatchesApiArg = {
  /** The ID of the Stock Requisition. */
  requisitionId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1RequisitionIssueStockRequisitionByStockRequisitionIdApiResponse = void;
export type PostApiV1RequisitionIssueStockRequisitionByStockRequisitionIdApiArg =
  {
    stockRequisitionId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PostApiV1RequisitionIssueTrialRequisitionByRequisitionIdApiResponse = void;
export type PostApiV1RequisitionIssueTrialRequisitionByRequisitionIdApiArg = {
  requisitionId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1RequisitionSourceApiResponse = /** status 200 OK */ string;
export type PostApiV1RequisitionSourceApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateSourceRequisitionRequest object. */
  domainEntitiesRequisitionsRequestCreateSourceRequisitionRequest: DomainEntitiesRequisitionsRequestCreateSourceRequisitionRequest;
};
export type GetApiV1RequisitionSourceApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRequisitionsSourceRequisitionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1RequisitionSourceApiArg = {
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
export type GetApiV1RequisitionSourceBySourceRequisitionIdApiResponse =
  /** status 200 OK */ DomainEntitiesRequisitionsSourceRequisitionDto;
export type GetApiV1RequisitionSourceBySourceRequisitionIdApiArg = {
  /** The ID of the Source Requisition. */
  sourceRequisitionId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1RequisitionSourceBySourceRequisitionIdApiResponse = void;
export type PutApiV1RequisitionSourceBySourceRequisitionIdApiArg = {
  /** The ID of the Source Requisition to update. */
  sourceRequisitionId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateSourceRequisitionRequest object. */
  domainEntitiesRequisitionsRequestCreateSourceRequisitionRequest: DomainEntitiesRequisitionsRequestCreateSourceRequisitionRequest;
};
export type DeleteApiV1RequisitionSourceBySourceRequisitionIdApiResponse = void;
export type DeleteApiV1RequisitionSourceBySourceRequisitionIdApiArg = {
  /** The ID of the Source Requisition to delete. */
  sourceRequisitionId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1RequisitionSourceItemsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRequisitionsSourceRequisitionItemDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1RequisitionSourceItemsApiArg = {
  /** The procurement source of the material(e.g., Local, Foreign, Internal). */
  source?: DomainEntitiesRequisitionsProcurementSource;
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1RequisitionSourceSupplierApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRequisitionsSupplierQuotationRequest20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1RequisitionSourceSupplierApiArg = {
  /** The source of the requisition. (example Local, Foreign) */
  source?: DomainEntitiesProcurementSuppliersSupplierType;
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Filter by whether a quotation has been sent. */
  sent?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1RequisitionSourceSupplierBySupplierIdApiResponse =
  /** status 200 OK */ DomainEntitiesRequisitionsSupplierQuotationRequestRead;
export type GetApiV1RequisitionSourceSupplierBySupplierIdApiArg = {
  /** The id of the supplier with associated requisition items. */
  supplierId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1RequisitionPendingBySupplierIdApiResponse =
  /** status 200 OK */ boolean;
export type GetApiV1RequisitionPendingBySupplierIdApiArg = {
  /** The id of the supplier. */
  supplierId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1RequisitionSourceSupplierBySupplierIdSendQuotationApiResponse = void;
export type PostApiV1RequisitionSourceSupplierBySupplierIdSendQuotationApiArg =
  {
    /** The ID of the supplier. */
    supplierId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1RequisitionSourceSupplierQuotationApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRequisitionsSupplierQuotationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1RequisitionSourceSupplierQuotationApiArg = {
  /** The type of the supplier (example Foreign, Local). */
  supplierType?: DomainEntitiesProcurementSuppliersSupplierType;
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Filter by whether the quotation has been received. */
  received?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationApiResponse =
  /** status 200 OK */ DomainEntitiesRequisitionsSupplierQuotationDto;
export type GetApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationApiArg =
  {
    /** The ID of the supplier quotation. */
    supplierQuotationId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PostApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationReceiveApiResponse = void;
export type PostApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationReceiveApiArg =
  {
    /** The ID of the supplier quotation. */
    supplierQuotationId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    /** The list of quotations received from the supplier. */
    body: DomainEntitiesRequisitionsSupplierQuotationResponseDto[];
  };
export type GetApiV1RequisitionSourceMaterialPriceComparisonApiResponse =
  /** status 200 OK */ DomainEntitiesRequisitionsSupplierPriceComparison[];
export type GetApiV1RequisitionSourceMaterialPriceComparisonApiArg = {
  /** The type of the supplier (example Local, Foreign). */
  supplierType?: DomainEntitiesProcurementSuppliersSupplierType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1RequisitionSourceMaterialPriceComparisonByMaterialApiResponse =
  /** status 200 OK */ DomainEntitiesRequisitionsSupplierPriceComparison[];
export type GetApiV1RequisitionSourceMaterialPriceComparisonByMaterialApiArg = {
  /** The type of the supplier (example Local, Foreign). */
  supplierType?: DomainEntitiesProcurementSuppliersSupplierType;
  /** The materialId of the item */
  materialId?: string;
  /** The purchase order associated */
  purchaseOrderId?: string;
  /** The status of the price comparison (NotProcessed, Processed, NotUsed) */
  status?: DomainEntitiesRequisitionsSupplierQuotationItemStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1RequisitionSourceQuotationProcessPurchaseOrderApiResponse = void;
export type PostApiV1RequisitionSourceQuotationProcessPurchaseOrderApiArg = {
  /** The type of the supplier (example Local, Foreign). */
  supplierType?: DomainEntitiesProcurementSuppliersSupplierType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The list of quotations to process. */
  body: DomainEntitiesRequisitionsProcessQuotation[];
};
export type PostApiV1StockAdjustmentApiResponse =
  /** status 201 Created */ DomainEntitiesStockAdjustmentsStockAdjustmentSummaryDto;
export type PostApiV1StockAdjustmentApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The stock adjustment request payload. */
  domainEntitiesStockAdjustmentsCreateStockAdjustmentRequest: DomainEntitiesStockAdjustmentsCreateStockAdjustmentRequest;
};
export type GetApiV1StockAdjustmentApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesStockAdjustmentsStockAdjustmentSummaryDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1StockAdjustmentApiArg = {
  /** Page number starting from 1 (default: 1) */
  page?: number;
  /** Number of items per page (default: 10, recommended max: 100) */
  pageSize?: number;
  /** Optional search query to filter by adjustment number. */
  searchQuery?: string;
  /** Pass if you want the approved stock adjustments or unapproved */
  approved?: boolean;
  /** The target type: 0 for item, 1 for material, 2 for product */
  targetType?: DomainEntitiesStockAdjustmentsStockAdjustmentTarget;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1StockAdjustmentByIdApiResponse =
  /** status 200 OK */ DomainEntitiesStockAdjustmentsStockAdjustmentDetailDto;
export type GetApiV1StockAdjustmentByIdApiArg = {
  /** The GUID of the stock adjustment. */
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1WarehouseApiResponse = /** status 200 OK */ string;
export type PostApiV1WarehouseApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesWarehousesRequestCreateWarehouseRequest: DomainEntitiesWarehousesRequestCreateWarehouseRequest;
};
export type GetApiV1WarehouseApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesWarehouseDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1WarehouseApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  type?: DomainEntitiesWarehousesWarehouseType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseByWarehouseIdApiResponse =
  /** status 200 OK */ DomainEntitiesWarehousesWarehouseDto;
export type GetApiV1WarehouseByWarehouseIdApiArg = {
  warehouseId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1WarehouseByWarehouseIdApiResponse = void;
export type PutApiV1WarehouseByWarehouseIdApiArg = {
  warehouseId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesWarehousesRequestCreateWarehouseRequest: DomainEntitiesWarehousesRequestCreateWarehouseRequest;
};
export type DeleteApiV1WarehouseByWarehouseIdApiResponse = void;
export type DeleteApiV1WarehouseByWarehouseIdApiArg = {
  warehouseId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseDepartmentByDepartmentIdApiResponse =
  /** status 200 OK */ DomainEntitiesWarehousesWarehouseDto[];
export type GetApiV1WarehouseDepartmentByDepartmentIdApiArg = {
  departmentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1WarehouseByWarehouseIdLocationApiResponse =
  /** status 200 OK */ string;
export type PostApiV1WarehouseByWarehouseIdLocationApiArg = {
  warehouseId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesWarehousesRequestCreateWarehouseLocationRequest: DomainEntitiesWarehousesRequestCreateWarehouseLocationRequest;
};
export type GetApiV1WarehouseLocationByLocationIdApiResponse =
  /** status 200 OK */ DomainEntitiesWarehousesWarehouseLocationDtoRead;
export type GetApiV1WarehouseLocationByLocationIdApiArg = {
  locationId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1WarehouseLocationByLocationIdApiResponse = void;
export type PutApiV1WarehouseLocationByLocationIdApiArg = {
  locationId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesWarehousesRequestCreateWarehouseLocationRequest: DomainEntitiesWarehousesRequestCreateWarehouseLocationRequest;
};
export type DeleteApiV1WarehouseLocationByLocationIdApiResponse = void;
export type DeleteApiV1WarehouseLocationByLocationIdApiArg = {
  locationId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseLocationApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesWarehouseLocationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1WarehouseLocationApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1WarehouseByLocationIdRackApiResponse =
  /** status 200 OK */ string;
export type PostApiV1WarehouseByLocationIdRackApiArg = {
  locationId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesWarehousesRequestCreateWarehouseLocationRackRequest: DomainEntitiesWarehousesRequestCreateWarehouseLocationRackRequest;
};
export type GetApiV1WarehouseRackByRackIdApiResponse =
  /** status 200 OK */ DomainEntitiesWarehousesWarehouseLocationRackDtoRead;
export type GetApiV1WarehouseRackByRackIdApiArg = {
  rackId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1WarehouseRackByRackIdApiResponse = void;
export type PutApiV1WarehouseRackByRackIdApiArg = {
  rackId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesWarehousesRequestCreateWarehouseLocationRackRequest: DomainEntitiesWarehousesRequestCreateWarehouseLocationRackRequest;
};
export type DeleteApiV1WarehouseRackByRackIdApiResponse = void;
export type DeleteApiV1WarehouseRackByRackIdApiArg = {
  rackId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseRackApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesWarehouseLocationRackDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1WarehouseRackApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseRackByDepartmentApiResponse =
  /** status 200 OK */ DomainEntitiesWarehousesWarehouseLocationRackDtoRead[];
export type GetApiV1WarehouseRackByDepartmentApiArg = {
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseRackByDepartmentSummaryApiResponse =
  /** status 200 OK */ DomainEntitiesWarehousesWarehouseLocationRackSummaryDto[];
export type GetApiV1WarehouseRackByDepartmentSummaryApiArg = {
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1WarehouseByRackIdShelfApiResponse =
  /** status 200 OK */ string;
export type PostApiV1WarehouseByRackIdShelfApiArg = {
  rackId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesWarehousesRequestCreateWarehouseLocationShelfRequest: DomainEntitiesWarehousesRequestCreateWarehouseLocationShelfRequest;
};
export type GetApiV1WarehouseShelfByShelfIdApiResponse =
  /** status 200 OK */ DomainEntitiesWarehousesWarehouseLocationShelfDtoRead;
export type GetApiV1WarehouseShelfByShelfIdApiArg = {
  shelfId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1WarehouseShelfByShelfIdApiResponse = void;
export type PutApiV1WarehouseShelfByShelfIdApiArg = {
  shelfId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesWarehousesRequestCreateWarehouseLocationShelfRequest: DomainEntitiesWarehousesRequestCreateWarehouseLocationShelfRequest;
};
export type DeleteApiV1WarehouseShelfByShelfIdApiResponse = void;
export type DeleteApiV1WarehouseShelfByShelfIdApiArg = {
  shelfId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseShelfApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesWarehouseLocationShelfDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1WarehouseShelfApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseShelfByDepartmentApiResponse =
  /** status 200 OK */ DomainEntitiesWarehousesWarehouseLocationShelfDtoRead[];
export type GetApiV1WarehouseShelfByDepartmentApiArg = {
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseByWarehouseIdShelvesByMaterialAndMaterialIdApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesWarehouseLocationShelfDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1WarehouseByWarehouseIdShelvesByMaterialAndMaterialIdApiArg =
  {
    warehouseId: string;
    materialId: string;
    page?: number;
    pageSize?: number;
    searchQuery?: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1WarehouseByWarehouseIdShelvesByMaterialbatchAndMaterialBatchIdApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesWarehouseLocationShelfDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1WarehouseByWarehouseIdShelvesByMaterialbatchAndMaterialBatchIdApiArg =
  {
    warehouseId: string;
    materialBatchId: string;
    page?: number;
    pageSize?: number;
    searchQuery?: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1WarehouseRackByRackIdShelvesApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesWarehouseLocationShelfDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1WarehouseRackByRackIdShelvesApiArg = {
  rackId: string;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseByWarehouseIdShelvesApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesWarehouseLocationShelfDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1WarehouseByWarehouseIdShelvesApiArg = {
  warehouseId: string;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseByWarehouseIdArrivalLocationApiResponse =
  /** status 200 OK */ DomainEntitiesWarehousesWarehouseArrivalLocationDtoRead;
export type GetApiV1WarehouseByWarehouseIdArrivalLocationApiArg = {
  warehouseId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseDistributedRequisitionMaterialsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesDistributedRequisitionMaterialDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1WarehouseDistributedRequisitionMaterialsApiArg = {
  kind?: DomainEntitiesMaterialsMaterialKind;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesWarehousesDistributedRequisitionMaterialStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseFinishedGoodsDetailsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesDistributedFinishedProductDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1WarehouseFinishedGoodsDetailsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseStockTransferDetailsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsBatchMaterialBatchDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1WarehouseStockTransferDetailsApiArg = {
  kind?: DomainEntitiesMaterialsMaterialKind;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseDistributedMaterialByIdApiResponse =
  /** status 200 OK */ DomainEntitiesWarehousesDistributedRequisitionMaterialDtoRead;
export type GetApiV1WarehouseDistributedMaterialByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseChecklistByIdApiResponse =
  /** status 200 OK */ DomainEntitiesChecklistsChecklistDtoRead;
export type GetApiV1WarehouseChecklistByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseDistributedMaterialByDistributedMaterialIdMaterialBatchApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsBatchMaterialBatchDtoRead[];
export type GetApiV1WarehouseDistributedMaterialByDistributedMaterialIdMaterialBatchApiArg =
  {
    distributedMaterialId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PostApiV1WarehouseDistributedMaterialMaterialBatchApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsBatchMaterialBatchDtoRead[];
export type PostApiV1WarehouseDistributedMaterialMaterialBatchApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  body: string[];
};
export type GetApiV1WarehouseDistributedMaterialByDistributedMaterialIdChecklistApiResponse =
  /** status 200 OK */ DomainEntitiesChecklistsChecklistDtoRead;
export type GetApiV1WarehouseDistributedMaterialByDistributedMaterialIdChecklistApiArg =
  {
    distributedMaterialId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1WarehouseGrnByIdApiResponse =
  /** status 200 OK */ DomainEntitiesGrnsGrnDtoRead;
export type GetApiV1WarehouseGrnByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseGrnsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesGrnsGrnListDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1WarehouseGrnsApiArg = {
  status?: DomainEntitiesGrnsStatus;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseGrnsQcApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesGrnsGrnListDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1WarehouseGrnsQcApiArg = {
  status?: DomainEntitiesGrnsStatus;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  kind?: DomainEntitiesMaterialsMaterialKind;
  onlyApproved?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseBincardinformationByMaterialIdAndDepartmentIdApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesBinCardsBinCardInformationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1WarehouseBincardinformationByMaterialIdAndDepartmentIdApiArg =
  {
    materialId: string;
    departmentId: string;
    page?: number;
    pageSize?: number;
    searchQuery?: string;
    date?: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1WarehouseBincardinformationByProductIdProductApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesBinCardsProductBinCardInformationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1WarehouseBincardinformationByProductIdProductApiArg = {
  productId: string;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1WarehouseSwapApiResponse = void;
export type PostApiV1WarehouseSwapApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The swap request details. */
  domainEntitiesWarehousesCreateSwapRequest: DomainEntitiesWarehousesCreateSwapRequest;
};
export type GetApiV1WarehouseSwapApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesSwapRequestDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1WarehouseSwapApiArg = {
  searchQuery?: string;
  departmentId?: string;
  direction?: DomainEntitiesWarehousesRequestSwapRequestDirection;
  status?: DomainEntitiesWarehousesSwapRequestStatus;
  pageSize?: number;
  page?: number;
  sortLabel?: string;
  sortDirection?: SharedSortDirection;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1WarehouseSwapByIdApiResponse =
  /** status 200 OK */ DomainEntitiesWarehousesSwapRequestDtoRead;
export type GetApiV1WarehouseSwapByIdApiArg = {
  /** The unique identifier of the swap request. */
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1WarehouseSwapByIdApproveApiResponse = void;
export type PutApiV1WarehouseSwapByIdApproveApiArg = {
  /** The unique identifier of the swap request to approve. */
  id: string;
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
export type DomainEntitiesDamagedStocksDamageStatus = 0 | 1;
export type DomainEntitiesDamagedStocksCreateDamagedStockRequest = {
  itemId: string;
  damageStatus: DomainEntitiesDamagedStocksDamageStatus;
  quantityDamaged: number;
  remarks?: string | null;
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
export type DomainEntitiesAttachmentsAttachmentDto = {
  link?: string | null;
  name?: string | null;
  id?: string;
  reference?: string | null;
};
export type DomainEntitiesItemsInventoryClassification = 0 | 1;
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
export type DomainEntitiesItemsStore = 0 | 1 | 2 | 3;
export type DomainEntitiesItemsItemCategoryDto = {
  id?: string;
  name?: string | null;
};
export type DomainEntitiesItemsItemDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  name?: string | null;
  code?: string | null;
  classification?: DomainEntitiesItemsInventoryClassification;
  unitOfMeasure?: DomainEntitiesBaseUnitOfMeasureDto;
  hasBatch?: boolean;
  store?: DomainEntitiesItemsStore;
  minimumLevel?: number;
  maximumLevel?: number;
  reorderLevel?: number;
  isActive?: boolean;
  description?: string | null;
  itemCategory?: DomainEntitiesItemsItemCategoryDto;
  availableQuantity?: number;
};
export type DomainEntitiesDamagedStocksDamagedStockDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  itemId?: string;
  item?: DomainEntitiesItemsItemDto;
  quantityDamaged?: number;
  damageStatus?: DomainEntitiesDamagedStocksDamageStatus;
  remarks?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesDamagedStocksDamagedStockDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesDamagedStocksDamagedStockDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesRequisitionsRequisitionType = 0 | 1 | 2;
export type DomainEntitiesRequisitionsRequestCreateRequisitionItemRequest = {
  materialId?: string;
  quantity?: number;
  uomId?: string | null;
};
export type DomainEntitiesRequisitionsRequestCreateRequisitionRequest = {
  code?: string | null;
  requisitionType?: DomainEntitiesRequisitionsRequisitionType;
  productionScheduleProductId?: string | null;
  productionActivityStepId?: string | null;
  rndTrialBatchId?: string | null;
  comments?: string | null;
  expectedDelivery?: string | null;
  items?:
    DomainEntitiesRequisitionsRequestCreateRequisitionItemRequest[] | null;
};
export type DomainEntitiesRequisitionsRequestStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesMaterialsMaterialKind = 0 | 1;
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
export type DomainEntitiesBasePackageStyleDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesMaterialsBatchBatchStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
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
export type DomainEntitiesMaterialsBatchBatchToSupply = {
  batch?: DomainEntitiesMaterialsBatchMaterialBatchListDto;
  quantityToTake?: number;
  warehouseLocationShelfId?: string | null;
};
export type DomainEntitiesMaterialsBatchBatchToSupplyRead = {
  batch?: DomainEntitiesMaterialsBatchMaterialBatchListDtoRead;
  quantityToTake?: number;
  warehouseLocationShelfId?: string | null;
};
export type DomainEntitiesRequisitionsRequisitionItemDto = {
  id?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  quantityReceived?: number;
  status?: DomainEntitiesRequisitionsRequestStatus;
  batches?: DomainEntitiesMaterialsBatchBatchToSupply[] | null;
};
export type DomainEntitiesRequisitionsRequisitionItemDtoRead = {
  id?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  quantityReceived?: number;
  status?: DomainEntitiesRequisitionsRequestStatus;
  batches?: DomainEntitiesMaterialsBatchBatchToSupplyRead[] | null;
};
export type DomainEntitiesProductsEquipmentsEquipmentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  equipmentNumber?: string | null;
  isStorage?: boolean;
  capacityQuantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  relevanceCheck?: boolean;
  department?: SharedCollectionItemDto;
  location?: string | null;
  model?: string | null;
  serialNumber?: string | null;
};
export type DomainEntitiesProductsProductListDto = {
  id?: string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  genericName?: string | null;
  storageCondition?: string | null;
  packageStyle?: string | null;
  filledWeight?: string | null;
  shelfLife?: string | null;
  actionUse?: string | null;
  fdaRegistrationNumber?: string | null;
  masterFormulaNumber?: string | null;
  primaryPackDescription?: string | null;
  secondaryPackDescription?: string | null;
  tertiaryPackDescription?: string | null;
  category?: SharedCollectionItemDto;
  baseQuantity?: number;
  fullBatchSize?: number;
  baseUoM?: DomainEntitiesBaseUnitOfMeasureDto;
  equipment?: DomainEntitiesProductsEquipmentsEquipmentDto;
  department?: SharedCollectionItemDto;
  createdAt?: string;
  price?: number;
  priceUoM?: string | null;
  division?: DomainEntitiesProductsDivision;
  labelClaim?: string | null;
  isVerified?: boolean;
  documentNumber?: string | null;
  revisionNumber?: number;
};
export type DomainEntitiesProductionSchedulesBatchSize = 0 | 1;
export type DomainEntitiesBaseTermsOfPaymentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
  dueDays?: number | null;
};
export type DomainEntitiesCustomersCustomerType = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesCustomersCustomerDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  creditLimit?: number | null;
  termsOfPayment?: DomainEntitiesBaseTermsOfPaymentDto;
  type?: DomainEntitiesCustomersCustomerType;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  billingAddress?: string | null;
  shippingAddress?: string | null;
};
export type DomainEntitiesProductsProductPackingListDto = {
  uom?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  order?: number;
};
export type DomainEntitiesProductsProductPackingDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
  packPerShipper?: number;
  basePackingUoM?: DomainEntitiesBaseUnitOfMeasureDto;
  basePackingQuantity?: number;
  expectedYield?: number;
  isDefault?: boolean;
  packingLists?: DomainEntitiesProductsProductPackingListDto[] | null;
};
export type DomainEntitiesProductionSchedulesProductionScheduleProductDto = {
  id?: string;
  productionSchedule?: SharedCollectionItemDto;
  product?: DomainEntitiesProductsProductListDto;
  quantity?: number;
  batchNumber?: string | null;
  batchSize?: DomainEntitiesProductionSchedulesBatchSize;
  marketType?: DomainEntitiesCustomersCustomerDto;
  cancelled?: boolean;
  reasonForCancellation?: string | null;
  productPacking?: DomainEntitiesProductsProductPackingDto;
  hasStarted?: boolean;
  productionActivityId?: string | null;
};
export type DomainEntitiesRequisitionsRequisitionDto = {
  id?: string;
  code?: string | null;
  requisitionType?: DomainEntitiesRequisitionsRequisitionType;
  status?: DomainEntitiesRequisitionsRequestStatus;
  requestedBy?: SharedCollectionItemDto;
  department?: SharedCollectionItemDto;
  items?: DomainEntitiesRequisitionsRequisitionItemDto[] | null;
  approved?: boolean;
  expectedDelivery?: string | null;
  createdAt?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductDto;
  comments?: string | null;
};
export type DomainEntitiesRequisitionsRequisitionDtoRead = {
  id?: string;
  code?: string | null;
  requisitionType?: DomainEntitiesRequisitionsRequisitionType;
  status?: DomainEntitiesRequisitionsRequestStatus;
  requestedBy?: SharedCollectionItemDto;
  department?: SharedCollectionItemDto;
  items?: DomainEntitiesRequisitionsRequisitionItemDtoRead[] | null;
  approved?: boolean;
  expectedDelivery?: string | null;
  createdAt?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductDto;
  comments?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRequisitionsRequisitionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesRequisitionsRequisitionDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRequisitionsRequisitionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesRequisitionsRequisitionDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesRequisitionsAlternativeBatchDto = {
  batch?: DomainEntitiesMaterialsBatchMaterialBatchListDto;
  quantityAvailable?: number;
  warehouse?: SharedCollectionItemDto;
  warehouseLocationShelfId?: string | null;
};
export type DomainEntitiesRequisitionsAlternativeBatchDtoRead = {
  batch?: DomainEntitiesMaterialsBatchMaterialBatchListDtoRead;
  quantityAvailable?: number;
  warehouse?: SharedCollectionItemDto;
  warehouseLocationShelfId?: string | null;
};
export type DomainEntitiesRequisitionsMaterialAlternativeBatchesDto = {
  material?: DomainEntitiesMaterialsMaterialDto;
  requestedQuantity?: number;
  currentReservedBatches?: DomainEntitiesMaterialsBatchBatchToSupply[] | null;
  alternativeBatches?: DomainEntitiesRequisitionsAlternativeBatchDto[] | null;
};
export type DomainEntitiesRequisitionsMaterialAlternativeBatchesDtoRead = {
  material?: DomainEntitiesMaterialsMaterialDto;
  requestedQuantity?: number;
  currentReservedBatches?:
    DomainEntitiesMaterialsBatchBatchToSupplyRead[] | null;
  alternativeBatches?:
    DomainEntitiesRequisitionsAlternativeBatchDtoRead[] | null;
};
export type DomainEntitiesRequisitionsProcurementSource = 0 | 1;
export type DomainEntitiesRequisitionsRequestCreateSourceRequisitionItemSupplierRequest =
  {
    supplierId?: string;
  };
export type DomainEntitiesRequisitionsRequestCreateSourceRequisitionItemRequest =
  {
    materialId?: string;
    uoMId?: string;
    quantity?: number;
    source?: DomainEntitiesRequisitionsProcurementSource;
    suppliers?:
      | DomainEntitiesRequisitionsRequestCreateSourceRequisitionItemSupplierRequest[]
      | null;
  };
export type DomainEntitiesRequisitionsRequestCreateSourceRequisitionRequest = {
  code?: string | null;
  requisitionId?: string;
  items?:
    | DomainEntitiesRequisitionsRequestCreateSourceRequisitionItemRequest[]
    | null;
};
export type DomainEntitiesRequisitionsSourceRequisitionItemDto = {
  id?: string;
  sourceRequisition?: SharedCollectionItemDto;
  material?: DomainEntitiesMaterialsMaterialDto;
  defaultManufacturer?: DomainEntitiesProcurementManufacturersManufacturerListDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  source?: DomainEntitiesRequisitionsProcurementSource;
  createdAt?: string;
};
export type DomainEntitiesRequisitionsSourceRequisitionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  code?: string | null;
  supplier?: SharedCollectionItemDto;
  items?: DomainEntitiesRequisitionsSourceRequisitionItemDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRequisitionsSourceRequisitionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesRequisitionsSourceRequisitionDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRequisitionsSourceRequisitionItemDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesRequisitionsSourceRequisitionItemDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesRequisitionsSupplierQuotationRequest = {
  supplier?: DomainEntitiesProcurementSuppliersSupplierListDto;
  sentQuotationRequestAt?: string | null;
  items?: DomainEntitiesRequisitionsSourceRequisitionItemDto[] | null;
};
export type DomainEntitiesRequisitionsSupplierQuotationRequestRead = {
  supplier?: DomainEntitiesProcurementSuppliersSupplierListDto;
  sentQuotationRequestAt?: string | null;
  sentQuotationRequest?: boolean;
  items?: DomainEntitiesRequisitionsSourceRequisitionItemDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRequisitionsSupplierQuotationRequest20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesRequisitionsSupplierQuotationRequest[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRequisitionsSupplierQuotationRequest20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesRequisitionsSupplierQuotationRequestRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesRequisitionsSupplierQuotationItemDto = {
  id?: string;
  material?: SharedCollectionItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  defaultManufacturer?: DomainEntitiesProcurementManufacturersManufacturerListDto;
  quantity?: number;
  quotedPrice?: number | null;
  priceUoM?: string | null;
};
export type DomainEntitiesRequisitionsSupplierQuotationDto = {
  id?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplierListDto;
  items?: DomainEntitiesRequisitionsSupplierQuotationItemDto[] | null;
  receivedQuotation?: boolean;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesRequisitionsSupplierQuotationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesRequisitionsSupplierQuotationDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesRequisitionsSupplierQuotationResponseDto = {
  id?: string;
  price: number;
  priceUoM: string;
};
export type DomainEntitiesRequisitionsSupplierQuotationItemStatus = 0 | 1 | 2;
export type DomainEntitiesRequisitionsSupplierPrice = {
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  sourceRequisition?: SharedCollectionItemDto;
  status?: DomainEntitiesRequisitionsSupplierQuotationItemStatus;
  defaultManufacturer?: DomainEntitiesProcurementManufacturersManufacturerListDto;
  price?: number | null;
  priceUoM?: string | null;
};
export type DomainEntitiesRequisitionsSupplierPriceComparison = {
  material?: SharedCollectionItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  supplierQuotation?: DomainEntitiesRequisitionsSupplierPrice[] | null;
};
export type DomainEntitiesPurchaseOrdersRequestCreatePurchaseOrderItemRequest =
  {
    materialId?: string;
    uomId?: string;
    currencyId?: string | null;
    quantity?: number;
    price?: number;
    priceUoM: string;
  };
export type DomainEntitiesRequisitionsProcessQuotation = {
  supplierId?: string;
  sourceRequisitionId?: string;
  items?:
    DomainEntitiesPurchaseOrdersRequestCreatePurchaseOrderItemRequest[] | null;
};
export type DomainEntitiesStockAdjustmentsStockAdjustmentTarget = 0 | 1 | 2;
export type DomainEntitiesStockAdjustmentsStockAdjustmentLineSummaryDto = {
  id?: string;
  name?: string | null;
  codeOrBatch?: string | null;
  physicalCount?: number;
  systemQuantitySnapshot?: number;
  variance?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
};
export type DomainEntitiesStockAdjustmentsStockAdjustmentSummaryDto = {
  id?: string;
  adjustmentNumber?: string | null;
  adjustmentDate?: string;
  linesProcessed?: number;
  totalVariance?: number;
  approved?: boolean;
  targetType?: DomainEntitiesStockAdjustmentsStockAdjustmentTarget;
  lines?: DomainEntitiesStockAdjustmentsStockAdjustmentLineSummaryDto[] | null;
};
export type DomainEntitiesStockAdjustmentsStockAdjustmentReasonCode =
  0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DomainEntitiesStockAdjustmentsCreateStockAdjustmentLineRequest = {
  modelId: string;
  physicalCount: number;
  reasonCode: DomainEntitiesStockAdjustmentsStockAdjustmentReasonCode;
  notes?: string | null;
};
export type DomainEntitiesStockAdjustmentsCreateStockAdjustmentRequest = {
  adjustmentNumber: string;
  adjustmentDate: string;
  targetType: DomainEntitiesStockAdjustmentsStockAdjustmentTarget;
  lines: DomainEntitiesStockAdjustmentsCreateStockAdjustmentLineRequest[];
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesStockAdjustmentsStockAdjustmentSummaryDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesStockAdjustmentsStockAdjustmentSummaryDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesStockAdjustmentsStockAdjustmentLineDetailDto = {
  id?: string;
  itemId?: string | null;
  itemName?: string | null;
  itemCode?: string | null;
  shelfMaterialBatchId?: string | null;
  batchNumber?: string | null;
  materialName?: string | null;
  shelfName?: string | null;
  finishedGoodsTransferNoteId?: string | null;
  transferNoteNumber?: string | null;
  productName?: string | null;
  physicalCount?: number;
  systemQuantitySnapshot?: number;
  variance?: number;
  uom?: DomainEntitiesBaseUnitOfMeasureDto;
  reasonCode?: string | null;
  notes?: string | null;
};
export type DomainEntitiesStockAdjustmentsStockAdjustmentDetailDto = {
  id?: string;
  adjustmentNumber?: string | null;
  adjustmentDate?: string;
  approved?: boolean;
  targetType?: DomainEntitiesStockAdjustmentsStockAdjustmentTarget;
  createdAt?: string;
  lines?: DomainEntitiesStockAdjustmentsStockAdjustmentLineDetailDto[] | null;
};
export type DomainEntitiesWarehousesWarehouseType = 0 | 1 | 2 | 3;
export type DomainEntitiesWarehousesRequestCreateWarehouseLocationShelfRequest =
  {
    code?: string | null;
    name?: string | null;
    description?: string | null;
  };
export type DomainEntitiesWarehousesRequestCreateWarehouseLocationRackRequest =
  {
    name?: string | null;
    description?: string | null;
    shelves?:
      | DomainEntitiesWarehousesRequestCreateWarehouseLocationShelfRequest[]
      | null;
  };
export type DomainEntitiesWarehousesRequestCreateWarehouseLocationRequest = {
  name?: string | null;
  floorName?: string | null;
  description?: string | null;
  racks?:
    DomainEntitiesWarehousesRequestCreateWarehouseLocationRackRequest[] | null;
};
export type DomainEntitiesWarehousesRequestCreateWarehouseRequest = {
  name?: string | null;
  description?: string | null;
  type?: DomainEntitiesWarehousesWarehouseType;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
  locations?:
    DomainEntitiesWarehousesRequestCreateWarehouseLocationRequest[] | null;
};
export type DomainEntitiesWarehousesWarehouseDto = {
  id?: string;
  name?: string | null;
  description?: string | null;
  type?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  locations?: SharedCollectionItemDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesWarehouseDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesWarehousesWarehouseDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesWarehousesWarehouseWithoutLocationDto = {
  id?: string;
  name?: string | null;
  description?: string | null;
  type?: DomainEntitiesWarehousesWarehouseType;
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
export type DomainEntitiesWarehousesWarehouseLocationRackDto = {
  id?: string;
  warehouseLocation?: DomainEntitiesWarehousesWareHouseLocationDto;
  name?: string | null;
  description?: string | null;
  shelves?: DomainEntitiesWarehousesWarehouseLocationShelfDto[] | null;
};
export type DomainEntitiesWarehousesWarehouseLocationRackDtoRead = {
  id?: string;
  warehouseLocation?: DomainEntitiesWarehousesWareHouseLocationDto;
  name?: string | null;
  description?: string | null;
  shelves?: DomainEntitiesWarehousesWarehouseLocationShelfDtoRead[] | null;
};
export type DomainEntitiesWarehousesWarehouseLocationDto = {
  id?: string;
  name?: string | null;
  floorName?: string | null;
  description?: string | null;
  warehouse?: DomainEntitiesWarehousesWarehouseWithoutLocationDto;
  racks?: DomainEntitiesWarehousesWarehouseLocationRackDto[] | null;
};
export type DomainEntitiesWarehousesWarehouseLocationDtoRead = {
  id?: string;
  name?: string | null;
  floorName?: string | null;
  description?: string | null;
  warehouse?: DomainEntitiesWarehousesWarehouseWithoutLocationDto;
  racks?: DomainEntitiesWarehousesWarehouseLocationRackDtoRead[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesWarehouseLocationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesWarehousesWarehouseLocationDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesWarehouseLocationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesWarehousesWarehouseLocationDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesWarehouseLocationRackDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesWarehousesWarehouseLocationRackDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesWarehouseLocationRackDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesWarehousesWarehouseLocationRackDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesWarehousesShelfMaterialBatchSummaryDto = {
  id?: string;
  materialBatchId?: string;
  materialId?: string;
  materialCode?: string | null;
  materialName?: string | null;
  batchNumber?: string | null;
  quantity?: number;
  uoM?: SharedCollectionItemDto;
  expiryDate?: string | null;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
};
export type DomainEntitiesWarehousesWarehouseLocationShelfSummaryDto = {
  id?: string;
  code?: string | null;
  name?: string | null;
  materialBatches?:
    DomainEntitiesWarehousesShelfMaterialBatchSummaryDto[] | null;
};
export type DomainEntitiesWarehousesWarehouseLocationRackSummaryDto = {
  id?: string;
  name?: string | null;
  description?: string | null;
  warehouseLocation?: SharedCollectionItemDto;
  shelves?: DomainEntitiesWarehousesWarehouseLocationShelfSummaryDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesWarehouseLocationShelfDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesWarehousesWarehouseLocationShelfDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesWarehouseLocationShelfDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesWarehousesWarehouseLocationShelfDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
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
export type DomainEntitiesProcurementDistributionMaterialItemDistributionDto = {
  shipmentInvoiceItem?: DomainEntitiesShipmentsShipmentInvoiceItemDto;
  quantity?: number;
};
export type DomainEntitiesWarehousesDistributedRequisitionMaterialStatus =
  0 | 1 | 2 | 3 | 4;
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
export type DomainEntitiesRequisitionsRequisitionItemListDto = {
  id?: string;
  material?: SharedCollectionItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  quantityReceived?: number;
  status?: DomainEntitiesRequisitionsRequestStatus;
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
export type DomainEntitiesProductsProductionBatchManufacturingStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type DomainEntitiesProductsProductionBatchManufacturingRecordDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductDto;
  batchNumber?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  batchQuantity?: number;
  status?: DomainEntitiesProductsProductionBatchManufacturingStatus;
  sampledQuantity?: number;
  issuedDate?: string | null;
};
export type DomainEntitiesBaseOperationDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
  order?: number;
};
export type DomainEntitiesBaseResourceDto = {
  id?: string | null;
  name?: string | null;
  type?: string | null;
  isAvailable?: boolean;
};
export type DomainEntitiesProductsProductionProductionActivityStepResourceDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    resource?: DomainEntitiesBaseResourceDto;
  };
export type DomainEntitiesProductsProductionProductionActivityStepWorkCenterDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    workCenter?: SharedCollectionItemDto;
  };
export type DomainEntitiesQualityRoutinesAnalysisType = 0 | 1;
export type DomainEntitiesAnalyticalTestRequestsTestStage = 0 | 1 | 2;
export type DomainEntitiesFormsFormType = 0 | 1;
export type DomainEntitiesProductsEquipmentsQcEquipmentCategoryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
};
export type DomainEntitiesProductsEquipmentsQcEquipmentQualificationStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesProductsEquipmentsQcEquipmentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  equipmentId?: string | null;
  name?: string | null;
  qcEquipmentCategory?: DomainEntitiesProductsEquipmentsQcEquipmentCategoryDto;
  serialNumber?: string | null;
  make?: string | null;
  model?: string | null;
  calibrationDueDate?: string | null;
  lastCalibratedAt?: string | null;
  calibrationCertificateAttachmentId?: string | null;
  qualificationStatus?: DomainEntitiesProductsEquipmentsQcEquipmentQualificationStatus;
};
export type DomainEntitiesFormsQuestionType =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type DomainEntitiesFormsQuestionValidationType = 0 | 1 | 2 | 3;
export type DomainEntitiesFormsQuestionOptionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  question?: SharedCollectionItemDto;
  name?: string | null;
};
export type DomainEntitiesFormsQuestionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  label?: string | null;
  type?: DomainEntitiesFormsQuestionType;
  validation?: DomainEntitiesFormsQuestionValidationType;
  isMultiSelect?: boolean;
  reference?: string | null;
  description?: string | null;
  options?: DomainEntitiesFormsQuestionOptionDto[] | null;
};
export type DomainEntitiesFormsFormFieldDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  formSection?: SharedCollectionItemDto;
  question?: DomainEntitiesFormsQuestionDto;
  required?: boolean;
  description?: string | null;
  rank?: number;
};
export type DomainEntitiesFormsFormSectionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  form?: SharedCollectionItemDto;
  name?: string | null;
  description?: string | null;
  instrument?: DomainEntitiesProductsEquipmentsQcEquipmentDto;
  order?: number;
  fields?: DomainEntitiesFormsFormFieldDto[] | null;
  value?: string | null;
  groupName?: string | null;
  complies?: boolean;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
};
export type DomainEntitiesFormsFormResponseDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  responseId?: string;
  productionActivityStepId?: string | null;
  formField?: DomainEntitiesFormsFormFieldDto;
  sectionName?: string | null;
  complies?: boolean;
  value?: string | null;
  checkedBy?: DomainEntitiesUsersUserDto;
  checkedAt?: string | null;
  formulaGoverned?: boolean;
  formulaResultFinalized?: boolean;
  formulaExecutionId?: string | null;
  formulaDisplayResultsJson?: string | null;
};
export type DomainEntitiesFormsFormDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  type?: DomainEntitiesFormsFormType;
  sections?: DomainEntitiesFormsFormSectionDto[] | null;
  responses?: DomainEntitiesFormsFormResponseDto[] | null;
};
export type DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
    stpNumber?: string | null;
    product?: SharedCollectionItemDto;
    description?: string | null;
  };
export type DomainEntitiesQualityRoutinesCommercialCoaItemRequest = {
  formFieldId?: string;
  displayLabel?: string | null;
  groupName?: string | null;
  specificationText?: string | null;
  unit?: string | null;
  reference?: string | null;
  displayOrder?: number;
};
export type DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
    analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
    specNumber?: string | null;
    stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
    description?: string | null;
    form?: DomainEntitiesFormsFormDto;
    productStandardTestProcedure?: DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureDto;
    isVerified?: boolean;
    coaItems?: DomainEntitiesQualityRoutinesCommercialCoaItemRequest[] | null;
  };
export type DomainEntitiesRoutesOperationAction = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type DomainEntitiesProductsProductionProductionActivityStepUserDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  user?: DomainEntitiesUsersUserDto;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataDto;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesBaseProductionStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesProductsProductionProductionActivityStepDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  productionActivity?: SharedCollectionItemDto;
  operation?: DomainEntitiesBaseOperationDto;
  workFlow?: SharedCollectionItemDto;
  resources?:
    DomainEntitiesProductsProductionProductionActivityStepResourceDto[] | null;
  workCenters?:
    | DomainEntitiesProductsProductionProductionActivityStepWorkCenterDto[]
    | null;
  responsibleUsers?:
    DomainEntitiesProductsProductionProductionActivityStepUserDto[] | null;
  status?: DomainEntitiesBaseProductionStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  order?: number;
  isCritical?: boolean;
};
export type DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  transferNoteNumber?: string | null;
  fromWarehouse?: DomainEntitiesWarehousesWarehouseDto;
  toWarehouse?: DomainEntitiesWarehousesWarehouseDto;
  quantityPerPack?: number;
  productPacking?: DomainEntitiesProductsProductPackingDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  totalQuantity?: number;
  quantityReceived?: number;
  notes?: string | null;
  qarNumber?: string | null;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecordDto;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStepDto;
  isApproved?: boolean;
  loose?: number;
  allocatedQuantity?: number;
  remainingQuantity?: number;
  pendingAllocatedQuantity?: number;
  approved?: boolean;
  isPartial?: boolean;
  isFulfilled?: boolean;
};
export type DomainEntitiesWarehousesDistributedFinishedProductStatus = 0 | 1;
export type DomainEntitiesWarehousesDistributedFinishedProductDto = {
  id?: string;
  product?: DomainEntitiesProductsProductListDto;
  uom?: DomainEntitiesBaseUnitOfMeasureDto;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecordDto;
  transferNote?: DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteDto;
  quantity?: number;
  arrivedAt?: string | null;
  distributedAt?: string | null;
  status?: DomainEntitiesWarehousesDistributedFinishedProductStatus;
};
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
export type DomainEntitiesWarehousesWarehouseArrivalLocationDto = {
  id?: string;
  warehouse?: DomainEntitiesWarehousesWarehouseDto;
  name?: string | null;
  floorName?: string | null;
  description?: string | null;
  distributedRequisitionMaterials?:
    DomainEntitiesWarehousesDistributedRequisitionMaterialDto[] | null;
  distributedFinishedProducts?:
    DomainEntitiesWarehousesDistributedFinishedProductDto[] | null;
  distributedStockTransferBatches?:
    DomainEntitiesMaterialsBatchMaterialBatchDto[] | null;
};
export type DomainEntitiesWarehousesWarehouseArrivalLocationDtoRead = {
  id?: string;
  warehouse?: DomainEntitiesWarehousesWarehouseDto;
  name?: string | null;
  floorName?: string | null;
  description?: string | null;
  distributedRequisitionMaterials?:
    DomainEntitiesWarehousesDistributedRequisitionMaterialDtoRead[] | null;
  distributedFinishedProducts?:
    DomainEntitiesWarehousesDistributedFinishedProductDto[] | null;
  distributedStockTransferBatches?:
    DomainEntitiesMaterialsBatchMaterialBatchDtoRead[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesDistributedRequisitionMaterialDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesWarehousesDistributedRequisitionMaterialDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesDistributedRequisitionMaterialDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?:
      DomainEntitiesWarehousesDistributedRequisitionMaterialDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesDistributedFinishedProductDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesWarehousesDistributedFinishedProductDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
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
export type DomainEntitiesChecklistsChecklistDto = {
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
  materialBatches?: DomainEntitiesMaterialsBatchMaterialBatchDto[] | null;
};
export type DomainEntitiesChecklistsChecklistDtoRead = {
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
  materialBatches?: DomainEntitiesMaterialsBatchMaterialBatchDtoRead[] | null;
};
export type DomainEntitiesWarehousesDistributedRequisitionMaterialListDto = {
  id?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  quantity?: number;
  arrivedAt?: string | null;
  checkedAt?: string | null;
  distributedAt?: string | null;
  grnGeneratedAt?: string | null;
  status?: DomainEntitiesWarehousesDistributedRequisitionMaterialStatus;
  department?: DomainEntitiesDepartmentsDepartmentListDto;
  distributedRequisitionItems?:
    DomainEntitiesWarehousesDistributedRequisitionItemDto[] | null;
};
export type DomainEntitiesWarehousesDistributedRequisitionMaterialListDtoRead =
  {
    id?: string;
    material?: DomainEntitiesMaterialsMaterialDto;
    quantity?: number;
    arrivedAt?: string | null;
    checkedAt?: string | null;
    distributedAt?: string | null;
    grnGeneratedAt?: string | null;
    status?: DomainEntitiesWarehousesDistributedRequisitionMaterialStatus;
    department?: DomainEntitiesDepartmentsDepartmentListDto;
    distributedRequisitionItems?:
      DomainEntitiesWarehousesDistributedRequisitionItemDtoRead[] | null;
  };
export type DomainEntitiesChecklistsCheckListDto = {
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterialListDto;
  material?: DomainEntitiesMaterialsMaterialDto;
  checkedAt?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturerListDto;
  certificateOfAnalysisDelivered?: boolean;
  visibleLabelling?: boolean;
  intactnessStatus?: DomainEntitiesChecklistsIntactness;
  consignmentCarrierStatus?: DomainEntitiesChecklistsConsignmentCarrier;
};
export type DomainEntitiesChecklistsCheckListDtoRead = {
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterialListDtoRead;
  material?: DomainEntitiesMaterialsMaterialDto;
  checkedAt?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturerListDto;
  certificateOfAnalysisDelivered?: boolean;
  visibleLabelling?: boolean;
  intactnessStatus?: DomainEntitiesChecklistsIntactness;
  consignmentCarrierStatus?: DomainEntitiesChecklistsConsignmentCarrier;
};
export type DomainEntitiesGrnsGrnDto = {
  id?: string;
  createdAt?: string;
  carrierName?: string | null;
  vehicleNumber?: string | null;
  remarks?: string | null;
  grnNumber?: string | null;
  checkLists?: DomainEntitiesChecklistsCheckListDto[] | null;
  materialBatches?: DomainEntitiesMaterialsBatchMaterialBatchListDto[] | null;
  declarationNumber?: string | null;
};
export type DomainEntitiesGrnsGrnDtoRead = {
  id?: string;
  createdAt?: string;
  carrierName?: string | null;
  vehicleNumber?: string | null;
  remarks?: string | null;
  grnNumber?: string | null;
  checkLists?: DomainEntitiesChecklistsCheckListDtoRead[] | null;
  materialBatches?:
    DomainEntitiesMaterialsBatchMaterialBatchListDtoRead[] | null;
  declarationNumber?: string | null;
};
export type DomainEntitiesGrnsStatus = 0 | 1 | 2;
export type DomainEntitiesGrnsGrnListDto = {
  id?: string;
  createdAt?: string;
  carrierName?: string | null;
  vehicleNumber?: string | null;
  remarks?: string | null;
  grnNumber?: string | null;
  materialBatches?:
    DomainEntitiesMaterialsBatchMaterialBatchReducedDto[] | null;
  status?: DomainEntitiesGrnsStatus;
  declarationNumber?: string | null;
};
export type DomainEntitiesGrnsGrnListDtoRead = {
  id?: string;
  createdAt?: string;
  carrierName?: string | null;
  vehicleNumber?: string | null;
  remarks?: string | null;
  grnNumber?: string | null;
  materialBatches?:
    DomainEntitiesMaterialsBatchMaterialBatchReducedDtoRead[] | null;
  status?: DomainEntitiesGrnsStatus;
  declarationNumber?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesGrnsGrnListDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesGrnsGrnListDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesGrnsGrnListDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesGrnsGrnListDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesBinCardsBinCardInformationDto = {
  id?: string;
  createdAt?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchListDto;
  description?: string | null;
  wayBill?: string | null;
  arNumber?: string | null;
  supplier?: string | null;
  manufacturer?: string | null;
  quantityReceived?: number;
  quantityIssued?: number;
  balanceQuantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  product?: DomainEntitiesProductsProductListDto;
  warehouseName?: string | null;
  requisitionId?: string | null;
  requisitionCode?: string | null;
  productBatchNumber?: string | null;
};
export type DomainEntitiesBinCardsBinCardInformationDtoRead = {
  id?: string;
  createdAt?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchListDtoRead;
  description?: string | null;
  wayBill?: string | null;
  arNumber?: string | null;
  supplier?: string | null;
  manufacturer?: string | null;
  quantityReceived?: number;
  quantityIssued?: number;
  balanceQuantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  product?: DomainEntitiesProductsProductListDto;
  warehouseName?: string | null;
  requisitionId?: string | null;
  requisitionCode?: string | null;
  productBatchNumber?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesBinCardsBinCardInformationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesBinCardsBinCardInformationDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesBinCardsBinCardInformationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesBinCardsBinCardInformationDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesBinCardsProductBinCardInformationDto = {
  id?: string;
  createdAt?: string;
  batch?: DomainEntitiesProductsProductionBatchManufacturingRecordDto;
  description?: string | null;
  wayBill?: string | null;
  arNumber?: string | null;
  supplier?: string | null;
  manufacturer?: string | null;
  quantityReceived?: number;
  quantityIssued?: number;
  balanceQuantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesBinCardsProductBinCardInformationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesBinCardsProductBinCardInformationDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesWarehousesCreateSwapShelfMaterialBatch = {
  shelfMaterialBatchId?: string;
  materialBatchId?: string;
  uoMId?: string;
  quantity?: number;
};
export type DomainEntitiesWarehousesCreateSwapRequest = {
  firstWarehouseId?: string;
  secondWarehouseId?: string;
  firstSwapShelfMaterialBatches?:
    DomainEntitiesWarehousesCreateSwapShelfMaterialBatch[] | null;
  secondSwapShelfMaterialBatches?:
    DomainEntitiesWarehousesCreateSwapShelfMaterialBatch[] | null;
  stockRequisitionId?: string | null;
};
export type DomainEntitiesWarehousesCreateSwapRequestRead = {
  firstWarehouseId?: string;
  secondWarehouseId?: string;
  firstSwapShelfMaterialBatches?:
    DomainEntitiesWarehousesCreateSwapShelfMaterialBatch[] | null;
  secondSwapShelfMaterialBatches?:
    DomainEntitiesWarehousesCreateSwapShelfMaterialBatch[] | null;
  quantityIsValid?: boolean;
  stockRequisitionId?: string | null;
};
export type DomainEntitiesWarehousesSwapShelfMaterialBatchDto = {
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchReducedDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
};
export type DomainEntitiesWarehousesSwapShelfMaterialBatchDtoRead = {
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchReducedDtoRead;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
};
export type DomainEntitiesWarehousesSwapRequestStatus = 0 | 1 | 2;
export type DomainEntitiesWarehousesSwapRequestDto = {
  id?: string;
  firstWarehouse?: DomainEntitiesWarehousesWarehouseWithoutLocationDto;
  secondWarehouse?: DomainEntitiesWarehousesWarehouseWithoutLocationDto;
  firstSwapShelfMaterialBatches?:
    DomainEntitiesWarehousesSwapShelfMaterialBatchDto[] | null;
  secondSwapShelfMaterialBatches?:
    DomainEntitiesWarehousesSwapShelfMaterialBatchDto[] | null;
  status?: DomainEntitiesWarehousesSwapRequestStatus;
  actionedBy?: DomainEntitiesUsersUserDto;
  actionedAt?: string | null;
};
export type DomainEntitiesWarehousesSwapRequestDtoRead = {
  id?: string;
  firstWarehouse?: DomainEntitiesWarehousesWarehouseWithoutLocationDto;
  secondWarehouse?: DomainEntitiesWarehousesWarehouseWithoutLocationDto;
  firstSwapShelfMaterialBatches?:
    DomainEntitiesWarehousesSwapShelfMaterialBatchDtoRead[] | null;
  secondSwapShelfMaterialBatches?:
    DomainEntitiesWarehousesSwapShelfMaterialBatchDtoRead[] | null;
  status?: DomainEntitiesWarehousesSwapRequestStatus;
  actionedBy?: DomainEntitiesUsersUserDto;
  actionedAt?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesSwapRequestDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesWarehousesSwapRequestDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesSwapRequestDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesWarehousesSwapRequestDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesWarehousesRequestSwapRequestDirection = 0 | 1;
export type SharedSortDirection = 0 | 1 | 2;
export const {
  usePostApiV1DamagedGoodsMutation,
  useGetApiV1DamagedGoodsQuery,
  useLazyGetApiV1DamagedGoodsQuery,
  useGetApiV1DamagedGoodsByIdQuery,
  useLazyGetApiV1DamagedGoodsByIdQuery,
  usePutApiV1DamagedGoodsByIdMutation,
  useDeleteApiV1DamagedGoodsByIdMutation,
  usePostApiV1RequisitionMutation,
  useGetApiV1RequisitionQuery,
  useLazyGetApiV1RequisitionQuery,
  useGetApiV1RequisitionDepartmentQuery,
  useLazyGetApiV1RequisitionDepartmentQuery,
  useGetApiV1RequisitionByRequisitionIdQuery,
  useLazyGetApiV1RequisitionByRequisitionIdQuery,
  useGetApiV1RequisitionByRequisitionIdAlternativeBatchesQuery,
  useLazyGetApiV1RequisitionByRequisitionIdAlternativeBatchesQuery,
  usePostApiV1RequisitionIssueStockRequisitionByStockRequisitionIdMutation,
  usePostApiV1RequisitionIssueTrialRequisitionByRequisitionIdMutation,
  usePostApiV1RequisitionSourceMutation,
  useGetApiV1RequisitionSourceQuery,
  useLazyGetApiV1RequisitionSourceQuery,
  useGetApiV1RequisitionSourceBySourceRequisitionIdQuery,
  useLazyGetApiV1RequisitionSourceBySourceRequisitionIdQuery,
  usePutApiV1RequisitionSourceBySourceRequisitionIdMutation,
  useDeleteApiV1RequisitionSourceBySourceRequisitionIdMutation,
  useGetApiV1RequisitionSourceItemsQuery,
  useLazyGetApiV1RequisitionSourceItemsQuery,
  useGetApiV1RequisitionSourceSupplierQuery,
  useLazyGetApiV1RequisitionSourceSupplierQuery,
  useGetApiV1RequisitionSourceSupplierBySupplierIdQuery,
  useLazyGetApiV1RequisitionSourceSupplierBySupplierIdQuery,
  useGetApiV1RequisitionPendingBySupplierIdQuery,
  useLazyGetApiV1RequisitionPendingBySupplierIdQuery,
  usePostApiV1RequisitionSourceSupplierBySupplierIdSendQuotationMutation,
  useGetApiV1RequisitionSourceSupplierQuotationQuery,
  useLazyGetApiV1RequisitionSourceSupplierQuotationQuery,
  useGetApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationQuery,
  useLazyGetApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationQuery,
  usePostApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationReceiveMutation,
  useGetApiV1RequisitionSourceMaterialPriceComparisonQuery,
  useLazyGetApiV1RequisitionSourceMaterialPriceComparisonQuery,
  useGetApiV1RequisitionSourceMaterialPriceComparisonByMaterialQuery,
  useLazyGetApiV1RequisitionSourceMaterialPriceComparisonByMaterialQuery,
  usePostApiV1RequisitionSourceQuotationProcessPurchaseOrderMutation,
  usePostApiV1StockAdjustmentMutation,
  useGetApiV1StockAdjustmentQuery,
  useLazyGetApiV1StockAdjustmentQuery,
  useGetApiV1StockAdjustmentByIdQuery,
  useLazyGetApiV1StockAdjustmentByIdQuery,
  usePostApiV1WarehouseMutation,
  useGetApiV1WarehouseQuery,
  useLazyGetApiV1WarehouseQuery,
  useGetApiV1WarehouseByWarehouseIdQuery,
  useLazyGetApiV1WarehouseByWarehouseIdQuery,
  usePutApiV1WarehouseByWarehouseIdMutation,
  useDeleteApiV1WarehouseByWarehouseIdMutation,
  useGetApiV1WarehouseDepartmentByDepartmentIdQuery,
  useLazyGetApiV1WarehouseDepartmentByDepartmentIdQuery,
  usePostApiV1WarehouseByWarehouseIdLocationMutation,
  useGetApiV1WarehouseLocationByLocationIdQuery,
  useLazyGetApiV1WarehouseLocationByLocationIdQuery,
  usePutApiV1WarehouseLocationByLocationIdMutation,
  useDeleteApiV1WarehouseLocationByLocationIdMutation,
  useGetApiV1WarehouseLocationQuery,
  useLazyGetApiV1WarehouseLocationQuery,
  usePostApiV1WarehouseByLocationIdRackMutation,
  useGetApiV1WarehouseRackByRackIdQuery,
  useLazyGetApiV1WarehouseRackByRackIdQuery,
  usePutApiV1WarehouseRackByRackIdMutation,
  useDeleteApiV1WarehouseRackByRackIdMutation,
  useGetApiV1WarehouseRackQuery,
  useLazyGetApiV1WarehouseRackQuery,
  useGetApiV1WarehouseRackByDepartmentQuery,
  useLazyGetApiV1WarehouseRackByDepartmentQuery,
  useGetApiV1WarehouseRackByDepartmentSummaryQuery,
  useLazyGetApiV1WarehouseRackByDepartmentSummaryQuery,
  usePostApiV1WarehouseByRackIdShelfMutation,
  useGetApiV1WarehouseShelfByShelfIdQuery,
  useLazyGetApiV1WarehouseShelfByShelfIdQuery,
  usePutApiV1WarehouseShelfByShelfIdMutation,
  useDeleteApiV1WarehouseShelfByShelfIdMutation,
  useGetApiV1WarehouseShelfQuery,
  useLazyGetApiV1WarehouseShelfQuery,
  useGetApiV1WarehouseShelfByDepartmentQuery,
  useLazyGetApiV1WarehouseShelfByDepartmentQuery,
  useGetApiV1WarehouseByWarehouseIdShelvesByMaterialAndMaterialIdQuery,
  useLazyGetApiV1WarehouseByWarehouseIdShelvesByMaterialAndMaterialIdQuery,
  useGetApiV1WarehouseByWarehouseIdShelvesByMaterialbatchAndMaterialBatchIdQuery,
  useLazyGetApiV1WarehouseByWarehouseIdShelvesByMaterialbatchAndMaterialBatchIdQuery,
  useGetApiV1WarehouseRackByRackIdShelvesQuery,
  useLazyGetApiV1WarehouseRackByRackIdShelvesQuery,
  useGetApiV1WarehouseByWarehouseIdShelvesQuery,
  useLazyGetApiV1WarehouseByWarehouseIdShelvesQuery,
  useGetApiV1WarehouseByWarehouseIdArrivalLocationQuery,
  useLazyGetApiV1WarehouseByWarehouseIdArrivalLocationQuery,
  useGetApiV1WarehouseDistributedRequisitionMaterialsQuery,
  useLazyGetApiV1WarehouseDistributedRequisitionMaterialsQuery,
  useGetApiV1WarehouseFinishedGoodsDetailsQuery,
  useLazyGetApiV1WarehouseFinishedGoodsDetailsQuery,
  useGetApiV1WarehouseStockTransferDetailsQuery,
  useLazyGetApiV1WarehouseStockTransferDetailsQuery,
  useGetApiV1WarehouseDistributedMaterialByIdQuery,
  useLazyGetApiV1WarehouseDistributedMaterialByIdQuery,
  useGetApiV1WarehouseChecklistByIdQuery,
  useLazyGetApiV1WarehouseChecklistByIdQuery,
  useGetApiV1WarehouseDistributedMaterialByDistributedMaterialIdMaterialBatchQuery,
  useLazyGetApiV1WarehouseDistributedMaterialByDistributedMaterialIdMaterialBatchQuery,
  usePostApiV1WarehouseDistributedMaterialMaterialBatchMutation,
  useGetApiV1WarehouseDistributedMaterialByDistributedMaterialIdChecklistQuery,
  useLazyGetApiV1WarehouseDistributedMaterialByDistributedMaterialIdChecklistQuery,
  useGetApiV1WarehouseGrnByIdQuery,
  useLazyGetApiV1WarehouseGrnByIdQuery,
  useGetApiV1WarehouseGrnsQuery,
  useLazyGetApiV1WarehouseGrnsQuery,
  useGetApiV1WarehouseGrnsQcQuery,
  useLazyGetApiV1WarehouseGrnsQcQuery,
  useGetApiV1WarehouseBincardinformationByMaterialIdAndDepartmentIdQuery,
  useLazyGetApiV1WarehouseBincardinformationByMaterialIdAndDepartmentIdQuery,
  useGetApiV1WarehouseBincardinformationByProductIdProductQuery,
  useLazyGetApiV1WarehouseBincardinformationByProductIdProductQuery,
  usePostApiV1WarehouseSwapMutation,
  useGetApiV1WarehouseSwapQuery,
  useLazyGetApiV1WarehouseSwapQuery,
  useGetApiV1WarehouseSwapByIdQuery,
  useLazyGetApiV1WarehouseSwapByIdQuery,
  usePutApiV1WarehouseSwapByIdApproveMutation,
} = injectedRtkApi;
