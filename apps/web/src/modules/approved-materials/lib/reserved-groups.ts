import { smallestUnit, toSmallestUnit } from "@/shared/units/quantity";
import type { ReservedRow } from "../schemas/approved-material-schema";

export interface ReservedTotal { key: string; quantity: number; unit: string | null }
export interface ReservedBatchGroup { id: string; batch: string | null; schedule: string | null; rows: ReservedRow[]; totals: ReservedTotal[] }
export interface ReservedProductGroup { id: string; productName: string | null; productCode: string | null; batches: ReservedBatchGroup[]; totals: ReservedTotal[] }

/** Sum compatible units in their base unit; never combine quantities with an unknown unit. */
export function reservedTotals(rows: readonly ReservedRow[]): ReservedTotal[] {
  const totals = new Map<string, ReservedTotal>();
  for (const row of rows) {
    const unit = smallestUnit(row.unit) || null;
    const key = unit?.toLowerCase() ?? `unknown:${row.id}`;
    const quantity = unit ? toSmallestUnit(row.reserved, row.unit) : row.reserved;
    const total = totals.get(key);
    if (total) total.quantity += quantity;
    else totals.set(key, { key, quantity, unit });
  }
  return [...totals.values()];
}

/** Group the complete response before the table pages products. Split material lots stay visible. */
export function groupReservedProducts(rows: readonly ReservedRow[]): ReservedProductGroup[] {
  const products = new Map<string, { group: ReservedProductGroup; rows: ReservedRow[]; batches: Map<string, ReservedBatchGroup> }>();
  for (const row of rows) {
    const id = row.productCode || row.productName ? JSON.stringify([row.productCode, row.productName]) : `unrecorded:${row.id}`;
    let product = products.get(id);
    if (!product) {
      product = { group: { id, productName: row.productName, productCode: row.productCode, batches: [], totals: [] }, rows: [], batches: new Map() };
      products.set(id, product);
    }
    product.rows.push(row);
    const batchId = row.productBatchNumber ? JSON.stringify([row.schedule, row.productBatchNumber]) : `unrecorded:${row.id}`;
    let batch = product.batches.get(batchId);
    if (!batch) {
      batch = { id: batchId, batch: row.productBatchNumber, schedule: row.schedule, rows: [], totals: [] };
      product.batches.set(batchId, batch); product.group.batches.push(batch);
    }
    batch.rows.push(row);
  }
  for (const product of products.values()) {
    product.group.totals = reservedTotals(product.rows);
    for (const batch of product.group.batches) batch.totals = reservedTotals(batch.rows);
  }
  return [...products.values()].map(product => product.group);
}
