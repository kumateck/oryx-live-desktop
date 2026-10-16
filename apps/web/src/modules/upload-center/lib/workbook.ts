// Reading and writing the upload spreadsheets. exceljs is loaded only when a sheet is handled, so other pages stay light.
export type SheetRow = Record<string, string | number | boolean | Date>;
export interface ParsedSheet { headers: string[]; rows: SheetRow[] }
const maxRows = 10_000;
const maxColumns = 100;
export const maxFileBytes = 10 * 1024 * 1024;
const headerWords = ["empid", "employeeid", "staffid", "name", "time", "workstate", "material", "product", "batch"];

/** A cell starting like a formula is kept as text, so a sheet cannot carry formulas into the next program that opens it. */
export const neutralise = (value: string) => /^[=+\-@]/.test(value) ? `'${value}` : value;

/** The row most likely to be the header: the one, among the first fifteen, with the most distinct labels, preferring known column names. */
export function pickHeaderRow(rows: readonly (readonly string[])[]): number {
  let best = 0;
  let bestScore = -1;
  rows.slice(0, 15).forEach((cells, index) => {
    const labels = cells.map((cell) => cell.trim().toLowerCase()).filter(Boolean);
    if (labels.length < 2) return;
    const score = new Set(labels).size + (labels.some((label) => headerWords.some((word) => label.replace(/[^a-z0-9]/g, "").includes(word))) ? 5 : 0);
    if (score > bestScore) { bestScore = score; best = index; }
  });
  return best;
}

/** The first worksheet as rows keyed by header, or why it cannot be read. */
export async function parseWorkbook(file: Blob): Promise<ParsedSheet | { error: string }> {
  if (file.size > maxFileBytes) return { error: "The file is larger than 10 MB." };
  try {
    const { default: ExcelJS } = await import("exceljs");
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(await file.arrayBuffer());
    const sheet = workbook.worksheets[0];
    if (!sheet) return { error: "The workbook has no worksheet." };
    if (sheet.rowCount > maxRows) return { error: `The sheet has too many rows (${String(sheet.rowCount)}).` };
    if (sheet.columnCount > maxColumns) return { error: `The sheet has too many columns (${String(sheet.columnCount)}).` };
    const texts: string[][] = [];
    for (let number = 1; number <= Math.min(sheet.rowCount, 15); number += 1) {
      const cells: string[] = [];
      sheet.getRow(number).eachCell({ includeEmpty: false }, (cell, column) => { cells[column] = String(cell.text ?? "").trim(); });
      texts.push(Array.from(cells, (cell) => cell ?? ""));
    }
    const headerRow = pickHeaderRow(texts) + 1;
    const headers: string[] = [];
    sheet.getRow(headerRow).eachCell((cell, column) => { headers[column] = String(cell.text ?? "").trim() || `Column ${String(column)}`; });
    const rows: SheetRow[] = [];
    for (let number = headerRow + 1; number <= sheet.rowCount; number += 1) {
      const row: SheetRow = {};
      let filled = false;
      sheet.getRow(number).eachCell({ includeEmpty: false }, (cell, column) => {
        const header = headers[column];
        if (!header) return;
        const value = cell.value;
        row[header] = typeof value === "number" || typeof value === "boolean" || value instanceof Date ? value : neutralise(String(cell.text ?? ""));
        filled = true;
      });
      if (filled) rows.push(row);
    }
    if (rows.length === 0) return { error: "The sheet has no data rows." };
    return { headers: headers.filter(Boolean), rows };
  } catch {
    return { error: "The workbook could not be read. Check that it is an .xlsx file." };
  }
}

/** The rows as a new .xlsx file with the original columns, which is what is uploaded or exported after review. */
export async function buildWorkbook(rows: readonly SheetRow[], headers: readonly string[], name: string): Promise<File> {
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet("Upload");
  const columns = headers.length > 0 ? headers : Object.keys(rows[0] ?? {});
  sheet.addRow([...columns]);
  for (const row of rows) sheet.addRow(columns.map((column) => row[column] ?? ""));
  const buffer = await workbook.xlsx.writeBuffer();
  return new File([buffer], name.toLowerCase().endsWith(".xlsx") ? name : `${name}.xlsx`, { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
}

export function saveFile(file: Blob, name: string) { saveUrl(URL.createObjectURL(file), name); }
/** Saves an object URL's file under a name, then releases the URL. */
export function saveUrl(url: string, name: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
