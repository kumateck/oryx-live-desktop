import { api } from "@/shared/api/base-api";
import { productionApi } from "@/shared/api/generated/production";
import { settingsApi } from "@/shared/api/generated/settings";

const list = { type: "ProductionOrders" as const, id: "all" };
const goods = { type: "FinishedGoods" as const, id: "all" };
const changed = (_result: unknown, error: unknown) => error ? [] : [list, goods];

export const dispatchApi = productionApi.enhanceEndpoints({ endpoints: {
  getApiV1ProductionOrdersAllocate: { providesTags: [list] }, getApiV1ProductionOrdersAllocateByAllocateProductionOrderId: { providesTags: [list] },
  getApiV1ProductionOrdersProformaInvoice: { providesTags: [list] }, getApiV1ProductionOrdersProformaInvoiceByProformaInvoiceId: { providesTags: [list] },
  putApiV1ProductionOrdersLoadByAllocateProductionOrderId: { invalidatesTags: changed }, putApiV1ProductionOrdersDeliverByAllocateProductionOrderId: { invalidatesTags: changed },
  postApiV1ProductionOrdersByAllocateProductionOrderIdWaybill: { invalidatesTags: changed }, postApiV1ProductionOrdersProformaInvoice: { invalidatesTags: changed },
} });
export const { useGetApiV1ProductionOrdersAllocateQuery, useGetApiV1ProductionOrdersAllocateByAllocateProductionOrderIdQuery, useLazyGetApiV1ProductionOrdersAllocateByAllocateProductionOrderIdQuery, useGetApiV1ProductionOrdersProformaInvoiceQuery,
  useGetApiV1ProductionOrdersProformaInvoiceByProformaInvoiceIdQuery, usePutApiV1ProductionOrdersLoadByAllocateProductionOrderIdMutation, usePutApiV1ProductionOrdersDeliverByAllocateProductionOrderIdMutation,
  usePostApiV1ProductionOrdersByAllocateProductionOrderIdWaybillMutation, usePostApiV1ProductionOrdersProformaInvoiceMutation } = dispatchApi;
export const { useGetApiV1ConfigurationByModelTypeCountQuery } = settingsApi;

/** Sending the invoice to the customer has no typed response in the server's contract, and attaching files is multipart; both are declared here. */
export const { useSendProformaInvoiceMutation, useAttachPurchaseOrderMutation } = api.injectEndpoints({ endpoints: (build) => ({
  sendProformaInvoice: build.mutation<void, { id: string; module: string; subModule: string }>({ query: ({ id, module, subModule }) => ({ url: `/api/v1/production-orders/proforma-invoice/${id}/customer`, method: "POST", headers: { Module: module, SubModule: subModule } }), invalidatesTags: changed }),
  attachPurchaseOrder: build.mutation<void, { id: string; files: readonly File[]; module: string; subModule: string }>({ query: ({ id, files, module, subModule }) => { const body = new FormData(); for (const file of files) body.append("files", file, file.name);
    return { url: `/api/v1/file/ProformaInvoice/${id}`, method: "POST", body, headers: { Module: module, SubModule: subModule } }; }, invalidatesTags: changed }),
}) });
