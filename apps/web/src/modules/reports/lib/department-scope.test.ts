import { expect, it } from "vitest";
import { emptyReportFilters } from "../schemas/report-filters";
import { reportCatalog } from "./catalog";
import { lockedReportDepartment, withReportDepartment } from "./department-scope";
import { ReportKey } from "./report-model";

const account = (departmentType: 0 | 1 | 2 | null) => ({ departmentId: "dept-1", department: "Oral solids", departmentType });
const withDepartment = reportCatalog.filter((definition) => (definition.fields as readonly string[]).includes("department"));

it("fixes every department-filtered report to a production user's own department", () => {
  expect(withDepartment.length).toBeGreaterThan(15);
  for (const definition of withDepartment)
    expect(lockedReportDepartment(definition, account(0))).toEqual({ value: "dept-1", label: "Oral solids", name: "Oral solids" });
});

it("lets non-production, R&D and unassigned accounts choose, and ignores reports without a department", () => {
  for (const definition of withDepartment) {
    expect(lockedReportDepartment(definition, account(1))).toBeNull();
    expect(lockedReportDepartment(definition, account(2))).toBeNull();
    expect(lockedReportDepartment(definition, { departmentId: null, department: null, departmentType: null })).toBeNull();
  }
  const purchaseOrders = reportCatalog.find((definition) => definition.key === ReportKey.PurchaseOrders);
  if (!purchaseOrders) throw new Error("Missing report");
  expect(lockedReportDepartment(purchaseOrders, account(0))).toBeNull();
});

it("replaces any chosen departments with the fixed one", () => {
  const own = { value: "dept-1", label: "Oral solids" };
  const chosen = { ...emptyReportFilters(), selections: { ...emptyReportFilters().selections, department: [{ value: "dept-2", label: "Liquids" }] } };
  const scoped = withReportDepartment(chosen, own);
  expect(scoped.department).toEqual(own); expect(scoped.selections.department).toEqual([own]);
  expect(withReportDepartment(chosen, null)).toBe(chosen);
});
