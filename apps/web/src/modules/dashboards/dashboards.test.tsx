// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import FgtnRoute from "../../pages/(workspace)/fgtn-dashbord/page";
import HomeRoute from "../../pages/(workspace)/home/page";
import HrRoute from "../../pages/(workspace)/hr-dashboard/page";
import HrSummaryRoute from "../../pages/(workspace)/hr-executive-summary/page";
import InventoryRoute from "../../pages/(workspace)/inventory-command-center/page";
import ProductionRoute from "../../pages/(workspace)/production-health-dashboard/page";
import QualityRoute from "../../pages/(workspace)/qa-qc-dashboard/page";
import QaRoute from "../../pages/(workspace)/qa-qc-dashboard/qa/page";
import QcRoute from "../../pages/(workspace)/qa-qc-dashboard/qc/page";
import WarehouseRoute from "../../pages/(workspace)/warehouse-dashboard/page";
import { ApiProvider } from "../../shared/api/api-provider";
import { SessionProvider } from "../../shared/auth/session-provider";
import { compactNumber, plural } from "../../shared/dashboard/report-values";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { pendingTransfers as fgtnPendingTransfers, totalOr } from "./fgtn-dashboard";
import { expiringSoon, utilisationTone } from "./inventory-command-center";
import { attendanceRate, attendanceShare, genderTotals, hrDepartments } from "./lib/hr-kpis";
import { bmrRelease, returnTone, scheduleFulfilment, yieldPerformance } from "./lib/production-kpis";
import { byShortfall, quantityText, summariseDockToStock, summariseExpiry, summariseTransfers } from "./lib/warehouse-kpis";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

it("works out the warehouse figures without combining what cannot be combined", () => {
  // Weighted by receipts: (10 x 1 + 2 x 3) / 4. Two warehouses have no shared median.
  expect(summariseDockToStock([{ averageHours: 10, medianHours: 9, totalRecords: 1, period: null }, { averageHours: 2, medianHours: 2, totalRecords: 3, period: null }])).toEqual({ totalRecords: 4, averageHours: 4, medianHours: null });
  expect(summariseDockToStock([{ averageHours: 5, medianHours: 4, totalRecords: 2, period: null }]).medianHours).toBe(4);
  expect(summariseTransfers([{ totalTransfers: 10, pending: 2, approved: 1, issued: 5 }])).toMatchObject({ rejected: 2, fulfilment: 50 });
  const expiry = summariseExpiry([{ expiryWindow: "≤ 30 days", batchCount: 2, totalQuantity: "1500000", uom: "mg" }, { expiryWindow: "≤ 30 days", batchCount: 1, totalQuantity: 2000, uom: "ml" }, { expiryWindow: "> 90 days", batchCount: 7, totalQuantity: null, uom: null }]);
  expect(expiry[0]).toEqual({ label: "≤ 30 days", batches: 3, quantities: [{ uom: "mg", quantity: 1_500_000 }, { uom: "ml", quantity: 2000 }] });
  expect([expiringSoon(expiry), quantityText(1_500_000, "mg"), quantityText(3, "pcs")]).toEqual([3, "1.5 kg", "3 pcs"]);
  expect(byShortfall([{ shortfall: 1 }, { shortfall: 9 }] as never).map((item) => item.shortfall)).toEqual([9, 1]);
  expect([utilisationTone(95), utilisationTone(80), utilisationTone(10)]).toEqual(["danger", "warning", "success"]);
});

