export type StockLevel = "critical" | "low" | "optimal" | "unset";
export const stockLevelLabels: Record<StockLevel, string> = { critical: "Critical", low: "Low stock", optimal: "Optimal", unset: "Levels not set" };

/**
 * Where a material's warehouse stock stands against its levels: at or under the minimum is critical,
 * at or under the reorder level is low. A material with neither level set cannot be judged.
 */
export function stockLevel(row: { stock: number; minimum: number; reorder: number }): StockLevel {
  if (row.minimum <= 0 && row.reorder <= 0) return "unset";
  if (row.stock <= row.minimum) return "critical";
  if (row.stock <= row.reorder) return "low";
  return "optimal";
}

export interface ShelfFigures { total: number; shelves: number; batches: number; earliestExpiry: string | null }

/** Totals over a material's shelf records. */
export function shelfFigures(rows: readonly { quantity: number; shelfId: string | null; batchNumber: string | null; expiryDate: string | null }[]): ShelfFigures {
  const expiries = rows.flatMap((row) => row.expiryDate ? [row.expiryDate] : []).sort((a, b) => new Date(a).getTime() - new Date(b).getTime());
  return { total: rows.reduce((sum, row) => sum + row.quantity, 0), shelves: new Set(rows.map((row) => row.shelfId)).size,
    batches: new Set(rows.map((row) => row.batchNumber)).size, earliestExpiry: expiries[0] ?? null };
}
