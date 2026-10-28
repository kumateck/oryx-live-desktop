import type { ReportBook, ReportCell, ReportSheet } from "./report-data";
import { worksheetName } from "./worksheet-name";
function csvCell(value: ReportCell): string {
  const text = value === null ? "" : String(value);
  // Quoting alone does not stop spreadsheet formula interpretation in CSV text cells.
  const literal = typeof value === "string" && /^[\s]*[=+@-]/.test(text) ? `'${text}` : text;
  return `"${literal.replaceAll('"', '""')}"`;
}
export function reportCsv(sheet: ReportSheet): string {
  return "\uFEFF" + [sheet.columns.map((value) => csvCell(value)).join(","), ...sheet.rows.map((row) => row.cells.map(csvCell).join(","))].join("\r\n");
}
export async function exportReportCsv(book: ReportBook): Promise<void> {
  const { strToU8, zipSync } = await import("fflate"); const used = new Set<string>(); const files: Record<string, Uint8Array> = {};
  for (const sheet of book.sheets) files[`${worksheetName(sheet.name, used)}.csv`] = strToU8(reportCsv(sheet));
  files["Report information.txt"] = strToU8([book.title, `Generated at: ${book.generatedAt}`, ...book.filters.map((filter) => `${filter.label}: ${filter.value}`), ...book.warnings].join("\r\n"));
  const url = URL.createObjectURL(new Blob([zipSync(files).slice().buffer], { type: "application/zip" }));
  const link = document.createElement("a"); link.href = url; link.download = `${book.title.replace(/[^a-z0-9 -]/gi, "").trim() || "Report"} - CSV.zip`; document.body.append(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
}
