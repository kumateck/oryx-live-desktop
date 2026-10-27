import { describe, expect, it } from "vitest";
import { InputTypes } from "@/shared/forms/input-types";
import { emptyReportFilters, reportFiltersSchema } from "../schemas/report-filters";
import { reportCatalog, reportDefinition } from "./catalog";
import { reportFilterFields } from "./filter-fields";
import { ReportKey } from "./report-model";
import { reportSelection, selectedReportCode, singleReportFilters } from "./selections";
import { appliedReportFilters } from "./applied-filters";
import { freezeHistoricalFilters, historyParams } from "./history";
import { eligibleReportDepartments, filterSupplierMappings } from "../api/lookup-choices";
import { loadScopedReport } from "../api/scoped-report";

const choice = (value: string, label = value) => ({ value, label });
const load = () => async () => ({ options: [], hasNext: false, hasPrevious: false });

describe("report selection contracts", () => {
  it("renders every optional All dropdown as a multiselect across all 33 reports", () => {
    expect(reportCatalog).toHaveLength(33);
    for (const definition of reportCatalog) {
      const fields = reportFilterFields(definition, load);
      expect(fields).toHaveLength(definition.fields.length);
      for (const field of fields) if (field.type === InputTypes.SELECT && !field.required) expect(field.mode).toBe("multiple");
    }
  });
  it("preserves zero, identities and codes through validation; required single selects still work", () => {
    const filters = emptyReportFilters();
    filters.department = choice("d", "Warehouse");
    filters.selections.materialKind = [choice("0", "Raw material")];
    filters.selections.material = [{ ...choice("m", "RM-1 · Material"), code: "RM-1", name: "Material" }];
    const validated = reportFiltersSchema.parse(filters);
    expect(singleReportFilters(validated).materialKind?.value).toBe("0");
    expect(reportSelection(validated, "department")).toEqual([filters.department]);
    expect(selectedReportCode(validated, "material", "RM-1")).toBe(true);
    expect(selectedReportCode(validated, "material", "RM-2")).toBe(false);
    expect(appliedReportFilters(reportDefinition(ReportKey.MaterialList), validated)).toContainEqual({ label: "Material type", value: "Raw material" });
  });
  it("restricts warehouse-owner departments and production-assignment departments using their actual contracts", () => {
    const departments = [
      { id: "transport", name: "Transport", type: 1 as const },
      { id: "raw", name: "Raw warehouse", type: 1 as const, warehouses: [{ type: 0 as const }] },
      { id: "pack", name: "Packaging warehouse", type: 1 as const, warehouses: [{ type: 1 as const }] },
      { id: "production", name: "Production", type: 0 as const },
      { id: "rnd", name: "R&D", type: 2 as const },
    ];
    const filters = emptyReportFilters(); filters.selections.materialKind = [choice("0")];
    expect(eligibleReportDepartments(departments, reportDefinition(ReportKey.MaterialList), filters).map((row) => row.id)).toEqual(["raw"]);
    expect(eligibleReportDepartments(departments, reportDefinition(ReportKey.MaterialStockSummary), filters).map((row) => row.id)).toEqual(["production", "rnd"]);
    expect(eligibleReportDepartments(departments, reportDefinition(ReportKey.EmployeeMaster), filters)).toEqual(departments);
  });
  it("filters procurement mappings by stable supplier/manufacturer/material IDs and material kind", () => {
    const rows = [
      { supplier: { id: "s1" }, manufacturers: { id: "f1" }, materials: [{ material: { id: "raw", kind: 0, name: "Same name" } }, { material: { id: "pack", kind: 1, name: "Same name" } }] },
      { supplier: { id: "s2" }, manufacturers: { id: "f2" }, materials: [{ material: { id: "raw", kind: 0 } }] },
    ];
    const filters = emptyReportFilters();
    filters.selections.supplier = [choice("s1")]; filters.selections.manufacturer = [choice("f1")];
    filters.selections.materialKind = [choice("0")]; filters.selections.material = [choice("raw")];
    expect(filterSupplierMappings(rows, filters)).toEqual([{ ...rows[0], materials: [rows[0]?.materials[0]] }]);
    expect(reportDefinition(ReportKey.SupplierSummary).fields).not.toContain("materialName");
  });
  it("keeps scalar-scope totals separate and cancels before later batches", async () => {
    const filters = emptyReportFilters(); filters.selections.department = Array.from({ length: 6 }, (_, i) => choice(`d${i}`));
    const controller = new AbortController(); const visited: string[] = [];
    const output = await loadScopedReport(reportDefinition(ReportKey.StaffGrade), filters, controller.signal, async (scope) => {
      visited.push(scope.department?.value ?? "all");
      return { sheets: [{ name: "Totals", columns: ["Count"], rows: [{ id: "0", cells: [10] }] }] };
    });
    expect(visited).toEqual(["d0", "d1", "d2", "d3", "d4", "d5"]);
    expect(output.sheets).toHaveLength(6); expect(output.sheets[0]?.name).toContain("Department: d0");
    expect(output.warnings?.join(" ")).toContain("must not be added");
    let calls = 0;
    await expect(loadScopedReport(reportDefinition(ReportKey.StaffGrade), filters, controller.signal, async () => {
      calls++; controller.abort(); return { sheets: [] };
    })).rejects.toThrow("cancelled");
    expect(calls).toBe(4);
  });
  it("uses separate native material IDs rather than matching potentially duplicated material codes", async () => {
    const filters = emptyReportFilters();
    filters.selections.material = [{ ...choice("m1", "Material one"), code: "SAME" }, { ...choice("m2", "Material two"), code: "SAME" }];
    const ids: string[] = [];
    await loadScopedReport(reportDefinition(ReportKey.MaterialStockDetail), filters, new AbortController().signal, async (scope) => {
      ids.push(singleReportFilters(scope).material?.value ?? "all"); return { sheets: [] };
    });
    expect(ids).toEqual(["m1", "m2"]);
  });
});

