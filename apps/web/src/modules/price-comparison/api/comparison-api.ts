import { warehouseApi } from "@/shared/api/generated/warehouse";

const comparison = { type: "PriceComparison" as const, id: "all" };

export const comparisonApi = warehouseApi.enhanceEndpoints({
  endpoints: {
    getApiV1RequisitionSourceMaterialPriceComparison: { providesTags: [comparison] },
    // Awarding creates purchase orders and closes every quote that was open.
    postApiV1RequisitionSourceQuotationProcessPurchaseOrder: { invalidatesTags: (_result, error) => error ? [] : [comparison, { type: "QuotationResponses", id: "all" }, { type: "PurchaseOrderList", id: "all" }] },
  },
});
export const { useGetApiV1RequisitionSourceMaterialPriceComparisonQuery, usePostApiV1RequisitionSourceQuotationProcessPurchaseOrderMutation } = comparisonApi;
