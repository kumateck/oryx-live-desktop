import { warehouseApi } from "@/shared/api/generated/warehouse";
import { addTags } from "@/shared/api/add-tags";

const requests = { type: "QuotationRequests" as const, id: "all" };

export const quotationRequestApi = warehouseApi.enhanceEndpoints({
  endpoints: {
    getApiV1RequisitionSourceSupplier: (definition) => { definition.providesTags = addTags(definition.providesTags, [requests]); },
    getApiV1RequisitionPendingBySupplierId: (definition) => { definition.providesTags = addTags(definition.providesTags, [{ type: "PriceComparison", id: "all" }]); },
    // A sent request becomes a quotation waiting for the supplier's prices.
    postApiV1RequisitionSourceSupplierBySupplierIdSendQuotation: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [requests, { type: "QuotationResponses", id: "all" }]); },
  },
});
export const { useGetApiV1RequisitionSourceSupplierQuery, useGetApiV1RequisitionPendingBySupplierIdQuery, usePostApiV1RequisitionSourceSupplierBySupplierIdSendQuotationMutation } = quotationRequestApi;
