import { useState } from "react";
import { PrintPreviewDialog } from "@/shared/print/print-preview-dialog";
import { PrintFacts, PrintHeader, PrintTable, type PrintColumn } from "@/shared/print/print-sheet";
import { formatDate, formatDateTime } from "@/shared/format/dates";
import { materialKindLabels } from "@/shared/reference-data/kind-tabs";
import { toLargestUnit } from "@/shared/units/quantity";
import { stockTraceStates, type StockTrace, type StockTraceLedgerRow, type StockTraceRow } from "../schemas/stock-trace";

export type StockReportView = "stock" | "bin-card" | "reserved" | "floor" | "consumed" | "reconciliation" | "details";
export const stockReportTitles: Record<StockReportView, string> = { stock: "Stock by batch", "bin-card": "Bin card", reserved: "Reserved stock", floor: "Production-floor stock", consumed: "Consumed stock", reconciliation: "Stock reconciliation", details: "Material details" };
export const traceQuantity = (value: number, unit: string | null) => value === 0 ? `0${unit ? ` ${unit}` : ""}` : toLargestUnit(value, unit, "calculated")?.text ?? String(value);
const columns: PrintColumn<StockTraceRow>[] = [
  { id: "lot", header: "Material lot / location", cell: (row) => <>{row.materialBatchNumber ?? "Lot not recorded"}<small>AR {row.arNumber ?? "–"} · {formatDate(row.effectiveExpiryDate) ?? "Validity not recorded"}</small><small>{[row.warehouse, row.shelf].filter(Boolean).join(" · ")}</small></> },
  { id: "quantity", header: "Quantity", align: "right", cell: (row) => traceQuantity(row.quantity, row.unit) },
  { id: "reference", header: "Reference / production batch", cell: (row) => <>{row.reference || "Reference not recorded"}<small>{row.product}{row.productBatchNumber ? ` · ${row.productBatchNumber}` : ""}</small></> },
  { id: "date", header: "Evidence / date", cell: (row) => <>{row.evidence}<small>{formatDate(row.occurredAt) ?? "Date not recorded"}{row.actor ? ` · ${row.actor}` : ""}</small></> },
];
const ledgerColumns: PrintColumn<StockTraceLedgerRow>[] = [
  { id: "date", header: "Date", cell: (row) => formatDate(row.occurredAt) ?? "–" },
  { id: "reference", header: "Reference / description", cell: (row) => <>{row.reference || row.description || "Reference not recorded"}<small>{row.materialBatchNumber} · AR {row.arNumber ?? "–"}</small></> },
  { id: "received", header: "Received", align: "right", cell: (row) => traceQuantity(row.received, row.unit) },
  { id: "issued", header: "Issued", align: "right", cell: (row) => traceQuantity(row.issued, row.unit) },
  { id: "balance", header: "Balance", align: "right", cell: (row) => traceQuantity(row.balance, row.unit) },
  { id: "batch", header: "Warehouse / production batch", cell: (row) => <>{row.warehouse}<small>{[row.product, row.productBatchNumber].filter(Boolean).join(" · ")}</small></> },
];
const sections = [
  { id: "stock", state: stockTraceStates.store }, { id: "reserved", state: stockTraceStates.reserved },
  { id: "floor", state: stockTraceStates.floor }, { id: "consumed", state: stockTraceStates.consumed },
] as const;
function matches(search: string, data: StockTrace, values: (string | null)[]): boolean {
  const haystack = [data.materialName, data.materialCode, ...values].join(" ").toLowerCase();
  return search.toLowerCase().trim().split(/\s+/).filter(Boolean).every((word) => haystack.includes(word));
}

function ReportSection<Row>({ title, columns, rows, rowKey, empty }: {
  title: string; columns: PrintColumn<Row>[]; rows: Row[]; rowKey: (row: Row) => string; empty: string;
}) {
  return <section style={rows.length <= 1 ? { breakInside: "avoid-page" } : undefined}>
    <h2 style={{ breakAfter: "avoid-page" }}>{title}</h2>
    <PrintTable columns={columns} rows={rows} rowKey={rowKey} empty={empty} />
  </section>;
}

