import { api } from "@/shared/api/base-api";
import { procurementApi } from "@/shared/api/generated/procurement";

const list = { type: "BillingSheets" as const, id: "all" };
// A sheet, and each payment on it, decides whether its shipment can leave the port.
const changed = (_result: unknown, error: unknown) => error ? [] : [list, { type: "Shipments" as const, id: "all" }];

export const billingApi = procurementApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProcurementBillingSheet: { providesTags: [list] },
    getApiV1ProcurementBillingSheetByBillingSheetId: { providesTags: [list] },
    getApiV1ProcurementBillingSheetInvoiceByInvoiceId: { providesTags: [list] },
    postApiV1ProcurementBillingSheet: { invalidatesTags: changed },
    putApiV1ProcurementBillingSheetByBillingSheetId: { invalidatesTags: changed },
    deleteApiV1ProcurementBillingSheetByBillingSheetId: { invalidatesTags: changed },
    putApiV1ProcurementBillingSheetCharge: { invalidatesTags: changed },
    postApiV1ProcurementBillingSheetChargeByBillingSheetId: { invalidatesTags: changed },
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

export const { useGetApiV1ProcurementBillingSheetQuery, useGetApiV1ProcurementBillingSheetByBillingSheetIdQuery, useGetApiV1ProcurementBillingSheetInvoiceByInvoiceIdQuery, usePostApiV1ProcurementBillingSheetMutation, usePutApiV1ProcurementBillingSheetByBillingSheetIdMutation,
  useDeleteApiV1ProcurementBillingSheetByBillingSheetIdMutation, usePutApiV1ProcurementBillingSheetChargeMutation, usePostApiV1ProcurementBillingSheetChargeByBillingSheetIdMutation } = billingApi;
export const { useUploadBillingSheetFilesMutation } = fileApi;
