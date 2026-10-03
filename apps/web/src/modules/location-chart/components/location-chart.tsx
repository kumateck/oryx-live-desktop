import { useCallback, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { MaterialKind } from "@/shared/reference-data/kind-tabs";
import { usePageSearch } from "@/shared/search/page-search";
import { PrintButton } from "@/shared/print/print-button";
import { PageSkeleton } from "@/shared/skeleton/page-skeletons";
import { useRack } from "../hooks/use-rack";
import { useRackParam } from "../hooks/use-rack-param";
import { useRacks } from "../hooks/use-racks";
import { moveStockPermissions } from "../lib/location-access";
import type { MoveSource } from "../lib/move-stock";
import { filterRackStock, rackStockRows, rackSummary, type RackStockRow } from "../lib/rack-stock";
import { MoveStockDialog } from "./move-stock-dialog";
import { RackFacts } from "./rack-facts";
import { RackList } from "./rack-list";
import { RackPrint } from "./rack-print";
import { RackStockTable } from "./rack-stock-table";

/** The department's racks of one kind of material, and what is on the shelves of the open one. */
export function LocationChart({ kind }: { kind: MaterialKind }) {
  const racks = useRacks(kind);
  const { rackId, select } = useRackParam(racks.racks);
  const open = useRack(rackId);
  const search = usePageSearch("stock on this rack", false);
  const [moving, setMoving] = useState<MoveSource | null>(null);
  const all = useMemo(() => open.rack ? rackStockRows(open.rack) : [], [open.rack]);
  const rows = useMemo(() => filterRackStock(all, search), [all, search]);
  const figures = useMemo(() => open.rack ? rackSummary(open.rack) : null, [open.rack]);
  const move = useCallback((row: RackStockRow) => {
    if (row.shelfBatchId) setMoving({ shelfBatchId: row.shelfBatchId, shelfId: row.shelfId, shelfLabel: row.shelf, materialName: row.materialName, batchNumber: row.batchNumber, quantity: row.quantity, unit: row.unit, unitId: row.unitId, kind });
  }, [kind]);

  if (racks.loading) return <PageSkeleton label="Loading racks" />;
  if (racks.error) return <div role="alert" className="mx-auto max-w-md space-y-3 py-12 text-center"><h2 className="text-lg font-semibold">Racks unavailable</h2>
    <p className="text-sm text-muted-foreground">{racks.error}</p><Button size="sm" variant="outline" onClick={racks.retry}>Retry</Button></div>;
  if (racks.racks.length === 0) return <div className="mx-auto max-w-md space-y-1 py-12 text-center"><h2 className="text-lg font-semibold">No racks</h2>
    <p className="text-sm text-muted-foreground">Your department's warehouse has no racks for this kind of material. Racks are set up under warehouse locations.</p></div>;
  return <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[16rem_minmax(0,1fr)]">
    <RackList racks={racks.racks} active={rackId} onSelect={select} />
    <div className="flex min-h-0 min-w-0 flex-col gap-4">
      {open.rack ? <div className="flex justify-end"><PrintButton label="Print rack" preview={(close) => open.rack ? <RackPrint rack={open.rack} kind={kind} onClose={close} /> : null} /></div> : null}
      {figures ? <RackFacts figures={figures} /> : null}
      <RackStockTable rows={rows} search={search} movePermission={moveStockPermissions[kind]} loading={open.loading} refreshing={open.refreshing} error={open.error} onRetry={open.retry} onMove={move} />
    </div>
    {moving ? <MoveStockDialog source={moving} onClose={() => setMoving(null)} /> : null}
  </div>;
}