it("works out the production, finished goods and HR figures", () => {
  expect(scheduleFulfilment({ newScheduleCount: 1, inProgressScheduleCount: 1, delayedScheduleCount: 1, completedScheduleCount: 6, cancelledScheduleCount: 1 })).toBe(60);
  expect([scheduleFulfilment(null), bmrRelease([{ totalBmrs: 8, issued: 6 }]).rate, yieldPerformance([{ expectedYield: 200, actualQuantityPacked: 190, batchCount: 3 }])]).toEqual([0, 75, { batches: 3, rate: 95 }]);
  expect([returnTone(20), returnTone(6), returnTone(1)]).toEqual(["danger", "warning", "success"]);
  expect([totalOr(0, 2, 3), totalOr(9, 2, 3)]).toEqual([5, 9]);
  expect(fgtnPendingTransfers({ stockTransfers: { incoming: { inProgressCount: 1, approvedCount: 2 }, outgoing: { inProgressCount: 3, approvedCount: 4 } } })).toBe(10);
  // No attendance recorded is not the same as nobody present.
  expect([attendanceShare(null), attendanceShare({ numberOfPresentEmployees: 3, numberOfAbsentEmployees: 1 })]).toEqual([null, 75]);
  expect([genderTotals([{ totalMale: 6, totalFemale: 4 }]).femaleShare, attendanceRate([{ present: 9, expectedTotal: 10 }, { present: 0, expectedTotal: 0 }])]).toEqual([40, 90]);
  expect(hrDepartments([{ id: "2", name: " hr " }, { id: "1", name: "Tablet" }, { id: "3", name: "Canteen" }])).toEqual([{ value: "1", label: "Tablet" }, { value: "2", label: "HR" }]);
  expect([compactNumber(1_250_000), compactNumber(999_999), plural(1, "batch", "batches"), plural(2, "day")]).toEqual(["1.3M", "999,999", "1 batch", "2 days"]);
});

