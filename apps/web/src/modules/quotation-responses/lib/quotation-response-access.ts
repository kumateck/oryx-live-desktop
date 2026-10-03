import type { SupplierType } from "@/shared/procurement/supplier-type";

export const viewResponsePermissions: Record<SupplierType, string> = { 0: "CanViewForeignQuotationResponse", 1: "CanViewLocalQuotationResponse" };
/** Recording the prices a supplier quoted. */
export const recordResponsePermissions: Record<SupplierType, string> = { 0: "CanSendForeignQuotationResponse", 1: "CanSendLocalQuotationResponse" };
/** Proposing a change to a supplier's standing price agreement. */
export const manageAgreementsPermission = "CanManageSupplierContracts";
export const audit = { module: "Procurement", subModule: "Quotations Responses" } as const;
