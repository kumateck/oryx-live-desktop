import { convertUnit, formatQuantityNumber } from "@/shared/units/quantity";

/**
 * A price is quoted per unit ("12 per kg") while quantities are stored in the material's own unit (often mg).
 * These work out what a line is worth, and refuse to guess when the two units cannot be converted.
 */
export interface PricedLine { quantity: number; unit: string | null; price: number | null | undefined; priceUnit: string | null | undefined }

/** The quantity expressed in the unit the price is quoted in. Null when it cannot be worked out. */
export function quantityInPriceUnit(line: Pick<PricedLine, "quantity" | "unit" | "priceUnit">): number | null {
  if (!line.priceUnit?.trim()) return null;
  return convertUnit(line.quantity, line.unit, line.priceUnit);
}

/** What the whole line costs. Null when there is no price, no price unit, or the units do not convert. */
export function lineCost(line: PricedLine): number | null {
  if (typeof line.price !== "number" || !Number.isFinite(line.price)) return null;
  const quantity = quantityInPriceUnit(line);
  return quantity === null ? null : Number((line.price * quantity).toPrecision(12));
}

/** The price of one of the material's own unit, so quotes given per g and per kg can be ranked together. */
export function comparablePrice(line: Pick<PricedLine, "unit" | "price" | "priceUnit">): number | null {
  return lineCost({ ...line, quantity: 1 });
}

/**
 * A quantity under 1% of one priced unit (5 mg against a price per kg) is almost always a wrong unit, not a real order.
 * The server applies the same threshold.
 */
export const negligibleShare = 0.01;
export function isNegligibleLine(line: Pick<PricedLine, "quantity" | "unit" | "priceUnit">): boolean {
  const quantity = quantityInPriceUnit(line);
  return quantity !== null && quantity > 0 && quantity < negligibleShare;
}

/** Money to two decimals, except amounts too small for that, which are shown in full rather than as 0.00. */
export function formatMoney(amount: number | null | undefined, symbol?: string | null): string {
  if (typeof amount !== "number" || !Number.isFinite(amount)) return "–";
  const number = amount !== 0 && Math.abs(amount) < 0.01
    ? amount.toFixed(10).replace(/0+$/, "").replace(/\.$/, "")
    : new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  return symbol?.trim() ? `${symbol.trim()} ${number}` : number;
}

/** A quoted unit price exactly as the supplier gave it: no rounding. */
export function formatUnitPrice(price: number | null | undefined, symbol: string | null | undefined, priceUnit: string | null | undefined): string {
  if (typeof price !== "number" || !Number.isFinite(price)) return "–";
  const number = formatQuantityNumber(price, "entered");
  return `${symbol?.trim() ? `${symbol.trim()} ` : ""}${number}${priceUnit?.trim() ? ` / ${priceUnit.trim()}` : ""}`;
}
