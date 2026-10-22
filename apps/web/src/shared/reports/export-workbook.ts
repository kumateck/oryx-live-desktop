import type { ReportBook } from "./report-data";
import { worksheetName } from "./worksheet-name";
/** Exports the loaded snapshot, with its applied filters. Text is never interpreted as a spreadsheet formula. */
export async function createReportWorkbook(book: ReportBook, actor: string | null) {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  workbook.creator = actor ?? "Oryx"; workbook.created = new Date(book.generatedAt);
  const metadata = workbook.addWorksheet("Report information");
  metadata.columns = [{ header: "Field", key: "label", width: 30 }, { header: "Value", key: "value", width: 80 }];
  metadata.addRows([{ label: "Report", value: book.title }, { label: "Generated at", value: book.generatedAt }, { label: "Exported by", value: actor ?? "" }, ...book.filters, ...book.warnings.map((value) => ({ label: "Warning", value }))]);
  const names = new Set(["report information"]);
  for (const sheet of book.sheets) {
    const name = worksheetName(sheet.name, names);
    const page = workbook.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
    page.columns = sheet.columns.map((header, column) => ({ header, key: String(column), width: Math.min(42, Math.max(16, header.length + 3)) }));
    for (const row of sheet.rows) page.addRow([...row.cells]);
    page.getRow(1).font = { bold: true };
    page.getRow(1).alignment = { vertical: "middle", wrapText: true };
    page.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: Math.max(1, sheet.columns.length) } };
    page.eachRow((row) => { row.alignment = { vertical: "top", wrapText: true }; });
  }
  const bytes = await workbook.xlsx.writeBuffer();
  return new Uint8Array(bytes).slice().buffer;
}
export async function exportReportWorkbook(book: ReportBook, actor: string | null): Promise<void> {
  const bytes = await createReportWorkbook(book, actor);
  const url = URL.createObjectURL(new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }));
  const link = document.createElement("a"); link.href = url; link.download = `${book.title.replace(/[^a-z0-9 -]/gi, "").trim() || "Report"}.xlsx`;
  document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
