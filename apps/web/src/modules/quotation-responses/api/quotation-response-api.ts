import { warehouseApi } from "@/shared/api/generated/warehouse";

const responses = { type: "QuotationResponses" as const, id: "all" };

export const quotationResponseApi = warehouseApi.enhanceEndpoints({
  endpoints: {
    getApiV1RequisitionSourceSupplierQuotation: { providesTags: [responses] },
    // Recorded prices are what price comparison ranks.
    postApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationReceive: { invalidatesTags: (_result, error) => error ? [] : [responses, { type: "PriceComparison", id: "all" }] },
  },
});
export const { useGetApiV1RequisitionSourceSupplierQuotationQuery, usePostApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationReceiveMutation } = quotationResponseApi;
