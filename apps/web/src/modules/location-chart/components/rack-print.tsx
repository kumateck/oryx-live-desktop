import { formatMonthYear } from "@/shared/format/dates";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { materialKindLabels, type MaterialKind } from "@/shared/reference-data/kind-tabs";
import { toLargestUnit } from "@/shared/units/quantity";
import { rackStockRows, rackSummary, type RackStockRow } from "../lib/rack-stock";
import type { Rack } from "../schemas/rack-schema";

const columns: PrintColumn<RackStockRow>[] = [
  { id: "shelf", header: "Shelf", cell: (row) => row.shelf, width: "10%" },
  { id: "material", header: "Material", cell: (row) => <>{row.materialName}<small>{row.materialCode ?? "No code"}</small></> },
  { id: "batch", header: "Batch", cell: (row) => row.batchNumber ?? "–" },
  { id: "quantity", header: "Quantity", align: "right", cell: (row) => toLargestUnit(row.quantity, row.unit, "calculated")?.text ?? String(row.quantity) },
  { id: "made", header: "Manufactured", cell: (row) => formatMonthYear(row.manufacturingDate) ?? "–" },
  { id: "expiry", header: "Expiry", cell: (row) => formatMonthYear(row.expiryDate) ?? "–" },
];

/** The location chart record of one rack: everything on its shelves. */
export function RackPrint({ rack, kind, onClose }: { rack: Rack; kind: MaterialKind; onClose: () => void }) {
  const rows = rackStockRows(rack);
  const figures = rackSummary(rack);
  return <PrintPreviewDialog title={`Location chart · ${rack.name}`} onClose={onClose}>
    <PrintHeader title="Location chart record" reference={rack.name} />
    <PrintFacts facts={[{ label: "Store", value: rack.location }, { label: "Floor", value: rack.floor }, { label: "Materials", value: materialKindLabels[kind] },
      { label: "Shelves in use", value: `${figures.shelves - figures.emptyShelves.length} of ${figures.shelves}` }, { label: "Empty shelves", value: figures.emptyShelves.join(", ") || "None" }, { label: "Batches", value: String(figures.batches) }]} />
    <PrintTable columns={columns} rows={rows} rowKey={(row) => row.id} empty="This rack is empty" />
  </PrintPreviewDialog>;
}
