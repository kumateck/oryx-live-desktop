import { formatUnitPrice } from "@/shared/procurement/price";
import { toLargestUnit } from "@/shared/units/quantity";
import type { PurchaseOrderRevision } from "@/modules/proforma-requests/schemas/purchase-order-schema";

// The kinds of change a revision can hold, in the server's order.
const kinds = ["Supplier reassigned", "Returned to sourcing", "Line added", "Line changed", "Line removed"] as const;
export const revisionKind = (type: number): string => kinds[type] ?? "Changed";

type Change = PurchaseOrderRevision["changes"][number];
const amount = (quantity: number | null, unit: string | null) => quantity === null ? null : toLargestUnit(quantity, unit, "calculated")?.text ?? String(quantity);

/** One change in words a reader can check: what the line was, and what it became. */
export function describeChange(change: Change, currency: string | null): { before: string; after: string } {
  const side = (quantity: number | null, price: number | null, priceUnit: string | null) =>
    [amount(quantity, change.unit), price === null ? null : `at ${formatUnitPrice(price, currency, priceUnit)}`].filter(Boolean).join(" ") || "–";
  return { before: side(change.quantityBefore, change.priceBefore, change.priceUnitBefore), after: side(change.quantity, change.price, change.priceUnit) };
}
