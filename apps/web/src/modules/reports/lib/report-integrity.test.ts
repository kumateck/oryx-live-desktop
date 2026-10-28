import { describe, expect, it } from "vitest";
import { allReportPages } from "../api/all-pages";
import { reportSheet } from "@/shared/reports/report-data";
import { worksheetName } from "@/shared/reports/worksheet-name";
import { reportFiltersSchema, emptyReportFilters } from "../schemas/report-filters";
import { binaryChoice, departmentParam, reportBoundary } from "./filter-params";
import { employeeMovementSchema, supplierMappingsSchema } from "../api/contract-adapters";
import { approvedMaterialReportSchema, vendorSummarySchema } from "../api/material-report-api";
const signal = () => new AbortController().signal;
describe("complete report snapshots", () => {
  it("loads every page and preserves genuine zeros and missing numbers", async () => {
    const rows = await allReportPages(async (page) => ({ data: [{ id: String(page), value: page === 1 ? 0 : undefined }], pageIndex: page, pageCount: 2, totalRecordCount: 2 }), (row) => row.id, signal());
    expect(reportSheet("Values", rows, [{ label: "Value", read: (row) => row.value }]).rows.map((row) => row.cells)).toEqual([[0], [null]]);
  });
  it("refuses changing counts, duplicate identities and incomplete exports", async () => {
    await expect(allReportPages(async (page) => ({ data: [{ id: "same" }], pageIndex: page, pageCount: 2, totalRecordCount: 2 }), (row) => row.id, signal())).rejects.toThrow("repeated identity");
    await expect(allReportPages(async (page) => ({ data: [{ id: String(page) }], pageIndex: page, pageCount: 2, totalRecordCount: page === 1 ? 2 : 3 }), (row) => row.id, signal())).rejects.toThrow("changed");
    await expect(allReportPages(async () => ({ data: [{ id: "1" }], pageIndex: 1, pageCount: 1, totalRecordCount: 2 }), (row) => row.id, signal())).rejects.toThrow("Not every");
  });
  it("does not start a request after cancellation", async () => {
    const controller = new AbortController(); controller.abort(); let calls = 0;
    await expect(allReportPages(async () => { calls++; return { data: [], pageCount: 1 }; }, () => "", controller.signal)).rejects.toThrow("cancelled");
    expect(calls).toBe(0);
  });
  it("preserves enum zero and calendar day boundaries", () => {
    expect(binaryChoice("0")).toBe(0); expect(departmentParam(emptyReportFilters())).toEqual({});
    expect(reportBoundary(new Date(2026, 9, 21), true)).toBe("2026-10-21T23:59:59.999Z");
    expect(reportFiltersSchema.safeParse({ ...emptyReportFilters(), month: "2026-13" }).success).toBe(false);
  });
  it("uses repository response shapes without dropping totals", () => {
    expect(employeeMovementSchema.parse({ departments: [], totals: { permanentNew: 0, netMovement: -2 } })[0]?.totals?.netMovement).toBe(-2);
    expect(supplierMappingsSchema.parse([])).toEqual([]);
    expect(approvedMaterialReportSchema.parse([{ totalAvailableQuantity: 0 }])[0]?.totalAvailableQuantity).toBe(0);
    expect(() => approvedMaterialReportSchema.parse({ data: [], pageCount: 2 })).toThrow();
    expect(vendorSummarySchema.parse([{ vendorCount: 0 }])[0]?.vendorCount).toBe(0);
  });
  it("makes legal unique Excel sheet names case-insensitively", () => {
    const used = new Set<string>(); expect(worksheetName("Test/Sheet\\Name", used)).toBe("Test Sheet Name");
    expect(worksheetName("test sheet name", used)).toBe("test sheet name (1)");
    expect(worksheetName("X".repeat(40), used)).toHaveLength(31);
    expect(worksheetName("X".repeat(40), used)).toHaveLength(31);
  });
});