/** One complete read-only snapshot supplies separate reports and the combined material-details document. */
export function StockTraceDocument({ data: snapshot, view = "details", search = "" }: { data: StockTrace; view?: StockReportView; search?: string }) {
  const amount = (value: number) => traceQuantity(value, snapshot.unit);
  const full = view === "details" || view === "reconciliation";
  const ledger = snapshot.ledgerRows.filter((row) => matches(search, snapshot, [row.materialBatchNumber, row.reference, row.description, row.arNumber, row.product, row.productBatchNumber]));
  return <>
    <PrintHeader title={stockReportTitles[view]} reference={snapshot.materialCode} />
    <PrintFacts facts={[
      { label: "Material", value: snapshot.materialName }, { label: "Material code", value: snapshot.materialCode },
      { label: "Kind", value: materialKindLabels[snapshot.materialKind] }, { label: "Stock unit", value: snapshot.unit },
      { label: "Department", value: snapshot.departmentName }, { label: "Category", value: snapshot.category },
      { label: "Pharmacopoeia", value: snapshot.pharmacopoeia }, { label: "Snapshot", value: formatDateTime(snapshot.generatedAt) },
      { label: "Store period starts", value: formatDate(snapshot.periodStart) }, { label: "Filter", value: search || null },
    ]} />
    {snapshot.gaps.length ? <div><strong>Needs reconciliation</strong><ul>{snapshot.gaps.map((gap) => <li key={gap}>{gap}</li>)}</ul></div> : null}
    {full ? <section><h2>Reconciliation totals</h2><PrintFacts facts={[
      { label: "Opening store balance", value: amount(snapshot.openingBalance) }, { label: "Store receipts", value: amount(snapshot.received) },
      { label: "Store outward movements", value: amount(snapshot.issued) }, { label: "Closing bin card", value: amount(snapshot.ledgerClosing) },
      { label: "On shelves", value: amount(snapshot.storeStock) }, { label: "Reserved on shelves", value: amount(snapshot.reservedStock) },
      { label: "Free on shelves", value: amount(snapshot.freeStock) }, { label: "Expired / unavailable", value: amount(snapshot.expiredStock + snapshot.unavailableStock) },
      { label: "On production floor", value: amount(snapshot.productionFloorStock) }, { label: "Confirmed consumed", value: amount(snapshot.consumedStock) },
      { label: "Awaiting shelf receipt", value: amount(snapshot.inTransitStock) }, { label: "Bin card difference", value: amount(snapshot.ledgerGap) },
    ]} /><p>Opening + receipts − outward movements = closing bin-card balance. Reservations are included in shelf stock. Floor stock excludes recorded returns and consumption. Position and consumption totals are cumulative at the snapshot; the store balance period applies to opening, receipts and outward movements.</p></section> : null}
    {sections.filter((section) => full || section.id === view).map((section) => {
      const rows = snapshot.rows.filter((row) => row.state === section.state && matches(search, snapshot, [row.materialBatchNumber, row.warehouse, row.shelf, row.reference, row.product, row.productBatchNumber, row.actor]));
      return <ReportSection key={section.id} title={stockReportTitles[section.id]} columns={columns} rows={rows} rowKey={(row) => `${row.state}:${row.id}:${row.warehouse}`} empty={section.id === "consumed" ? "No confirmed consumption recorded" : "No stock recorded in this position"} />;
    })}
    {full || view === "bin-card" ? <ReportSection title="Bin card" columns={ledgerColumns} rows={ledger} rowKey={(row) => row.id} empty="No bin card entries" /> : null}
    {full ? <ReportSection title="Transfers awaiting shelf receipt" columns={columns} rows={snapshot.rows.filter((row) => row.state === stockTraceStates.transit)} rowKey={(row) => row.id} empty="No stock awaiting shelf receipt" /> : null}
  </>;
}

/** A reviewed snapshot stays fixed while its print preview is open. */
export function StockTracePrint({ data, view = "details", search = "", onClose }: { data: StockTrace; view?: StockReportView; search?: string; onClose: () => void }) {
  const [snapshot] = useState(data);
  return <PrintPreviewDialog title={`${stockReportTitles[view]} · ${snapshot.materialName}`} ready onClose={onClose}>
    <StockTraceDocument data={snapshot} view={view} search={search} />
  </PrintPreviewDialog>;
}
