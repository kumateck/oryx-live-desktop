import { quoteBlock } from "@/modules/price-comparison/lib/comparison";
import type { ComparisonGroup, ComparisonQuote } from "@/modules/price-comparison/schemas/comparison-schema";
import type { PurchaseOrder, PurchaseOrderLine } from "@/modules/proforma-requests/schemas/purchase-order-schema";

// The server's numbers for taking a line off an order to place it elsewhere.
export const reassignSupplier = 0;
export const returnToSourcing = 1;

/** The other suppliers' quotes a line can be moved to: every quote for the material but the order's own supplier's, that can be awarded. */
export function reassignCandidates(groups: readonly ComparisonGroup[], line: PurchaseOrderLine, order: PurchaseOrder): ComparisonQuote[] {
  return groups.filter((group) => group.materialId === line.materialId).flatMap((group) => group.quotes).filter((quote) => quote.supplierId !== order.supplier.id && quoteBlock(quote) === null);
}

/**
 * Why a line cannot be moved to another supplier, or null when it can. Awarding the new supplier closes
 * every other open quote of this supplier type, so an open price comparison has to be applied first.
 */
export function reassignBlock(line: PurchaseOrderLine, openComparison: readonly ComparisonGroup[], candidates: readonly ComparisonQuote[]): string | null {
  if (!line.materialId || !line.unitId) return "This line is missing its material or unit record.";
  if (openComparison.length > 0) return "A price comparison is open for this supplier type. Apply it first: moving this line would close the quotes waiting in it.";
  if (candidates.length === 0) return "No other supplier quoted for this material on the same request.";
  return null;
}

/** Step one: take the line off the order. The server reopens the other suppliers' quotes for it. */
export function takeLineOff(kind: typeof reassignSupplier | typeof returnToSourcing, line: PurchaseOrderLine) {
  return [{ type: kind, purchaseOrderItemId: line.id }];
}

/** Step two of a reassignment: award the line to the chosen quote, which creates that supplier's order. */
export function awardLine(line: PurchaseOrderLine, quote: ComparisonQuote) {
  return [{ supplierId: quote.supplierId, sourceRequisitionId: quote.sourceRequisitionId ?? "", items: [{ materialId: line.materialId ?? "", uomId: line.unitId ?? "", quantity: line.quantity,
    price: quote.price ?? 0, priceUoM: quote.priceUnit ?? "", currencyId: quote.currencyId }] }];
}
