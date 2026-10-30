import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiV1ProductionOrders: build.mutation<
      PostApiV1ProductionOrdersApiResponse,
      PostApiV1ProductionOrdersApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "production-order", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/production-orders`,
        method: "POST",
        body: queryArg.domainEntitiesProductionOrdersCreateProductionOrderRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionOrders: build.query<
      GetApiV1ProductionOrdersApiResponse,
      GetApiV1ProductionOrdersApiArg
    >({
      providesTags: [{ type: "production-order", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-orders`,
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
    getApiV1ProductionOrdersById: build.query<
      GetApiV1ProductionOrdersByIdApiResponse,
      GetApiV1ProductionOrdersByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "production-order", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/production-orders/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductionOrdersById: build.mutation<
      PutApiV1ProductionOrdersByIdApiResponse,
      PutApiV1ProductionOrdersByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-order", id: "LIST" }, { type: "production-order", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/production-orders/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesProductionOrdersCreateProductionOrderRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProductionOrdersById: build.mutation<
      DeleteApiV1ProductionOrdersByIdApiResponse,
      DeleteApiV1ProductionOrdersByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-order", id: "LIST" }, { type: "production-order", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/production-orders/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProductionOrdersProformaInvoice: build.mutation<
      PostApiV1ProductionOrdersProformaInvoiceApiResponse,
      PostApiV1ProductionOrdersProformaInvoiceApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "production-order/proforma-invoice", id: "LIST" }, { type: "production-order", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/production-orders/proforma-invoice`,
        method: "POST",
        body: queryArg.domainEntitiesProformaInvoicesCreateProformaInvoice,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionOrdersProformaInvoice: build.query<
      GetApiV1ProductionOrdersProformaInvoiceApiResponse,
      GetApiV1ProductionOrdersProformaInvoiceApiArg
    >({
      providesTags: [{ type: "production-order/proforma-invoice", id: "LIST" }, { type: "production-order", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-orders/proforma-invoice`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          proformaInvoiceStatus: queryArg.proformaInvoiceStatus,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          approved: queryArg.approved,
        },
      }),
    }),
    postApiV1ProductionOrdersProformaInvoiceByProformaInvoiceIdCustomer:
      build.mutation<
        PostApiV1ProductionOrdersProformaInvoiceByProformaInvoiceIdCustomerApiResponse,
        PostApiV1ProductionOrdersProformaInvoiceByProformaInvoiceIdCustomerApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-orders/proforma-invoice/${queryArg.proformaInvoiceId}/customer`,
          method: "POST",
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProductionOrdersProformaInvoiceByProformaInvoiceId: build.query<
      GetApiV1ProductionOrdersProformaInvoiceByProformaInvoiceIdApiResponse,
      GetApiV1ProductionOrdersProformaInvoiceByProformaInvoiceIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "production-order/proforma-invoice", id: queryArg.proformaInvoiceId }],
      query: (queryArg) => ({
        url: `/api/v1/production-orders/proforma-invoice/${queryArg.proformaInvoiceId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductionOrdersProformaInvoiceById: build.mutation<
      PutApiV1ProductionOrdersProformaInvoiceByIdApiResponse,
      PutApiV1ProductionOrdersProformaInvoiceByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-order/proforma-invoice", id: "LIST" }, { type: "production-order", id: "LIST" }, { type: "production-order/proforma-invoice", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/production-orders/proforma-invoice/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesProformaInvoicesCreateProformaInvoice,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProductionOrdersProformaInvoiceById: build.mutation<
      DeleteApiV1ProductionOrdersProformaInvoiceByIdApiResponse,
      DeleteApiV1ProductionOrdersProformaInvoiceByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-order/proforma-invoice", id: "LIST" }, { type: "production-order", id: "LIST" }, { type: "production-order/proforma-invoice", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/production-orders/proforma-invoice/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProductionOrdersInvoice: build.mutation<
      PostApiV1ProductionOrdersInvoiceApiResponse,
      PostApiV1ProductionOrdersInvoiceApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "production-order/invoice", id: "LIST" }, { type: "production-order", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/production-orders/invoice`,
        method: "POST",
        body: queryArg.domainEntitiesInvoicesCreateInvoice,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionOrdersInvoice: build.query<
      GetApiV1ProductionOrdersInvoiceApiResponse,
      GetApiV1ProductionOrdersInvoiceApiArg
    >({
      providesTags: [{ type: "production-order/invoice", id: "LIST" }, { type: "production-order", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-orders/invoice`,
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
    getApiV1ProductionOrdersInvoiceById: build.query<
      GetApiV1ProductionOrdersInvoiceByIdApiResponse,
      GetApiV1ProductionOrdersInvoiceByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "production-order/invoice", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/production-orders/invoice/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductionOrdersInvoiceById: build.mutation<
      PutApiV1ProductionOrdersInvoiceByIdApiResponse,
      PutApiV1ProductionOrdersInvoiceByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-order/invoice", id: "LIST" }, { type: "production-order", id: "LIST" }, { type: "production-order/invoice", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/production-orders/invoice/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesInvoicesCreateInvoice,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProductionOrdersInvoiceById: build.mutation<
      DeleteApiV1ProductionOrdersInvoiceByIdApiResponse,
      DeleteApiV1ProductionOrdersInvoiceByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-order/invoice", id: "LIST" }, { type: "production-order", id: "LIST" }, { type: "production-order/invoice", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/production-orders/invoice/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProductionOrdersAllocate: build.mutation<
      PostApiV1ProductionOrdersAllocateApiResponse,
      PostApiV1ProductionOrdersAllocateApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "production-order/allocate", id: "LIST" }, { type: "production-order", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/production-orders/allocate`,
        method: "POST",
        body: queryArg.domainEntitiesProductionOrdersAllocateProductionOrderRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionOrdersAllocate: build.query<
      GetApiV1ProductionOrdersAllocateApiResponse,
      GetApiV1ProductionOrdersAllocateApiArg
    >({
      providesTags: [{ type: "production-order/allocate", id: "LIST" }, { type: "production-order", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-orders/allocate`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          productionOrderId: queryArg.productionOrderId,
          approved: queryArg.approved,
        },
      }),
    }),
    getApiV1ProductionOrdersAllocateByAllocateProductionOrderId: build.query<
      GetApiV1ProductionOrdersAllocateByAllocateProductionOrderIdApiResponse,
      GetApiV1ProductionOrdersAllocateByAllocateProductionOrderIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "production-order/allocate", id: queryArg.allocateProductionOrderId }],
      query: (queryArg) => ({
        url: `/api/v1/production-orders/allocate/${queryArg.allocateProductionOrderId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductionOrdersAllocateByAllocateProductionOrderId: build.mutation<
      PutApiV1ProductionOrdersAllocateByAllocateProductionOrderIdApiResponse,
      PutApiV1ProductionOrdersAllocateByAllocateProductionOrderIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-order/allocate", id: "LIST" }, { type: "production-order", id: "LIST" }, { type: "production-order/allocate", id: queryArg.allocateProductionOrderId }]),
      query: (queryArg) => ({
        url: `/api/v1/production-orders/allocate/${queryArg.allocateProductionOrderId}`,
        method: "PUT",
        body: queryArg.domainEntitiesProductionOrdersAllocateProductionOrderRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductionOrdersDeliverByAllocateProductionOrderId: build.mutation<
      PutApiV1ProductionOrdersDeliverByAllocateProductionOrderIdApiResponse,
      PutApiV1ProductionOrdersDeliverByAllocateProductionOrderIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-order/deliver", id: "LIST" }, { type: "production-order", id: "LIST" }, { type: "production-order/deliver", id: queryArg.allocateProductionOrderId }]),
      query: (queryArg) => ({
        url: `/api/v1/production-orders/deliver/${queryArg.allocateProductionOrderId}`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductionOrdersLoadByAllocateProductionOrderId: build.mutation<
      PutApiV1ProductionOrdersLoadByAllocateProductionOrderIdApiResponse,
      PutApiV1ProductionOrdersLoadByAllocateProductionOrderIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-order/load", id: "LIST" }, { type: "production-order", id: "LIST" }, { type: "production-order/load", id: queryArg.allocateProductionOrderId }]),
      query: (queryArg) => ({
        url: `/api/v1/production-orders/load/${queryArg.allocateProductionOrderId}`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProductionOrdersByAllocateProductionOrderIdWaybill: build.mutation<
      PostApiV1ProductionOrdersByAllocateProductionOrderIdWaybillApiResponse,
      PostApiV1ProductionOrdersByAllocateProductionOrderIdWaybillApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-order", id: "LIST" }, { type: "production-order", id: queryArg.allocateProductionOrderId }]),
      query: (queryArg) => ({
        url: `/api/v1/production-orders/${queryArg.allocateProductionOrderId}/waybill`,
        method: "POST",
        body: queryArg.domainEntitiesProductionOrdersCreateProductionOrderWaybill,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionOrdersWaybill: build.query<
      GetApiV1ProductionOrdersWaybillApiResponse,
      GetApiV1ProductionOrdersWaybillApiArg
    >({
      providesTags: [{ type: "production-order/waybill", id: "LIST" }, { type: "production-order", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-orders/waybill`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          allocateProductionOrderId: queryArg.allocateProductionOrderId,
        },
      }),
    }),
    getApiV1ProductionOrdersWaybillByProductionOrderWaybillId: build.query<
      GetApiV1ProductionOrdersWaybillByProductionOrderWaybillIdApiResponse,
      GetApiV1ProductionOrdersWaybillByProductionOrderWaybillIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "production-order/waybill", id: queryArg.productionOrderWaybillId }],
      query: (queryArg) => ({
        url: `/api/v1/production-orders/waybill/${queryArg.productionOrderWaybillId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProductionOrdersWaybillByAllocateProductionOrderIdCustomer:
      build.mutation<
        PostApiV1ProductionOrdersWaybillByAllocateProductionOrderIdCustomerApiResponse,
        PostApiV1ProductionOrdersWaybillByAllocateProductionOrderIdCustomerApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-orders/waybill/${queryArg.allocateProductionOrderId}/customer`,
          method: "POST",
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getProductionStepRecords: build.query<
      GetProductionStepRecordsApiResponse,
      GetProductionStepRecordsApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "production-schedule/activity", id: queryArg.activityId }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/activity/${queryArg.activityId}/step/${queryArg.stepId}/records`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProductionSchedule: build.mutation<
      PostApiV1ProductionScheduleApiResponse,
      PostApiV1ProductionScheduleApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "production-schedule", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule`,
        method: "POST",
        body: queryArg.domainEntitiesProductionSchedulesCreateProductionScheduleRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionSchedule: build.query<
      GetApiV1ProductionScheduleApiResponse,
      GetApiV1ProductionScheduleApiArg
    >({
      providesTags: [{ type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule`,
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
    getApiV1ProductionScheduleByScheduleId: build.query<
      GetApiV1ProductionScheduleByScheduleIdApiResponse,
      GetApiV1ProductionScheduleByScheduleIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "production-schedule", id: queryArg.scheduleId }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/${queryArg.scheduleId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductionScheduleByScheduleId: build.mutation<
      PutApiV1ProductionScheduleByScheduleIdApiResponse,
      PutApiV1ProductionScheduleByScheduleIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-schedule", id: "LIST" }, { type: "production-schedule", id: queryArg.scheduleId }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/${queryArg.scheduleId}`,
        method: "PUT",
        body: queryArg.domainEntitiesProductionSchedulesUpdateProductionScheduleRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProductionScheduleByScheduleId: build.mutation<
      DeleteApiV1ProductionScheduleByScheduleIdApiResponse,
      DeleteApiV1ProductionScheduleByScheduleIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-schedule", id: "LIST" }, { type: "production-schedule", id: queryArg.scheduleId }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/${queryArg.scheduleId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionScheduleProductionScheduleProductByProductionScheduleProductId:
      build.query<
        GetApiV1ProductionScheduleProductionScheduleProductByProductionScheduleProductIdApiResponse,
        GetApiV1ProductionScheduleProductionScheduleProductByProductionScheduleProductIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/production-schedule-product/${queryArg.productionScheduleProductId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    putApiV1ProductionScheduleByScheduleIdAddProducts: build.mutation<
      PutApiV1ProductionScheduleByScheduleIdAddProductsApiResponse,
      PutApiV1ProductionScheduleByScheduleIdAddProductsApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-schedule", id: "LIST" }, { type: "production-schedule", id: queryArg.scheduleId }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/${queryArg.scheduleId}/add-products`,
        method: "PUT",
        body: queryArg.domainEntitiesProductionSchedulesAddProductsToScheduleRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProductionScheduleProductByProductionScheduleProductId:
      build.mutation<
        DeleteApiV1ProductionScheduleProductByProductionScheduleProductIdApiResponse,
        DeleteApiV1ProductionScheduleProductByProductionScheduleProductIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/product/${queryArg.productionScheduleProductId}`,
          method: "DELETE",
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProductionScheduleProductionStatus: build.query<
      GetApiV1ProductionScheduleProductionStatusApiResponse,
      GetApiV1ProductionScheduleProductionStatusApiArg
    >({
      providesTags: [{ type: "production-schedule/production-status", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/production-status`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionScheduleByScheduleIdDetails: build.query<
      GetApiV1ProductionScheduleByScheduleIdDetailsApiResponse,
      GetApiV1ProductionScheduleByScheduleIdDetailsApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "production-schedule", id: queryArg.scheduleId }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/${queryArg.scheduleId}/details`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionScheduleMaterialStockByProductionScheduleProductId:
      build.query<
        GetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdApiResponse,
        GetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/material-stock/${queryArg.productionScheduleProductId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
          params: {
            status: queryArg.status,
          },
        }),
      }),
    getApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductId:
      build.query<
        GetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdApiResponse,
        GetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/package-material-stock/${queryArg.productionScheduleProductId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
          params: {
            status: queryArg.status,
          },
        }),
      }),
    getApiV1ProductionScheduleByProductionScheduleProductIdMaterialsWithInsufficientStock:
      build.query<
        GetApiV1ProductionScheduleByProductionScheduleProductIdMaterialsWithInsufficientStockApiResponse,
        GetApiV1ProductionScheduleByProductionScheduleProductIdMaterialsWithInsufficientStockApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/${queryArg.productionScheduleProductId}/materials-with-insufficient-stock`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProductionScheduleByProductionScheduleProductIdPackageMaterialsWithInsufficientStock:
      build.query<
        GetApiV1ProductionScheduleByProductionScheduleProductIdPackageMaterialsWithInsufficientStockApiResponse,
        GetApiV1ProductionScheduleByProductionScheduleProductIdPackageMaterialsWithInsufficientStockApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/${queryArg.productionScheduleProductId}/package-materials-with-insufficient-stock`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postApiV1ProductionScheduleActivityStartByProductionScheduleProductId:
      build.mutation<
        PostApiV1ProductionScheduleActivityStartByProductionScheduleProductIdApiResponse,
        PostApiV1ProductionScheduleActivityStartByProductionScheduleProductIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/activity/start/${queryArg.productionScheduleProductId}`,
          method: "POST",
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProductionScheduleActivity: build.query<
      GetApiV1ProductionScheduleActivityApiResponse,
      GetApiV1ProductionScheduleActivityApiArg
    >({
      providesTags: [{ type: "production-schedule/activity", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/activity`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          userIds: queryArg.userIds,
          status: queryArg.status,
          pageSize: queryArg.pageSize,
          page: queryArg.page,
          sortLabel: queryArg.sortLabel,
          sortDirection: queryArg.sortDirection,
        },
      }),
    }),
    getApiV1ProductionScheduleActivityByProductionActivityId: build.query<
      GetApiV1ProductionScheduleActivityByProductionActivityIdApiResponse,
      GetApiV1ProductionScheduleActivityByProductionActivityIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "production-schedule/activity", id: queryArg.productionActivityId }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/activity/${queryArg.productionActivityId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionScheduleActivityProductByProductionScheduleProductId:
      build.query<
        GetApiV1ProductionScheduleActivityProductByProductionScheduleProductIdApiResponse,
        GetApiV1ProductionScheduleActivityProductByProductionScheduleProductIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/activity/product/${queryArg.productionScheduleProductId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProductionScheduleActivityStatusGrouped: build.query<
      GetApiV1ProductionScheduleActivityStatusGroupedApiResponse,
      GetApiV1ProductionScheduleActivityStatusGroupedApiArg
    >({
      providesTags: [{ type: "production-schedule/activity", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/activity/status-grouped`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionScheduleActivityOperationGrouped: build.query<
      GetApiV1ProductionScheduleActivityOperationGroupedApiResponse,
      GetApiV1ProductionScheduleActivityOperationGroupedApiArg
    >({
      providesTags: [{ type: "production-schedule/activity", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/activity/operation-grouped`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          departmentId: queryArg.departmentId,
        },
      }),
    }),
    putApiV1ProductionScheduleActivityStepByProductionStepIdStatus:
      build.mutation<
        PutApiV1ProductionScheduleActivityStepByProductionStepIdStatusApiResponse,
        PutApiV1ProductionScheduleActivityStepByProductionStepIdStatusApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/activity-step/${queryArg.productionStepId}/status`,
          method: "PUT",
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
          params: {
            status: queryArg.status,
          },
        }),
      }),
    getApiV1ProductionScheduleActivityStep: build.query<
      GetApiV1ProductionScheduleActivityStepApiResponse,
      GetApiV1ProductionScheduleActivityStepApiArg
    >({
      providesTags: [{ type: "production-schedule/activity-step", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/activity-step`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          userIds: queryArg.userIds,
          status: queryArg.status,
          pageSize: queryArg.pageSize,
          page: queryArg.page,
          sortLabel: queryArg.sortLabel,
          sortDirection: queryArg.sortDirection,
        },
      }),
    }),
    getApiV1ProductionScheduleActivityStepByProductionActivityStepId:
      build.query<
        GetApiV1ProductionScheduleActivityStepByProductionActivityStepIdApiResponse,
        GetApiV1ProductionScheduleActivityStepByProductionActivityStepIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/activity-step/${queryArg.productionActivityStepId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProductionScheduleActivityStepStatusGrouped: build.query<
      GetApiV1ProductionScheduleActivityStepStatusGroupedApiResponse,
      GetApiV1ProductionScheduleActivityStepStatusGroupedApiArg
    >({
      providesTags: [{ type: "production-schedule/activity-step", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/activity-step/status-grouped`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionScheduleActivityStepOperationGrouped: build.query<
      GetApiV1ProductionScheduleActivityStepOperationGroupedApiResponse,
      GetApiV1ProductionScheduleActivityStepOperationGroupedApiArg
    >({
      providesTags: [{ type: "production-schedule/activity-step", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/activity-step/operation-grouped`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProductionScheduleManufacturing: build.mutation<
      PostApiV1ProductionScheduleManufacturingApiResponse,
      PostApiV1ProductionScheduleManufacturingApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "production-schedule/manufacturing", id: "LIST" }, { type: "production-schedule", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/manufacturing`,
        method: "POST",
        body: queryArg.domainEntitiesProductsProductionCreateBatchManufacturingRecord,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionScheduleManufacturing: build.query<
      GetApiV1ProductionScheduleManufacturingApiResponse,
      GetApiV1ProductionScheduleManufacturingApiArg
    >({
      providesTags: [{ type: "production-schedule/manufacturing", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/manufacturing`,
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
    getApiV1ProductionScheduleManufacturingProductByProductionScheduleProductId:
      build.query<
        GetApiV1ProductionScheduleManufacturingProductByProductionScheduleProductIdApiResponse,
        GetApiV1ProductionScheduleManufacturingProductByProductionScheduleProductIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/manufacturing/product/${queryArg.productionScheduleProductId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postApiV1ProductionScheduleFinishedGoodsTransferNoteQuantity:
      build.mutation<
        PostApiV1ProductionScheduleFinishedGoodsTransferNoteQuantityApiResponse,
        PostApiV1ProductionScheduleFinishedGoodsTransferNoteQuantityApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/finished-goods-transfer-note/quantity`,
          method: "POST",
          body: queryArg.domainEntitiesMaterialsBatchCreateFinishedGoodsTransferNoteQuantityRequest,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProductionScheduleFinishedGoodsTransferNoteBmrQuantityByBatchManufacturingRecordId:
      build.query<
        GetApiV1ProductionScheduleFinishedGoodsTransferNoteBmrQuantityByBatchManufacturingRecordIdApiResponse,
        GetApiV1ProductionScheduleFinishedGoodsTransferNoteBmrQuantityByBatchManufacturingRecordIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/finished-goods-transfer-note/bmr-quantity/${queryArg.batchManufacturingRecordId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postApiV1ProductionScheduleFinishedGoodsTransferNote: build.mutation<
      PostApiV1ProductionScheduleFinishedGoodsTransferNoteApiResponse,
      PostApiV1ProductionScheduleFinishedGoodsTransferNoteApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "production-schedule/finished-goods-transfer-note", id: "LIST" }, { type: "production-schedule", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/finished-goods-transfer-note`,
        method: "POST",
        body: queryArg.domainEntitiesMaterialsBatchCreateFinishedGoodsTransferNoteRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionScheduleFinishedGoodsTransferNote: build.query<
      GetApiV1ProductionScheduleFinishedGoodsTransferNoteApiResponse,
      GetApiV1ProductionScheduleFinishedGoodsTransferNoteApiArg
    >({
      providesTags: [{ type: "production-schedule/finished-goods-transfer-note", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/finished-goods-transfer-note`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          division: queryArg.division,
          onlyApproved: queryArg.onlyApproved,
          partial: queryArg.partial,
          fulfilled: queryArg.fulfilled,
        },
      }),
    }),
    getApiV1ProductionScheduleFinishedGoodsTransferNoteById: build.query<
      GetApiV1ProductionScheduleFinishedGoodsTransferNoteByIdApiResponse,
      GetApiV1ProductionScheduleFinishedGoodsTransferNoteByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "production-schedule/finished-goods-transfer-note", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/finished-goods-transfer-note/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionScheduleFinishedGoodsTransferNoteBmrByBatchManufacturingRecordId:
      build.query<
        GetApiV1ProductionScheduleFinishedGoodsTransferNoteBmrByBatchManufacturingRecordIdApiResponse,
        GetApiV1ProductionScheduleFinishedGoodsTransferNoteBmrByBatchManufacturingRecordIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/finished-goods-transfer-note/bmr/${queryArg.batchManufacturingRecordId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProductionScheduleFinishedGoodsTransferNoteByProductIdProduct:
      build.query<
        GetApiV1ProductionScheduleFinishedGoodsTransferNoteByProductIdProductApiResponse,
        GetApiV1ProductionScheduleFinishedGoodsTransferNoteByProductIdProductApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/finished-goods-transfer-note/${queryArg.productId}/product`,
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
    putApiV1ProductionScheduleById: build.mutation<
      PutApiV1ProductionScheduleByIdApiResponse,
      PutApiV1ProductionScheduleByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-schedule", id: "LIST" }, { type: "production-schedule", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesMaterialsBatchCreateFinishedGoodsTransferNoteRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionScheduleManufacturingByBatchManufacturingRecordId:
      build.query<
        GetApiV1ProductionScheduleManufacturingByBatchManufacturingRecordIdApiResponse,
        GetApiV1ProductionScheduleManufacturingByBatchManufacturingRecordIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/manufacturing/${queryArg.batchManufacturingRecordId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    putApiV1ProductionScheduleManufacturingById: build.mutation<
      PutApiV1ProductionScheduleManufacturingByIdApiResponse,
      PutApiV1ProductionScheduleManufacturingByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-schedule/manufacturing", id: "LIST" }, { type: "production-schedule", id: "LIST" }, { type: "production-schedule/manufacturing", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/manufacturing/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesProductsProductionUpdateBatchManufacturingRecord,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductionScheduleManufacturingIssueById: build.mutation<
      PutApiV1ProductionScheduleManufacturingIssueByIdApiResponse,
      PutApiV1ProductionScheduleManufacturingIssueByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-schedule/manufacturing", id: "LIST" }, { type: "production-schedule", id: "LIST" }, { type: "production-schedule/manufacturing", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/manufacturing/issue/${queryArg.id}`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProductionSchedulePackaging: build.mutation<
      PostApiV1ProductionSchedulePackagingApiResponse,
      PostApiV1ProductionSchedulePackagingApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "production-schedule/packaging", id: "LIST" }, { type: "production-schedule", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/packaging`,
        method: "POST",
        body: queryArg.domainEntitiesProductsProductionCreateBatchPackagingRecord,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionSchedulePackaging: build.query<
      GetApiV1ProductionSchedulePackagingApiResponse,
      GetApiV1ProductionSchedulePackagingApiArg
    >({
      providesTags: [{ type: "production-schedule/packaging", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/packaging`,
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
    getApiV1ProductionSchedulePackagingById: build.query<
      GetApiV1ProductionSchedulePackagingByIdApiResponse,
      GetApiV1ProductionSchedulePackagingByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "production-schedule/packaging", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/packaging/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductionSchedulePackagingById: build.mutation<
      PutApiV1ProductionSchedulePackagingByIdApiResponse,
      PutApiV1ProductionSchedulePackagingByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-schedule/packaging", id: "LIST" }, { type: "production-schedule", id: "LIST" }, { type: "production-schedule/packaging", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/packaging/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesProductsProductionUpdateBatchPackagingRecord,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductionSchedulePackagingIssueById: build.mutation<
      PutApiV1ProductionSchedulePackagingIssueByIdApiResponse,
      PutApiV1ProductionSchedulePackagingIssueByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-schedule/packaging", id: "LIST" }, { type: "production-schedule", id: "LIST" }, { type: "production-schedule/packaging", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/packaging/issue/${queryArg.id}`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProductionScheduleStockTransfer: build.mutation<
      PostApiV1ProductionScheduleStockTransferApiResponse,
      PostApiV1ProductionScheduleStockTransferApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "production-schedule/stock-transfer", id: "LIST" }, { type: "production-schedule", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/stock-transfer`,
        method: "POST",
        body: queryArg.domainEntitiesProductionSchedulesStockTransfersRequestCreateStockTransferRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionScheduleStockTransfer: build.query<
      GetApiV1ProductionScheduleStockTransferApiResponse,
      GetApiV1ProductionScheduleStockTransferApiArg
    >({
      providesTags: [{ type: "production-schedule/stock-transfer", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/stock-transfer`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          fromDepartmentId: queryArg.fromDepartmentId,
          toDepartmentId: queryArg.toDepartmentId,
          materialId: queryArg.materialId,
        },
      }),
    }),
    getApiV1ProductionScheduleStockTransferUser: build.query<
      GetApiV1ProductionScheduleStockTransferUserApiResponse,
      GetApiV1ProductionScheduleStockTransferUserApiArg
    >({
      providesTags: [{ type: "production-schedule/stock-transfer", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/stock-transfer/user`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
          toDepartmentId: queryArg.toDepartmentId,
        },
      }),
    }),
    getApiV1ProductionScheduleStockTransferInBound: build.query<
      GetApiV1ProductionScheduleStockTransferInBoundApiResponse,
      GetApiV1ProductionScheduleStockTransferInBoundApiArg
    >({
      providesTags: [{ type: "production-schedule/stock-transfer", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/stock-transfer/in-bound`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
          toDepartmentId: queryArg.toDepartmentId,
        },
      }),
    }),
    getApiV1ProductionScheduleStockTransferOutBound: build.query<
      GetApiV1ProductionScheduleStockTransferOutBoundApiResponse,
      GetApiV1ProductionScheduleStockTransferOutBoundApiArg
    >({
      providesTags: [{ type: "production-schedule/stock-transfer", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/stock-transfer/out-bound`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
          fromDepartmentId: queryArg.fromDepartmentId,
        },
      }),
    }),
    getApiV1ProductionScheduleStockTransferByStockTransferId: build.query<
      GetApiV1ProductionScheduleStockTransferByStockTransferIdApiResponse,
      GetApiV1ProductionScheduleStockTransferByStockTransferIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "production-schedule/stock-transfer", id: queryArg.stockTransferId }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/stock-transfer/${queryArg.stockTransferId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductionScheduleStockTransferApproveByStockTransferId:
      build.mutation<
        PutApiV1ProductionScheduleStockTransferApproveByStockTransferIdApiResponse,
        PutApiV1ProductionScheduleStockTransferApproveByStockTransferIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/stock-transfer/approve/${queryArg.stockTransferId}`,
          method: "PUT",
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    putApiV1ProductionScheduleStockTransferRejectByStockTransferId:
      build.mutation<
        PutApiV1ProductionScheduleStockTransferRejectByStockTransferIdApiResponse,
        PutApiV1ProductionScheduleStockTransferRejectByStockTransferIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/stock-transfer/reject/${queryArg.stockTransferId}`,
          method: "PUT",
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProductionScheduleStockTransferBatchByStockTransferId: build.query<
      GetApiV1ProductionScheduleStockTransferBatchByStockTransferIdApiResponse,
      GetApiV1ProductionScheduleStockTransferBatchByStockTransferIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "production-schedule/stock-transfer", id: queryArg.stockTransferId }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/stock-transfer/batch/${queryArg.stockTransferId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductionScheduleStockTransferIssueByStockTransferId:
      build.mutation<
        PutApiV1ProductionScheduleStockTransferIssueByStockTransferIdApiResponse,
        PutApiV1ProductionScheduleStockTransferIssueByStockTransferIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/stock-transfer/issue/${queryArg.stockTransferId}`,
          method: "PUT",
          body: queryArg.body,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postApiV1ProductionScheduleFinalPacking: build.mutation<
      PostApiV1ProductionScheduleFinalPackingApiResponse,
      PostApiV1ProductionScheduleFinalPackingApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "production-schedule/final-packing", id: "LIST" }, { type: "production-schedule", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/final-packing`,
        method: "POST",
        body: queryArg.domainEntitiesProductionSchedulesPackingCreateFinalPacking,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionScheduleFinalPacking: build.query<
      GetApiV1ProductionScheduleFinalPackingApiResponse,
      GetApiV1ProductionScheduleFinalPackingApiArg
    >({
      providesTags: [{ type: "production-schedule/final-packing", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/final-packing`,
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
    getApiV1ProductionScheduleFinalPackingByFinalPackingId: build.query<
      GetApiV1ProductionScheduleFinalPackingByFinalPackingIdApiResponse,
      GetApiV1ProductionScheduleFinalPackingByFinalPackingIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "production-schedule/final-packing", id: queryArg.finalPackingId }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/final-packing/${queryArg.finalPackingId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ProductionScheduleFinalPackingByFinalPackingId: build.mutation<
      PutApiV1ProductionScheduleFinalPackingByFinalPackingIdApiResponse,
      PutApiV1ProductionScheduleFinalPackingByFinalPackingIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-schedule/final-packing", id: "LIST" }, { type: "production-schedule", id: "LIST" }, { type: "production-schedule/final-packing", id: queryArg.finalPackingId }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/final-packing/${queryArg.finalPackingId}`,
        method: "PUT",
        body: queryArg.domainEntitiesProductionSchedulesPackingCreateFinalPacking,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProductionScheduleFinalPackingByFinalPackingId: build.mutation<
      DeleteApiV1ProductionScheduleFinalPackingByFinalPackingIdApiResponse,
      DeleteApiV1ProductionScheduleFinalPackingByFinalPackingIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "production-schedule/final-packing", id: "LIST" }, { type: "production-schedule", id: "LIST" }, { type: "production-schedule/final-packing", id: queryArg.finalPackingId }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/final-packing/${queryArg.finalPackingId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionScheduleFinalPackingProductByProductionScheduleProductId:
      build.query<
        GetApiV1ProductionScheduleFinalPackingProductByProductionScheduleProductIdApiResponse,
        GetApiV1ProductionScheduleFinalPackingProductByProductionScheduleProductIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/final-packing/product/${queryArg.productionScheduleProductId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProductionScheduleStockRequisitionRawByProductionScheduleProductId:
      build.query<
        GetApiV1ProductionScheduleStockRequisitionRawByProductionScheduleProductIdApiResponse,
        GetApiV1ProductionScheduleStockRequisitionRawByProductionScheduleProductIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/stock-requisition/raw/${queryArg.productionScheduleProductId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductId:
      build.query<
        GetApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductIdApiResponse,
        GetApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/stock-requisition/package/${queryArg.productionScheduleProductId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postApiV1ProductionScheduleReturnBeforeProduction: build.mutation<
      PostApiV1ProductionScheduleReturnBeforeProductionApiResponse,
      PostApiV1ProductionScheduleReturnBeforeProductionApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "production-schedule/return-before-production", id: "LIST" }, { type: "production-schedule", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/return-before-production`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          productionScheduleProductId: queryArg.productionScheduleProductId,
          reason: queryArg.reason,
        },
      }),
    }),
    postApiV1ProductionScheduleReturnAfterProduction: build.mutation<
      PostApiV1ProductionScheduleReturnAfterProductionApiResponse,
      PostApiV1ProductionScheduleReturnAfterProductionApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "production-schedule/return-after-production", id: "LIST" }, { type: "production-schedule", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/return-after-production`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          productionScheduleProductId: queryArg.productionScheduleProductId,
        },
      }),
    }),
    getApiV1ProductionScheduleMaterialReturnNote: build.query<
      GetApiV1ProductionScheduleMaterialReturnNoteApiResponse,
      GetApiV1ProductionScheduleMaterialReturnNoteApiArg
    >({
      providesTags: [{ type: "production-schedule/material-return-note", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/material-return-note`,
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
    getApiV1ProductionScheduleMaterialReturnNoteByMaterialReturnNoteId:
      build.query<
        GetApiV1ProductionScheduleMaterialReturnNoteByMaterialReturnNoteIdApiResponse,
        GetApiV1ProductionScheduleMaterialReturnNoteByMaterialReturnNoteIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/material-return-note/${queryArg.materialReturnNoteId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    putApiV1ProductionScheduleMaterialReturnNoteCompleteByMaterialReturnNoteId:
      build.mutation<
        PutApiV1ProductionScheduleMaterialReturnNoteCompleteByMaterialReturnNoteIdApiResponse,
        PutApiV1ProductionScheduleMaterialReturnNoteCompleteByMaterialReturnNoteIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/material-return-note/complete/${queryArg.materialReturnNoteId}`,
          method: "PUT",
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postApiV1ProductionScheduleExtraPackingByProductionScheduleProductId:
      build.mutation<
        PostApiV1ProductionScheduleExtraPackingByProductionScheduleProductIdApiResponse,
        PostApiV1ProductionScheduleExtraPackingByProductionScheduleProductIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/extra-packing/${queryArg.productionScheduleProductId}`,
          method: "POST",
          body: queryArg.body,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProductionScheduleExtraPacking: build.query<
      GetApiV1ProductionScheduleExtraPackingApiResponse,
      GetApiV1ProductionScheduleExtraPackingApiArg
    >({
      providesTags: [{ type: "production-schedule/extra-packing", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/extra-packing`,
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
    getApiV1ProductionScheduleExtraPackingByProductionExtraPackingId:
      build.query<
        GetApiV1ProductionScheduleExtraPackingByProductionExtraPackingIdApiResponse,
        GetApiV1ProductionScheduleExtraPackingByProductionExtraPackingIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/extra-packing/${queryArg.productionExtraPackingId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductId:
      build.query<
        GetApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductIdApiResponse,
        GetApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/extra-packing/by-product/${queryArg.productionScheduleProductId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProductionScheduleExtraPackingBatchesToSupplyByExtraPackingMaterialId:
      build.query<
        GetApiV1ProductionScheduleExtraPackingBatchesToSupplyByExtraPackingMaterialIdApiResponse,
        GetApiV1ProductionScheduleExtraPackingBatchesToSupplyByExtraPackingMaterialIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/extra-packing/batches-to-supply/${queryArg.extraPackingMaterialId}`,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postApiV1ProductionScheduleExtraPackingApproveByProductionExtraPackingId:
      build.mutation<
        PostApiV1ProductionScheduleExtraPackingApproveByProductionExtraPackingIdApiResponse,
        PostApiV1ProductionScheduleExtraPackingApproveByProductionExtraPackingIdApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/production-schedule/extra-packing/approve/${queryArg.productionExtraPackingId}`,
          method: "POST",
          body: queryArg.body,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProductionScheduleApprovedProducts: build.query<
      GetApiV1ProductionScheduleApprovedProductsApiResponse,
      GetApiV1ProductionScheduleApprovedProductsApiArg
    >({
      providesTags: [{ type: "production-schedule/approved-product", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/approved-products`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionScheduleApprovedProductsProductByProductId: build.query<
      GetApiV1ProductionScheduleApprovedProductsProductByProductIdApiResponse,
      GetApiV1ProductionScheduleApprovedProductsProductByProductIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "production-schedule/approved-product", id: queryArg.productId }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/approved-products/product/${queryArg.productId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionScheduleApprovedProductsByProductId: build.query<
      GetApiV1ProductionScheduleApprovedProductsByProductIdApiResponse,
      GetApiV1ProductionScheduleApprovedProductsByProductIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "production-schedule/approved-product", id: queryArg.productId }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/approved-products/${queryArg.productId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProductionScheduleSummaryReport: build.query<
      GetApiV1ProductionScheduleSummaryReportApiResponse,
      GetApiV1ProductionScheduleSummaryReportApiArg
    >({
      providesTags: [{ type: "production-schedule/summary-report", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/summary-report`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          productId: queryArg.productId,
          marketTypeId: queryArg.marketTypeId,
        },
      }),
    }),
    getApiV1ProductionScheduleDetailedReport: build.query<
      GetApiV1ProductionScheduleDetailedReportApiResponse,
      GetApiV1ProductionScheduleDetailedReportApiArg
    >({
      providesTags: [{ type: "production-schedule/detailed-report", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/detailed-report`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          startDate: queryArg.startDate,
          endDate: queryArg.endDate,
          productId: queryArg.productId,
          marketTypeId: queryArg.marketTypeId,
        },
      }),
    }),
    getApiV1ProductionScheduleForecast: build.query<
      GetApiV1ProductionScheduleForecastApiResponse,
      GetApiV1ProductionScheduleForecastApiArg
    >({
      providesTags: [{ type: "production-schedule/forecast", id: "LIST" }, { type: "production-schedule", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/production-schedule/forecast`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          productId: queryArg.productId,
          numberOfBatches: queryArg.numberOfBatches,
          productPackingId: queryArg.productPackingId,
          batchSize: queryArg.batchSize,
        },
      }),
    }),
    postApiV1WorkOrder: build.mutation<
      PostApiV1WorkOrderApiResponse,
      PostApiV1WorkOrderApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "work-order", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/work-order`,
        method: "POST",
        body: queryArg.domainEntitiesWorkOrdersCreateWorkOrderRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          userId: queryArg.userId,
        },
      }),
    }),
    getApiV1WorkOrderByWorkOrderId: build.query<
      GetApiV1WorkOrderByWorkOrderIdApiResponse,
      GetApiV1WorkOrderByWorkOrderIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "work-order", id: queryArg.workOrderId }],
      query: (queryArg) => ({
        url: `/api/v1/work-order/${queryArg.workOrderId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1WorkOrderByWorkOrderId: build.mutation<
      PutApiV1WorkOrderByWorkOrderIdApiResponse,
      PutApiV1WorkOrderByWorkOrderIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "work-order", id: "LIST" }, { type: "work-order", id: queryArg.workOrderId }]),
      query: (queryArg) => ({
        url: `/api/v1/work-order/${queryArg.workOrderId}`,
        method: "PUT",
        body: queryArg.domainEntitiesWorkOrdersUpdateWorkOrderRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          userId: queryArg.userId,
        },
      }),
    }),
    deleteApiV1WorkOrderByWorkOrderId: build.mutation<
      DeleteApiV1WorkOrderByWorkOrderIdApiResponse,
      DeleteApiV1WorkOrderByWorkOrderIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "work-order", id: "LIST" }, { type: "work-order", id: queryArg.workOrderId }]),
      query: (queryArg) => ({
        url: `/api/v1/work-order/${queryArg.workOrderId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          userId: queryArg.userId,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as productionApi };
export type PostApiV1ProductionOrdersApiResponse = /** status 200 OK */ string;
export type PostApiV1ProductionOrdersApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductionOrdersCreateProductionOrderRequest: DomainEntitiesProductionOrdersCreateProductionOrderRequest;
};
export type GetApiV1ProductionOrdersApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductionOrdersProductionOrderDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductionOrdersApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesProductionOrdersProductionOrderStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionOrdersByIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductionOrdersProductionOrderDetailDto;
export type GetApiV1ProductionOrdersByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProductionOrdersByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesProductionOrdersProductionOrderDto;
export type PutApiV1ProductionOrdersByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductionOrdersCreateProductionOrderRequest: DomainEntitiesProductionOrdersCreateProductionOrderRequest;
};
export type DeleteApiV1ProductionOrdersByIdApiResponse = void;
export type DeleteApiV1ProductionOrdersByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductionOrdersProformaInvoiceApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ProductionOrdersProformaInvoiceApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProformaInvoicesCreateProformaInvoice: DomainEntitiesProformaInvoicesCreateProformaInvoice;
};
export type GetApiV1ProductionOrdersProformaInvoiceApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProformaInvoicesProformaInvoiceDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductionOrdersProformaInvoiceApiArg = {
  proformaInvoiceStatus?: DomainEntitiesProformaInvoicesProformaInvoiceStatus;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  approved?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductionOrdersProformaInvoiceByProformaInvoiceIdCustomerApiResponse = void;
export type PostApiV1ProductionOrdersProformaInvoiceByProformaInvoiceIdCustomerApiArg =
  {
    proformaInvoiceId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProductionOrdersProformaInvoiceByProformaInvoiceIdApiResponse =
  /** status 200 OK */ DomainEntitiesProformaInvoicesProformaInvoiceDto;
export type GetApiV1ProductionOrdersProformaInvoiceByProformaInvoiceIdApiArg = {
  proformaInvoiceId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProductionOrdersProformaInvoiceByIdApiResponse = void;
export type PutApiV1ProductionOrdersProformaInvoiceByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProformaInvoicesCreateProformaInvoice: DomainEntitiesProformaInvoicesCreateProformaInvoice;
};
export type DeleteApiV1ProductionOrdersProformaInvoiceByIdApiResponse = void;
export type DeleteApiV1ProductionOrdersProformaInvoiceByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductionOrdersInvoiceApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ProductionOrdersInvoiceApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesInvoicesCreateInvoice: DomainEntitiesInvoicesCreateInvoice;
};
export type GetApiV1ProductionOrdersInvoiceApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesInvoicesInvoiceDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductionOrdersInvoiceApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionOrdersInvoiceByIdApiResponse =
  /** status 200 OK */ DomainEntitiesInvoicesInvoiceDto;
export type GetApiV1ProductionOrdersInvoiceByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProductionOrdersInvoiceByIdApiResponse = void;
export type PutApiV1ProductionOrdersInvoiceByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesInvoicesCreateInvoice: DomainEntitiesInvoicesCreateInvoice;
};
export type DeleteApiV1ProductionOrdersInvoiceByIdApiResponse = void;
export type DeleteApiV1ProductionOrdersInvoiceByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductionOrdersAllocateApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ProductionOrdersAllocateApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductionOrdersAllocateProductionOrderRequest: DomainEntitiesProductionOrdersAllocateProductionOrderRequest;
};
export type GetApiV1ProductionOrdersAllocateApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericList601DomainEntitiesProductionOrdersAllocateProductionOrderDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductionOrdersAllocateApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  productionOrderId?: string;
  approved?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionOrdersAllocateByAllocateProductionOrderIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductionOrdersAllocateProductionOrderDto;
export type GetApiV1ProductionOrdersAllocateByAllocateProductionOrderIdApiArg =
  {
    allocateProductionOrderId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PutApiV1ProductionOrdersAllocateByAllocateProductionOrderIdApiResponse = void;
export type PutApiV1ProductionOrdersAllocateByAllocateProductionOrderIdApiArg =
  {
    allocateProductionOrderId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesProductionOrdersAllocateProductionOrderRequest: DomainEntitiesProductionOrdersAllocateProductionOrderRequest;
  };
export type PutApiV1ProductionOrdersDeliverByAllocateProductionOrderIdApiResponse = void;
export type PutApiV1ProductionOrdersDeliverByAllocateProductionOrderIdApiArg = {
  allocateProductionOrderId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProductionOrdersLoadByAllocateProductionOrderIdApiResponse = void;
export type PutApiV1ProductionOrdersLoadByAllocateProductionOrderIdApiArg = {
  allocateProductionOrderId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductionOrdersByAllocateProductionOrderIdWaybillApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ProductionOrdersByAllocateProductionOrderIdWaybillApiArg =
  {
    allocateProductionOrderId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesProductionOrdersCreateProductionOrderWaybill: DomainEntitiesProductionOrdersCreateProductionOrderWaybill;
  };
export type GetApiV1ProductionOrdersWaybillApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductionOrdersProductionOrderWaybillDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductionOrdersWaybillApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  allocateProductionOrderId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionOrdersWaybillByProductionOrderWaybillIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductionOrdersProductionOrderWaybillDto;
export type GetApiV1ProductionOrdersWaybillByProductionOrderWaybillIdApiArg = {
  productionOrderWaybillId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductionOrdersWaybillByAllocateProductionOrderIdCustomerApiResponse = void;
export type PostApiV1ProductionOrdersWaybillByAllocateProductionOrderIdCustomerApiArg =
  {
    allocateProductionOrderId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetProductionStepRecordsApiResponse =
  /** status 200 OK */ DomainEntitiesProductsProductionProductionStepRecordsDtoRead;
export type GetProductionStepRecordsApiArg = {
  activityId: string;
  stepId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductionScheduleApiResponse =
  /** status 201 Created */ string;
export type PostApiV1ProductionScheduleApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateProductionScheduleRequest object. */
  domainEntitiesProductionSchedulesCreateProductionScheduleRequest: DomainEntitiesProductionSchedulesCreateProductionScheduleRequest;
};
export type GetApiV1ProductionScheduleApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductionSchedulesProductionScheduleDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductionScheduleApiArg = {
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
export type GetApiV1ProductionScheduleByScheduleIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductionSchedulesProductionScheduleDto;
export type GetApiV1ProductionScheduleByScheduleIdApiArg = {
  /** The ID of the Production Schedule. */
  scheduleId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProductionScheduleByScheduleIdApiResponse = void;
export type PutApiV1ProductionScheduleByScheduleIdApiArg = {
  /** The ID of the Production Schedule to be updated. */
  scheduleId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The UpdateProductionScheduleRequest object containing updated data. */
  domainEntitiesProductionSchedulesUpdateProductionScheduleRequest: DomainEntitiesProductionSchedulesUpdateProductionScheduleRequest;
};
export type DeleteApiV1ProductionScheduleByScheduleIdApiResponse = void;
export type DeleteApiV1ProductionScheduleByScheduleIdApiArg = {
  /** The ID of the Production Schedule to be deleted. */
  scheduleId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleProductionScheduleProductByProductionScheduleProductIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductionSchedulesProductionScheduleProductDto;
export type GetApiV1ProductionScheduleProductionScheduleProductByProductionScheduleProductIdApiArg =
  {
    productionScheduleProductId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PutApiV1ProductionScheduleByScheduleIdAddProductsApiResponse = void;
export type PutApiV1ProductionScheduleByScheduleIdAddProductsApiArg = {
  /** The ID of the Production Schedule. */
  scheduleId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The AddProductsToScheduleRequest object. */
  domainEntitiesProductionSchedulesAddProductsToScheduleRequest: DomainEntitiesProductionSchedulesAddProductsToScheduleRequest;
};
export type DeleteApiV1ProductionScheduleProductByProductionScheduleProductIdApiResponse = void;
export type DeleteApiV1ProductionScheduleProductByProductionScheduleProductIdApiArg =
  {
    /** The ID of the Production Schedule Product to be removed. */
    productionScheduleProductId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProductionScheduleProductionStatusApiResponse =
  /** status 200 Returns the list of production status */ SharedRequestsTypeResponse[];
export type GetApiV1ProductionScheduleProductionStatusApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleByScheduleIdDetailsApiResponse =
  /** status 200 OK */ DomainEntitiesProductionSchedulesProductionScheduleProcurementDto[];
export type GetApiV1ProductionScheduleByScheduleIdDetailsApiArg = {
  /** The ID of the Production Schedule. */
  scheduleId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductionSchedulesProductionScheduleProcurementDto[];
export type GetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdApiArg =
  {
    productionScheduleProductId: string;
    status?: DomainEntitiesProductionSchedulesMaterialRequisitionStatus;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductionSchedulesProductionScheduleProcurementPackageDto[];
export type GetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdApiArg =
  {
    productionScheduleProductId: string;
    status?: DomainEntitiesProductionSchedulesMaterialRequisitionStatus;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProductionScheduleByProductionScheduleProductIdMaterialsWithInsufficientStockApiResponse =
  /** status 200 OK */ DomainEntitiesProductionSchedulesProductionScheduleProcurementDto[];
export type GetApiV1ProductionScheduleByProductionScheduleProductIdMaterialsWithInsufficientStockApiArg =
  {
    /** The production schedule product id */
    productionScheduleProductId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProductionScheduleByProductionScheduleProductIdPackageMaterialsWithInsufficientStockApiResponse =
  /** status 200 OK */ DomainEntitiesProductionSchedulesProductionScheduleProcurementPackageDto[];
export type GetApiV1ProductionScheduleByProductionScheduleProductIdPackageMaterialsWithInsufficientStockApiArg =
  {
    /** The production schdeule product Id */
    productionScheduleProductId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PostApiV1ProductionScheduleActivityStartByProductionScheduleProductIdApiResponse =
  /** status 201 Created */ string;
export type PostApiV1ProductionScheduleActivityStartByProductionScheduleProductIdApiArg =
  {
    /** the production schedule product id */
    productionScheduleProductId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProductionScheduleActivityApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductsProductionProductionActivityDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductionScheduleActivityApiArg = {
  userIds?: string[];
  status?: DomainEntitiesBaseProductionStatus;
  pageSize?: number;
  page?: number;
  sortLabel?: string;
  sortDirection?: SharedSortDirection;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleActivityByProductionActivityIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductsProductionProductionActivityDto;
export type GetApiV1ProductionScheduleActivityByProductionActivityIdApiArg = {
  /** The ID of the Production Activity. */
  productionActivityId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleActivityProductByProductionScheduleProductIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductsProductionProductionActivityDto;
export type GetApiV1ProductionScheduleActivityProductByProductionScheduleProductIdApiArg =
  {
    /** The production schedule prdocut */
    productionScheduleProductId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProductionScheduleActivityStatusGroupedApiResponse =
  /** status 200 OK */ {
    [key: string]: DomainEntitiesProductsProductionProductionActivityDto[];
  };
export type GetApiV1ProductionScheduleActivityStatusGroupedApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleActivityOperationGroupedApiResponse =
  /** status 200 OK */ DomainEntitiesProductsProductionProductionActivityGroupResultDto[];
export type GetApiV1ProductionScheduleActivityOperationGroupedApiArg = {
  departmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProductionScheduleActivityStepByProductionStepIdStatusApiResponse = void;
export type PutApiV1ProductionScheduleActivityStepByProductionStepIdStatusApiArg =
  {
    /** The ID of the Production Step. */
    productionStepId: string;
    /** The new status to set. */
    status?: DomainEntitiesBaseProductionStatus;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProductionScheduleActivityStepApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductsProductionProductionActivityStepDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductionScheduleActivityStepApiArg = {
  userIds?: string[];
  status?: DomainEntitiesBaseProductionStatus;
  pageSize?: number;
  page?: number;
  sortLabel?: string;
  sortDirection?: SharedSortDirection;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleActivityStepByProductionActivityStepIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductsProductionProductionActivityStepDto;
export type GetApiV1ProductionScheduleActivityStepByProductionActivityStepIdApiArg =
  {
    /** The ID of the Production Activity Step. */
    productionActivityStepId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProductionScheduleActivityStepStatusGroupedApiResponse =
  /** status 200 OK */ {
    [key: string]: DomainEntitiesProductsProductionProductionActivityStepDto[];
  };
export type GetApiV1ProductionScheduleActivityStepStatusGroupedApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleActivityStepOperationGroupedApiResponse =
  /** status 200 OK */ {
    [key: string]: DomainEntitiesProductsProductionProductionActivityStepDto[];
  };
export type GetApiV1ProductionScheduleActivityStepOperationGroupedApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductionScheduleManufacturingApiResponse =
  /** status 201 Created */ string;
export type PostApiV1ProductionScheduleManufacturingApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductsProductionCreateBatchManufacturingRecord: DomainEntitiesProductsProductionCreateBatchManufacturingRecord;
};
export type GetApiV1ProductionScheduleManufacturingApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductsProductionBatchManufacturingRecordDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductionScheduleManufacturingApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleManufacturingProductByProductionScheduleProductIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductsProductionBatchManufacturingRecordDto;
export type GetApiV1ProductionScheduleManufacturingProductByProductionScheduleProductIdApiArg =
  {
    productionScheduleProductId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PostApiV1ProductionScheduleFinishedGoodsTransferNoteQuantityApiResponse = void;
export type PostApiV1ProductionScheduleFinishedGoodsTransferNoteQuantityApiArg =
  {
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesMaterialsBatchCreateFinishedGoodsTransferNoteQuantityRequest: DomainEntitiesMaterialsBatchCreateFinishedGoodsTransferNoteQuantityRequest;
  };
export type GetApiV1ProductionScheduleFinishedGoodsTransferNoteBmrQuantityByBatchManufacturingRecordIdApiResponse =
  /** status 201 Created */ number;
export type GetApiV1ProductionScheduleFinishedGoodsTransferNoteBmrQuantityByBatchManufacturingRecordIdApiArg =
  {
    batchManufacturingRecordId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PostApiV1ProductionScheduleFinishedGoodsTransferNoteApiResponse = void;
export type PostApiV1ProductionScheduleFinishedGoodsTransferNoteApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesMaterialsBatchCreateFinishedGoodsTransferNoteRequest: DomainEntitiesMaterialsBatchCreateFinishedGoodsTransferNoteRequest;
};
export type GetApiV1ProductionScheduleFinishedGoodsTransferNoteApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductionScheduleFinishedGoodsTransferNoteApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  division?: DomainEntitiesProductsDivision;
  onlyApproved?: boolean;
  partial?: boolean;
  fulfilled?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleFinishedGoodsTransferNoteByIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteDto;
export type GetApiV1ProductionScheduleFinishedGoodsTransferNoteByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleFinishedGoodsTransferNoteBmrByBatchManufacturingRecordIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteDto[];
export type GetApiV1ProductionScheduleFinishedGoodsTransferNoteBmrByBatchManufacturingRecordIdApiArg =
  {
    batchManufacturingRecordId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProductionScheduleFinishedGoodsTransferNoteByProductIdProductApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductionScheduleFinishedGoodsTransferNoteByProductIdProductApiArg =
  {
    productId: string;
    page?: number;
    pageSize?: number;
    searchQuery?: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PutApiV1ProductionScheduleByIdApiResponse = void;
export type PutApiV1ProductionScheduleByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesMaterialsBatchCreateFinishedGoodsTransferNoteRequest: DomainEntitiesMaterialsBatchCreateFinishedGoodsTransferNoteRequest;
};
export type GetApiV1ProductionScheduleManufacturingByBatchManufacturingRecordIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductsProductionBatchManufacturingRecordDto;
export type GetApiV1ProductionScheduleManufacturingByBatchManufacturingRecordIdApiArg =
  {
    batchManufacturingRecordId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PutApiV1ProductionScheduleManufacturingByIdApiResponse = void;
export type PutApiV1ProductionScheduleManufacturingByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductsProductionUpdateBatchManufacturingRecord: DomainEntitiesProductsProductionUpdateBatchManufacturingRecord;
};
export type PutApiV1ProductionScheduleManufacturingIssueByIdApiResponse = void;
export type PutApiV1ProductionScheduleManufacturingIssueByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductionSchedulePackagingApiResponse =
  /** status 201 Created */ string;
export type PostApiV1ProductionSchedulePackagingApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductsProductionCreateBatchPackagingRecord: DomainEntitiesProductsProductionCreateBatchPackagingRecord;
};
export type GetApiV1ProductionSchedulePackagingApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductsProductionBatchPackagingRecordDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductionSchedulePackagingApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionSchedulePackagingByIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductsProductionBatchPackagingRecordDto;
export type GetApiV1ProductionSchedulePackagingByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProductionSchedulePackagingByIdApiResponse = void;
export type PutApiV1ProductionSchedulePackagingByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductsProductionUpdateBatchPackagingRecord: DomainEntitiesProductsProductionUpdateBatchPackagingRecord;
};
export type PutApiV1ProductionSchedulePackagingIssueByIdApiResponse = void;
export type PutApiV1ProductionSchedulePackagingIssueByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductionScheduleStockTransferApiResponse =
  /** status 201 Created */ string;
export type PostApiV1ProductionScheduleStockTransferApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesProductionSchedulesStockTransfersRequestCreateStockTransferRequest: DomainEntitiesProductionSchedulesStockTransfersRequestCreateStockTransferRequest;
};
export type GetApiV1ProductionScheduleStockTransferApiResponse =
  /** status 200 OK */ DomainEntitiesProductionSchedulesStockTransfersStockTransferDto[];
export type GetApiV1ProductionScheduleStockTransferApiArg = {
  fromDepartmentId?: string;
  toDepartmentId?: string;
  materialId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleStockTransferUserApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductionSchedulesStockTransfersStockTransferDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductionScheduleStockTransferUserApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesProductionSchedulesStockTransfersStockTransferStatus;
  toDepartmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleStockTransferInBoundApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductionSchedulesStockTransfersDepartmentStockTransferDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductionScheduleStockTransferInBoundApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesProductionSchedulesStockTransfersStockTransferStatus;
  toDepartmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleStockTransferOutBoundApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductionSchedulesStockTransfersDepartmentStockTransferDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductionScheduleStockTransferOutBoundApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesProductionSchedulesStockTransfersStockTransferStatus;
  fromDepartmentId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleStockTransferByStockTransferIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductionSchedulesStockTransfersDepartmentStockTransferDto;
export type GetApiV1ProductionScheduleStockTransferByStockTransferIdApiArg = {
  stockTransferId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProductionScheduleStockTransferApproveByStockTransferIdApiResponse = void;
export type PutApiV1ProductionScheduleStockTransferApproveByStockTransferIdApiArg =
  {
    stockTransferId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PutApiV1ProductionScheduleStockTransferRejectByStockTransferIdApiResponse = void;
export type PutApiV1ProductionScheduleStockTransferRejectByStockTransferIdApiArg =
  {
    stockTransferId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProductionScheduleStockTransferBatchByStockTransferIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsBatchBatchToSupplyRead[];
export type GetApiV1ProductionScheduleStockTransferBatchByStockTransferIdApiArg =
  {
    stockTransferId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PutApiV1ProductionScheduleStockTransferIssueByStockTransferIdApiResponse = void;
export type PutApiV1ProductionScheduleStockTransferIssueByStockTransferIdApiArg =
  {
    stockTransferId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    body: DomainEntitiesProductionSchedulesStockTransfersRequestBatchTransferRequest[];
  };
export type PostApiV1ProductionScheduleFinalPackingApiResponse =
  /** status 201 Created */ string;
export type PostApiV1ProductionScheduleFinalPackingApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateFinalPacking object. */
  domainEntitiesProductionSchedulesPackingCreateFinalPacking: DomainEntitiesProductionSchedulesPackingCreateFinalPacking;
};
export type GetApiV1ProductionScheduleFinalPackingApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductionSchedulesPackingFinalPackingDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProductionScheduleFinalPackingApiArg = {
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
export type GetApiV1ProductionScheduleFinalPackingByFinalPackingIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductionSchedulesPackingFinalPackingDto;
export type GetApiV1ProductionScheduleFinalPackingByFinalPackingIdApiArg = {
  /** The ID of the Final Packing. */
  finalPackingId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProductionScheduleFinalPackingByFinalPackingIdApiResponse = void;
export type PutApiV1ProductionScheduleFinalPackingByFinalPackingIdApiArg = {
  /** The ID of the Final Packing to be updated. */
  finalPackingId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateFinalPacking object containing updated data. */
  domainEntitiesProductionSchedulesPackingCreateFinalPacking: DomainEntitiesProductionSchedulesPackingCreateFinalPacking;
};
export type DeleteApiV1ProductionScheduleFinalPackingByFinalPackingIdApiResponse = void;
export type DeleteApiV1ProductionScheduleFinalPackingByFinalPackingIdApiArg = {
  /** The ID of the Final Packing to be deleted. */
  finalPackingId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleFinalPackingProductByProductionScheduleProductIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductionSchedulesPackingFinalPackingDto;
export type GetApiV1ProductionScheduleFinalPackingProductByProductionScheduleProductIdApiArg =
  {
    /** The production schedule product id */
    productionScheduleProductId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProductionScheduleStockRequisitionRawByProductionScheduleProductIdApiResponse =
  /** status 200 OK */ DomainEntitiesRequisitionsRequisitionDtoRead;
export type GetApiV1ProductionScheduleStockRequisitionRawByProductionScheduleProductIdApiArg =
  {
    /** The production schedule product id */
    productionScheduleProductId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductIdApiResponse =
  /** status 200 OK */ DomainEntitiesRequisitionsRequisitionDtoRead;
export type GetApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductIdApiArg =
  {
    /** The production schedule prdouct id */
    productionScheduleProductId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PostApiV1ProductionScheduleReturnBeforeProductionApiResponse = void;
export type PostApiV1ProductionScheduleReturnBeforeProductionApiArg = {
  /** The prdocution schedlue product id */
  productionScheduleProductId?: string;
  /** The reason for cancelling the production */
  reason?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProductionScheduleReturnAfterProductionApiResponse = void;
export type PostApiV1ProductionScheduleReturnAfterProductionApiArg = {
  /** The production schedule product id */
  productionScheduleProductId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The list of partially used materials to return. */
  body: DomainEntitiesMaterialsPartialMaterialToReturn[];
};
export type GetApiV1ProductionScheduleMaterialReturnNoteApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialReturnNoteDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1ProductionScheduleMaterialReturnNoteApiArg = {
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
export type GetApiV1ProductionScheduleMaterialReturnNoteByMaterialReturnNoteIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsMaterialReturnNoteDtoRead;
export type GetApiV1ProductionScheduleMaterialReturnNoteByMaterialReturnNoteIdApiArg =
  {
    /** The ID of the Material Return Note. */
    materialReturnNoteId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PutApiV1ProductionScheduleMaterialReturnNoteCompleteByMaterialReturnNoteIdApiResponse = void;
export type PutApiV1ProductionScheduleMaterialReturnNoteCompleteByMaterialReturnNoteIdApiArg =
  {
    /** The ID of the Material Return Note. */
    materialReturnNoteId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PostApiV1ProductionScheduleExtraPackingByProductionScheduleProductIdApiResponse = void;
export type PostApiV1ProductionScheduleExtraPackingByProductionScheduleProductIdApiArg =
  {
    /** The production schedule product id */
    productionScheduleProductId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    /** List of Extra Packing details to create. */
    body: DomainEntitiesProductionSchedulesCreateProductionExtraPacking[];
  };
export type GetApiV1ProductionScheduleExtraPackingApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductionSchedulesProductionExtraPackingWithBatchesDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1ProductionScheduleExtraPackingApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering results. */
  searchQuery?: string;
  /** The kind of material */
  kind?: DomainEntitiesMaterialsMaterialKind;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleExtraPackingByProductionExtraPackingIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductionSchedulesProductionExtraPackingWithBatchesDtoRead;
export type GetApiV1ProductionScheduleExtraPackingByProductionExtraPackingIdApiArg =
  {
    /** The ID of the Extra Packing. */
    productionExtraPackingId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductIdApiResponse =
  /** status 200 OK */ DomainEntitiesProductionSchedulesProductionExtraPackingWithBatchesDtoRead[];
export type GetApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductIdApiArg =
  {
    /** The production schedule product id */
    productionScheduleProductId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProductionScheduleExtraPackingBatchesToSupplyByExtraPackingMaterialIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsBatchBatchToSupplyRead[];
export type GetApiV1ProductionScheduleExtraPackingBatchesToSupplyByExtraPackingMaterialIdApiArg =
  {
    /** The ID of the Extra Packing Material. */
    extraPackingMaterialId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PostApiV1ProductionScheduleExtraPackingApproveByProductionExtraPackingIdApiResponse = void;
export type PostApiV1ProductionScheduleExtraPackingApproveByProductionExtraPackingIdApiArg =
  {
    /** The ID of the Extra Packing. */
    productionExtraPackingId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    /** The list of batches for approval. */
    body: DomainEntitiesProductionSchedulesStockTransfersRequestBatchTransferRequest[];
  };
export type GetApiV1ProductionScheduleApprovedProductsApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsBatchApprovedProductDto[];
export type GetApiV1ProductionScheduleApprovedProductsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleApprovedProductsProductByProductIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsBatchApprovedProductDetailDto;
export type GetApiV1ProductionScheduleApprovedProductsProductByProductIdApiArg =
  {
    productId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProductionScheduleApprovedProductsByProductIdApiResponse =
  /** status 200 OK */ DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteDto[];
export type GetApiV1ProductionScheduleApprovedProductsByProductIdApiArg = {
  productId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleSummaryReportApiResponse =
  /** status 200 OK */ DomainEntitiesProductionSchedulesProductionScheduleReportDtoRead[];
export type GetApiV1ProductionScheduleSummaryReportApiArg = {
  startDate?: string;
  endDate?: string;
  productId?: string;
  marketTypeId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleDetailedReportApiResponse =
  /** status 200 OK */ DomainEntitiesProductionSchedulesProductionScheduleDetailedReportDtoRead[];
export type GetApiV1ProductionScheduleDetailedReportApiArg = {
  startDate?: string;
  endDate?: string;
  productId?: string;
  marketTypeId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProductionScheduleForecastApiResponse =
  /** status 200 OK */ DomainEntitiesProductionSchedulesForecastMaterialDtoRead[];
export type GetApiV1ProductionScheduleForecastApiArg = {
  productId?: string;
  numberOfBatches?: number;
  productPackingId?: string;
  batchSize?: DomainEntitiesProductionSchedulesBatchSize;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1WorkOrderApiResponse = /** status 201 Created */ string;
export type PostApiV1WorkOrderApiArg = {
  /** The ID of the user creating the work order. */
  userId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateWorkOrderRequest object. */
  domainEntitiesWorkOrdersCreateWorkOrderRequest: DomainEntitiesWorkOrdersCreateWorkOrderRequest;
};
export type GetApiV1WorkOrderByWorkOrderIdApiResponse =
  /** status 200 OK */ DomainEntitiesWorkOrdersWorkOrderDto;
export type GetApiV1WorkOrderByWorkOrderIdApiArg = {
  /** The ID of the work order. */
  workOrderId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1WorkOrderByWorkOrderIdApiResponse = void;
export type PutApiV1WorkOrderByWorkOrderIdApiArg = {
  /** The ID of the work order to be updated. */
  workOrderId: string;
  /** The ID of the user performing the update. */
  userId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The UpdateWorkOrderRequest object containing updated work order data. */
  domainEntitiesWorkOrdersUpdateWorkOrderRequest: DomainEntitiesWorkOrdersUpdateWorkOrderRequest;
};
export type DeleteApiV1WorkOrderByWorkOrderIdApiResponse = void;
export type DeleteApiV1WorkOrderByWorkOrderIdApiArg = {
  /** The ID of the work order to be deleted. */
  workOrderId: string;
  /** The ID of the user performing the deletion. */
  userId?: string;
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
export type DomainEntitiesProductionOrdersCreateProductionOrderProduct = {
  productId?: string;
  totalOrderQuantity?: number;
  volumePerPiece?: number;
  productPackingId?: string | null;
  shippers?: number;
  loose?: number;
};
export type DomainEntitiesProductionOrdersCreateProductionOrderRequest = {
  code?: string | null;
  customerId: string;
  products?:
    DomainEntitiesProductionOrdersCreateProductionOrderProduct[] | null;
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
export type DomainEntitiesBaseTermsOfPaymentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
  dueDays?: number | null;
};
export type DomainEntitiesCustomersCustomerType = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesCurrenciesCurrencyDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isBaseCurrency?: boolean;
};
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
export type DomainEntitiesProductionOrdersProductionOrderProductQuantityDto = {
  quantity?: number;
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
export type DomainEntitiesProductionOrdersProductionOrderProductsDto = {
  product?: DomainEntitiesProductsProductListDto;
  totalOrderQuantity?: number;
  volumePerPiece?: number;
  uoMId?: string | null;
  unitPrice?: number | null;
  discountPercent?: number;
  totalVolume?: number;
  totalBatches?: number;
  totalValue?: number;
  fulfilledQuantities?:
    DomainEntitiesProductionOrdersProductionOrderProductQuantityDto[] | null;
  fulfilled?: boolean;
  remainingQuantity?: number;
  productPacking?: DomainEntitiesProductsProductPackingDto;
  shippers?: number;
  loose?: number;
};
export type DomainEntitiesProductionOrdersProductionOrderStatus = 0 | 1 | 2;
export type DomainEntitiesProductionOrdersProductionOrderDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  customer?: DomainEntitiesCustomersCustomerDto;
  products?: DomainEntitiesProductionOrdersProductionOrderProductsDto[] | null;
  totalValue?: number;
  status?: DomainEntitiesProductionOrdersProductionOrderStatus;
  approved?: boolean;
  promisedDeliveryDate?: string | null;
  deliveredAt?: string | null;
  sourceCustomerQuotationId?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductionOrdersProductionOrderDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProductionOrdersProductionOrderDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesProductionOrdersProductionOrderInvoiceItemDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  product?: DomainEntitiesProductsProductListDto;
  quantity?: number;
};
export type DomainEntitiesProductionOrdersProductionOrderInvoiceDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  productionOrder?: SharedCollectionItemDto;
  items?: DomainEntitiesProductionOrdersProductionOrderInvoiceItemDto[] | null;
};
export type DomainEntitiesProductionOrdersProductionOrderDetailDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  customer?: DomainEntitiesCustomersCustomerDto;
  products?: DomainEntitiesProductionOrdersProductionOrderProductsDto[] | null;
  totalValue?: number;
  status?: DomainEntitiesProductionOrdersProductionOrderStatus;
  approved?: boolean;
  promisedDeliveryDate?: string | null;
  deliveredAt?: string | null;
  sourceCustomerQuotationId?: string | null;
  invoice?: DomainEntitiesProductionOrdersProductionOrderInvoiceDto;
};
export type DomainEntitiesProformaInvoicesCreateProformaInvoiceProduct = {
  productId?: string;
  quantity?: number;
};
export type DomainEntitiesProformaInvoicesCreateProformaInvoice = {
  code?: string | null;
  allocateProductionOrderId?: string;
  products?:
    DomainEntitiesProformaInvoicesCreateProformaInvoiceProduct[] | null;
};
export type DomainEntitiesProductionOrdersProductionOrderListDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  customer?: DomainEntitiesCustomersCustomerDto;
  totalValue?: number;
  status?: DomainEntitiesProductionOrdersProductionOrderStatus;
  approved?: boolean;
  promisedDeliveryDate?: string | null;
  deliveredAt?: string | null;
  sourceCustomerQuotationId?: string | null;
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
export type DomainEntitiesProductionSchedulesBatchSize = 0 | 1;
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
export type DomainEntitiesAttachmentsAttachmentDto = {
  link?: string | null;
  name?: string | null;
  id?: string;
  reference?: string | null;
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
export type DomainEntitiesProductsProductionBatchPackagingRecordDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  productionScheduleProductDto?: DomainEntitiesProductionSchedulesProductionScheduleProductDto;
  batchNumber?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  productPacking?: DomainEntitiesProductsProductPackingDto;
  batchQuantity?: number;
};
export type DomainEntitiesProductionOrdersAllocateProductQuantityDto = {
  finishedGoodsTransferNote?: DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteDto;
  batchPackagingRecord?: DomainEntitiesProductsProductionBatchPackagingRecordDto;
  quantity?: number;
};
export type DomainEntitiesProductionOrdersAllocateProductionOrderProductDto = {
  product?: DomainEntitiesProductsProductListDto;
  productPacking?: DomainEntitiesProductsProductPackingDto;
  fulfilledQuantities?:
    DomainEntitiesProductionOrdersAllocateProductQuantityDto[] | null;
};
export type DomainEntitiesProductionOrdersAllocateProductionOrderStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesProductionOrdersAllocateProductionOrderDto = {
  id?: string;
  productionOrder?: DomainEntitiesProductionOrdersProductionOrderListDto;
  invoiceCode?: string | null;
  approved?: boolean;
  products?:
    DomainEntitiesProductionOrdersAllocateProductionOrderProductDto[] | null;
  status?: DomainEntitiesProductionOrdersAllocateProductionOrderStatus;
  loadedAt?: string | null;
  deliveredAt?: string | null;
  createdAt?: string;
  hasInvoice?: boolean;
  hasWayBill?: boolean;
};
export type DomainEntitiesProformaInvoicesProformaInvoiceStatus = 0 | 1 | 2;
export type DomainEntitiesProformaInvoicesProformaInvoiceProductDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  product?: DomainEntitiesProductsProductListDto;
  quantity?: number;
};
export type DomainEntitiesProformaInvoicesProformaInvoiceDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  allocateProductionOrder?: DomainEntitiesProductionOrdersAllocateProductionOrderDto;
  status?: DomainEntitiesProformaInvoicesProformaInvoiceStatus;
  products?: DomainEntitiesProformaInvoicesProformaInvoiceProductDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProformaInvoicesProformaInvoiceDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProformaInvoicesProformaInvoiceDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesInvoicesCreateInvoiceAmount = {
  currencyId?: string;
  amount?: number;
};
export type DomainEntitiesInvoicesCreateInvoice = {
  proformaInvoiceId?: string;
  customerId?: string;
  termsOfPaymentId?: string | null;
  amounts?: DomainEntitiesInvoicesCreateInvoiceAmount[] | null;
};
export type DomainEntitiesInvoicesInvoiceStatus = 0 | 1;
export type DomainEntitiesInvoicesInvoiceAmountDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
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
export type DomainEntitiesInvoicesInvoiceDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  proformaInvoice?: DomainEntitiesProformaInvoicesProformaInvoiceDto;
  customer?: DomainEntitiesCustomersCustomerDto;
  status?: DomainEntitiesInvoicesInvoiceStatus;
  termsOfPayment?: DomainEntitiesBaseTermsOfPaymentDto;
  dueDate?: string | null;
  amounts?: DomainEntitiesInvoicesInvoiceAmountDto[] | null;
  balances?: DomainEntitiesPaymentsPayableBalanceDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesInvoicesInvoiceDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesInvoicesInvoiceDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesProductionOrdersAllocateProductQuantityRequest = {
  finishedGoodsTransferNoteId?: string;
  quantity?: number;
};
export type DomainEntitiesProductionOrdersAllocateProductionOrderProductRequest =
  {
    productId?: string;
    productPackingId: string;
    fulfilledQuantities?:
      DomainEntitiesProductionOrdersAllocateProductQuantityRequest[] | null;
  };
export type DomainEntitiesProductionOrdersAllocateProductionOrderRequest = {
  productionOrderId?: string;
  products?:
    | DomainEntitiesProductionOrdersAllocateProductionOrderProductRequest[]
    | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericList601DomainEntitiesProductionOrdersAllocateProductionOrderDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProductionOrdersAllocateProductionOrderDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesProductionOrdersCreateProductionOrderWaybill = {
  code?: string | null;
  comment?: string | null;
};
export type DomainEntitiesProductionOrdersProductionOrderWaybillDto = {
  id?: string;
  code?: string | null;
  allocateProductionOrder?: DomainEntitiesProductionOrdersAllocateProductionOrderDto;
  comment?: string | null;
  createdAt?: string;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductionOrdersProductionOrderWaybillDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProductionOrdersProductionOrderWaybillDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesAnalyticalTestRequestsAnalyticalTestStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type DomainEntitiesAnalyticalTestRequestsAnalyticalTestRequestDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecordDto;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductDto;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStepDto;
  manufacturingDate?: string;
  expiryDate?: string;
  filled?: string | null;
  releasedAt?: string | null;
  sampledQuantity?: string | null;
  stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  state?: SharedCollectionItemDto;
  status?: DomainEntitiesAnalyticalTestRequestsAnalyticalTestStatus;
  numberOfContainers?: number;
  sampledBy?: DomainEntitiesUsersUserDto;
  releasedBy?: DomainEntitiesUsersUserDto;
  sampledAt?: string | null;
  acknowledgedBy?: DomainEntitiesUsersUserDto;
  acknowledgedAt?: string | null;
  assignedAt?: string | null;
  arNumber?: string | null;
  assignees?: DomainEntitiesUsersUserDto[] | null;
  issueNumber?: string | null;
  issuedAt?: string | null;
  issuedBy?: DomainEntitiesUsersUserDto;
  isRetest?: boolean;
};
export type DomainEntitiesProductsProductionProductionStepAnalysisDto = {
  request?: DomainEntitiesAnalyticalTestRequestsAnalyticalTestRequestDto;
  chemicalArdId?: string | null;
  microbialArdId?: string | null;
  microbialRequired?: boolean;
  testedAt?: string | null;
  testedBy?: SharedCollectionItemDto;
};
export type DomainEntitiesRequisitionsRequisitionType = 0 | 1 | 2;
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
export type DomainEntitiesProductsProductionProductionStepExtraMaterialDto = {
  id?: string;
  material?: SharedCollectionItemDto;
  unit?: SharedCollectionItemDto;
  quantity?: number;
  status?: number;
  approved?: boolean;
  createdAt?: string;
  createdBy?: SharedCollectionItemDto;
  issuedAt?: string | null;
  issuedBy?: SharedCollectionItemDto;
};
export type DomainEntitiesProductionSchedulesPackingFinalPackingMaterialDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  material?: DomainEntitiesMaterialsMaterialDto;
  receivedQuantity?: number;
  subsequentDeliveredQuantity?: number;
  totalReceivedQuantity?: number;
  packedQuantity?: number;
  returnedQuantity?: number;
  rejectedQuantity?: number;
  sampledQuantity?: number;
  totalAccountedForQuantity?: number;
  percentageLoss?: number;
  percentageVarianceDescription?: string | null;
};
export type DomainEntitiesProductionSchedulesPackingFinalPackingDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductDto;
  materials?:
    DomainEntitiesProductionSchedulesPackingFinalPackingMaterialDto[] | null;
  numberOfBottlesPerShipper?: number;
  nUmberOfFullShipperPacked?: number;
  leftOver?: number;
  batchSize?: number;
  averageVolumeFilledPerBottle?: number;
  productPacking?: DomainEntitiesProductsProductPackingDto;
  expectedYield?: number;
  totalQuantityPacked?: number;
  qualityControlAnalyticalSample?: number;
  retainedSamples?: number;
  stabilitySamples?: number;
  totalNumberOfBottles?: number;
  yieldTotalQuantityPacked?: number;
  totalGainOrLoss?: number;
  totalWeightReceived?: number;
  comment?: string | null;
  percentageVarianceDescription?: string | null;
};
export type DomainEntitiesMaterialsMaterialReturnStatus = 0 | 1;
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
export type DomainEntitiesMaterialsMaterialReturnNoteFullReturnDto = {
  materialBatchReservedQuantity?: DomainEntitiesMaterialsBatchMaterialBatchReservedQuantityDto;
  destinationWarehouse?: SharedCollectionItemDto;
  sourceWarehouseLocationShelf?: DomainEntitiesWarehousesWarehouseLocationShelfDto;
  returned?: boolean;
};
export type DomainEntitiesMaterialsMaterialReturnNoteFullReturnDtoRead = {
  materialBatchReservedQuantity?: DomainEntitiesMaterialsBatchMaterialBatchReservedQuantityDtoRead;
  destinationWarehouse?: SharedCollectionItemDto;
  sourceWarehouseLocationShelf?: DomainEntitiesWarehousesWarehouseLocationShelfDtoRead;
  returned?: boolean;
};
export type DomainEntitiesMaterialsMaterialReturnNotePartialReturnDto = {
  material?: DomainEntitiesMaterialsMaterialDto;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchListDto;
  quantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  destinationWarehouse?: SharedCollectionItemDto;
  sourceWarehouseLocationShelf?: DomainEntitiesWarehousesWarehouseLocationShelfDto;
  returned?: boolean;
};
export type DomainEntitiesMaterialsMaterialReturnNotePartialReturnDtoRead = {
  material?: DomainEntitiesMaterialsMaterialDto;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchListDtoRead;
  quantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  destinationWarehouse?: SharedCollectionItemDto;
  sourceWarehouseLocationShelf?: DomainEntitiesWarehousesWarehouseLocationShelfDtoRead;
  returned?: boolean;
};
export type DomainEntitiesMaterialsMaterialReturnNoteDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  returnDate?: string;
  batchNumber?: string | null;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductDto;
  status?: DomainEntitiesMaterialsMaterialReturnStatus;
  fullReturns?: DomainEntitiesMaterialsMaterialReturnNoteFullReturnDto[] | null;
  partialReturns?:
    DomainEntitiesMaterialsMaterialReturnNotePartialReturnDto[] | null;
  isFullReturn?: boolean;
};
export type DomainEntitiesMaterialsMaterialReturnNoteDtoRead = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  returnDate?: string;
  batchNumber?: string | null;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductDto;
  status?: DomainEntitiesMaterialsMaterialReturnStatus;
  fullReturns?:
    DomainEntitiesMaterialsMaterialReturnNoteFullReturnDtoRead[] | null;
  partialReturns?:
    DomainEntitiesMaterialsMaterialReturnNotePartialReturnDtoRead[] | null;
  isFullReturn?: boolean;
};
export type DomainEntitiesProductsProductionProductionStepRecordsDto = {
  stepId?: string;
  productionScheduleProductId?: string;
  analyticalTests?:
    DomainEntitiesProductsProductionProductionStepAnalysisDto[] | null;
  batchRecords?:
    DomainEntitiesProductsProductionBatchManufacturingRecordDto[] | null;
  requisitions?: DomainEntitiesRequisitionsRequisitionDto[] | null;
  extraMaterialRequests?:
    DomainEntitiesProductsProductionProductionStepExtraMaterialDto[] | null;
  finalPackings?:
    DomainEntitiesProductionSchedulesPackingFinalPackingDto[] | null;
  transfers?: DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteDto[] | null;
  materialReturns?: DomainEntitiesMaterialsMaterialReturnNoteDto[] | null;
  batchScopedRecordIds?: string[] | null;
};
export type DomainEntitiesProductsProductionProductionStepRecordsDtoRead = {
  stepId?: string;
  productionScheduleProductId?: string;
  analyticalTests?:
    DomainEntitiesProductsProductionProductionStepAnalysisDto[] | null;
  batchRecords?:
    DomainEntitiesProductsProductionBatchManufacturingRecordDto[] | null;
  requisitions?: DomainEntitiesRequisitionsRequisitionDtoRead[] | null;
  extraMaterialRequests?:
    DomainEntitiesProductsProductionProductionStepExtraMaterialDto[] | null;
  finalPackings?:
    DomainEntitiesProductionSchedulesPackingFinalPackingDto[] | null;
  transfers?: DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteDto[] | null;
  materialReturns?: DomainEntitiesMaterialsMaterialReturnNoteDtoRead[] | null;
  batchScopedRecordIds?: string[] | null;
};
export type DomainEntitiesProductionSchedulesCreateProductionScheduleProduct = {
  productId?: string;
  marketTypeId?: string | null;
  quantity?: number;
  batchSize?: DomainEntitiesProductionSchedulesBatchSize;
  productPackingId?: string | null;
};
export type DomainEntitiesProductionSchedulesCreateProductionScheduleRequest = {
  code?: string | null;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  products?:
    DomainEntitiesProductionSchedulesCreateProductionScheduleProduct[] | null;
  remarks?: string | null;
};
export type DomainEntitiesProductionSchedulesProductionScheduleDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  status?: DomainEntitiesBaseProductionStatus;
  remarks?: string | null;
  products?:
    DomainEntitiesProductionSchedulesProductionScheduleProductDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductionSchedulesProductionScheduleDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProductionSchedulesProductionScheduleDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesProductionSchedulesUpdateProductionScheduleRequest = {
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  remarks?: string | null;
};
export type DomainEntitiesProductionSchedulesAddProductsToScheduleRequest = {
  products?:
    DomainEntitiesProductionSchedulesCreateProductionScheduleProduct[] | null;
};
export type SharedRequestsTypeResponse = {
  value?: number;
  name?: string | null;
};
export type DomainEntitiesProductionSchedulesMaterialRequisitionStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type DomainEntitiesProductionSchedulesMaterialDepartmentDetails = {
  department?: SharedCollectionItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  density?: number;
  reOrderLevel?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
};
export type DomainEntitiesProductionSchedulesProductionScheduleProcurementDto =
  {
    material?: DomainEntitiesMaterialsMaterialDto;
    baseUoM?: DomainEntitiesBaseUnitOfMeasureDto;
    baseQuantity?: number;
    prescribedQuantity?: number;
    quantityNeeded?: number;
    quantityOnHand?: number;
    status?: DomainEntitiesProductionSchedulesMaterialRequisitionStatus;
    storageWarehouseId?: string;
    productionWarehouseId?: string;
    materialDepartment?: DomainEntitiesProductionSchedulesMaterialDepartmentDetails;
    frozenQuantity?: number;
    totalFrozenQuantity?: number;
    consumedQuantity?: number;
    extraQuantity?: number;
    isSubstitute?: boolean;
    parentMaterial?: DomainEntitiesMaterialsMaterialDto;
  };
export type DomainEntitiesProductionSchedulesProductionScheduleProcurementPackageDto =
  {
    material?: DomainEntitiesMaterialsMaterialDto;
    directLinkMaterial?: DomainEntitiesMaterialsMaterialDto;
    baseQuantity?: number;
    prescribedQuantity?: number;
    quantityNeeded?: number;
    quantityOnHand?: number;
    unitCapacity?: number;
    status?: DomainEntitiesProductionSchedulesMaterialRequisitionStatus;
    packingExcessMargin?: number;
    storageWarehouseId?: string;
    productionWarehouseId?: string;
    materialDepartment?: DomainEntitiesProductionSchedulesMaterialDepartmentDetails;
    frozenQuantity?: number;
    totalFrozenQuantity?: number;
    consumedQuantity?: number;
    extraQuantity?: number;
    isSubstitute?: boolean;
    parentMaterial?: DomainEntitiesMaterialsMaterialDto;
  };
export type DomainEntitiesProductsProductionProductionActivityLogDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  message?: string | null;
  user?: DomainEntitiesUsersUserDto;
  timestamp?: string;
};
export type DomainEntitiesProductsProductionProductionActivityDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductDto;
  steps?: DomainEntitiesProductsProductionProductionActivityStepDto[] | null;
  status?: DomainEntitiesBaseProductionStatus;
  startedAt?: string;
  completedAt?: string | null;
  responsibleUsers?:
    DomainEntitiesProductsProductionProductionActivityStepUserDto[] | null;
  currentStep?: DomainEntitiesProductsProductionProductionActivityStepDto;
  activityLogs?:
    DomainEntitiesProductsProductionProductionActivityLogDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductsProductionProductionActivityDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProductsProductionProductionActivityDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type SharedSortDirection = 0 | 1 | 2;
export type DomainEntitiesProductsProductionProductionActivityGroupDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductDto;
  status?: DomainEntitiesBaseProductionStatus;
  startedAt?: string;
  completedAt?: string | null;
  currentStep?: DomainEntitiesProductsProductionProductionActivityStepDto;
  batchNumber?: string | null;
  quantity?: number;
};
export type DomainEntitiesProductsProductionProductionActivityGroupResultDto = {
  operation?: DomainEntitiesBaseOperationDto;
  activities?:
    DomainEntitiesProductsProductionProductionActivityGroupDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductsProductionProductionActivityStepDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProductsProductionProductionActivityStepDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesProductsProductionCreateBatchManufacturingRecord = {
  productionScheduleProductId?: string;
  productionActivityStepId?: string;
  batchNumber: string;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  batchQuantity?: number;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductsProductionBatchManufacturingRecordDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProductsProductionBatchManufacturingRecordDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesMaterialsBatchCreateFinishedGoodsTransferNoteQuantityRequest =
  {
    batchManufacturingRecordId?: string;
    quantity?: number;
  };
export type DomainEntitiesMaterialsBatchCreateFinishedGoodsTransferNoteRequest =
  {
    transferNoteNumber?: string | null;
    batchManufacturingRecordId?: string;
    productionActivityStepId?: string | null;
    quantityPerPack?: number;
    productPackingId?: string | null;
    totalQuantity?: number;
    uoMId?: string | null;
    qarNumber?: string | null;
    isPartial?: boolean;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesProductsProductionUpdateBatchManufacturingRecord = {
  batchNumber?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  batchQuantity?: number;
  productPackingId?: string | null;
};
export type DomainEntitiesProductsProductionCreateBatchPackagingRecord = {
  productionScheduleProductId?: string;
  productionActivityStepId?: string;
  batchNumber?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  batchQuantity?: number;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductsProductionBatchPackagingRecordDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProductsProductionBatchPackagingRecordDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesProductsProductionUpdateBatchPackagingRecord = {
  batchNumber?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  batchQuantity?: number;
  productPackingId?: string | null;
};
export type DomainEntitiesProductionSchedulesStockTransfersRequestStockTransferSourceRequest =
  {
    fromDepartmentId?: string;
    quantity?: number;
  };
export type DomainEntitiesProductionSchedulesStockTransfersRequestCreateStockTransferRequest =
  {
    code?: string | null;
    materialId?: string;
    uoMId?: string | null;
    reason?: string | null;
    requiredQuantity?: number;
    productId?: string | null;
    productionScheduleId?: string | null;
    productionActivityStepId?: string | null;
    sources?:
      | DomainEntitiesProductionSchedulesStockTransfersRequestStockTransferSourceRequest[]
      | null;
  };
export type DomainEntitiesProductionSchedulesStockTransfersStockTransferStatus =
  0 | 1 | 2 | 3;
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
export type DomainEntitiesProductionSchedulesStockTransfersStockTransferSourceDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    fromDepartment?: DomainEntitiesDepartmentsDepartmentDto;
    toDepartment?: DomainEntitiesDepartmentsDepartmentDto;
    quantity?: number;
    status?: DomainEntitiesProductionSchedulesStockTransfersStockTransferStatus;
    approvedAt?: string | null;
    issuedAt?: string | null;
  };
export type DomainEntitiesProductionSchedulesStockTransfersStockTransferDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  material?: DomainEntitiesMaterialsMaterialDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductDto;
  reason?: string | null;
  requiredQuantity?: number;
  status?: DomainEntitiesProductionSchedulesStockTransfersStockTransferStatus;
  sources?:
    | DomainEntitiesProductionSchedulesStockTransfersStockTransferSourceDto[]
    | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductionSchedulesStockTransfersStockTransferDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?:
      DomainEntitiesProductionSchedulesStockTransfersStockTransferDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesProductionSchedulesStockTransfersDepartmentStockTransferDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    material?: DomainEntitiesMaterialsMaterialDto;
    uoM?: DomainEntitiesBaseUnitOfMeasureDto;
    status?: DomainEntitiesProductionSchedulesStockTransfersStockTransferStatus;
    fromDepartment?: DomainEntitiesDepartmentsDepartmentDto;
    toDepartment?: DomainEntitiesDepartmentsDepartmentDto;
    quantity?: number;
    approvedAt?: string | null;
    issuedAt?: string | null;
    reason?: string | null;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductionSchedulesStockTransfersDepartmentStockTransferDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?:
      | DomainEntitiesProductionSchedulesStockTransfersDepartmentStockTransferDto[]
      | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesProductionSchedulesStockTransfersRequestBatchTransferRequest =
  {
    batchId?: string;
    quantity?: number;
  };
export type DomainEntitiesProductionSchedulesPackingCreateFinalPackingMaterial =
  {
    materialId?: string;
    receivedQuantity?: number;
    subsequentDeliveredQuantity?: number;
    totalReceivedQuantity?: number;
    packedQuantity?: number;
    returnedQuantity?: number;
    rejectedQuantity?: number;
    sampledQuantity?: number;
    totalAccountedForQuantity?: number;
    percentageLoss?: number;
    percentageVarianceDescription?: string | null;
  };
export type DomainEntitiesProductionSchedulesPackingCreateFinalPacking = {
  productionScheduleProductId?: string;
  productionActivityStepId?: string | null;
  materials?:
    DomainEntitiesProductionSchedulesPackingCreateFinalPackingMaterial[] | null;
  numberOfBottlesPerShipper?: number;
  nUmberOfFullShipperPacked?: number;
  leftOver?: number;
  batchSize?: number;
  averageVolumeFilledPerBottle?: number;
  productPackingId?: string | null;
  totalQuantityPacked?: number;
  qualityControlAnalyticalSample?: number;
  retainedSamples?: number;
  stabilitySamples?: number;
  totalNumberOfBottles?: number;
  yieldTotalQuantityPacked?: number;
  totalGainOrLoss?: number;
  totalWeightReceived?: number;
  percentageVarianceDescription?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductionSchedulesPackingFinalPackingDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesProductionSchedulesPackingFinalPackingDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesMaterialsPartialMaterialToReturn = {
  materialId?: string;
  uoMId?: string | null;
  quantity?: number;
  sourceWarehouseLocationShelfId?: string | null;
  returned?: boolean;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialReturnNoteDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesMaterialsMaterialReturnNoteDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMaterialsMaterialReturnNoteDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesMaterialsMaterialReturnNoteDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesProductionSchedulesCreateProductionExtraPacking = {
  materialId?: string;
  uoMId?: string;
  quantity?: number;
};
export type DomainEntitiesProductionSchedulesProductionExtraPackingStatus =
  0 | 1 | 2;
export type DomainEntitiesProductionSchedulesProductionExtraPackingWithBatchesDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductDto;
    material?: DomainEntitiesMaterialsMaterialDto;
    uoM?: DomainEntitiesBaseUnitOfMeasureDto;
    status?: DomainEntitiesProductionSchedulesProductionExtraPackingStatus;
    quantity?: number;
    approved?: boolean;
    batches?: DomainEntitiesMaterialsBatchBatchToSupply[] | null;
  };
export type DomainEntitiesProductionSchedulesProductionExtraPackingWithBatchesDtoRead =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductDto;
    material?: DomainEntitiesMaterialsMaterialDto;
    uoM?: DomainEntitiesBaseUnitOfMeasureDto;
    status?: DomainEntitiesProductionSchedulesProductionExtraPackingStatus;
    quantity?: number;
    approved?: boolean;
    batches?: DomainEntitiesMaterialsBatchBatchToSupplyRead[] | null;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductionSchedulesProductionExtraPackingWithBatchesDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?:
      | DomainEntitiesProductionSchedulesProductionExtraPackingWithBatchesDto[]
      | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesProductionSchedulesProductionExtraPackingWithBatchesDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?:
      | DomainEntitiesProductionSchedulesProductionExtraPackingWithBatchesDtoRead[]
      | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesMaterialsBatchApprovedProductDto = {
  product?: DomainEntitiesProductsProductListDto;
  totalQuantity?: number;
  totalRemainingQuantity?: number;
  quantityPerPack?: number;
  totalLoose?: number;
};
export type DomainEntitiesMaterialsBatchApprovedProductDetailDto = {
  product?: DomainEntitiesProductsProductListDto;
  totalQuantity?: number;
  totalRemainingQuantity?: number;
  quantityPerPack?: number;
  totalLoose?: number;
  finishedGoodsTransferNotes?:
    DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteDto[] | null;
};
export type DomainEntitiesProductionSchedulesProductionScheduleReportDto = {
  product?: DomainEntitiesProductsProductListDto;
  unitPrice?: number;
  priceUoM?: string | null;
  batchSize?: number;
  batches?: number;
  actualQuantity?: number;
  marketType?: SharedCollectionItemDto;
};
export type DomainEntitiesProductionSchedulesProductionScheduleReportDtoRead = {
  product?: DomainEntitiesProductsProductListDto;
  unitPrice?: number;
  priceUoM?: string | null;
  batchSize?: number;
  batches?: number;
  expectedQuantity?: number;
  expectedAmount?: number;
  actualQuantity?: number;
  actualAmount?: number;
  marketType?: SharedCollectionItemDto;
};
export type DomainEntitiesProductionSchedulesProductionScheduleDetailedReportDto =
  {
    unitPrice?: number;
    priceUoM?: string | null;
    batchNumber?: string | null;
    packageStyle?: string | null;
    expectedQuantity?: number;
    actualQuantity?: number;
  };
export type DomainEntitiesProductionSchedulesProductionScheduleDetailedReportDtoRead =
  {
    unitPrice?: number;
    priceUoM?: string | null;
    batchNumber?: string | null;
    packageStyle?: string | null;
    expectedQuantity?: number;
    expectedAmount?: number;
    actualQuantity?: number;
    actualAmount?: number;
  };
export type DomainEntitiesProductionSchedulesForecastMaterialDto = {
  material?: DomainEntitiesMaterialsMaterialDto;
  quantityNeeded?: number;
  quantityOnHand?: number;
  expiredQuantity?: number;
  reservedQuantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
};
export type DomainEntitiesProductionSchedulesForecastMaterialDtoRead = {
  material?: DomainEntitiesMaterialsMaterialDto;
  quantityNeeded?: number;
  quantityOnHand?: number;
  expiredQuantity?: number;
  reservedQuantity?: number;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  isAvailable?: boolean;
};
export type DomainEntitiesWorkOrdersCreateProductionStepRequest = {
  description?: string | null;
  resourceId?: string;
  duration?: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: DomainEntitiesBaseProductionStatus;
  sequence?: number;
};
export type DomainEntitiesWorkOrdersCreateWorkOrderRequest = {
  code?: string | null;
  productId?: string;
  masterProductionScheduleId?: string | null;
  quantity?: number;
  startDate?: string;
  endDate?: string;
  status?: DomainEntitiesBaseProductionStatus;
  batchNumber?: string | null;
  steps?: DomainEntitiesWorkOrdersCreateProductionStepRequest[] | null;
};
export type DomainEntitiesProductionSchedulesMasterProductionScheduleDto = {
  product?: SharedCollectionItemDto;
  plannedStartDate?: string;
  plannedEndDate?: string;
  plannedQuantity?: number;
  status?: DomainEntitiesBaseProductionStatus;
  workOrders?: DomainEntitiesWorkOrdersWorkOrderDto[] | null;
};
export type DomainEntitiesWorkOrdersProductionStepDto = {
  workOrder?: DomainEntitiesWorkOrdersWorkOrderDto;
  description?: string | null;
  resource?: DomainEntitiesBaseResourceDto;
  duration?: string;
  startDate?: string | null;
  endDate?: string | null;
  status?: DomainEntitiesBaseProductionStatus;
  sequence?: number;
};
export type DomainEntitiesWorkOrdersWorkOrderDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  product?: SharedCollectionItemDto;
  masterProductionSchedule?: DomainEntitiesProductionSchedulesMasterProductionScheduleDto;
  quantity?: number;
  startDate?: string;
  endDate?: string;
  status?: DomainEntitiesBaseProductionStatus;
  batchNumber?: string | null;
  steps?: DomainEntitiesWorkOrdersProductionStepDto[] | null;
};
export type DomainEntitiesWorkOrdersUpdateWorkOrderRequest = {
  code?: string | null;
  productId?: string;
  masterProductionScheduleId?: string | null;
  quantity?: number;
  startDate?: string;
  endDate?: string;
  status?: DomainEntitiesBaseProductionStatus;
  batchNumber?: string | null;
  steps?: DomainEntitiesWorkOrdersCreateProductionStepRequest[] | null;
};
export const {
  usePostApiV1ProductionOrdersMutation,
  useGetApiV1ProductionOrdersQuery,
  useLazyGetApiV1ProductionOrdersQuery,
  useGetApiV1ProductionOrdersByIdQuery,
  useLazyGetApiV1ProductionOrdersByIdQuery,
  usePutApiV1ProductionOrdersByIdMutation,
  useDeleteApiV1ProductionOrdersByIdMutation,
  usePostApiV1ProductionOrdersProformaInvoiceMutation,
  useGetApiV1ProductionOrdersProformaInvoiceQuery,
  useLazyGetApiV1ProductionOrdersProformaInvoiceQuery,
  usePostApiV1ProductionOrdersProformaInvoiceByProformaInvoiceIdCustomerMutation,
  useGetApiV1ProductionOrdersProformaInvoiceByProformaInvoiceIdQuery,
  useLazyGetApiV1ProductionOrdersProformaInvoiceByProformaInvoiceIdQuery,
  usePutApiV1ProductionOrdersProformaInvoiceByIdMutation,
  useDeleteApiV1ProductionOrdersProformaInvoiceByIdMutation,
  usePostApiV1ProductionOrdersInvoiceMutation,
  useGetApiV1ProductionOrdersInvoiceQuery,
  useLazyGetApiV1ProductionOrdersInvoiceQuery,
  useGetApiV1ProductionOrdersInvoiceByIdQuery,
  useLazyGetApiV1ProductionOrdersInvoiceByIdQuery,
  usePutApiV1ProductionOrdersInvoiceByIdMutation,
  useDeleteApiV1ProductionOrdersInvoiceByIdMutation,
  usePostApiV1ProductionOrdersAllocateMutation,
  useGetApiV1ProductionOrdersAllocateQuery,
  useLazyGetApiV1ProductionOrdersAllocateQuery,
  useGetApiV1ProductionOrdersAllocateByAllocateProductionOrderIdQuery,
  useLazyGetApiV1ProductionOrdersAllocateByAllocateProductionOrderIdQuery,
  usePutApiV1ProductionOrdersAllocateByAllocateProductionOrderIdMutation,
  usePutApiV1ProductionOrdersDeliverByAllocateProductionOrderIdMutation,
  usePutApiV1ProductionOrdersLoadByAllocateProductionOrderIdMutation,
  usePostApiV1ProductionOrdersByAllocateProductionOrderIdWaybillMutation,
  useGetApiV1ProductionOrdersWaybillQuery,
  useLazyGetApiV1ProductionOrdersWaybillQuery,
  useGetApiV1ProductionOrdersWaybillByProductionOrderWaybillIdQuery,
  useLazyGetApiV1ProductionOrdersWaybillByProductionOrderWaybillIdQuery,
  usePostApiV1ProductionOrdersWaybillByAllocateProductionOrderIdCustomerMutation,
  useGetProductionStepRecordsQuery,
  useLazyGetProductionStepRecordsQuery,
  usePostApiV1ProductionScheduleMutation,
  useGetApiV1ProductionScheduleQuery,
  useLazyGetApiV1ProductionScheduleQuery,
  useGetApiV1ProductionScheduleByScheduleIdQuery,
  useLazyGetApiV1ProductionScheduleByScheduleIdQuery,
  usePutApiV1ProductionScheduleByScheduleIdMutation,
  useDeleteApiV1ProductionScheduleByScheduleIdMutation,
  useGetApiV1ProductionScheduleProductionScheduleProductByProductionScheduleProductIdQuery,
  useLazyGetApiV1ProductionScheduleProductionScheduleProductByProductionScheduleProductIdQuery,
  usePutApiV1ProductionScheduleByScheduleIdAddProductsMutation,
  useDeleteApiV1ProductionScheduleProductByProductionScheduleProductIdMutation,
  useGetApiV1ProductionScheduleProductionStatusQuery,
  useLazyGetApiV1ProductionScheduleProductionStatusQuery,
  useGetApiV1ProductionScheduleByScheduleIdDetailsQuery,
  useLazyGetApiV1ProductionScheduleByScheduleIdDetailsQuery,
  useGetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdQuery,
  useLazyGetApiV1ProductionScheduleMaterialStockByProductionScheduleProductIdQuery,
  useGetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdQuery,
  useLazyGetApiV1ProductionSchedulePackageMaterialStockByProductionScheduleProductIdQuery,
  useGetApiV1ProductionScheduleByProductionScheduleProductIdMaterialsWithInsufficientStockQuery,
  useLazyGetApiV1ProductionScheduleByProductionScheduleProductIdMaterialsWithInsufficientStockQuery,
  useGetApiV1ProductionScheduleByProductionScheduleProductIdPackageMaterialsWithInsufficientStockQuery,
  useLazyGetApiV1ProductionScheduleByProductionScheduleProductIdPackageMaterialsWithInsufficientStockQuery,
  usePostApiV1ProductionScheduleActivityStartByProductionScheduleProductIdMutation,
  useGetApiV1ProductionScheduleActivityQuery,
  useLazyGetApiV1ProductionScheduleActivityQuery,
  useGetApiV1ProductionScheduleActivityByProductionActivityIdQuery,
  useLazyGetApiV1ProductionScheduleActivityByProductionActivityIdQuery,
  useGetApiV1ProductionScheduleActivityProductByProductionScheduleProductIdQuery,
  useLazyGetApiV1ProductionScheduleActivityProductByProductionScheduleProductIdQuery,
  useGetApiV1ProductionScheduleActivityStatusGroupedQuery,
  useLazyGetApiV1ProductionScheduleActivityStatusGroupedQuery,
  useGetApiV1ProductionScheduleActivityOperationGroupedQuery,
  useLazyGetApiV1ProductionScheduleActivityOperationGroupedQuery,
  usePutApiV1ProductionScheduleActivityStepByProductionStepIdStatusMutation,
  useGetApiV1ProductionScheduleActivityStepQuery,
  useLazyGetApiV1ProductionScheduleActivityStepQuery,
  useGetApiV1ProductionScheduleActivityStepByProductionActivityStepIdQuery,
  useLazyGetApiV1ProductionScheduleActivityStepByProductionActivityStepIdQuery,
  useGetApiV1ProductionScheduleActivityStepStatusGroupedQuery,
  useLazyGetApiV1ProductionScheduleActivityStepStatusGroupedQuery,
  useGetApiV1ProductionScheduleActivityStepOperationGroupedQuery,
  useLazyGetApiV1ProductionScheduleActivityStepOperationGroupedQuery,
  usePostApiV1ProductionScheduleManufacturingMutation,
  useGetApiV1ProductionScheduleManufacturingQuery,
  useLazyGetApiV1ProductionScheduleManufacturingQuery,
  useGetApiV1ProductionScheduleManufacturingProductByProductionScheduleProductIdQuery,
  useLazyGetApiV1ProductionScheduleManufacturingProductByProductionScheduleProductIdQuery,
  usePostApiV1ProductionScheduleFinishedGoodsTransferNoteQuantityMutation,
  useGetApiV1ProductionScheduleFinishedGoodsTransferNoteBmrQuantityByBatchManufacturingRecordIdQuery,
  useLazyGetApiV1ProductionScheduleFinishedGoodsTransferNoteBmrQuantityByBatchManufacturingRecordIdQuery,
  usePostApiV1ProductionScheduleFinishedGoodsTransferNoteMutation,
  useGetApiV1ProductionScheduleFinishedGoodsTransferNoteQuery,
  useLazyGetApiV1ProductionScheduleFinishedGoodsTransferNoteQuery,
  useGetApiV1ProductionScheduleFinishedGoodsTransferNoteByIdQuery,
  useLazyGetApiV1ProductionScheduleFinishedGoodsTransferNoteByIdQuery,
  useGetApiV1ProductionScheduleFinishedGoodsTransferNoteBmrByBatchManufacturingRecordIdQuery,
  useLazyGetApiV1ProductionScheduleFinishedGoodsTransferNoteBmrByBatchManufacturingRecordIdQuery,
  useGetApiV1ProductionScheduleFinishedGoodsTransferNoteByProductIdProductQuery,
  useLazyGetApiV1ProductionScheduleFinishedGoodsTransferNoteByProductIdProductQuery,
  usePutApiV1ProductionScheduleByIdMutation,
  useGetApiV1ProductionScheduleManufacturingByBatchManufacturingRecordIdQuery,
  useLazyGetApiV1ProductionScheduleManufacturingByBatchManufacturingRecordIdQuery,
  usePutApiV1ProductionScheduleManufacturingByIdMutation,
  usePutApiV1ProductionScheduleManufacturingIssueByIdMutation,
  usePostApiV1ProductionSchedulePackagingMutation,
  useGetApiV1ProductionSchedulePackagingQuery,
  useLazyGetApiV1ProductionSchedulePackagingQuery,
  useGetApiV1ProductionSchedulePackagingByIdQuery,
  useLazyGetApiV1ProductionSchedulePackagingByIdQuery,
  usePutApiV1ProductionSchedulePackagingByIdMutation,
  usePutApiV1ProductionSchedulePackagingIssueByIdMutation,
  usePostApiV1ProductionScheduleStockTransferMutation,
  useGetApiV1ProductionScheduleStockTransferQuery,
  useLazyGetApiV1ProductionScheduleStockTransferQuery,
  useGetApiV1ProductionScheduleStockTransferUserQuery,
  useLazyGetApiV1ProductionScheduleStockTransferUserQuery,
  useGetApiV1ProductionScheduleStockTransferInBoundQuery,
  useLazyGetApiV1ProductionScheduleStockTransferInBoundQuery,
  useGetApiV1ProductionScheduleStockTransferOutBoundQuery,
  useLazyGetApiV1ProductionScheduleStockTransferOutBoundQuery,
  useGetApiV1ProductionScheduleStockTransferByStockTransferIdQuery,
  useLazyGetApiV1ProductionScheduleStockTransferByStockTransferIdQuery,
  usePutApiV1ProductionScheduleStockTransferApproveByStockTransferIdMutation,
  usePutApiV1ProductionScheduleStockTransferRejectByStockTransferIdMutation,
  useGetApiV1ProductionScheduleStockTransferBatchByStockTransferIdQuery,
  useLazyGetApiV1ProductionScheduleStockTransferBatchByStockTransferIdQuery,
  usePutApiV1ProductionScheduleStockTransferIssueByStockTransferIdMutation,
  usePostApiV1ProductionScheduleFinalPackingMutation,
  useGetApiV1ProductionScheduleFinalPackingQuery,
  useLazyGetApiV1ProductionScheduleFinalPackingQuery,
  useGetApiV1ProductionScheduleFinalPackingByFinalPackingIdQuery,
  useLazyGetApiV1ProductionScheduleFinalPackingByFinalPackingIdQuery,
  usePutApiV1ProductionScheduleFinalPackingByFinalPackingIdMutation,
  useDeleteApiV1ProductionScheduleFinalPackingByFinalPackingIdMutation,
  useGetApiV1ProductionScheduleFinalPackingProductByProductionScheduleProductIdQuery,
  useLazyGetApiV1ProductionScheduleFinalPackingProductByProductionScheduleProductIdQuery,
  useGetApiV1ProductionScheduleStockRequisitionRawByProductionScheduleProductIdQuery,
  useLazyGetApiV1ProductionScheduleStockRequisitionRawByProductionScheduleProductIdQuery,
  useGetApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductIdQuery,
  useLazyGetApiV1ProductionScheduleStockRequisitionPackageByProductionScheduleProductIdQuery,
  usePostApiV1ProductionScheduleReturnBeforeProductionMutation,
  usePostApiV1ProductionScheduleReturnAfterProductionMutation,
  useGetApiV1ProductionScheduleMaterialReturnNoteQuery,
  useLazyGetApiV1ProductionScheduleMaterialReturnNoteQuery,
  useGetApiV1ProductionScheduleMaterialReturnNoteByMaterialReturnNoteIdQuery,
  useLazyGetApiV1ProductionScheduleMaterialReturnNoteByMaterialReturnNoteIdQuery,
  usePutApiV1ProductionScheduleMaterialReturnNoteCompleteByMaterialReturnNoteIdMutation,
  usePostApiV1ProductionScheduleExtraPackingByProductionScheduleProductIdMutation,
  useGetApiV1ProductionScheduleExtraPackingQuery,
  useLazyGetApiV1ProductionScheduleExtraPackingQuery,
  useGetApiV1ProductionScheduleExtraPackingByProductionExtraPackingIdQuery,
  useLazyGetApiV1ProductionScheduleExtraPackingByProductionExtraPackingIdQuery,
  useGetApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductIdQuery,
  useLazyGetApiV1ProductionScheduleExtraPackingByProductByProductionScheduleProductIdQuery,
  useGetApiV1ProductionScheduleExtraPackingBatchesToSupplyByExtraPackingMaterialIdQuery,
  useLazyGetApiV1ProductionScheduleExtraPackingBatchesToSupplyByExtraPackingMaterialIdQuery,
  usePostApiV1ProductionScheduleExtraPackingApproveByProductionExtraPackingIdMutation,
  useGetApiV1ProductionScheduleApprovedProductsQuery,
  useLazyGetApiV1ProductionScheduleApprovedProductsQuery,
  useGetApiV1ProductionScheduleApprovedProductsProductByProductIdQuery,
  useLazyGetApiV1ProductionScheduleApprovedProductsProductByProductIdQuery,
  useGetApiV1ProductionScheduleApprovedProductsByProductIdQuery,
  useLazyGetApiV1ProductionScheduleApprovedProductsByProductIdQuery,
  useGetApiV1ProductionScheduleSummaryReportQuery,
  useLazyGetApiV1ProductionScheduleSummaryReportQuery,
  useGetApiV1ProductionScheduleDetailedReportQuery,
  useLazyGetApiV1ProductionScheduleDetailedReportQuery,
  useGetApiV1ProductionScheduleForecastQuery,
  useLazyGetApiV1ProductionScheduleForecastQuery,
  usePostApiV1WorkOrderMutation,
  useGetApiV1WorkOrderByWorkOrderIdQuery,
  useLazyGetApiV1WorkOrderByWorkOrderIdQuery,
  usePutApiV1WorkOrderByWorkOrderIdMutation,
  useDeleteApiV1WorkOrderByWorkOrderIdMutation,
} = injectedRtkApi;