describe("historical reporting", () => {
  const capability = { protocolVersion: 1, available: true, basis: "RecordedState", serverTime: "2026-10-27T12:30:00Z", availableFrom: "2026-10-25T09:00:00Z" };
  it("adds a genuine as-of date to every requested snapshot report", () => {
    for (const key of [ReportKey.EmployeeMaster, ReportKey.StaffGrade, ReportKey.DepartmentAttendance, ReportKey.QualityProducts, ReportKey.QualityMaterials,
      ReportKey.MaterialList, ReportKey.MaterialStockSummary, ReportKey.ProductStockSummary, ReportKey.ProductList, ReportKey.StoreItems, ReportKey.StoreStock, ReportKey.VendorItems, ReportKey.VendorSummary]) {
      expect(reportDefinition(key).fields).toContain("asOfDate");
    }
  });
  it("freezes all requests to one verified UTC instant and caps today at server time", () => {
    const filters = { ...emptyReportFilters(), asOfDate: new Date(2026, 9, 27) };
    expect(historyParams(freezeHistoricalFilters(filters, capability))).toEqual({ asOfDate: "2026-10-27T12:30:00.000Z" });
    expect(historyParams(freezeHistoricalFilters({ ...filters, asOfDate: new Date(2026, 9, 26) }, capability))).toEqual({ asOfDate: "2026-10-26T23:59:59.999Z" });
    expect(historyParams(emptyReportFilters())).toEqual({});
  });
  it("rejects unsupported, unverified, pre-baseline and future snapshots instead of using current totals", () => {
    const filters = { ...emptyReportFilters(), asOfDate: new Date(2026, 9, 27) };
    expect(() => historyParams(filters)).toThrow("verified");
    expect(() => freezeHistoricalFilters(filters, { ...capability, available: false })).toThrow("not installed");
    expect(() => freezeHistoricalFilters(filters, { ...capability, protocolVersion: 2 })).toThrow("not installed");
    expect(() => freezeHistoricalFilters({ ...filters, asOfDate: new Date(2026, 9, 24) }, capability)).toThrow("Recorded history begins");
    expect(() => freezeHistoricalFilters({ ...filters, asOfDate: new Date(2026, 9, 28) }, capability)).toThrow("earlier");
  });
});
