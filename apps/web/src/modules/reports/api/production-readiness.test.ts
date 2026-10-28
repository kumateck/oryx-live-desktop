// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { afterEach, expect, it, vi } from "vitest";
import { api } from "@/shared/api/base-api";
import { cacheEffectsMiddleware } from "@/shared/api/cache-effects";
import { emptyReportFilters } from "../schemas/report-filters";
import { productionReadinessSchema } from "../schemas/production-readiness";
import { readinessDepartmentId, readinessFixture } from "../test/production-readiness-fixture";
import { ReportKey } from "../lib/report-model";
import { loadQualityReport } from "./quality-reports";

afterEach(() => vi.unstubAllGlobals());
const filters = () => ({ ...emptyReportFilters(), date: new Date(2026, 9, 28), month: "2026-10",
  department: { value: readinessDepartmentId, label: "Production" } });
const store = () => configureStore({ reducer: { [api.reducerPath]: api.reducer },
  middleware: (defaults) => defaults().concat(api.middleware, cacheEffectsMiddleware.middleware) });

it.each([ReportKey.DailySchedule, ReportKey.MonthlySchedule, ReportKey.ProductReadiness])("loads report %s with one scoped request and no per-product requests", async (key) => {
  const snapshot = readinessFixture();
  if (key !== ReportKey.DailySchedule) { snapshot.startDate = "2026-10-01"; snapshot.endDate = "2026-10-31"; }
  const fetcher = vi.fn<typeof fetch>(async () => Response.json(snapshot));
  vi.stubGlobal("fetch", fetcher);
  const redux = store();
  const output = await loadQualityReport(redux.dispatch, key, filters(), new AbortController().signal);
  expect(fetcher).toHaveBeenCalledTimes(1);
  const request = fetcher.mock.calls[0]?.[0];
  expect(request).toBeInstanceOf(Request);
  if (!(request instanceof Request)) throw new Error("Expected a generated API request");
  const url = new URL(request.url);
  expect(url.pathname).toBe("/api/v1/report/production-readiness");
  expect(url.searchParams.get("departmentId")).toBe(readinessDepartmentId);
  expect(url.searchParams.get("startDate")).toBe(snapshot.startDate);
  expect(url.searchParams.get("endDate")).toBe(snapshot.endDate);
  expect(output.generatedAt).toBe(snapshot.generatedAt);
  expect(output.readiness?.mode).toBe(key === ReportKey.ProductReadiness ? "products" : "schedule");
  expect(output.readiness?.report.markets[0]?.rows[0]?.batches).toBe(0.5);
  expect(output.sheets.find((sheet) => sheet.name === "Production totals")?.rows.at(-1)?.cells).toEqual(["Grand total", null, 2, 1000000, 624, 1600]);
  redux.dispatch(api.util.resetApiState());
});

it("preserves authoritative unavailable totals rather than recomputing partial quantities", async () => {
  const report = readinessFixture();
  const group = report.markets[0]; const row = group?.rows[0];
  if (!group || !row) throw new Error("Fixture row missing");
  row.expectedYield = null; row.shippers = null; row.loosePacks = null;
  group.totals.expectedYield = null; group.totals.shippers = null; group.totals.loosePacks = null;
  report.totals.expectedYield = null; report.totals.shippers = null; report.totals.loosePacks = null;
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => Response.json(report)));
  const redux = store();
  const output = await loadQualityReport(redux.dispatch, ReportKey.DailySchedule, filters(), new AbortController().signal);
  expect(output.readiness?.report.totals.expectedYield).toBeNull();
  expect(output.sheets.find((sheet) => sheet.name === "Production totals")?.rows.at(-1)?.cells).toEqual(["Grand total", null, 2, null, null, null]);
  redux.dispatch(api.util.resetApiState());
});

it("rejects incomplete and mismatched server snapshots before they can be shown or exported", async () => {
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => Response.json({ ...readinessFixture(), products: [] })));
  const redux = store();
  await expect(loadQualityReport(redux.dispatch, ReportKey.DailySchedule, filters(), new AbortController().signal)).rejects.toThrow("incomplete");
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => Response.json({ ...readinessFixture(), startDate: "2026-10-27" })));
  await expect(loadQualityReport(redux.dispatch, ReportKey.DailySchedule, filters(), new AbortController().signal)).rejects.toThrow("does not match");
  redux.dispatch(api.util.resetApiState());
});

it("does not fall back to the old request fan-out when the endpoint is unavailable", async () => {
  const fetcher = vi.fn<typeof fetch>(async () => new Response(null, { status: 404 })); vi.stubGlobal("fetch", fetcher);
  const redux = store();
  await expect(loadQualityReport(redux.dispatch, ReportKey.DailySchedule, filters(), new AbortController().signal)).rejects.toThrow("backend includes");
  expect(fetcher).toHaveBeenCalledTimes(1);
  redux.dispatch(api.util.resetApiState());
});

it("rejects false ready statuses, missing checks, duplicates and inconsistent counts", () => {
  const snapshot = readinessFixture();
  const product = snapshot.products[0]; if (!product) throw new Error("Fixture product missing");
  product.configuration.ard = 2;
  expect(productionReadinessSchema.safeParse(snapshot).success).toBe(false);
  expect(productionReadinessSchema.safeParse({ ...readinessFixture(), productCount: 3 }).success).toBe(false);
  const duplicate = readinessFixture(); duplicate.markets.push(...duplicate.markets);
  expect(productionReadinessSchema.safeParse(duplicate).success).toBe(false);
});
