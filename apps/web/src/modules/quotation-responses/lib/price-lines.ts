import { formatMoney, formatUnitPrice, isNegligibleLine, lineCost } from "@/shared/procurement/price";
import { relatedUnits, toLargestUnit } from "@/shared/units/quantity";
import type { PricingAgreement } from "@/modules/suppliers/relationship/types";
import type { SupplierQuotation } from "../schemas/quotation-response-schema";
import { activeAgreement } from "./agreements";

/** One quoted material while its price is being typed in. */
export interface PriceLine {
  id: string; materialId: string | null; materialName: string; manufacturer: string | null; quantity: number; unit: string | null; unitId: string | null;
  price: number | null; priceUnit: string; agreementId: string | null;
}

/**
 * The lines of a quotation ready for price entry. A price already recorded is kept; otherwise the supplier's
 * standing agreement for the material, if one is in force, is offered as the starting point.
 */
export function startPriceLines(quotation: SupplierQuotation, agreements: readonly PricingAgreement[], now = new Date()): PriceLine[] {
  return quotation.items.map((item) => {
    const agreement = item.materialId && item.unitId ? activeAgreement(agreements, item.materialId, item.unitId, now) : null;
    const units = relatedUnits(item.unit);
    return { id: item.id, materialId: item.materialId, materialName: item.materialName, manufacturer: item.manufacturer, quantity: item.quantity, unit: item.unit, unitId: item.unitId,
      price: item.quotedPrice ?? agreement?.agreedPrice ?? null,
      priceUnit: item.priceUnit ?? agreement?.priceUoM ?? (units.length === 1 ? units[0] ?? "" : ""), agreementId: agreement?.id ?? null };
  });
}

export interface PriceLineProblem { id: string; field: "price" | "priceUnit"; message: string }

/** A price of zero is not a quote, and a price with no unit cannot be read later; the server refuses both. */
export function priceLineProblems(lines: readonly PriceLine[]): PriceLineProblem[] {
  return lines.flatMap((line): PriceLineProblem[] => {
    if (line.price === null || !Number.isFinite(line.price) || line.price <= 0) return [{ id: line.id, field: "price", message: `Enter the price quoted for ${line.materialName}` }];
    if (!line.priceUnit.trim()) return [{ id: line.id, field: "priceUnit", message: `Choose the unit ${line.materialName} is priced per` }];
    return [];
  });
}

export interface NegligibleLine { id: string; materialName: string; text: string }

/** Lines whose quantity is a tiny fraction of the priced unit, so the line is worth almost nothing: usually a wrong unit. */
export function negligibleLines(lines: readonly PriceLine[], currency: string | null): NegligibleLine[] {
  return lines.filter((line) => isNegligibleLine(line)).map((line) => ({ id: line.id, materialName: line.materialName,
    text: `${toLargestUnit(line.quantity, line.unit, "calculated")?.text ?? line.quantity} at ${formatUnitPrice(line.price, currency, line.priceUnit)} comes to ${formatMoney(lineCost(line), currency)}` }));
}

export function toQuotationResponse(lines: readonly PriceLine[]): { id: string; price: number; priceUoM: string }[] {
  return lines.flatMap((line) => line.price !== null ? [{ id: line.id, price: line.price, priceUoM: line.priceUnit.trim() }] : []);
}
