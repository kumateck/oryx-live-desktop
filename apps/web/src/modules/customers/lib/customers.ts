import { shipperSplit } from "@/shared/packing/packs";
export const customersPath = "/crm/customers";
export const customerPath = (id: string) => `${customersPath}/${id}`;
export const createQuotationPath = (customerId: string) => `${customersPath}/${customerId}/quotations/create`;
export const quotationPath = (id: string) => `/crm/quotations/${id}`;
/** Pricing agreements live in Finance → Costing; this opens them filtered to one customer. */
export const customerPricingPath = (customerId: string) => `/finance/costing/agreements?customer=${encodeURIComponent(customerId)}`;
export const audit = { module: "Customer relationship management", subModule: "Customers" } as const;
export const auditFor = (subModule: string) => ({ module: audit.module, subModule });
export const customerPermissions = { view: "CanViewCustomers", create: "CanCreateCustomer", edit: "CanEditCustomer", remove: "CanDeleteCustomer",
  credit: "ViewCustomerCreditStatus", contracts: "ManageCustomerContracts", pricing: "ManageCosting", quotations: "ViewCustomerQuotations", createQuotation: "CreateCustomerQuotation", convertQuotation: "ConvertCustomerQuotation" } as const;

/** The numbers are the server's. */
export const customerTypeLabels: Record<number, string> = { 0: "Distributor", 1: "Pharmacy", 2: "Hospital", 3: "Retail", 4: "Other" };
export const quotationStatus = { draft: 0, sent: 1, accepted: 2, rejected: 3, expired: 4, converted: 5 } as const;
export const quotationStatusLabels: Record<number, string> = { 0: "Draft", 1: "Sent for approval", 2: "Accepted", 3: "Rejected", 4: "Expired", 5: "Converted to order" };
export const approvalStatusLabels: Record<number, string> = { 0: "Pending", 1: "Approved", 2: "Rejected" };
export const orderStatusLabels: Record<number, string> = { 0: "Pending", 1: "Part packed", 2: "Fully packed" };

/** How an order quantity breaks into full shippers and loose packs. With no shipper size everything is loose. */
export function splitPacking(quantity: number, perShipper: number): { shippers: number; loose: number } {
  return shipperSplit(Math.trunc(Number.isFinite(quantity) ? quantity : 0), Math.trunc(Number.isFinite(perShipper) ? perShipper : 0));
}

/** What one quotation line comes to after its discount. Null until it has a quantity and a price. */
export function lineTotal(quantity: number | null | undefined, unitPrice: number | null | undefined, discountPercent: number | null | undefined): number | null {
  if (typeof quantity !== "number" || typeof unitPrice !== "number" || !Number.isFinite(quantity) || !Number.isFinite(unitPrice)) return null;
  const discount = typeof discountPercent === "number" && Number.isFinite(discountPercent) ? Math.min(100, Math.max(0, discountPercent)) : 0;
  return Number((quantity * unitPrice * (1 - discount / 100)).toFixed(4));
}

interface QuotationLike { status: number; approved: boolean }
/** What can be done with a quotation next, or the reason nothing can. */
export function quotationNextStep(quotation: QuotationLike): { action: "send" | "convert" | null; note: string } {
  switch (quotation.status) {
    case quotationStatus.draft: return { action: "send", note: "This is a draft. Submit it for approval when it is ready." };
    case quotationStatus.sent: return { action: null, note: "Waiting for approval. Approvers find it under pending approvals." };
    case quotationStatus.accepted: return quotation.approved ? { action: "convert", note: "Approved. It can be turned into a production order at these prices and discounts." } : { action: null, note: "Accepted, but its approval is not complete yet." };
    case quotationStatus.rejected: return { action: null, note: "This quotation was rejected." };
    case quotationStatus.expired: return { action: null, note: "This quotation has expired." };
    default: return { action: null, note: "This quotation has been turned into a production order." };
  }
}
