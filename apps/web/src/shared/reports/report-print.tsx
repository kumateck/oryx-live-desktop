import { PrintHeader, PrintTable } from "@/shared/print/print-sheet";
import type { ReportBook, ReportCell } from "./report-data";
export const showReportCell = (value: ReportCell | undefined) => value == null ? "–" : typeof value === "boolean" ? value ? "Yes" : "No" : String(value);
/** Wide data is split into readable column groups, carrying the row reference through every group. */
export function ReportPrint({ book }: { book: ReportBook }) {
  return <><PrintHeader title={book.title} aside={<p>Generated {new Date(book.generatedAt).toLocaleString()}</p>} />
    <p>{book.filters.map((filter) => `${filter.label}: ${filter.value}`).join(" · ")}</p>
    {book.warnings.map((warning) => <p key={warning}>{warning}</p>)}
    {book.sheets.flatMap((sheet) => Array.from({ length: Math.max(1, Math.ceil(sheet.columns.length / 6)) }, (_, group) => {
      const first = group * 6; const columns = sheet.columns.slice(first, first + 6);
      return <section key={`${sheet.name}:${group}`} className="mt-4"><h2 className="font-semibold">{sheet.name}{sheet.columns.length > 6 ? ` · Fields ${first + 1}–${first + columns.length}` : ""}</h2>
        <PrintTable rows={sheet.rows} rowKey={(row) => row.id} empty="No matching records" columns={[
          { id: "reference", header: "Row", cell: (row) => Number(row.id) + 1, width: "5%" },
          ...columns.map((header, index) => ({ id: String(first + index), header, cell: (row: typeof sheet.rows[number]) => showReportCell(row.cells[first + index]) })),
        ]} />
      </section>;
    }))}</>;
}
