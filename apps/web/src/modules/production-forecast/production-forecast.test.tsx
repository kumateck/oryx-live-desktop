// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { RouteAccess } from "@/components/shell/route-access";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { navigationCatalog } from "@/modules/navigation/catalog.generated";
import type { NavigationGroup, NavigationItem } from "@/modules/navigation/navigation-model";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { ForecastPage } from "./components/forecast-page";
import { currentMonth, forecastPermission, monthArg, readiness, showQuantity } from "./lib/forecast";
import { manifest } from "./manifest";

afterEach(() => { cleanup(); forgetSession(); });

const material = (overrides: Record<string, unknown>) => ({ materialId: "m-1", materialCode: "RM-1", materialName: "Starch", kind: 0, unitId: "u", unit: "g",
  perBatchQuantity: 3000, perBatchQuantityVaries: false, batchCount: 4, totalQuantity: 12000, reservedQuantity: 0, canSatisfyQuantity: 10000,
  shortfallQuantity: 2000, batchesSatisfiable: 3, freeInWarehouse: 10000, sharedWithProducts: 1, ...overrides });
const batch = (number: string, rawReady: boolean) => ({ id: `batch-${number}`, scheduleId: "s-1", productKey: "p", productId: "p-1", productCode: "TAB-1",
  productName: "Paracetamol", batchNumber: number, batchSize: 0, quantity: 0, packingStyle: "10 x 10", started: false,
  rawReserved: false, packagingReserved: false, rawReady, packagingReady: true, warnings: [] });
const forecast = { year: 2026, month: 11, departmentName: "Tablet", generatedAt: "2026-11-05T10:00:00Z", totalBatches: 4,
  rawReadyBatches: 3, packagingReadyBatches: 4, warnings: [],
  schedules: [{ id: "s-1", code: "PS-NOV", scheduledStartTime: "2026-11-03T00:00:00Z", scheduledEndTime: "2026-11-20T00:00:00Z", status: 0,
    batches: [batch("B1", true), batch("B2", true), batch("B3", true), batch("B4", false)] }],
  products: [{ key: "p", productId: "p-1", productCode: "TAB-1", productName: "Paracetamol", batchSize: 0, packingStyle: "10 x 10", batchCount: 4,
    batchIds: [], rawBatchesSatisfiable: 3, packagingBatchesSatisfiable: 4, batchesSatisfiable: 3, warnings: [],
    rawMaterials: [material({})],
    packagingMaterials: [material({ materialId: "m-2", materialCode: "PK-1", materialName: "Blister foil", unit: "pcs", perBatchQuantity: 100,
      totalQuantity: 400, canSatisfyQuantity: 400, shortfallQuantity: 0, batchesSatisfiable: 4, freeInWarehouse: 900, sharedWithProducts: 0 })] }] };

function open(permissions: string[]) {
  const backend = stubBackend({ permissions }); rememberSession();
  const reads: URL[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url); reads.push(url);
    if (url.pathname === "/api/v1/report/production-material-forecast") return Response.json(forecast);
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: manifest.root, element: <RouteAccess><ForecastPage /></RouteAccess> }], { initialEntries: [manifest.root] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { reads };
}

it("is guarded by its own warehouse permission in the manifest and the sidebar", () => {
  expect(manifest.access).toEqual({ kind: "all", permissions: [forecastPermission] });
  const groups: readonly NavigationGroup[] = navigationCatalog;
  const entry = groups.flatMap((group): readonly NavigationItem[] => group.items).find((item) => item.path === manifest.root);
  expect(entry?.permissions).toEqual([forecastPermission]);
});

it("denies the page before fetching without the forecast permission", async () => {
  const { reads } = open(["CanViewExpiredMaterials", "CanViewWarehouseReport"]);
  expect(await screen.findByRole("heading", { name: "You don't have access to this page" })).toBeTruthy();
  expect(reads.filter((url) => url.pathname.includes("production-material-forecast"))).toEqual([]);
});

it("loads the current month and shows per batch, total, can satisfy and batches covered with shortfalls marked", async () => {
  const { reads } = open([forecastPermission]);
  expect(await screen.findByText(/4 batches planned · raw materials cover 3 · packaging covers 4/)).toBeTruthy();
  const request = reads.find((url) => url.pathname === "/api/v1/report/production-material-forecast");
  const month = monthArg(currentMonth());
  expect(request?.searchParams.get("year")).toBe(String(month?.year));
  expect(request?.searchParams.get("month")).toBe(String(month?.month));
  const schedules = screen.getByRole("table", { name: "Production schedules and batches" });
  expect(within(schedules).getAllByText("Covered").length).toBeGreaterThan(0);
  expect(within(schedules).getByText("Short")).toBeTruthy();

  await userEvent.setup().click(screen.getByRole("button", { name: "Show materials for Paracetamol" }));
  const raw = screen.getByRole("table", { name: "Raw materials" });
  const starch = within(raw).getByText("Starch").closest("tr");
  expect(starch?.getAttribute("data-short")).toBe("true");
  expect(within(raw).getByText("3 of 4")).toBeTruthy();
  expect(within(raw).getByText(showQuantity(2000, "g"))).toBeTruthy();
  expect(within(raw).getByText(/also needed by 1 other product/)).toBeTruthy();
  const packaging = screen.getByRole("table", { name: "Packaging materials" });
  expect(within(packaging).getByText("Blister foil").closest("tr")?.getAttribute("data-short")).toBeNull();
  expect(within(packaging).getByText("None")).toBeTruthy();
});

it("summarises a product's covered batches", () => {
  expect(readiness({ batchCount: 4, batchesSatisfiable: 3, rawBatchesSatisfiable: 3, packagingBatchesSatisfiable: 4 }))
    .toEqual({ short: true, text: "3 of 4 batches covered", detail: "Raw materials 3 · Packaging 4" });
  expect(monthArg("2026-02")).toEqual({ year: 2026, month: 2 });
  expect(monthArg(null)).toBeNull();
});
