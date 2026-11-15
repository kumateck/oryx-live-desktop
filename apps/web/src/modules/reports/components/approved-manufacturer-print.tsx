import { PrintHeader, PrintSignatures, PrintTable, type PrintSigner } from "@/shared/print/print-sheet";
import type { ReportBook, ReportRow } from "@/shared/reports/report-data";
import { showReportCell } from "@/shared/reports/report-print";
import { amlColumn } from "../lib/approved-manufacturers";

const cell = (row: ReportRow, column: number) => showReportCell(row.cells[column]);
const pack = (row: ReportRow) => {
  const amount = row.cells[amlColumn.pack]; const unit = row.cells[amlColumn.unit];
  return amount == null ? "–" : `${String(amount)}${unit ? ` ${String(unit)}` : ""}`;
};

/**
 * The approved manufacturer list as the controlled paper copy: landscape, numbered pages, and the
 * Prepared / Checked / Approved block. Only the person printing signs automatically; the checker and
 * approver lines stay blank until they confirm the list in the system.
 */
export function ApprovedManufacturerPrint({ book, reference, preparedBy }: { book: ReportBook; reference: string | null; preparedBy: PrintSigner }) {
  const rows = book.sheets[0]?.rows ?? [];
  return <>
    <PrintHeader title={book.title} reference={reference} />
    <PrintTable rows={rows} rowKey={(row) => row.id} empty="No approved manufacturers match the applied filters" columns={[
      { id: "number", header: "#", width: "4%", cell: (row) => cell(row, amlColumn.number) },
      { id: "code", header: "Item code", width: "9%", cell: (row) => cell(row, amlColumn.code) },
      { id: "material", header: "Material name", width: "16%", cell: (row) => cell(row, amlColumn.material) },
      { id: "manufacturer", header: "Manufacturer name and address", width: "30%", cell: (row) => <><strong>{cell(row, amlColumn.manufacturer)}</strong>
        {row.cells[amlColumn.manufacturerAddress] ? <small className="whitespace-pre-line">{cell(row, amlColumn.manufacturerAddress)}</small> : null}</> },
      { id: "supplier", header: "Supplier name", width: "15%", cell: (row) => cell(row, amlColumn.supplier) },
      { id: "pack", header: "Qty / pack", width: "8%", cell: pack },
      { id: "approved", header: "Date of approval", width: "9%", cell: (row) => cell(row, amlColumn.approvedOn) },
      { id: "valid", header: "Validity date", width: "9%", cell: (row) => cell(row, amlColumn.validUntil) },
    ]} />
    <PrintSignatures signers={[preparedBy, { role: "Checked by" }, { role: "Approved by" }]} />
  </>;
}
