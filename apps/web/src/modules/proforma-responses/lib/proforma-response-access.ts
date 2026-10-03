import type { SupplierType } from "@/shared/procurement/supplier-type";

export const viewProformaResponsePermissions: Record<SupplierType, string> = { 0: "CanViewForeignProformaInvoiceSubmissions", 1: "CanViewLocalProformaInvoiceSubmissions" };
/** Recording the proforma invoice the supplier sent back. */
export const recordProformaPermissions: Record<SupplierType, string> = { 0: "CanSendForeignProformaInvoice", 1: "CanSendLocalProformaInvoice" };
export const audit = { module: "Procurement", subModule: "Proforma Responses" } as const;

/** What a proforma invoice may be attached as. */
export const proformaFileTypes = ".pdf,.png,.jpg,.jpeg,.webp,.doc,.docx,.xlsx";
export const proformaFileLimit = 10 * 1024 * 1024;
