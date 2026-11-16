// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, expect, it, vi } from "vitest";
import { api } from "@/shared/api/base-api";
import { ReportKey } from "../lib/report-model";
import { emptyReportFilters } from "../schemas/report-filters";
import { loadQualityReport } from "./quality-reports";

afterEach(() => vi.unstubAllGlobals());
const store = () => configureStore({ reducer: { [api.reducerPath]: api.reducer }, middleware: (defaults) => defaults().concat(api.middleware) });
const department = "44444444-4444-4444-8444-444444444444";
const month = { year: 2026, month: 11, departmentId: department, departmentName: "Tablets", generatedAt: "2026-11-16T08:00:00Z", rows: [] };
function requested(fetcher: ReturnType<typeof vi.fn<typeof fetch>>) {
  const request = fetcher.mock.calls[0]?.[0]; if (!(request instanceof Request)) throw new Error("Missing API request");
  const url = new URL(request.url); return { path: url.pathname, params: Object.fromEntries(url.searchParams) };
}

it("asks for one month and department and titles the report after them", async () => {
  const fetcher = vi.fn<typeof fetch>(async () => Response.json(month)); vi.stubGlobal("fetch", fetcher);
  const redux = store();
  const filters = { ...emptyReportFilters(), month: "2026-11", department: { value: department, label: "Tablets" } };
  const output = await loadQualityReport(redux.dispatch, ReportKey.ProductionMonthly, filters, new AbortController().signal);
  expect(requested(fetcher)).toEqual({ path: "/api/v1/report/production-monthly", params: { year: "2026", month: "11", departmentId: department } });
  expect(output.title).toBe("Production monthly report · November 2026 · Tablets");
  fetcher.mockImplementation(async () => Response.json({ ...month, month: 10 }));
  await expect(loadQualityReport(redux.dispatch, ReportKey.ScheduleSummary, filters, new AbortController().signal)).rejects.toThrow("does not match");
  redux.dispatch(api.util.resetApiState());
});

it("filters stock issued by department, product and batch number, with dates only when both are chosen", async () => {
  const product = "55555555-5555-4555-8555-555555555555";
  const fetcher = vi.fn<typeof fetch>(async () => Response.json({ departmentId: department, departmentName: "Tablets", productId: product, batchNumber: "B-1",
    startDate: null, endDate: null, generatedAt: "2026-11-16T08:00:00Z", rows: [] })); vi.stubGlobal("fetch", fetcher);
  const redux = store();
  const filters = { ...emptyReportFilters(), department: { value: department, label: "Tablets" }, product: { value: product, label: "TAB-1" }, batchNumber: " B-1 " };
  const output = await loadQualityReport(redux.dispatch, ReportKey.StockIssued, filters, new AbortController().signal);
  expect(requested(fetcher)).toEqual({ path: "/api/v1/report/stock-issued", params: { departmentId: department, productId: product, batchNumber: "B-1" } });
  expect(output.sheets[0]?.columns).toContain("Material batch");
  await expect(loadQualityReport(redux.dispatch, ReportKey.StockIssued, { ...filters, startDate: new Date(2026, 10, 1) }, new AbortController().signal))
    .rejects.toThrow("Choose both issue dates");
  redux.dispatch(api.util.resetApiState());
});
