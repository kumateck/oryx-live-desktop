import { warehouseApi } from "@/shared/api/generated/warehouse";
import { addTags } from "@/shared/api/add-tags";

const responses = { type: "QuotationResponses" as const, id: "all" };

export const quotationResponseApi = warehouseApi.enhanceEndpoints({
  endpoints: {
    getApiV1RequisitionSourceSupplierQuotation: (definition) => { definition.providesTags = addTags(definition.providesTags, [responses]); },
    // Recorded prices are what price comparison ranks.
    postApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationReceive: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [responses, { type: "PriceComparison", id: "all" }]); },
  },
});
export const { useGetApiV1RequisitionSourceSupplierQuotationQuery, usePostApiV1RequisitionSourceSupplierBySupplierQuotationIdQuotationReceiveMutation } = quotationResponseApi;
