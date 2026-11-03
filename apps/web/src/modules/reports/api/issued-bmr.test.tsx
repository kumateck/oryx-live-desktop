// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { api } from "@/shared/api/base-api";
import { ReportPrint } from "@/shared/reports/report-print";
import { emptyReportFilters } from "../schemas/report-filters";
import { issuedBmrReportSchema } from "../schemas/issued-bmr";
import { ReportKey } from "../lib/report-model";
import { reportDefinition } from "../lib/catalog";
import { bmrDepartmentId, issuedBmrFixture } from "../test/issued-bmr-fixture";
import { loadQualityReport } from "./quality-reports";

afterEach(() => vi.unstubAllGlobals());
const filters = () => ({ ...emptyReportFilters(), startDate: new Date(2026, 10, 1), endDate: new Date(2026, 10, 2),
  department: { value: bmrDepartmentId, label: "Tablet production" } });
const store = () => configureStore({ reducer: { [api.reducerPath]: api.reducer }, middleware: (defaults) => defaults().concat(api.middleware) });

it("requests the complete issue-date snapshot once with date-only boundaries and department", async () => {
  const fetcher = vi.fn<typeof fetch>(async () => Response.json(issuedBmrFixture())); vi.stubGlobal("fetch", fetcher);
  const redux = store();
  const output = await loadQualityReport(redux.dispatch, ReportKey.IssuedBmr, filters(), new AbortController().signal);
  expect(fetcher).toHaveBeenCalledTimes(1);
  const request = fetcher.mock.calls[0]?.[0]; if (!(request instanceof Request)) throw new Error("Missing API request");
  const url = new URL(request.url);
  expect(url.pathname).toBe("/api/v1/report/bmr-issued");
  expect(Object.fromEntries(url.searchParams)).toEqual({ startDate: "2026-11-01", endDate: "2026-11-02", departmentId: bmrDepartmentId });
  expect(output.generatedAt).toBe(issuedBmrFixture().generatedAt);
  expect(output.sheets[0]?.columns).toEqual(["Issued date", "Issued by", "Batch number", "Manufacturing date", "Expiry date", "Batch size", "Product name", "Product code", "Department"]);
  expect(output.sheets[0]?.rows[0]?.cells[5]).toBe("120 kg");
  expect(output.sheets[0]?.rows[1]?.cells[5]).toBe("0.00001 mg");
  const html = renderToStaticMarkup(<ReportPrint book={{ title: "BMR issued report", generatedAt: output.generatedAt ?? "", filters: [], warnings: [], sheets: output.sheets }} />);
  const document = new DOMParser().parseFromString(html, "text/html");
  expect(document.querySelectorAll("table")).toHaveLength(1);
  expect(Array.from(document.querySelectorAll("th"), (cell) => cell.textContent)).toEqual(["Product", "Batch", "Validity", "Issued", "Department"]);
  expect(document.querySelector("tbody td")?.children).toHaveLength(2);
  expect(html).toContain("By: "); expect(html).toContain("QA Operator"); expect(html).toContain("Not recorded");
  expect(html).toContain("BMR-2026-002"); expect(html).toContain("0.00001 mg");
  expect(output.sheets[0]?.printColumns?.flatMap((column) => column.fields.map((field) => field.column)).sort((a, b) => a - b)).toEqual([0, 1, 2, 3, 4, 5, 6, 7, 8]);
  redux.dispatch(api.util.resetApiState());
});

it("requires dates and refuses reversed ranges before making requests", async () => {
  const fetcher = vi.fn<typeof fetch>(); vi.stubGlobal("fetch", fetcher); const redux = store();
  for (const scope of [emptyReportFilters(), { ...filters(), endDate: new Date(2026, 9, 31) }])
    await expect(loadQualityReport(redux.dispatch, ReportKey.IssuedBmr, scope, new AbortController().signal)).rejects.toThrow("valid issue-date range");
  expect(fetcher).not.toHaveBeenCalled();
  expect(reportDefinition(ReportKey.IssuedBmr).required).toEqual(["startDate", "endDate"]);
});

it("rejects inconsistent dates, counts, duplicate identities and a mismatched requested scope", async () => {
  const report = issuedBmrFixture();
  expect(issuedBmrReportSchema.safeParse({ ...report, totalIssued: 3 }).success).toBe(false);
  expect(issuedBmrReportSchema.safeParse({ ...report, rows: [report.rows[0], report.rows[0]] }).success).toBe(false);
  const outside = issuedBmrFixture(); if (outside.rows[0]) outside.rows[0].issuedAt = "2026-11-03T00:00:00Z";
  expect(issuedBmrReportSchema.safeParse(outside).success).toBe(false);
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => Response.json({ ...report, startDate: "2026-10-01" })));
  const redux = store();
  await expect(loadQualityReport(redux.dispatch, ReportKey.IssuedBmr, filters(), new AbortController().signal)).rejects.toThrow("does not match");
  redux.dispatch(api.util.resetApiState());
});

it("supports all authorized departments and a genuine empty period without inventing rows", async () => {
  const report = { ...issuedBmrFixture(), departmentId: null, departmentName: null, totalIssued: 0, rows: [] };
  const fetcher = vi.fn<typeof fetch>(async () => Response.json(report)); vi.stubGlobal("fetch", fetcher);
  const redux = store();
  const output = await loadQualityReport(redux.dispatch, ReportKey.IssuedBmr, { ...filters(), department: null }, new AbortController().signal);
  expect(output.sheets[0]?.rows).toEqual([]); expect(output.warnings?.[0]).toContain("0 BMRs issued");
  const request = fetcher.mock.calls[0]?.[0]; if (!(request instanceof Request)) throw new Error("Missing API request");
  expect(new URL(request.url).searchParams.has("departmentId")).toBe(false);
  redux.dispatch(api.util.resetApiState());
});

it("reports unavailable backends and propagates access denial without falling back to the active issue list", async () => {
  const fetcher = vi.fn<typeof fetch>(async () => new Response(null, { status: 404 })); vi.stubGlobal("fetch", fetcher);
  const redux = store();
  await expect(loadQualityReport(redux.dispatch, ReportKey.IssuedBmr, filters(), new AbortController().signal)).rejects.toThrow("backend includes");
  fetcher.mockImplementation(async () => new Response(null, { status: 403 }));
  await expect(loadQualityReport(redux.dispatch, ReportKey.IssuedBmr, filters(), new AbortController().signal)).rejects.toMatchObject({ status: 403 });
  expect(fetcher).toHaveBeenCalledTimes(2); redux.dispatch(api.util.resetApiState());
});
