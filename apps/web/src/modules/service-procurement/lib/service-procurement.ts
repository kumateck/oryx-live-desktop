import { z } from "zod";

export const servicePaths = {
  responses: "/extrals/service-quotation-response", comparison: "/extrals/service-price-comparison",
  proformas: "/extrals/service-proforma-request", memos: "/extrals/service-memo",
} as const;
export const serviceAudit = { module: "Services", subModule: "Service Procurement" } as const;
export const serviceKeys = {
  responsesView: "CanViewServicesQuotationResponses", responseSend: "CanSendServicesQuotationResponse",
  pricingView: "CanViewServicesPricingSelection", pricingApply: "CanApplyChangesForServicesPricingSelection",
  proformaRequestsView: "CanViewServicesProformaRequests", proformaRequestSend: "CanSendServicesProformaRequest",
  proformaResponsesView: "CanViewServicesProformaResponses", proformaResponseSend: "CanSendServicesProformaResponse",
  ordersView: "CanViewServicesPurchaseOrders", orderCreate: "CanCreateServicesPurchaseOrder",
  memoView: "CanViewServicesMemo", memoCreate: "CanCreateServicesMemo",
} as const;

const text = z.string().nullish().transform((v) => v?.trim() || null);
const n = z.number().nullish().transform((v) => v ?? 0);
export const quotationSchema = z.object({
  id: z.string(), quotationNumber: text, jobOrderId: z.string().catch(""), jobOrderStatus: z.number().nullish(), submittedDate: text, estimatedDays: n, estimatedCompletionDate: text, notes: text,
  isSelected: z.boolean().catch(false), status: z.number().catch(0), negotiatedServiceCharge: z.number().nullish(), negotiationNotes: text,
  totalServiceCharge: n, totalItemCost: n, grandTotal: n, serviceCharge: n,
  serviceProvider: z.object({ id: z.string().nullish(), name: text }).nullish(), service: z.object({ name: text }).nullish(), currency: z.object({ symbol: text, name: text }).nullish(),
  serviceCharges: z.array(z.object({ name: text, cost: n })).nullish().transform((v) => v ?? []),
  items: z.array(z.object({ id: z.string(), quantity: n, unitPrice: n, totalPrice: n, negotiatedUnitPrice: z.number().nullish(), item: z.object({ name: text, code: text }).nullish(), unitOfMeasure: z.object({ symbol: text, name: text }).nullish() })).nullish().transform((v) => v ?? []),
}).transform((q) => ({
  id: q.id, number: q.quotationNumber, jobOrderId: q.jobOrderId, jobOrderStatus: q.jobOrderStatus ?? null, submitted: q.submittedDate, days: q.estimatedDays, completion: q.estimatedCompletionDate, notes: q.notes,
  selected: q.isSelected, status: q.status, negotiatedCharge: q.negotiatedServiceCharge ?? null, negotiationNotes: q.negotiationNotes,
  charge: q.totalServiceCharge || q.serviceCharge, materials: q.totalItemCost, total: q.grandTotal || (q.totalServiceCharge || q.serviceCharge) + q.totalItemCost,
  providerId: q.serviceProvider?.id ?? "", provider: q.serviceProvider?.name ?? "Unnamed provider", service: q.service?.name ?? null, currency: q.currency?.symbol || q.currency?.name || "",
  charges: q.serviceCharges.map((c) => ({ name: c.name ?? "Charge", cost: c.cost })),
  items: q.items.map((i) => ({ id: i.id, name: i.item?.name ?? "Unnamed item", code: i.item?.code ?? "–", quantity: i.quantity, unitPrice: i.unitPrice, total: i.totalPrice || i.quantity * i.unitPrice,
    negotiated: i.negotiatedUnitPrice ?? null, unit: i.unitOfMeasure?.symbol || i.unitOfMeasure?.name || "" })),
}));
export type Quotation = z.infer<typeof quotationSchema>;
export const quotationPageSchema = z.object({ data: z.array(quotationSchema).nullish().transform((d) => d ?? []), pageIndex: z.number().optional(), pageCount: z.number().optional(), totalRecordCount: z.number().optional() });
export const quotationStatusLabel = (s: number) => ["Submitted", "Under review", "Negotiating", "Selected", "Rejected"][s] ?? `Unknown (${String(s)})`;

