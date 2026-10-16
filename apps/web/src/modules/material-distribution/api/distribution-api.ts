import { api } from "@/shared/api/base-api";
import { procurementApi } from "@/shared/api/generated/procurement";
import { addTags } from "@/shared/api/add-tags";

const list = { type: "MaterialDistribution" as const, id: "all" };

export const distributionApi = procurementApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProcurementShipmentDocumentArrived: (definition) => { definition.providesTags = addTags(definition.providesTags, [list, { type: "Shipments", id: "all" }]); },
    getApiV1ProcurementShipmentDocumentByShipmentDocumentIdMaterialDistribution: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
  },
});

/** The server's confirm action is not in its published contract, so it is declared here. */
const confirmApi = api.injectEndpoints({
  endpoints: (build) => ({
    confirmMaterialDistribution: build.mutation<void, { shipmentId: string; materialId: string; departmentId: string; module: string; subModule: string }>({
      query: ({ shipmentId, materialId, departmentId, module, subModule }) => ({ url: `/api/v1/procurement/${shipmentId}/confirm-distribution/${materialId}/${departmentId}`, method: "POST", headers: { Module: module, SubModule: subModule } }),
      // Distributed stock lands in the receiving area of the department's store.
      invalidatesTags: (_result, error) => error ? [] : [list, { type: "Shipments", id: "all" }, { type: "Receiving", id: "all" }],
    }),
  }),
});

export const { useGetApiV1ProcurementShipmentDocumentArrivedQuery, useGetApiV1ProcurementShipmentDocumentByShipmentDocumentIdMaterialDistributionQuery } = distributionApi;
export const { useConfirmMaterialDistributionMutation } = confirmApi;
