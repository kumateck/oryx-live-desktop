import { amountInWords } from "@/shared/format/amount-words";
import type { SupplierType } from "@/shared/procurement/supplier-type";

/**
 * What is added to the value of the lines to reach the order's total: insurance and freight on a foreign
 * order (giving its CIF value), tax on a local one. The server keeps tax in its freight field.
 */
export interface OrderCharges { insurance: number | null; freight: number | null; tax: number | null }

const round = (value: number) => Number(value.toFixed(2));

export function grandTotal(type: SupplierType, value: number, charges: OrderCharges): number {
  return round(type === 1 ? value + (charges.tax ?? 0) : value + (charges.insurance ?? 0) + (charges.freight ?? 0));
}

export const totalLabels: Record<SupplierType, { value: string; grand: string }> = { 0: { value: "Total FOB value", grand: "Total CIF value" }, 1: { value: "Total order value", grand: "Grand total" } };

/** The request that finalises an order. Its total and the words for it are worked out here, never typed. */
export function finaliseRequest(type: SupplierType, value: number, charges: OrderCharges, currencyName: string | null) {
  const total = grandTotal(type, value, charges);
  return { totalFobValue: round(value), totalCifValue: total, seaFreight: type === 1 ? charges.tax ?? 0 : charges.freight ?? 0, insurance: type === 1 ? 0 : charges.insurance ?? 0,
    amountInFigures: amountInWords(total, currencyName) ?? "" };
}
