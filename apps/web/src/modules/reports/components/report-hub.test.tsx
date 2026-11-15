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

it("shows only the reports the user may run, grouped by subject", async () => {
  renderAt("/reports", ["CanViewProcurementReport"]);
  await screen.findByText("Session ready");
  expect(screen.getByRole("link", { name: "Approved manufacturer list" })).toBeTruthy();
  expect(screen.getByRole("heading", { name: "Suppliers and manufacturers" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Employee master list" })).toBeNull();
  expect(screen.queryByRole("button", { name: /People/ })).toBeNull();
});

it("refuses a report the user's role does not include", async () => {
  renderAt("/reports/employee-master-list", ["CanViewProcurementReport"]);
  await screen.findByText("Session ready");
  expect(await screen.findByText("You don't have access to this page")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Choose filters/ })).toBeNull();
});

it("opens an allowed report with its summary and detail tabs", async () => {
  renderAt("/reports/material-stock", ["CanViewWarehouseReport"]);
  await screen.findByText("Session ready");
  expect(await screen.findByRole("tab", { name: "Summary" })).toBeTruthy();
  expect(screen.getByRole("tab", { name: "Detail" })).toBeTruthy();
  expect(screen.getByRole("button", { name: /Choose filters/ })).toBeTruthy();
});
