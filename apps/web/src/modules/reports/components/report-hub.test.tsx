// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useParams } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useCurrentUser } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { ReportHub } from "./report-hub";
import { ReportPage } from "./report-page";

afterEach(() => { cleanup(); forgetSession(); });
function Ready() { return useCurrentUser() ? <p>Session ready</p> : null; }
function renderAt(path: string, permissions: string[]) {
  stubBackend({ permissions, departmentType: 1 }); rememberSession();
  render(<SessionProvider><ApiProvider><MemoryRouter initialEntries={[path]}><Ready /><Routes>
    <Route path="/reports" element={<ReportHub />} />
    <Route path="/reports/:report" element={<RouteReport />} />
  </Routes></MemoryRouter></ApiProvider></SessionProvider>);
}
function RouteReport() { return <ReportPage slug={useParams().report} />; }

it("shows only the reports whose own key the user holds", async () => {
  renderAt("/reports", ["CanViewApprovedManufacturerListReport"]);
  await screen.findByText("Session ready");
  expect(screen.getByRole("link", { name: "Approved manufacturer list" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Suppliers and manufacturers" })).toBeTruthy();
  // A neighbour in the same subject needs its own key.
  expect(screen.queryByRole("link", { name: "Supplier and manufacturer mapping" })).toBeNull();
  expect(screen.queryByRole("link", { name: "Employee master list" })).toBeNull();
  expect(screen.queryByRole("button", { name: /People/ })).toBeNull();
});

it("no longer opens a report with the old group key", async () => {
  renderAt("/reports/approved-manufacturer-list", ["CanViewProcurementReport"]);
  await screen.findByText("Session ready");
  expect(await screen.findByText("You don't have access to this page")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Choose filters/ })).toBeNull();
});

it("refuses a report the user's role does not include", async () => {
  renderAt("/reports/employee-master-list", ["CanViewApprovedManufacturerListReport"]);
  await screen.findByText("Session ready");
  expect(await screen.findByText("You don't have access to this page")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Choose filters/ })).toBeNull();
});

it("opens an allowed report with its summary and detail tabs", async () => {
  renderAt("/reports/material-stock", ["CanViewMaterialStockSummaryReport", "CanViewMaterialStockDetailReport"]);
  await screen.findByText("Session ready");
  expect(await screen.findByRole("tab", { name: "Summary" })).toBeTruthy();
  expect(screen.getByRole("tab", { name: "Detail" })).toBeTruthy();
  expect(screen.getByRole("button", { name: /Choose filters/ })).toBeTruthy();
});

it("shows only the view the user holds when a report has two", async () => {
  renderAt("/reports/material-stock", ["CanViewMaterialStockDetailReport"]);
  await screen.findByText("Session ready");
  expect(await screen.findByRole("button", { name: /Choose filters/ })).toBeTruthy();
  expect(screen.queryByRole("tab", { name: "Summary" })).toBeNull();
});

it("shows the BMR issued by product tab only to holders of its own key", async () => {
  renderAt("/reports/bmr-issued?view=by-product", ["CanViewBmrIssuedByProductReport"]);
  await screen.findByText("Session ready");
  expect(await screen.findByRole("button", { name: /Choose filters/ })).toBeTruthy();
  expect(screen.queryByRole("tab", { name: "By date" })).toBeNull();
  cleanup(); forgetSession();
  renderAt("/reports/bmr-issued", ["CanViewBmrIssuedReport", "CanViewBmrIssuedByProductReport"]);
  await screen.findByText("Session ready");
  expect(await screen.findByRole("tab", { name: "By product" })).toBeTruthy();
});

it("opens a production report with its own key and not with a neighbouring production key", async () => {
  renderAt("/reports/production-monthly-report", ["CanViewProductionMonthlyReport"]);
  await screen.findByText("Session ready");
  expect(await screen.findByRole("button", { name: /Choose filters/ })).toBeTruthy();
  cleanup(); forgetSession();
  renderAt("/reports/batch-value", ["CanViewProductionMonthlyReport"]);
  await screen.findByText("Session ready");
  expect(await screen.findByText("You don't have access to this page")).toBeTruthy();
});

it("shows each specification kind only to holders of that kind's print key", async () => {
  renderAt("/reports/specifications", ["CanExportRawMaterialSpecification"]);
  await screen.findByText("Session ready");
  expect(await screen.findByRole("searchbox", { name: "Search raw material specifications" })).toBeTruthy();
  expect(screen.queryByRole("tab", { name: "Product" })).toBeNull();
  cleanup(); forgetSession();
  renderAt("/reports/specifications", ["CanViewProductionMonthlyReport"]);
  await screen.findByText("Session ready");
  expect(await screen.findByText("You don't have access to this page")).toBeTruthy();
});
