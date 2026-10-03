import { toLargestUnit } from "@/shared/units/quantity";
import type { ShipmentInvoiceLine } from "../schemas/invoice-schema";

export const lineAmount = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);

/** What a set of invoice lines is worth. Null when a line cannot be costed, rather than a total that leaves it out. */
export function linesValue(lines: readonly ShipmentInvoiceLine[]): number | null {
  return lines.every((line) => line.cost !== null) ? lines.reduce((sum, line) => sum + (line.cost ?? 0), 0) : null;
}

/**
 * How much the lines come to, one figure per family of units: kilograms are never added to litres or
 * to pieces. Each is written in its largest unit, joined with "+".
 */
export function linesQuantity(lines: readonly ShipmentInvoiceLine[], pick: (line: ShipmentInvoiceLine) => number = (line) => line.quantity): string {
  const byUnit = new Map<string, number>();
  for (const line of lines) byUnit.set(line.unit ?? "", (byUnit.get(line.unit ?? "") ?? 0) + pick(line));
  // Lines kept in mg and in kg land on the same largest unit, so they are merged after conversion.
  const merged = new Map<string, number>();
  for (const [unit, quantity] of byUnit) { const shown = toLargestUnit(quantity, unit || null, "calculated"); const key = shown?.unit ?? unit; merged.set(key, (merged.get(key) ?? 0) + (shown?.value ?? quantity)); }
  const parts = [...merged].map(([unit, quantity]) => `${Number(quantity.toFixed(4))}${unit ? ` ${unit}` : ""}`);
  return parts.join(" + ") || "0";
}

/** The lines of an invoice grouped by the purchase order each came from, in the order they first appear. */
export function linesByOrder(lines: readonly ShipmentInvoiceLine[]): { order: string | null; lines: ShipmentInvoiceLine[] }[] {
  const groups = new Map<string | null, ShipmentInvoiceLine[]>();
  for (const line of lines) groups.set(line.order, [...(groups.get(line.order) ?? []), line]);
  return [...groups].map(([order, group]) => ({ order, lines: group }));
}
