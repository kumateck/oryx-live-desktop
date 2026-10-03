import { warehouseApi } from "@/shared/api/generated/warehouse";

const list = { type: "RequisitionList" as const, id: "all" };

export const requisitionApi = warehouseApi.enhanceEndpoints({
  endpoints: {
    getApiV1Requisition: { providesTags: [list] },
    getApiV1RequisitionByRequisitionId: { providesTags: (_result, _error, arg) => [{ type: "Requisition", id: arg.requisitionId }] },
    postApiV1Requisition: { invalidatesTags: (_result, error) => error ? [] : [list] },
    // Choosing suppliers moves the lines on and puts them on each supplier's quotation request.
    postApiV1RequisitionSource: { invalidatesTags: (_result, error, arg) => error ? [] : [list, { type: "QuotationRequests", id: "all" },
      { type: "Requisition", id: arg.domainEntitiesRequisitionsRequestCreateSourceRequisitionRequest.requisitionId ?? "" }] },
  },
});
export const { useGetApiV1RequisitionQuery, useGetApiV1RequisitionByRequisitionIdQuery, usePostApiV1RequisitionMutation, usePostApiV1RequisitionSourceMutation } = requisitionApi;
