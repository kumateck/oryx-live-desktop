import { procurementApi } from "@/shared/api/generated/procurement";

const list = { type: "ShipmentInvoices" as const, id: "all" };

export const invoiceApi = procurementApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProcurementShipmentInvoice: { providesTags: [list] },
    getApiV1ProcurementShipmentInvoiceById: { providesTags: [list] },
    getApiV1ProcurementShipmentInvoiceUnattached: { providesTags: [list] },
    getApiV1ProcurementPurchaseOrderNotLinked: { providesTags: [list] },
    getApiV1ProcurementPurchaseOrderSupplierBySupplierIdNotLinked: { providesTags: [list] },
    // Invoicing moves the orders on to partly or fully invoiced.
    postApiV1ProcurementShipmentInvoice: { invalidatesTags: (_result, error) => error ? [] : [list, { type: "PurchaseOrderList", id: "all" }] },
  },
});
export const { useGetApiV1ProcurementShipmentInvoiceQuery, useGetApiV1ProcurementShipmentInvoiceByIdQuery, useGetApiV1ProcurementShipmentInvoiceUnattachedQuery,
  useGetApiV1ProcurementPurchaseOrderNotLinkedQuery, useGetApiV1ProcurementPurchaseOrderSupplierBySupplierIdNotLinkedQuery, usePostApiV1ProcurementShipmentInvoiceMutation } = invoiceApi;
