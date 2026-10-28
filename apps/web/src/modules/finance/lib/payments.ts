import type { Payment } from "../api/finance-api";
export enum PaymentMethod { BankTransfer = 0, Cheque = 1, Cash = 2, CreditCard = 3, Other = 4 }
export enum PayableType { BillingSheet = 0, ShipmentInvoice = 1, PurchaseOrderInvoice = 2, CustomerInvoice = 3 }
export enum PaymentStatus { Pending = 0, Approved = 1, Rejected = 2 }
export const methods = ["Bank transfer", "Cheque", "Cash", "Credit card", "Other"] as const;
export const payableTypes = ["Billing sheet", "Shipment invoice", "Purchase order invoice", "Customer invoice"] as const;
export const statuses = ["Pending", "Approved", "Rejected"] as const;
export const labelFor = (labels: readonly string[], value: number | null | undefined) => value == null ? "Not recorded" : labels[value] ?? `Unknown (${value})`;
export const calendarDay = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
export const dayStartUtc = (date: Date) => `${calendarDay(date)}T00:00:00.000Z`;
export const dayEndUtc = (date: Date) => `${calendarDay(date)}T23:59:59.999Z`;
export function paymentReviewProblem(payment: Payment, userId: string | null): string | null {
  if (!payment.id || payment.status !== PaymentStatus.Pending) return "This payment is no longer pending review.";
  if (!userId || !payment.recordedBy?.id) return "The recorder could not be verified. Refresh the payment.";
  if (payment.recordedBy.id === userId) return "You cannot review a payment or receipt you recorded.";
  if (!payment.currency?.id || !payment.payableId || !payment.amount || payment.amount <= 0 || !payment.paymentDate || !Number.isFinite(Date.parse(payment.paymentDate))) return "The payment evidence is incomplete. Refresh before reviewing.";
  if (!payment.approvals?.some((stage) => stage.status === PaymentStatus.Pending)) return "There is no pending approval stage.";
  return null;
}
export const samePaymentEvidence = (before: Payment, after: Payment) => before.id === after.id && before.amount === after.amount && before.currency?.id === after.currency?.id && before.paymentDate === after.paymentDate && before.reference === after.reference && before.payableType === after.payableType && before.payableId === after.payableId && before.notes === after.notes && before.method === after.method && JSON.stringify(before.approvals) === JSON.stringify(after.approvals);
