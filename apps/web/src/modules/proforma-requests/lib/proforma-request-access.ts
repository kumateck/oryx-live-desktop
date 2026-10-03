import type { SupplierType } from "@/shared/procurement/supplier-type";

export const viewProformaRequestPermissions: Record<SupplierType, string> = { 0: "CanViewForeignProformaRequest", 1: "CanViewLocalProformaRequest" };
/** Emailing the supplier to ask for their proforma invoice. */
export const sendProformaRequestPermissions: Record<SupplierType, string> = { 0: "CanSendForeignProformaRequest", 1: "CanSendLocalProformaRequest" };
export const audit = { module: "Procurement", subModule: "Awarded Quotations" } as const;

/** Purchase order states this part of the flow deals with. The numbers are the server's. */
export const purchaseOrderStatus = { new: 0, proformaRequested: 2 } as const;
