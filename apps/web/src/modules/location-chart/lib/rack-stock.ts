import { expiryState } from "@/modules/approved-materials/lib/stock";
import type { Rack, ShelfStock } from "../schemas/rack-schema";

/** One batch on one shelf of the open rack. */
export interface RackStockRow extends ShelfStock { shelfId: string | null; shelf: string }

export function rackStockRows(rack: Rack): RackStockRow[] {
  return rack.shelves.flatMap((shelf) => shelf.stock.map((stock) => ({ ...stock, shelfId: shelf.shelfId, shelf: shelf.label })));
}

/** Rows whose shelf, material, code or batch number contains the search term. */
export function filterRackStock(rows: readonly RackStockRow[], search: string): RackStockRow[] {
  const term = search.trim().toLowerCase();
  if (!term) return [...rows];
  return rows.filter((row) => [row.shelf, row.materialName, row.materialCode, row.batchNumber].some((value) => value?.toLowerCase().includes(term)));
}

export interface RackSummaryFigures { shelves: number; emptyShelves: string[]; batches: number; expired: number; expiringSoon: number }

export function rackSummary(rack: Rack, now = new Date()): RackSummaryFigures {
  const rows = rackStockRows(rack);
  const states = rows.map((row) => expiryState(row.expiryDate, now));
  return { shelves: rack.shelves.length, emptyShelves: rack.shelves.filter((shelf) => shelf.stock.length === 0).map((shelf) => shelf.label), batches: rows.length,
    expired: states.filter((state) => state === "overdue").length, expiringSoon: states.filter((state) => state === "soon").length };
}
