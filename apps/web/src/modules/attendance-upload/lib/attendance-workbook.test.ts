import { expect, it, vi } from "vitest";
import ExcelJS from "exceljs";
import { previewAttendance } from "./attendance-workbook";
vi.mock("@/shared/attachments/validation-client", () => ({ validateInWorker: async (bytes: ArrayBuffer) => bytes }));
// OOXML container limits are covered by the attachment validator; this suite checks import semantics.
async function workbook(rows: (string | number | { formula: string; result: string })[][]): Promise<File> {
  const book = new ExcelJS.Workbook(); const sheet = book.addWorksheet("Attendance"); sheet.addRow(["Staff number", "Name", "Timestamp", "State"]); for (const row of rows) sheet.addRow(row);
  const bytes = await book.xlsx.writeBuffer(); return new File([bytes], "attendance.xlsx");
}
const date = new Date(2026, 9, 21); const signal = () => new AbortController().signal;
it("previews all literal records for the selected date without changing staff numbers", async () => {
  const file = await workbook([["0001", "Ama", "21/10/2026 08:30:00", "CheckIn"], ["0001", "Ama", "21/10/2026 17:00:00", "CheckOut"]]);
  const preview = await previewAttendance(file, date, signal()); expect(preview.sheet.rows).toHaveLength(2); expect(preview.sheet.rows[0]?.cells[0]).toBe("0001");
});
it.each(["date", "clock", "formula", "state"] as const)("refuses invalid %s before any upload", async (kind) => {
  const row: (string | number | { formula: string; result: string })[] = ["0001", "Ama", "21/10/2026 08:30:00", "CheckIn"];
  if (kind === "date") row[2] = "20/10/2026 08:30:00"; if (kind === "clock") row[2] = "21/10/2026 24:30:00";
  if (kind === "formula") row[0] = { formula: '"0001"', result: "0001" }; if (kind === "state") row[3] = "Other";
  await expect(previewAttendance(await workbook([row]), date, signal())).rejects.toBeInstanceOf(Error);
});