export const proformaSchema = z.object({
  id: z.string(), invoiceNumber: text, requestedDate: text, responseReceivedDate: text, notes: text, responseNotes: text, status: z.number().catch(0), serviceCharge: n, totalCost: n,
  jobOrder: z.object({ id: z.string().nullish(), code: text, name: text }).nullish(), currency: z.object({ symbol: text }).nullish(),
  serviceQuotation: z.object({ id: z.string().nullish(), quotationNumber: text, serviceProvider: z.object({ id: z.string().nullish(), name: text }).nullish() }).nullish(),
  items: z.array(z.object({ id: z.string(), quantity: n, unitPrice: n, totalPrice: n, item: z.object({ name: text }).nullish(), unitOfMeasure: z.object({ symbol: text }).nullish() })).nullish().transform((v) => v ?? []),
}).transform((p) => ({
  id: p.id, invoice: p.invoiceNumber, requested: p.requestedDate, responded: p.responseReceivedDate, notes: p.notes, responseNotes: p.responseNotes, status: p.status, charge: p.serviceCharge, total: p.totalCost,
  jobOrderId: p.jobOrder?.id ?? "", jobOrder: p.jobOrder?.code ?? p.jobOrder?.name ?? "Job order", currency: p.currency?.symbol ?? "",
  quotationId: p.serviceQuotation?.id ?? "", quotation: p.serviceQuotation?.quotationNumber ?? null, providerId: p.serviceQuotation?.serviceProvider?.id ?? "", provider: p.serviceQuotation?.serviceProvider?.name ?? "Unnamed provider",
  items: p.items.map((i) => ({ id: i.id, name: i.item?.name ?? "Unnamed item", quantity: i.quantity, unitPrice: i.unitPrice, unit: i.unitOfMeasure?.symbol ?? "" })),
}));
export type Proforma = z.infer<typeof proformaSchema>;
export const proformaPageSchema = z.object({ data: z.array(proformaSchema).nullish().transform((d) => d ?? []), pageIndex: z.number().optional(), pageCount: z.number().optional(), totalRecordCount: z.number().optional() });
export const ProformaStatus = { Requested: 0, Received: 1, Approved: 2, Rejected: 3 } as const;
export const proformaStatusLabel = (s: number) => ["Requested", "Response received", "Approved", "Rejected"][s] ?? `Unknown (${String(s)})`;

const person = z.object({ firstName: text, lastName: text, email: text }).nullish().transform((p) => p ? [p.firstName, p.lastName].filter(Boolean).join(" ") || p.email || null : null);
export const memoSchema = z.object({
  id: z.string(), memoNumber: text, createdAt: text, issuedDate: text, agreedServiceCharge: n, agreedMaterialsCost: n, totalAgreedCost: n, expectedStartDate: text, expectedCompletionDate: text,
  termsAndConditions: text, specialInstructions: text, status: z.number().catch(0), paid: z.boolean().catch(false), issuedBy: person,
  jobOrder: z.object({ id: z.string().nullish(), code: text }).nullish(), serviceProvider: z.object({ name: text }).nullish(), serviceQuotation: z.object({ currency: z.object({ symbol: text }).nullish(), quotationNumber: text }).nullish(),
}).transform((m) => ({
  id: m.id, number: m.memoNumber ?? "Memo", created: m.createdAt, issued: m.issuedDate, charge: m.agreedServiceCharge, materials: m.agreedMaterialsCost, total: m.totalAgreedCost || m.agreedServiceCharge + m.agreedMaterialsCost,
  start: m.expectedStartDate, completion: m.expectedCompletionDate, terms: m.termsAndConditions, instructions: m.specialInstructions, status: m.status, paid: m.paid, issuedBy: m.issuedBy,
  jobOrderId: m.jobOrder?.id ?? "", jobOrder: m.jobOrder?.code ?? "Job order", provider: m.serviceProvider?.name ?? "–", currency: m.serviceQuotation?.currency?.symbol ?? "", quotation: m.serviceQuotation?.quotationNumber ?? null,
}));
export type ServiceMemo = z.infer<typeof memoSchema>;
export const memoPageSchema = z.object({ data: z.array(memoSchema).nullish().transform((d) => d ?? []), pageIndex: z.number().optional(), pageCount: z.number().optional(), totalRecordCount: z.number().optional() });
export const MemoStatus = { Draft: 0, PendingApproval: 1, Approved: 2, Rejected: 3, Issued: 4, Completed: 5, Cancelled: 6 } as const;
export const memoStatusLabel = (s: number) => ["Draft", "Pending approval", "Approved", "Rejected", "Issued", "Completed", "Cancelled"][s] ?? `Unknown (${String(s)})`;

export const amount = (value: number, currency = "") => `${currency ? `${currency} ` : ""}${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const isoDay = (value: string) => value ? new Date(`${value}T00:00:00Z`).toISOString() : "";
