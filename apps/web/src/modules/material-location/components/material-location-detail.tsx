import { useCallback, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import type { MaterialHeader } from "@/modules/approved-materials/components/approved-material-detail";
import { expiryState } from "@/modules/approved-materials/lib/stock";
import type { ShelfBatchRow } from "@/modules/approved-materials/schemas/approved-material-schema";
import { MoveStockDialog } from "@/modules/location-chart/components/move-stock-dialog";
import { moveStockPermissions } from "@/modules/location-chart/lib/location-access";
import type { MoveSource } from "@/modules/location-chart/lib/move-stock";
import { useCurrentUser } from "@/shared/auth/session-provider";
import { KeyFact, KeyFacts } from "@/shared/detail/key-facts";
import { formatMonthYear } from "@/shared/format/dates";
import { PageHeader } from "@/shared/navigation/page-header";
import { PrintButton } from "@/shared/print/print-button";
import { materialKindLabels } from "@/shared/reference-data/kind-tabs";
import { toLargestUnit } from "@/shared/units/quantity";
import { useMaterialLevels, useMaterialShelves } from "../hooks/use-material-shelves";
import { materialLocationsPath } from "../lib/material-location-access";
import { shelfFigures, stockLevel } from "../lib/stock-level";
import { MaterialLocationPrint } from "./material-location-print";
import { MaterialShelvesTable } from "./material-shelves-table";
import { StockLevelBadge } from "./stock-level-badge";

const quantity = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);

/** One material: its stock against its levels, and every shelf that holds it. */
export function MaterialLocationDetail({ material }: { material: MaterialHeader }) {
  const departmentId = useCurrentUser()?.departmentId ?? null;
  const shelves = useMaterialShelves(material.id, departmentId);
  const levels = useMaterialLevels(material);
  const [moving, setMoving] = useState<MoveSource | null>(null);
  const figures = useMemo(() => shelfFigures(shelves.rows), [shelves.rows]);
  const unit = shelves.rows[0]?.unit ?? levels?.unit ?? null;
  const move = useCallback((row: ShelfBatchRow) => {
    if (row.shelfBatchId) setMoving({ shelfBatchId: row.shelfBatchId, shelfId: row.shelfId, shelfLabel: row.shelf, materialName: material.name, batchNumber: row.batchNumber, quantity: row.quantity, unit: row.unit, unitId: row.unitId, kind: material.kind });
  }, [material.name, material.kind]);
  return <article className="min-w-0 space-y-4">
    <PageHeader title={material.name} crumbs={[{ label: "Material location", to: `${materialLocationsPath}?type=${material.kind}` }, { label: material.name }]}
      actions={departmentId && !shelves.loading && !shelves.error ? <PrintButton preview={(close) => <MaterialLocationPrint material={material} rows={shelves.rows} levels={levels} onClose={close} />} /> : null} />
    <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
      <Badge variant="outline">{materialKindLabels[material.kind]} material</Badge>
      {material.code ? <span className="font-mono">{material.code}</span> : null}
      {levels ? <StockLevelBadge level={stockLevel(levels)} /> : null}
    </div>
    {departmentId ? <>
      <KeyFacts>
        <KeyFact label="On shelves" value={shelves.loading ? "…" : quantity(figures.total, unit)} note={`${figures.batches} ${figures.batches === 1 ? "batch" : "batches"} on ${figures.shelves} ${figures.shelves === 1 ? "shelf" : "shelves"}`} />
        <KeyFact label="Earliest expiry" value={formatMonthYear(figures.earliestExpiry) ?? "None"} state={expiryState(figures.earliestExpiry)} />
        {levels ? <>
          <KeyFact label="Minimum level" value={levels.minimum > 0 ? quantity(levels.minimum, levels.unit) : "Not set"} />
          <KeyFact label="Reorder level" value={levels.reorder > 0 ? quantity(levels.reorder, levels.unit) : "Not set"} />
          <KeyFact label="Maximum level" value={levels.maximum > 0 ? quantity(levels.maximum, levels.unit) : "Not set"} />
        </> : null}
      </KeyFacts>
      <MaterialShelvesTable rows={shelves.rows} movePermission={moveStockPermissions[material.kind]} loading={shelves.loading} refreshing={shelves.refreshing} error={shelves.error} onRetry={shelves.retry} onMove={move} />
    </> : <p role="alert" className="text-sm">Your account has no department, so there are no shelves to show.</p>}
    {moving ? <MoveStockDialog source={moving} onClose={() => setMoving(null)} /> : null}
  </article>;
}
