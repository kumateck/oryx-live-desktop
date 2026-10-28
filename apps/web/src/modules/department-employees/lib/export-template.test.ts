import { expect, it } from "vitest";
import ExcelJS from "exceljs";
import { departmentTemplateBytes } from "./export-template";
it("keeps shift-import headers in the first row of the first sheet and exports only supplied employees", async () => {
  const bytes = await departmentTemplateBytes([{ staffNumber: "TEST001", firstName: "Ama", lastName: "Test" }]);
  const workbook = new ExcelJS.Workbook(); await workbook.xlsx.load(bytes);
  expect(workbook.worksheets[0]?.getRow(1).values).toEqual([undefined, "STAFF ID", "STAFF NAME", "CATEGORY", "SHIFT TYPE"]);
  expect(workbook.worksheets[0]?.rowCount).toBe(2); expect(workbook.worksheets[0]?.getCell("A2").value).toBe("TEST001"); expect(workbook.worksheets[0]?.getCell("B2").value).toBe("Ama Test");
});
