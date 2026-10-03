import { comparablePrice, lineCost } from "@/shared/procurement/price";
import type { ComparisonGroup, ComparisonQuote } from "../schemas/comparison-schema";

/** Which quote is chosen for each material, by the material's id. */
export type Awards = Readonly<Record<string, string>>;

/** Why a quote cannot be awarded, or null when it can. The server refuses the same quotes. */
export function quoteBlock(quote: ComparisonQuote): string | null {
  if (quote.price === null) return "No price recorded";
  if (!quote.priceUnit) return "The price has no unit; record it on the quotation response first";
  if (!quote.sourceRequisitionId) return "The quotation request this belongs to is missing";
  return null;
}

/** What the whole quantity would cost at a quote's price. */
export function quoteCost(group: ComparisonGroup, quote: ComparisonQuote): number | null {
  return lineCost({ quantity: group.quantity, unit: group.unit, price: quote.price, priceUnit: quote.priceUnit });
}

/**
 * The quotes with the lowest price per unit of the material. Prices are only ranked when every quote is in the
 * same currency: comparing figures across currencies would name the wrong supplier.
 */
export function lowestQuotes(group: ComparisonGroup): { keys: ReadonlySet<string>; mixedCurrencies: boolean } {
  const awardable = group.quotes.filter((quote) => quoteBlock(quote) === null);
  const mixedCurrencies = new Set(group.quotes.map((quote) => quote.currency ?? "")).size > 1;
  if (mixedCurrencies || awardable.length < 2) return { keys: new Set(), mixedCurrencies };
  const priced = awardable.flatMap((quote) => { const price = comparablePrice({ unit: group.unit, price: quote.price, priceUnit: quote.priceUnit }); return price === null ? [] : [{ key: quote.key, price }]; });
  const lowest = Math.min(...priced.map((item) => item.price));
  return { keys: new Set(priced.filter((item) => item.price === lowest).map((item) => item.key)), mixedCurrencies };
}

export function chosenQuote(group: ComparisonGroup, awards: Awards): ComparisonQuote | null {
  return group.quotes.find((quote) => quote.key === awards[group.id] && quoteBlock(quote) === null) ?? null;
}

export function undecided(groups: readonly ComparisonGroup[], awards: Awards): ComparisonGroup[] {
  return groups.filter((group) => chosenQuote(group, awards) === null);
}

export interface PurchaseOrderDraft { supplierId: string; supplierName: string; sourceRequisitionId: string; items: { materialId: string; uomId: string; quantity: number; price: number; priceUoM: string; currencyId: string | null }[] }

/**
 * The purchase orders the awards create: one per supplier and quotation request, holding the materials awarded to it.
 * The server reads price and unit from the quotation itself; they are sent so the request says what the user saw.
 */
export function purchaseOrderDrafts(groups: readonly ComparisonGroup[], awards: Awards): PurchaseOrderDraft[] {
  const drafts = new Map<string, PurchaseOrderDraft>();
  for (const group of groups) {
    const quote = chosenQuote(group, awards);
    if (!quote || quote.price === null || !quote.priceUnit || !quote.sourceRequisitionId) continue;
    const draft = drafts.get(quote.key) ?? { supplierId: quote.supplierId, supplierName: quote.supplierName, sourceRequisitionId: quote.sourceRequisitionId, items: [] };
    draft.items.push({ materialId: group.materialId, uomId: group.unitId, quantity: group.quantity, price: quote.price, priceUoM: quote.priceUnit, currencyId: quote.currencyId });
    drafts.set(quote.key, draft);
  }
  return [...drafts.values()];
}
