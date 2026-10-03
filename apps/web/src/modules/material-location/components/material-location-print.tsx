import type { MaterialHeader } from "@/modules/approved-materials/components/approved-material-detail";
import type { ShelfBatchRow } from "@/modules/approved-materials/schemas/approved-material-schema";
import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { materialKindLabels } from "@/shared/reference-data/kind-tabs";
import { toLargestUnit } from "@/shared/units/quantity";
import { shelfFigures, stockLevel, stockLevelLabels } from "../lib/stock-level";
import type { MaterialStockRow } from "../schemas/material-location-schema";

const quantity = (value: number, unit: string | null) => toLargestUnit(value, unit, "calculated")?.text ?? String(value);
const columns: PrintColumn<ShelfBatchRow>[] = [
  { id: "shelf", header: "Shelf", cell: (row) => <>{row.shelf ?? "–"}<small>{[row.rack, row.location, row.floor].filter(Boolean).join(" · ")}</small></> },
  { id: "batch", header: "Batch", cell: (row) => row.batchNumber ?? "–" },
  { id: "quantity", header: "Quantity", align: "right", cell: (row) => quantity(row.quantity, row.unit) },
  { id: "made", header: "Manufactured", cell: (row) => formatMonthYear(row.manufacturingDate) ?? "–" },
  { id: "expiry", header: "Expiry", cell: (row) => formatMonthYear(row.expiryDate) ?? "–" },
  { id: "retest", header: "Retest", cell: (row) => formatDate(row.retestDate) ?? "–" },
];

/** Where one material is kept, as a document: its levels and every shelf that holds it. */
export function MaterialLocationPrint({ material, rows, levels, onClose }: { material: MaterialHeader; rows: readonly ShelfBatchRow[]; levels: MaterialStockRow | null; onClose: () => void }) {
  const figures = shelfFigures(rows);
  const unit = rows[0]?.unit ?? levels?.unit ?? null;
  const level = (value: number | undefined) => value && value > 0 ? quantity(value, levels?.unit ?? unit) : "Not set";
  return <PrintPreviewDialog title={`Material location · ${material.name}`} onClose={onClose}>
    <PrintHeader title="Material location record" reference={material.code} />
    <PrintFacts facts={[{ label: "Material", value: material.name }, { label: "Kind", value: `${materialKindLabels[material.kind]} material` }, { label: "On shelves", value: quantity(figures.total, unit) },
      { label: "Stock status", value: levels ? stockLevelLabels[stockLevel(levels)] : null }, { label: "Minimum level", value: levels ? level(levels.minimum) : null },
      { label: "Reorder level", value: levels ? level(levels.reorder) : null }, { label: "Maximum level", value: levels ? level(levels.maximum) : null }]} />
    <PrintTable columns={columns} rows={rows} rowKey={(row) => row.id} empty="This material is not on any shelf" />
  </PrintPreviewDialog>;
}
