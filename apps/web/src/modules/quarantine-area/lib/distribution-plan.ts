import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { BatchStatus } from "@/shared/material-batches/batch-status";
import type { ReceivedBatch } from "@/shared/material-batches/received-batch";
import { fromSmallestUnit, relatedUnits, toLargestUnit } from "@/shared/units/quantity";
import type { Grn } from "../schemas/grn-schema";

export interface Allocation {
  warehouseId: string;
  materialBatchId: string;
  uoMId: string;
  distributedRequisitionItemId: string;
  quantity: number;
  batchNumber: string;
}
export interface WarehousePlan {
  id: string;
  name: string;
  requested: number;
  allocated: number;
  allocations: Allocation[];
}
export interface DistributionPlan {
  available: number;
  requested: number;
  unit: string | null;
  warehouses: WarehousePlan[];
  problem: string | null;
}

const validId = (id: string | null) => id !== null && /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/i.test(id);
const compatibleUnit = (unit: string, candidate: string) => relatedUnits(unit).some((symbol) => symbol.toLowerCase() === candidate.trim().toLowerCase());
const amount = (value: number | null): value is number => value !== null && Number.isFinite(value) && value >= 0;
export const stockQuantity = (value: number, unit: string | null) =>
  toLargestUnit(fromSmallestUnit(value, unit), unit, "calculated")?.text ?? String(value);

export function approvedMaterials(grn: Grn, kind: MaterialKind) {
  return [...new Map(grn.batches.flatMap((batch) => batch.status === BatchStatus.Approved && batch.materialKind === kind && batch.materialId
    ? [[batch.materialId, { value: batch.materialId, label: batch.materialName ?? "Unnamed material" }] as const] : [])).values()];
}

function available(batch: ReceivedBatch) {
  return amount(batch.distributed) ? Math.max(0, batch.total - batch.distributed) : 0;
}

/** Match Next's allocation order, retaining the requisition id for every allocation. Quantities stay in storage units. */
export function distributionPlan(grn: Grn, materialId: string, kind: MaterialKind): DistributionPlan {
  const batches = grn.batches.filter((batch) => batch.materialId === materialId && batch.materialKind === kind && batch.status === BatchStatus.Approved);
  const unit = batches[0]?.unit ?? null;
  const plan: DistributionPlan = { available: 0, requested: 0, unit, warehouses: [], problem: null };
  const fail = (problem: string) => ({ ...plan, warehouses: [], problem });
  if (!batches.length) return fail("This material no longer has approved batches on this note.");
  if (batches.some((batch) => !validId(batch.id) || !validId(batch.unitId) || !unit || !batch.unit || !compatibleUnit(unit, batch.unit)
    || !amount(batch.total) || !amount(batch.distributed) || batch.distributed > batch.total)) {
    return fail("Approved batch quantities or units are incomplete. Refresh the note before distributing.");
  }
  const unique = [...new Map(batches.map((batch) => [batch.id, batch])).values()];
  const stock = unique.sort((a, b) => available(b) - available(a)).map((batch) => ({ batch, remaining: available(batch) }));
  plan.available = stock.reduce((sum, item) => sum + item.remaining, 0);
  const requests = [...new Map(grn.requests.filter((request) => request.materialId === materialId).map((request) => [request.id, request])).values()];
  const warehouses = new Map<string, { name: string; requested: number; requests: typeof requests }>();
  for (const request of requests) {
    if (!amount(request.quantity) || !amount(request.distributed) || request.distributed > request.quantity) return fail("Warehouse request quantities are incomplete. Refresh the note before distributing.");
    const outstanding = request.quantity - request.distributed;
    if (outstanding <= 0) continue;
    if (!validId(request.id) || !request.warehouseId || !validId(request.warehouseId) || !validId(request.unitId) || !unit || !request.unit || !compatibleUnit(unit, request.unit)) {
      return fail("A warehouse request has missing or incompatible units or identifiers. Distribution cannot be prepared.");
    }
    const warehouse = warehouses.get(request.warehouseId) ?? { name: request.warehouseName, requested: 0, requests: [] };
    warehouse.requested += outstanding;
    warehouse.requests.push(request);
    warehouses.set(request.warehouseId, warehouse);
  }
  for (const [id, warehouse] of [...warehouses].sort((a, b) => a[1].requested - b[1].requested)) {
    const result: WarehousePlan = { id, name: warehouse.name, requested: warehouse.requested, allocated: 0, allocations: [] };
    for (const request of warehouse.requests) {
      if (!request.id || request.quantity === null || request.distributed === null) continue;
      let needed = request.quantity - request.distributed;
      for (const item of stock) {
        if (needed <= 0) break;
        const quantity = Math.min(needed, item.remaining);
        if (quantity <= 0 || !item.batch.unitId) continue;
        result.allocations.push({ warehouseId: id, materialBatchId: item.batch.id, uoMId: item.batch.unitId,
          distributedRequisitionItemId: request.id, quantity, batchNumber: item.batch.number ?? "No batch number" });
        result.allocated += quantity;
        needed -= quantity;
        item.remaining -= quantity;
      }
    }
    plan.requested += result.requested;
    plan.warehouses.push(result);
  }
  return plan;
}

export const distributionBody = (warehouse: WarehousePlan) => warehouse.allocations.map(({ batchNumber: _number, ...request }) => request);
export const sameAllocation = (first: WarehousePlan, second: WarehousePlan) =>
  first.requested === second.requested && JSON.stringify(distributionBody(first)) === JSON.stringify(distributionBody(second));
