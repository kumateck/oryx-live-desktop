import { api } from "@/shared/api/base-api";
import { procurementApi } from "@/shared/api/generated/procurement";
import { addTags } from "@/shared/api/add-tags";

const list = { type: "Shipments" as const, id: "all" };
// A delivery takes its invoice out of those waiting, and its arrival feeds material distribution.
const changed = (_result: unknown, error: unknown) => error ? [] : [list, { type: "ShipmentInvoices" as const, id: "all" }, { type: "MaterialDistribution" as const, id: "all" }];

export const shipmentApi = procurementApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProcurementShipmentDocument: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    getApiV1ProcurementShipmentDocumentByShipmentDocumentId: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    getApiV1ProcurementWaybill: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    getApiV1ProcurementWaybillByWaybillId: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    postApiV1ProcurementShipmentDocument: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    postApiV1ProcurementWaybill: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    putApiV1ProcurementShipmentsByShipmentIdStatus: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
  },
});

/** Attaching files is a multipart request; the generated endpoint would send its body as JSON, so it is declared here. */
const fileApi = api.injectEndpoints({
  endpoints: (build) => ({
    uploadShipmentFiles: build.mutation<void, { shipmentId: string; files: readonly File[]; module: string; subModule: string }>({
      query: ({ shipmentId, files, module, subModule }) => {
        const body = new FormData();
        for (const file of files) body.append("files", file, file.name);
        return { url: `/api/v1/file/ShipmentDocument/${shipmentId}`, method: "POST", body, headers: { Module: module, SubModule: subModule } };
      },
      invalidatesTags: (_result, error) => error ? [] : [list],
    }),
  }),
});

export const { useGetApiV1ProcurementShipmentDocumentQuery, useGetApiV1ProcurementShipmentDocumentByShipmentDocumentIdQuery, useGetApiV1ProcurementWaybillQuery, useGetApiV1ProcurementWaybillByWaybillIdQuery,
  usePostApiV1ProcurementShipmentDocumentMutation, usePostApiV1ProcurementWaybillMutation, usePutApiV1ProcurementShipmentsByShipmentIdStatusMutation } = shipmentApi;
export const { useUploadShipmentFilesMutation } = fileApi;
