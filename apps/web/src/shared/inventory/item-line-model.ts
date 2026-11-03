import type { ItemChoice } from "./use-item-choices";

export interface ItemLine { key: string; item: ItemChoice | null; quantity: string }

let counter = 0;
export const newItemLine = (item: ItemChoice | null = null, quantity = ""): ItemLine => ({ key: `line-${String(++counter)}`, item, quantity });

/**
 * Problems with the lines, keyed by line ("" for the list as a whole). Quantities are whole numbers unless `fractions` is
 * set; `capToStock` refuses more than is in stock, as the stock requisition form does.
 */
export function itemLineProblems(lines: readonly ItemLine[], { fractions = false, capToStock = false } = {}): Map<string, string> {
  const problems = new Map<string, string>();
  const seen = new Set<string>();
  for (const line of lines) {
    const quantity = Number(line.quantity);
    if (!line.item) problems.set(line.key, "Choose an item.");
    else if (seen.has(line.item.id)) problems.set(line.key, `${line.item.name} is already on another line.`);
    else if (!line.quantity.trim() || !Number.isFinite(quantity) || quantity <= 0) problems.set(line.key, "Enter a quantity greater than zero.");
    else if (!fractions && !Number.isInteger(quantity)) problems.set(line.key, "Enter a whole number.");
    else if (capToStock && quantity > line.item.available) problems.set(line.key, `Only ${String(line.item.available)} in stock.`);
    if (line.item) seen.add(line.item.id);
  }
  if (lines.length === 0) problems.set("", "Add at least one item.");
  return problems;
}
