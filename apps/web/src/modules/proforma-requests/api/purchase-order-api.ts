import { api } from "@/shared/api/base-api";
import { procurementApi } from "@/shared/api/generated/procurement";

const list = { type: "PurchaseOrderList" as const, id: "all" };

export const purchaseOrderApi = procurementApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProcurementPurchaseOrder: { providesTags: [list] },
    postApiV1ProcurementPurchaseOrderProformaInvoiceByPurchaseOrderId: { invalidatesTags: (_result, error) => error ? [] : [list] },
    putApiV1ProcurementPurchaseOrderFirstStepByPurchaseOrderId: { invalidatesTags: (_result, error) => error ? [] : [list] },
  },
});

/** Attaching files is a multipart request; the generated endpoint would send its body as JSON, so it is declared here. */
const fileApi = api.injectEndpoints({
  endpoints: (build) => ({
    uploadPurchaseOrderFiles: build.mutation<void, { purchaseOrderId: string; files: readonly File[]; module: string; subModule: string }>({
      query: ({ purchaseOrderId, files, module, subModule }) => {
        const body = new FormData();
        for (const file of files) body.append("files", file, file.name);
        return { url: `/api/v1/file/PurchaseOrder/${purchaseOrderId}`, method: "POST", body, headers: { Module: module, SubModule: subModule } };
      },
      // The first file attached moves the order on to the next stage.
      invalidatesTags: (_result, error) => error ? [] : [list],
    }),
  }),
});

export const { useGetApiV1ProcurementPurchaseOrderQuery, usePostApiV1ProcurementPurchaseOrderProformaInvoiceByPurchaseOrderIdMutation,
  usePutApiV1ProcurementPurchaseOrderFirstStepByPurchaseOrderIdMutation } = purchaseOrderApi;
export const { useUploadPurchaseOrderFilesMutation } = fileApi;
