// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import AboutToExpireMaterialsPage from "../../pages/(workspace)/warehouse/about-to-expire-materials/page";
import RejectedAreaRoute from "../../pages/(workspace)/warehouse/rejected-area/page";
import { ApiProvider } from "../../shared/api/api-provider";
import { SessionProvider } from "../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { monthRangeDays } from "../../shared/date-pickers/date-utils";
import { apiDay, daysToExpiry, monthOf } from "./expiry";

afterEach(() => { cleanup(); forgetSession(); });

it("works out the month, the server's day format and the days left", () => {
  const month = monthRangeDays(monthOf(new Date(2026, 1, 10)))!;
  expect([apiDay(month.from), apiDay(month.to)]).toEqual(["2026-02-01", "2026-02-28"]);
  // A period of several months runs from the first day of the first to the last day of the last.
  const period = monthRangeDays({ from: "2026-11", to: "2027-02" })!;
  expect([apiDay(period.from), apiDay(period.to)]).toEqual(["2026-11-01", "2027-02-28"]);
  expect(monthRangeDays({ from: "2027-02", to: "2026-11" })).toBeNull();
  const today = new Date(2026, 9, 2);
  expect([daysToExpiry("2026-10-12T00:00:00", today), daysToExpiry("2026-10-02T00:00:00", today), daysToExpiry("2026-09-30T00:00:00", today), daysToExpiry(null, today)]).toEqual([10, 0, -2, null]);
});

function open(address: string, permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: string[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push(`${url.pathname}${url.search}`);
    if (url.pathname === "/api/v1/material/batches/about-to-expire") return Response.json({ data: [{ id: "b1", batchNumber: "B-1", material: { name: "Lactose", code: "RM-2" }, expiryDate: "2099-01-01T00:00:00Z", totalQuantity: 10, remainingQuantity: 4, uoM: { symbol: "kg" },
      shelves: [{ warehouseLocationShelf: { name: "S1", warehouseLocationRack: { name: "R1" } } }] }], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname === "/api/v1/material/rejects") return Response.json({ data: [{ id: "r1", createdAt: "2026-09-20T00:00:00Z", reason: "<p>Failed assay</p>", materialBatch: { batchNumber: "B-9", totalQuantity: 25, uoM: { symbol: "kg" }, material: { name: "Maize starch", code: "RM-1" }, supplierName: "Acme" } }], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/warehouse/about-to-expire-materials", element: <AboutToExpireMaterialsPage /> }, { path: "/warehouse/rejected-area", element: <RejectedAreaRoute /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

it("lists batches expiring in the current month with where they sit and what is left", async () => {
  const calls = open("/warehouse/about-to-expire-materials", ["CanViewAboutToExpireMaterials"]);
  expect(await screen.findByText("Lactose")).toBeTruthy();
  expect(screen.getByText("R1 / S1")).toBeTruthy();
  expect(screen.getByText("4 kg")).toBeTruthy();
  const month = monthRangeDays(monthOf())!;
  expect(calls.some((call) => call.includes(`startDate=${apiDay(month.from)}`) && call.includes(`endDate=${apiDay(month.to)}`) && call.includes("materialKind=0"))).toBe(true);
});

it("shows rejected batches with the reason, asking the server for the kind the user may see", async () => {
  const calls = open("/warehouse/rejected-area", ["CanViewRejectedPackagingMaterials"]);
  expect(await screen.findByText("Maize starch")).toBeTruthy();
  expect(screen.getByText("Failed assay")).toBeTruthy();
  expect(screen.getByText("25 kg")).toBeTruthy();
  expect(calls.some((call) => call.startsWith("/api/v1/material/rejects") && call.includes("materialKind=1"))).toBe(true);
});
