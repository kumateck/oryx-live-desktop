import { api } from "@/shared/api/base-api";
import { warehouseApi } from "@/shared/api/generated/warehouse";
import { addTags } from "@/shared/api/add-tags";

const list = { type: "RequisitionList" as const, id: "all" };

export const requisitionApi = warehouseApi.enhanceEndpoints({
  endpoints: {
    getApiV1Requisition: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    getApiV1RequisitionByRequisitionId: (definition) => { definition.providesTags = addTags(definition.providesTags, (_result, _error, arg) => [{ type: "Requisition", id: arg.requisitionId }]); },
    postApiV1Requisition: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [list]); },
    // Choosing suppliers moves the lines on and puts them on each supplier's quotation request.
    postApiV1RequisitionSource: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error, arg) => error ? [] : [list, { type: "QuotationRequests", id: "all" },
      { type: "Requisition", id: arg.domainEntitiesRequisitionsRequestCreateSourceRequisitionRequest.requisitionId ?? "" }]); },
  },
});
export const { useGetApiV1RequisitionIssueByIssueIdQuery } = warehouseApi;
export const { useGetApiV1RequisitionQuery, useGetApiV1RequisitionByRequisitionIdQuery, usePostApiV1RequisitionMutation, usePostApiV1RequisitionSourceMutation } = requisitionApi;

/**
 * `PUT requisition/{id}/review-correction`: corrects a purchase requisition while it is in review
 * (CanEditRawMaterialPurchaseRequisition / CanEditPackageMaterialPurchaseRequisition, for every kind on it).
 */
export const requisitionCorrectionApi = api.injectEndpoints({ endpoints: (build) => ({
  correctPurchaseRequisition: build.mutation<void, { requisitionId: string; body: { requisitionType: number; comments: string | null; expectedDelivery: string | null;
    items: { materialId: string; quantity: number; uomId: string }[] } }>({
    query: ({ requisitionId, body }) => ({ url: `/api/v1/requisition/${encodeURIComponent(requisitionId)}/review-correction`, method: "PUT", body,
      headers: { Module: "Production", SubModule: "Material Requisitions" } }),
    invalidatesTags: (_result, error, arg) => error ? [] : [list, { type: "Requisition", id: arg.requisitionId },
      { type: "DocumentReview", id: `PurchaseRequisition:${arg.requisitionId}` }],
  }),
}) });
export const { useCorrectPurchaseRequisitionMutation } = requisitionCorrectionApi;
