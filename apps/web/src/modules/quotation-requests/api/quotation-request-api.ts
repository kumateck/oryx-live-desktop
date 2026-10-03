import { warehouseApi } from "@/shared/api/generated/warehouse";

const requests = { type: "QuotationRequests" as const, id: "all" };

export const quotationRequestApi = warehouseApi.enhanceEndpoints({
  endpoints: {
    getApiV1RequisitionSourceSupplier: { providesTags: [requests] },
    getApiV1RequisitionPendingBySupplierId: { providesTags: [{ type: "PriceComparison", id: "all" }] },
    // A sent request becomes a quotation waiting for the supplier's prices.
    postApiV1RequisitionSourceSupplierBySupplierIdSendQuotation: { invalidatesTags: (_result, error) => error ? [] : [requests, { type: "QuotationResponses", id: "all" }] },
  },
});
export const { useGetApiV1RequisitionSourceSupplierQuery, useGetApiV1RequisitionPendingBySupplierIdQuery, usePostApiV1RequisitionSourceSupplierBySupplierIdSendQuotationMutation } = quotationRequestApi;