const reports: Record<string, unknown> = {
  "/api/v1/warehouse": { data: [{ id: "w1", name: "Raw store", type: 0, division: 1 }, { id: "w2", name: "Beta store", type: 0, division: 0 }] },
  "/api/v1/department": { data: [{ id: "d1", name: "Tablet" }, { id: "d2", name: "Syrup" }] },
  "/api/v1/report/warehouse-kpi/capacity-utilisation": [{ department: "Stores", warehouse: "Raw store", totalShelves: 40, occupiedShelves: 38, availableShelves: 2, utilisationPercentage: 95 }],
  "/api/v1/report/warehouse-kpi/dock-to-stock": [{ averageHours: 6.25, medianHours: 5, totalRecords: 8 }],
  "/api/v1/report/warehouse-kpi/stock-transfer-fulfilment": [{ totalTransfers: 10, pending: 2, approved: 1, issued: 5 }],
  "/api/v1/report/warehouse-kpi/receiving-pipeline": [{ pending: 1, arrived: 2, checked: 3, grnGenerated: 4, distributed: 5, assigned: 6, total: 21 }],
  "/api/v1/report/warehouse-kpi/expiry-risk-index": [{ expiryWindow: "≤ 30 days", batchCount: 2, totalQuantity: "1500000", uom: "mg" }, { expiryWindow: "61–90 days", batchCount: 4, totalQuantity: "10", uom: "pcs" }],
  "/api/v1/report/warehouse-kpi/reorder-alert-count": [{ department: "Stores", material: "Maize starch", materialCode: "RM-1", currentStock: 1_000_000, reorderLevel: 5_000_000, shortfall: 4_000_000, uom: "mg" }],
  "/api/v1/report/warehouse-kpi/swap-request-activity": [{ period: "This week", pending: 1, approved: 2, rejected: 0, total: 3 }],
  "/api/v1/report/warehouse-kpi/material-movement-count": [{ period: "All time", newPutaways: 11, adjustments: 2, totalMovements: 13 }],
  "/api/v1/report/warehouse-kpi/freshness": [{ source: "Warehouse Master", recordCount: 4, lastChangedAt: "2026-09-30T10:00:00Z" }],
  "/api/v1/report/warehouse/inventory-valuation-summary": [{ warehouse: "Raw store", totalValue: "2500000.50" }, { warehouse: "Beta store", totalValue: "1000" }],
  "/api/v1/report/warehouse/slow-moving-inventory": [{ material: "Lactose", materialCode: "RM-2", batchNo: "B-9", warehouse: "Raw store", daysSinceLastMove: 120, estValue: 800 }],
  "/api/v1/report/fgtn/dashboard-kpi": { totalCustomers: 14, productCount: { totalProducts: 0, betaProducts: 3, nonBetaProducts: 5 }, productionOrders: { totalProductionOrders: 9, pendingProductionOrders: 4, partialPackingReady: 3, fullPackingReady: 2 },
    finishedGoodsTransferNotes: { totalFgtnTransferNotes: 6, pendingTransferNote: 1, acceptedTransferNote: 5 }, inventorySummary: [{ uom: "packs", availableQuantity: 1200, batchCount: 7 }], dispatchPipeline: { total: 4, awaitingArrival: 3, arrived: 1 } },
  "/api/v1/report/kpi/fgtn-pending-approval": [{ fromDepartment: "Tablet", pendingApproval: 2, approved: 5, averageAgingDays: 1.5 }],
  "/api/v1/report/kpi/production-order-delivery-status": [{ statusName: "Open", orderCount: 9, allocatedCount: 4, loaded: 2, delivered: 1 }],
  "/api/v1/report/warehouse-dashboard": { stockTransfers: { incoming: { inProgressCount: 1, approvedCount: 2 }, outgoing: { inProgressCount: 0, approvedCount: 1 } } },
  "/api/v1/report/product-stock-summary": [{ productName: "Paracetamol 500", productCode: "P-1", productionDepartment: "Tablet", warehouse: "FG store", numberOfBatches: 3, totalQuantity: 900, uomName: "packs" }],
  "/api/v1/report/production-dashboard": { requisitionReport: { newRequisitionsCount: 1, pendingRequisitionsCount: 2, sourcedRequisitionsCount: 3, completedRequisitionsCount: 4 },
    productionScheduleReport: { newScheduleCount: 1, inProgressScheduleCount: 1, delayedScheduleCount: 1, completedScheduleCount: 6, cancelledScheduleCount: 1 }, stockTransferReport: { inProgressCount: 2, approvedCount: 1, issuedCount: 5, rejectedCount: 0 },
    materialsBelowReorderLevel: [{ materialName: "Gelatin", materialCode: "RM-7", currentQuantity: 2_000_000, reOrderLevel: 9_000_000, uomSymbol: "mg" }] },
  "/api/v1/report/kpi/schedule-adherence": [{ department: "Tablet", onTime: 8, delayed: 2, adherencePercentage: 80 }],
  "/api/v1/report/kpi/bmr-release-rate": [{ totalBmrs: 8, issued: 6 }],
  "/api/v1/report/kpi/yield-performance": [{ expectedYield: 200, actualQuantityPacked: 190, batchCount: 3 }],
  "/api/v1/report/kpi/production-output-volume": [{ department: "Tablet", totalBatchCount: 12 }, { department: "Syrup", totalBatchCount: 30 }],
  "/api/v1/report/kpi/atr-testing-backlog": [{ department: "Tablet", totalBacklog: 5, testing: 2, oldestWaitingDays: 9 }],
  "/api/v1/report/kpi/material-return-rate": [{ department: "Tablet", totalIssuedQuantity: 1000, totalReturnedQuantity: 200, returnRatePercentage: 20 }],
  "/api/v1/report/kpi/stock-requisition-pending": [{ inProgress: 3 }],
  "/api/v1/report/qa-dashboard": { numberOfBmrRequests: 0, numberOfPendingBmrRequests: 2, numberOfApprovedBmrRequests: 3, numberOfRejectBmrRequests: 1, numberOfAnalyticalTestRequests: 17, numberOfExpiredAnalyticalTestRequests: 4, numberOfPendingApprovals: 5, numberOfApprovals: 6,
    numberOfRejectedApprovals: 1, numberOfManufacturers: 11, numberOfApprovedManufacturers: 8, numberOfProducts: 20, numberOfRawMaterials: 30, numberOfPackingMaterials: 12 },
  "/api/v1/report/qc-dashboard": { numberOfStpRawMaterials: 21, numberOfStpProducts: 13, numberOfAnalyticalRawData: 8, numberOfBatchTestCountRawMaterials: 0, numberOfBatchTestPendingRawMaterials: 2, numberOfBatchTestApprovedRawMaterials: 5, numberOfBatchTestRejectedRawMaterials: 1,
    numberOfPendingApprovals: 3, numberOfApprovals: 9, numberOfRejectedApprovals: 2 },
  "/api/v1/report/materials-ready-for-checklist": [{ id: "a" }, { id: "b" }, { id: "c" }],
  "/api/v1/report/materials-ready-for-assignment": [{ id: "a" }],
  "/api/v1/report/human-resource": { totalEmployees: 120, numberOfPermanentEmployees: 100, numberOfCasualEmployees: 20, numberOfActiveEmployees: 110, numberOfInactiveEmployees: 10, numberOfNewEmployees: 4, numberOfLeaveRequests: 9, numberOfPendingLeaveRequests: 3,
    numberOfOvertimeRequests: 7, numberOfExpiredOvertimeRequests: 2, numberOfExitPasses: 5 },
  "/api/v1/report/hr-kpi/employee-gender-ratio": [{ totalMale: 60, totalFemale: 40 }],
  "/api/v1/report/hr-kpi/employee-headcount": [{ department: "Tablet", totalActive: 50, permanentActive: 45, casualActive: 5 }],
  "/api/v1/report/hr-kpi/new-hires-this-period": [{ department: "Tablet", permanentNewHires: 2, casualNewHires: 1, totalNewHires: 3 }],
  "/api/v1/report/hr-kpi/employee-turnover-rate": [{ department: "Tablet", turnoverRatePercent: 4.5 }],
  "/api/v1/report/hr-kpi/leave-utilisation-rate": [{ department: "Tablet", staffDueForLeave: 6, totalDaysUsed: 30, totalDaysAllowed: 120, utilisationPercent: 25 }],
  "/api/v1/report/hr-kpi/active-disciplinary-actions": [{ department: "Tablet", underQuestion: 1, formalWarning: 2, finalWarning: 0, suspended: 1, totalUnderDisciplinaryAction: 4 }],
  "/api/v1/report/hr-kpi/daily-attendance-rate": [{ present: 45, expectedTotal: 50 }],
  "/api/v1/report/hr-kpi/leave-request-pipeline": [{ pending: 3, approved: 5, rejected: 1 }],
  "/api/v1/report/hr-kpi/overtime-request-activity": [{ count: 4, totalHoursRequested: 20, approvedHours: 12 }],
  "/api/v1/report/hr-kpi/staff-requisition-pipeline": [{ count: 2, totalPositionsRequired: 5 }],
  "/api/v1/report/hr-kpi/employee-grade-level-distribution": [{ total: 50, juniorStaff: 30, seniorStaff: 15, seniorManagement: 5 }],
};

