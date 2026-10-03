import { comparisonApi } from "@/modules/price-comparison/api/comparison-api";
import { procurementApi } from "@/shared/api/generated/procurement";

const list = { type: "PurchaseOrderList" as const, id: "all" };
const one = (id: string) => ({ type: "PurchaseOrder" as const, id });
const changed = (_result: unknown, error: unknown, arg: { purchaseOrderId: string }) => error ? [] : [list, one(arg.purchaseOrderId)];

export const orderApi = procurementApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProcurementPurchaseOrderByPurchaseOrderId: { providesTags: (_result, _error, arg) => [one(arg.purchaseOrderId)] },
    putApiV1ProcurementPurchaseOrderByPurchaseOrderId: { invalidatesTags: changed },
    putApiV1ProcurementPurchaseOrderCheckByPurchaseOrderId: { invalidatesTags: changed },
    putApiV1ProcurementPurchaseOrderByPurchaseOrderIdRevise: { invalidatesTags: changed },
    // Refreshed even when it fails: the server marks the order as sent before it emails it.
    postApiV1ProcurementPurchaseOrderByPurchaseOrderId: { invalidatesTags: (_result, _error, arg) => [list, one(arg.purchaseOrderId)] },
  },
});
export const { useGetApiV1ProcurementPurchaseOrderByPurchaseOrderIdQuery, usePutApiV1ProcurementPurchaseOrderByPurchaseOrderIdMutation,
  usePutApiV1ProcurementPurchaseOrderCheckByPurchaseOrderIdMutation, usePutApiV1ProcurementPurchaseOrderByPurchaseOrderIdReviseMutation, usePostApiV1ProcurementPurchaseOrderByPurchaseOrderIdMutation } = orderApi;

/** The other suppliers' quotes for one material of an order. Read fresh each time: what it lists changes as lines are moved. */
export const { useGetApiV1RequisitionSourceMaterialPriceComparisonByMaterialQuery, useGetApiV1RequisitionSourceMaterialPriceComparisonQuery,
  usePostApiV1RequisitionSourceQuotationProcessPurchaseOrderMutation } = comparisonApi;
export const { useGetApiV1ProcurementSupplierBySupplierIdMaterialQuery, useGetApiV1ProcurementPurchaseOrderRequisitionByPurchaseOrderIdAndMaterialIdQuery } = orderApi;
