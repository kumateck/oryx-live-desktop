import { expect, it } from "vitest";
import ExcelJS from "exceljs";
import { createReportWorkbook } from "./export-workbook";
it("exports every sheet/field with applied filters, literal text, zero and missing values", async () => {
  const bytes = await createReportWorkbook({ title: "Audit report", generatedAt: "2026-10-21T12:00:00Z", filters: [{ label: "Store", value: "Equipment" }], warnings: ["Current snapshot"], sheets: [{ name: "Report information", columns: ["Text", "Zero", "Missing", "Boolean"], rows: [{ id: "0", cells: ["=SUM(1,2)", 0, null, false] }] }, { name: "report INFORMATION", columns: ["Number"], rows: [{ id: "0", cells: [12.34567] }] }] }, "Reviewer");
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(bytes);
  expect(workbook.worksheets).toHaveLength(3); expect(workbook.worksheets[1]?.name).toBe("Report information (1)");
  expect(workbook.worksheets[1]?.getRow(2).values).toEqual([undefined, "=SUM(1,2)", 0, undefined, false]);
  expect(workbook.worksheets[2]?.getCell("A2").value).toBe(12.34567);
  expect(workbook.worksheets[0]?.getCell("B5").value).toBe("Equipment");
});
