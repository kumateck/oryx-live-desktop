import { describe, expect, it } from "vitest";
import { mapColumns, materialStock, missingColumns, rowProblems, switchUnit, toSmallestUnits } from "./sheets";
import { buildWorkbook, neutralise, parseWorkbook, pickHeaderRow } from "./workbook";

describe("upload sheets", () => {
  it("finds columns by name and reports the ones a sheet lacks", () => {
    const columns = mapColumns(["Material Name", "Material Code", "Batch No", "Qty", "UoM", "Expiry Date"], materialStock);
    expect(columns).toMatchObject({ materialName: "Material Name", materialCode: "Material Code", batch: "Batch No", quantity: "Qty", unit: "UoM", expiry: "Expiry Date", shelf: null });
    expect(missingColumns(materialStock, mapColumns(["Material Name"], materialStock))).toEqual(["Material code", "Batch number", "Quantity", "Unit"]);
  });
  it("flags empty required cells and non-numeric quantities", () => {
    const columns = mapColumns(["Material Name", "Material Code", "Batch No", "Qty", "UoM"], materialStock);
    expect(rowProblems({ "Material Name": "Lactose", "Material Code": "", "Batch No": "B1", Qty: "two", UoM: "kg" }, materialStock, columns)).toEqual(["Material code is empty", "Quantity is not a number"]);
  });
  it("uploads quantities in the smallest unit and switches units within a family", () => {
    const columns = mapColumns(["Qty", "UoM"], materialStock);
    expect(toSmallestUnits([{ Qty: 2, UoM: "kg" }], columns)).toEqual([{ Qty: 2_000_000, UoM: "mg" }]);
    expect(switchUnit({ Qty: 1500, UoM: "g" }, columns, "kg")).toEqual({ Qty: 1.5, UoM: "kg" });
  });
  it("keeps formula-like text as text and finds the header row below a title", () => {
    expect(neutralise("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(pickHeaderRow([["Stock report"], ["EmpId", "Name", "Time", "WorkState"], ["1", "Ama", "x", "In"]])).toBe(1);
  });
  it("reads back a workbook it wrote", async () => {
    const file = await buildWorkbook([{ "Material Name": "Lactose", Qty: 5 }], ["Material Name", "Qty"], "stock");
    expect(file.name).toBe("stock.xlsx");
    const parsed = await parseWorkbook(file);
    expect(parsed).toEqual({ headers: ["Material Name", "Qty"], rows: [{ "Material Name": "Lactose", Qty: 5 }] });
  });
});
