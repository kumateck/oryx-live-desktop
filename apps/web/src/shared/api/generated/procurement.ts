import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiV1ProcurementManufacturer: build.mutation<
      PostApiV1ProcurementManufacturerApiResponse,
      PostApiV1ProcurementManufacturerApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/manufacturer", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/manufacturer`,
        method: "POST",
        body: queryArg.domainEntitiesProcurementManufacturersCreateManufacturerRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementManufacturer: build.query<
      GetApiV1ProcurementManufacturerApiResponse,
      GetApiV1ProcurementManufacturerApiArg
    >({
      providesTags: [{ type: "procurement/manufacturer", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/manufacturer`,
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
    getApiV1ProcurementManufacturerByManufacturerId: build.query<
      GetApiV1ProcurementManufacturerByManufacturerIdApiResponse,
      GetApiV1ProcurementManufacturerByManufacturerIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/manufacturer", id: queryArg.manufacturerId }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/manufacturer/${queryArg.manufacturerId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProcurementManufacturerByManufacturerId: build.mutation<
      PutApiV1ProcurementManufacturerByManufacturerIdApiResponse,
      PutApiV1ProcurementManufacturerByManufacturerIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/manufacturer", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/manufacturer", id: queryArg.manufacturerId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/manufacturer/${queryArg.manufacturerId}`,
        method: "PUT",
        body: queryArg.domainEntitiesProcurementManufacturersCreateManufacturerRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProcurementManufacturerByManufacturerId: build.mutation<
      DeleteApiV1ProcurementManufacturerByManufacturerIdApiResponse,
      DeleteApiV1ProcurementManufacturerByManufacturerIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/manufacturer", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/manufacturer", id: queryArg.manufacturerId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/manufacturer/${queryArg.manufacturerId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementManufacturerMaterialByMaterialId: build.query<
      GetApiV1ProcurementManufacturerMaterialByMaterialIdApiResponse,
      GetApiV1ProcurementManufacturerMaterialByMaterialIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/manufacturer", id: queryArg.materialId }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/manufacturer/material/${queryArg.materialId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementSupplier: build.mutation<
      PostApiV1ProcurementSupplierApiResponse,
      PostApiV1ProcurementSupplierApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/supplier", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/supplier`,
        method: "POST",
        body: queryArg.domainEntitiesProcurementSuppliersCreateSupplierRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementSupplier: build.query<
      GetApiV1ProcurementSupplierApiResponse,
      GetApiV1ProcurementSupplierApiArg
    >({
      providesTags: [{ type: "procurement/supplier", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/supplier`,
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
    getApiV1ProcurementSupplierBySupplierId: build.query<
      GetApiV1ProcurementSupplierBySupplierIdApiResponse,
      GetApiV1ProcurementSupplierBySupplierIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/supplier", id: queryArg.supplierId }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/supplier/${queryArg.supplierId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProcurementSupplierBySupplierId: build.mutation<
      PutApiV1ProcurementSupplierBySupplierIdApiResponse,
      PutApiV1ProcurementSupplierBySupplierIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/supplier", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/supplier", id: queryArg.supplierId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/supplier/${queryArg.supplierId}`,
        method: "PUT",
        body: queryArg.domainEntitiesProcurementSuppliersCreateSupplierRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProcurementSupplierBySupplierId: build.mutation<
      DeleteApiV1ProcurementSupplierBySupplierIdApiResponse,
      DeleteApiV1ProcurementSupplierBySupplierIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/supplier", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/supplier", id: queryArg.supplierId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/supplier/${queryArg.supplierId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProcurementSupplierBySupplierIdStatus: build.mutation<
      PutApiV1ProcurementSupplierBySupplierIdStatusApiResponse,
      PutApiV1ProcurementSupplierBySupplierIdStatusApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/supplier", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/supplier", id: queryArg.supplierId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/supplier/${queryArg.supplierId}/status`,
        method: "PUT",
        body: queryArg.domainEntitiesProcurementSuppliersUpdateSupplierStatusRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementSupplierMaterialByMaterialId: build.query<
      GetApiV1ProcurementSupplierMaterialByMaterialIdApiResponse,
      GetApiV1ProcurementSupplierMaterialByMaterialIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/supplier", id: queryArg.materialId }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/supplier/material/${queryArg.materialId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementSupplierByMaterialIdAndType: build.query<
      GetApiV1ProcurementSupplierByMaterialIdAndTypeApiResponse,
      GetApiV1ProcurementSupplierByMaterialIdAndTypeApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/supplier", id: queryArg.materialId }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/supplier/${queryArg.materialId}/${queryArg["type"]}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementPurchaseOrder: build.mutation<
      PostApiV1ProcurementPurchaseOrderApiResponse,
      PostApiV1ProcurementPurchaseOrderApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/purchase-order", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/purchase-order`,
        method: "POST",
        body: queryArg.domainEntitiesPurchaseOrdersRequestCreatePurchaseOrderRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementPurchaseOrder: build.query<
      GetApiV1ProcurementPurchaseOrderApiResponse,
      GetApiV1ProcurementPurchaseOrderApiArg
    >({
      providesTags: [{ type: "procurement/purchase-order", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/purchase-order`,
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
    getApiV1ProcurementPurchaseOrderByPurchaseOrderId: build.query<
      GetApiV1ProcurementPurchaseOrderByPurchaseOrderIdApiResponse,
      GetApiV1ProcurementPurchaseOrderByPurchaseOrderIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/purchase-order", id: queryArg.purchaseOrderId }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/purchase-order/${queryArg.purchaseOrderId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementPurchaseOrderByPurchaseOrderId: build.mutation<
      PostApiV1ProcurementPurchaseOrderByPurchaseOrderIdApiResponse,
      PostApiV1ProcurementPurchaseOrderByPurchaseOrderIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/purchase-order", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/purchase-order", id: queryArg.purchaseOrderId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/purchase-order/${queryArg.purchaseOrderId}`,
        method: "POST",
        body: queryArg.domainEntitiesPurchaseOrdersRequestSendPurchaseOrderRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProcurementPurchaseOrderByPurchaseOrderId: build.mutation<
      PutApiV1ProcurementPurchaseOrderByPurchaseOrderIdApiResponse,
      PutApiV1ProcurementPurchaseOrderByPurchaseOrderIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/purchase-order", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/purchase-order", id: queryArg.purchaseOrderId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/purchase-order/${queryArg.purchaseOrderId}`,
        method: "PUT",
        body: queryArg.domainEntitiesPurchaseOrdersRequestUpdatePurchaseOrderRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProcurementPurchaseOrderByPurchaseOrderId: build.mutation<
      DeleteApiV1ProcurementPurchaseOrderByPurchaseOrderIdApiResponse,
      DeleteApiV1ProcurementPurchaseOrderByPurchaseOrderIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/purchase-order", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/purchase-order", id: queryArg.purchaseOrderId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/purchase-order/${queryArg.purchaseOrderId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementPurchaseOrderRequisitionByPurchaseOrderIdAndMaterialId:
      build.query<
        GetApiV1ProcurementPurchaseOrderRequisitionByPurchaseOrderIdAndMaterialIdApiResponse,
        GetApiV1ProcurementPurchaseOrderRequisitionByPurchaseOrderIdAndMaterialIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/procurement/purchase-order/requisition/${queryArg.purchaseOrderId}/${queryArg.materialId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postApiV1ProcurementPurchaseOrderProformaInvoiceByPurchaseOrderId:
      build.mutation<
        PostApiV1ProcurementPurchaseOrderProformaInvoiceByPurchaseOrderIdApiResponse,
        PostApiV1ProcurementPurchaseOrderProformaInvoiceByPurchaseOrderIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/procurement/purchase-order/proforma-invoice/${queryArg.purchaseOrderId}`,
          method: "POST",
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    putApiV1ProcurementPurchaseOrderFirstStepByPurchaseOrderId: build.mutation<
      PutApiV1ProcurementPurchaseOrderFirstStepByPurchaseOrderIdApiResponse,
      PutApiV1ProcurementPurchaseOrderFirstStepByPurchaseOrderIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/purchase-order", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/purchase-order", id: queryArg.purchaseOrderId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/purchase-order/first-step/${queryArg.purchaseOrderId}`,
        method: "PUT",
        body: queryArg.domainEntitiesPurchaseOrdersRequestUpdatePurchaseOrderFirstStep,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProcurementPurchaseOrderByPurchaseOrderIdCancel: build.mutation<
      DeleteApiV1ProcurementPurchaseOrderByPurchaseOrderIdCancelApiResponse,
      DeleteApiV1ProcurementPurchaseOrderByPurchaseOrderIdCancelApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/purchase-order", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/purchase-order", id: queryArg.purchaseOrderId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/purchase-order/${queryArg.purchaseOrderId}/cancel`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProcurementPurchaseOrderByPurchaseOrderIdRevise: build.mutation<
      PutApiV1ProcurementPurchaseOrderByPurchaseOrderIdReviseApiResponse,
      PutApiV1ProcurementPurchaseOrderByPurchaseOrderIdReviseApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/purchase-order", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/purchase-order", id: queryArg.purchaseOrderId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/purchase-order/${queryArg.purchaseOrderId}/revise`,
        method: "PUT",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProcurementPurchaseOrderCheckByPurchaseOrderId: build.mutation<
      PutApiV1ProcurementPurchaseOrderCheckByPurchaseOrderIdApiResponse,
      PutApiV1ProcurementPurchaseOrderCheckByPurchaseOrderIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/purchase-order", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/purchase-order", id: queryArg.purchaseOrderId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/purchase-order/check/${queryArg.purchaseOrderId}`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementPurchaseOrderInvoice: build.mutation<
      PostApiV1ProcurementPurchaseOrderInvoiceApiResponse,
      PostApiV1ProcurementPurchaseOrderInvoiceApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/purchase-order-invoice", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/purchase-order-invoice`,
        method: "POST",
        body: queryArg.domainEntitiesPurchaseOrdersRequestCreatePurchaseOrderInvoiceRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementPurchaseOrderInvoice: build.query<
      GetApiV1ProcurementPurchaseOrderInvoiceApiResponse,
      GetApiV1ProcurementPurchaseOrderInvoiceApiArg
    >({
      providesTags: [{ type: "procurement/purchase-order-invoice", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/purchase-order-invoice`,
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
    getApiV1ProcurementPurchaseOrderInvoiceByInvoiceId: build.query<
      GetApiV1ProcurementPurchaseOrderInvoiceByInvoiceIdApiResponse,
      GetApiV1ProcurementPurchaseOrderInvoiceByInvoiceIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/purchase-order-invoice", id: queryArg.invoiceId }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/purchase-order-invoice/${queryArg.invoiceId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProcurementPurchaseOrderInvoiceByInvoiceId: build.mutation<
      PutApiV1ProcurementPurchaseOrderInvoiceByInvoiceIdApiResponse,
      PutApiV1ProcurementPurchaseOrderInvoiceByInvoiceIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/purchase-order-invoice", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/purchase-order-invoice", id: queryArg.invoiceId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/purchase-order-invoice/${queryArg.invoiceId}`,
        method: "PUT",
        body: queryArg.domainEntitiesPurchaseOrdersRequestCreatePurchaseOrderInvoiceRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProcurementPurchaseOrderInvoiceByInvoiceId: build.mutation<
      DeleteApiV1ProcurementPurchaseOrderInvoiceByInvoiceIdApiResponse,
      DeleteApiV1ProcurementPurchaseOrderInvoiceByInvoiceIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/purchase-order-invoice", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/purchase-order-invoice", id: queryArg.invoiceId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/purchase-order-invoice/${queryArg.invoiceId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementBillingSheet: build.mutation<
      PostApiV1ProcurementBillingSheetApiResponse,
      PostApiV1ProcurementBillingSheetApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/billing-sheet", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/billing-sheet`,
        method: "POST",
        body: queryArg.domainEntitiesPurchaseOrdersRequestCreateBillingSheetRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementBillingSheet: build.query<
      GetApiV1ProcurementBillingSheetApiResponse,
      GetApiV1ProcurementBillingSheetApiArg
    >({
      providesTags: [{ type: "procurement/billing-sheet", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/billing-sheet`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
        },
      }),
    }),
    getApiV1ProcurementBillingSheetByBillingSheetId: build.query<
      GetApiV1ProcurementBillingSheetByBillingSheetIdApiResponse,
      GetApiV1ProcurementBillingSheetByBillingSheetIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/billing-sheet", id: queryArg.billingSheetId }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/billing-sheet/${queryArg.billingSheetId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProcurementBillingSheetByBillingSheetId: build.mutation<
      PutApiV1ProcurementBillingSheetByBillingSheetIdApiResponse,
      PutApiV1ProcurementBillingSheetByBillingSheetIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/billing-sheet", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/billing-sheet", id: queryArg.billingSheetId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/billing-sheet/${queryArg.billingSheetId}`,
        method: "PUT",
        body: queryArg.domainEntitiesPurchaseOrdersRequestUpdateBillingSheetRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProcurementBillingSheetByBillingSheetId: build.mutation<
      DeleteApiV1ProcurementBillingSheetByBillingSheetIdApiResponse,
      DeleteApiV1ProcurementBillingSheetByBillingSheetIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/billing-sheet", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/billing-sheet", id: queryArg.billingSheetId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/billing-sheet/${queryArg.billingSheetId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementBillingSheetInvoiceByInvoiceId: build.query<
      GetApiV1ProcurementBillingSheetInvoiceByInvoiceIdApiResponse,
      GetApiV1ProcurementBillingSheetInvoiceByInvoiceIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/billing-sheet", id: queryArg.invoiceId }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/billing-sheet/invoice/${queryArg.invoiceId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProcurementBillingSheetCharge: build.mutation<
      PutApiV1ProcurementBillingSheetChargeApiResponse,
      PutApiV1ProcurementBillingSheetChargeApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/billing-sheet", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/billing-sheet/charge`,
        method: "PUT",
        body: queryArg.domainEntitiesPurchaseOrdersRequestMarkBillingSheetChargePaymentsRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementBillingSheetChargeByBillingSheetId: build.mutation<
      PostApiV1ProcurementBillingSheetChargeByBillingSheetIdApiResponse,
      PostApiV1ProcurementBillingSheetChargeByBillingSheetIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/billing-sheet", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/billing-sheet", id: queryArg.billingSheetId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/billing-sheet/charge/${queryArg.billingSheetId}`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementShipmentDocument: build.mutation<
      PostApiV1ProcurementShipmentDocumentApiResponse,
      PostApiV1ProcurementShipmentDocumentApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/shipment-document", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-document`,
        method: "POST",
        body: queryArg.domainEntitiesShipmentsRequestCreateShipmentDocumentRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementShipmentDocument: build.query<
      GetApiV1ProcurementShipmentDocumentApiResponse,
      GetApiV1ProcurementShipmentDocumentApiArg
    >({
      providesTags: [{ type: "procurement/shipment-document", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-document`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          onlyApproved: queryArg.onlyApproved,
        },
      }),
    }),
    getApiV1ProcurementShipmentDocumentByShipmentDocumentId: build.query<
      GetApiV1ProcurementShipmentDocumentByShipmentDocumentIdApiResponse,
      GetApiV1ProcurementShipmentDocumentByShipmentDocumentIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/shipment-document", id: queryArg.shipmentDocumentId }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-document/${queryArg.shipmentDocumentId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProcurementShipmentDocumentByShipmentDocumentId: build.mutation<
      PutApiV1ProcurementShipmentDocumentByShipmentDocumentIdApiResponse,
      PutApiV1ProcurementShipmentDocumentByShipmentDocumentIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/shipment-document", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/shipment-document", id: queryArg.shipmentDocumentId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-document/${queryArg.shipmentDocumentId}`,
        method: "PUT",
        body: queryArg.domainEntitiesShipmentsRequestCreateShipmentDocumentRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProcurementShipmentDocumentByShipmentDocumentId: build.mutation<
      DeleteApiV1ProcurementShipmentDocumentByShipmentDocumentIdApiResponse,
      DeleteApiV1ProcurementShipmentDocumentByShipmentDocumentIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/shipment-document", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/shipment-document", id: queryArg.shipmentDocumentId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-document/${queryArg.shipmentDocumentId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementWaybill: build.mutation<
      PostApiV1ProcurementWaybillApiResponse,
      PostApiV1ProcurementWaybillApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/waybill", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/waybill`,
        method: "POST",
        body: queryArg.domainEntitiesShipmentsRequestCreateShipmentDocumentRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementWaybill: build.query<
      GetApiV1ProcurementWaybillApiResponse,
      GetApiV1ProcurementWaybillApiArg
    >({
      providesTags: [{ type: "procurement/waybill", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/waybill`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
        },
      }),
    }),
    getApiV1ProcurementWaybillByWaybillId: build.query<
      GetApiV1ProcurementWaybillByWaybillIdApiResponse,
      GetApiV1ProcurementWaybillByWaybillIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/waybill", id: queryArg.waybillId }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/waybill/${queryArg.waybillId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProcurementWaybillByWaybillId: build.mutation<
      PutApiV1ProcurementWaybillByWaybillIdApiResponse,
      PutApiV1ProcurementWaybillByWaybillIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/waybill", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/waybill", id: queryArg.waybillId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/waybill/${queryArg.waybillId}`,
        method: "PUT",
        body: queryArg.domainEntitiesShipmentsRequestCreateShipmentDocumentRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProcurementWaybillByWaybillId: build.mutation<
      DeleteApiV1ProcurementWaybillByWaybillIdApiResponse,
      DeleteApiV1ProcurementWaybillByWaybillIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/waybill", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/waybill", id: queryArg.waybillId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/waybill/${queryArg.waybillId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProcurementShipmentDocumentByShipmentDocumentIdArrived:
      build.mutation<
        PutApiV1ProcurementShipmentDocumentByShipmentDocumentIdArrivedApiResponse,
        PutApiV1ProcurementShipmentDocumentByShipmentDocumentIdArrivedApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/procurement/shipment-document/${queryArg.shipmentDocumentId}/arrived`,
          method: "PUT",
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    putApiV1ProcurementShipmentsByShipmentIdStatus: build.mutation<
      PutApiV1ProcurementShipmentsByShipmentIdStatusApiResponse,
      PutApiV1ProcurementShipmentsByShipmentIdStatusApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/shipment", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/shipment", id: queryArg.shipmentId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipments/${queryArg.shipmentId}/status`,
        method: "PUT",
        body: queryArg.domainEntitiesShipmentsRequestUpdateShipmentStatusRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementShipmentDocumentArrived: build.query<
      GetApiV1ProcurementShipmentDocumentArrivedApiResponse,
      GetApiV1ProcurementShipmentDocumentArrivedApiArg
    >({
      providesTags: [{ type: "procurement/shipment-document", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-document/arrived`,
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
    postApiV1ProcurementShipmentInvoice: build.mutation<
      PostApiV1ProcurementShipmentInvoiceApiResponse,
      PostApiV1ProcurementShipmentInvoiceApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/shipment-invoice", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-invoice`,
        method: "POST",
        body: queryArg.domainEntitiesShipmentsRequestCreateShipmentInvoice,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementShipmentInvoice: build.query<
      GetApiV1ProcurementShipmentInvoiceApiResponse,
      GetApiV1ProcurementShipmentInvoiceApiArg
    >({
      providesTags: [{ type: "procurement/shipment-invoice", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-invoice`,
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
    postApiV1ProcurementShipmentInvoiceShortageMakeUp: build.mutation<
      PostApiV1ProcurementShipmentInvoiceShortageMakeUpApiResponse,
      PostApiV1ProcurementShipmentInvoiceShortageMakeUpApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/shipment-invoice", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-invoice/shortage-make-up`,
        method: "POST",
        body: queryArg.domainEntitiesShipmentsRequestCreateShortageMakeUpInvoice,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementShipmentInvoiceById: build.query<
      GetApiV1ProcurementShipmentInvoiceByIdApiResponse,
      GetApiV1ProcurementShipmentInvoiceByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/shipment-invoice", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-invoice/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementShipmentInvoiceUnattached: build.query<
      GetApiV1ProcurementShipmentInvoiceUnattachedApiResponse,
      GetApiV1ProcurementShipmentInvoiceUnattachedApiArg
    >({
      providesTags: [{ type: "procurement/shipment-invoice", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-invoice/unattached`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementShipmentInvoiceShipmentDocumentByShipmentDocumentId:
      build.query<
        GetApiV1ProcurementShipmentInvoiceShipmentDocumentByShipmentDocumentIdApiResponse,
        GetApiV1ProcurementShipmentInvoiceShipmentDocumentByShipmentDocumentIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/procurement/shipment-invoice/shipment-document/${queryArg.shipmentDocumentId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    putApiV1ProcurementShipmentInvoiceByShipmentInvoiceId: build.mutation<
      PutApiV1ProcurementShipmentInvoiceByShipmentInvoiceIdApiResponse,
      PutApiV1ProcurementShipmentInvoiceByShipmentInvoiceIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/shipment-invoice", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/shipment-invoice", id: queryArg.shipmentInvoiceId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-invoice/${queryArg.shipmentInvoiceId}`,
        method: "PUT",
        body: queryArg.domainEntitiesShipmentsRequestCreateShipmentInvoice,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProcurementShipmentInvoiceByShipmentInvoiceId: build.mutation<
      DeleteApiV1ProcurementShipmentInvoiceByShipmentInvoiceIdApiResponse,
      DeleteApiV1ProcurementShipmentInvoiceByShipmentInvoiceIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/shipment-invoice", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/shipment-invoice", id: queryArg.shipmentInvoiceId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-invoice/${queryArg.shipmentInvoiceId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProcurementShipmentInvoicePaidByShipmentInvoiceId: build.mutation<
      PutApiV1ProcurementShipmentInvoicePaidByShipmentInvoiceIdApiResponse,
      PutApiV1ProcurementShipmentInvoicePaidByShipmentInvoiceIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/shipment-invoice", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/shipment-invoice", id: queryArg.shipmentInvoiceId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-invoice/paid/${queryArg.shipmentInvoiceId}`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          paidAt: queryArg.paidAt,
        },
      }),
    }),
    putApiV1ProcurementShipmentInvoicePaidMultiple: build.mutation<
      PutApiV1ProcurementShipmentInvoicePaidMultipleApiResponse,
      PutApiV1ProcurementShipmentInvoicePaidMultipleApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/shipment-invoice", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-invoice/paid/multiple`,
        method: "PUT",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          paidAt: queryArg.paidAt,
        },
      }),
    }),
    postApiV1ProcurementShipmentDiscrepancy: build.mutation<
      PostApiV1ProcurementShipmentDiscrepancyApiResponse,
      PostApiV1ProcurementShipmentDiscrepancyApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/shipment-discrepancy", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-discrepancy`,
        method: "POST",
        body: queryArg.domainEntitiesShipmentsRequestCreateShipmentDiscrepancy,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementShipmentDiscrepancy: build.query<
      GetApiV1ProcurementShipmentDiscrepancyApiResponse,
      GetApiV1ProcurementShipmentDiscrepancyApiArg
    >({
      providesTags: [{ type: "procurement/shipment-discrepancy", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-discrepancy`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementShipmentDiscrepancyLineByDiscrepancyItemIdBalance:
      build.query<
        GetApiV1ProcurementShipmentDiscrepancyLineByDiscrepancyItemIdBalanceApiResponse,
        GetApiV1ProcurementShipmentDiscrepancyLineByDiscrepancyItemIdBalanceApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/procurement/shipment-discrepancy/line/${queryArg.discrepancyItemId}/balance`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyId: build.query<
      GetApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdApiResponse,
      GetApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/shipment-discrepancy", id: queryArg.shipmentDiscrepancyId }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/shipment-discrepancy/${queryArg.shipmentDiscrepancyId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyId:
      build.mutation<
        PutApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdApiResponse,
        PutApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/procurement/shipment-discrepancy/${queryArg.shipmentDiscrepancyId}`,
          method: "PUT",
          body: queryArg.domainEntitiesShipmentsRequestCreateShipmentDiscrepancy,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    deleteApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyId:
      build.mutation<
        DeleteApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdApiResponse,
        DeleteApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/procurement/shipment-discrepancy/${queryArg.shipmentDiscrepancyId}`,
          method: "DELETE",
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProcurementPurchaseOrderNotLinked: build.query<
      GetApiV1ProcurementPurchaseOrderNotLinkedApiResponse,
      GetApiV1ProcurementPurchaseOrderNotLinkedApiArg
    >({
      providesTags: [{ type: "procurement/purchase-order", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/purchase-order/not-linked`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementPurchaseOrderSupplierBySupplierIdNotLinked: build.query<
      GetApiV1ProcurementPurchaseOrderSupplierBySupplierIdNotLinkedApiResponse,
      GetApiV1ProcurementPurchaseOrderSupplierBySupplierIdNotLinkedApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/purchase-order", id: queryArg.supplierId }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/purchase-order/supplier/${queryArg.supplierId}/not-linked`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementMaterialsByPurchaseOrders: build.mutation<
      PostApiV1ProcurementMaterialsByPurchaseOrdersApiResponse,
      PostApiV1ProcurementMaterialsByPurchaseOrdersApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/material", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/materials/by-purchase-orders`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementShipmentDocumentByShipmentDocumentIdMaterialDistribution:
      build.query<
        GetApiV1ProcurementShipmentDocumentByShipmentDocumentIdMaterialDistributionApiResponse,
        GetApiV1ProcurementShipmentDocumentByShipmentDocumentIdMaterialDistributionApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/procurement/shipment-document/${queryArg.shipmentDocumentId}/material-distribution`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProcurementSupplierBySupplierIdMaterialAndMaterialId: build.query<
      GetApiV1ProcurementSupplierBySupplierIdMaterialAndMaterialIdApiResponse,
      GetApiV1ProcurementSupplierBySupplierIdMaterialAndMaterialIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/supplier", id: queryArg.supplierId }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/supplier/${queryArg.supplierId}/material/${queryArg.materialId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementSupplierBySupplierIdMaterial: build.query<
      GetApiV1ProcurementSupplierBySupplierIdMaterialApiResponse,
      GetApiV1ProcurementSupplierBySupplierIdMaterialApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/supplier", id: queryArg.supplierId }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/supplier/${queryArg.supplierId}/material`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementDistributeMaterial: build.mutation<
      PostApiV1ProcurementDistributeMaterialApiResponse,
      PostApiV1ProcurementDistributeMaterialApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/distribute-material", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/distribute-material`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementDistributeMaterial: build.query<
      GetApiV1ProcurementDistributeMaterialApiResponse,
      GetApiV1ProcurementDistributeMaterialApiArg
    >({
      providesTags: [{ type: "procurement/distribute-material", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/distribute-material`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
          departmentId: queryArg.departmentId,
          kind: queryArg.kind,
        },
      }),
    }),
    getApiV1ProcurementDistributeMaterialByDistributeMaterialId: build.query<
      GetApiV1ProcurementDistributeMaterialByDistributeMaterialIdApiResponse,
      GetApiV1ProcurementDistributeMaterialByDistributeMaterialIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/distribute-material", id: queryArg.distributeMaterialId }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/distribute-material/${queryArg.distributeMaterialId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as procurementApi };
export type PostApiV1ProcurementManufacturerApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ProcurementManufacturerApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateManufacturerRequest object. */
  domainEntitiesProcurementManufacturersCreateManufacturerRequest: DomainEntitiesProcurementManufacturersCreateManufacturerRequest;
};
export type GetApiV1ProcurementManufacturerApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProcurementManufacturersManufacturerDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProcurementManufacturerApiArg = {
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
export type GetApiV1ProcurementManufacturerByManufacturerIdApiResponse =
  /** status 200 OK */ DomainEntitiesProcurementManufacturersManufacturerDto;
export type GetApiV1ProcurementManufacturerByManufacturerIdApiArg = {
  /** The ID of the manufacturer. */
  manufacturerId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProcurementManufacturerByManufacturerIdApiResponse = void;
export type PutApiV1ProcurementManufacturerByManufacturerIdApiArg = {
  /** The ID of the manufacturer to update. */
  manufacturerId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateManufacturerRequest object. */
  domainEntitiesProcurementManufacturersCreateManufacturerRequest: DomainEntitiesProcurementManufacturersCreateManufacturerRequest;
};
export type DeleteApiV1ProcurementManufacturerByManufacturerIdApiResponse = void;
export type DeleteApiV1ProcurementManufacturerByManufacturerIdApiArg = {
  /** The ID of the manufacturer to delete. */
  manufacturerId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementManufacturerMaterialByMaterialIdApiResponse =
  /** status 200 OK */ DomainEntitiesProcurementManufacturersManufacturerDto[];
export type GetApiV1ProcurementManufacturerMaterialByMaterialIdApiArg = {
  /** The ID of the material. */
  materialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProcurementSupplierApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ProcurementSupplierApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateSupplierRequest object. */
  domainEntitiesProcurementSuppliersCreateSupplierRequest: DomainEntitiesProcurementSuppliersCreateSupplierRequest;
};
export type GetApiV1ProcurementSupplierApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProcurementSuppliersSupplierDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProcurementSupplierApiArg = {
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
export type GetApiV1ProcurementSupplierBySupplierIdApiResponse =
  /** status 200 OK */ DomainEntitiesProcurementSuppliersSupplierDto;
export type GetApiV1ProcurementSupplierBySupplierIdApiArg = {
  /** The ID of the supplier. */
  supplierId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProcurementSupplierBySupplierIdApiResponse = void;
export type PutApiV1ProcurementSupplierBySupplierIdApiArg = {
  /** The ID of the supplier to update. */
  supplierId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateSupplierRequest object. */
  domainEntitiesProcurementSuppliersCreateSupplierRequest: DomainEntitiesProcurementSuppliersCreateSupplierRequest;
};
export type DeleteApiV1ProcurementSupplierBySupplierIdApiResponse = void;
export type DeleteApiV1ProcurementSupplierBySupplierIdApiArg = {
  /** The ID of the supplier to delete. */
  supplierId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProcurementSupplierBySupplierIdStatusApiResponse = void;
export type PutApiV1ProcurementSupplierBySupplierIdStatusApiArg = {
  /** The ID of the supplier to update. */
  supplierId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The new status of the supplier. */
  domainEntitiesProcurementSuppliersUpdateSupplierStatusRequest: DomainEntitiesProcurementSuppliersUpdateSupplierStatusRequest;
};
export type GetApiV1ProcurementSupplierMaterialByMaterialIdApiResponse =
  /** status 200 OK */ DomainEntitiesProcurementSuppliersSupplierDto[];
export type GetApiV1ProcurementSupplierMaterialByMaterialIdApiArg = {
  /** The ID of the material. */
  materialId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementSupplierByMaterialIdAndTypeApiResponse =
  /** status 200 OK */ DomainEntitiesProcurementSuppliersSupplierDto[];
export type GetApiV1ProcurementSupplierByMaterialIdAndTypeApiArg = {
  /** The ID of the material. */
  materialId: string;
  /** The type of the supplier. */
  type: DomainEntitiesProcurementSuppliersSupplierType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProcurementPurchaseOrderApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ProcurementPurchaseOrderApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreatePurchaseOrderRequest object. */
  domainEntitiesPurchaseOrdersRequestCreatePurchaseOrderRequest: DomainEntitiesPurchaseOrdersRequestCreatePurchaseOrderRequest;
};
export type GetApiV1ProcurementPurchaseOrderApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesPurchaseOrdersPurchaseOrderDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1ProcurementPurchaseOrderApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** Filter by the status of the purchase order. (Pending, Delivered, Completed) */
  status?: DomainEntitiesPurchaseOrdersPurchaseOrderStatus;
  /** Filter by the supplier type */
  type?: DomainEntitiesProcurementSuppliersSupplierType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementPurchaseOrderByPurchaseOrderIdApiResponse =
  /** status 200 OK */ DomainEntitiesPurchaseOrdersPurchaseOrderDtoRead;
export type GetApiV1ProcurementPurchaseOrderByPurchaseOrderIdApiArg = {
  /** The ID of the purchase order. */
  purchaseOrderId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProcurementPurchaseOrderByPurchaseOrderIdApiResponse = void;
export type PostApiV1ProcurementPurchaseOrderByPurchaseOrderIdApiArg = {
  /** The ID of the purchase order you want to send to a supplier as an email. */
  purchaseOrderId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The request metadata to send purchase orders to suppliers. */
  domainEntitiesPurchaseOrdersRequestSendPurchaseOrderRequest: DomainEntitiesPurchaseOrdersRequestSendPurchaseOrderRequest;
};
export type PutApiV1ProcurementPurchaseOrderByPurchaseOrderIdApiResponse = void;
export type PutApiV1ProcurementPurchaseOrderByPurchaseOrderIdApiArg = {
  /** The ID of the purchase order to update. */
  purchaseOrderId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The UpdatePurchaseOrderRequest object. */
  domainEntitiesPurchaseOrdersRequestUpdatePurchaseOrderRequest: DomainEntitiesPurchaseOrdersRequestUpdatePurchaseOrderRequest;
};
export type DeleteApiV1ProcurementPurchaseOrderByPurchaseOrderIdApiResponse = void;
export type DeleteApiV1ProcurementPurchaseOrderByPurchaseOrderIdApiArg = {
  /** The ID of the purchase order to delete. */
  purchaseOrderId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementPurchaseOrderRequisitionByPurchaseOrderIdAndMaterialIdApiResponse =
  /** status 200 OK */ string;
export type GetApiV1ProcurementPurchaseOrderRequisitionByPurchaseOrderIdAndMaterialIdApiArg =
  {
    /** The ID of the purchase order. */
    purchaseOrderId: string;
    /** The material ID to know the requisition */
    materialId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PostApiV1ProcurementPurchaseOrderProformaInvoiceByPurchaseOrderIdApiResponse = void;
export type PostApiV1ProcurementPurchaseOrderProformaInvoiceByPurchaseOrderIdApiArg =
  {
    /** The ID of the purchase order you want to send to a supplier as an email. */
    purchaseOrderId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PutApiV1ProcurementPurchaseOrderFirstStepByPurchaseOrderIdApiResponse = void;
export type PutApiV1ProcurementPurchaseOrderFirstStepByPurchaseOrderIdApiArg = {
  /** The ID of the purchase order to update. */
  purchaseOrderId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The UpdatePurchaseOrderRequest object. */
  domainEntitiesPurchaseOrdersRequestUpdatePurchaseOrderFirstStep: DomainEntitiesPurchaseOrdersRequestUpdatePurchaseOrderFirstStep;
};
export type DeleteApiV1ProcurementPurchaseOrderByPurchaseOrderIdCancelApiResponse = void;
export type DeleteApiV1ProcurementPurchaseOrderByPurchaseOrderIdCancelApiArg = {
  /** The ID of the purchase order to update. */
  purchaseOrderId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProcurementPurchaseOrderByPurchaseOrderIdReviseApiResponse = void;
export type PutApiV1ProcurementPurchaseOrderByPurchaseOrderIdReviseApiArg = {
  /** The ID of the purchase order to revise. */
  purchaseOrderId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The list of revisions to be made for the purchase order */
  body: DomainEntitiesPurchaseOrdersRequestCreatePurchaseOrderRevision[];
};
export type PutApiV1ProcurementPurchaseOrderCheckByPurchaseOrderIdApiResponse = void;
export type PutApiV1ProcurementPurchaseOrderCheckByPurchaseOrderIdApiArg = {
  purchaseOrderId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProcurementPurchaseOrderInvoiceApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ProcurementPurchaseOrderInvoiceApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreatePurchaseOrderInvoiceRequest object. */
  domainEntitiesPurchaseOrdersRequestCreatePurchaseOrderInvoiceRequest: DomainEntitiesPurchaseOrdersRequestCreatePurchaseOrderInvoiceRequest;
};
export type GetApiV1ProcurementPurchaseOrderInvoiceApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesPurchaseOrdersPurchaseOrderInvoiceDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProcurementPurchaseOrderInvoiceApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** Filter by supplier type */
  type?: DomainEntitiesProcurementSuppliersSupplierType;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementPurchaseOrderInvoiceByInvoiceIdApiResponse =
  /** status 200 OK */ DomainEntitiesPurchaseOrdersPurchaseOrderInvoiceDto;
export type GetApiV1ProcurementPurchaseOrderInvoiceByInvoiceIdApiArg = {
  /** The ID of the invoice. */
  invoiceId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProcurementPurchaseOrderInvoiceByInvoiceIdApiResponse = void;
export type PutApiV1ProcurementPurchaseOrderInvoiceByInvoiceIdApiArg = {
  /** The ID of the invoice to update. */
  invoiceId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The UpdatePurchaseOrderInvoiceRequest object. */
  domainEntitiesPurchaseOrdersRequestCreatePurchaseOrderInvoiceRequest: DomainEntitiesPurchaseOrdersRequestCreatePurchaseOrderInvoiceRequest;
};
export type DeleteApiV1ProcurementPurchaseOrderInvoiceByInvoiceIdApiResponse = void;
export type DeleteApiV1ProcurementPurchaseOrderInvoiceByInvoiceIdApiArg = {
  /** The ID of the invoice to delete. */
  invoiceId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProcurementBillingSheetApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ProcurementBillingSheetApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateBillingSheetRequest object. */
  domainEntitiesPurchaseOrdersRequestCreateBillingSheetRequest: DomainEntitiesPurchaseOrdersRequestCreateBillingSheetRequest;
};
export type GetApiV1ProcurementBillingSheetApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesPurchaseOrdersBillingSheetDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProcurementBillingSheetApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** The status of the billing sheet( 0 -> Pending, 1 -> Paid */
  status?: DomainEntitiesPurchaseOrdersBillingSheetStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementBillingSheetByBillingSheetIdApiResponse =
  /** status 200 OK */ DomainEntitiesPurchaseOrdersBillingSheetDto;
export type GetApiV1ProcurementBillingSheetByBillingSheetIdApiArg = {
  /** The ID of the billing sheet. */
  billingSheetId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProcurementBillingSheetByBillingSheetIdApiResponse = void;
export type PutApiV1ProcurementBillingSheetByBillingSheetIdApiArg = {
  /** The ID of the billing sheet to update. */
  billingSheetId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The UpdateBillingSheetRequest object. */
  domainEntitiesPurchaseOrdersRequestUpdateBillingSheetRequest: DomainEntitiesPurchaseOrdersRequestUpdateBillingSheetRequest;
};
export type DeleteApiV1ProcurementBillingSheetByBillingSheetIdApiResponse = void;
export type DeleteApiV1ProcurementBillingSheetByBillingSheetIdApiArg = {
  /** The ID of the billing sheet to delete. */
  billingSheetId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementBillingSheetInvoiceByInvoiceIdApiResponse =
  /** status 200 OK */ DomainEntitiesPurchaseOrdersBillingSheetDto;
export type GetApiV1ProcurementBillingSheetInvoiceByInvoiceIdApiArg = {
  /** The ID of the invoice. */
  invoiceId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProcurementBillingSheetChargeApiResponse =
  /** status 200 OK */ DomainEntitiesPurchaseOrdersRequestMarkBillingSheetChargePaymentsResponse;
export type PutApiV1ProcurementBillingSheetChargeApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesPurchaseOrdersRequestMarkBillingSheetChargePaymentsRequest: DomainEntitiesPurchaseOrdersRequestMarkBillingSheetChargePaymentsRequest;
};
export type PostApiV1ProcurementBillingSheetChargeByBillingSheetIdApiResponse = void;
export type PostApiV1ProcurementBillingSheetChargeByBillingSheetIdApiArg = {
  billingSheetId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  body: DomainEntitiesPurchaseOrdersRequestCreateBillingSheetCharge[];
};
export type PostApiV1ProcurementShipmentDocumentApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ProcurementShipmentDocumentApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateShipmentDocumentRequest object. */
  domainEntitiesShipmentsRequestCreateShipmentDocumentRequest: DomainEntitiesShipmentsRequestCreateShipmentDocumentRequest;
};
export type GetApiV1ProcurementShipmentDocumentApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesShipmentsShipmentDocumentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProcurementShipmentDocumentApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** Get onlt shipment documents that have been approved */
  onlyApproved?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementShipmentDocumentByShipmentDocumentIdApiResponse =
  /** status 200 OK */ DomainEntitiesShipmentsShipmentDocumentDto;
export type GetApiV1ProcurementShipmentDocumentByShipmentDocumentIdApiArg = {
  /** The ID of the shipment document. */
  shipmentDocumentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProcurementShipmentDocumentByShipmentDocumentIdApiResponse = void;
export type PutApiV1ProcurementShipmentDocumentByShipmentDocumentIdApiArg = {
  /** The ID of the shipment document to update. */
  shipmentDocumentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateShipmentDocumentRequest object. */
  domainEntitiesShipmentsRequestCreateShipmentDocumentRequest: DomainEntitiesShipmentsRequestCreateShipmentDocumentRequest;
};
export type DeleteApiV1ProcurementShipmentDocumentByShipmentDocumentIdApiResponse = void;
export type DeleteApiV1ProcurementShipmentDocumentByShipmentDocumentIdApiArg = {
  /** The ID of the shipment document to delete. */
  shipmentDocumentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProcurementWaybillApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ProcurementWaybillApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateShipmentDocumentRequest object. */
  domainEntitiesShipmentsRequestCreateShipmentDocumentRequest: DomainEntitiesShipmentsRequestCreateShipmentDocumentRequest;
};
export type GetApiV1ProcurementWaybillApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesShipmentsShipmentDocumentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProcurementWaybillApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** The status of the shipment. (0 -> New, 1 -> In Transit, 2 -> Cleared, 3 -> Arrived. */
  status?: DomainEntitiesShipmentsShipmentStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementWaybillByWaybillIdApiResponse =
  /** status 200 OK */ DomainEntitiesShipmentsShipmentDocumentDto;
export type GetApiV1ProcurementWaybillByWaybillIdApiArg = {
  /** The ID of the waybill. */
  waybillId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProcurementWaybillByWaybillIdApiResponse = void;
export type PutApiV1ProcurementWaybillByWaybillIdApiArg = {
  /** The ID of the waybill to update. */
  waybillId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateShipmentDocumentRequest object. */
  domainEntitiesShipmentsRequestCreateShipmentDocumentRequest: DomainEntitiesShipmentsRequestCreateShipmentDocumentRequest;
};
export type DeleteApiV1ProcurementWaybillByWaybillIdApiResponse = void;
export type DeleteApiV1ProcurementWaybillByWaybillIdApiArg = {
  /** The ID of the waybill to delete. */
  waybillId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProcurementShipmentDocumentByShipmentDocumentIdArrivedApiResponse = void;
export type PutApiV1ProcurementShipmentDocumentByShipmentDocumentIdArrivedApiArg =
  {
    /** The ID of the shipment document. */
    shipmentDocumentId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PutApiV1ProcurementShipmentsByShipmentIdStatusApiResponse = void;
export type PutApiV1ProcurementShipmentsByShipmentIdStatusApiArg = {
  /** The ID of the shipment document. */
  shipmentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesShipmentsRequestUpdateShipmentStatusRequest: DomainEntitiesShipmentsRequestUpdateShipmentStatusRequest;
};
export type GetApiV1ProcurementShipmentDocumentArrivedApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesShipmentsShipmentDocumentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProcurementShipmentDocumentArrivedApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProcurementShipmentInvoiceApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ProcurementShipmentInvoiceApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesShipmentsRequestCreateShipmentInvoice: DomainEntitiesShipmentsRequestCreateShipmentInvoice;
};
export type GetApiV1ProcurementShipmentInvoiceApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesShipmentsShipmentInvoiceDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProcurementShipmentInvoiceApiArg = {
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
export type PostApiV1ProcurementShipmentInvoiceShortageMakeUpApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ProcurementShipmentInvoiceShortageMakeUpApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesShipmentsRequestCreateShortageMakeUpInvoice: DomainEntitiesShipmentsRequestCreateShortageMakeUpInvoice;
};
export type GetApiV1ProcurementShipmentInvoiceByIdApiResponse =
  /** status 200 OK */ DomainEntitiesShipmentsShipmentInvoiceDto;
export type GetApiV1ProcurementShipmentInvoiceByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementShipmentInvoiceUnattachedApiResponse =
  /** status 200 OK */ DomainEntitiesShipmentsShipmentInvoiceDto[];
export type GetApiV1ProcurementShipmentInvoiceUnattachedApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementShipmentInvoiceShipmentDocumentByShipmentDocumentIdApiResponse =
  /** status 200 OK */ DomainEntitiesShipmentsShipmentInvoiceDto;
export type GetApiV1ProcurementShipmentInvoiceShipmentDocumentByShipmentDocumentIdApiArg =
  {
    shipmentDocumentId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PutApiV1ProcurementShipmentInvoiceByShipmentInvoiceIdApiResponse = void;
export type PutApiV1ProcurementShipmentInvoiceByShipmentInvoiceIdApiArg = {
  shipmentInvoiceId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesShipmentsRequestCreateShipmentInvoice: DomainEntitiesShipmentsRequestCreateShipmentInvoice;
};
export type DeleteApiV1ProcurementShipmentInvoiceByShipmentInvoiceIdApiResponse = void;
export type DeleteApiV1ProcurementShipmentInvoiceByShipmentInvoiceIdApiArg = {
  shipmentInvoiceId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProcurementShipmentInvoicePaidByShipmentInvoiceIdApiResponse = void;
export type PutApiV1ProcurementShipmentInvoicePaidByShipmentInvoiceIdApiArg = {
  paidAt?: string;
  shipmentInvoiceId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProcurementShipmentInvoicePaidMultipleApiResponse = void;
export type PutApiV1ProcurementShipmentInvoicePaidMultipleApiArg = {
  paidAt?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  body: string[];
};
export type PostApiV1ProcurementShipmentDiscrepancyApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ProcurementShipmentDiscrepancyApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesShipmentsRequestCreateShipmentDiscrepancy: DomainEntitiesShipmentsRequestCreateShipmentDiscrepancy;
};
export type GetApiV1ProcurementShipmentDiscrepancyApiResponse =
  /** status 200 OK */ DomainEntitiesShipmentsShipmentDiscrepancyDto[];
export type GetApiV1ProcurementShipmentDiscrepancyApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementShipmentDiscrepancyLineByDiscrepancyItemIdBalanceApiResponse =
  /** status 200 OK */ DomainEntitiesShipmentsRequestShipmentShortageBalanceDto;
export type GetApiV1ProcurementShipmentDiscrepancyLineByDiscrepancyItemIdBalanceApiArg =
  {
    discrepancyItemId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdApiResponse =
  /** status 200 OK */ DomainEntitiesShipmentsShipmentDiscrepancyDto;
export type GetApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdApiArg =
  {
    shipmentDiscrepancyId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PutApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdApiResponse = void;
export type PutApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdApiArg =
  {
    shipmentDiscrepancyId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesShipmentsRequestCreateShipmentDiscrepancy: DomainEntitiesShipmentsRequestCreateShipmentDiscrepancy;
  };
export type DeleteApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdApiResponse = void;
export type DeleteApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdApiArg =
  {
    shipmentDiscrepancyId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProcurementPurchaseOrderNotLinkedApiResponse =
  /** status 200 OK */ DomainEntitiesProcurementSuppliersSupplierDto[];
export type GetApiV1ProcurementPurchaseOrderNotLinkedApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementPurchaseOrderSupplierBySupplierIdNotLinkedApiResponse =
  /** status 200 OK */ DomainEntitiesPurchaseOrdersPurchaseOrderDtoRead[];
export type GetApiV1ProcurementPurchaseOrderSupplierBySupplierIdNotLinkedApiArg =
  {
    /** The ID of the supplier. */
    supplierId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PostApiV1ProcurementMaterialsByPurchaseOrdersApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsMaterialDto[];
export type PostApiV1ProcurementMaterialsByPurchaseOrdersApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** A list of purchase order IDs. */
  body: string[];
};
export type GetApiV1ProcurementShipmentDocumentByShipmentDocumentIdMaterialDistributionApiResponse =
  /** status 200 OK */ DomainEntitiesProcurementDistributionMaterialDistributionPageDto;
export type GetApiV1ProcurementShipmentDocumentByShipmentDocumentIdMaterialDistributionApiArg =
  {
    /** The ID of the shipment document. */
    shipmentDocumentId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProcurementSupplierBySupplierIdMaterialAndMaterialIdApiResponse =
  /** status 200 OK */ DomainEntitiesProcurementSuppliersSupplierManufacturerDto[];
export type GetApiV1ProcurementSupplierBySupplierIdMaterialAndMaterialIdApiArg =
  {
    supplierId: string;
    materialId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProcurementSupplierBySupplierIdMaterialApiResponse =
  /** status 200 OK */ DomainEntitiesProcurementSuppliersSupplierManufacturerDto[];
export type GetApiV1ProcurementSupplierBySupplierIdMaterialApiArg = {
  supplierId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProcurementDistributeMaterialApiResponse = void;
export type PostApiV1ProcurementDistributeMaterialApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The distribution details request. */
  body: DomainEntitiesWarehousesDistributeMaterialRequest[];
};
export type GetApiV1ProcurementDistributeMaterialApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesDistributeMaterialDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1ProcurementDistributeMaterialApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** Filter by distribution status. */
  status?: DomainEntitiesWarehousesDistributeMaterialStatus;
  /** Filter by department ID. */
  departmentId?: string;
  /** The material kind */
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementDistributeMaterialByDistributeMaterialIdApiResponse =
  /** status 200 OK */ DomainEntitiesWarehousesDistributeMaterialDtoRead;
export type GetApiV1ProcurementDistributeMaterialByDistributeMaterialIdApiArg =
  {
    /** The ID of the distributed material. */
    distributeMaterialId: string;
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
export type DomainEntitiesProcurementManufacturersQuantityType = 0 | 1 | 2;
export type DomainEntitiesProcurementManufacturersCreateQuantityPerPackOption =
  {
    type?: DomainEntitiesProcurementManufacturersQuantityType;
    min?: number | null;
    max?: number | null;
    values?: number[] | null;
  };
export type DomainEntitiesProcurementManufacturersCreateManufacturerMaterialRequest =
  {
    quantityType?: DomainEntitiesProcurementManufacturersQuantityType;
    quantityPerPackOption?: DomainEntitiesProcurementManufacturersCreateQuantityPerPackOption;
    materialId?: string;
  };
export type DomainEntitiesProcurementManufacturersCreateManufacturerRequest = {
  name?: string | null;
  address?: string | null;
  email?: string | null;
  validityDate?: string | null;
  countryId?: string | null;
  materials?:
    | DomainEntitiesProcurementManufacturersCreateManufacturerMaterialRequest[]
    | null;
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
export type DomainEntitiesCountriesCountryDto = {
  id?: string;
  name?: string | null;
  nationality?: string | null;
  code?: string | null;
};
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
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProcurementManufacturersManufacturerDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProcurementManufacturersManufacturerDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesProcurementSuppliersCreateSupplierManufacturerRequest =
  {
    manufacturerId?: string;
    materialId?: string | null;
    uoMId?: string | null;
    purchaseUnit?: string | null;
    default?: boolean;
  };
export type DomainEntitiesProcurementSuppliersCreateSupplierRequest = {
  name?: string | null;
  email?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  contactNumber?: string | null;
  countryId?: string | null;
  currencyId?: string | null;
  type?: DomainEntitiesProcurementSuppliersSupplierType;
  associatedManufacturers?:
    | DomainEntitiesProcurementSuppliersCreateSupplierManufacturerRequest[]
    | null;
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
export type DomainEntitiesProcurementSuppliersSupplierManufacturerDto = {
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturerDto;
  material?: DomainEntitiesMaterialsMaterialDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  purchaseUnit?: string | null;
  pendingPurchaseUnit?: string | null;
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
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProcurementSuppliersSupplierDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProcurementSuppliersSupplierDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesProcurementSuppliersUpdateSupplierStatusRequest = {
  status?: DomainEntitiesProcurementSuppliersSupplierStatus;
  requalificationIntervalDays?: number;
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
export type DomainEntitiesPurchaseOrdersRequestCreatePurchaseOrderRequest = {
  code?: string | null;
  proFormaInvoiceNumber?: string | null;
  supplierId?: string;
  sourceRequisitionId?: string;
  requestDate?: string;
  expectedDeliveryDate?: string | null;
  items?:
    DomainEntitiesPurchaseOrdersRequestCreatePurchaseOrderItemRequest[] | null;
  deliveryModeId?: string | null;
  termsOfPaymentId?: string | null;
  totalFobValue?: number;
  totalCifValue?: number;
  seaFreight?: number;
  insurance?: number;
  amountInFigures?: string | null;
  estimatedDeliveryDate?: string | null;
  departmentId?: string | null;
};
export type DomainEntitiesAttachmentsAttachmentDto = {
  link?: string | null;
  name?: string | null;
  id?: string;
  reference?: string | null;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderItemDto = {
  id?: string;
  purchaseOrder?: SharedCollectionItemDto;
  material?: SharedCollectionItemDto;
  uom?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  price?: number;
  priceUoM?: string | null;
  currency?: SharedCollectionItemDto;
  manufacturers?:
    DomainEntitiesProcurementSuppliersSupplierManufacturerDto[] | null;
  canReassignSupplier?: boolean;
  quantityInvoiced?: number;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderItemDtoRead = {
  id?: string;
  purchaseOrder?: SharedCollectionItemDto;
  material?: SharedCollectionItemDto;
  uom?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  price?: number;
  priceUoM?: string | null;
  currency?: SharedCollectionItemDto;
  manufacturers?:
    DomainEntitiesProcurementSuppliersSupplierManufacturerDto[] | null;
  cost?: number;
  canReassignSupplier?: boolean;
  quantityInvoiced?: number;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export type DomainEntitiesPurchaseOrdersPurchaseOrderAttachmentStatus =
  0 | 1 | 2;
export type DomainEntitiesPurchaseOrdersRevisedPurchaseOrderType =
  0 | 1 | 2 | 3 | 4;
export type DomainEntitiesPurchaseOrdersRevisedPurchaseOrderDto = {
  id?: string;
  type?: DomainEntitiesPurchaseOrdersRevisedPurchaseOrderType;
  material?: DomainEntitiesMaterialsMaterialDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number | null;
  price?: number | null;
  priceUoM?: string | null;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  uomBefore?: DomainEntitiesBaseUnitOfMeasureDto;
  quantityBefore?: number | null;
  priceBefore?: number | null;
  priceUoMBefore?: string | null;
  currencyBefore?: DomainEntitiesCurrenciesCurrencyDto;
  materialBefore?: DomainEntitiesMaterialsMaterialDto;
  revisionNumber?: number;
  revisionDate?: string | null;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderRevisionDto = {
  revisionNumber?: number;
  items?: DomainEntitiesPurchaseOrdersRevisedPurchaseOrderDto[] | null;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  code?: string | null;
  proFormaInvoiceNumber?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  requestDate?: string;
  expectedDeliveryDate?: string | null;
  items?: DomainEntitiesPurchaseOrdersPurchaseOrderItemDto[] | null;
  status?: DomainEntitiesPurchaseOrdersPurchaseOrderStatus;
  isRevised?: boolean;
  attachmentStatus?: DomainEntitiesPurchaseOrdersPurchaseOrderAttachmentStatus;
  deliveryMode?: SharedCollectionItemDto;
  termsOfPayment?: SharedCollectionItemDto;
  totalFobValue?: number;
  totalCifValue?: number;
  seaFreight?: number;
  amountInFigures?: string | null;
  insurance?: number;
  revisionNumber?: number;
  revisions?: DomainEntitiesPurchaseOrdersPurchaseOrderRevisionDto[] | null;
  estimatedDeliveryDate?: string | null;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderDtoRead = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  code?: string | null;
  proFormaInvoiceNumber?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  requestDate?: string;
  expectedDeliveryDate?: string | null;
  items?: DomainEntitiesPurchaseOrdersPurchaseOrderItemDtoRead[] | null;
  status?: DomainEntitiesPurchaseOrdersPurchaseOrderStatus;
  isRevised?: boolean;
  attachmentStatus?: DomainEntitiesPurchaseOrdersPurchaseOrderAttachmentStatus;
  deliveryMode?: SharedCollectionItemDto;
  termsOfPayment?: SharedCollectionItemDto;
  totalFobValue?: number;
  totalCifValue?: number;
  seaFreight?: number;
  amountInFigures?: string | null;
  insurance?: number;
  revisionNumber?: number;
  revisions?: DomainEntitiesPurchaseOrdersPurchaseOrderRevisionDto[] | null;
  estimatedDeliveryDate?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesPurchaseOrdersPurchaseOrderDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesPurchaseOrdersPurchaseOrderDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesPurchaseOrdersPurchaseOrderDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesPurchaseOrdersPurchaseOrderDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesPurchaseOrdersRequestSendPurchaseOrderRequest = {
  expectedDeliveryDate?: string;
};
export type DomainEntitiesPurchaseOrdersRequestUpdatePurchaseOrderRequest = {
  totalFobValue?: number;
  totalCifValue?: number;
  seaFreight?: number;
  insurance?: number;
  amountInFigures?: string | null;
};
export type DomainEntitiesPurchaseOrdersRequestUpdatePurchaseOrderFirstStep = {
  proFormaInvoiceNumber?: string | null;
  deliveryModeId?: string | null;
  termsOfPaymentId?: string | null;
  estimatedDeliveryDate?: string | null;
};
export type DomainEntitiesPurchaseOrdersRequestCreatePurchaseOrderRevision = {
  type?: DomainEntitiesPurchaseOrdersRevisedPurchaseOrderType;
  purchaseOrderItemId?: string | null;
  materialId?: string | null;
  uoMId?: string | null;
  quantity?: number | null;
  price?: number | null;
  priceUoM?: string | null;
  currencyId?: string | null;
};
export type DomainEntitiesPurchaseOrdersRequestCreateBatchItemRequest = {
  batchNumber?: string | null;
  manufacturerId?: string;
  quantity?: number;
};
export type DomainEntitiesPurchaseOrdersRequestCreatePurchaseOrderChargeRequest =
  {
    description?: string | null;
    amount?: number;
    currencyId?: string | null;
  };
export type DomainEntitiesPurchaseOrdersRequestCreatePurchaseOrderInvoiceRequest =
  {
    code?: string | null;
    purchaseOrderId?: string;
    batchItems?:
      DomainEntitiesPurchaseOrdersRequestCreateBatchItemRequest[] | null;
    charges?:
      | DomainEntitiesPurchaseOrdersRequestCreatePurchaseOrderChargeRequest[]
      | null;
  };
export type DomainEntitiesPurchaseOrdersBatchItemDto = {
  batchNumber?: string | null;
  purchaseOrderInvoice?: SharedCollectionItemDto;
  manufacturer?: SharedCollectionItemDto;
  quantity?: number;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderChargeDto = {
  purchaseOrderInvoice?: DomainEntitiesPurchaseOrdersPurchaseOrderInvoiceDto;
  description?: string | null;
  currency?: SharedCollectionItemDto;
  amount?: number;
};
export type DomainEntitiesPaymentsPayableBalanceDto = {
  currencyId?: string;
  currencyName?: string | null;
  currencySymbol?: string | null;
  documentTotal?: number;
  amountPaid?: number;
  outstandingBalance?: number;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderInvoiceDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  purchaseOrder?: SharedCollectionItemDto;
  batchItems?: DomainEntitiesPurchaseOrdersBatchItemDto[] | null;
  charges?: DomainEntitiesPurchaseOrdersPurchaseOrderChargeDto[] | null;
  dueDate?: string | null;
  balances?: DomainEntitiesPaymentsPayableBalanceDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesPurchaseOrdersPurchaseOrderInvoiceDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesPurchaseOrdersPurchaseOrderInvoiceDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesPurchaseOrdersRequestCreateBillingSheetCharge = {
  chargeId?: string;
  currencyId?: string | null;
  amount?: number;
};
export type DomainEntitiesPurchaseOrdersRequestCreateBillingSheetRequest = {
  code?: string | null;
  billOfLading?: string | null;
  supplierId?: string | null;
  invoiceId?: string;
  expectedArrivalDate?: string;
  freeTimeExpiryDate?: string;
  freeTimeDuration?: string | null;
  demurrageStartDate?: string;
  containerNumber?: string | null;
  numberOfPackages?: string | null;
  packageDescription?: string | null;
  containerPackageStyleId?: string | null;
  charges?:
    DomainEntitiesPurchaseOrdersRequestCreateBillingSheetCharge[] | null;
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
  fulfillsDiscrepancyItemId?: string | null;
};
export type DomainEntitiesShipmentsShipmentInvoiceKind = 0 | 1;
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
  kind?: DomainEntitiesShipmentsShipmentInvoiceKind;
};
export type DomainEntitiesPurchaseOrdersBillingSheetStatus = 0 | 1 | 2;
export type DomainEntitiesChargesChargeDto = {
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesPaymentsPaymentStatus = 0 | 1 | 2;
export type DomainEntitiesPurchaseOrdersBillingSheetChargeDto = {
  id?: string;
  charge?: DomainEntitiesChargesChargeDto;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  amount?: number;
  paid?: boolean;
  paymentStatus?: DomainEntitiesPaymentsPaymentStatus;
};
export type DomainEntitiesBasePackageStyleDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesPurchaseOrdersBillingSheetDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  code?: string | null;
  billOfLading?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  invoice?: DomainEntitiesShipmentsShipmentInvoiceDto;
  expectedArrivalDate?: string;
  status?: DomainEntitiesPurchaseOrdersBillingSheetStatus;
  freeTimeExpiryDate?: string;
  freeTimeDuration?: string | null;
  demurrageStartDate?: string;
  dueDate?: string | null;
  approved?: boolean;
  balances?: DomainEntitiesPaymentsPayableBalanceDto[] | null;
  charges?: DomainEntitiesPurchaseOrdersBillingSheetChargeDto[] | null;
  containerNumber?: string | null;
  numberOfPackages?: string | null;
  packageDescription?: string | null;
  containerPackageStyle?: DomainEntitiesBasePackageStyleDto;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesPurchaseOrdersBillingSheetDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesPurchaseOrdersBillingSheetDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesPurchaseOrdersRequestUpdateBillingSheetRequest = {
  code?: string | null;
  billOfLading?: string | null;
  supplierId?: string | null;
  invoiceId?: string;
  expectedArrivalDate?: string;
  freeTimeExpiryDate?: string;
  freeTimeDuration?: string | null;
  demurrageStartDate?: string;
  containerNumber?: string | null;
  numberOfPackages?: string | null;
  packageDescription?: string | null;
  containerPackageStyleId?: string | null;
};
export type DomainEntitiesPurchaseOrdersRequestMarkBillingSheetChargePaymentsResponse =
  {
    paidChargeIds?: string[] | null;
    pendingChargeIds?: string[] | null;
  };
export type DomainEntitiesPaymentsPaymentMethod = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesPurchaseOrdersRequestMarkBillingSheetChargePayment = {
  billingSheetChargeId?: string;
  reference: string;
  notes?: string | null;
};
export type DomainEntitiesPurchaseOrdersRequestMarkBillingSheetChargePaymentsRequest =
  {
    paymentDate?: string;
    method?: DomainEntitiesPaymentsPaymentMethod;
    charges?:
      DomainEntitiesPurchaseOrdersRequestMarkBillingSheetChargePayment[] | null;
  };
export type DomainEntitiesShipmentsRequestCreateShipmentDocumentRequest = {
  code?: string | null;
  shipmentInvoiceId?: string | null;
};
export type DomainEntitiesShipmentsShipmentDiscrepancyItemDto = {
  id?: string;
  material?: SharedCollectionItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  receivedQuantity?: number;
  declaredQuantitySnapshot?: number;
  shipmentInvoiceItemId?: string | null;
  type?: SharedCollectionItemDto;
  reason?: string | null;
  resolved?: boolean;
};
export type DomainEntitiesShipmentsShipmentDiscrepancyDto = {
  id?: string;
  shipmentDocument?: DomainEntitiesShipmentsShipmentDocumentDto;
  items?: DomainEntitiesShipmentsShipmentDiscrepancyItemDto[] | null;
  approved?: boolean;
  rejected?: boolean;
  createdAt?: string;
};
export type DomainEntitiesShipmentsDocType = 0 | 1;
export type DomainEntitiesShipmentsShipmentStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesShipmentsShipmentDocumentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  code?: string | null;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoiceDto;
  discrepancies?: DomainEntitiesShipmentsShipmentDiscrepancyDto[] | null;
  arrivedAt?: string | null;
  clearedAt?: string | null;
  transitStartedAt?: string | null;
  type?: DomainEntitiesShipmentsDocType;
  status?: DomainEntitiesShipmentsShipmentStatus;
  atPortAt?: string | null;
  completedDistributionAt?: string | null;
  hasBillingSheet?: boolean;
  hasApprovedBillingSheet?: boolean;
  approved?: boolean;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesShipmentsShipmentDocumentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesShipmentsShipmentDocumentDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesShipmentsRequestUpdateShipmentStatusRequest = {
  status?: DomainEntitiesShipmentsShipmentStatus;
};
export type DomainEntitiesShipmentsRequestCreateShipmentInvoiceItem = {
  materialId?: string;
  uoMId?: string;
  manufacturerId?: string;
  purchaseOrderId?: string;
  expectedQuantity?: number;
  receivedQuantity?: number;
  reason?: string | null;
  price?: number;
  priceUoM?: string | null;
  totalCost?: number;
};
export type DomainEntitiesShipmentsRequestCreateShipmentInvoice = {
  code?: string | null;
  shipmentArrivedAt?: string | null;
  supplierId?: string | null;
  items?: DomainEntitiesShipmentsRequestCreateShipmentInvoiceItem[] | null;
  totalCost?: number;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesShipmentsShipmentInvoiceDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesShipmentsShipmentInvoiceDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesShipmentsRequestCreateShortageMakeUpInvoice = {
  code?: string | null;
  shipmentDiscrepancyItemId?: string;
  quantity?: number;
  requestKey?: string;
};
export type DomainEntitiesShipmentsRequestCreateShipmentDiscrepancyItem = {
  shipmentInvoiceItemId?: string | null;
  materialId?: string;
  uoMId?: string;
  receivedQuantity?: number;
  typeId?: string | null;
  reason?: string | null;
};
export type DomainEntitiesShipmentsRequestCreateShipmentDiscrepancy = {
  shipmentDocumentId?: string;
  items?: DomainEntitiesShipmentsRequestCreateShipmentDiscrepancyItem[] | null;
};
export type DomainEntitiesShipmentsRequestShipmentShortageBalanceDto = {
  shipmentDiscrepancyId?: string;
  shipmentDiscrepancyItemId?: string;
  declaredQuantity?: number;
  initialPhysicalQuantity?: number;
  confirmedMakeUpQuantity?: number;
  inFlightMakeUpQuantity?: number;
  outstandingQuantity?: number;
  availableToShipQuantity?: number;
};
export type DomainEntitiesProcurementDistributionDistributionMaterial = {
  id?: string;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  kind?: DomainEntitiesMaterialsMaterialKind;
};
export type DomainEntitiesProcurementDistributionDistributionLabel = {
  id?: string | null;
  name?: string | null;
  code?: string | null;
  description?: string | null;
  symbol?: string | null;
};
export type DomainEntitiesRequisitionsRequestStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesProcurementDistributionDistributionRequest = {
  id?: string;
  quantity?: number;
  quantityReceived?: number;
  status?: DomainEntitiesRequisitionsRequestStatus;
  uoM?: DomainEntitiesProcurementDistributionDistributionLabel;
};
export type DomainEntitiesProcurementDistributionDistributionOrder = {
  id?: string | null;
  code?: string | null;
  currency?: DomainEntitiesProcurementDistributionDistributionLabel;
};
export type DomainEntitiesProcurementDistributionDistributionInvoiceLine = {
  id?: string;
  material?: DomainEntitiesProcurementDistributionDistributionMaterial;
  uoM?: DomainEntitiesProcurementDistributionDistributionLabel;
  manufacturer?: DomainEntitiesProcurementDistributionDistributionLabel;
  purchaseOrder?: DomainEntitiesProcurementDistributionDistributionOrder;
  expectedQuantity?: number;
  receivedQuantity?: number;
  price?: number;
  priceUoM?: string | null;
  currency?: DomainEntitiesProcurementDistributionDistributionLabel;
};
export type DomainEntitiesProcurementDistributionDistributionSource = {
  quantity?: number;
  shipmentInvoiceItem?: DomainEntitiesProcurementDistributionDistributionInvoiceLine;
};
export type DomainEntitiesProcurementDistributionDistributionShare = {
  department?: DomainEntitiesProcurementDistributionDistributionLabel;
  requisitionItem?: DomainEntitiesProcurementDistributionDistributionRequest;
  quantityRequested?: number;
  quantityAllocated?: number;
  quantityRemaining?: number;
  distributions?:
    DomainEntitiesProcurementDistributionDistributionSource[] | null;
};
export type DomainEntitiesProcurementDistributionDistributionPageSection = {
  material?: DomainEntitiesProcurementDistributionDistributionMaterial;
  totalQuantity?: number;
  uoM?: DomainEntitiesProcurementDistributionDistributionLabel;
  items?: DomainEntitiesProcurementDistributionDistributionShare[] | null;
};
export type DomainEntitiesProcurementDistributionMaterialDistributionPageDto = {
  sections?:
    DomainEntitiesProcurementDistributionDistributionPageSection[] | null;
};
export type DomainEntitiesWarehousesDistributeMaterialRequest = {
  warehouseId?: string;
  materialBatchId?: string;
  uoMId?: string;
  distributedRequisitionItemId?: string;
  quantity?: number;
};
export type DomainEntitiesWarehousesWarehouseType = 0 | 1 | 2 | 3;
export type DomainEntitiesWarehousesWarehouseDto = {
  id?: string;
  name?: string | null;
  description?: string | null;
  type?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  locations?: SharedCollectionItemDto[] | null;
};
export type DomainEntitiesMaterialsBatchBatchStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
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
export type DomainEntitiesWarehousesDistributeMaterialStatus = 0 | 1;
export type DomainEntitiesWarehousesDistributeMaterialDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  warehouse?: DomainEntitiesWarehousesWarehouseDto;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchReducedDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  status?: DomainEntitiesWarehousesDistributeMaterialStatus;
};
export type DomainEntitiesWarehousesDistributeMaterialDtoRead = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  warehouse?: DomainEntitiesWarehousesWarehouseDto;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchReducedDtoRead;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  status?: DomainEntitiesWarehousesDistributeMaterialStatus;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesDistributeMaterialDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesWarehousesDistributeMaterialDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesWarehousesDistributeMaterialDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesWarehousesDistributeMaterialDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export const {
  usePostApiV1ProcurementManufacturerMutation,
  useGetApiV1ProcurementManufacturerQuery,
  useLazyGetApiV1ProcurementManufacturerQuery,
  useGetApiV1ProcurementManufacturerByManufacturerIdQuery,
  useLazyGetApiV1ProcurementManufacturerByManufacturerIdQuery,
  usePutApiV1ProcurementManufacturerByManufacturerIdMutation,
  useDeleteApiV1ProcurementManufacturerByManufacturerIdMutation,
  useGetApiV1ProcurementManufacturerMaterialByMaterialIdQuery,
  useLazyGetApiV1ProcurementManufacturerMaterialByMaterialIdQuery,
  usePostApiV1ProcurementSupplierMutation,
  useGetApiV1ProcurementSupplierQuery,
  useLazyGetApiV1ProcurementSupplierQuery,
  useGetApiV1ProcurementSupplierBySupplierIdQuery,
  useLazyGetApiV1ProcurementSupplierBySupplierIdQuery,
  usePutApiV1ProcurementSupplierBySupplierIdMutation,
  useDeleteApiV1ProcurementSupplierBySupplierIdMutation,
  usePutApiV1ProcurementSupplierBySupplierIdStatusMutation,
  useGetApiV1ProcurementSupplierMaterialByMaterialIdQuery,
  useLazyGetApiV1ProcurementSupplierMaterialByMaterialIdQuery,
  useGetApiV1ProcurementSupplierByMaterialIdAndTypeQuery,
  useLazyGetApiV1ProcurementSupplierByMaterialIdAndTypeQuery,
  usePostApiV1ProcurementPurchaseOrderMutation,
  useGetApiV1ProcurementPurchaseOrderQuery,
  useLazyGetApiV1ProcurementPurchaseOrderQuery,
  useGetApiV1ProcurementPurchaseOrderByPurchaseOrderIdQuery,
  useLazyGetApiV1ProcurementPurchaseOrderByPurchaseOrderIdQuery,
  usePostApiV1ProcurementPurchaseOrderByPurchaseOrderIdMutation,
  usePutApiV1ProcurementPurchaseOrderByPurchaseOrderIdMutation,
  useDeleteApiV1ProcurementPurchaseOrderByPurchaseOrderIdMutation,
  useGetApiV1ProcurementPurchaseOrderRequisitionByPurchaseOrderIdAndMaterialIdQuery,
  useLazyGetApiV1ProcurementPurchaseOrderRequisitionByPurchaseOrderIdAndMaterialIdQuery,
  usePostApiV1ProcurementPurchaseOrderProformaInvoiceByPurchaseOrderIdMutation,
  usePutApiV1ProcurementPurchaseOrderFirstStepByPurchaseOrderIdMutation,
  useDeleteApiV1ProcurementPurchaseOrderByPurchaseOrderIdCancelMutation,
  usePutApiV1ProcurementPurchaseOrderByPurchaseOrderIdReviseMutation,
  usePutApiV1ProcurementPurchaseOrderCheckByPurchaseOrderIdMutation,
  usePostApiV1ProcurementPurchaseOrderInvoiceMutation,
  useGetApiV1ProcurementPurchaseOrderInvoiceQuery,
  useLazyGetApiV1ProcurementPurchaseOrderInvoiceQuery,
  useGetApiV1ProcurementPurchaseOrderInvoiceByInvoiceIdQuery,
  useLazyGetApiV1ProcurementPurchaseOrderInvoiceByInvoiceIdQuery,
  usePutApiV1ProcurementPurchaseOrderInvoiceByInvoiceIdMutation,
  useDeleteApiV1ProcurementPurchaseOrderInvoiceByInvoiceIdMutation,
  usePostApiV1ProcurementBillingSheetMutation,
  useGetApiV1ProcurementBillingSheetQuery,
  useLazyGetApiV1ProcurementBillingSheetQuery,
  useGetApiV1ProcurementBillingSheetByBillingSheetIdQuery,
  useLazyGetApiV1ProcurementBillingSheetByBillingSheetIdQuery,
  usePutApiV1ProcurementBillingSheetByBillingSheetIdMutation,
  useDeleteApiV1ProcurementBillingSheetByBillingSheetIdMutation,
  useGetApiV1ProcurementBillingSheetInvoiceByInvoiceIdQuery,
  useLazyGetApiV1ProcurementBillingSheetInvoiceByInvoiceIdQuery,
  usePutApiV1ProcurementBillingSheetChargeMutation,
  usePostApiV1ProcurementBillingSheetChargeByBillingSheetIdMutation,
  usePostApiV1ProcurementShipmentDocumentMutation,
  useGetApiV1ProcurementShipmentDocumentQuery,
  useLazyGetApiV1ProcurementShipmentDocumentQuery,
  useGetApiV1ProcurementShipmentDocumentByShipmentDocumentIdQuery,
  useLazyGetApiV1ProcurementShipmentDocumentByShipmentDocumentIdQuery,
  usePutApiV1ProcurementShipmentDocumentByShipmentDocumentIdMutation,
  useDeleteApiV1ProcurementShipmentDocumentByShipmentDocumentIdMutation,
  usePostApiV1ProcurementWaybillMutation,
  useGetApiV1ProcurementWaybillQuery,
  useLazyGetApiV1ProcurementWaybillQuery,
  useGetApiV1ProcurementWaybillByWaybillIdQuery,
  useLazyGetApiV1ProcurementWaybillByWaybillIdQuery,
  usePutApiV1ProcurementWaybillByWaybillIdMutation,
  useDeleteApiV1ProcurementWaybillByWaybillIdMutation,
  usePutApiV1ProcurementShipmentDocumentByShipmentDocumentIdArrivedMutation,
  usePutApiV1ProcurementShipmentsByShipmentIdStatusMutation,
  useGetApiV1ProcurementShipmentDocumentArrivedQuery,
  useLazyGetApiV1ProcurementShipmentDocumentArrivedQuery,
  usePostApiV1ProcurementShipmentInvoiceMutation,
  useGetApiV1ProcurementShipmentInvoiceQuery,
  useLazyGetApiV1ProcurementShipmentInvoiceQuery,
  usePostApiV1ProcurementShipmentInvoiceShortageMakeUpMutation,
  useGetApiV1ProcurementShipmentInvoiceByIdQuery,
  useLazyGetApiV1ProcurementShipmentInvoiceByIdQuery,
  useGetApiV1ProcurementShipmentInvoiceUnattachedQuery,
  useLazyGetApiV1ProcurementShipmentInvoiceUnattachedQuery,
  useGetApiV1ProcurementShipmentInvoiceShipmentDocumentByShipmentDocumentIdQuery,
  useLazyGetApiV1ProcurementShipmentInvoiceShipmentDocumentByShipmentDocumentIdQuery,
  usePutApiV1ProcurementShipmentInvoiceByShipmentInvoiceIdMutation,
  useDeleteApiV1ProcurementShipmentInvoiceByShipmentInvoiceIdMutation,
  usePutApiV1ProcurementShipmentInvoicePaidByShipmentInvoiceIdMutation,
  usePutApiV1ProcurementShipmentInvoicePaidMultipleMutation,
  usePostApiV1ProcurementShipmentDiscrepancyMutation,
  useGetApiV1ProcurementShipmentDiscrepancyQuery,
  useLazyGetApiV1ProcurementShipmentDiscrepancyQuery,
  useGetApiV1ProcurementShipmentDiscrepancyLineByDiscrepancyItemIdBalanceQuery,
  useLazyGetApiV1ProcurementShipmentDiscrepancyLineByDiscrepancyItemIdBalanceQuery,
  useGetApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdQuery,
  useLazyGetApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdQuery,
  usePutApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdMutation,
  useDeleteApiV1ProcurementShipmentDiscrepancyByShipmentDiscrepancyIdMutation,
  useGetApiV1ProcurementPurchaseOrderNotLinkedQuery,
  useLazyGetApiV1ProcurementPurchaseOrderNotLinkedQuery,
  useGetApiV1ProcurementPurchaseOrderSupplierBySupplierIdNotLinkedQuery,
  useLazyGetApiV1ProcurementPurchaseOrderSupplierBySupplierIdNotLinkedQuery,
  usePostApiV1ProcurementMaterialsByPurchaseOrdersMutation,
  useGetApiV1ProcurementShipmentDocumentByShipmentDocumentIdMaterialDistributionQuery,
  useLazyGetApiV1ProcurementShipmentDocumentByShipmentDocumentIdMaterialDistributionQuery,
  useGetApiV1ProcurementSupplierBySupplierIdMaterialAndMaterialIdQuery,
  useLazyGetApiV1ProcurementSupplierBySupplierIdMaterialAndMaterialIdQuery,
  useGetApiV1ProcurementSupplierBySupplierIdMaterialQuery,
  useLazyGetApiV1ProcurementSupplierBySupplierIdMaterialQuery,
  usePostApiV1ProcurementDistributeMaterialMutation,
  useGetApiV1ProcurementDistributeMaterialQuery,
  useLazyGetApiV1ProcurementDistributeMaterialQuery,
  useGetApiV1ProcurementDistributeMaterialByDistributeMaterialIdQuery,
  useLazyGetApiV1ProcurementDistributeMaterialByDistributeMaterialIdQuery,
} = injectedRtkApi;
