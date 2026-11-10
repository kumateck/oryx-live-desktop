import { useState } from "react";
import type { DomainEntitiesMaterialsBatchMaterialBatchDto } from "@/shared/api/generated/materials";
import { Button } from "@/components/ui/button";
import { PermissionGuard } from "@/shared/auth/permission-guard";
import { DetailGroup, DetailItem } from "@/shared/detail/detail-list";
import { stockShelfLocation } from "@/shared/warehouse/stock-location";
import { toLargestUnit } from "@/shared/units/quantity";
import { MoveStockDialog, moveStockPermissions, type MoveSource } from "@/modules/location-chart/public";

type Batch = DomainEntitiesMaterialsBatchMaterialBatchDto;
const quantity = (value: number | undefined, unit: string | null | undefined) =>
  value === undefined ? "Quantity not recorded" : toLargestUnit(value, unit, "calculated")?.text ?? String(value);

/** Shelf stock and production reservations are separate allocations, never interchangeable quantities. */
export function BatchStockLocations({ record }: { record: Batch }) {
  const [moving, setMoving] = useState<MoveSource | null>(null);
  const [choosing, setChoosing] = useState(false);
  const shelves = (record.shelves ?? []).filter((shelf) => shelf.quantity === undefined || shelf.quantity > 0);
  const reserved = (record.reservedQuantities ?? []).filter((allocation) => (allocation.quantity ?? 0) > 0);
  const sources = shelves.flatMap((shelf): MoveSource[] => {
    const kind = shelf.materialBatch?.material?.kind;
    const unit = shelf.uoM ?? record.uoM;
    if (!shelf.id || !shelf.warehouseLocationShelf?.id || !unit?.id || shelf.quantity === undefined || (kind !== 0 && kind !== 1)) return [];
    return [{ shelfBatchId: shelf.id, shelfId: shelf.warehouseLocationShelf.id,
      shelfLabel: stockShelfLocation(shelf.warehouseLocationShelf), materialName: record.material?.name ?? "Unnamed material",
      batchNumber: record.batchNumber ?? null, quantity: shelf.quantity, unit: unit.symbol ?? null, unitId: unit.id, kind }];
  });
  return <section className="min-w-0 space-y-3" aria-label="Batch stock locations">
    <DetailGroup title="Stock locations">
      {shelves.map((shelf, index) => <DetailItem key={shelf.id ?? index}
        label={stockShelfLocation(shelf.warehouseLocationShelf) ?? "Shelf location not recorded"}
        value={quantity(shelf.quantity, shelf.uoM?.symbol ?? record.uoM?.symbol)} />)}
      {reserved.map((allocation, index) => <DetailItem key={allocation.id ?? index}
        label={`Reserved · ${allocation.warehouse?.name ?? "Warehouse not recorded"}`}
        value={quantity(allocation.quantity, allocation.uoM?.symbol ?? record.uoM?.symbol)} />)}
      {shelves.length === 0 ? <DetailItem label="On shelves" value={reserved.length ? "No stock on shelves. The allocations above are reserved stock." : "No current shelf stock recorded."} /> : null}
    </DetailGroup>
    {sources.length ? <div className="flex flex-wrap gap-2">{Array.from(new Set(sources.map((source) => source.kind))).map((kind) =>
      <PermissionGuard key={kind} require={moveStockPermissions[kind]}><Button variant="outline" onClick={() => {
        const choices = sources.filter((source) => source.kind === kind);
        if (choices.length === 1 && choices[0]) setMoving(choices[0]); else setChoosing(!choosing);
      }}>Update shelf location</Button></PermissionGuard>)}
    </div> : null}
    {choosing ? <div className="flex flex-wrap gap-2" aria-label="Choose source shelf">{sources.map((source) =>
      <PermissionGuard key={source.shelfBatchId} require={moveStockPermissions[source.kind]}><Button variant="outline" onClick={() => { setChoosing(false); setMoving(source); }}>
        {source.shelfLabel} · {quantity(source.quantity, source.unit)}
      </Button></PermissionGuard>)}</div> : null}
    {moving ? <MoveStockDialog source={moving} onClose={() => setMoving(null)} /> : null}
  </section>;
}
