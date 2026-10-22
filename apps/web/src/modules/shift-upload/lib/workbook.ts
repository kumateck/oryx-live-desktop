import { validateInWorker } from "@/shared/attachments/validation-client";
import type { ReportSheet } from "@/shared/reports/report-data";
export interface ShiftImportRow {
  number: number;
  staff: string;
  category: string;
  type: string;
}
export interface ShiftPreview {
  sheet: ReportSheet;
  rows: ShiftImportRow[];
}
export async function previewShiftWorkbook(file: File, signal: AbortSignal): Promise<ShiftPreview> {
  if (!/\.xlsx$/i.test(file.name) || file.size > 5 * 1024 * 1024 || !file.size)
    throw new Error("Choose a non-empty XLSX workbook of at most 5 MB. Convert legacy XLS files first.");
  const bytes = await validateInWorker(await file.arrayBuffer(), "xlsx", signal);
  const { default: Excel } = await import("exceljs");
  const workbook = new Excel.Workbook();
  await workbook.xlsx.load(bytes);
  if (signal.aborted) throw new Error("Preview cancelled.");
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 2 || sheet.rowCount > 10001 || sheet.columnCount > 30)
    throw new Error("The first worksheet must contain 1–10,000 data rows and at most 30 columns.");
  const headers = Array.from({ length: sheet.columnCount }, (_, i) =>
    sheet
      .getRow(1)
      .getCell(i + 1)
      .text.trim(),
  );
  const indices = ["STAFF ID", "CATEGORY", "SHIFT TYPE"].map((name) => {
    const found = headers.flatMap((h, i) => (h.toUpperCase() === name ? [i + 1] : []));
    if (found.length !== 1) throw new Error(`Include exactly one ${name} header.`);
    return found[0] ?? 0;
  });
  const rows: ShiftImportRow[] = [];
  const tableRows: { id: string; cells: string[] }[] = [];
  const staff = new Set<string>();
  for (let n = 2; n <= sheet.rowCount; n++) {
    if (signal.aborted) throw new Error("Preview cancelled.");
    const row = sheet.getRow(n);
    const cells = headers.map((_, i) => row.getCell(i + 1).text.trim());
    if (cells.every((v) => !v)) continue;
    const values = indices.map((i) => {
      const cell = row.getCell(i);
      if (cell.formula || cell.type === 6) throw new Error(`Row ${n} uses a formula in a required column. Supply literal values.`);
      return cell.text.trim();
    });
    const id = values[0] ?? "";
    const category = values[1] ?? "";
    const type = values[2] ?? "";
    if (!id || !category || !type) throw new Error(`Row ${n} needs STAFF ID, CATEGORY and SHIFT TYPE.`);
    const key = id.toUpperCase();
    if (staff.has(key)) throw new Error(`Row ${n} repeats staff ${id}. The server creates one assignment per employee/date; provide each employee only once.`);
    staff.add(key);
    rows.push({ number: n, staff: id, category, type });
    tableRows.push({ id: String(n), cells });
  }
  if (!rows.length) throw new Error("The worksheet has no shift records.");
  return { rows, sheet: { name: "Shift import preview", columns: headers.map((h, i) => h || `Column ${i + 1}`), rows: tableRows } };
}
