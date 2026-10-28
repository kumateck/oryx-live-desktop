import { warehouseApi } from "@/shared/api/generated/warehouse";
import { addTags } from "@/shared/api/add-tags";

const comparison = { type: "PriceComparison" as const, id: "all" };

export const comparisonApi = warehouseApi.enhanceEndpoints({
  endpoints: {
    getApiV1RequisitionSourceMaterialPriceComparison: (definition) => { definition.providesTags = addTags(definition.providesTags, [comparison]); },
    // Awarding creates purchase orders and closes every quote that was open.
    postApiV1RequisitionSourceQuotationProcessPurchaseOrder: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [comparison, { type: "QuotationResponses", id: "all" }, { type: "PurchaseOrderList", id: "all" }]); },
  },
});
export const { useGetApiV1RequisitionSourceMaterialPriceComparisonQuery, usePostApiV1RequisitionSourceQuotationProcessPurchaseOrderMutation } = comparisonApi;
