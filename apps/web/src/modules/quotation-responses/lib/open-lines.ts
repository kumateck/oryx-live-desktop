import type { ComparisonGroup } from "@/modules/price-comparison/schemas/comparison-schema";
import type { SupplierQuotation } from "../schemas/quotation-response-schema";

/**
 * The lines of a recorded quotation whose price can still be corrected: those still waiting in price
 * comparison. Once a material is awarded, the price is on a purchase order and correcting the quotation
 * would only make the two disagree.
 *
 * The server does not say which lines are open, so a line counts as open only when price comparison shows
 * this supplier quoting this material at exactly the recorded price and unit, and no other quotation of
 * the supplier in view carries the same material (in which case it cannot be told which one is open).
 */
export function correctableLineIds(quotation: SupplierQuotation, comparison: readonly ComparisonGroup[], inView: readonly SupplierQuotation[]): Set<string> {
  const supplierId = quotation.supplier.id;
  const others = inView.filter((other) => other.id !== quotation.id && other.supplier.id === supplierId);
  return new Set(quotation.items.filter((item) => {
    if (!supplierId || !item.materialId || item.quotedPrice === null) return false;
    if (others.some((other) => other.items.some((line) => line.materialId === item.materialId))) return false;
    return comparison.some((group) => group.materialId === item.materialId && group.unitId === item.unitId
      && group.quotes.some((quote) => quote.supplierId === supplierId && quote.price === item.quotedPrice && (quote.priceUnit ?? "") === (item.priceUnit ?? "")));
  }).map((item) => item.id));
}

/** Whether any correctable line now differs from what is recorded. */
export function hasCorrections(quotation: SupplierQuotation, lines: readonly { id: string; price: number | null; priceUnit: string }[], open: ReadonlySet<string>): boolean {
  return lines.some((line) => { const recorded = quotation.items.find((item) => item.id === line.id);
    return open.has(line.id) && recorded !== undefined && (line.price !== recorded.quotedPrice || line.priceUnit.trim() !== (recorded.priceUnit ?? "")); });
}
