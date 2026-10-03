import { utcBoundary } from "@/shared/format/date-boundary";

/** Where a charge stands. A payment is recorded first and counts once it is approved. */
export type ChargeState = "unpaid" | "awaiting" | "paid" | "rejected";
export const chargeStateLabels: Record<ChargeState, string> = { unpaid: "Unpaid", awaiting: "Payment awaiting approval", paid: "Paid", rejected: "Payment rejected" };

/** The server's payment status is 0 pending, 1 approved, 2 rejected, and absent when nothing has been recorded. */
export function chargeState(charge: { paid: boolean; paymentStatus: number | null }): ChargeState {
  if (charge.paid || charge.paymentStatus === 1) return "paid";
  if (charge.paymentStatus === 0) return "awaiting";
  return charge.paymentStatus === 2 ? "rejected" : "unpaid";
}

interface ChargeLike { paid: boolean; paymentStatus: number | null; amount: number; currencyId: string | null }
/** A charge can be paid when nothing is recorded against it, or what was recorded was rejected, and it has a currency and an amount. */
export const isPayable = (charge: ChargeLike) => (chargeState(charge) === "unpaid" || chargeState(charge) === "rejected") && charge.amount > 0 && charge.currencyId !== null;

interface SheetLike { approved: boolean; status: number; charges: readonly ChargeLike[] }
const paidStatus = 2;

/** Why a sheet cannot be changed or added to, or null when it can. The server holds a sheet until it is approved. */
export function changeBlock(sheet: SheetLike): string | null {
  return sheet.approved || sheet.status === paidStatus ? null : "The billing sheet is waiting for approval; it can be changed once it is approved.";
}
/** Why no payment can be recorded, or null when one can. */
export function paymentBlock(sheet: SheetLike): string | null {
  if (!sheet.approved) return "The billing sheet has to be approved before its charges are paid.";
  return sheet.charges.some(isPayable) ? null : "No charge is waiting for a payment.";
}
/** Why a sheet cannot be deleted, or null when it can. A sheet with money recorded against it is kept. */
export function deleteBlock(sheet: SheetLike): string | null {
  return sheet.charges.some((charge) => { const state = chargeState(charge); return state === "paid" || state === "awaiting"; }) ? "Payments are recorded against this billing sheet, so it cannot be deleted." : null;
}

/** What a set of charges adds up to in each currency; charges in different currencies are never added together. */
export function chargeTotals<T extends { amount: number; currency: string | null }>(charges: readonly T[]): { currency: string | null; total: number }[] {
  const totals = new Map<string | null, number>();
  for (const charge of charges) totals.set(charge.currency, (totals.get(charge.currency) ?? 0) + charge.amount);
  return [...totals].map(([currency, total]) => ({ currency, total }));
}

const day = 24 * 60 * 60 * 1000;
const addDays = (date: Date, days: number) => new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
/**
 * The port stores a container free for a number of days from its arrival; demurrage is charged from the
 * day after. Both dates follow from the arrival date and the free days, so they are never typed.
 */
export function freeTime(arrival: Date | null | undefined, days: number | null | undefined): { expiry: Date; demurrageStart: Date } | null {
  if (!arrival || Number.isNaN(arrival.getTime()) || typeof days !== "number" || !Number.isInteger(days) || days < 0) return null;
  return { expiry: addDays(arrival, days), demurrageStart: addDays(arrival, days + 1) };
}
/** The free days in a stored duration such as "14 days". */
export function freeDays(duration: string | null): number | null {
  const match = /^\s*(\d{1,3})\b/.exec(duration ?? "");
  return match ? Number(match[1]) : null;
}
/** The free days two stored dates are apart, for sheets whose duration was typed as free text. */
export function daysBetween(from: string | null, to: string | null): number | null {
  if (!from || !to) return null;
  const span = Math.round((new Date(to).getTime() - new Date(from).getTime()) / day);
  return Number.isFinite(span) && span >= 0 && span <= 999 ? span : null;
}

export interface SheetDetails { code: string; billOfLading: string; arrival: Date; freeDays: number; containerNumber: string; packages: number; packageStyleId: string | null; packageDescription: string }
/** The fields a create and an update share. The server replaces every one of them, so all are always sent. */
export function detailsRequest(details: SheetDetails, invoiceId: string, supplierId: string | null) {
  const time = freeTime(details.arrival, details.freeDays);
  if (!time) throw new Error("The free time could not be worked out");
  return { code: details.code.trim(), billOfLading: details.billOfLading.trim(), supplierId, invoiceId, expectedArrivalDate: utcBoundary(details.arrival), freeTimeExpiryDate: utcBoundary(time.expiry),
    freeTimeDuration: `${details.freeDays} ${details.freeDays === 1 ? "day" : "days"}`, demurrageStartDate: utcBoundary(time.demurrageStart), containerNumber: details.containerNumber.trim(),
    numberOfPackages: String(details.packages), packageDescription: details.packageDescription.trim() || null, containerPackageStyleId: details.packageStyleId };
}

/**
 * The invoice and the charges together. Money in different currencies is never added, so the two are
 * summed only when the charges are all in the invoice's currency; otherwise each stands on its own line.
 */
export function grandTotal(invoiceTotal: number | null, invoiceCurrency: string | null, charges: readonly { amount: number; currency: string | null }[]): { currency: string | null; total: number } | null {
  const totals = chargeTotals(charges);
  if (invoiceTotal === null) return null;
  if (totals.length === 0) return { currency: invoiceCurrency, total: invoiceTotal };
  const only = totals.length === 1 ? totals[0] : undefined;
  return only && only.currency === invoiceCurrency ? { currency: invoiceCurrency, total: invoiceTotal + only.total } : null;
}
/** What is paid and what is still to pay, by currency. A payment waiting for approval is not yet paid. */
export function paidTotals<T extends { amount: number; currency: string | null; paid: boolean; paymentStatus: number | null }>(charges: readonly T[]) {
  return chargeTotals(charges).map((item) => { const paid = charges.filter((charge) => charge.currency === item.currency && chargeState(charge) === "paid").reduce((sum, charge) => sum + charge.amount, 0);
    return { currency: item.currency, total: item.total, paid, outstanding: item.total - paid }; });
}
