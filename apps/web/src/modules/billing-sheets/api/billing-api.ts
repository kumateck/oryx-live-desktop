import { api } from "@/shared/api/base-api";
import { procurementApi } from "@/shared/api/generated/procurement";
import { addTags } from "@/shared/api/add-tags";

const list = { type: "BillingSheets" as const, id: "all" };
// A sheet, and each payment on it, decides whether its shipment can leave the port.
const changed = (_result: unknown, error: unknown) => error ? [] : [list, { type: "Shipments" as const, id: "all" }];

export const billingApi = procurementApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProcurementBillingSheet: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    getApiV1ProcurementBillingSheetByBillingSheetId: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    getApiV1ProcurementBillingSheetInvoiceByInvoiceId: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    postApiV1ProcurementBillingSheet: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    putApiV1ProcurementBillingSheetByBillingSheetId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    deleteApiV1ProcurementBillingSheetByBillingSheetId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    putApiV1ProcurementBillingSheetCharge: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
    postApiV1ProcurementBillingSheetChargeByBillingSheetId: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, changed); },
  },
});

/** Attaching files is a multipart request; the generated endpoint would send its body as JSON, so it is declared here. */
const fileApi = api.injectEndpoints({
  endpoints: (build) => ({
    uploadBillingSheetFiles: build.mutation<void, { billingSheetId: string; files: readonly File[]; module: string; subModule: string }>({
      query: ({ billingSheetId, files, module, subModule }) => {
        const body = new FormData();
        for (const file of files) body.append("files", file, file.name);
        return { url: `/api/v1/file/BillingSheet/${billingSheetId}`, method: "POST", body, headers: { Module: module, SubModule: subModule } };
      },
      invalidatesTags: (_result, error) => error ? [] : [list],
    }),
  }),
});

export const { useLazyGetApiV1ProcurementBillingSheetQuery, useGetApiV1ProcurementBillingSheetQuery, useGetApiV1ProcurementBillingSheetByBillingSheetIdQuery, useGetApiV1ProcurementBillingSheetInvoiceByInvoiceIdQuery, usePostApiV1ProcurementBillingSheetMutation, usePutApiV1ProcurementBillingSheetByBillingSheetIdMutation,
  useDeleteApiV1ProcurementBillingSheetByBillingSheetIdMutation, usePutApiV1ProcurementBillingSheetChargeMutation, usePostApiV1ProcurementBillingSheetChargeByBillingSheetIdMutation } = billingApi;
export const { useUploadBillingSheetFilesMutation } = fileApi;
