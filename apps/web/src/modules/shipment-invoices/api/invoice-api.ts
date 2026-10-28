import { procurementApi } from "@/shared/api/generated/procurement";
import { addTags } from "@/shared/api/add-tags";

const list = { type: "ShipmentInvoices" as const, id: "all" };

export const invoiceApi = procurementApi.enhanceEndpoints({
  endpoints: {
    getApiV1ProcurementShipmentInvoice: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    getApiV1ProcurementShipmentInvoiceById: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    getApiV1ProcurementShipmentInvoiceUnattached: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    getApiV1ProcurementPurchaseOrderNotLinked: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    getApiV1ProcurementPurchaseOrderSupplierBySupplierIdNotLinked: (definition) => { definition.providesTags = addTags(definition.providesTags, [list]); },
    // Invoicing moves the orders on to partly or fully invoiced.
    postApiV1ProcurementShipmentInvoice: (definition) => { definition.invalidatesTags = addTags(definition.invalidatesTags, (_result, error) => error ? [] : [list, { type: "PurchaseOrderList", id: "all" }]); },
  },
});
export const { useGetApiV1ProcurementShipmentInvoiceQuery, useGetApiV1ProcurementShipmentInvoiceByIdQuery, useGetApiV1ProcurementShipmentInvoiceUnattachedQuery,
  useGetApiV1ProcurementPurchaseOrderNotLinkedQuery, useGetApiV1ProcurementPurchaseOrderSupplierBySupplierIdNotLinkedQuery, usePostApiV1ProcurementShipmentInvoiceMutation } = invoiceApi;