function open(address: string, options: { permissions?: string[]; failing?: string[]; departmentType?: 0 | 1 } = {}) {
  const backend = stubBackend({ permissions: options.permissions ?? [], departmentType: options.departmentType ?? 1 });
  rememberSession();
  const calls: string[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push(`${url.pathname}${url.search}`);
    if (options.failing?.includes(url.pathname)) return new Response(null, { status: 500 });
    return url.pathname in reports ? Response.json(reports[url.pathname]) : new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/home", element: <HomeRoute /> }, { path: "/warehouse-dashboard", element: <WarehouseRoute /> }, { path: "/fgtn-dashbord", element: <FgtnRoute /> }, { path: "/inventory-command-center", element: <InventoryRoute /> },
    { path: "/production-health-dashboard", element: <ProductionRoute /> }, { path: "/qa-qc-dashboard", element: <QualityRoute /> }, { path: "/qa-qc-dashboard/qa", element: <QaRoute /> }, { path: "/qa-qc-dashboard/qc", element: <QcRoute /> },
    { path: "/hr-dashboard", element: <HrRoute /> }, { path: "/hr-executive-summary", element: <HrSummaryRoute /> }, { path: "*", element: <p>Another page</p> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}
const card = (name: string) => within(screen.getByRole("region", { name }));
const query = (calls: string[], path: string) => calls.filter((call) => call === path || call.startsWith(`${path}?`)).map((call) => new URLSearchParams(call.split("?")[1] ?? ""));

it("shows the warehouse dashboard, and narrows the period of one card without refetching the rest", async () => {
  const calls = open("/warehouse-dashboard");
  expect(await screen.findByText("38 of 40 shelves")).toBeTruthy();
  expect(card("Capacity utilisation").getByText("95.0%")).toBeTruthy();
  // One warehouse in scope, so its median is shown.
  expect(card("Dock-to-stock time").getByText("5.0 hrs")).toBeTruthy();
  expect(card("Transfer fulfilment").getByText("5 of 10 issued")).toBeTruthy();
  expect(card("Expiry risk index").getByText("2 critical")).toBeTruthy();
  expect(card("Expiry risk index").getByText(/1\.5 kg/)).toBeTruthy();
  expect(card("Reorder alerts").getByText("Short 4 kg")).toBeTruthy();
  expect(card("Data freshness").getByText("Warehouse Master")).toBeTruthy();
  expect(screen.getByRole("link", { name: /Inbound/ }).getAttribute("href")).toBe("/warehouse/receiving-area");
  // Dock and swaps start on this week (1); transfers and movements are always all time (3).
  expect([query(calls, "/api/v1/report/warehouse-kpi/dock-to-stock")[0]?.get("datePreset"), query(calls, "/api/v1/report/warehouse-kpi/stock-transfer-fulfilment")[0]?.get("datePreset")]).toEqual(["1", "3"]);
  const swaps = query(calls, "/api/v1/report/warehouse-kpi/swap-request-activity").length;
  await userEvent.click(within(screen.getByRole("group", { name: "Dock-to-stock period" })).getByRole("button", { name: "Today" }));
  await screen.findByText("Average, today");
  expect(query(calls, "/api/v1/report/warehouse-kpi/dock-to-stock").at(-1)?.get("datePreset")).toBe("0");
  expect(query(calls, "/api/v1/report/warehouse-kpi/swap-request-activity")).toHaveLength(swaps);
  // A warehouse can only be chosen once a division is.
  expect(screen.getByRole("combobox", { name: "Warehouse" }).hasAttribute("disabled")).toBe(true);
});

it("keeps the cards it could load when one report fails, and says which could not be loaded", async () => {
  open("/warehouse-dashboard", { failing: ["/api/v1/report/warehouse-kpi/reorder-alert-count"] });
  expect(await screen.findByText("38 of 40 shelves")).toBeTruthy();
  expect(screen.getByText("Some figures could not be loaded. The cards that have them are still shown.")).toBeTruthy();
  expect(card("Reorder alerts").getByRole("button", { name: "Retry" })).toBeTruthy();
});

it("shows finished goods, making up a total the server left at zero from its parts", async () => {
  const calls = open("/fgtn-dashbord");
  expect(await screen.findByText("1,200 packs")).toBeTruthy();
  const products = screen.getByRole("link", { name: /Products/ });
  expect([within(products).getByText("8"), products.getAttribute("href")]).toEqual([expect.anything(), "/warehouse/approved-products"]);
  expect(screen.getByText("3 awaiting arrival · 1 arrived")).toBeTruthy();
  expect(card("Approvals by department").getByText(/5 approved · 1\.5 days average/)).toBeTruthy();
  expect(card("Stock by department").getByText("Paracetamol 500")).toBeTruthy();
  // This month: the report's own filter is 2, and the KPI reports get the month's dates.
  expect(query(calls, "/api/v1/report/fgtn/dashboard-kpi")[0]?.get("dateFilter")).toBe("2");
  expect(query(calls, "/api/v1/report/kpi/fgtn-pending-approval")[0]?.get("startDate")).toBeTruthy();
  await userEvent.click(screen.getByRole("button", { name: "All" }));
  await waitFor(() => expect([query(calls, "/api/v1/report/fgtn/dashboard-kpi").at(-1)?.get("dateFilter"), query(calls, "/api/v1/report/warehouse-dashboard").at(-1)?.get("filter"), query(calls, "/api/v1/report/kpi/fgtn-pending-approval").at(-1)?.get("startDate")]).toEqual(["0", "3", null]));
});

it("shows production health with output ranked and return rates flagged", async () => {
  const calls = open("/production-health-dashboard");
  expect(await screen.findByText("6 schedules completed")).toBeTruthy();
  expect(screen.getByText("6 issued of 8")).toBeTruthy();
  expect(screen.getByText("Oldest waiting 9 days")).toBeTruthy();
  expect(card("Output volume by department").getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Syrup30", "Tablet12"]);
  expect(card("Materials below reorder level").getByText("2 kg")).toBeTruthy();
  expect(card("Material return rate").getByText("20.0%").className).toContain("text-destructive");
  expect(card("Pipeline snapshot").getByText("Sourced")).toBeTruthy();
  // The snapshot is not narrowed by the period; the KPI reports are.
  expect([query(calls, "/api/v1/report/production-dashboard")[0]?.get("startDate"), Boolean(query(calls, "/api/v1/report/kpi/schedule-adherence")[0]?.get("startDate"))]).toEqual([null, true]);
});

it("shows the inventory command centre and names the chosen inactivity threshold", async () => {
  const calls = open("/inventory-command-center");
  expect((await screen.findAllByText("2.5M")).length).toBe(2);
  expect(screen.getByText("Slow-moving stock, no movement in 90+ days")).toBeTruthy();
  // Batches within 90 days: 2 + 4.
  expect(within(screen.getByText("Batches expiring soon").closest("div")!).getByText("6")).toBeTruthy();
  expect(card("Slow-moving inventory").getByText("Lactose")).toBeTruthy();
  expect(card("Shelf utilisation").getByText("95%")).toBeTruthy();
  expect(query(calls, "/api/v1/report/warehouse/slow-moving-inventory")[0]?.get("threshold")).toBe("90");
});

it("shows the QA and QC dashboards, with the inspection backlog of the user's own department when they are in production", async () => {
  open("/qa-qc-dashboard", { permissions: ["CanViewAnalyticalTestRequests"] });
  // Without the QC permissions the quality dashboards open on QA.
  expect(await screen.findByRole("heading", { name: "QA dashboard" })).toBeTruthy();
  expect(await screen.findByText("2 pending review")).toBeTruthy();
  // The BMR total came back as zero: 2 + 3 + 1.
  expect(within(screen.getByText("BMR requests", { selector: "span" }).closest("div")!).getByText("6")).toBeTruthy();
  expect(card("Exception watch").getByText("Expired analytical tests")).toBeTruthy();
  cleanup(); forgetSession();

  const calls = open("/qa-qc-dashboard/qc", { departmentType: 0 });
  expect(await screen.findByText("Materials ready for the QC checklist")).toBeTruthy();
  expect(await screen.findByText("2 pending")).toBeTruthy();
  expect(within(screen.getByText("Incoming inspection backlog").closest("div")!).getByText("3")).toBeTruthy();
  expect(within(screen.getAllByText("Batch tests", { selector: "span" })[0]!.closest("div")!).getByText("8")).toBeTruthy();
  expect(screen.getByRole("combobox", { name: "Department" }).hasAttribute("disabled")).toBe(true);
  expect(query(calls, "/api/v1/report/materials-ready-for-checklist").at(-1)?.get("departmentId")).toBe("558da105-a506-44a9-8ff5-8d005a54f294");
  expect(calls.some((call) => call.startsWith("/api/v1/department"))).toBe(false);
});

it("shows the HR dashboard from real figures only, and the executive summary", async () => {
  open("/hr-dashboard");
  expect(await screen.findByText("100 permanent · 20 casual")).toBeTruthy();
  // No attendance was recorded: no invented rate.
  expect(screen.getByText("No attendance recorded for this period")).toBeTruthy();
  expect(card("Overtime requests").getByText("Expired")).toBeTruthy();
  expect(card("Gender ratio").getByText("60")).toBeTruthy();
  cleanup(); forgetSession();

  const calls = open("/hr-executive-summary");
  expect(await screen.findByText("60 male / 40 female")).toBeTruthy();
  expect(await screen.findByText("12 of 20 hours approved")).toBeTruthy();
  expect(screen.getByText("90.0%")).toBeTruthy();
  expect(card("Disciplinary actions").getByRole("row", { name: /Tablet 1 2 0 1/ })).toBeTruthy();
  expect(card("Leave utilisation").getByText("30 / 120")).toBeTruthy();
  expect(query(calls, "/api/v1/report/hr-kpi/leave-utilisation-rate")[0]?.get("year")).toBe(String(new Date().getFullYear()));
});

it("welcomes the user by name and lists only the dashboards they may open", async () => {
  open("/home", { permissions: ["CanViewRawMaterialsItems"] });
  expect(await screen.findByRole("heading", { name: "Welcome Ada Mensah" })).toBeTruthy();
  const links = within(screen.getByRole("region", { name: "Your dashboards" })).getAllByRole("link");
  expect(links.some((link) => link.getAttribute("href") === "/warehouse-dashboard")).toBe(true);
  expect(links.some((link) => link.getAttribute("href") === "/hr-dashboard")).toBe(false);
});
