import { describe, expect, it } from "vitest";
import type { LineDto, MigrationDto } from "../api/stock-migration-api";
import { approvalBlocker, comparisonChange, lineFormValues, lineRequest, monthValue, shelfOptions } from "./stock-migration";

const draft: MigrationDto = { id: "m1", status: 0, ok: 3, warning: 1, blocked: 0, skipped: 2, excluded: 0, total: 6 };
const line: LineDto = {
  id: "l1", sheet: "Raw Material", rowNumber: 4, materialCode: "RMA003", warehouseName: "SYRUP Raw Warehouse", shelfName: "G/9/B", resolvedShelfId: "s1",
  batchNumber: "H242604001", unitSymbol: "mg", quantityInSheet: 360, manufacturingDate: "2026-04-01T00:00:00Z", expiryDate: "2028-04-01T00:00:00Z", excluded: false,
};
const shelves = shelfOptions([{ id: "w1", name: "SYRUP Raw Warehouse", shelves: [{ id: "s1", name: "G/09/B" }] }]);

describe("stock migration", () => {
  it("allows approval only for a draft with stock and no blocked rows", () => {
    expect(approvalBlocker(draft)).toBeNull();
    expect(approvalBlocker({ ...draft, blocked: 2 })).toBe("2 row(s) still need fixing or leaving out.");
    expect(approvalBlocker({ ...draft, ok: 0, warning: 0 })).toBe("No row has stock to load.");
    expect(approvalBlocker({ ...draft, status: 1 })).toMatch(/already been approved/);
  });

  it("starts the dialog from the row as read and sends months as UTC dates", () => {
    const values = lineFormValues(line, shelves);
    expect(values).toMatchObject({ materialCode: "RMA003", shelf: { value: "s1", label: "G/09/B · SYRUP Raw Warehouse" }, manufactured: "2026-04", expiry: "2028-04" });
    expect(lineRequest(line, { ...values, quantityInSheet: Number.NaN, expiry: "2030-03" })).toMatchObject({
      shelfId: "s1", shelfName: "G/9/B", quantityInSheet: null, expiryDate: "2030-03-01T00:00:00Z", materialId: null,
    });
    expect(monthValue("2030-3")).toBeNull();
  });

  it("names how each material's stock changes", () => {
    expect(comparisonChange({ current: 5, new: 0 })).toBe("removed");
    expect(comparisonChange({ current: 0, new: 5 })).toBe("added");
    expect(comparisonChange({ current: 5, new: 4 })).toBe("changed");
    expect(comparisonChange({ current: 5, new: 5 })).toBe("same");
  });
});
