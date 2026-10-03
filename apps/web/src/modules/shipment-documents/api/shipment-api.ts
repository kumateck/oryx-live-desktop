import { api } from "@/shared/api/base-api";
import { procurementApi } from "@/shared/api/generated/procurement";

const list = { type: "Shipments" as const, id: "all" };
// A delivery takes its invoice out of those waiting, and its arrival feeds material distribution.
const changed = (_result: unknown, error: unknown) => error ? [] : [list, { type: "ShipmentInvoices" as const, id: "all" }, { type: "MaterialDistribution" as const, id: "all" }];

export const shipmentApi = procurementApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProcurementShipmentDocument: { providesTags: [list] },
    getApiV1ProcurementShipmentDocumentByShipmentDocumentId: { providesTags: [list] },
    getApiV1ProcurementWaybill: { providesTags: [list] },
    getApiV1ProcurementWaybillByWaybillId: { providesTags: [list] },
    postApiV1ProcurementShipmentDocument: { invalidatesTags: changed },
    postApiV1ProcurementWaybill: { invalidatesTags: changed },
    putApiV1ProcurementShipmentsByShipmentIdStatus: { invalidatesTags: changed },
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
