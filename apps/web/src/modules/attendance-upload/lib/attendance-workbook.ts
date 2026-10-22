import { validateInWorker } from "@/shared/attachments/validation-client";
import type { ReportSheet } from "@/shared/reports/report-data";
export interface AttendancePreview { sheet: ReportSheet; targetDate: string }
export async function previewAttendance(file: File, date: Date, signal: AbortSignal): Promise<AttendancePreview> {
  const { default: ExcelJS } = await import("exceljs");
  const bytes = await validateInWorker(await file.arrayBuffer(), "xlsx", signal); if (signal.aborted) throw new Error("Cancelled");
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(bytes);
  const sheet = workbook.worksheets[0]; if (!sheet || sheet.rowCount < 2) throw new Error("The attendance workbook has no data rows.");
  if (sheet.rowCount > 10_001 || sheet.columnCount > 30) throw new Error("Preview supports up to 10,000 attendance rows and 30 columns.");
  if (sheet.columnCount < 4) throw new Error("The first sheet must have staff number in column 1, timestamp in column 3, and work state in column 4.");
  const targetDate = `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}/${date.getFullYear()}`;
  const rows = [];
  for (let number = 2; number <= sheet.rowCount; number++) {
    if (signal.aborted) throw new Error("Cancelled");
    const row = sheet.getRow(number); const values = Array.from({ length: sheet.columnCount }, (_, index) => row.getCell(index + 1).text.trim());
    if (values.every((value) => !value)) continue;
    if (!values[0] || !values[2] || !values[3]) throw new Error(`Row ${number} is missing a staff number, timestamp or work state.`);
    if (row.getCell(1).formula || row.getCell(3).formula || row.getCell(4).formula) throw new Error(`Row ${number} uses a formula in a required import column. Supply literal values.`);
    if (!/^\d{2}\/\d{2}\/\d{4} \d{2}:\d{2}:\d{2}$/.test(values[2]) || !values[2].startsWith(`${targetDate} `)) throw new Error(`Row ${number} must use ${targetDate} HH:mm:ss in column 3.`);
    const clock = values[2].slice(11).split(":").map(Number);
    if ((clock[0] ?? 24) > 23 || (clock[1] ?? 60) > 59 || (clock[2] ?? 60) > 59) throw new Error(`Row ${number} has an invalid clock time.`);
    if (!["checkin", "checkout", "0", "1"].includes(values[3].replaceAll(" ", "").toLocaleLowerCase())) throw new Error(`Row ${number} must use CheckIn or CheckOut in column 4.`);
    rows.push({ id: String(number), cells: values });
  }
  if (!rows.length) throw new Error("No attendance records were found.");
  return { sheet: { name: "Attendance workbook preview", columns: Array.from({ length: sheet.columnCount }, (_, index) => sheet.getRow(1).getCell(index + 1).text.trim() || `Column ${index + 1}`), rows }, targetDate };
}
