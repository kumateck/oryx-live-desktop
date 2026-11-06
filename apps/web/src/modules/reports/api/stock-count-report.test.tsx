// @vitest-environment jsdom
import { configureStore } from "@reduxjs/toolkit";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, expect, it, vi } from "vitest";
import { api } from "@/shared/api/base-api";
import { ReportPrint } from "@/shared/reports/report-print";
import { emptyReportFilters } from "../schemas/report-filters";
import { stockCountReportSchema } from "../schemas/stock-count-report";
import { stockCountOutput } from "../lib/stock-count-sheet";
import { ReportKey } from "../lib/report-model";
import { loadWarehouseReport } from "./warehouse-reports";
const departmentId = "558da105-a506-44a9-8ff5-8d005a54f294";
const fixture = (expiredOnly = false) => ({ generatedAt: "2026-11-04T12:00:00Z", departmentId, departmentName: "Oral solids", materialKind: 0, expiredOnly,
  rows: Array.from({ length: 71 }, (_, index) => ({ batchId: `658da105-a506-44a9-8ff5-${String(index).padStart(12, "0")}`, departmentId, departmentName: "Oral solids", uoMId: "758da105-a506-44a9-8ff5-8d005a54f294",
    materialName: "Cyanocobalamin (Vitamin B12)", materialCode: "RMC012", batchNumber: `LOT-${index + 1}`, arNumber: "AR-123", manufacturerName: "Manufacturer Ltd", supplierName: "Supplier Ltd",
    manufacturingDate: "2021-05-01T00:00:00Z", expiryDate: "2024-05-31T23:59:59Z", retestDate: "2026-12-31T23:59:59Z", quantity: 100_000_000, uoM: "mg" })),
});
const store = () => configureStore({ reducer: { [api.reducerPath]: api.reducer }, middleware: (defaults) => defaults().concat(api.middleware) });
afterEach(() => vi.unstubAllGlobals());
it.each([false, true])("loads the complete stock snapshot and prints the agreed two-line cells (expired %s)", async (expired) => {
  const fetcher = vi.fn<typeof fetch>(async () => Response.json(fixture(expired))); vi.stubGlobal("fetch", fetcher);
  const redux = store();
  const output = await loadWarehouseReport(redux.dispatch, expired ? ReportKey.ExpiredStock : ReportKey.CurrentStock, { ...emptyReportFilters(), department: { value: departmentId, label: "Stale label" }, materialKind: { value: "0", label: "Raw" } }, new AbortController().signal);
  expect(fetcher).toHaveBeenCalledTimes(1);
  const request = fetcher.mock.calls[0]?.[0]; if (!(request instanceof Request)) throw new Error("Missing request");
  expect(new URL(request.url).pathname).toBe("/api/v1/material/batches/stock-report");
  expect(Object.fromEntries(new URL(request.url).searchParams)).toEqual({ departmentId, materialKind: "0", expiredOnly: String(expired) });
  expect(output.filters?.[0]?.value).toBe("Oral solids");
  const sheet = output.sheets[0];
  expect(sheet?.rows).toHaveLength(71); expect(sheet?.columns).toEqual(["Material", "Batch", "Source", "Dates", "Quantity", "Physical count", "Remarks"]);
  expect(sheet?.rows[0]?.cells).toEqual(["Cyanocobalamin (Vitamin B12)\nRMC012", "LOT-1\nAR: AR-123", "Manufacturer Ltd\nSupplier Ltd", "Mfg: May 2021\nExp: May 2024 – Retest: Dec 2026", { quantity: 100_000_000, unit: "mg", origin: "calculated" }, "", ""]);
  const html = renderToStaticMarkup(<ReportPrint book={{ title: "Stock report", generatedAt: output.generatedAt ?? "", filters: output.filters ?? [], warnings: output.warnings ?? [], sheets: output.sheets }} />);
  const document = new DOMParser().parseFromString(html, "text/html");
  expect(document.querySelectorAll("table")).toHaveLength(1); expect(document.querySelectorAll("tbody tr")).toHaveLength(71);
  expect(document.querySelectorAll("thead tr")).toHaveLength(2); expect(html).toContain("LOT-71");
  const cells = document.querySelectorAll("tbody tr:first-child td");
  // The server sends milligrams; paper shows the largest unit.
  expect(cells[4]?.textContent).toBe("100 kg"); expect(cells[5]?.textContent).toBe(""); expect(cells[6]?.textContent).toBe("");
  expect(document.querySelector("tbody tr")?.getAttribute("style")).toContain("14mm");
  expect(html).toContain("Counted by"); expect(html).toContain("Checked by");
  redux.dispatch(api.util.resetApiState());
});
it("refuses incomplete units, duplicates and another department's records", () => {
  const report = fixture(); const row = report.rows[0]; if (!row) throw new Error("Missing fixture");
  expect(stockCountReportSchema.safeParse({ ...report, rows: [{ ...row, uoM: null }] }).success).toBe(false);
  expect(() => stockCountOutput(stockCountReportSchema.parse({ ...report, rows: [row, row] }))).toThrow("duplicate");
  expect(() => stockCountOutput(stockCountReportSchema.parse({ ...report, rows: [{ ...row, departmentId: "858da105-a506-44a9-8ff5-8d005a54f294" }] }))).toThrow("another department");
  expect(stockCountOutput(stockCountReportSchema.parse({ ...report, rows: [] })).sheets[0]?.rows).toEqual([]);
});
it("refuses a mismatched requested kind or report mode", async () => {
  vi.stubGlobal("fetch", vi.fn<typeof fetch>(async () => Response.json(fixture()))); const redux = store();
  await expect(loadWarehouseReport(redux.dispatch, ReportKey.ExpiredStock, emptyReportFilters(), new AbortController().signal)).rejects.toThrow("does not match");
  redux.dispatch(api.util.resetApiState());
});
