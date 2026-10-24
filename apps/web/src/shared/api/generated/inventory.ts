import { api } from "../base-api";
const injectedRtkApi = api.injectEndpoints({
  endpoints: (build) => ({
    postApiV1ProcurementInventory: build.mutation<
      PostApiV1ProcurementInventoryApiResponse,
      PostApiV1ProcurementInventoryApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory`,
        method: "POST",
        body: queryArg.domainEntitiesItemsRequisitionsCreateInventoryPurchaseRequisition,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementInventory: build.query<
      GetApiV1ProcurementInventoryApiResponse,
      GetApiV1ProcurementInventoryApiArg
    >({
      providesTags: [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          status: queryArg.status,
          anyStatus: queryArg.anyStatus,
          store: queryArg.store,
        },
      }),
    }),
    putApiV1ProcurementInventoryById: build.mutation<
      PutApiV1ProcurementInventoryByIdApiResponse,
      PutApiV1ProcurementInventoryByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/inventory", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesItemsRequisitionsCreateInventoryPurchaseRequisition,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ProcurementInventoryById: build.mutation<
      DeleteApiV1ProcurementInventoryByIdApiResponse,
      DeleteApiV1ProcurementInventoryByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/inventory", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementInventoryById: build.query<
      GetApiV1ProcurementInventoryByIdApiResponse,
      GetApiV1ProcurementInventoryByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/inventory", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementInventorySource: build.mutation<
      PostApiV1ProcurementInventorySourceApiResponse,
      PostApiV1ProcurementInventorySourceApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/source`,
        method: "POST",
        body: queryArg.domainEntitiesItemsRequisitionsCreateSourceInventoryRequisition,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementInventoryMarket: build.mutation<
      PostApiV1ProcurementInventoryMarketApiResponse,
      PostApiV1ProcurementInventoryMarketApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/market`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementInventoryMarket: build.query<
      GetApiV1ProcurementInventoryMarketApiResponse,
      GetApiV1ProcurementInventoryMarketApiArg
    >({
      providesTags: [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/market`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          closed: queryArg.closed,
        },
      }),
    }),
    getApiV1ProcurementInventoryMarketById: build.query<
      GetApiV1ProcurementInventoryMarketByIdApiResponse,
      GetApiV1ProcurementInventoryMarketByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/inventory", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/market/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementInventoryPriceComparison: build.query<
      GetApiV1ProcurementInventoryPriceComparisonApiResponse,
      GetApiV1ProcurementInventoryPriceComparisonApiArg
    >({
      providesTags: [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/price-comparison`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          source: queryArg.source,
        },
      }),
    }),
    postApiV1ProcurementInventoryMemoOpenMarket: build.mutation<
      PostApiV1ProcurementInventoryMemoOpenMarketApiResponse,
      PostApiV1ProcurementInventoryMemoOpenMarketApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/memo/open-market`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementInventoryMemoTrustedVendor: build.mutation<
      PostApiV1ProcurementInventoryMemoTrustedVendorApiResponse,
      PostApiV1ProcurementInventoryMemoTrustedVendorApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/memo/trusted-vendor`,
        method: "POST",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementInventoryVendorByVendorIdSendQuotation: build.mutation<
      PostApiV1ProcurementInventoryVendorByVendorIdSendQuotationApiResponse,
      PostApiV1ProcurementInventoryVendorByVendorIdSendQuotationApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/inventory", id: queryArg.vendorId }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/vendor/${queryArg.vendorId}/send-quotation`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementInventoryVendorQuotations: build.query<
      GetApiV1ProcurementInventoryVendorQuotationsApiResponse,
      GetApiV1ProcurementInventoryVendorQuotationsApiArg
    >({
      providesTags: [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/vendor/quotations`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          received: queryArg.received,
        },
      }),
    }),
    getApiV1ProcurementInventoryVendorQuotationByVendorQuotationId: build.query<
      GetApiV1ProcurementInventoryVendorQuotationByVendorQuotationIdApiResponse,
      GetApiV1ProcurementInventoryVendorQuotationByVendorQuotationIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/inventory", id: queryArg.vendorQuotationId }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/vendor/quotation/${queryArg.vendorQuotationId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementInventoryVendorQuotationByVendorQuotationIdReceive:
      build.mutation<
        PostApiV1ProcurementInventoryVendorQuotationByVendorQuotationIdReceiveApiResponse,
        PostApiV1ProcurementInventoryVendorQuotationByVendorQuotationIdReceiveApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/procurement/inventory/vendor/quotation/${queryArg.vendorQuotationId}/receive`,
          method: "POST",
          body: queryArg.body,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProcurementInventoryMarketVendors: build.query<
      GetApiV1ProcurementInventoryMarketVendorsApiResponse,
      GetApiV1ProcurementInventoryMarketVendorsApiArg
    >({
      providesTags: [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/market/vendors`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          complete: queryArg.complete,
          marketRequisitionId: queryArg.marketRequisitionId,
        },
      }),
    }),
    postApiV1ProcurementInventoryMarketVendors: build.mutation<
      PostApiV1ProcurementInventoryMarketVendorsApiResponse,
      PostApiV1ProcurementInventoryMarketVendorsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/market/vendors`,
        method: "POST",
        body: queryArg.domainEntitiesItemsRequisitionsCreateMarketRequisitionVendor,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementInventoryMarketVendorsByMarketRequisitionVendorIdConfirm:
      build.mutation<
        PostApiV1ProcurementInventoryMarketVendorsByMarketRequisitionVendorIdConfirmApiResponse,
        PostApiV1ProcurementInventoryMarketVendorsByMarketRequisitionVendorIdConfirmApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/procurement/inventory/market/vendors/${queryArg.marketRequisitionVendorId}/confirm`,
          method: "POST",
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    getApiV1ProcurementInventoryMemo: build.query<
      GetApiV1ProcurementInventoryMemoApiResponse,
      GetApiV1ProcurementInventoryMemoApiArg
    >({
      providesTags: [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/memo`,
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
    getApiV1ProcurementInventoryMemoById: build.query<
      GetApiV1ProcurementInventoryMemoByIdApiResponse,
      GetApiV1ProcurementInventoryMemoByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "procurement/inventory", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/memo/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementInventoryMemoItemByIdMarkPaid: build.mutation<
      PostApiV1ProcurementInventoryMemoItemByIdMarkPaidApiResponse,
      PostApiV1ProcurementInventoryMemoItemByIdMarkPaidApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/inventory", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/memo-item/${queryArg.id}/mark-paid`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementInventoryMemoCodeGenerate: build.query<
      GetApiV1ProcurementInventoryMemoCodeGenerateApiResponse,
      GetApiV1ProcurementInventoryMemoCodeGenerateApiArg
    >({
      providesTags: [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/memo/code/generate`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ProcurementInventoryPurchasedItems: build.query<
      GetApiV1ProcurementInventoryPurchasedItemsApiResponse,
      GetApiV1ProcurementInventoryPurchasedItemsApiArg
    >({
      providesTags: [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/purchased-items`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          status: queryArg.status,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          store: queryArg.store,
        },
      }),
    }),
    postApiV1ProcurementInventoryItemsByIdApprove: build.mutation<
      PostApiV1ProcurementInventoryItemsByIdApproveApiResponse,
      PostApiV1ProcurementInventoryItemsByIdApproveApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/inventory", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/items/${queryArg.id}/approve`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ProcurementInventoryItemsByIdReject: build.mutation<
      PostApiV1ProcurementInventoryItemsByIdRejectApiResponse,
      PostApiV1ProcurementInventoryItemsByIdRejectApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "procurement/inventory", id: "LIST" }, { type: "procurement", id: "LIST" }, { type: "procurement/inventory", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/procurement/inventory/items/${queryArg.id}/reject`,
        method: "POST",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ItemsChoices: build.query<
      GetApiV1ItemsChoicesApiResponse,
      GetApiV1ItemsChoicesApiArg
    >({
      providesTags: [{ type: "item/choice", id: "LIST" }, { type: "item", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/items/choices`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          store: queryArg.store,
          searchQuery: queryArg.searchQuery,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
        },
      }),
    }),
    postApiV1ItemsShipmentInvoice: build.mutation<
      PostApiV1ItemsShipmentInvoiceApiResponse,
      PostApiV1ItemsShipmentInvoiceApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "item/shipment-invoice", id: "LIST" }, { type: "item", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/items/shipment-invoice`,
        method: "POST",
        body: queryArg.domainEntitiesItemShipmentsCreateItemShipmentInvoice,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ItemsShipmentInvoice: build.query<
      GetApiV1ItemsShipmentInvoiceApiResponse,
      GetApiV1ItemsShipmentInvoiceApiArg
    >({
      providesTags: [{ type: "item/shipment-invoice", id: "LIST" }, { type: "item", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/items/shipment-invoice`,
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
    getApiV1ItemsShipmentInvoiceByInvoiceId: build.query<
      GetApiV1ItemsShipmentInvoiceByInvoiceIdApiResponse,
      GetApiV1ItemsShipmentInvoiceByInvoiceIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "item/shipment-invoice", id: queryArg.invoiceId }],
      query: (queryArg) => ({
        url: `/api/v1/items/shipment-invoice/${queryArg.invoiceId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ItemsShipmentInvoiceByInvoiceId: build.mutation<
      PutApiV1ItemsShipmentInvoiceByInvoiceIdApiResponse,
      PutApiV1ItemsShipmentInvoiceByInvoiceIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "item/shipment-invoice", id: "LIST" }, { type: "item", id: "LIST" }, { type: "item/shipment-invoice", id: queryArg.invoiceId }]),
      query: (queryArg) => ({
        url: `/api/v1/items/shipment-invoice/${queryArg.invoiceId}`,
        method: "PUT",
        body: queryArg.domainEntitiesItemShipmentsCreateItemShipmentInvoice,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ItemsShipmentInvoiceByInvoiceId: build.mutation<
      DeleteApiV1ItemsShipmentInvoiceByInvoiceIdApiResponse,
      DeleteApiV1ItemsShipmentInvoiceByInvoiceIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "item/shipment-invoice", id: "LIST" }, { type: "item", id: "LIST" }, { type: "item/shipment-invoice", id: queryArg.invoiceId }]),
      query: (queryArg) => ({
        url: `/api/v1/items/shipment-invoice/${queryArg.invoiceId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ItemsShipmentInvoiceUnattached: build.query<
      GetApiV1ItemsShipmentInvoiceUnattachedApiResponse,
      GetApiV1ItemsShipmentInvoiceUnattachedApiArg
    >({
      providesTags: [{ type: "item/shipment-invoice", id: "LIST" }, { type: "item", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/items/shipment-invoice/unattached`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ItemsShipmentInvoiceByInvoiceIdPaid: build.mutation<
      PutApiV1ItemsShipmentInvoiceByInvoiceIdPaidApiResponse,
      PutApiV1ItemsShipmentInvoiceByInvoiceIdPaidApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "item/shipment-invoice", id: "LIST" }, { type: "item", id: "LIST" }, { type: "item/shipment-invoice", id: queryArg.invoiceId }]),
      query: (queryArg) => ({
        url: `/api/v1/items/shipment-invoice/${queryArg.invoiceId}/paid`,
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
    postApiV1ItemsShipmentDocument: build.mutation<
      PostApiV1ItemsShipmentDocumentApiResponse,
      PostApiV1ItemsShipmentDocumentApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "item/shipment-document", id: "LIST" }, { type: "item", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/items/shipment-document`,
        method: "POST",
        body: queryArg.domainEntitiesItemShipmentsCreateItemShipmentDocumentRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ItemsShipmentDocument: build.query<
      GetApiV1ItemsShipmentDocumentApiResponse,
      GetApiV1ItemsShipmentDocumentApiArg
    >({
      providesTags: [{ type: "item/shipment-document", id: "LIST" }, { type: "item", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/items/shipment-document`,
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
    getApiV1ItemsShipmentDocumentByShipmentDocumentId: build.query<
      GetApiV1ItemsShipmentDocumentByShipmentDocumentIdApiResponse,
      GetApiV1ItemsShipmentDocumentByShipmentDocumentIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "item/shipment-document", id: queryArg.shipmentDocumentId }],
      query: (queryArg) => ({
        url: `/api/v1/items/shipment-document/${queryArg.shipmentDocumentId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ItemsShipmentDocumentByShipmentDocumentId: build.mutation<
      PutApiV1ItemsShipmentDocumentByShipmentDocumentIdApiResponse,
      PutApiV1ItemsShipmentDocumentByShipmentDocumentIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "item/shipment-document", id: "LIST" }, { type: "item", id: "LIST" }, { type: "item/shipment-document", id: queryArg.shipmentDocumentId }]),
      query: (queryArg) => ({
        url: `/api/v1/items/shipment-document/${queryArg.shipmentDocumentId}`,
        method: "PUT",
        body: queryArg.domainEntitiesItemShipmentsCreateItemShipmentDocumentRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ItemsShipmentDocumentByShipmentDocumentId: build.mutation<
      DeleteApiV1ItemsShipmentDocumentByShipmentDocumentIdApiResponse,
      DeleteApiV1ItemsShipmentDocumentByShipmentDocumentIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "item/shipment-document", id: "LIST" }, { type: "item", id: "LIST" }, { type: "item/shipment-document", id: queryArg.shipmentDocumentId }]),
      query: (queryArg) => ({
        url: `/api/v1/items/shipment-document/${queryArg.shipmentDocumentId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ItemsShipmentDocumentByShipmentDocumentIdArrived: build.mutation<
      PutApiV1ItemsShipmentDocumentByShipmentDocumentIdArrivedApiResponse,
      PutApiV1ItemsShipmentDocumentByShipmentDocumentIdArrivedApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "item/shipment-document", id: "LIST" }, { type: "item", id: "LIST" }, { type: "item/shipment-document", id: queryArg.shipmentDocumentId }]),
      query: (queryArg) => ({
        url: `/api/v1/items/shipment-document/${queryArg.shipmentDocumentId}/arrived`,
        method: "PUT",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ItemsWaybill: build.mutation<
      PostApiV1ItemsWaybillApiResponse,
      PostApiV1ItemsWaybillApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "item/waybill", id: "LIST" }, { type: "item", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/items/waybill`,
        method: "POST",
        body: queryArg.domainEntitiesItemShipmentsCreateItemShipmentDocumentRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ItemsWaybill: build.query<
      GetApiV1ItemsWaybillApiResponse,
      GetApiV1ItemsWaybillApiArg
    >({
      providesTags: [{ type: "item/waybill", id: "LIST" }, { type: "item", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/items/waybill`,
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
    getApiV1ItemsWaybillByWaybillId: build.query<
      GetApiV1ItemsWaybillByWaybillIdApiResponse,
      GetApiV1ItemsWaybillByWaybillIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "item/waybill", id: queryArg.waybillId }],
      query: (queryArg) => ({
        url: `/api/v1/items/waybill/${queryArg.waybillId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ItemsWaybillByWaybillId: build.mutation<
      PutApiV1ItemsWaybillByWaybillIdApiResponse,
      PutApiV1ItemsWaybillByWaybillIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "item/waybill", id: "LIST" }, { type: "item", id: "LIST" }, { type: "item/waybill", id: queryArg.waybillId }]),
      query: (queryArg) => ({
        url: `/api/v1/items/waybill/${queryArg.waybillId}`,
        method: "PUT",
        body: queryArg.domainEntitiesItemShipmentsCreateItemShipmentDocumentRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ItemsWaybillByWaybillId: build.mutation<
      DeleteApiV1ItemsWaybillByWaybillIdApiResponse,
      DeleteApiV1ItemsWaybillByWaybillIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "item/waybill", id: "LIST" }, { type: "item", id: "LIST" }, { type: "item/waybill", id: queryArg.waybillId }]),
      query: (queryArg) => ({
        url: `/api/v1/items/waybill/${queryArg.waybillId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ItemsBillingSheet: build.mutation<
      PostApiV1ItemsBillingSheetApiResponse,
      PostApiV1ItemsBillingSheetApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "item/billing-sheet", id: "LIST" }, { type: "item", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/items/billing-sheet`,
        method: "POST",
        body: queryArg.domainEntitiesItemShipmentsCreateItemBillingSheetRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ItemsBillingSheet: build.query<
      GetApiV1ItemsBillingSheetApiResponse,
      GetApiV1ItemsBillingSheetApiArg
    >({
      providesTags: [{ type: "item/billing-sheet", id: "LIST" }, { type: "item", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/items/billing-sheet`,
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
    getApiV1ItemsBillingSheetByBillingSheetId: build.query<
      GetApiV1ItemsBillingSheetByBillingSheetIdApiResponse,
      GetApiV1ItemsBillingSheetByBillingSheetIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "item/billing-sheet", id: queryArg.billingSheetId }],
      query: (queryArg) => ({
        url: `/api/v1/items/billing-sheet/${queryArg.billingSheetId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ItemsBillingSheetByBillingSheetId: build.mutation<
      PutApiV1ItemsBillingSheetByBillingSheetIdApiResponse,
      PutApiV1ItemsBillingSheetByBillingSheetIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "item/billing-sheet", id: "LIST" }, { type: "item", id: "LIST" }, { type: "item/billing-sheet", id: queryArg.billingSheetId }]),
      query: (queryArg) => ({
        url: `/api/v1/items/billing-sheet/${queryArg.billingSheetId}`,
        method: "PUT",
        body: queryArg.domainEntitiesItemShipmentsUpdateItemBillingSheetRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ItemsBillingSheetByBillingSheetId: build.mutation<
      DeleteApiV1ItemsBillingSheetByBillingSheetIdApiResponse,
      DeleteApiV1ItemsBillingSheetByBillingSheetIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "item/billing-sheet", id: "LIST" }, { type: "item", id: "LIST" }, { type: "item/billing-sheet", id: queryArg.billingSheetId }]),
      query: (queryArg) => ({
        url: `/api/v1/items/billing-sheet/${queryArg.billingSheetId}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ItemsBillingSheetInvoiceByInvoiceId: build.query<
      GetApiV1ItemsBillingSheetInvoiceByInvoiceIdApiResponse,
      GetApiV1ItemsBillingSheetInvoiceByInvoiceIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "item/billing-sheet", id: queryArg.invoiceId }],
      query: (queryArg) => ({
        url: `/api/v1/items/billing-sheet/invoice/${queryArg.invoiceId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ItemsBillingSheetByBillingSheetIdCharges: build.mutation<
      PutApiV1ItemsBillingSheetByBillingSheetIdChargesApiResponse,
      PutApiV1ItemsBillingSheetByBillingSheetIdChargesApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "item/billing-sheet", id: "LIST" }, { type: "item", id: "LIST" }, { type: "item/billing-sheet", id: queryArg.billingSheetId }]),
      query: (queryArg) => ({
        url: `/api/v1/items/billing-sheet/${queryArg.billingSheetId}/charges`,
        method: "PUT",
        body: queryArg.body,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ItemsBillingSheetChargesPaid: build.mutation<
      PutApiV1ItemsBillingSheetChargesPaidApiResponse,
      PutApiV1ItemsBillingSheetChargesPaidApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "item/billing-sheet", id: "LIST" }, { type: "item", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/items/billing-sheet/charges/paid`,
        method: "PUT",
        body: queryArg.domainEntitiesPurchaseOrdersRequestMarkBillingSheetCharge,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1Items: build.mutation<
      PostApiV1ItemsApiResponse,
      PostApiV1ItemsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "item", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/items`,
        method: "POST",
        body: queryArg.domainEntitiesItemsCreateItemsRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Items: build.query<GetApiV1ItemsApiResponse, GetApiV1ItemsApiArg>({
      providesTags: [{ type: "item", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/items`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          store: queryArg.store,
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
        },
      }),
    }),
    getApiV1ItemsById: build.query<
      GetApiV1ItemsByIdApiResponse,
      GetApiV1ItemsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "item", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/items/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ItemsById: build.mutation<
      PutApiV1ItemsByIdApiResponse,
      PutApiV1ItemsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "item", id: "LIST" }, { type: "item", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/items/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesItemsCreateItemsRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ItemsById: build.mutation<
      DeleteApiV1ItemsByIdApiResponse,
      DeleteApiV1ItemsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "item", id: "LIST" }, { type: "item", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/items/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ItemsByItemCodeTransactions: build.query<
      GetApiV1ItemsByItemCodeTransactionsApiResponse,
      GetApiV1ItemsByItemCodeTransactionsApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "item", id: queryArg.itemCode }],
      query: (queryArg) => ({
        url: `/api/v1/items/${queryArg.itemCode}/transactions`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          transactionType: queryArg.transactionType,
        },
      }),
    }),
    postApiV1ItemGrns: build.mutation<
      PostApiV1ItemGrnsApiResponse,
      PostApiV1ItemGrnsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "item-grn", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/item-grns`,
        method: "POST",
        body: queryArg.domainEntitiesItemGrnsCreateItemGrnRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ItemGrns: build.query<
      GetApiV1ItemGrnsApiResponse,
      GetApiV1ItemGrnsApiArg
    >({
      providesTags: [{ type: "item-grn", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/item-grns`,
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
    getApiV1ItemGrnsById: build.query<
      GetApiV1ItemGrnsByIdApiResponse,
      GetApiV1ItemGrnsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "item-grn", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/item-grns/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ItemGrnsById: build.mutation<
      PutApiV1ItemGrnsByIdApiResponse,
      PutApiV1ItemGrnsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "item-grn", id: "LIST" }, { type: "item-grn", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/item-grns/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesItemGrnsCreateItemGrnRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ItemGrnsById: build.mutation<
      DeleteApiV1ItemGrnsByIdApiResponse,
      DeleteApiV1ItemGrnsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "item-grn", id: "LIST" }, { type: "item-grn", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/item-grns/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ItemInventoryTransactionsByMemoId: build.query<
      GetApiV1ItemInventoryTransactionsByMemoIdApiResponse,
      GetApiV1ItemInventoryTransactionsByMemoIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "item-inventory-transaction", id: queryArg.memoId }],
      query: (queryArg) => ({
        url: `/api/v1/item-inventory-transactions/${queryArg.memoId}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ItemsStockRequisitions: build.mutation<
      PostApiV1ItemsStockRequisitionsApiResponse,
      PostApiV1ItemsStockRequisitionsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "item/stock-requisition", id: "LIST" }, { type: "item", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/items/stock-requisitions`,
        method: "POST",
        body: queryArg.domainEntitiesItemStockRequisitionsCreateItemStockRequisitionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1ItemsStockRequisitions: build.query<
      GetApiV1ItemsStockRequisitionsApiResponse,
      GetApiV1ItemsStockRequisitionsApiArg
    >({
      providesTags: [{ type: "item/stock-requisition", id: "LIST" }, { type: "item", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/items/stock-requisitions`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
        params: {
          page: queryArg.page,
          pageSize: queryArg.pageSize,
          searchQuery: queryArg.searchQuery,
          store: queryArg.store,
          status: queryArg.status,
        },
      }),
    }),
    getApiV1ItemsStockRequisitionsById: build.query<
      GetApiV1ItemsStockRequisitionsByIdApiResponse,
      GetApiV1ItemsStockRequisitionsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "item/stock-requisition", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/items/stock-requisitions/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1ItemsStockRequisitionsById: build.mutation<
      PutApiV1ItemsStockRequisitionsByIdApiResponse,
      PutApiV1ItemsStockRequisitionsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "item/stock-requisition", id: "LIST" }, { type: "item", id: "LIST" }, { type: "item/stock-requisition", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/items/stock-requisitions/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesItemStockRequisitionsCreateItemStockRequisitionRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1ItemsStockRequisitionsById: build.mutation<
      DeleteApiV1ItemsStockRequisitionsByIdApiResponse,
      DeleteApiV1ItemsStockRequisitionsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "item/stock-requisition", id: "LIST" }, { type: "item", id: "LIST" }, { type: "item/stock-requisition", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/items/stock-requisitions/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1ItemsStockRequisitionsByStockRequisitionIdIssueStockAgainstRequisition:
      build.mutation<
        PostApiV1ItemsStockRequisitionsByStockRequisitionIdIssueStockAgainstRequisitionApiResponse,
        PostApiV1ItemsStockRequisitionsByStockRequisitionIdIssueStockAgainstRequisitionApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/items/stock-requisitions/${queryArg.stockRequisitionId}/issue-stock-against-requisition`,
          method: "POST",
          body: queryArg.domainEntitiesItemStockRequisitionsIssueStockAgainstRequisitionRequest,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postApiV1ItemsStockRequisitionsByStockRequisitionIdPartialIssueStockAgainstRequisition:
      build.mutation<
        PostApiV1ItemsStockRequisitionsByStockRequisitionIdPartialIssueStockAgainstRequisitionApiResponse,
        PostApiV1ItemsStockRequisitionsByStockRequisitionIdPartialIssueStockAgainstRequisitionApiArg
      >({
        query: (queryArg) => ({
          url: `/api/v1/items/stock-requisitions/${queryArg.stockRequisitionId}/partial-issue-stock-against-requisition`,
          method: "POST",
          body: queryArg.domainEntitiesItemStockRequisitionsIssueStockAgainstRequisitionRequest,
          headers: {
            Module: queryArg["module"],
            SubModule: queryArg.subModule,
          },
        }),
      }),
    postV1RecoverableItemsReports: build.mutation<
      PostV1RecoverableItemsReportsApiResponse,
      PostV1RecoverableItemsReportsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "v1/recoverable-items-report", id: "LIST" }, { type: "v1", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/v1/recoverable-items-reports`,
        method: "POST",
        body: queryArg.domainEntitiesRecoverableItemsReportsCreateRecoverableItemReportRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getV1RecoverableItemsReports: build.query<
      GetV1RecoverableItemsReportsApiResponse,
      GetV1RecoverableItemsReportsApiArg
    >({
      providesTags: [{ type: "v1/recoverable-items-report", id: "LIST" }, { type: "v1", id: "LIST" }],
      query: (queryArg) => ({
        url: `/v1/recoverable-items-reports`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1RecoverableItemsReports: build.mutation<
      PostApiV1RecoverableItemsReportsApiResponse,
      PostApiV1RecoverableItemsReportsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "recoverable-items-report", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/recoverable-items-reports`,
        method: "POST",
        body: queryArg.domainEntitiesRecoverableItemsReportsCreateRecoverableItemReportRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1RecoverableItemsReports: build.query<
      GetApiV1RecoverableItemsReportsApiResponse,
      GetApiV1RecoverableItemsReportsApiArg
    >({
      providesTags: [{ type: "recoverable-items-report", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/recoverable-items-reports`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    postApiV1Vendors: build.mutation<
      PostApiV1VendorsApiResponse,
      PostApiV1VendorsApiArg
    >({
      invalidatesTags: (_result, error) => (error ? [] : [{ type: "vendor", id: "LIST" }]),
      query: (queryArg) => ({
        url: `/api/v1/vendors`,
        method: "POST",
        body: queryArg.domainEntitiesVendorsCreateVendorRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1Vendors: build.query<
      GetApiV1VendorsApiResponse,
      GetApiV1VendorsApiArg
    >({
      providesTags: [{ type: "vendor", id: "LIST" }],
      query: (queryArg) => ({
        url: `/api/v1/vendors`,
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
    getApiV1VendorsById: build.query<
      GetApiV1VendorsByIdApiResponse,
      GetApiV1VendorsByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "vendor", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/vendors/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    putApiV1VendorsById: build.mutation<
      PutApiV1VendorsByIdApiResponse,
      PutApiV1VendorsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "vendor", id: "LIST" }, { type: "vendor", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/vendors/${queryArg.id}`,
        method: "PUT",
        body: queryArg.domainEntitiesVendorsCreateVendorRequest,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    deleteApiV1VendorsById: build.mutation<
      DeleteApiV1VendorsByIdApiResponse,
      DeleteApiV1VendorsByIdApiArg
    >({
      invalidatesTags: (_result, error, queryArg) => (error ? [] : [{ type: "vendor", id: "LIST" }, { type: "vendor", id: queryArg.id }]),
      query: (queryArg) => ({
        url: `/api/v1/vendors/${queryArg.id}`,
        method: "DELETE",
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
    getApiV1VendorsItemById: build.query<
      GetApiV1VendorsItemByIdApiResponse,
      GetApiV1VendorsItemByIdApiArg
    >({
      providesTags: (_result, _error, queryArg) => [{ type: "vendor/item", id: queryArg.id }],
      query: (queryArg) => ({
        url: `/api/v1/vendors/item/${queryArg.id}`,
        headers: {
          Module: queryArg["module"],
          SubModule: queryArg.subModule,
        },
      }),
    }),
  }),
  overrideExisting: false,
});
export { injectedRtkApi as inventoryApi };
export type PostApiV1ProcurementInventoryApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ProcurementInventoryApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateInventoryPurchaseRequisition object containing requisition details. */
  domainEntitiesItemsRequisitionsCreateInventoryPurchaseRequisition: DomainEntitiesItemsRequisitionsCreateInventoryPurchaseRequisition;
};
export type GetApiV1ProcurementInventoryApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemsRequisitionsInventoryPurchaseRequisitionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProcurementInventoryApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Search query for filtering requisitions by code. */
  searchQuery?: string;
  status?: DomainEntitiesItemsRequisitionsInventoryPurchaseRequisitionStatus;
  anyStatus?: boolean;
  store?: DomainEntitiesItemsStore;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ProcurementInventoryByIdApiResponse = void;
export type PutApiV1ProcurementInventoryByIdApiArg = {
  /** The ID of the requisition to update. */
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateInventoryPurchaseRequisition object with updated details. */
  domainEntitiesItemsRequisitionsCreateInventoryPurchaseRequisition: DomainEntitiesItemsRequisitionsCreateInventoryPurchaseRequisition;
};
export type DeleteApiV1ProcurementInventoryByIdApiResponse = void;
export type DeleteApiV1ProcurementInventoryByIdApiArg = {
  /** The ID of the requisition to delete. */
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementInventoryByIdApiResponse =
  /** status 200 OK */ DomainEntitiesItemsRequisitionsInventoryPurchaseRequisitionDto;
export type GetApiV1ProcurementInventoryByIdApiArg = {
  /** The ID of the requisition to retrieve. */
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProcurementInventorySourceApiResponse = void;
export type PostApiV1ProcurementInventorySourceApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateSourceInventoryRequisition object containing the requisition ID and items. */
  domainEntitiesItemsRequisitionsCreateSourceInventoryRequisition: DomainEntitiesItemsRequisitionsCreateSourceInventoryRequisition;
};
export type PostApiV1ProcurementInventoryMarketApiResponse = void;
export type PostApiV1ProcurementInventoryMarketApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** A list of CreateMarketRequisition object containing item and requisition details. */
  body: DomainEntitiesItemsRequisitionsCreateMarketRequisition[];
};
export type GetApiV1ProcurementInventoryMarketApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemsRequisitionsMarketRequisitionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProcurementInventoryMarketApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  closed?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementInventoryMarketByIdApiResponse =
  /** status 200 OK */ DomainEntitiesItemsRequisitionsMarketRequisitionDto;
export type GetApiV1ProcurementInventoryMarketByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementInventoryPriceComparisonApiResponse =
  /** status 200 OK */ DomainEntitiesVendorQuotationsVendorPriceComparison[];
export type GetApiV1ProcurementInventoryPriceComparisonApiArg = {
  /** The source of the requisition (TrustedVendor or OpenMarket). */
  source?: DomainEntitiesItemsRequisitionsInventoryRequisitionSource;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProcurementInventoryMemoOpenMarketApiResponse = void;
export type PostApiV1ProcurementInventoryMemoOpenMarketApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** A list of ProcessMemo objects to be processed. */
  body: DomainEntitiesMemosCreateMemoItem[];
};
export type PostApiV1ProcurementInventoryMemoTrustedVendorApiResponse = void;
export type PostApiV1ProcurementInventoryMemoTrustedVendorApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** A list of ProcessMemo objects to be processed. */
  body: DomainEntitiesMemosCreateMemoItem[];
};
export type PostApiV1ProcurementInventoryVendorByVendorIdSendQuotationApiResponse = void;
export type PostApiV1ProcurementInventoryVendorByVendorIdSendQuotationApiArg = {
  /** The ID of the vendor to send the quotation request to. */
  vendorId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementInventoryVendorQuotationsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesVendorQuotationsVendorQuotationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProcurementInventoryVendorQuotationsApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** A boolean to filter by received or unreceived quotations. */
  received?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementInventoryVendorQuotationByVendorQuotationIdApiResponse =
  /** status 200 OK */ DomainEntitiesVendorQuotationsVendorQuotationDto;
export type GetApiV1ProcurementInventoryVendorQuotationByVendorQuotationIdApiArg =
  {
    /** The ID of the vendor quotation. */
    vendorQuotationId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type PostApiV1ProcurementInventoryVendorQuotationByVendorQuotationIdReceiveApiResponse = void;
export type PostApiV1ProcurementInventoryVendorQuotationByVendorQuotationIdReceiveApiArg =
  {
    /** The ID of the vendor quotation to receive. */
    vendorQuotationId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    /** A list of items and their quoted prices. */
    body: DomainEntitiesVendorQuotationsVendorQuotationResponseDto[];
  };
export type GetApiV1ProcurementInventoryMarketVendorsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemsRequisitionsMarketRequisitionVendorDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ProcurementInventoryMarketVendorsApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** A boolean to filter by completed or pending open market requisitions. */
  complete?: boolean;
  marketRequisitionId?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProcurementInventoryMarketVendorsApiResponse = void;
export type PostApiV1ProcurementInventoryMarketVendorsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  /** The CreateMarketRequisitionVendor object containing vendor details. */
  domainEntitiesItemsRequisitionsCreateMarketRequisitionVendor: DomainEntitiesItemsRequisitionsCreateMarketRequisitionVendor;
};
export type PostApiV1ProcurementInventoryMarketVendorsByMarketRequisitionVendorIdConfirmApiResponse = void;
export type PostApiV1ProcurementInventoryMarketVendorsByMarketRequisitionVendorIdConfirmApiArg =
  {
    /** The ID of the vendor to confirm. */
    marketRequisitionVendorId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
  };
export type GetApiV1ProcurementInventoryMemoApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMemosMemoDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1ProcurementInventoryMemoApiArg = {
  /** The current page number. */
  page?: number;
  /** The number of items per page. */
  pageSize?: number;
  /** Optional search query to filter by memo code. */
  searchQuery?: string;
  /** The status of the memo. (0 = Memo, 1 = PurchaseOrder) */
  status?: DomainEntitiesMemosMemoStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementInventoryMemoByIdApiResponse =
  /** status 200 OK */ DomainEntitiesMemosMemoDtoRead;
export type GetApiV1ProcurementInventoryMemoByIdApiArg = {
  /** The ID of the memo. */
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProcurementInventoryMemoItemByIdMarkPaidApiResponse = void;
export type PostApiV1ProcurementInventoryMemoItemByIdMarkPaidApiArg = {
  /** The ID of the memo item. */
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementInventoryMemoCodeGenerateApiResponse =
  /** status 200 OK */ string;
export type GetApiV1ProcurementInventoryMemoCodeGenerateApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ProcurementInventoryPurchasedItemsApiResponse =
  /** status 200 OK */ DomainEntitiesStockEntriesStockEntryDtoRead[];
export type GetApiV1ProcurementInventoryPurchasedItemsApiArg = {
  status?: DomainEntitiesApprovalsApprovalStatus;
  page?: number;
  pageSize?: number;
  store?: DomainEntitiesItemsStore;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProcurementInventoryItemsByIdApproveApiResponse = void;
export type PostApiV1ProcurementInventoryItemsByIdApproveApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ProcurementInventoryItemsByIdRejectApiResponse = void;
export type PostApiV1ProcurementInventoryItemsByIdRejectApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ItemsChoicesApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601ApiControllersStoreItemChoiceDto20Api20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ItemsChoicesApiArg = {
  store?: DomainEntitiesItemsStore;
  searchQuery?: string;
  page?: number;
  pageSize?: number;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ItemsShipmentInvoiceApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ItemsShipmentInvoiceApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesItemShipmentsCreateItemShipmentInvoice: DomainEntitiesItemShipmentsCreateItemShipmentInvoice;
};
export type GetApiV1ItemsShipmentInvoiceApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemShipmentsItemShipmentInvoiceDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ItemsShipmentInvoiceApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ItemsShipmentInvoiceByInvoiceIdApiResponse =
  /** status 200 OK */ DomainEntitiesItemShipmentsItemShipmentInvoiceDto;
export type GetApiV1ItemsShipmentInvoiceByInvoiceIdApiArg = {
  invoiceId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ItemsShipmentInvoiceByInvoiceIdApiResponse = void;
export type PutApiV1ItemsShipmentInvoiceByInvoiceIdApiArg = {
  invoiceId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesItemShipmentsCreateItemShipmentInvoice: DomainEntitiesItemShipmentsCreateItemShipmentInvoice;
};
export type DeleteApiV1ItemsShipmentInvoiceByInvoiceIdApiResponse = void;
export type DeleteApiV1ItemsShipmentInvoiceByInvoiceIdApiArg = {
  invoiceId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ItemsShipmentInvoiceUnattachedApiResponse =
  /** status 200 OK */ DomainEntitiesItemShipmentsItemShipmentInvoiceDto[];
export type GetApiV1ItemsShipmentInvoiceUnattachedApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ItemsShipmentInvoiceByInvoiceIdPaidApiResponse = void;
export type PutApiV1ItemsShipmentInvoiceByInvoiceIdPaidApiArg = {
  paidAt?: string;
  invoiceId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ItemsShipmentDocumentApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ItemsShipmentDocumentApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesItemShipmentsCreateItemShipmentDocumentRequest: DomainEntitiesItemShipmentsCreateItemShipmentDocumentRequest;
};
export type GetApiV1ItemsShipmentDocumentApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemShipmentsItemShipmentDocumentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ItemsShipmentDocumentApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  onlyApproved?: boolean;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ItemsShipmentDocumentByShipmentDocumentIdApiResponse =
  /** status 200 OK */ DomainEntitiesItemShipmentsItemShipmentDocumentDto;
export type GetApiV1ItemsShipmentDocumentByShipmentDocumentIdApiArg = {
  shipmentDocumentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ItemsShipmentDocumentByShipmentDocumentIdApiResponse = void;
export type PutApiV1ItemsShipmentDocumentByShipmentDocumentIdApiArg = {
  shipmentDocumentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesItemShipmentsCreateItemShipmentDocumentRequest: DomainEntitiesItemShipmentsCreateItemShipmentDocumentRequest;
};
export type DeleteApiV1ItemsShipmentDocumentByShipmentDocumentIdApiResponse = void;
export type DeleteApiV1ItemsShipmentDocumentByShipmentDocumentIdApiArg = {
  shipmentDocumentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ItemsShipmentDocumentByShipmentDocumentIdArrivedApiResponse = void;
export type PutApiV1ItemsShipmentDocumentByShipmentDocumentIdArrivedApiArg = {
  shipmentDocumentId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ItemsWaybillApiResponse = /** status 200 OK */ string;
export type PostApiV1ItemsWaybillApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesItemShipmentsCreateItemShipmentDocumentRequest: DomainEntitiesItemShipmentsCreateItemShipmentDocumentRequest;
};
export type GetApiV1ItemsWaybillApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemShipmentsItemShipmentDocumentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ItemsWaybillApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesShipmentsShipmentStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ItemsWaybillByWaybillIdApiResponse =
  /** status 200 OK */ DomainEntitiesItemShipmentsItemShipmentDocumentDto;
export type GetApiV1ItemsWaybillByWaybillIdApiArg = {
  waybillId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ItemsWaybillByWaybillIdApiResponse = void;
export type PutApiV1ItemsWaybillByWaybillIdApiArg = {
  waybillId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesItemShipmentsCreateItemShipmentDocumentRequest: DomainEntitiesItemShipmentsCreateItemShipmentDocumentRequest;
};
export type DeleteApiV1ItemsWaybillByWaybillIdApiResponse = void;
export type DeleteApiV1ItemsWaybillByWaybillIdApiArg = {
  waybillId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ItemsBillingSheetApiResponse = /** status 200 OK */ string;
export type PostApiV1ItemsBillingSheetApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesItemShipmentsCreateItemBillingSheetRequest: DomainEntitiesItemShipmentsCreateItemBillingSheetRequest;
};
export type GetApiV1ItemsBillingSheetApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemShipmentsItemBillingSheetDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ItemsBillingSheetApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  status?: DomainEntitiesPurchaseOrdersBillingSheetStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ItemsBillingSheetByBillingSheetIdApiResponse =
  /** status 200 OK */ DomainEntitiesItemShipmentsItemBillingSheetDto;
export type GetApiV1ItemsBillingSheetByBillingSheetIdApiArg = {
  billingSheetId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ItemsBillingSheetByBillingSheetIdApiResponse = void;
export type PutApiV1ItemsBillingSheetByBillingSheetIdApiArg = {
  billingSheetId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesItemShipmentsUpdateItemBillingSheetRequest: DomainEntitiesItemShipmentsUpdateItemBillingSheetRequest;
};
export type DeleteApiV1ItemsBillingSheetByBillingSheetIdApiResponse = void;
export type DeleteApiV1ItemsBillingSheetByBillingSheetIdApiArg = {
  billingSheetId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ItemsBillingSheetInvoiceByInvoiceIdApiResponse =
  /** status 200 OK */ DomainEntitiesItemShipmentsItemBillingSheetDto;
export type GetApiV1ItemsBillingSheetInvoiceByInvoiceIdApiArg = {
  invoiceId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ItemsBillingSheetByBillingSheetIdChargesApiResponse = void;
export type PutApiV1ItemsBillingSheetByBillingSheetIdChargesApiArg = {
  billingSheetId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  body: DomainEntitiesPurchaseOrdersRequestCreateBillingSheetCharge[];
};
export type PutApiV1ItemsBillingSheetChargesPaidApiResponse = void;
export type PutApiV1ItemsBillingSheetChargesPaidApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesPurchaseOrdersRequestMarkBillingSheetCharge: DomainEntitiesPurchaseOrdersRequestMarkBillingSheetCharge;
};
export type PostApiV1ItemsApiResponse = /** status 200 OK */ string;
export type PostApiV1ItemsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesItemsCreateItemsRequest: DomainEntitiesItemsCreateItemsRequest;
};
export type GetApiV1ItemsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemsItemDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ItemsApiArg = {
  store?: DomainEntitiesItemsStore;
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ItemsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesItemsItemDto;
export type GetApiV1ItemsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ItemsByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesItemsItemDto;
export type PutApiV1ItemsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesItemsCreateItemsRequest: DomainEntitiesItemsCreateItemsRequest;
};
export type DeleteApiV1ItemsByIdApiResponse = void;
export type DeleteApiV1ItemsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ItemsByItemCodeTransactionsApiResponse =
  /** status 200 OK */ DomainEntitiesItemTransactionLogsItemTransactionLogDto[];
export type GetApiV1ItemsByItemCodeTransactionsApiArg = {
  /** The item code */
  itemCode: string;
  /** The transaction type */
  transactionType?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ItemGrnsApiResponse = /** status 200 OK */ string;
export type PostApiV1ItemGrnsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesItemGrnsCreateItemGrnRequest: DomainEntitiesItemGrnsCreateItemGrnRequest;
};
export type GetApiV1ItemGrnsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemGrnsItemGrnDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1ItemGrnsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ItemGrnsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesItemGrnsItemGrnDto;
export type GetApiV1ItemGrnsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ItemGrnsByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesDesignationsDesignationDto;
export type PutApiV1ItemGrnsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesItemGrnsCreateItemGrnRequest: DomainEntitiesItemGrnsCreateItemGrnRequest;
};
export type DeleteApiV1ItemGrnsByIdApiResponse = void;
export type DeleteApiV1ItemGrnsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ItemInventoryTransactionsByMemoIdApiResponse =
  /** status 200 OK */ DomainEntitiesItemInventoryTransactionsItemInventoryTransactionDtoRead;
export type GetApiV1ItemInventoryTransactionsByMemoIdApiArg = {
  memoId: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ItemsStockRequisitionsApiResponse =
  /** status 200 OK */ string;
export type PostApiV1ItemsStockRequisitionsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesItemStockRequisitionsCreateItemStockRequisitionRequest: DomainEntitiesItemStockRequisitionsCreateItemStockRequisitionRequest;
};
export type GetApiV1ItemsStockRequisitionsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemStockRequisitionsItemStockRequisitionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead;
export type GetApiV1ItemsStockRequisitionsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  store?: DomainEntitiesItemsStore;
  status?: DomainEntitiesItemStockRequisitionsIssueItemStockRequisitionStatus;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1ItemsStockRequisitionsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesItemStockRequisitionsItemStockRequisitionDtoRead;
export type GetApiV1ItemsStockRequisitionsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1ItemsStockRequisitionsByIdApiResponse = void;
export type PutApiV1ItemsStockRequisitionsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesItemStockRequisitionsCreateItemStockRequisitionRequest: DomainEntitiesItemStockRequisitionsCreateItemStockRequisitionRequest;
};
export type DeleteApiV1ItemsStockRequisitionsByIdApiResponse = void;
export type DeleteApiV1ItemsStockRequisitionsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1ItemsStockRequisitionsByStockRequisitionIdIssueStockAgainstRequisitionApiResponse = void;
export type PostApiV1ItemsStockRequisitionsByStockRequisitionIdIssueStockAgainstRequisitionApiArg =
  {
    stockRequisitionId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesItemStockRequisitionsIssueStockAgainstRequisitionRequest: DomainEntitiesItemStockRequisitionsIssueStockAgainstRequisitionRequest;
  };
export type PostApiV1ItemsStockRequisitionsByStockRequisitionIdPartialIssueStockAgainstRequisitionApiResponse = void;
export type PostApiV1ItemsStockRequisitionsByStockRequisitionIdPartialIssueStockAgainstRequisitionApiArg =
  {
    stockRequisitionId: string;
    /** The module this request falls under */
    module?: string;
    /** The sub module this request falls under */
    subModule?: string;
    domainEntitiesItemStockRequisitionsIssueStockAgainstRequisitionRequest: DomainEntitiesItemStockRequisitionsIssueStockAgainstRequisitionRequest;
  };
export type PostV1RecoverableItemsReportsApiResponse =
  /** status 200 OK */ string;
export type PostV1RecoverableItemsReportsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesRecoverableItemsReportsCreateRecoverableItemReportRequest: DomainEntitiesRecoverableItemsReportsCreateRecoverableItemReportRequest;
};
export type GetV1RecoverableItemsReportsApiResponse =
  /** status 200 OK */ DomainEntitiesRecoverableItemsReportsRecoverableItemReportDto[];
export type GetV1RecoverableItemsReportsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1RecoverableItemsReportsApiResponse =
  /** status 200 OK */ string;
export type PostApiV1RecoverableItemsReportsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesRecoverableItemsReportsCreateRecoverableItemReportRequest: DomainEntitiesRecoverableItemsReportsCreateRecoverableItemReportRequest;
};
export type GetApiV1RecoverableItemsReportsApiResponse =
  /** status 200 OK */ DomainEntitiesRecoverableItemsReportsRecoverableItemReportDto[];
export type GetApiV1RecoverableItemsReportsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PostApiV1VendorsApiResponse = /** status 200 OK */ string;
export type PostApiV1VendorsApiArg = {
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesVendorsCreateVendorRequest: DomainEntitiesVendorsCreateVendorRequest;
};
export type GetApiV1VendorsApiResponse =
  /** status 200 OK */ AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesVendorsVendorDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E;
export type GetApiV1VendorsApiArg = {
  page?: number;
  pageSize?: number;
  searchQuery?: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1VendorsByIdApiResponse =
  /** status 200 OK */ DomainEntitiesVendorsVendorDto;
export type GetApiV1VendorsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type PutApiV1VendorsByIdApiResponse =
  /** status 204 No Content */ DomainEntitiesVendorsVendorDto;
export type PutApiV1VendorsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
  domainEntitiesVendorsCreateVendorRequest: DomainEntitiesVendorsCreateVendorRequest;
};
export type DeleteApiV1VendorsByIdApiResponse = void;
export type DeleteApiV1VendorsByIdApiArg = {
  id: string;
  /** The module this request falls under */
  module?: string;
  /** The sub module this request falls under */
  subModule?: string;
};
export type GetApiV1VendorsItemByIdApiResponse =
  /** status 200 OK */ DomainEntitiesVendorsVendorDto[];
export type GetApiV1VendorsItemByIdApiArg = {
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
export type DomainEntitiesItemsRequisitionsCreateInventoryPurchaseRequisitionItem =
  {
    itemId: string;
    uoMId?: string;
    quantity?: number;
  };
export type DomainEntitiesItemsRequisitionsCreateInventoryPurchaseRequisition =
  {
    code: string;
    expectedDeliveryDate?: string | null;
    remarks?: string | null;
    items: DomainEntitiesItemsRequisitionsCreateInventoryPurchaseRequisitionItem[];
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
export type DomainEntitiesItemsRequisitionsInventoryPurchaseRequisitionStatus =
  0 | 1;
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
export type DomainEntitiesRequisitionsRequestStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesItemsRequisitionsInventoryPurchaseRequisitionItemDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    inventoryPurchaseRequisition?: SharedCollectionItemDto;
    item?: DomainEntitiesItemsItemDto;
    uoM?: DomainEntitiesBaseUnitOfMeasureDto;
    quantity?: number;
    status?: DomainEntitiesRequisitionsRequestStatus;
  };
export type DomainEntitiesItemsRequisitionsInventoryPurchaseRequisitionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  expectedDeliveryDate?: string | null;
  remarks?: string | null;
  status?: DomainEntitiesItemsRequisitionsInventoryPurchaseRequisitionStatus;
  items?:
    DomainEntitiesItemsRequisitionsInventoryPurchaseRequisitionItemDto[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemsRequisitionsInventoryPurchaseRequisitionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?:
      DomainEntitiesItemsRequisitionsInventoryPurchaseRequisitionDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesItemsRequisitionsInventoryRequisitionSource = 0 | 1;
export type DomainEntitiesItemsRequisitionsCreateSourceInventoryRequisitionItemVendor =
  {
    vendorId?: string;
  };
export type DomainEntitiesItemsRequisitionsCreateSourceInventoryRequisitionItem =
  {
    itemId?: string;
    uoMId?: string;
    quantity?: number;
    source?: DomainEntitiesItemsRequisitionsInventoryRequisitionSource;
    vendors?:
      | DomainEntitiesItemsRequisitionsCreateSourceInventoryRequisitionItemVendor[]
      | null;
  };
export type DomainEntitiesItemsRequisitionsCreateSourceInventoryRequisition = {
  inventoryPurchaseRequisitionId?: string;
  items?:
    | DomainEntitiesItemsRequisitionsCreateSourceInventoryRequisitionItem[]
    | null;
};
export type DomainEntitiesItemsRequisitionsCreateMarketRequisition = {
  inventoryPurchaseRequisitionItemId?: string;
  itemId?: string;
  uoMId?: string;
  quantity?: number;
};
export type DomainEntitiesItemsRequisitionsMarketRequisitionDto = {
  id?: string;
  inventoryPurchaseRequisitionItem?: DomainEntitiesItemsRequisitionsInventoryPurchaseRequisitionItemDto;
  item?: DomainEntitiesItemsItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  requisitionCode?: string | null;
  inventoryPurchaseRequisitionId?: string | null;
  vendorCount?: number;
  closed?: boolean;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemsRequisitionsMarketRequisitionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesItemsRequisitionsMarketRequisitionDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesVendorQuotationsVendorQuotationItemDto = {
  id?: string;
  item?: DomainEntitiesItemsItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  quotedPrice?: number | null;
  priceUoM?: string | null;
  termsOfPayment?: SharedCollectionItemDto;
  deliveryMode?: string | null;
  estimatedDeliveryDate?: string;
};
export type DomainEntitiesVendorQuotationsVendorQuotationItemStatus = 0 | 1 | 2;
export type DomainEntitiesVendorQuotationsVendorPrice = {
  vendor?: SharedCollectionItemDto;
  vendorQuotationItem?: DomainEntitiesVendorQuotationsVendorQuotationItemDto;
  status?: DomainEntitiesVendorQuotationsVendorQuotationItemStatus;
  vendorName?: string | null;
  vendorAddress?: string | null;
  vendorPhoneNumber?: string | null;
  pricePerUnit?: number;
  priceUoM?: string | null;
  modeOfPayment?: string | null;
  openMarketTermsOfPayment?: SharedCollectionItemDto;
  deliveryMode?: string | null;
  estimatedDeliveryDate?: string;
};
export type DomainEntitiesVendorQuotationsVendorPriceComparison = {
  item?: SharedCollectionItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  vendorPrices?: DomainEntitiesVendorQuotationsVendorPrice[] | null;
};
export type DomainEntitiesMemosCreateMemoItem = {
  vendorQuotationItemId?: string | null;
  marketRequisitionVendorId?: string | null;
  itemId?: string;
  uoMId?: string;
  quantity?: number;
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
export type DomainEntitiesVendorsVendorItemDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  item?: DomainEntitiesItemsItemDto;
};
export type DomainEntitiesVendorsVendorDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  countryId?: string;
  country?: DomainEntitiesCountriesCountryDto;
  currencyId?: string;
  contactPerson?: string | null;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  items?: DomainEntitiesVendorsVendorItemDto[] | null;
};
export type DomainEntitiesItemsRequisitionsSourceInventoryRequisitionItemDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  item?: DomainEntitiesItemsItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
};
export type DomainEntitiesItemsRequisitionsSourceInventoryRequisitionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  inventoryPurchaseRequisition?: DomainEntitiesItemsRequisitionsInventoryPurchaseRequisitionDto;
  vendor?: DomainEntitiesVendorsVendorDto;
  remarks?: string | null;
  sentQuotationRequestAt?: string | null;
  items?:
    DomainEntitiesItemsRequisitionsSourceInventoryRequisitionItemDto[] | null;
};
export type DomainEntitiesVendorQuotationsVendorQuotationDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  vendor?: DomainEntitiesVendorsVendorDto;
  sourceInventoryRequisition?: DomainEntitiesItemsRequisitionsSourceInventoryRequisitionDto;
  items?: DomainEntitiesVendorQuotationsVendorQuotationItemDto[] | null;
  receivedQuotation?: boolean;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesVendorQuotationsVendorQuotationDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesVendorQuotationsVendorQuotationDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesVendorQuotationsVendorQuotationResponseDto = {
  id?: string;
  price?: number;
  priceUoM?: string | null;
};
export type DomainEntitiesItemsRequisitionsMarketRequisitionVendorDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  marketRequisitionId?: string;
  vendorName?: string | null;
  vendorAddress?: string | null;
  vendorPhoneNumber?: string | null;
  pricePerUnit?: number;
  priceUoM?: string | null;
  modeOfPayment?: string | null;
  termsOfPayment?: SharedCollectionItemDto;
  deliveryMode?: string | null;
  estimatedDeliveryDate?: string;
  complete?: boolean;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemsRequisitionsMarketRequisitionVendorDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesItemsRequisitionsMarketRequisitionVendorDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesItemsRequisitionsCreateMarketRequisitionVendorDetails =
  {
    vendorName?: string | null;
    vendorAddress?: string | null;
    vendorPhoneNumber?: string | null;
    pricePerUnit?: number;
    modeOfPayment?: string | null;
    termsOfPaymentId?: string;
    deliveryMode?: string | null;
    complete?: boolean;
  };
export type DomainEntitiesItemsRequisitionsCreateMarketRequisitionVendor = {
  marketRequisitionId?: string;
  vendors?:
    | DomainEntitiesItemsRequisitionsCreateMarketRequisitionVendorDetails[]
    | null;
};
export type DomainEntitiesMemosMemoStatus = 0 | 1;
export type DomainEntitiesMemosMemoItemDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  purchasedAt?: string | null;
  vendorQuotationItemId?: string | null;
  marketRequisitionVendorId?: string | null;
  memo?: SharedCollectionItemDto;
  vendor?: SharedCollectionItemDto;
  item?: SharedCollectionItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  pricePerUnit?: number;
  priceUoM?: string | null;
  termsOfPayment?: SharedCollectionItemDto;
  deliveryMode?: string | null;
  estimatedDeliveryDate?: string;
};
export type DomainEntitiesMemosMemoItemDtoRead = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  purchasedAt?: string | null;
  vendorQuotationItemId?: string | null;
  marketRequisitionVendorId?: string | null;
  memo?: SharedCollectionItemDto;
  vendor?: SharedCollectionItemDto;
  item?: SharedCollectionItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  quantity?: number;
  pricePerUnit?: number;
  priceUoM?: string | null;
  itemValue?: number;
  termsOfPayment?: SharedCollectionItemDto;
  deliveryMode?: string | null;
  estimatedDeliveryDate?: string;
};
export type DomainEntitiesMemosMemoDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  paid?: boolean;
  status?: DomainEntitiesMemosMemoStatus;
  items?: DomainEntitiesMemosMemoItemDto[] | null;
};
export type DomainEntitiesMemosMemoDtoRead = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  paid?: boolean;
  status?: DomainEntitiesMemosMemoStatus;
  items?: DomainEntitiesMemosMemoItemDtoRead[] | null;
  totalValue?: number;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMemosMemoDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesMemosMemoDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesMemosMemoDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?: DomainEntitiesMemosMemoDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesApprovalsApprovalStatus = 0 | 1 | 2;
export type DomainEntitiesStockEntriesStockEntryDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  itemId?: string;
  item?: DomainEntitiesItemsItemDto;
  memoId?: string;
  memo?: DomainEntitiesMemosMemoDto;
  quantity?: number;
  status?: DomainEntitiesApprovalsApprovalStatus;
};
export type DomainEntitiesStockEntriesStockEntryDtoRead = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  itemId?: string;
  item?: DomainEntitiesItemsItemDto;
  memoId?: string;
  memo?: DomainEntitiesMemosMemoDtoRead;
  quantity?: number;
  status?: DomainEntitiesApprovalsApprovalStatus;
};
export type ApiControllersStoreItemChoiceDto = {
  id?: string;
  name?: string | null;
  code?: string | null;
  store?: DomainEntitiesItemsStore;
  classification?: DomainEntitiesItemsInventoryClassification;
  availableQuantity?: number;
  unitOfMeasureId?: string;
  unitOfMeasureName?: string | null;
  unitOfMeasureSymbol?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601ApiControllersStoreItemChoiceDto20Api20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: ApiControllersStoreItemChoiceDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesItemShipmentsCreateItemShipmentInvoiceItem = {
  itemId?: string;
  uoMId?: string;
  purchaseOrderId?: string;
  expectedQuantity?: number;
  receivedQuantity?: number;
  reason?: string | null;
  totalCost?: number;
  currencyId?: string | null;
};
export type DomainEntitiesItemShipmentsCreateItemShipmentInvoice = {
  code?: string | null;
  vendorId?: string | null;
  shipmentArrivedAt?: string;
  items?: DomainEntitiesItemShipmentsCreateItemShipmentInvoiceItem[] | null;
  totalCost?: number;
  currencyId?: string | null;
};
export type DomainEntitiesProcurementSuppliersSupplierType = 0 | 1;
export type DomainEntitiesProcurementSuppliersSupplierStatus = 0 | 1 | 2;
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
  /** Purchase-unit symbol; the unit ID remains a legacy quantity-unit reference. */
  purchaseUnit?: string | null;
  /** Unit symbol awaiting pricing approval. */
  pendingPurchaseUnit?: string | null;
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
export type DomainEntitiesItemShipmentsItemShipmentInvoiceItemDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  item?: DomainEntitiesItemsItemDto;
  uoM?: DomainEntitiesBaseUnitOfMeasureDto;
  expectedQuantity?: number;
  receivedQuantity?: number;
  totalCost?: number;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  reason?: string | null;
};
export type DomainEntitiesItemShipmentsItemShipmentInvoiceDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  items?: DomainEntitiesItemShipmentsItemShipmentInvoiceItemDto[] | null;
  totalCost?: number;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  paidAt?: string | null;
  isUsed?: boolean;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemShipmentsItemShipmentInvoiceDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesItemShipmentsItemShipmentInvoiceDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesItemShipmentsCreateItemShipmentDocumentRequest = {
  code?: string | null;
  itemShipmentInvoiceId?: string | null;
};
export type DomainEntitiesShipmentsDocType = 0 | 1;
export type DomainEntitiesShipmentsShipmentStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesItemShipmentsItemShipmentDocumentDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  itemShipmentInvoice?: DomainEntitiesItemShipmentsItemShipmentInvoiceDto;
  arrivedAt?: string | null;
  clearedAt?: string | null;
  transitStartedAt?: string | null;
  type?: DomainEntitiesShipmentsDocType;
  status?: DomainEntitiesShipmentsShipmentStatus;
  atPortAt?: string | null;
  approved?: boolean;
  hasBillingSheet?: boolean;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemShipmentsItemShipmentDocumentDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesItemShipmentsItemShipmentDocumentDto[] | null;
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
export type DomainEntitiesItemShipmentsCreateItemBillingSheetRequest = {
  code?: string | null;
  billOfLading?: string | null;
  vendorId?: string | null;
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
export type DomainEntitiesPurchaseOrdersBillingSheetStatus = 0 | 1 | 2;
export type DomainEntitiesChargesChargeDto = {
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesItemShipmentsItemBillingSheetChargeDto = {
  id?: string;
  charge?: DomainEntitiesChargesChargeDto;
  currency?: DomainEntitiesCurrenciesCurrencyDto;
  amount?: number;
  paid?: boolean;
};
export type DomainEntitiesItemShipmentsItemBillingSheetDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  code?: string | null;
  billOfLading?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  invoice?: DomainEntitiesItemShipmentsItemShipmentInvoiceDto;
  expectedArrivalDate?: string;
  status?: DomainEntitiesPurchaseOrdersBillingSheetStatus;
  freeTimeExpiryDate?: string;
  freeTimeDuration?: string | null;
  demurrageStartDate?: string;
  charges?: DomainEntitiesItemShipmentsItemBillingSheetChargeDto[] | null;
  containerNumber?: string | null;
  numberOfPackages?: string | null;
  packageDescription?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemShipmentsItemBillingSheetDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesItemShipmentsItemBillingSheetDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesItemShipmentsUpdateItemBillingSheetRequest = {
  code?: string | null;
  billOfLading?: string | null;
  vendorId?: string | null;
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
export type DomainEntitiesPurchaseOrdersRequestMarkBillingSheetCharge = {
  billingSheetChargeIds?: string[] | null;
};
export type DomainEntitiesItemsCreateItemsRequest = {
  name: string;
  code: string;
  classification: DomainEntitiesItemsInventoryClassification;
  unitOfMeasureId: string;
  minimumLevel?: number;
  maximumLevel?: number;
  reorderLevel?: number;
  store: DomainEntitiesItemsStore;
  isActive: boolean;
  itemCategoryId?: string | null;
  description?: string | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemsItemDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesItemsItemDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesItemTransactionLogsItemTransactionLogDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  date?: string;
  transactionType?: string | null;
  itemCode?: string | null;
  credit?: number;
  debit?: number;
  totalBalance?: number;
  shadowHold?: number;
};
export type DomainEntitiesItemGrnsCreateItemGrnRequest = {
  itemId: string;
  supplierId: string;
  invoiceNumber: string;
  quantityReceived: number;
};
export type DomainEntitiesItemGrnsItemGrnDto = {
  itemId?: string;
  item?: DomainEntitiesItemsItemDto;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplierDto;
  invoiceNumber?: string | null;
  quantityReceived?: number;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemGrnsItemGrnDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesItemGrnsItemGrnDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
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
export type DomainEntitiesEmployeesGender = 0 | 1;
export type DomainEntitiesEmployeesMaritalStatus = 0 | 1;
export type DomainEntitiesEmployeesReligion = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export type DomainEntitiesEmployeesEmployeeType = 0 | 1;
export type DomainEntitiesPersonsLifeStatus = 0 | 1;
export type DomainEntitiesPersonsPersonDto = {
  fullName?: string | null;
  phoneNumber?: string | null;
  occupation?: string | null;
  lifeStatus?: DomainEntitiesPersonsLifeStatus;
};
export type DomainEntitiesEmergencyContactsEmergencyContactDto = {
  fullName?: string | null;
  contactNumber?: string | null;
  relationship?: string | null;
  residentialAddress?: string | null;
};
export type DomainEntitiesChildrenChildDto = {
  fullName?: string | null;
  dateOfBirth?: string;
  gender?: DomainEntitiesEmployeesGender;
};
export type DomainEntitiesSiblingsSiblingDto = {
  fullName?: string | null;
  contact?: string | null;
  gender?: DomainEntitiesEmployeesGender;
};
export type DomainEntitiesEducationHistoriesEducationDto = {
  schoolName?: string | null;
  startDate?: string;
  endDate?: string;
  major?: string | null;
  qualificationEarned?: string | null;
};
export type DomainEntitiesEmployeeHistoriesEmploymentHistoryDto = {
  companyName?: string | null;
  startDate?: string;
  endDate?: string;
  position?: string | null;
};
export type DomainEntitiesEmployeesEmployeeLevel = 0 | 1 | 2;
export type DomainEntitiesEmployeesEmployeeStatus = 0 | 1 | 2;
export type DomainEntitiesEmployeesEmployeeActiveStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesEmployeesEmployeeInactiveStatus =
  0 | 1 | 2 | 3 | 4 | 5;
export type DomainEntitiesEmployeesEmployeeDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  attachments?: DomainEntitiesAttachmentsAttachmentDto[] | null;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  dateOfBirth?: string;
  gender?: DomainEntitiesEmployeesGender;
  residentialAddress?: string | null;
  annualLeaveDays?: number;
  nationality?: string | null;
  bankAccountNumber?: string | null;
  ssnitNumber?: string | null;
  ghanaCardNumber?: string | null;
  region?: string | null;
  maritalStatus?: DomainEntitiesEmployeesMaritalStatus;
  religion?: DomainEntitiesEmployeesReligion;
  staffNumber?: string | null;
  email?: string | null;
  phoneNumber?: string | null;
  type?: DomainEntitiesEmployeesEmployeeType;
  dateEmployed?: string;
  designation?: DomainEntitiesDesignationsDesignationDto;
  department?: DomainEntitiesDepartmentsDepartmentDto;
  reportingManagerId?: string | null;
  reportingManager?: DomainEntitiesUsersUserDto;
  mother?: DomainEntitiesPersonsPersonDto;
  father?: DomainEntitiesPersonsPersonDto;
  spouse?: DomainEntitiesPersonsPersonDto;
  emergencyContact?: DomainEntitiesEmergencyContactsEmergencyContactDto;
  nextOfKin?: DomainEntitiesEmergencyContactsEmergencyContactDto;
  children?: DomainEntitiesChildrenChildDto[] | null;
  siblings?: DomainEntitiesSiblingsSiblingDto[] | null;
  educationBackground?: DomainEntitiesEducationHistoriesEducationDto[] | null;
  employmentHistory?:
    DomainEntitiesEmployeeHistoriesEmploymentHistoryDto[] | null;
  level?: DomainEntitiesEmployeesEmployeeLevel;
  status?: DomainEntitiesEmployeesEmployeeStatus;
  activeStatus?: DomainEntitiesEmployeesEmployeeActiveStatus;
  inactiveStatus?: DomainEntitiesEmployeesEmployeeInactiveStatus;
  suspensionStartDate?: string | null;
  suspensionEndDate?: string | null;
};
export type DomainEntitiesDesignationsDesignationDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  name?: string | null;
  description?: string | null;
  maximumLeaveDays?: number;
  departments?: DomainEntitiesDepartmentsDepartmentDto[] | null;
  employees?: DomainEntitiesEmployeesEmployeeDto[] | null;
};
export type DomainEntitiesItemInventoryTransactionsItemInventoryTransactionDto =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    date?: string;
    memoId?: string;
    memo?: DomainEntitiesMemosMemoDto;
    quantityReceived?: number;
    quantityIssued?: number;
    balanceQuantity?: number;
  };
export type DomainEntitiesItemInventoryTransactionsItemInventoryTransactionDtoRead =
  {
    id?: string;
    createdBy?: DomainEntitiesUsersUserDto;
    createdAt?: string;
    date?: string;
    memoId?: string;
    memo?: DomainEntitiesMemosMemoDtoRead;
    quantityReceived?: number;
    quantityIssued?: number;
    balanceQuantity?: number;
  };
export type DomainEntitiesItemsStockItems = {
  itemId?: string;
  quantityRequested?: number;
};
export type DomainEntitiesItemStockRequisitionsCreateItemStockRequisitionRequest =
  {
    number?: string | null;
    requestedById: string;
    departmentId: string;
    justification?: string | null;
    stockItems: DomainEntitiesItemsStockItems[];
  };
export type DomainEntitiesItemStockRequisitionsIssueItemStockRequisitionStatus =
  0 | 1 | 2;
export type DomainEntitiesMaterialsMaterialCategory = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
};
export type DomainEntitiesMaterialsMaterialCategoryRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
  materialKind?: DomainEntitiesMaterialsMaterialKind;
};
export type DomainEntitiesMaterialsBatchKind = 0 | 1;
export type DomainEntitiesBaseUnitOfMeasure = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isScalable?: boolean;
  isRawMaterial?: boolean;
  type?: DomainEntitiesBaseUnitOfMeasureType;
  category?: DomainEntitiesBaseUnitOfMeasureCategory;
};
export type DomainEntitiesBaseUnitOfMeasureRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isScalable?: boolean;
  isRawMaterial?: boolean;
  type?: DomainEntitiesBaseUnitOfMeasureType;
  category?: DomainEntitiesBaseUnitOfMeasureCategory;
};
export type DomainEntitiesMaterialsMaterialDepartment = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
  density?: number;
  densityUoMId?: string | null;
  densityUoM?: DomainEntitiesBaseUnitOfMeasure;
  reOrderLevel?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
};
export type DomainEntitiesMaterialsMaterialDepartmentRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
  density?: number;
  densityUoMId?: string | null;
  densityUoM?: DomainEntitiesBaseUnitOfMeasureRead;
  reOrderLevel?: number;
  minimumStockLevel?: number;
  maximumStockLevel?: number;
};
export type DomainEntitiesMaterialsMaterial = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  pharmacopoeia?: string | null;
  alphabet?: string | null;
  materialCategoryId?: string | null;
  materialCategory?: DomainEntitiesMaterialsMaterialCategory;
  batches?: DomainEntitiesMaterialsBatchMaterialBatch[] | null;
  kind?: DomainEntitiesMaterialsMaterialKind;
  status?: DomainEntitiesMaterialsBatchKind;
  isUnlimited?: boolean;
  departments?: DomainEntitiesMaterialsMaterialDepartment[] | null;
};
export type DomainEntitiesMaterialsMaterialRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  pharmacopoeia?: string | null;
  alphabet?: string | null;
  materialCategoryId?: string | null;
  materialCategory?: DomainEntitiesMaterialsMaterialCategoryRead;
  batches?: DomainEntitiesMaterialsBatchMaterialBatch[] | null;
  kind?: DomainEntitiesMaterialsMaterialKind;
  status?: DomainEntitiesMaterialsBatchKind;
  isUnlimited?: boolean;
  totalStock?: number;
  departments?: DomainEntitiesMaterialsMaterialDepartmentRead[] | null;
};
export type DomainEntitiesBaseProductionStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesProductionSchedulesProductionSchedule = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  status?: DomainEntitiesBaseProductionStatus;
  remarks?: string | null;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  products?:
    DomainEntitiesProductionSchedulesProductionScheduleProduct[] | null;
};
export type DomainEntitiesProductionSchedulesProductionScheduleRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  status?: DomainEntitiesBaseProductionStatus;
  remarks?: string | null;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  products?:
    DomainEntitiesProductionSchedulesProductionScheduleProduct[] | null;
};
export type DomainEntitiesProductsProductCategory = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesProductsProductCategoryRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesProductsEquipmentsEquipment = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  equipmentNumber?: string | null;
  isStorage?: boolean;
  capacityQuantity?: number;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  relevanceCheck?: boolean;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
  location?: string | null;
  model?: string | null;
  serialNumber?: string | null;
};
export type DomainEntitiesProductsEquipmentsEquipmentRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  equipmentNumber?: string | null;
  isStorage?: boolean;
  capacityQuantity?: number;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  relevanceCheck?: boolean;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
  location?: string | null;
  model?: string | null;
  serialNumber?: string | null;
};
export type DomainEntitiesProductsFinishedProduct = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  standardCost?: number;
  sellingPrice?: number;
  dosageForm?: string | null;
  strength?: string | null;
};
export type DomainEntitiesProductsFinishedProductRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  standardCost?: number;
  sellingPrice?: number;
  dosageForm?: string | null;
  strength?: string | null;
};
export type DomainEntitiesMaterialsMaterialType = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesMaterialsMaterialTypeRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesBillOfMaterialsBillOfMaterialItemSubstitute = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  billOfMaterialItemId?: string;
  billOfMaterialItem?: DomainEntitiesBillOfMaterialsBillOfMaterialItem;
  substituteMaterialId?: string;
  substituteMaterial?: DomainEntitiesMaterialsMaterial;
};
export type DomainEntitiesBillOfMaterialsBillOfMaterialItemSubstituteRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  billOfMaterialItemId?: string;
  billOfMaterialItem?: DomainEntitiesBillOfMaterialsBillOfMaterialItem;
  substituteMaterialId?: string;
  substituteMaterial?: DomainEntitiesMaterialsMaterialRead;
};
export type DomainEntitiesBillOfMaterialsBillOfMaterialItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  billOfMaterialId?: string;
  billOfMaterial?: DomainEntitiesBillOfMaterialsBillOfMaterial;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  materialTypeId?: string | null;
  materialType?: DomainEntitiesMaterialsMaterialType;
  grade?: string | null;
  casNumber?: string | null;
  order?: number;
  isSubstitutable?: boolean;
  baseQuantity?: number;
  baseUoMId?: string | null;
  baseUoM?: DomainEntitiesBaseUnitOfMeasure;
  prescribedQuantity?: number;
  substitutes?:
    DomainEntitiesBillOfMaterialsBillOfMaterialItemSubstitute[] | null;
};
export type DomainEntitiesBillOfMaterialsBillOfMaterialItemRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  billOfMaterialId?: string;
  billOfMaterial?: DomainEntitiesBillOfMaterialsBillOfMaterial;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  materialTypeId?: string | null;
  materialType?: DomainEntitiesMaterialsMaterialTypeRead;
  grade?: string | null;
  casNumber?: string | null;
  order?: number;
  isSubstitutable?: boolean;
  baseQuantity?: number;
  baseUoMId?: string | null;
  baseUoM?: DomainEntitiesBaseUnitOfMeasureRead;
  prescribedQuantity?: number;
  substitutes?:
    DomainEntitiesBillOfMaterialsBillOfMaterialItemSubstituteRead[] | null;
};
export type DomainEntitiesBillOfMaterialsBillOfMaterial = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  version?: number;
  isActive?: boolean;
  items?: DomainEntitiesBillOfMaterialsBillOfMaterialItem[] | null;
};
export type DomainEntitiesBillOfMaterialsBillOfMaterialRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  version?: number;
  isActive?: boolean;
  items?: DomainEntitiesBillOfMaterialsBillOfMaterialItemRead[] | null;
};
export type DomainEntitiesProductsProductBillOfMaterial = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  billOfMaterialId?: string;
  billOfMaterial?: DomainEntitiesBillOfMaterialsBillOfMaterial;
  quantity?: number;
  version?: number;
  effectiveDate?: string;
  isActive?: boolean;
};
export type DomainEntitiesProductsProductBillOfMaterialRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  billOfMaterialId?: string;
  billOfMaterial?: DomainEntitiesBillOfMaterialsBillOfMaterialRead;
  quantity?: number;
  version?: number;
  effectiveDate?: string;
  isActive?: boolean;
};
export type DomainEntitiesProductsProductPackingList = {
  uomId?: string;
  uom?: DomainEntitiesBaseUnitOfMeasure;
  quantity?: number;
  order?: number;
};
export type DomainEntitiesProductsProductPacking = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  name?: string | null;
  description?: string | null;
  packPerShipper?: number;
  basePackingUomId?: string | null;
  basePackingUoM?: DomainEntitiesBaseUnitOfMeasure;
  basePackingQuantity?: number;
  expectedYield?: number;
  isDefault?: boolean;
  packingLists?: DomainEntitiesProductsProductPackingList[] | null;
};
export type DomainEntitiesProductsProductPackingRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  name?: string | null;
  description?: string | null;
  packPerShipper?: number;
  basePackingUomId?: string | null;
  basePackingUoM?: DomainEntitiesBaseUnitOfMeasureRead;
  basePackingQuantity?: number;
  expectedYield?: number;
  isDefault?: boolean;
  packingLists?: DomainEntitiesProductsProductPackingList[] | null;
};
export type DomainEntitiesProductsProductPackageSubstitute = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productPackageId?: string;
  productPackage?: DomainEntitiesProductsProductPackage;
  substituteMaterialId?: string;
  substituteMaterial?: DomainEntitiesMaterialsMaterial;
};
export type DomainEntitiesProductsProductPackageSubstituteRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productPackageId?: string;
  productPackage?: DomainEntitiesProductsProductPackage;
  substituteMaterialId?: string;
  substituteMaterial?: DomainEntitiesMaterialsMaterialRead;
};
export type DomainEntitiesProductsProductPackage = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  materialThickness?: string | null;
  otherStandards?: string | null;
  baseQuantity?: number;
  unitCapacity?: number;
  directLinkMaterialId?: string | null;
  directLinkMaterial?: DomainEntitiesMaterialsMaterial;
  packingExcessMargin?: number;
  prescribedQuantity?: number;
  loose?: number;
  productPackingId?: string | null;
  productPacking?: DomainEntitiesProductsProductPacking;
  substitutes?: DomainEntitiesProductsProductPackageSubstitute[] | null;
};
export type DomainEntitiesProductsProductPackageRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  materialThickness?: string | null;
  otherStandards?: string | null;
  baseQuantity?: number;
  unitCapacity?: number;
  directLinkMaterialId?: string | null;
  directLinkMaterial?: DomainEntitiesMaterialsMaterialRead;
  packingExcessMargin?: number;
  prescribedQuantity?: number;
  loose?: number;
  productPackingId?: string | null;
  productPacking?: DomainEntitiesProductsProductPackingRead;
  substitutes?: DomainEntitiesProductsProductPackageSubstituteRead[] | null;
};
export type DomainEntitiesBaseOperation = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
  order?: number;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
};
export type DomainEntitiesBaseOperationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
  order?: number;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
};
export type DomainEntitiesFormsFormType = 0 | 1;
export type DomainEntitiesProductsEquipmentsQcEquipmentCategory = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
};
export type DomainEntitiesProductsEquipmentsQcEquipmentCategoryRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
};
export type DomainEntitiesAttachmentsAttachment = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  modelId?: string;
  modelType?: string | null;
  reference?: string | null;
  name?: string | null;
};
export type DomainEntitiesAttachmentsAttachmentRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  modelId?: string;
  modelType?: string | null;
  reference?: string | null;
  name?: string | null;
};
export type DomainEntitiesProductsEquipmentsQcEquipmentQualificationStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesProductsEquipmentsQcEquipment = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  equipmentId?: string | null;
  name?: string | null;
  qcEquipmentCategoryId?: string;
  qcEquipmentCategory?: DomainEntitiesProductsEquipmentsQcEquipmentCategory;
  serialNumber?: string | null;
  make?: string | null;
  model?: string | null;
  calibrationDueDate?: string | null;
  lastCalibratedAt?: string | null;
  calibrationCertificateAttachmentId?: string | null;
  calibrationCertificateAttachment?: DomainEntitiesAttachmentsAttachment;
  qualificationStatus?: DomainEntitiesProductsEquipmentsQcEquipmentQualificationStatus;
};
export type DomainEntitiesProductsEquipmentsQcEquipmentRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  equipmentId?: string | null;
  name?: string | null;
  qcEquipmentCategoryId?: string;
  qcEquipmentCategory?: DomainEntitiesProductsEquipmentsQcEquipmentCategoryRead;
  serialNumber?: string | null;
  make?: string | null;
  model?: string | null;
  calibrationDueDate?: string | null;
  lastCalibratedAt?: string | null;
  calibrationCertificateAttachmentId?: string | null;
  calibrationCertificateAttachment?: DomainEntitiesAttachmentsAttachmentRead;
  qualificationStatus?: DomainEntitiesProductsEquipmentsQcEquipmentQualificationStatus;
};
export type DomainEntitiesFormsQuestionType =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13 | 14;
export type DomainEntitiesFormsQuestionValidationType = 0 | 1 | 2 | 3;
export type DomainEntitiesFormsQuestionOption = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  questionId?: string;
  question?: DomainEntitiesFormsQuestion;
  name?: string | null;
};
export type DomainEntitiesFormsQuestionOptionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  questionId?: string;
  question?: DomainEntitiesFormsQuestion;
  name?: string | null;
};
export type DomainEntitiesFormsQuestion = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  label?: string | null;
  type?: DomainEntitiesFormsQuestionType;
  validation?: DomainEntitiesFormsQuestionValidationType;
  options?: DomainEntitiesFormsQuestionOption[] | null;
  isMultiSelect?: boolean;
  reference?: string | null;
  description?: string | null;
};
export type DomainEntitiesFormsQuestionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  label?: string | null;
  type?: DomainEntitiesFormsQuestionType;
  validation?: DomainEntitiesFormsQuestionValidationType;
  options?: DomainEntitiesFormsQuestionOptionRead[] | null;
  isMultiSelect?: boolean;
  reference?: string | null;
  description?: string | null;
};
export type DomainEntitiesFormsFormField = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formSectionId?: string;
  formSection?: DomainEntitiesFormsFormSection;
  questionId?: string;
  question?: DomainEntitiesFormsQuestion;
  required?: boolean;
  description?: string | null;
  rank?: number;
};
export type DomainEntitiesFormsFormFieldRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formSectionId?: string;
  formSection?: DomainEntitiesFormsFormSection;
  questionId?: string;
  question?: DomainEntitiesFormsQuestionRead;
  required?: boolean;
  description?: string | null;
  rank?: number;
};
export type DomainEntitiesFormulasFormRevisionStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesFormulasFormulaDefinition = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  key?: string | null;
  name?: string | null;
  presentationPreset?: string | null;
  revisions?: DomainEntitiesFormulasFormulaRevision[] | null;
};
export type DomainEntitiesFormulasFormulaDefinitionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  key?: string | null;
  name?: string | null;
  presentationPreset?: string | null;
  revisions?: DomainEntitiesFormulasFormulaRevision[] | null;
};
export type DomainEntitiesFormulasFormulaRevisionStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesFormulasFormulaRevision = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formulaDefinitionId?: string;
  formulaDefinition?: DomainEntitiesFormulasFormulaDefinition;
  revision?: number;
  definitionJson?: string | null;
  testCasesJson?: string | null;
  authoringPayloadJson?: string | null;
  authoringPayloadHash?: string | null;
  definitionHash?: string | null;
  releaseEvidenceHash?: string | null;
  formulaLanguageVersion?: string | null;
  numericPolicyVersion?: string | null;
  status?: DomainEntitiesFormulasFormulaRevisionStatus;
  reviewedById?: string | null;
  reviewedBy?: DomainEntitiesUsersUser;
  reviewedAt?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  approvedAt?: string | null;
  effectiveAt?: string | null;
  retiredAt?: string | null;
};
export type DomainEntitiesFormulasFormulaRevisionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formulaDefinitionId?: string;
  formulaDefinition?: DomainEntitiesFormulasFormulaDefinitionRead;
  revision?: number;
  definitionJson?: string | null;
  testCasesJson?: string | null;
  authoringPayloadJson?: string | null;
  authoringPayloadHash?: string | null;
  definitionHash?: string | null;
  releaseEvidenceHash?: string | null;
  formulaLanguageVersion?: string | null;
  numericPolicyVersion?: string | null;
  status?: DomainEntitiesFormulasFormulaRevisionStatus;
  reviewedById?: string | null;
  reviewedBy?: DomainEntitiesUsersUser;
  reviewedAt?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  approvedAt?: string | null;
  effectiveAt?: string | null;
  retiredAt?: string | null;
};
export type DomainEntitiesFormulasFormFieldFormulaConfiguration = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formFieldRevisionId?: string;
  formFieldRevision?: DomainEntitiesFormulasFormFieldRevision;
  formulaRevisionId?: string;
  formulaRevision?: DomainEntitiesFormulasFormulaRevision;
  bindingsJson?: string | null;
  resultTargetsJson?: string | null;
  displayPolicyJson?: string | null;
  methodReference?: string | null;
  configurationHash?: string | null;
};
export type DomainEntitiesFormulasFormFieldFormulaConfigurationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formFieldRevisionId?: string;
  formFieldRevision?: DomainEntitiesFormulasFormFieldRevision;
  formulaRevisionId?: string;
  formulaRevision?: DomainEntitiesFormulasFormulaRevisionRead;
  bindingsJson?: string | null;
  resultTargetsJson?: string | null;
  displayPolicyJson?: string | null;
  methodReference?: string | null;
  configurationHash?: string | null;
};
export type DomainEntitiesFormulasFormFieldRevision = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formRevisionId?: string;
  formRevision?: DomainEntitiesFormulasFormRevision;
  placementKey?: string | null;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormField;
  questionId?: string;
  question?: DomainEntitiesFormsQuestion;
  required?: boolean;
  rank?: number;
  description?: string | null;
  fieldHash?: string | null;
  formulaConfiguration?: DomainEntitiesFormulasFormFieldFormulaConfiguration;
};
export type DomainEntitiesFormulasFormFieldRevisionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formRevisionId?: string;
  formRevision?: DomainEntitiesFormulasFormRevision;
  placementKey?: string | null;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormFieldRead;
  questionId?: string;
  question?: DomainEntitiesFormsQuestionRead;
  required?: boolean;
  rank?: number;
  description?: string | null;
  fieldHash?: string | null;
  formulaConfiguration?: DomainEntitiesFormulasFormFieldFormulaConfigurationRead;
};
export type DomainEntitiesFormulasFormRevision = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  sequence?: number;
  status?: DomainEntitiesFormulasFormRevisionStatus;
  contentHash?: string | null;
  reviewedById?: string | null;
  reviewedBy?: DomainEntitiesUsersUser;
  reviewedAt?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  approvedAt?: string | null;
  retiredAt?: string | null;
  fields?: DomainEntitiesFormulasFormFieldRevision[] | null;
};
export type DomainEntitiesFormulasFormRevisionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  sequence?: number;
  status?: DomainEntitiesFormulasFormRevisionStatus;
  contentHash?: string | null;
  reviewedById?: string | null;
  reviewedBy?: DomainEntitiesUsersUser;
  reviewedAt?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  approvedAt?: string | null;
  retiredAt?: string | null;
  fields?: DomainEntitiesFormulasFormFieldRevisionRead[] | null;
};
export type DomainEntitiesGrnsStatus = 0 | 1 | 2;
export type DomainEntitiesGrnsGrn = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  carrierName?: string | null;
  vehicleNumber?: string | null;
  remarks?: string | null;
  grnNumber?: string | null;
  declarationNumber?: string | null;
  status?: DomainEntitiesGrnsStatus;
  materialBatches?: DomainEntitiesMaterialsBatchMaterialBatch[] | null;
};
export type DomainEntitiesGrnsGrnRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  carrierName?: string | null;
  vehicleNumber?: string | null;
  remarks?: string | null;
  grnNumber?: string | null;
  declarationNumber?: string | null;
  status?: DomainEntitiesGrnsStatus;
  materialBatches?: DomainEntitiesMaterialsBatchMaterialBatch[] | null;
};
export type DomainEntitiesMaterialSamplingMaterialSampling = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  arNumber?: string | null;
  issueNumber?: string | null;
  issuedById?: string | null;
  issuedBy?: DomainEntitiesUsersUser;
  issuedAt?: string | null;
  grnId?: string;
  grn?: DomainEntitiesGrnsGrn;
  chemicalArdId?: string | null;
  microbialArdId?: string | null;
  microbialRequired?: boolean;
  materialBatchId?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  sampleQuantity?: number;
  sampleDate?: string;
};
export type DomainEntitiesMaterialSamplingMaterialSamplingRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  arNumber?: string | null;
  issueNumber?: string | null;
  issuedById?: string | null;
  issuedBy?: DomainEntitiesUsersUser;
  issuedAt?: string | null;
  grnId?: string;
  grn?: DomainEntitiesGrnsGrnRead;
  chemicalArdId?: string | null;
  microbialArdId?: string | null;
  microbialRequired?: boolean;
  materialBatchId?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  sampleQuantity?: number;
  sampleDate?: string;
};
export type DomainEntitiesProductsProductionProductionActivityLog = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionActivityId?: string;
  productionActivity?: DomainEntitiesProductsProductionProductionActivity;
  message?: string | null;
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  timestamp?: string;
};
export type DomainEntitiesProductsProductionProductionActivityLogRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionActivityId?: string;
  productionActivity?: DomainEntitiesProductsProductionProductionActivity;
  message?: string | null;
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  timestamp?: string;
};
export type DomainEntitiesProductsProductionProductionActivity = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  productionScheduleProductId?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProduct;
  steps?: DomainEntitiesProductsProductionProductionActivityStep[] | null;
  status?: DomainEntitiesBaseProductionStatus;
  startedAt?: string;
  completedAt?: string | null;
  activityLogs?: DomainEntitiesProductsProductionProductionActivityLog[] | null;
};
export type DomainEntitiesProductsProductionProductionActivityRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  productionScheduleProductId?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProduct;
  steps?: DomainEntitiesProductsProductionProductionActivityStep[] | null;
  status?: DomainEntitiesBaseProductionStatus;
  startedAt?: string;
  completedAt?: string | null;
  activityLogs?:
    DomainEntitiesProductsProductionProductionActivityLogRead[] | null;
};
export type DomainEntitiesBaseResource = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  type?: string | null;
  isAvailable?: boolean;
};
export type DomainEntitiesBaseResourceRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  type?: string | null;
  isAvailable?: boolean;
};
export type DomainEntitiesProductsProductionProductionActivityStepResource = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionActivityStepId?: string;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  resourceId?: string;
  resource?: DomainEntitiesBaseResource;
};
export type DomainEntitiesProductsProductionProductionActivityStepResourceRead =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    productionActivityStepId?: string;
    productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
    resourceId?: string;
    resource?: DomainEntitiesBaseResourceRead;
  };
export type DomainEntitiesBaseWorkCenter = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesBaseWorkCenterRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesProductsProductionProductionActivityStepWorkCenter = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionActivityStepId?: string;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  workCenterId?: string;
  workCenter?: DomainEntitiesBaseWorkCenter;
};
export type DomainEntitiesProductsProductionProductionActivityStepWorkCenterRead =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    productionActivityStepId?: string;
    productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
    workCenterId?: string;
    workCenter?: DomainEntitiesBaseWorkCenterRead;
  };
export type DomainEntitiesQualityRoutinesAnalysisType = 0 | 1;
export type DomainEntitiesAnalyticalTestRequestsTestStage = 0 | 1 | 2;
export type DomainEntitiesProductStandardTestProceduresProductStandardTestProcedure =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    stpNumber?: string | null;
    productId?: string;
    product?: DomainEntitiesProductsProduct;
    description?: string | null;
  };
export type DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureRead =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    stpNumber?: string | null;
    productId?: string;
    product?: DomainEntitiesProductsProduct;
    description?: string | null;
  };
export type DomainEntitiesMaterialStandardTestProceduresMaterialStandardTestProcedure =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    stpNumber?: string | null;
    materialId?: string;
    material?: DomainEntitiesMaterialsMaterial;
    description?: string | null;
  };
export type DomainEntitiesMaterialStandardTestProceduresMaterialStandardTestProcedureRead =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    stpNumber?: string | null;
    materialId?: string;
    material?: DomainEntitiesMaterialsMaterialRead;
    description?: string | null;
  };
export type DomainEntitiesUniformityOfWeightsUniformityOfWeightResponse = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  uniformityOfWeightId?: string;
  uniformityOfWeight?: DomainEntitiesUniformityOfWeightsUniformityOfWeight;
  materialBatchId?: string | null;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  weights?: number[] | null;
  mean?: number;
  standardDeviation?: number;
  minimumStandardDeviation?: number;
  maximumStandardDeviation?: number;
  maximumWeight?: number;
  minimumWeight?: number;
};
export type DomainEntitiesUniformityOfWeightsUniformityOfWeightResponseRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  uniformityOfWeightId?: string;
  uniformityOfWeight?: DomainEntitiesUniformityOfWeightsUniformityOfWeight;
  materialBatchId?: string | null;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  weights?: number[] | null;
  mean?: number;
  standardDeviation?: number;
  minimumStandardDeviation?: number;
  maximumStandardDeviation?: number;
  maximumWeight?: number;
  minimumWeight?: number;
};
export type DomainEntitiesInstrumentsInstrumentQualificationStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesInstrumentsInstrument = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  name?: string | null;
  calibrationDueDate?: string | null;
  lastCalibratedAt?: string | null;
  calibrationCertificateAttachmentId?: string | null;
  calibrationCertificateAttachment?: DomainEntitiesAttachmentsAttachment;
  qualificationStatus?: DomainEntitiesInstrumentsInstrumentQualificationStatus;
};
export type DomainEntitiesInstrumentsInstrumentRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  name?: string | null;
  calibrationDueDate?: string | null;
  lastCalibratedAt?: string | null;
  calibrationCertificateAttachmentId?: string | null;
  calibrationCertificateAttachment?: DomainEntitiesAttachmentsAttachmentRead;
  qualificationStatus?: DomainEntitiesInstrumentsInstrumentQualificationStatus;
};
export type DomainEntitiesUniformityOfWeightsUniformityOfWeight = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  balanceNumber?: string | null;
  numberOfItems?: number;
  nominalWeight?: number;
  itemType?: string | null;
  responses?:
    DomainEntitiesUniformityOfWeightsUniformityOfWeightResponse[] | null;
  disintegrationTest?: string | null;
  disintegrationInstrumentId?: string | null;
  disintegrationInstrument?: DomainEntitiesInstrumentsInstrument;
  disintegrationMean?: number;
  hardnessTest?: string | null;
  hardnessInstrumentId?: string | null;
  hardnessInstrument?: DomainEntitiesInstrumentsInstrument;
  hardnessMean?: number;
};
export type DomainEntitiesUniformityOfWeightsUniformityOfWeightRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  balanceNumber?: string | null;
  numberOfItems?: number;
  nominalWeight?: number;
  itemType?: string | null;
  responses?:
    DomainEntitiesUniformityOfWeightsUniformityOfWeightResponseRead[] | null;
  disintegrationTest?: string | null;
  disintegrationInstrumentId?: string | null;
  disintegrationInstrument?: DomainEntitiesInstrumentsInstrumentRead;
  disintegrationMean?: number;
  hardnessTest?: string | null;
  hardnessInstrumentId?: string | null;
  hardnessInstrument?: DomainEntitiesInstrumentsInstrumentRead;
  hardnessMean?: number;
};
export type DomainEntitiesMaterialArdMaterialAnalyticalRawData = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  specNumber?: string | null;
  description?: string | null;
  stpId?: string;
  materialStandardTestProcedure?: DomainEntitiesMaterialStandardTestProceduresMaterialStandardTestProcedure;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  coaItems?: DomainEntitiesQualityRoutinesCommercialCoaItem[] | null;
  uniformityOfWeightId?: string | null;
  uniformityOfWeight?: DomainEntitiesUniformityOfWeightsUniformityOfWeight;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
};
export type DomainEntitiesMaterialArdMaterialAnalyticalRawDataRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  specNumber?: string | null;
  description?: string | null;
  stpId?: string;
  materialStandardTestProcedure?: DomainEntitiesMaterialStandardTestProceduresMaterialStandardTestProcedureRead;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  coaItems?: DomainEntitiesQualityRoutinesCommercialCoaItem[] | null;
  uniformityOfWeightId?: string | null;
  uniformityOfWeight?: DomainEntitiesUniformityOfWeightsUniformityOfWeightRead;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
};
export type DomainEntitiesQualityRoutinesCommercialCoaItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialArdId?: string | null;
  materialArd?: DomainEntitiesMaterialArdMaterialAnalyticalRawData;
  productArdId?: string | null;
  productArd?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawData;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormField;
  displayLabel?: string | null;
  groupName?: string | null;
  specificationText?: string | null;
  unit?: string | null;
  reference?: string | null;
  displayOrder?: number;
};
export type DomainEntitiesQualityRoutinesCommercialCoaItemRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialArdId?: string | null;
  materialArd?: DomainEntitiesMaterialArdMaterialAnalyticalRawDataRead;
  productArdId?: string | null;
  productArd?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawData;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormFieldRead;
  displayLabel?: string | null;
  groupName?: string | null;
  specificationText?: string | null;
  unit?: string | null;
  reference?: string | null;
  displayOrder?: number;
};
export type DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawData = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  specNumber?: string | null;
  description?: string | null;
  stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  stpId?: string;
  productStandardTestProcedure?: DomainEntitiesProductStandardTestProceduresProductStandardTestProcedure;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  coaItems?: DomainEntitiesQualityRoutinesCommercialCoaItem[] | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
};
export type DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataRead =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
    specNumber?: string | null;
    description?: string | null;
    stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
    stpId?: string;
    productStandardTestProcedure?: DomainEntitiesProductStandardTestProceduresProductStandardTestProcedureRead;
    formId?: string;
    form?: DomainEntitiesFormsForm;
    coaItems?: DomainEntitiesQualityRoutinesCommercialCoaItemRead[] | null;
    isVerified?: boolean;
    verifiedAt?: string | null;
    verifiedById?: string | null;
  };
export type DomainEntitiesRoutesOperationAction = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type DomainEntitiesProductsProductionProductionActivityStepUser = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionActivityStepId?: string;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  productAnalyticalRawDataId?: string | null;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawData;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesProductsProductionProductionActivityStepUserRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionActivityStepId?: string;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  productAnalyticalRawDataId?: string | null;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataRead;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesProductsProductionProductionActivityStep = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionActivityId?: string;
  productionActivity?: DomainEntitiesProductsProductionProductionActivity;
  operationId?: string;
  operation?: DomainEntitiesBaseOperation;
  workflowId?: string | null;
  workFlow?: DomainEntitiesFormsForm;
  order?: number;
  resources?:
    DomainEntitiesProductsProductionProductionActivityStepResource[] | null;
  workCenters?:
    DomainEntitiesProductsProductionProductionActivityStepWorkCenter[] | null;
  responsibleUsers?:
    DomainEntitiesProductsProductionProductionActivityStepUser[] | null;
  status?: DomainEntitiesBaseProductionStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  isCritical?: boolean;
};
export type DomainEntitiesProductsProductionProductionActivityStepRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionActivityId?: string;
  productionActivity?: DomainEntitiesProductsProductionProductionActivityRead;
  operationId?: string;
  operation?: DomainEntitiesBaseOperationRead;
  workflowId?: string | null;
  workFlow?: DomainEntitiesFormsForm;
  order?: number;
  resources?:
    DomainEntitiesProductsProductionProductionActivityStepResourceRead[] | null;
  workCenters?:
    | DomainEntitiesProductsProductionProductionActivityStepWorkCenterRead[]
    | null;
  responsibleUsers?:
    DomainEntitiesProductsProductionProductionActivityStepUserRead[] | null;
  status?: DomainEntitiesBaseProductionStatus;
  startedAt?: string | null;
  completedAt?: string | null;
  isCritical?: boolean;
};
export type DomainEntitiesQualityRoutinesRoutineType = 0 | 1;
export type DomainEntitiesQualityRoutinesRoutineOrigin = 0 | 1;
export type DomainEntitiesQualityRoutinesRoutineCadence = 0 | 1;
export type DomainEntitiesQualityRoutinesRoutineDefinition = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  type?: DomainEntitiesQualityRoutinesRoutineType;
  cadence?: DomainEntitiesQualityRoutinesRoutineCadence;
  isActive?: boolean;
  executions?: DomainEntitiesQualityRoutinesRoutineExecution[] | null;
};
export type DomainEntitiesQualityRoutinesRoutineDefinitionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  type?: DomainEntitiesQualityRoutinesRoutineType;
  cadence?: DomainEntitiesQualityRoutinesRoutineCadence;
  isActive?: boolean;
  executions?: DomainEntitiesQualityRoutinesRoutineExecution[] | null;
};
export type DomainEntitiesRndProjectsRndProjectStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DomainEntitiesRolesRole = {
  id?: string;
  name?: string | null;
  normalizedName?: string | null;
  concurrencyStamp?: string | null;
  displayName?: string | null;
  createdAt?: string;
  createdById?: string | null;
  updatedAt?: string | null;
  lastUpdatedById?: string | null;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  type?: SharedDepartmentType;
  isManager?: boolean;
};
export type DomainEntitiesApprovalsApprovalStage = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  id?: string;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApproval;
  order?: number;
  required?: boolean;
};
export type DomainEntitiesApprovalsApprovalStageRead = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  id?: string;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApproval;
  order?: number;
  required?: boolean;
};
export type DomainEntitiesApprovalsApproval = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  itemType?: string | null;
  escalationDuration?: string;
  approvalStages?: DomainEntitiesApprovalsApprovalStage[] | null;
};
export type DomainEntitiesApprovalsApprovalRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  itemType?: string | null;
  escalationDuration?: string;
  approvalStages?: DomainEntitiesApprovalsApprovalStageRead[] | null;
};
export type DomainEntitiesRndProjectsRndProjectApprovals = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  rndProjectId?: string;
  rndProject?: DomainEntitiesRndProjectsRndProject;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApproval;
};
export type DomainEntitiesRndProjectsRndProjectApprovalsRead = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  rndProjectId?: string;
  rndProject?: DomainEntitiesRndProjectsRndProject;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApprovalRead;
};
export type DomainEntitiesRndProjectsRndProject = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  productId?: string | null;
  product?: DomainEntitiesProductsProduct;
  title?: string | null;
  objective?: string | null;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
  requestedById?: string;
  requestedBy?: DomainEntitiesUsersUser;
  status?: DomainEntitiesRndProjectsRndProjectStatus;
  targetLaunchDate?: string | null;
  qtppFormId?: string | null;
  qtppForm?: DomainEntitiesFormsForm;
  attachmentId?: string | null;
  attachment?: DomainEntitiesAttachmentsAttachment;
  approved?: boolean;
  approvals?: DomainEntitiesRndProjectsRndProjectApprovals[] | null;
};
export type DomainEntitiesRndProjectsRndProjectRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  productId?: string | null;
  product?: DomainEntitiesProductsProduct;
  title?: string | null;
  objective?: string | null;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
  requestedById?: string;
  requestedBy?: DomainEntitiesUsersUser;
  status?: DomainEntitiesRndProjectsRndProjectStatus;
  targetLaunchDate?: string | null;
  qtppFormId?: string | null;
  qtppForm?: DomainEntitiesFormsForm;
  attachmentId?: string | null;
  attachment?: DomainEntitiesAttachmentsAttachmentRead;
  approved?: boolean;
  approvals?: DomainEntitiesRndProjectsRndProjectApprovalsRead[] | null;
};
export type DomainEntitiesRndFormulationsRndFormulationStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesRndFormulationsRndFormulationItemSubstitute = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  rndFormulationItemId?: string;
  rndFormulationItem?: DomainEntitiesRndFormulationsRndFormulationItem;
  substituteMaterialId?: string;
  substituteMaterial?: DomainEntitiesMaterialsMaterial;
};
export type DomainEntitiesRndFormulationsRndFormulationItemSubstituteRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  rndFormulationItemId?: string;
  rndFormulationItem?: DomainEntitiesRndFormulationsRndFormulationItem;
  substituteMaterialId?: string;
  substituteMaterial?: DomainEntitiesMaterialsMaterialRead;
};
export type DomainEntitiesRndFormulationsRndFormulationItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  rndFormulationId?: string;
  rndFormulation?: DomainEntitiesRndFormulationsRndFormulation;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  materialTypeId?: string | null;
  materialType?: DomainEntitiesMaterialsMaterialType;
  grade?: string | null;
  casNumber?: string | null;
  order?: number;
  isSubstitutable?: boolean;
  baseQuantity?: number;
  baseUoMId?: string | null;
  baseUoM?: DomainEntitiesBaseUnitOfMeasure;
  prescribedQuantity?: number;
  percentage?: number | null;
  substitutes?:
    DomainEntitiesRndFormulationsRndFormulationItemSubstitute[] | null;
};
export type DomainEntitiesRndFormulationsRndFormulationItemRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  rndFormulationId?: string;
  rndFormulation?: DomainEntitiesRndFormulationsRndFormulation;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  materialTypeId?: string | null;
  materialType?: DomainEntitiesMaterialsMaterialTypeRead;
  grade?: string | null;
  casNumber?: string | null;
  order?: number;
  isSubstitutable?: boolean;
  baseQuantity?: number;
  baseUoMId?: string | null;
  baseUoM?: DomainEntitiesBaseUnitOfMeasureRead;
  prescribedQuantity?: number;
  percentage?: number | null;
  substitutes?:
    DomainEntitiesRndFormulationsRndFormulationItemSubstituteRead[] | null;
};
export type DomainEntitiesRndFormulationsRndFormulationApprovals = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  rndFormulationId?: string;
  rndFormulation?: DomainEntitiesRndFormulationsRndFormulation;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApproval;
};
export type DomainEntitiesRndFormulationsRndFormulationApprovalsRead = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  rndFormulationId?: string;
  rndFormulation?: DomainEntitiesRndFormulationsRndFormulation;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApprovalRead;
};
export type DomainEntitiesRndFormulationsRndFormulation = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  rndProjectId?: string;
  rndProject?: DomainEntitiesRndProjectsRndProject;
  version?: number;
  status?: DomainEntitiesRndFormulationsRndFormulationStatus;
  items?: DomainEntitiesRndFormulationsRndFormulationItem[] | null;
  approved?: boolean;
  approvals?: DomainEntitiesRndFormulationsRndFormulationApprovals[] | null;
};
export type DomainEntitiesRndFormulationsRndFormulationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  rndProjectId?: string;
  rndProject?: DomainEntitiesRndProjectsRndProjectRead;
  version?: number;
  status?: DomainEntitiesRndFormulationsRndFormulationStatus;
  items?: DomainEntitiesRndFormulationsRndFormulationItemRead[] | null;
  approved?: boolean;
  approvals?: DomainEntitiesRndFormulationsRndFormulationApprovalsRead[] | null;
};
export type DomainEntitiesRndTrialBatchesRndTrialBatchScaleType = 0 | 1 | 2;
export type DomainEntitiesRndTrialBatchesRndTrialBatchStatus = 0 | 1 | 2 | 3;
export type DomainEntitiesRndTrialBatchesRndTrialBatch = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  rndProjectId?: string;
  rndProject?: DomainEntitiesRndProjectsRndProject;
  rndFormulationId?: string;
  rndFormulation?: DomainEntitiesRndFormulationsRndFormulation;
  batchCode?: string | null;
  scaleType?: DomainEntitiesRndTrialBatchesRndTrialBatchScaleType;
  batchSize?: number;
  batchSizeUoMId?: string | null;
  batchSizeUoM?: DomainEntitiesBaseUnitOfMeasure;
  manufacturingDate?: string | null;
  performedById?: string | null;
  performedBy?: DomainEntitiesUsersUser;
  protocolFormId?: string | null;
  protocolForm?: DomainEntitiesFormsForm;
  status?: DomainEntitiesRndTrialBatchesRndTrialBatchStatus;
  observations?: string | null;
};
export type DomainEntitiesRndTrialBatchesRndTrialBatchRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  rndProjectId?: string;
  rndProject?: DomainEntitiesRndProjectsRndProjectRead;
  rndFormulationId?: string;
  rndFormulation?: DomainEntitiesRndFormulationsRndFormulationRead;
  batchCode?: string | null;
  scaleType?: DomainEntitiesRndTrialBatchesRndTrialBatchScaleType;
  batchSize?: number;
  batchSizeUoMId?: string | null;
  batchSizeUoM?: DomainEntitiesBaseUnitOfMeasureRead;
  manufacturingDate?: string | null;
  performedById?: string | null;
  performedBy?: DomainEntitiesUsersUser;
  protocolFormId?: string | null;
  protocolForm?: DomainEntitiesFormsForm;
  status?: DomainEntitiesRndTrialBatchesRndTrialBatchStatus;
  observations?: string | null;
};
export type DomainEntitiesQualityRoutinesRoutineStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesQualityRoutinesRoutineAuditEvent = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineExecutionId?: string;
  routineExecution?: DomainEntitiesQualityRoutinesRoutineExecution;
  action?: string | null;
  detail?: string | null;
  occurredAt?: string;
  actorId?: string;
};
export type DomainEntitiesQualityRoutinesRoutineAuditEventRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineExecutionId?: string;
  routineExecution?: DomainEntitiesQualityRoutinesRoutineExecution;
  action?: string | null;
  detail?: string | null;
  occurredAt?: string;
  actorId?: string;
};
export type DomainEntitiesQualityRoutinesRoutineExecution = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineCode?: string | null;
  type?: DomainEntitiesQualityRoutinesRoutineType;
  origin?: DomainEntitiesQualityRoutinesRoutineOrigin;
  cadence?: DomainEntitiesQualityRoutinesRoutineCadence;
  routineDefinitionId?: string | null;
  routineDefinition?: DomainEntitiesQualityRoutinesRoutineDefinition;
  periodStart?: string | null;
  periodEnd?: string | null;
  routineDate?: string;
  emergencyTrigger?: string | null;
  emergencyReason?: string | null;
  rndTrialBatchId?: string | null;
  rndTrialBatch?: DomainEntitiesRndTrialBatchesRndTrialBatch;
  doneById?: string | null;
  doneBy?: DomainEntitiesUsersUser;
  doneAt?: string | null;
  status?: DomainEntitiesQualityRoutinesRoutineStatus;
  samples?: DomainEntitiesQualityRoutinesRoutineSample[] | null;
  auditEvents?: DomainEntitiesQualityRoutinesRoutineAuditEvent[] | null;
};
export type DomainEntitiesQualityRoutinesRoutineExecutionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineCode?: string | null;
  type?: DomainEntitiesQualityRoutinesRoutineType;
  origin?: DomainEntitiesQualityRoutinesRoutineOrigin;
  cadence?: DomainEntitiesQualityRoutinesRoutineCadence;
  routineDefinitionId?: string | null;
  routineDefinition?: DomainEntitiesQualityRoutinesRoutineDefinitionRead;
  periodStart?: string | null;
  periodEnd?: string | null;
  routineDate?: string;
  emergencyTrigger?: string | null;
  emergencyReason?: string | null;
  rndTrialBatchId?: string | null;
  rndTrialBatch?: DomainEntitiesRndTrialBatchesRndTrialBatchRead;
  doneById?: string | null;
  doneBy?: DomainEntitiesUsersUser;
  doneAt?: string | null;
  status?: DomainEntitiesQualityRoutinesRoutineStatus;
  samples?: DomainEntitiesQualityRoutinesRoutineSample[] | null;
  auditEvents?: DomainEntitiesQualityRoutinesRoutineAuditEventRead[] | null;
};
export type DomainEntitiesQualityRoutinesRoutineSample = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineExecutionId?: string;
  routineExecution?: DomainEntitiesQualityRoutinesRoutineExecution;
  samplingPoint?: string | null;
  areaName?: string | null;
  collectedAt?: string;
  tracks?: DomainEntitiesQualityRoutinesRoutineTrack[] | null;
};
export type DomainEntitiesQualityRoutinesRoutineSampleRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineExecutionId?: string;
  routineExecution?: DomainEntitiesQualityRoutinesRoutineExecutionRead;
  samplingPoint?: string | null;
  areaName?: string | null;
  collectedAt?: string;
  tracks?: DomainEntitiesQualityRoutinesRoutineTrack[] | null;
};
export type DomainEntitiesQualityRoutinesRoutineCoaItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineArdId?: string;
  routineArd?: DomainEntitiesQualityRoutinesRoutineArd;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormField;
  includeOnCoa?: boolean;
  displayLabel?: string | null;
  groupName?: string | null;
  specificationText?: string | null;
  unit?: string | null;
  reference?: string | null;
  displayOrder?: number;
};
export type DomainEntitiesQualityRoutinesRoutineCoaItemRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineArdId?: string;
  routineArd?: DomainEntitiesQualityRoutinesRoutineArd;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormFieldRead;
  includeOnCoa?: boolean;
  displayLabel?: string | null;
  groupName?: string | null;
  specificationText?: string | null;
  unit?: string | null;
  reference?: string | null;
  displayOrder?: number;
};
export type DomainEntitiesQualityRoutinesRoutineArd = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  type?: DomainEntitiesQualityRoutinesRoutineType;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  specNumber?: string | null;
  description?: string | null;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
  coaItems?: DomainEntitiesQualityRoutinesRoutineCoaItem[] | null;
};
export type DomainEntitiesQualityRoutinesRoutineArdRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  type?: DomainEntitiesQualityRoutinesRoutineType;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  specNumber?: string | null;
  description?: string | null;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
  coaItems?: DomainEntitiesQualityRoutinesRoutineCoaItemRead[] | null;
};
export type DomainEntitiesQualityRoutinesRoutineTrack = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineSampleId?: string;
  routineSample?: DomainEntitiesQualityRoutinesRoutineSample;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  routineArdId?: string;
  routineArd?: DomainEntitiesQualityRoutinesRoutineArd;
  formId?: string;
  formRevisionId?: string | null;
  worksheetFinalizedAt?: string | null;
  worksheetFinalizedById?: string | null;
  response?: DomainEntitiesFormsResponse;
  coaItemsSnapshotJson?: string | null;
};
export type DomainEntitiesQualityRoutinesRoutineTrackRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routineSampleId?: string;
  routineSample?: DomainEntitiesQualityRoutinesRoutineSampleRead;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
  routineArdId?: string;
  routineArd?: DomainEntitiesQualityRoutinesRoutineArdRead;
  formId?: string;
  formRevisionId?: string | null;
  worksheetFinalizedAt?: string | null;
  worksheetFinalizedById?: string | null;
  response?: DomainEntitiesFormsResponse;
  coaItemsSnapshotJson?: string | null;
};
export type DomainEntitiesFormsFormResponse = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  responseId?: string;
  response?: DomainEntitiesFormsResponse;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormField;
  formFieldRevisionId?: string | null;
  formFieldRevision?: DomainEntitiesFormulasFormFieldRevision;
  value?: string | null;
  complies?: boolean | null;
};
export type DomainEntitiesFormsFormResponseRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  responseId?: string;
  response?: DomainEntitiesFormsResponse;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormFieldRead;
  formFieldRevisionId?: string | null;
  formFieldRevision?: DomainEntitiesFormulasFormFieldRevisionRead;
  value?: string | null;
  complies?: boolean | null;
};
export type DomainEntitiesFormulasFormulaSnapshotReason = 0 | 1 | 2;
export type DomainEntitiesFormulasResponseFormulaSnapshot = {
  id?: string;
  responseId?: string;
  response?: DomainEntitiesFormsResponse;
  placementKey?: string | null;
  sequence?: number;
  formulaRevisionId?: string;
  formulaRevision?: DomainEntitiesFormulasFormulaRevision;
  definitionHash?: string | null;
  configurationHash?: string | null;
  executableDefinitionJson?: string | null;
  bindingsJson?: string | null;
  resultTargetsJson?: string | null;
  tableShapeJson?: string | null;
  calculationPolicyJson?: string | null;
  displayPolicyJson?: string | null;
  methodReference?: string | null;
  supersedesSnapshotId?: string | null;
  supersedesSnapshot?: DomainEntitiesFormulasResponseFormulaSnapshot;
  reason?: DomainEntitiesFormulasFormulaSnapshotReason;
  approvalReference?: string | null;
  capturedById?: string;
  capturedBy?: DomainEntitiesUsersUser;
  capturedAt?: string;
};
export type DomainEntitiesFormulasResponseFormulaSnapshotRead = {
  id?: string;
  responseId?: string;
  response?: DomainEntitiesFormsResponse;
  placementKey?: string | null;
  sequence?: number;
  formulaRevisionId?: string;
  formulaRevision?: DomainEntitiesFormulasFormulaRevisionRead;
  definitionHash?: string | null;
  configurationHash?: string | null;
  executableDefinitionJson?: string | null;
  bindingsJson?: string | null;
  resultTargetsJson?: string | null;
  tableShapeJson?: string | null;
  calculationPolicyJson?: string | null;
  displayPolicyJson?: string | null;
  methodReference?: string | null;
  supersedesSnapshotId?: string | null;
  supersedesSnapshot?: DomainEntitiesFormulasResponseFormulaSnapshotRead;
  reason?: DomainEntitiesFormulasFormulaSnapshotReason;
  approvalReference?: string | null;
  capturedById?: string;
  capturedBy?: DomainEntitiesUsersUser;
  capturedAt?: string;
};
export type DomainEntitiesFormulasFormulaExecutionTrigger = 0 | 1 | 2 | 3;
export type DomainEntitiesFormulasFormulaExecutionAuthority = 0 | 1;
export type DomainEntitiesFormulasFormulaExecutionStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type DomainEntitiesFormulasFormulaExecution = {
  id?: string;
  responseFormulaSnapshotId?: string;
  responseFormulaSnapshot?: DomainEntitiesFormulasResponseFormulaSnapshot;
  supersedesExecutionId?: string | null;
  supersedesExecution?: DomainEntitiesFormulasFormulaExecution;
  trigger?: DomainEntitiesFormulasFormulaExecutionTrigger;
  authority?: DomainEntitiesFormulasFormulaExecutionAuthority;
  status?: DomainEntitiesFormulasFormulaExecutionStatus;
  engineVersion?: string | null;
  engineBuildHash?: string | null;
  formulaLanguageVersion?: string | null;
  numericPolicyVersion?: string | null;
  inputHash?: string | null;
  resultHash?: string | null;
  resolvedInputsJson?: string | null;
  rawResultsJson?: string | null;
  roundedResultsJson?: string | null;
  displayResultsJson?: string | null;
  calculationTraceJson?: string | null;
  idempotencyKey?: string | null;
  actorId?: string;
  actor?: DomainEntitiesUsersUser;
  executedAt?: string;
};
export type DomainEntitiesFormulasFormulaExecutionRead = {
  id?: string;
  responseFormulaSnapshotId?: string;
  responseFormulaSnapshot?: DomainEntitiesFormulasResponseFormulaSnapshotRead;
  supersedesExecutionId?: string | null;
  supersedesExecution?: DomainEntitiesFormulasFormulaExecutionRead;
  trigger?: DomainEntitiesFormulasFormulaExecutionTrigger;
  authority?: DomainEntitiesFormulasFormulaExecutionAuthority;
  status?: DomainEntitiesFormulasFormulaExecutionStatus;
  engineVersion?: string | null;
  engineBuildHash?: string | null;
  formulaLanguageVersion?: string | null;
  numericPolicyVersion?: string | null;
  inputHash?: string | null;
  resultHash?: string | null;
  resolvedInputsJson?: string | null;
  rawResultsJson?: string | null;
  roundedResultsJson?: string | null;
  displayResultsJson?: string | null;
  calculationTraceJson?: string | null;
  idempotencyKey?: string | null;
  actorId?: string;
  actor?: DomainEntitiesUsersUser;
  executedAt?: string;
};
export type DomainEntitiesFormulasResponseFormulaSubmissionExecution = {
  id?: string;
  responseFormulaSubmissionSetId?: string;
  responseFormulaSubmissionSet?: DomainEntitiesFormulasResponseFormulaSubmissionSet;
  formulaExecutionId?: string;
  formulaExecution?: DomainEntitiesFormulasFormulaExecution;
  placementKey?: string | null;
  ordinal?: number;
};
export type DomainEntitiesFormulasResponseFormulaSubmissionSet = {
  id?: string;
  responseId?: string;
  response?: DomainEntitiesFormsResponse;
  sequence?: number;
  setHash?: string | null;
  inputAggregateHash?: string | null;
  configurationAggregateHash?: string | null;
  submittedById?: string;
  submittedBy?: DomainEntitiesUsersUser;
  submittedAt?: string;
  executions?:
    DomainEntitiesFormulasResponseFormulaSubmissionExecution[] | null;
};
export type DomainEntitiesFormulasResponseFormulaSubmissionSetRead = {
  id?: string;
  responseId?: string;
  response?: DomainEntitiesFormsResponse;
  sequence?: number;
  setHash?: string | null;
  inputAggregateHash?: string | null;
  configurationAggregateHash?: string | null;
  submittedById?: string;
  submittedBy?: DomainEntitiesUsersUser;
  submittedAt?: string;
  executions?:
    DomainEntitiesFormulasResponseFormulaSubmissionExecution[] | null;
};
export type DomainEntitiesFormsResponseApproval = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  approvalRound?: number;
  responseId?: string;
  response?: DomainEntitiesFormsResponse;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApproval;
  formulaSubmissionSetId?: string | null;
  formulaSubmissionSet?: DomainEntitiesFormulasResponseFormulaSubmissionSet;
};
export type DomainEntitiesFormsResponseApprovalRead = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  approvalRound?: number;
  responseId?: string;
  response?: DomainEntitiesFormsResponse;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApprovalRead;
  formulaSubmissionSetId?: string | null;
  formulaSubmissionSet?: DomainEntitiesFormulasResponseFormulaSubmissionSetRead;
};
export type DomainEntitiesFormsResponse = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  formRevisionId?: string | null;
  formRevision?: DomainEntitiesFormulasFormRevision;
  batchManufacturingRecordId?: string | null;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecord;
  materialBatchId?: string | null;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  materialSamplingId?: string | null;
  materialSampling?: DomainEntitiesMaterialSamplingMaterialSampling;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  routineTrackId?: string | null;
  routineTrack?: DomainEntitiesQualityRoutinesRoutineTrack;
  formResponses?: DomainEntitiesFormsFormResponse[] | null;
  approvals?: DomainEntitiesFormsResponseApproval[] | null;
  checkedById?: string | null;
  checkedBy?: DomainEntitiesUsersUser;
  checkedAt?: string | null;
  approved?: boolean;
  rejected?: boolean;
};
export type DomainEntitiesFormsResponseRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  formRevisionId?: string | null;
  formRevision?: DomainEntitiesFormulasFormRevisionRead;
  batchManufacturingRecordId?: string | null;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecord;
  materialBatchId?: string | null;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  materialSamplingId?: string | null;
  materialSampling?: DomainEntitiesMaterialSamplingMaterialSamplingRead;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStepRead;
  routineTrackId?: string | null;
  routineTrack?: DomainEntitiesQualityRoutinesRoutineTrackRead;
  formResponses?: DomainEntitiesFormsFormResponseRead[] | null;
  approvals?: DomainEntitiesFormsResponseApprovalRead[] | null;
  checkedById?: string | null;
  checkedBy?: DomainEntitiesUsersUser;
  checkedAt?: string | null;
  approved?: boolean;
  rejected?: boolean;
};
export type DomainEntitiesMaterialSpecificationsMaterialSpecification = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  specificationNumber?: string | null;
  revisionNumber?: string | null;
  supersedesNumber?: string | null;
  effectiveDate?: string;
  reviewDate?: string;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  dueDate?: string;
  description?: string | null;
  reference?: string | null;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  responseId?: string | null;
  response?: DomainEntitiesFormsResponse;
  formSections?: DomainEntitiesFormsFormSection[] | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
};
export type DomainEntitiesMaterialSpecificationsMaterialSpecificationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  specificationNumber?: string | null;
  revisionNumber?: string | null;
  supersedesNumber?: string | null;
  effectiveDate?: string;
  reviewDate?: string;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  dueDate?: string;
  description?: string | null;
  reference?: string | null;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  responseId?: string | null;
  response?: DomainEntitiesFormsResponseRead;
  formSections?: DomainEntitiesFormsFormSection[] | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
};
export type DomainEntitiesProductSpecificationsProductSpecification = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  specificationNumber?: string | null;
  revisionNumber?: string | null;
  supersedesNumber?: string | null;
  labelClaim?: string | null;
  packingStyle?: string | null;
  shelfLife?: string | null;
  effectiveDate?: string;
  reviewDate?: string;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  dueDate?: string;
  description?: string | null;
  reference?: string | null;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  testStage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  responseId?: string | null;
  response?: DomainEntitiesFormsResponse;
  formSections?: DomainEntitiesFormsFormSection[] | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
};
export type DomainEntitiesProductSpecificationsProductSpecificationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  specificationNumber?: string | null;
  revisionNumber?: string | null;
  supersedesNumber?: string | null;
  labelClaim?: string | null;
  packingStyle?: string | null;
  shelfLife?: string | null;
  effectiveDate?: string;
  reviewDate?: string;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  dueDate?: string;
  description?: string | null;
  reference?: string | null;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  testStage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  responseId?: string | null;
  response?: DomainEntitiesFormsResponseRead;
  formSections?: DomainEntitiesFormsFormSection[] | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
};
export type DomainEntitiesFormsFormSection = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  name?: string | null;
  description?: string | null;
  instrumentId?: string | null;
  instrument?: DomainEntitiesProductsEquipmentsQcEquipment;
  order?: number;
  fields?: DomainEntitiesFormsFormField[] | null;
  value?: string | null;
  materialSpecificationId?: string | null;
  materialSpecification?: DomainEntitiesMaterialSpecificationsMaterialSpecification;
  productSpecificationId?: string | null;
  productSpecification?: DomainEntitiesProductSpecificationsProductSpecification;
  groupName?: string | null;
  complies?: boolean;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
};
export type DomainEntitiesFormsFormSectionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  name?: string | null;
  description?: string | null;
  instrumentId?: string | null;
  instrument?: DomainEntitiesProductsEquipmentsQcEquipmentRead;
  order?: number;
  fields?: DomainEntitiesFormsFormFieldRead[] | null;
  value?: string | null;
  materialSpecificationId?: string | null;
  materialSpecification?: DomainEntitiesMaterialSpecificationsMaterialSpecificationRead;
  productSpecificationId?: string | null;
  productSpecification?: DomainEntitiesProductSpecificationsProductSpecificationRead;
  groupName?: string | null;
  complies?: boolean;
  analysisType?: DomainEntitiesQualityRoutinesAnalysisType;
};
export type DomainEntitiesFormsFormFieldAssignee = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formAssigneeId?: string;
  formAssignee?: DomainEntitiesFormsFormAssignee;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormField;
  assigneeId?: string | null;
  assignee?: DomainEntitiesUsersUser;
};
export type DomainEntitiesFormsFormFieldAssigneeRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formAssigneeId?: string;
  formAssignee?: DomainEntitiesFormsFormAssignee;
  formFieldId?: string;
  formField?: DomainEntitiesFormsFormFieldRead;
  assigneeId?: string | null;
  assignee?: DomainEntitiesUsersUser;
};
export type DomainEntitiesFormsFormAssignee = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  batchManufacturingRecordId?: string | null;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecord;
  materialBatchId?: string | null;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  materialSamplingId?: string | null;
  materialSampling?: DomainEntitiesMaterialSamplingMaterialSampling;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  routineTrackId?: string | null;
  routineTrack?: DomainEntitiesQualityRoutinesRoutineTrack;
  fieldAssignees?: DomainEntitiesFormsFormFieldAssignee[] | null;
};
export type DomainEntitiesFormsFormAssigneeRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  batchManufacturingRecordId?: string | null;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecord;
  materialBatchId?: string | null;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  materialSamplingId?: string | null;
  materialSampling?: DomainEntitiesMaterialSamplingMaterialSamplingRead;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStepRead;
  stage?: DomainEntitiesAnalyticalTestRequestsTestStage;
  routineTrackId?: string | null;
  routineTrack?: DomainEntitiesQualityRoutinesRoutineTrackRead;
  fieldAssignees?: DomainEntitiesFormsFormFieldAssigneeRead[] | null;
};
export type DomainEntitiesFormsFormReviewer = {
  id?: string;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  userId?: string;
  user?: DomainEntitiesUsersUser;
};
export type DomainEntitiesFormsFormReviewerRead = {
  id?: string;
  formId?: string;
  form?: DomainEntitiesFormsForm;
  userId?: string;
  user?: DomainEntitiesUsersUser;
};
export type DomainEntitiesFormsForm = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  type?: DomainEntitiesFormsFormType;
  sections?: DomainEntitiesFormsFormSection[] | null;
  responses?: DomainEntitiesFormsFormResponse[] | null;
  assignees?: DomainEntitiesFormsFormAssignee[] | null;
  reviewers?: DomainEntitiesFormsFormReviewer[] | null;
};
export type DomainEntitiesFormsFormRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  type?: DomainEntitiesFormsFormType;
  sections?: DomainEntitiesFormsFormSectionRead[] | null;
  responses?: DomainEntitiesFormsFormResponseRead[] | null;
  assignees?: DomainEntitiesFormsFormAssigneeRead[] | null;
  reviewers?: DomainEntitiesFormsFormReviewerRead[] | null;
};
export type DomainEntitiesRoutesRouteResource = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routeId?: string;
  route?: DomainEntitiesRoutesRoute;
  resourceId?: string;
  resource?: DomainEntitiesBaseResource;
};
export type DomainEntitiesRoutesRouteResourceRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routeId?: string;
  route?: DomainEntitiesRoutesRoute;
  resourceId?: string;
  resource?: DomainEntitiesBaseResourceRead;
};
export type DomainEntitiesRoutesRouteResponsibleUser = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routeId?: string;
  route?: DomainEntitiesRoutesRoute;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  productAnalyticalRawDataId?: string | null;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawData;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesRoutesRouteResponsibleUserRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routeId?: string;
  route?: DomainEntitiesRoutesRoute;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  productAnalyticalRawDataId?: string | null;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataRead;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesRoutesRouteResponsibleRole = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routeId?: string;
  route?: DomainEntitiesRoutesRoute;
  roleId?: string;
  role?: DomainEntitiesRolesRole;
  productAnalyticalRawDataId?: string | null;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawData;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesRoutesRouteResponsibleRoleRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routeId?: string;
  route?: DomainEntitiesRoutesRoute;
  roleId?: string;
  role?: DomainEntitiesRolesRole;
  productAnalyticalRawDataId?: string | null;
  productAnalyticalRawData?: DomainEntitiesProductAnalyticalRawDataProductAnalyticalRawDataRead;
  action?: DomainEntitiesRoutesOperationAction;
};
export type DomainEntitiesRoutesRouteWorkCenter = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routeId?: string;
  route?: DomainEntitiesRoutesRoute;
  workCenterId?: string;
  workCenter?: DomainEntitiesBaseWorkCenter;
};
export type DomainEntitiesRoutesRouteWorkCenterRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  routeId?: string;
  route?: DomainEntitiesRoutesRoute;
  workCenterId?: string;
  workCenter?: DomainEntitiesBaseWorkCenterRead;
};
export type DomainEntitiesRoutesRoute = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  operationId?: string;
  operation?: DomainEntitiesBaseOperation;
  estimatedTime?: string | null;
  workflowId?: string | null;
  workFlow?: DomainEntitiesFormsForm;
  order?: number;
  resources?: DomainEntitiesRoutesRouteResource[] | null;
  responsibleUsers?: DomainEntitiesRoutesRouteResponsibleUser[] | null;
  responsibleRoles?: DomainEntitiesRoutesRouteResponsibleRole[] | null;
  workCenters?: DomainEntitiesRoutesRouteWorkCenter[] | null;
  isCritical?: boolean;
};
export type DomainEntitiesRoutesRouteRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  operationId?: string;
  operation?: DomainEntitiesBaseOperationRead;
  estimatedTime?: string | null;
  workflowId?: string | null;
  workFlow?: DomainEntitiesFormsFormRead;
  order?: number;
  resources?: DomainEntitiesRoutesRouteResourceRead[] | null;
  responsibleUsers?: DomainEntitiesRoutesRouteResponsibleUserRead[] | null;
  responsibleRoles?: DomainEntitiesRoutesRouteResponsibleRoleRead[] | null;
  workCenters?: DomainEntitiesRoutesRouteWorkCenterRead[] | null;
  isCritical?: boolean;
};
export type DomainEntitiesProductsProductPrices = {
  price?: number;
  priceUoM?: string | null;
  date?: string;
};
export type DomainEntitiesProductsProduct = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  name?: string | null;
  genericName?: string | null;
  storageCondition?: string | null;
  packageStyle?: string | null;
  filledWeight?: string | null;
  shelfLife?: string | null;
  actionUse?: string | null;
  description?: string | null;
  fdaRegistrationNumber?: string | null;
  masterFormulaNumber?: string | null;
  primaryPackDescription?: string | null;
  secondaryPackDescription?: string | null;
  tertiaryPackDescription?: string | null;
  labelClaim?: string | null;
  categoryId?: string | null;
  category?: DomainEntitiesProductsProductCategory;
  baseQuantity?: number;
  baseUomId?: string | null;
  baseUoM?: DomainEntitiesBaseUnitOfMeasure;
  equipmentId?: string | null;
  equipment?: DomainEntitiesProductsEquipmentsEquipment;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  fullBatchSize?: number;
  finishedProducts?: DomainEntitiesProductsFinishedProduct[] | null;
  billOfMaterials?: DomainEntitiesProductsProductBillOfMaterial[] | null;
  packages?: DomainEntitiesProductsProductPackage[] | null;
  routes?: DomainEntitiesRoutesRoute[] | null;
  division?: DomainEntitiesProductsDivision;
  prices?: DomainEntitiesProductsProductPrices[] | null;
  packings?: DomainEntitiesProductsProductPacking[] | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
  documentNumber?: string | null;
  revisionNumber?: number;
};
export type DomainEntitiesProductsProductRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  name?: string | null;
  genericName?: string | null;
  storageCondition?: string | null;
  packageStyle?: string | null;
  filledWeight?: string | null;
  shelfLife?: string | null;
  actionUse?: string | null;
  description?: string | null;
  fdaRegistrationNumber?: string | null;
  masterFormulaNumber?: string | null;
  primaryPackDescription?: string | null;
  secondaryPackDescription?: string | null;
  tertiaryPackDescription?: string | null;
  labelClaim?: string | null;
  categoryId?: string | null;
  category?: DomainEntitiesProductsProductCategoryRead;
  baseQuantity?: number;
  baseUomId?: string | null;
  baseUoM?: DomainEntitiesBaseUnitOfMeasureRead;
  equipmentId?: string | null;
  equipment?: DomainEntitiesProductsEquipmentsEquipmentRead;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  fullBatchSize?: number;
  finishedProducts?: DomainEntitiesProductsFinishedProductRead[] | null;
  billOfMaterials?: DomainEntitiesProductsProductBillOfMaterialRead[] | null;
  packages?: DomainEntitiesProductsProductPackageRead[] | null;
  routes?: DomainEntitiesRoutesRouteRead[] | null;
  price?: number;
  priceUoM?: string | null;
  division?: DomainEntitiesProductsDivision;
  prices?: DomainEntitiesProductsProductPrices[] | null;
  packings?: DomainEntitiesProductsProductPackingRead[] | null;
  isVerified?: boolean;
  verifiedAt?: string | null;
  verifiedById?: string | null;
  documentNumber?: string | null;
  revisionNumber?: number;
};
export type DomainEntitiesProductionSchedulesBatchSize = 0 | 1;
export type DomainEntitiesBaseTermsOfPayment = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
  dueDays?: number | null;
};
export type DomainEntitiesBaseTermsOfPaymentRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
  dueDays?: number | null;
};
export type DomainEntitiesCustomersCustomerType = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesCurrenciesCurrency = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isBaseCurrency?: boolean;
};
export type DomainEntitiesCurrenciesCurrencyRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  symbol?: string | null;
  description?: string | null;
  isBaseCurrency?: boolean;
};
export type DomainEntitiesCustomersCustomerContact = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  customerId?: string;
  customer?: DomainEntitiesCustomersCustomer;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary?: boolean;
};
export type DomainEntitiesCustomersCustomerContactRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  customerId?: string;
  customer?: DomainEntitiesCustomersCustomer;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary?: boolean;
};
export type DomainEntitiesCustomersCustomerPricingAgreement = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  customerId?: string;
  customer?: DomainEntitiesCustomersCustomer;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  productPackingId?: string;
  productPacking?: DomainEntitiesProductsProductPacking;
  agreedPrice?: number;
  currencyId?: string;
  currency?: DomainEntitiesCurrenciesCurrency;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  notes?: string | null;
};
export type DomainEntitiesCustomersCustomerPricingAgreementRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  customerId?: string;
  customer?: DomainEntitiesCustomersCustomer;
  productId?: string;
  product?: DomainEntitiesProductsProductRead;
  productPackingId?: string;
  productPacking?: DomainEntitiesProductsProductPackingRead;
  agreedPrice?: number;
  currencyId?: string;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  notes?: string | null;
};
export type DomainEntitiesCustomersCustomer = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  creditLimit?: number | null;
  termsOfPaymentId?: string | null;
  termsOfPayment?: DomainEntitiesBaseTermsOfPayment;
  type?: DomainEntitiesCustomersCustomerType;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrency;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  contacts?: DomainEntitiesCustomersCustomerContact[] | null;
  pricingAgreements?: DomainEntitiesCustomersCustomerPricingAgreement[] | null;
};
export type DomainEntitiesCustomersCustomerRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  creditLimit?: number | null;
  termsOfPaymentId?: string | null;
  termsOfPayment?: DomainEntitiesBaseTermsOfPaymentRead;
  type?: DomainEntitiesCustomersCustomerType;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
  billingAddress?: string | null;
  shippingAddress?: string | null;
  contacts?: DomainEntitiesCustomersCustomerContactRead[] | null;
  pricingAgreements?:
    DomainEntitiesCustomersCustomerPricingAgreementRead[] | null;
};
export type DomainEntitiesProductionSchedulesProductionScheduleProduct = {
  id?: string;
  productionScheduleId?: string;
  productionSchedule?: DomainEntitiesProductionSchedulesProductionSchedule;
  productId?: string;
  product?: DomainEntitiesProductsProduct;
  batchNumber?: string | null;
  batchSize?: DomainEntitiesProductionSchedulesBatchSize;
  marketTypeId?: string | null;
  marketType?: DomainEntitiesCustomersCustomer;
  quantity?: number;
  cancelled?: boolean;
  reasonForCancellation?: string | null;
  productPackingId?: string | null;
  productPacking?: DomainEntitiesProductsProductPacking;
  productionActivity?: DomainEntitiesProductsProductionProductionActivity;
};
export type DomainEntitiesProductionSchedulesProductionScheduleProductRead = {
  id?: string;
  productionScheduleId?: string;
  productionSchedule?: DomainEntitiesProductionSchedulesProductionScheduleRead;
  productId?: string;
  product?: DomainEntitiesProductsProductRead;
  batchNumber?: string | null;
  batchSize?: DomainEntitiesProductionSchedulesBatchSize;
  marketTypeId?: string | null;
  marketType?: DomainEntitiesCustomersCustomerRead;
  quantity?: number;
  cancelled?: boolean;
  reasonForCancellation?: string | null;
  productPackingId?: string | null;
  productPacking?: DomainEntitiesProductsProductPackingRead;
  productionActivity?: DomainEntitiesProductsProductionProductionActivityRead;
};
export type DomainEntitiesProductsProductionBatchManufacturingStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type DomainEntitiesProductsProductionBatchManufacturingRecord = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionScheduleProductId?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProduct;
  productionActivityStepId?: string;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  batchNumber?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  batchQuantity?: number;
  sampledQuantity?: number;
  status?: DomainEntitiesProductsProductionBatchManufacturingStatus;
  issuedById?: string | null;
  issuedBy?: DomainEntitiesUsersUser;
  issuedDate?: string | null;
};
export type DomainEntitiesProductsProductionBatchManufacturingRecordRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  productionScheduleProductId?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductRead;
  productionActivityStepId?: string;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStepRead;
  batchNumber?: string | null;
  manufacturingDate?: string | null;
  expiryDate?: string | null;
  batchQuantity?: number;
  sampledQuantity?: number;
  status?: DomainEntitiesProductsProductionBatchManufacturingStatus;
  issuedById?: string | null;
  issuedBy?: DomainEntitiesUsersUser;
  issuedDate?: string | null;
};
export type DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteQuantity = {
  quantity?: number;
  movedAt?: string;
  movedById?: string;
};
export type DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteApproval = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  finishedGoodsTransferNoteId?: string;
  finishedGoodsTransferNote?: DomainEntitiesMaterialsBatchFinishedGoodsTransferNote;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApproval;
};
export type DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteApprovalRead =
  {
    userId?: string | null;
    user?: DomainEntitiesUsersUser;
    roleId?: string | null;
    role?: DomainEntitiesRolesRole;
    required?: boolean;
    order?: number;
    stageStartTime?: string | null;
    status?: DomainEntitiesApprovalsApprovalStatus;
    approvalTime?: string | null;
    approvedById?: string | null;
    approvedBy?: DomainEntitiesUsersUser;
    createdAt?: string;
    activatedAt?: string | null;
    comments?: string | null;
    id?: string;
    finishedGoodsTransferNoteId?: string;
    finishedGoodsTransferNote?: DomainEntitiesMaterialsBatchFinishedGoodsTransferNote;
    approvalId?: string;
    approval?: DomainEntitiesApprovalsApprovalRead;
  };
export type DomainEntitiesMaterialsBatchFinishedGoodsTransferNote = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  transferNoteNumber?: string | null;
  fromWarehouseId?: string | null;
  fromWarehouse?: DomainEntitiesWarehousesWarehouse;
  toWarehouseId?: string | null;
  toWarehouse?: DomainEntitiesWarehousesWarehouse;
  quantityPerPack?: number;
  productPackingId?: string | null;
  productPacking?: DomainEntitiesProductsProductPacking;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  isApproved?: boolean;
  totalQuantity?: number;
  quantityReceived?: number;
  notes?: string | null;
  qarNumber?: string | null;
  batchManufacturingRecordId?: string;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecord;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  loose?: number;
  allocatedQuantity?: number;
  quantities?:
    DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteQuantity[] | null;
  approved?: boolean;
  approvals?:
    DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteApproval[] | null;
  isPartial?: boolean;
  isFulfilled?: boolean;
  acceptedAt?: string | null;
};
export type DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  transferNoteNumber?: string | null;
  fromWarehouseId?: string | null;
  fromWarehouse?: DomainEntitiesWarehousesWarehouse;
  toWarehouseId?: string | null;
  toWarehouse?: DomainEntitiesWarehousesWarehouse;
  quantityPerPack?: number;
  productPackingId?: string | null;
  productPacking?: DomainEntitiesProductsProductPackingRead;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  isApproved?: boolean;
  totalQuantity?: number;
  quantityReceived?: number;
  notes?: string | null;
  qarNumber?: string | null;
  batchManufacturingRecordId?: string;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecordRead;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStepRead;
  loose?: number;
  allocatedQuantity?: number;
  remainingQuantity?: number;
  quantities?:
    DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteQuantity[] | null;
  approved?: boolean;
  approvals?:
    DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteApprovalRead[] | null;
  isPartial?: boolean;
  isFulfilled?: boolean;
  acceptedAt?: string | null;
};
export type DomainEntitiesWarehousesDistributedFinishedProductStatus = 0 | 1;
export type DomainEntitiesWarehousesDistributedFinishedProduct = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseArrivalLocationId?: string | null;
  warehouseArrivalLocation?: DomainEntitiesWarehousesWarehouseArrivalLocation;
  productId?: string | null;
  batchManufacturingRecordId?: string | null;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecord;
  transferNoteId?: string | null;
  transferNote?: DomainEntitiesMaterialsBatchFinishedGoodsTransferNote;
  product?: DomainEntitiesProductsProduct;
  uomId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  quantity?: number;
  distributedAt?: string | null;
  arrivedAt?: string | null;
  status?: DomainEntitiesWarehousesDistributedFinishedProductStatus;
};
export type DomainEntitiesWarehousesDistributedFinishedProductRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseArrivalLocationId?: string | null;
  warehouseArrivalLocation?: DomainEntitiesWarehousesWarehouseArrivalLocation;
  productId?: string | null;
  batchManufacturingRecordId?: string | null;
  batchManufacturingRecord?: DomainEntitiesProductsProductionBatchManufacturingRecordRead;
  transferNoteId?: string | null;
  transferNote?: DomainEntitiesMaterialsBatchFinishedGoodsTransferNoteRead;
  product?: DomainEntitiesProductsProductRead;
  uomId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  quantity?: number;
  distributedAt?: string | null;
  arrivedAt?: string | null;
  status?: DomainEntitiesWarehousesDistributedFinishedProductStatus;
};
export type DomainEntitiesWarehousesWarehouseArrivalLocation = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseId?: string;
  warehouse?: DomainEntitiesWarehousesWarehouse;
  name?: string | null;
  floorName?: string | null;
  description?: string | null;
  distributedRequisitionMaterials?:
    DomainEntitiesWarehousesDistributedRequisitionMaterial[] | null;
  distributedFinishedProducts?:
    DomainEntitiesWarehousesDistributedFinishedProduct[] | null;
  distributedStockTransferBatches?:
    DomainEntitiesMaterialsBatchMaterialBatch[] | null;
};
export type DomainEntitiesWarehousesWarehouseArrivalLocationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseId?: string;
  warehouse?: DomainEntitiesWarehousesWarehouse;
  name?: string | null;
  floorName?: string | null;
  description?: string | null;
  distributedRequisitionMaterials?:
    DomainEntitiesWarehousesDistributedRequisitionMaterial[] | null;
  distributedFinishedProducts?:
    DomainEntitiesWarehousesDistributedFinishedProductRead[] | null;
  distributedStockTransferBatches?:
    DomainEntitiesMaterialsBatchMaterialBatch[] | null;
};
export type DomainEntitiesCountriesCountry = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  nationality?: string | null;
  code?: string | null;
};
export type DomainEntitiesCountriesCountryRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  nationality?: string | null;
  code?: string | null;
};
export type DomainEntitiesProcurementManufacturersManufacturerMaterial = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  manufacturerId?: string;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturer;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  quantityType?: DomainEntitiesProcurementManufacturersQuantityType;
  quantityPerPackOption?: DomainEntitiesProcurementManufacturersQuantityPerPackOption;
};
export type DomainEntitiesProcurementManufacturersManufacturerMaterialRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  manufacturerId?: string;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturer;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  quantityType?: DomainEntitiesProcurementManufacturersQuantityType;
  quantityPerPackOption?: DomainEntitiesProcurementManufacturersQuantityPerPackOption;
};
export type DomainEntitiesProcurementManufacturersManufacturer = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  address?: string | null;
  email?: string | null;
  approvedAt?: string | null;
  validityDate?: string | null;
  countryId?: string | null;
  country?: DomainEntitiesCountriesCountry;
  materials?:
    DomainEntitiesProcurementManufacturersManufacturerMaterial[] | null;
};
export type DomainEntitiesProcurementManufacturersManufacturerRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  address?: string | null;
  email?: string | null;
  approvedAt?: string | null;
  validityDate?: string | null;
  countryId?: string | null;
  country?: DomainEntitiesCountriesCountryRead;
  materials?:
    DomainEntitiesProcurementManufacturersManufacturerMaterialRead[] | null;
};
export type DomainEntitiesProcurementSuppliersSupplierManufacturer = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  manufacturerId?: string;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturer;
  materialId?: string | null;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  default?: boolean;
};
export type DomainEntitiesProcurementSuppliersSupplierManufacturerRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  manufacturerId?: string;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturerRead;
  materialId?: string | null;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  default?: boolean;
};
export type DomainEntitiesProcurementSuppliersSupplierCertificationType =
  0 | 1 | 2 | 3 | 4;
export type DomainEntitiesProcurementSuppliersSupplierCertification = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  certificationType?: DomainEntitiesProcurementSuppliersSupplierCertificationType;
  certificateNumber: string;
  issuingBody: string;
  issueDate?: string;
  expiryDate?: string;
  attachmentId?: string | null;
  attachment?: DomainEntitiesAttachmentsAttachment;
};
export type DomainEntitiesProcurementSuppliersSupplierCertificationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  certificationType?: DomainEntitiesProcurementSuppliersSupplierCertificationType;
  certificateNumber: string;
  issuingBody: string;
  issueDate?: string;
  expiryDate?: string;
  attachmentId?: string | null;
  attachment?: DomainEntitiesAttachmentsAttachmentRead;
};
export type DomainEntitiesProcurementSuppliersSupplierContact = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary?: boolean;
};
export type DomainEntitiesProcurementSuppliersSupplierContactRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  isPrimary?: boolean;
};
export type DomainEntitiesProcurementSuppliersSupplierBankDetail = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  bankName: string;
  accountNumber: string;
  accountName: string;
  swiftCode?: string | null;
  iban?: string | null;
  branchAddress?: string | null;
  currencyId?: string;
  currency?: DomainEntitiesCurrenciesCurrency;
};
export type DomainEntitiesProcurementSuppliersSupplierBankDetailRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  bankName: string;
  accountNumber: string;
  accountName: string;
  swiftCode?: string | null;
  iban?: string | null;
  branchAddress?: string | null;
  currencyId?: string;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
};
export type DomainEntitiesProcurementSuppliersSupplierPricingAgreementStatus =
  0 | 1 | 2;
export type DomainEntitiesProcurementSuppliersSupplierPricingAgreementChangeKind =
  0 | 1 | 2;
export type DomainEntitiesProcurementSuppliersSupplierPricingAgreementApproval =
  {
    userId?: string | null;
    user?: DomainEntitiesUsersUser;
    roleId?: string | null;
    role?: DomainEntitiesRolesRole;
    required?: boolean;
    order?: number;
    stageStartTime?: string | null;
    status?: DomainEntitiesApprovalsApprovalStatus;
    approvalTime?: string | null;
    approvedById?: string | null;
    approvedBy?: DomainEntitiesUsersUser;
    createdAt?: string;
    activatedAt?: string | null;
    comments?: string | null;
    id?: string;
    supplierPricingAgreementId?: string;
    supplierPricingAgreement?: DomainEntitiesProcurementSuppliersSupplierPricingAgreement;
    approvalId?: string;
    approval?: DomainEntitiesApprovalsApproval;
  };
export type DomainEntitiesProcurementSuppliersSupplierPricingAgreementApprovalRead =
  {
    userId?: string | null;
    user?: DomainEntitiesUsersUser;
    roleId?: string | null;
    role?: DomainEntitiesRolesRole;
    required?: boolean;
    order?: number;
    stageStartTime?: string | null;
    status?: DomainEntitiesApprovalsApprovalStatus;
    approvalTime?: string | null;
    approvedById?: string | null;
    approvedBy?: DomainEntitiesUsersUser;
    createdAt?: string;
    activatedAt?: string | null;
    comments?: string | null;
    id?: string;
    supplierPricingAgreementId?: string;
    supplierPricingAgreement?: DomainEntitiesProcurementSuppliersSupplierPricingAgreement;
    approvalId?: string;
    approval?: DomainEntitiesApprovalsApprovalRead;
  };
export type DomainEntitiesProcurementSuppliersSupplierPricingAgreement = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  status?: DomainEntitiesProcurementSuppliersSupplierPricingAgreementStatus;
  changeKind?: DomainEntitiesProcurementSuppliersSupplierPricingAgreementChangeKind;
  replacesAgreementId?: string | null;
  approvals?:
    DomainEntitiesProcurementSuppliersSupplierPricingAgreementApproval[] | null;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  agreedPrice?: number;
  priceUoM: string;
  currencyId?: string;
  currency?: DomainEntitiesCurrenciesCurrency;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  notes?: string | null;
};
export type DomainEntitiesProcurementSuppliersSupplierPricingAgreementRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  status?: DomainEntitiesProcurementSuppliersSupplierPricingAgreementStatus;
  changeKind?: DomainEntitiesProcurementSuppliersSupplierPricingAgreementChangeKind;
  replacesAgreementId?: string | null;
  approvals?:
    | DomainEntitiesProcurementSuppliersSupplierPricingAgreementApprovalRead[]
    | null;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  agreedPrice?: number;
  priceUoM: string;
  currencyId?: string;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
  effectiveFrom?: string;
  effectiveTo?: string | null;
  notes?: string | null;
};
export type DomainEntitiesProcurementSuppliersSupplierPerformanceRecord = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  periodStart?: string;
  periodEnd?: string;
  onTimeDeliveryRate?: number;
  qualityRejectRate?: number;
  score?: number;
};
export type DomainEntitiesProcurementSuppliersSupplierPerformanceRecordRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  periodStart?: string;
  periodEnd?: string;
  onTimeDeliveryRate?: number;
  qualityRejectRate?: number;
  score?: number;
};
export type DomainEntitiesProcurementSuppliersSupplier = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  email?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  contactNumber?: string | null;
  countryId?: string | null;
  country?: DomainEntitiesCountriesCountry;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrency;
  type?: DomainEntitiesProcurementSuppliersSupplierType;
  status?: DomainEntitiesProcurementSuppliersSupplierStatus;
  approvedAt?: string | null;
  requalificationDueDate?: string | null;
  associatedManufacturers?:
    DomainEntitiesProcurementSuppliersSupplierManufacturer[] | null;
  certifications?:
    DomainEntitiesProcurementSuppliersSupplierCertification[] | null;
  contacts?: DomainEntitiesProcurementSuppliersSupplierContact[] | null;
  bankDetails?: DomainEntitiesProcurementSuppliersSupplierBankDetail[] | null;
  pricingAgreements?:
    DomainEntitiesProcurementSuppliersSupplierPricingAgreement[] | null;
  performanceRecords?:
    DomainEntitiesProcurementSuppliersSupplierPerformanceRecord[] | null;
};
export type DomainEntitiesProcurementSuppliersSupplierRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  email?: string | null;
  address?: string | null;
  contactPerson?: string | null;
  contactNumber?: string | null;
  countryId?: string | null;
  country?: DomainEntitiesCountriesCountryRead;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
  type?: DomainEntitiesProcurementSuppliersSupplierType;
  status?: DomainEntitiesProcurementSuppliersSupplierStatus;
  approvedAt?: string | null;
  requalificationDueDate?: string | null;
  associatedManufacturers?:
    DomainEntitiesProcurementSuppliersSupplierManufacturerRead[] | null;
  certifications?:
    DomainEntitiesProcurementSuppliersSupplierCertificationRead[] | null;
  contacts?: DomainEntitiesProcurementSuppliersSupplierContactRead[] | null;
  bankDetails?:
    DomainEntitiesProcurementSuppliersSupplierBankDetailRead[] | null;
  pricingAgreements?:
    DomainEntitiesProcurementSuppliersSupplierPricingAgreementRead[] | null;
  performanceRecords?:
    DomainEntitiesProcurementSuppliersSupplierPerformanceRecordRead[] | null;
};
export type DomainEntitiesShipmentsShipmentInvoice = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  supplierId?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  items?: DomainEntitiesShipmentsShipmentInvoiceItem[] | null;
  totalCost?: number;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrency;
  paidAt?: string | null;
  dueDate?: string | null;
};
export type DomainEntitiesShipmentsShipmentInvoiceRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  supplierId?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplierRead;
  items?: DomainEntitiesShipmentsShipmentInvoiceItem[] | null;
  totalCost?: number;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
  paidAt?: string | null;
  dueDate?: string | null;
};
export type DomainEntitiesRequisitionsProcurementSource = 0 | 1;
export type DomainEntitiesRequisitionsSourceRequisitionItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  sourceRequisitionId?: string;
  sourceRequisition?: DomainEntitiesRequisitionsSourceRequisition;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  quantity?: number;
  source?: DomainEntitiesRequisitionsProcurementSource;
  requisitionId?: string;
};
export type DomainEntitiesRequisitionsSourceRequisitionItemRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  sourceRequisitionId?: string;
  sourceRequisition?: DomainEntitiesRequisitionsSourceRequisition;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  quantity?: number;
  source?: DomainEntitiesRequisitionsProcurementSource;
  requisitionId?: string;
};
export type DomainEntitiesRequisitionsSourceRequisition = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  sentQuotationRequestAt?: string | null;
  items?: DomainEntitiesRequisitionsSourceRequisitionItem[] | null;
};
export type DomainEntitiesRequisitionsSourceRequisitionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplierRead;
  sentQuotationRequestAt?: string | null;
  items?: DomainEntitiesRequisitionsSourceRequisitionItemRead[] | null;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  purchaseOrderId?: string;
  purchaseOrder?: DomainEntitiesPurchaseOrdersPurchaseOrder;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  quantity?: number;
  quantityInvoiced?: number;
  price?: number;
  priceUoM?: string | null;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrency;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderItemRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  purchaseOrderId?: string;
  purchaseOrder?: DomainEntitiesPurchaseOrdersPurchaseOrder;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  quantity?: number;
  quantityInvoiced?: number;
  price?: number;
  priceUoM?: string | null;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
export type DomainEntitiesPurchaseOrdersRevisedPurchaseOrderType =
  0 | 1 | 2 | 3 | 4;
export type DomainEntitiesPurchaseOrdersRevisedPurchaseOrder = {
  id?: string;
  type?: DomainEntitiesPurchaseOrdersRevisedPurchaseOrderType;
  purchaseOrderItemId?: string | null;
  purchaseOrderItem?: DomainEntitiesPurchaseOrdersPurchaseOrderItem;
  materialId?: string | null;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  quantity?: number | null;
  price?: number | null;
  priceUoM?: string | null;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrency;
  uoMBeforeId?: string | null;
  uomBefore?: DomainEntitiesBaseUnitOfMeasure;
  quantityBefore?: number | null;
  priceBefore?: number | null;
  priceUoMBefore?: string | null;
  currencyBeforeId?: string | null;
  currencyBefore?: DomainEntitiesCurrenciesCurrency;
  materialBeforeId?: string | null;
  materialBefore?: DomainEntitiesMaterialsMaterial;
  revisionNumber?: number;
  revisionDate?: string | null;
};
export type DomainEntitiesPurchaseOrdersRevisedPurchaseOrderRead = {
  id?: string;
  type?: DomainEntitiesPurchaseOrdersRevisedPurchaseOrderType;
  purchaseOrderItemId?: string | null;
  purchaseOrderItem?: DomainEntitiesPurchaseOrdersPurchaseOrderItemRead;
  materialId?: string | null;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  quantity?: number | null;
  price?: number | null;
  priceUoM?: string | null;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
  uoMBeforeId?: string | null;
  uomBefore?: DomainEntitiesBaseUnitOfMeasureRead;
  quantityBefore?: number | null;
  priceBefore?: number | null;
  priceUoMBefore?: string | null;
  currencyBeforeId?: string | null;
  currencyBefore?: DomainEntitiesCurrenciesCurrencyRead;
  materialBeforeId?: string | null;
  materialBefore?: DomainEntitiesMaterialsMaterialRead;
  revisionNumber?: number;
  revisionDate?: string | null;
};
export type DomainEntitiesBaseDeliveryMode = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesBaseDeliveryModeRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderApproval = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  purchaseOrderId?: string;
  purchaseOrder?: DomainEntitiesPurchaseOrdersPurchaseOrder;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApproval;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderApprovalRead = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  purchaseOrderId?: string;
  purchaseOrder?: DomainEntitiesPurchaseOrdersPurchaseOrder;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApprovalRead;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrder = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  proFormaInvoiceNumber?: string | null;
  sourceRequisitionId?: string;
  sourceRequisition?: DomainEntitiesRequisitionsSourceRequisition;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  requestDate?: string;
  expectedDeliveryDate?: string | null;
  items?: DomainEntitiesPurchaseOrdersPurchaseOrderItem[] | null;
  deliveryDate?: string | null;
  sentAt?: string | null;
  status?: DomainEntitiesPurchaseOrdersPurchaseOrderStatus;
  revisionNumber?: number;
  revisedPurchaseOrders?:
    DomainEntitiesPurchaseOrdersRevisedPurchaseOrder[] | null;
  deliveryMode?: DomainEntitiesBaseDeliveryMode;
  termsOfPayment?: DomainEntitiesBaseTermsOfPayment;
  deliveryModeId?: string | null;
  termsOfPaymentId?: string | null;
  totalFobValue?: number;
  totalCifValue?: number;
  seaFreight?: number;
  insurance?: number;
  amountInFigures?: string | null;
  estimatedDeliveryDate?: string | null;
  approvals?: DomainEntitiesPurchaseOrdersPurchaseOrderApproval[] | null;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  approved?: boolean;
};
export type DomainEntitiesPurchaseOrdersPurchaseOrderRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  proFormaInvoiceNumber?: string | null;
  sourceRequisitionId?: string;
  sourceRequisition?: DomainEntitiesRequisitionsSourceRequisitionRead;
  supplierId?: string;
  supplier?: DomainEntitiesProcurementSuppliersSupplierRead;
  requestDate?: string;
  expectedDeliveryDate?: string | null;
  items?: DomainEntitiesPurchaseOrdersPurchaseOrderItemRead[] | null;
  deliveryDate?: string | null;
  sentAt?: string | null;
  status?: DomainEntitiesPurchaseOrdersPurchaseOrderStatus;
  isRevised?: boolean;
  revisionNumber?: number;
  revisedPurchaseOrders?:
    DomainEntitiesPurchaseOrdersRevisedPurchaseOrderRead[] | null;
  deliveryMode?: DomainEntitiesBaseDeliveryModeRead;
  termsOfPayment?: DomainEntitiesBaseTermsOfPaymentRead;
  deliveryModeId?: string | null;
  termsOfPaymentId?: string | null;
  totalFobValue?: number;
  totalCifValue?: number;
  seaFreight?: number;
  insurance?: number;
  amountInFigures?: string | null;
  estimatedDeliveryDate?: string | null;
  approvals?: DomainEntitiesPurchaseOrdersPurchaseOrderApprovalRead[] | null;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  approved?: boolean;
};
export type DomainEntitiesShipmentsShipmentInvoiceItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  shipmentInvoiceId?: string;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoice;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  manufacturerId?: string;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturer;
  purchaseOrderId?: string;
  purchaseOrder?: DomainEntitiesPurchaseOrdersPurchaseOrder;
  expectedQuantity?: number;
  receivedQuantity?: number;
  reason?: string | null;
  distributed?: boolean;
  price?: number;
  priceUoM?: string | null;
  totalCost?: number;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrency;
};
export type DomainEntitiesShipmentsShipmentInvoiceItemRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  shipmentInvoiceId?: string;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoiceRead;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  manufacturerId?: string;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturerRead;
  purchaseOrderId?: string;
  purchaseOrder?: DomainEntitiesPurchaseOrdersPurchaseOrderRead;
  expectedQuantity?: number;
  receivedQuantity?: number;
  reason?: string | null;
  distributed?: boolean;
  price?: number;
  priceUoM?: string | null;
  totalCost?: number;
  currencyId?: string | null;
  currency?: DomainEntitiesCurrenciesCurrencyRead;
};
export type DomainEntitiesWarehousesMaterialItemDistribution = {
  id?: string;
  distributedRequisitionMaterialId?: string;
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterial;
  shipmentInvoiceItemId?: string;
  shipmentInvoiceItem?: DomainEntitiesShipmentsShipmentInvoiceItem;
  quantity?: number;
};
export type DomainEntitiesWarehousesMaterialItemDistributionRead = {
  id?: string;
  distributedRequisitionMaterialId?: string;
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterial;
  shipmentInvoiceItemId?: string;
  shipmentInvoiceItem?: DomainEntitiesShipmentsShipmentInvoiceItemRead;
  quantity?: number;
};
export type DomainEntitiesWarehousesDistributedRequisitionMaterialStatus =
  0 | 1 | 2 | 3 | 4;
export type DomainEntitiesRequisitionsRequisitionType = 0 | 1 | 2;
export type DomainEntitiesRequisitionsRequisitionApproval = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  requisitionId?: string;
  requisition?: DomainEntitiesRequisitionsRequisition;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApproval;
};
export type DomainEntitiesRequisitionsRequisitionApprovalRead = {
  userId?: string | null;
  user?: DomainEntitiesUsersUser;
  roleId?: string | null;
  role?: DomainEntitiesRolesRole;
  required?: boolean;
  order?: number;
  stageStartTime?: string | null;
  status?: DomainEntitiesApprovalsApprovalStatus;
  approvalTime?: string | null;
  approvedById?: string | null;
  approvedBy?: DomainEntitiesUsersUser;
  createdAt?: string;
  activatedAt?: string | null;
  comments?: string | null;
  id?: string;
  requisitionId?: string;
  requisition?: DomainEntitiesRequisitionsRequisition;
  approvalId?: string;
  approval?: DomainEntitiesApprovalsApprovalRead;
};
export type DomainEntitiesRequisitionsRequisition = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  requestedById?: string;
  requestedBy?: DomainEntitiesUsersUser;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
  requisitionType?: DomainEntitiesRequisitionsRequisitionType;
  status?: DomainEntitiesRequisitionsRequestStatus;
  comments?: string | null;
  expectedDelivery?: string | null;
  productionScheduleProductId?: string | null;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProduct;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  rndTrialBatchId?: string | null;
  rndTrialBatch?: DomainEntitiesRndTrialBatchesRndTrialBatch;
  approvals?: DomainEntitiesRequisitionsRequisitionApproval[] | null;
  items?: DomainEntitiesRequisitionsRequisitionItem[] | null;
  approved?: boolean;
};
export type DomainEntitiesRequisitionsRequisitionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  requestedById?: string;
  requestedBy?: DomainEntitiesUsersUser;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
  requisitionType?: DomainEntitiesRequisitionsRequisitionType;
  status?: DomainEntitiesRequisitionsRequestStatus;
  comments?: string | null;
  expectedDelivery?: string | null;
  productionScheduleProductId?: string | null;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductRead;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStepRead;
  rndTrialBatchId?: string | null;
  rndTrialBatch?: DomainEntitiesRndTrialBatchesRndTrialBatchRead;
  approvals?: DomainEntitiesRequisitionsRequisitionApprovalRead[] | null;
  items?: DomainEntitiesRequisitionsRequisitionItem[] | null;
  approved?: boolean;
};
export type DomainEntitiesRequisitionsRequisitionItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  requisitionId?: string;
  requisition?: DomainEntitiesRequisitionsRequisition;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  quantity?: number;
  quantityReceived?: number;
  status?: DomainEntitiesRequisitionsRequestStatus;
};
export type DomainEntitiesRequisitionsRequisitionItemRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  requisitionId?: string;
  requisition?: DomainEntitiesRequisitionsRequisitionRead;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  quantity?: number;
  quantityReceived?: number;
  status?: DomainEntitiesRequisitionsRequestStatus;
};
export type DomainEntitiesWarehousesDistributedRequisitionItem = {
  id?: string;
  requisitionItemId?: string;
  requisitionItem?: DomainEntitiesRequisitionsRequisitionItem;
  distributedRequisitionMaterialId?: string;
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterial;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  warehouseId?: string;
  warehouse?: DomainEntitiesWarehousesWarehouse;
  quantity?: number;
};
export type DomainEntitiesWarehousesDistributedRequisitionItemRead = {
  id?: string;
  requisitionItemId?: string;
  requisitionItem?: DomainEntitiesRequisitionsRequisitionItemRead;
  distributedRequisitionMaterialId?: string;
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterial;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  warehouseId?: string;
  warehouse?: DomainEntitiesWarehousesWarehouse;
  quantity?: number;
};
export type DomainEntitiesWarehousesDistributedRequisitionMaterial = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseArrivalLocationId?: string | null;
  warehouseArrivalLocation?: DomainEntitiesWarehousesWarehouseArrivalLocation;
  materialItemDistributions?:
    DomainEntitiesWarehousesMaterialItemDistribution[] | null;
  shipmentInvoiceId?: string | null;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoice;
  materialId?: string | null;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  quantity?: number;
  distributedAt?: string | null;
  arrivedAt?: string | null;
  checkedAt?: string | null;
  grnGeneratedAt?: string | null;
  status?: DomainEntitiesWarehousesDistributedRequisitionMaterialStatus;
  checkLists?: DomainEntitiesChecklistsChecklist[] | null;
  distributedRequisitionItems?:
    DomainEntitiesWarehousesDistributedRequisitionItem[] | null;
};
export type DomainEntitiesWarehousesDistributedRequisitionMaterialRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseArrivalLocationId?: string | null;
  warehouseArrivalLocation?: DomainEntitiesWarehousesWarehouseArrivalLocationRead;
  materialItemDistributions?:
    DomainEntitiesWarehousesMaterialItemDistributionRead[] | null;
  shipmentInvoiceId?: string | null;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoiceRead;
  materialId?: string | null;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  quantity?: number;
  distributedAt?: string | null;
  arrivedAt?: string | null;
  checkedAt?: string | null;
  grnGeneratedAt?: string | null;
  status?: DomainEntitiesWarehousesDistributedRequisitionMaterialStatus;
  checkLists?: DomainEntitiesChecklistsChecklist[] | null;
  distributedRequisitionItems?:
    DomainEntitiesWarehousesDistributedRequisitionItemRead[] | null;
};
export type DomainEntitiesChecklistsIntactness = 0 | 1;
export type DomainEntitiesChecklistsConsignmentCarrier = 0 | 1 | 2 | 3 | 4 | 5;
export type DomainEntitiesChecklistsChecklist = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  distributedRequisitionMaterialId?: string;
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterial;
  materialId?: string | null;
  material?: DomainEntitiesMaterialsMaterial;
  checkedAt?: string | null;
  shipmentInvoiceId?: string | null;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoice;
  supplierId?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplier;
  manufacturerId?: string | null;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturer;
  certificateOfAnalysisDelivered?: boolean;
  visibleLabelling?: boolean;
  intactnessStatus?: DomainEntitiesChecklistsIntactness;
  consignmentCarrierStatus?: DomainEntitiesChecklistsConsignmentCarrier;
  materialBatches?: DomainEntitiesMaterialsBatchMaterialBatch[] | null;
};
export type DomainEntitiesChecklistsChecklistRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  distributedRequisitionMaterialId?: string;
  distributedRequisitionMaterial?: DomainEntitiesWarehousesDistributedRequisitionMaterialRead;
  materialId?: string | null;
  material?: DomainEntitiesMaterialsMaterialRead;
  checkedAt?: string | null;
  shipmentInvoiceId?: string | null;
  shipmentInvoice?: DomainEntitiesShipmentsShipmentInvoiceRead;
  supplierId?: string | null;
  supplier?: DomainEntitiesProcurementSuppliersSupplierRead;
  manufacturerId?: string | null;
  manufacturer?: DomainEntitiesProcurementManufacturersManufacturerRead;
  certificateOfAnalysisDelivered?: boolean;
  visibleLabelling?: boolean;
  intactnessStatus?: DomainEntitiesChecklistsIntactness;
  consignmentCarrierStatus?: DomainEntitiesChecklistsConsignmentCarrier;
  materialBatches?: DomainEntitiesMaterialsBatchMaterialBatch[] | null;
};
export type DomainEntitiesProductionSchedulesStockTransfersStockTransferStatus =
  0 | 1 | 2 | 3;
export type DomainEntitiesProductionSchedulesStockTransfersStockTransferSource =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    stockTransferId?: string;
    stockTransfer?: DomainEntitiesProductionSchedulesStockTransfersStockTransfer;
    fromDepartmentId?: string;
    fromDepartment?: DomainEntitiesDepartmentsDepartment;
    toDepartmentId?: string;
    toDepartment?: DomainEntitiesDepartmentsDepartment;
    quantity?: number;
    status?: DomainEntitiesProductionSchedulesStockTransfersStockTransferStatus;
    approvedAt?: string | null;
    approvedById?: string | null;
    approvedBy?: DomainEntitiesUsersUser;
    issuedById?: string | null;
    issuedBy?: DomainEntitiesUsersUser;
    issuedAt?: string | null;
  };
export type DomainEntitiesProductionSchedulesStockTransfersStockTransferSourceRead =
  {
    id?: string;
    createdAt?: string;
    updatedAt?: string | null;
    createdById?: string | null;
    createdBy?: DomainEntitiesUsersUser;
    lastUpdatedById?: string | null;
    lastUpdatedBy?: DomainEntitiesUsersUser;
    deletedAt?: string | null;
    lastDeletedById?: string | null;
    lastDeletedBy?: DomainEntitiesUsersUser;
    stockTransferId?: string;
    stockTransfer?: DomainEntitiesProductionSchedulesStockTransfersStockTransfer;
    fromDepartmentId?: string;
    fromDepartment?: DomainEntitiesDepartmentsDepartment;
    toDepartmentId?: string;
    toDepartment?: DomainEntitiesDepartmentsDepartment;
    quantity?: number;
    status?: DomainEntitiesProductionSchedulesStockTransfersStockTransferStatus;
    approvedAt?: string | null;
    approvedById?: string | null;
    approvedBy?: DomainEntitiesUsersUser;
    issuedById?: string | null;
    issuedBy?: DomainEntitiesUsersUser;
    issuedAt?: string | null;
  };
export type DomainEntitiesProductionSchedulesStockTransfersStockTransfer = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  reason?: string | null;
  requiredQuantity?: number;
  productionScheduleProductId?: string | null;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProduct;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStep;
  sources?:
    DomainEntitiesProductionSchedulesStockTransfersStockTransferSource[] | null;
};
export type DomainEntitiesProductionSchedulesStockTransfersStockTransferRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  code?: string | null;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  reason?: string | null;
  requiredQuantity?: number;
  productionScheduleProductId?: string | null;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductRead;
  productionActivityStepId?: string | null;
  productionActivityStep?: DomainEntitiesProductsProductionProductionActivityStepRead;
  sources?:
    | DomainEntitiesProductionSchedulesStockTransfersStockTransferSourceRead[]
    | null;
};
export type DomainEntitiesBasePackageStyle = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesBasePackageStyleRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  description?: string | null;
};
export type DomainEntitiesMaterialsBatchBatchStatus =
  0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
export type DomainEntitiesMaterialsBatchSr = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialBatchId?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  srNumber?: string | null;
  grossWeight?: number;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
};
export type DomainEntitiesMaterialsBatchSrRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialBatchId?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  srNumber?: string | null;
  grossWeight?: number;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
};
export type DomainEntitiesMaterialsBatchEventType = 0 | 1 | 2 | 3;
export type DomainEntitiesMaterialsBatchMaterialBatchEvent = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  batchId?: string;
  batch?: DomainEntitiesMaterialsBatchMaterialBatch;
  quantity?: number;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  type?: DomainEntitiesMaterialsBatchEventType;
  consumptionWarehouseId?: string | null;
  consumptionWarehouse?: DomainEntitiesWarehousesWarehouse;
  consumedAt?: string | null;
};
export type DomainEntitiesMaterialsBatchMaterialBatchEventRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  batchId?: string;
  batch?: DomainEntitiesMaterialsBatchMaterialBatch;
  quantity?: number;
  userId?: string;
  user?: DomainEntitiesUsersUser;
  type?: DomainEntitiesMaterialsBatchEventType;
  consumptionWarehouseId?: string | null;
  consumptionWarehouse?: DomainEntitiesWarehousesWarehouse;
  consumedAt?: string | null;
};
export type DomainEntitiesMaterialsBatchMovementType = 0 | 1 | 2;
export type DomainEntitiesMaterialsBatchMassMaterialBatchMovement = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  batchId?: string;
  batch?: DomainEntitiesMaterialsBatchMaterialBatch;
  fromWarehouse?: DomainEntitiesWarehousesWarehouse;
  fromWarehouseId?: string | null;
  toWarehouse?: DomainEntitiesWarehousesWarehouse;
  toWarehouseId?: string | null;
  quantity?: number;
  movedAt?: string;
  movedById?: string;
  movedBy?: DomainEntitiesUsersUser;
  movementType?: DomainEntitiesMaterialsBatchMovementType;
};
export type DomainEntitiesMaterialsBatchMassMaterialBatchMovementRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  batchId?: string;
  batch?: DomainEntitiesMaterialsBatchMaterialBatch;
  fromWarehouse?: DomainEntitiesWarehousesWarehouse;
  fromWarehouseId?: string | null;
  toWarehouse?: DomainEntitiesWarehousesWarehouse;
  toWarehouseId?: string | null;
  quantity?: number;
  movedAt?: string;
  movedById?: string;
  movedBy?: DomainEntitiesUsersUser;
  movementType?: DomainEntitiesMaterialsBatchMovementType;
};
export type DomainEntitiesMaterialsBatchMaterialBatchReservedQuantity = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialBatchId?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  warehouseId?: string;
  warehouse?: DomainEntitiesWarehousesWarehouse;
  warehouseLocationShelfId?: string | null;
  warehouseLocationShelf?: DomainEntitiesWarehousesWarehouseLocationShelf;
  productionScheduleProductId?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProduct;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  quantity?: number;
};
export type DomainEntitiesMaterialsBatchMaterialBatchReservedQuantityRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialBatchId?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  warehouseId?: string;
  warehouse?: DomainEntitiesWarehousesWarehouse;
  warehouseLocationShelfId?: string | null;
  warehouseLocationShelf?: DomainEntitiesWarehousesWarehouseLocationShelf;
  productionScheduleProductId?: string;
  productionScheduleProduct?: DomainEntitiesProductionSchedulesProductionScheduleProductRead;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  quantity?: number;
};
export type DomainEntitiesMaterialsBatchMaterialBatch = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterial;
  checklistId?: string | null;
  checklist?: DomainEntitiesChecklistsChecklist;
  batchNumber?: string | null;
  grnId?: string | null;
  grn?: DomainEntitiesGrnsGrn;
  stockTransferId?: string | null;
  stockTransfer?: DomainEntitiesProductionSchedulesStockTransfersStockTransfer;
  numberOfContainers?: number;
  containerPackageStyleId?: string | null;
  containerPackageStyle?: DomainEntitiesBasePackageStyle;
  quantityPerContainer?: number;
  quantityAssigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  dateRejected?: string | null;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  retestReason?: string | null;
  retestNotes?: string | null;
  sampleWeights?: DomainEntitiesMaterialsBatchSr[] | null;
  events?: DomainEntitiesMaterialsBatchMaterialBatchEvent[] | null;
  massMovements?:
    DomainEntitiesMaterialsBatchMassMaterialBatchMovement[] | null;
  reservedQuantities?:
    DomainEntitiesMaterialsBatchMaterialBatchReservedQuantity[] | null;
  shelfMaterialBatches?: DomainEntitiesWarehousesShelfMaterialBatch[] | null;
  returnDate?: string | null;
  issueNumber?: string | null;
  issuedById?: string | null;
  issuedBy?: DomainEntitiesUsersUser;
  issuedAt?: string | null;
};
export type DomainEntitiesMaterialsBatchMaterialBatchRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  materialId?: string;
  material?: DomainEntitiesMaterialsMaterialRead;
  checklistId?: string | null;
  checklist?: DomainEntitiesChecklistsChecklistRead;
  batchNumber?: string | null;
  grnId?: string | null;
  grn?: DomainEntitiesGrnsGrnRead;
  stockTransferId?: string | null;
  stockTransfer?: DomainEntitiesProductionSchedulesStockTransfersStockTransferRead;
  numberOfContainers?: number;
  containerPackageStyleId?: string | null;
  containerPackageStyle?: DomainEntitiesBasePackageStyleRead;
  quantityPerContainer?: number;
  quantityAssigned?: number;
  totalQuantity?: number;
  consumedQuantity?: number;
  remainingQuantity?: number;
  quantityUnassigned?: number;
  sampledQuantity?: number;
  quantityDistributed?: number;
  uoMId?: string;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  status?: DomainEntitiesMaterialsBatchBatchStatus;
  dateReceived?: string;
  dateApproved?: string | null;
  dateRejected?: string | null;
  expiryDate?: string | null;
  manufacturingDate?: string | null;
  retestDate?: string | null;
  retestReason?: string | null;
  retestNotes?: string | null;
  sampleWeights?: DomainEntitiesMaterialsBatchSrRead[] | null;
  events?: DomainEntitiesMaterialsBatchMaterialBatchEventRead[] | null;
  massMovements?:
    DomainEntitiesMaterialsBatchMassMaterialBatchMovementRead[] | null;
  reservedQuantities?:
    DomainEntitiesMaterialsBatchMaterialBatchReservedQuantityRead[] | null;
  reservedQuantity?: number;
  shelfMaterialBatches?: DomainEntitiesWarehousesShelfMaterialBatch[] | null;
  returnDate?: string | null;
  issueNumber?: string | null;
  issuedById?: string | null;
  issuedBy?: DomainEntitiesUsersUser;
  issuedAt?: string | null;
};
export type DomainEntitiesWarehousesShelfMaterialBatch = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseLocationShelfId?: string;
  warehouseLocationShelf?: DomainEntitiesWarehousesWarehouseLocationShelf;
  materialBatchId?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatch;
  quantity?: number;
  rowVersion?: string | null;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasure;
  note?: string | null;
};
export type DomainEntitiesWarehousesShelfMaterialBatchRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseLocationShelfId?: string;
  warehouseLocationShelf?: DomainEntitiesWarehousesWarehouseLocationShelf;
  materialBatchId?: string;
  materialBatch?: DomainEntitiesMaterialsBatchMaterialBatchRead;
  quantity?: number;
  rowVersion?: string | null;
  uoMId?: string | null;
  uoM?: DomainEntitiesBaseUnitOfMeasureRead;
  note?: string | null;
};
export type DomainEntitiesWarehousesWarehouseLocationShelf = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseLocationRackId?: string;
  warehouseLocationRack?: DomainEntitiesWarehousesWarehouseLocationRack;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  materialBatches?: DomainEntitiesWarehousesShelfMaterialBatch[] | null;
};
export type DomainEntitiesWarehousesWarehouseLocationShelfRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseLocationRackId?: string;
  warehouseLocationRack?: DomainEntitiesWarehousesWarehouseLocationRack;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  materialBatches?: DomainEntitiesWarehousesShelfMaterialBatchRead[] | null;
};
export type DomainEntitiesWarehousesWarehouseLocationRack = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseLocationId?: string;
  warehouseLocation?: DomainEntitiesWarehousesWarehouseLocation;
  name?: string | null;
  description?: string | null;
  shelves?: DomainEntitiesWarehousesWarehouseLocationShelf[] | null;
};
export type DomainEntitiesWarehousesWarehouseLocationRackRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseLocationId?: string;
  warehouseLocation?: DomainEntitiesWarehousesWarehouseLocation;
  name?: string | null;
  description?: string | null;
  shelves?: DomainEntitiesWarehousesWarehouseLocationShelfRead[] | null;
};
export type DomainEntitiesWarehousesWarehouseLocation = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseId?: string;
  warehouse?: DomainEntitiesWarehousesWarehouse;
  name?: string | null;
  floorName?: string | null;
  description?: string | null;
  racks?: DomainEntitiesWarehousesWarehouseLocationRack[] | null;
};
export type DomainEntitiesWarehousesWarehouseLocationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  warehouseId?: string;
  warehouse?: DomainEntitiesWarehousesWarehouse;
  name?: string | null;
  floorName?: string | null;
  description?: string | null;
  racks?: DomainEntitiesWarehousesWarehouseLocationRackRead[] | null;
};
export type DomainEntitiesPersonsPerson = {
  fullName?: string | null;
  phoneNumber?: string | null;
  occupation?: string | null;
  lifeStatus?: DomainEntitiesPersonsLifeStatus;
};
export type DomainEntitiesEmergencyContactsEmergencyContact = {
  fullName?: string | null;
  contactNumber?: string | null;
  relationship?: string | null;
  residentialAddress?: string | null;
};
export type DomainEntitiesChildrenChild = {
  fullName?: string | null;
  dateOfBirth?: string;
  gender?: DomainEntitiesEmployeesGender;
};
export type DomainEntitiesSiblingsSibling = {
  fullName?: string | null;
  contact?: string | null;
  gender?: DomainEntitiesEmployeesGender;
};
export type DomainEntitiesEducationHistoriesEducation = {
  schoolName?: string | null;
  startDate?: string;
  endDate?: string;
  major?: string | null;
  qualificationEarned?: string | null;
};
export type DomainEntitiesEmployeeHistoriesEmploymentHistory = {
  companyName?: string | null;
  startDate?: string;
  endDate?: string;
  position?: string | null;
};
export type DomainEntitiesShiftAssignmentsShiftCategory = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
};
export type DomainEntitiesShiftAssignmentsShiftCategoryRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
};
export type DomainEntitiesShiftTypesRotationType = 0 | 1;
export type DomainEntitiesShiftSchedulesScheduleFrequency =
  0 | 1 | 2 | 3 | 4 | 5;
export type DomainEntitiesShiftSchedulesScheduleStatus = 0 | 1 | 2 | 3 | 4;
export type DomainEntitiesShiftSchedulesShiftSchedule = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  scheduleName?: string | null;
  frequency?: DomainEntitiesShiftSchedulesScheduleFrequency;
  scheduleStatus?: DomainEntitiesShiftSchedulesScheduleStatus;
  startDate?: string;
  endDate?: string;
  shiftTypes?: DomainEntitiesShiftTypesShiftType[] | null;
  employees?: DomainEntitiesEmployeesEmployee[] | null;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
};
export type DomainEntitiesShiftSchedulesShiftScheduleRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  scheduleName?: string | null;
  frequency?: DomainEntitiesShiftSchedulesScheduleFrequency;
  scheduleStatus?: DomainEntitiesShiftSchedulesScheduleStatus;
  startDate?: string;
  endDate?: string;
  shiftTypes?: DomainEntitiesShiftTypesShiftType[] | null;
  employees?: DomainEntitiesEmployeesEmployee[] | null;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
};
export type SystemDayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DomainEntitiesShiftTypesShiftType = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  shiftName?: string | null;
  rotationType?: DomainEntitiesShiftTypesRotationType;
  startTime?: string;
  endTime?: string;
  shiftSchedules?: DomainEntitiesShiftSchedulesShiftSchedule[] | null;
  applicableDays?: SystemDayOfWeek[] | null;
};
export type DomainEntitiesShiftTypesShiftTypeRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  shiftName?: string | null;
  rotationType?: DomainEntitiesShiftTypesRotationType;
  startTime?: string;
  endTime?: string;
  shiftSchedules?: DomainEntitiesShiftSchedulesShiftScheduleRead[] | null;
  applicableDays?: SystemDayOfWeek[] | null;
};
export type DomainEntitiesShiftAssignmentsShiftAssignment = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  scheduleDate?: string;
  employeeId?: string;
  employee?: DomainEntitiesEmployeesEmployee;
  shiftScheduleId?: string;
  shiftTypeId?: string;
  shiftCategoryId?: string;
  shiftCategory?: DomainEntitiesShiftAssignmentsShiftCategory;
  shiftType?: DomainEntitiesShiftTypesShiftType;
  shiftSchedules?: DomainEntitiesShiftSchedulesShiftSchedule;
};
export type DomainEntitiesShiftAssignmentsShiftAssignmentRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  scheduleDate?: string;
  employeeId?: string;
  employee?: DomainEntitiesEmployeesEmployee;
  shiftScheduleId?: string;
  shiftTypeId?: string;
  shiftCategoryId?: string;
  shiftCategory?: DomainEntitiesShiftAssignmentsShiftCategoryRead;
  shiftType?: DomainEntitiesShiftTypesShiftTypeRead;
  shiftSchedules?: DomainEntitiesShiftSchedulesShiftScheduleRead;
};
export type DomainEntitiesLeaveTypesLeaveType = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  isPaid?: boolean;
  deductFromBalance?: boolean;
  deductionLimit?: number | null;
  numberOfDays?: number;
  isActive?: boolean;
  designations?: DomainEntitiesDesignationsDesignation[] | null;
};
export type DomainEntitiesLeaveTypesLeaveTypeRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  isPaid?: boolean;
  deductFromBalance?: boolean;
  deductionLimit?: number | null;
  numberOfDays?: number;
  isActive?: boolean;
  designations?: DomainEntitiesDesignationsDesignation[] | null;
};
export type DomainEntitiesDesignationsDesignation = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name: string;
  description?: string | null;
  maximumLeaveDays?: number;
  departments?: DomainEntitiesDepartmentsDepartment[] | null;
  leaveTypes?: DomainEntitiesLeaveTypesLeaveType[] | null;
};
export type DomainEntitiesDesignationsDesignationRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name: string;
  description?: string | null;
  maximumLeaveDays?: number;
  departments?: DomainEntitiesDepartmentsDepartment[] | null;
  leaveTypes?: DomainEntitiesLeaveTypesLeaveTypeRead[] | null;
};
export type DomainEntitiesEmployeesEmployee = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  dateOfBirth?: string;
  gender?: DomainEntitiesEmployeesGender;
  residentialAddress?: string | null;
  nationality?: string | null;
  region?: string | null;
  maritalStatus?: DomainEntitiesEmployeesMaritalStatus;
  religion?: DomainEntitiesEmployeesReligion;
  staffNumber?: string | null;
  email?: string | null;
  userId?: string | null;
  phoneNumber?: string | null;
  bankAccountNumber?: string | null;
  ssnitNumber?: string | null;
  ghanaCardNumber?: string | null;
  annualLeaveDays?: number;
  type?: DomainEntitiesEmployeesEmployeeType;
  mother?: DomainEntitiesPersonsPerson;
  father?: DomainEntitiesPersonsPerson;
  spouse?: DomainEntitiesPersonsPerson;
  emergencyContact?: DomainEntitiesEmergencyContactsEmergencyContact;
  nextOfKin?: DomainEntitiesEmergencyContactsEmergencyContact;
  children?: DomainEntitiesChildrenChild[] | null;
  siblings?: DomainEntitiesSiblingsSibling[] | null;
  educationBackground?: DomainEntitiesEducationHistoriesEducation[] | null;
  employmentHistory?: DomainEntitiesEmployeeHistoriesEmploymentHistory[] | null;
  shiftAssignments?: DomainEntitiesShiftAssignmentsShiftAssignment[] | null;
  reportingManagerId?: string | null;
  reportingManager?: DomainEntitiesUsersUser;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  designationId?: string | null;
  designation?: DomainEntitiesDesignationsDesignation;
  dateEmployed?: string;
  level?: DomainEntitiesEmployeesEmployeeLevel;
  status?: DomainEntitiesEmployeesEmployeeStatus;
  activeStatus?: DomainEntitiesEmployeesEmployeeActiveStatus;
  inactiveStatus?: DomainEntitiesEmployeesEmployeeInactiveStatus;
  suspensionStartDate?: string | null;
  suspensionEndDate?: string | null;
  exitDate?: string | null;
  warehouses?: DomainEntitiesWarehousesWarehouse[] | null;
};
export type DomainEntitiesEmployeesEmployeeRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  firstName?: string | null;
  lastName?: string | null;
  avatar?: string | null;
  dateOfBirth?: string;
  gender?: DomainEntitiesEmployeesGender;
  residentialAddress?: string | null;
  nationality?: string | null;
  region?: string | null;
  maritalStatus?: DomainEntitiesEmployeesMaritalStatus;
  religion?: DomainEntitiesEmployeesReligion;
  staffNumber?: string | null;
  email?: string | null;
  userId?: string | null;
  phoneNumber?: string | null;
  bankAccountNumber?: string | null;
  ssnitNumber?: string | null;
  ghanaCardNumber?: string | null;
  annualLeaveDays?: number;
  type?: DomainEntitiesEmployeesEmployeeType;
  mother?: DomainEntitiesPersonsPerson;
  father?: DomainEntitiesPersonsPerson;
  spouse?: DomainEntitiesPersonsPerson;
  emergencyContact?: DomainEntitiesEmergencyContactsEmergencyContact;
  nextOfKin?: DomainEntitiesEmergencyContactsEmergencyContact;
  children?: DomainEntitiesChildrenChild[] | null;
  siblings?: DomainEntitiesSiblingsSibling[] | null;
  educationBackground?: DomainEntitiesEducationHistoriesEducation[] | null;
  employmentHistory?: DomainEntitiesEmployeeHistoriesEmploymentHistory[] | null;
  shiftAssignments?: DomainEntitiesShiftAssignmentsShiftAssignmentRead[] | null;
  reportingManagerId?: string | null;
  reportingManager?: DomainEntitiesUsersUser;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  designationId?: string | null;
  designation?: DomainEntitiesDesignationsDesignationRead;
  dateEmployed?: string;
  level?: DomainEntitiesEmployeesEmployeeLevel;
  status?: DomainEntitiesEmployeesEmployeeStatus;
  activeStatus?: DomainEntitiesEmployeesEmployeeActiveStatus;
  inactiveStatus?: DomainEntitiesEmployeesEmployeeInactiveStatus;
  suspensionStartDate?: string | null;
  suspensionEndDate?: string | null;
  exitDate?: string | null;
  warehouses?: DomainEntitiesWarehousesWarehouse[] | null;
};
export type DomainEntitiesWarehousesWarehouse = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  description?: string | null;
  locations?: DomainEntitiesWarehousesWarehouseLocation[] | null;
  arrivalLocation?: DomainEntitiesWarehousesWarehouseArrivalLocation;
  type?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  employees?: DomainEntitiesEmployeesEmployee[] | null;
};
export type DomainEntitiesWarehousesWarehouseRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  description?: string | null;
  locations?: DomainEntitiesWarehousesWarehouseLocationRead[] | null;
  arrivalLocation?: DomainEntitiesWarehousesWarehouseArrivalLocationRead;
  type?: DomainEntitiesWarehousesWarehouseType;
  division?: DomainEntitiesProductsDivision;
  employees?: DomainEntitiesEmployeesEmployeeRead[] | null;
};
export type DomainEntitiesDepartmentsDepartment = {
  id?: string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  type?: SharedDepartmentType;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  lastUpdatedById?: string | null;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  parentDepartmentId?: string | null;
  parentDepartment?: DomainEntitiesDepartmentsDepartment;
  warehouses?: DomainEntitiesWarehousesWarehouse[] | null;
  designations?: DomainEntitiesDesignationsDesignation[] | null;
  division?: DomainEntitiesProductsDivision;
  isSeeded?: boolean;
};
export type DomainEntitiesDepartmentsDepartmentRead = {
  id?: string;
  code?: string | null;
  name?: string | null;
  description?: string | null;
  type?: SharedDepartmentType;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  lastUpdatedById?: string | null;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  parentDepartmentId?: string | null;
  parentDepartment?: DomainEntitiesDepartmentsDepartmentRead;
  warehouses?: DomainEntitiesWarehousesWarehouseRead[] | null;
  designations?: DomainEntitiesDesignationsDesignationRead[] | null;
  division?: DomainEntitiesProductsDivision;
  isSeeded?: boolean;
};
export type DomainEntitiesUsersUser = {
  id?: string;
  userName?: string | null;
  normalizedUserName?: string | null;
  email?: string | null;
  normalizedEmail?: string | null;
  emailConfirmed?: boolean;
  passwordHash?: string | null;
  securityStamp?: string | null;
  concurrencyStamp?: string | null;
  phoneNumber?: string | null;
  phoneNumberConfirmed?: boolean;
  twoFactorEnabled?: boolean;
  lockoutEnd?: string | null;
  lockoutEnabled?: boolean;
  accessFailedCount?: number;
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  dateOfBirth?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
  lastUpdatedById?: string | null;
  createdById?: string | null;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  avatar?: string | null;
  isDisabled?: boolean;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartment;
  signature?: string | null;
};
export type DomainEntitiesUsersUserRead = {
  id?: string;
  userName?: string | null;
  normalizedUserName?: string | null;
  email?: string | null;
  normalizedEmail?: string | null;
  emailConfirmed?: boolean;
  passwordHash?: string | null;
  securityStamp?: string | null;
  concurrencyStamp?: string | null;
  phoneNumber?: string | null;
  phoneNumberConfirmed?: boolean;
  twoFactorEnabled?: boolean;
  lockoutEnd?: string | null;
  lockoutEnabled?: boolean;
  accessFailedCount?: number;
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  dateOfBirth?: string | null;
  createdAt?: string;
  updatedAt?: string | null;
  lastUpdatedById?: string | null;
  createdById?: string | null;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  avatar?: string | null;
  isDisabled?: boolean;
  departmentId?: string | null;
  department?: DomainEntitiesDepartmentsDepartmentRead;
  signature?: string | null;
};
export type DomainEntitiesItemsItemCategory = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
};
export type DomainEntitiesItemsItemCategoryRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUserRead;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUserRead;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUserRead;
  name?: string | null;
};
export type DomainEntitiesItemsItem = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  name?: string | null;
  code?: string | null;
  classification?: DomainEntitiesItemsInventoryClassification;
  unitOfMeasureId?: string;
  unitOfMeasure?: DomainEntitiesBaseUnitOfMeasure;
  minimumLevel?: number;
  maximumLevel?: number;
  reorderLevel?: number;
  itemCategoryId?: string | null;
  itemCategory?: DomainEntitiesItemsItemCategory;
  store?: DomainEntitiesItemsStore;
  isActive?: boolean;
  description?: string | null;
  availableQuantity?: number;
  rowVersion?: string | null;
};
export type DomainEntitiesItemsItemRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUserRead;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUserRead;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUserRead;
  name?: string | null;
  code?: string | null;
  classification?: DomainEntitiesItemsInventoryClassification;
  unitOfMeasureId?: string;
  unitOfMeasure?: DomainEntitiesBaseUnitOfMeasureRead;
  minimumLevel?: number;
  maximumLevel?: number;
  reorderLevel?: number;
  itemCategoryId?: string | null;
  itemCategory?: DomainEntitiesItemsItemCategoryRead;
  store?: DomainEntitiesItemsStore;
  isActive?: boolean;
  description?: string | null;
  availableQuantity?: number;
  rowVersion?: string | null;
};
export type DomainEntitiesItemsItemStockRequisitionItem = {
  id?: string;
  itemStockRequisitionId?: string;
  itemStockRequisition?: DomainEntitiesItemStockRequisitionsItemStockRequisition;
  itemId?: string;
  item?: DomainEntitiesItemsItem;
  quantityRequested?: number;
};
export type DomainEntitiesItemsItemStockRequisitionItemRead = {
  id?: string;
  itemStockRequisitionId?: string;
  itemStockRequisition?: DomainEntitiesItemStockRequisitionsItemStockRequisition;
  itemId?: string;
  item?: DomainEntitiesItemsItemRead;
  quantityRequested?: number;
};
export type DomainEntitiesItemStockRequisitionsItemStockRequisition = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUser;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUser;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUser;
  number?: string | null;
  requisitionDate?: string;
  requestedById?: string;
  requestedBy?: DomainEntitiesUsersUser;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartment;
  justification?: string | null;
  quantityRequested?: number;
  status?: DomainEntitiesItemStockRequisitionsIssueItemStockRequisitionStatus;
  requisitionItems?: DomainEntitiesItemsItemStockRequisitionItem[] | null;
};
export type DomainEntitiesItemStockRequisitionsItemStockRequisitionRead = {
  id?: string;
  createdAt?: string;
  updatedAt?: string | null;
  createdById?: string | null;
  createdBy?: DomainEntitiesUsersUserRead;
  lastUpdatedById?: string | null;
  lastUpdatedBy?: DomainEntitiesUsersUserRead;
  deletedAt?: string | null;
  lastDeletedById?: string | null;
  lastDeletedBy?: DomainEntitiesUsersUserRead;
  number?: string | null;
  requisitionDate?: string;
  requestedById?: string;
  requestedBy?: DomainEntitiesUsersUserRead;
  departmentId?: string;
  department?: DomainEntitiesDepartmentsDepartmentRead;
  justification?: string | null;
  quantityRequested?: number;
  status?: DomainEntitiesItemStockRequisitionsIssueItemStockRequisitionStatus;
  requisitionItems?: DomainEntitiesItemsItemStockRequisitionItemRead[] | null;
};
export type DomainEntitiesItemsItemStockRequisitionItemDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  itemStockRequisitionId?: string;
  itemStockRequisition?: DomainEntitiesItemStockRequisitionsItemStockRequisition;
  itemId?: string;
  item?: DomainEntitiesItemsItem;
  quantityRequested?: number;
  quantityIssued?: number;
};
export type DomainEntitiesItemsItemStockRequisitionItemDtoRead = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  itemStockRequisitionId?: string;
  itemStockRequisition?: DomainEntitiesItemStockRequisitionsItemStockRequisitionRead;
  itemId?: string;
  item?: DomainEntitiesItemsItemRead;
  quantityRequested?: number;
  quantityIssued?: number;
  quantityRemaining?: number;
};
export type DomainEntitiesItemStockRequisitionsItemStockRequisitionDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  number?: string | null;
  requisitionDate?: string;
  requestedBy?: DomainEntitiesUsersUserDto;
  department?: DomainEntitiesDepartmentsDepartmentDto;
  justification?: string | null;
  status?: DomainEntitiesItemStockRequisitionsIssueItemStockRequisitionStatus;
  store?: DomainEntitiesItemsStore;
  issueHistoryAttributed?: boolean;
  requisitionItems?: DomainEntitiesItemsItemStockRequisitionItemDto[] | null;
};
export type DomainEntitiesItemStockRequisitionsItemStockRequisitionDtoRead = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  number?: string | null;
  requisitionDate?: string;
  requestedBy?: DomainEntitiesUsersUserDto;
  department?: DomainEntitiesDepartmentsDepartmentDto;
  justification?: string | null;
  status?: DomainEntitiesItemStockRequisitionsIssueItemStockRequisitionStatus;
  store?: DomainEntitiesItemsStore;
  issueHistoryAttributed?: boolean;
  requisitionItems?:
    DomainEntitiesItemsItemStockRequisitionItemDtoRead[] | null;
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemStockRequisitionsItemStockRequisitionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesItemStockRequisitionsItemStockRequisitionDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesItemStockRequisitionsItemStockRequisitionDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798ERead =
  {
    data?:
      DomainEntitiesItemStockRequisitionsItemStockRequisitionDtoRead[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export type DomainEntitiesItemStockRequisitionsIssueQuantityDto = {
  itemId?: string;
  quantity?: number;
};
export type DomainEntitiesItemStockRequisitionsIssueStockAgainstRequisitionRequest =
  {
    quantitiesToIssue?:
      DomainEntitiesItemStockRequisitionsIssueQuantityDto[] | null;
  };
export type DomainEntitiesRecoverableItemsReportsCreateRecoverableItemReportRequest =
  {
    itemId: string;
    quantity: number;
    reason?: string | null;
    itemStockRequisitionItemId?: string | null;
  };
export type DomainEntitiesRecoverableItemsReportsRecoverableItemReportDto = {
  id?: string;
  createdBy?: DomainEntitiesUsersUserDto;
  createdAt?: string;
  item?: DomainEntitiesItemsItemDto;
  quantity?: number;
  reason?: string | null;
  store?: DomainEntitiesItemsStore;
  itemStockRequisitionId?: string | null;
  itemStockRequisitionItemId?: string | null;
  requisitionNumber?: string | null;
};
export type DomainEntitiesVendorsCreateVendorRequest = {
  name: string;
  address: string;
  phone: string;
  email: string;
  countryId: string;
  currencyId: string;
  contactPerson?: string | null;
  itemIds: string[];
};
export type AppUtilsPaginateable601SystemCollectionsGenericIEnumerable601DomainEntitiesVendorsVendorDto20Domain20Version100020CultureNeutral20PublicKeyTokenNull20SystemPrivateCoreLib20Version900020CultureNeutral20PublicKeyToken7Cec85D7Bea7798E =
  {
    data?: DomainEntitiesVendorsVendorDto[] | null;
    pageIndex?: number;
    pageCount?: number;
    totalRecordCount?: number;
    numberOfPagesToShow?: number;
    startPageIndex?: number;
    stopPageIndex?: number;
  };
export const {
  usePostApiV1ProcurementInventoryMutation,
  useGetApiV1ProcurementInventoryQuery,
  useLazyGetApiV1ProcurementInventoryQuery,
  usePutApiV1ProcurementInventoryByIdMutation,
  useDeleteApiV1ProcurementInventoryByIdMutation,
  useGetApiV1ProcurementInventoryByIdQuery,
  useLazyGetApiV1ProcurementInventoryByIdQuery,
  usePostApiV1ProcurementInventorySourceMutation,
  usePostApiV1ProcurementInventoryMarketMutation,
  useGetApiV1ProcurementInventoryMarketQuery,
  useLazyGetApiV1ProcurementInventoryMarketQuery,
  useGetApiV1ProcurementInventoryMarketByIdQuery,
  useLazyGetApiV1ProcurementInventoryMarketByIdQuery,
  useGetApiV1ProcurementInventoryPriceComparisonQuery,
  useLazyGetApiV1ProcurementInventoryPriceComparisonQuery,
  usePostApiV1ProcurementInventoryMemoOpenMarketMutation,
  usePostApiV1ProcurementInventoryMemoTrustedVendorMutation,
  usePostApiV1ProcurementInventoryVendorByVendorIdSendQuotationMutation,
  useGetApiV1ProcurementInventoryVendorQuotationsQuery,
  useLazyGetApiV1ProcurementInventoryVendorQuotationsQuery,
  useGetApiV1ProcurementInventoryVendorQuotationByVendorQuotationIdQuery,
  useLazyGetApiV1ProcurementInventoryVendorQuotationByVendorQuotationIdQuery,
  usePostApiV1ProcurementInventoryVendorQuotationByVendorQuotationIdReceiveMutation,
  useGetApiV1ProcurementInventoryMarketVendorsQuery,
  useLazyGetApiV1ProcurementInventoryMarketVendorsQuery,
  usePostApiV1ProcurementInventoryMarketVendorsMutation,
  usePostApiV1ProcurementInventoryMarketVendorsByMarketRequisitionVendorIdConfirmMutation,
  useGetApiV1ProcurementInventoryMemoQuery,
  useLazyGetApiV1ProcurementInventoryMemoQuery,
  useGetApiV1ProcurementInventoryMemoByIdQuery,
  useLazyGetApiV1ProcurementInventoryMemoByIdQuery,
  usePostApiV1ProcurementInventoryMemoItemByIdMarkPaidMutation,
  useGetApiV1ProcurementInventoryMemoCodeGenerateQuery,
  useLazyGetApiV1ProcurementInventoryMemoCodeGenerateQuery,
  useGetApiV1ProcurementInventoryPurchasedItemsQuery,
  useLazyGetApiV1ProcurementInventoryPurchasedItemsQuery,
  usePostApiV1ProcurementInventoryItemsByIdApproveMutation,
  usePostApiV1ProcurementInventoryItemsByIdRejectMutation,
  useGetApiV1ItemsChoicesQuery,
  useLazyGetApiV1ItemsChoicesQuery,
  usePostApiV1ItemsShipmentInvoiceMutation,
  useGetApiV1ItemsShipmentInvoiceQuery,
  useLazyGetApiV1ItemsShipmentInvoiceQuery,
  useGetApiV1ItemsShipmentInvoiceByInvoiceIdQuery,
  useLazyGetApiV1ItemsShipmentInvoiceByInvoiceIdQuery,
  usePutApiV1ItemsShipmentInvoiceByInvoiceIdMutation,
  useDeleteApiV1ItemsShipmentInvoiceByInvoiceIdMutation,
  useGetApiV1ItemsShipmentInvoiceUnattachedQuery,
  useLazyGetApiV1ItemsShipmentInvoiceUnattachedQuery,
  usePutApiV1ItemsShipmentInvoiceByInvoiceIdPaidMutation,
  usePostApiV1ItemsShipmentDocumentMutation,
  useGetApiV1ItemsShipmentDocumentQuery,
  useLazyGetApiV1ItemsShipmentDocumentQuery,
  useGetApiV1ItemsShipmentDocumentByShipmentDocumentIdQuery,
  useLazyGetApiV1ItemsShipmentDocumentByShipmentDocumentIdQuery,
  usePutApiV1ItemsShipmentDocumentByShipmentDocumentIdMutation,
  useDeleteApiV1ItemsShipmentDocumentByShipmentDocumentIdMutation,
  usePutApiV1ItemsShipmentDocumentByShipmentDocumentIdArrivedMutation,
  usePostApiV1ItemsWaybillMutation,
  useGetApiV1ItemsWaybillQuery,
  useLazyGetApiV1ItemsWaybillQuery,
  useGetApiV1ItemsWaybillByWaybillIdQuery,
  useLazyGetApiV1ItemsWaybillByWaybillIdQuery,
  usePutApiV1ItemsWaybillByWaybillIdMutation,
  useDeleteApiV1ItemsWaybillByWaybillIdMutation,
  usePostApiV1ItemsBillingSheetMutation,
  useGetApiV1ItemsBillingSheetQuery,
  useLazyGetApiV1ItemsBillingSheetQuery,
  useGetApiV1ItemsBillingSheetByBillingSheetIdQuery,
  useLazyGetApiV1ItemsBillingSheetByBillingSheetIdQuery,
  usePutApiV1ItemsBillingSheetByBillingSheetIdMutation,
  useDeleteApiV1ItemsBillingSheetByBillingSheetIdMutation,
  useGetApiV1ItemsBillingSheetInvoiceByInvoiceIdQuery,
  useLazyGetApiV1ItemsBillingSheetInvoiceByInvoiceIdQuery,
  usePutApiV1ItemsBillingSheetByBillingSheetIdChargesMutation,
  usePutApiV1ItemsBillingSheetChargesPaidMutation,
  usePostApiV1ItemsMutation,
  useGetApiV1ItemsQuery,
  useLazyGetApiV1ItemsQuery,
  useGetApiV1ItemsByIdQuery,
  useLazyGetApiV1ItemsByIdQuery,
  usePutApiV1ItemsByIdMutation,
  useDeleteApiV1ItemsByIdMutation,
  useGetApiV1ItemsByItemCodeTransactionsQuery,
  useLazyGetApiV1ItemsByItemCodeTransactionsQuery,
  usePostApiV1ItemGrnsMutation,
  useGetApiV1ItemGrnsQuery,
  useLazyGetApiV1ItemGrnsQuery,
  useGetApiV1ItemGrnsByIdQuery,
  useLazyGetApiV1ItemGrnsByIdQuery,
  usePutApiV1ItemGrnsByIdMutation,
  useDeleteApiV1ItemGrnsByIdMutation,
  useGetApiV1ItemInventoryTransactionsByMemoIdQuery,
  useLazyGetApiV1ItemInventoryTransactionsByMemoIdQuery,
  usePostApiV1ItemsStockRequisitionsMutation,
  useGetApiV1ItemsStockRequisitionsQuery,
  useLazyGetApiV1ItemsStockRequisitionsQuery,
  useGetApiV1ItemsStockRequisitionsByIdQuery,
  useLazyGetApiV1ItemsStockRequisitionsByIdQuery,
  usePutApiV1ItemsStockRequisitionsByIdMutation,
  useDeleteApiV1ItemsStockRequisitionsByIdMutation,
  usePostApiV1ItemsStockRequisitionsByStockRequisitionIdIssueStockAgainstRequisitionMutation,
  usePostApiV1ItemsStockRequisitionsByStockRequisitionIdPartialIssueStockAgainstRequisitionMutation,
  usePostV1RecoverableItemsReportsMutation,
  useGetV1RecoverableItemsReportsQuery,
  useLazyGetV1RecoverableItemsReportsQuery,
  usePostApiV1RecoverableItemsReportsMutation,
  useGetApiV1RecoverableItemsReportsQuery,
  useLazyGetApiV1RecoverableItemsReportsQuery,
  usePostApiV1VendorsMutation,
  useGetApiV1VendorsQuery,
  useLazyGetApiV1VendorsQuery,
  useGetApiV1VendorsByIdQuery,
  useLazyGetApiV1VendorsByIdQuery,
  usePutApiV1VendorsByIdMutation,
  useDeleteApiV1VendorsByIdMutation,
  useGetApiV1VendorsItemByIdQuery,
  useLazyGetApiV1VendorsItemByIdQuery,
} = injectedRtkApi;
