import { describe, expect, it } from "vitest";
import type { SupplierMapping } from "../api/contract-adapters";
import { emptyReportFilters } from "../schemas/report-filters";
import { amlColumn, approvalStatus, approvedManufacturerSheet, approvedManufacturerSummary, approvedManufacturerTitle } from "./approved-manufacturers";
import { reportCatalog } from "./catalog";
import { reportEntries, reportLink } from "./report-directory";

const today = new Date(2026, 10, 15);
const mapping = (code: string, name: string, manufacturer: string, validityDate: string | null, kind = 0): SupplierMapping => ({
  manufacturers: { id: `m-${manufacturer}`, name: manufacturer, address: "Ankleshwar, Gujarat, India", approvedAt: "2024-06-01T00:00:00Z", validityDate },
  supplier: { id: "s-1", name: "Indosol Export", address: null, approvedAt: null, validityDate: null },
  uom: { id: "u", name: "Kilogram", symbol: "kg" },
  materials: [{ material: { id: `x-${code}`, name, code, kind }, quantityPerPackOption: { min: 25, max: null, values: null } }],
});

describe("approved manufacturer list", () => {
  it("marks approvals as valid, expiring within six months, expired, or undated", () => {
    expect(approvalStatus("2027-06-30T00:00:00Z", today)).toBe("Valid");
    expect(approvalStatus("2027-05-15T00:00:00Z", today)).toBe("Expiring");
    expect(approvalStatus("2026-11-14T00:00:00Z", today)).toBe("Expired");
    expect(approvalStatus("2026-11-15T00:00:00Z", today)).toBe("Expiring");
    expect(approvalStatus(null, today)).toBe("No validity date");
  });

  it("orders rows by item code, numbers them, and shows dates as month and year", () => {
    const sheet = approvedManufacturerSheet([mapping("RMA010", "Zinc", "B", "2027-06-30T00:00:00Z"), mapping("RMA002", "Albendazole", "A", "2027-06-30T00:00:00Z")], today);
    expect(sheet.rows.map((row) => row.cells[amlColumn.code])).toEqual(["RMA002", "RMA010"]);
    expect(sheet.rows.map((row) => row.cells[amlColumn.number])).toEqual([1, 2]);
    expect(sheet.rows[0]?.cells[amlColumn.approvedOn]).toBe("Jun 2024");
    expect(sheet.rows[0]?.cells[amlColumn.validUntil]).toBe("Jun 2027");
    expect(sheet.rows[0]?.cells[amlColumn.pack]).toBe(25);
  });

  it("counts distinct materials, approved sources and approvals running out", () => {
    const sheet = approvedManufacturerSheet([
      mapping("RMA002", "Albendazole", "A", "2027-06-30T00:00:00Z"), mapping("RMA002", "Albendazole", "B", "2027-01-31T00:00:00Z"),
      mapping("RMA003", "Alginic acid", "C", "2025-06-30T00:00:00Z"),
    ], today);
    expect(approvedManufacturerSummary(sheet)).toEqual({ materials: 2, approvals: 3, expiring: 1, expired: 1 });
  });

  it("titles the list after the chosen material type", () => {
    const filters = emptyReportFilters();
    expect(approvedManufacturerTitle(filters)).toBe("Approved manufacturer list for raw and packaging materials");
    filters.selections.materialKind = [{ value: "1", label: "Packaging material" }];
    expect(approvedManufacturerTitle(filters)).toBe("Approved manufacturer list for packaging materials");
  });
});

describe("report directory", () => {
  it("lists every report exactly once, under a unique address", () => {
    const keys = reportEntries.flatMap((entry) => entry.views.map((view) => view.key));
    expect(new Set(keys).size).toBe(keys.length);
    expect([...keys].sort((a, b) => a - b)).toEqual(reportCatalog.map((definition) => definition.key).sort((a, b) => a - b));
    expect(new Set(reportEntries.map((entry) => entry.slug)).size).toBe(reportEntries.length);
  });

  it("links a summary or detail report to its tab", () => {
    expect(reportLink(reportCatalog[2]!.key)).toBe("/reports/material-stock?view=detail");
    expect(reportLink(reportCatalog.find((definition) => definition.title === "Approved manufacturer list")!.key)).toBe("/reports/approved-manufacturer-list");
  });
});
