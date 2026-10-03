import type { SupplierType } from "@/shared/procurement/supplier-type";

export const viewRequestPermissions: Record<SupplierType, string> = { 0: "CanViewForeignQuotation", 1: "CanViewLocalQuotation" };
/** Emailing the request to the supplier. Seeing the list does not include it. */
export const sendRequestPermissions: Record<SupplierType, string> = { 0: "CanSendForeignQuotationRequest", 1: "CanSendLocalQuotationRequest" };
export const audit = { module: "Procurement", subModule: "Quotations Request" } as const;

/** Why a request cannot be sent, or null when it can. The server refuses the same cases. */
export function sendBlock(request: { email: string | null; itemCount: number }, hasOpenComparison: boolean): string | null {
  if (request.itemCount === 0) return "There are no materials on this request.";
  if (!request.email) return "This supplier has no email address. Add one on the supplier's record, then send the request.";
  if (hasOpenComparison) return "This supplier still has quotes waiting in price comparison. Apply that comparison before asking them for new quotes.";
  return null;
}
