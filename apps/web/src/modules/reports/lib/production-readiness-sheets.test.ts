import { expect, it } from "vitest";
import { createReportWorkbook } from "@/shared/reports/export-workbook";
import { productionReadinessSheets } from "./production-readiness-sheets";
import { readinessFixture } from "../test/production-readiness-fixture";

it("exports the complete server snapshot with every check, exact prices, zeroes, identities and totals", async () => {
  const report = readinessFixture();
  const sheets = productionReadinessSheets(report);
  const first = sheets[0]; if (!first) throw new Error("Fixture sheet missing");
  expect(first.columns).toContain("STP"); expect(first.columns).toContain("ARD");
  expect(new Set(first.columns).size).toBe(first.columns.length);
  expect(first.columns).toContain("Packing style check");
  expect(first.columns).toContain("Schedule product IDs");
  expect(first.rows[0]?.cells[first.columns.indexOf("Unit price")]).toBe(1.1234567);
  const bytes = await createReportWorkbook({ title: "Readiness", generatedAt: report.generatedAt,
    filters: [{ label: "Department", value: report.departmentName }], sheets, warnings: [] }, "Reviewer");
  const { default: ExcelJS } = await import("exceljs");
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(bytes);
  expect(workbook.worksheets).toHaveLength(sheets.length + 1);
  const totals = workbook.getWorksheet("Production totals");
  expect(totals?.lastRow?.getCell(3).value).toBe(2);
  expect(totals?.lastRow?.getCell(4).value).toBe(1000000);
});
