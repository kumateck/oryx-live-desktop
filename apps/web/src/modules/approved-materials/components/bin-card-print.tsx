import { useMemo } from "react";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { formatDate, formatMonthYear } from "@/shared/format/dates";
import { materialKindLabels } from "@/shared/reference-data/kind-tabs";
import { toLargestUnit } from "@/shared/units/quantity";
import { useGetApiV1WarehouseBincardinformationByMaterialIdAndDepartmentIdQuery } from "../api/approved-material-api";
import { binCardRowsSchema, type BinCardRow } from "../schemas/approved-material-schema";
import type { MaterialHeader } from "./approved-material-detail";

/** The most entries one printed bin card holds. A longer card is narrowed with the search before printing. */
export const binCardPrintLimit = 500;
const quantity = (value: number, unit: string | null) => value ? toLargestUnit(value, unit, "calculated")?.text ?? String(value) : "–";
const columns: PrintColumn<BinCardRow>[] = [
  { id: "date", header: "Date", cell: (row) => formatDate(row.date) ?? "–", width: "11%" },
  { id: "reference", header: "Reference", cell: (row) => <>{row.requisition ? `Requisition ${row.requisition}` : row.wayBill ? `Waybill ${row.wayBill}` : "–"}<small>AR {row.arNumber ?? "–"}</small></> },
  { id: "batch", header: "Batch", cell: (row) => <>{row.batchNumber ?? "–"}<small>Expires {formatMonthYear(row.expiryDate) ?? "–"}</small></> },
  { id: "party", header: "Supplier / issued to", cell: (row) => row.product ? <>{row.product}<small>Batch {row.productBatch ?? "–"}</small></> : row.supplier ?? "–" },
  { id: "received", header: "Received", align: "right", cell: (row) => quantity(row.received, row.unit) },
  { id: "issued", header: "Issued", align: "right", cell: (row) => quantity(row.issued, row.unit) },
  { id: "balance", header: "Balance", align: "right", cell: (row) => toLargestUnit(row.balance, row.unit, "calculated")?.text ?? String(row.balance) },
];

/** The material's bin card as a document: every receipt and issue, newest first as the server lists them. */
export function BinCardPrint({ material, departmentId, search, onClose }: { material: MaterialHeader; departmentId: string; search: string; onClose: () => void }) {
  const query = useGetApiV1WarehouseBincardinformationByMaterialIdAndDepartmentIdQuery({ module: "Warehouse", subModule: "Bin Card", materialId: material.id, departmentId, page: 1, pageSize: binCardPrintLimit, searchQuery: search });
  const rows = useMemo(() => { const parsed = binCardRowsSchema.safeParse(query.data?.data ?? null); return parsed.success ? parsed.data : []; }, [query.data]);
  const total = query.data?.totalRecordCount ?? rows.length;
  const note = query.isLoading ? "Loading every entry…" : query.error ? "The entries could not be loaded; close and try again."
    : total > rows.length ? `This card has ${total} entries; the first ${rows.length} are printed. Narrow it with the search to print the rest.` : null;
  return <PrintPreviewDialog title={`Bin card · ${material.name}`} note={note} ready={!query.isLoading && !query.error} onClose={onClose}>
    <PrintHeader title="Bin card" reference={material.code} />
    <PrintFacts facts={[{ label: "Material", value: material.name }, { label: "Kind", value: `${materialKindLabels[material.kind]} material` }, { label: "Category", value: material.category },
      { label: "Entries", value: total > rows.length ? `${rows.length} of ${total}` : String(rows.length) }, { label: "Filter", value: search.trim() || null }]} />
    <PrintTable columns={columns} rows={rows} rowKey={(row) => row.id} empty={query.isLoading ? "Loading…" : "No bin card entries"} />
  </PrintPreviewDialog>;
}
