import ExcelJS from "exceljs";
import { expect, it } from "vitest";
import { reportQuantity, type ReportCell } from "./report-data";
import { compareReportCells, reportQuantityExcel, reportQuantityText } from "./report-quantity";
import { reportCsv } from "./export-csv";
import { createReportWorkbook } from "./export-workbook";
import { showReportCell } from "./report-print";

const q = (value: number, unit: string, origin: "entered" | "calculated" = "calculated") => {
  const cell = reportQuantity(value, unit, origin); if (!cell) throw new Error("Expected a quantity"); return cell;
};

it("shows report quantities in the largest unit on screen, in print and in CSV", () => {
  expect(reportQuantityText(q(100_000_000, "mg"))).toBe("100 kg");
  expect(reportQuantityText(q(26_780_000, "mg"))).toBe("26.78 kg");
  expect(reportQuantityText(q(1500, "ml"))).toBe("1.5 L");
  expect(reportQuantityText(q(12_000, "pcs"))).toBe("12,000 pcs");
  expect(reportQuantityText(q(1 / 3, "mg"))).toBe("0.3333 mg");
  // A small amount is never shown as zero.
  expect(reportQuantityText(q(0.00004, "mg"))).toBe("< 0.0001 mg");
  expect(reportQuantityText(q(1234.56789, "mg", "entered"))).toBe("1.23456789 g");
  expect(showReportCell(q(1_000_000, "Milligram"))).toBe("1 kg");
  expect(reportQuantity(null, "mg")).toBeNull();
  expect(reportCsv({ name: "Stock", columns: ["Quantity"], rows: [{ id: "0", cells: [q(100_000_000, "mg")] }] })).toContain('"100 kg"');
});

it("exports quantities to Excel as numbers in the largest unit, formatted as on screen", async () => {
  expect(reportQuantityExcel(q(100_000_000, "mg"))).toEqual({ value: 100, numFmt: '#,##0 "kg"' });
  expect(reportQuantityExcel(q(26_785_000, "mg"))).toEqual({ value: 26.785, numFmt: '#,##0.000 "kg"' });
  expect(reportQuantityExcel(q(12, "pcs"))).toEqual({ value: 12, numFmt: '#,##0 "pcs"' });
  expect(reportQuantityExcel(q(0.00004, "mg"))).toEqual({ value: "< 0.0001 mg" });
  const bytes = await createReportWorkbook({ title: "Stock", generatedAt: "2026-11-06T06:00:00Z", filters: [], warnings: [], sheets: [{ name: "Stock", columns: ["Material", "Quantity"], rows: [{ id: "0", cells: ["Benzoyl peroxide", q(100_000_000, "mg")] }] }] }, null);
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(bytes);
  const cell = workbook.worksheets[1]?.getCell("B2");
  expect(cell?.value).toBe(100); expect(cell?.numFmt).toBe('#,##0 "kg"');
});

it("sorts quantities by their stored amount, keeping unit families apart", () => {
  const cells: ReportCell[] = [q(500, "g"), q(2, "kg"), null, q(900_000, "mg"), q(3, "pcs"), q(2, "L")];
  const sorted = [...cells].sort(compareReportCells).map((cell) => showReportCell(cell));
  // By text, "900 g" would come after "2 kg"; by amount 500 g < 900 g < 2 kg.
  expect(sorted).toEqual(["–", "500 g", "900 g", "2 kg", "2 L", "3 pcs"]);
  expect([10, 9, 100].sort(compareReportCells)).toEqual([9, 10, 100]);
  expect(["Batch 10", "Batch 9"].sort(compareReportCells)).toEqual(["Batch 9", "Batch 10"]);
});
