// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { BinCardTable } from "./stock-tables";

afterEach(() => { cleanup(); forgetSession(); });

// Vanilla Powder in Tablet's store once the 100 kg and 30 kg transfers from Beta are posted.
const kg = { symbol: "kg" };
const entry = (id: string, description: string, received: number, issued: number, balance: number, requisitionCode: string | null = null) =>
  ({ id, createdAt: "2026-11-25T12:28:17Z", description, requisitionCode, quantityReceived: received, quantityIssued: issued, balanceQuantity: balance, uoM: kg,
    warehouseName: "TABLET Raw Warehouse", materialBatch: { batchNumber: "R-03506220" } });
const page = (difference: number) => ({ data: [
  entry("c-3", "Stock transfer RM/B/25/022: received from BETA Raw Warehouse", 30, 0, 78.46),
  entry("c-2", "TABLET Raw Warehouse", 0, 5.43, 48.46, "RM/N/26/120"),
  entry("c-1", "Stock transfer RM/B/25/011: received from BETA Raw Warehouse", 100, 0, 135.34),
], pageIndex: 1, pageCount: 1, totalRecordCount: 3, unit: kg, received: 165.34, issued: 86.88, closing: 78.46, shelfStock: 78.46 - difference, difference });

function show(body: object) {
  const backend = stubBackend(); rememberSession(); const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (input instanceof Request && new URL(input.url).pathname.includes("/bincardinformation/")) return Response.json(body);
    return session ? session(input, init) : new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: <BinCardTable materialId="m-1" departmentId="d-1" search="" /> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
}

it("shows transfer receipts, the replayed balances and totals that reconcile to the shelves", async () => {
  show(page(0));
  expect(await screen.findByText("Stock transfer RM/B/25/011: received from BETA Raw Warehouse")).toBeTruthy();
  expect(screen.getByText("100 kg")).toBeTruthy(); expect(screen.getByText("135.34 kg")).toBeTruthy();
  expect(screen.getByText("Bin card balance")).toBeTruthy(); expect(screen.getAllByText("78.46 kg").length).toBeGreaterThanOrEqual(3);
  expect(screen.queryByRole("alert")).toBeNull();
});

it("flags a bin card that does not reconcile to shelf stock", async () => {
  show(page(-100));
  expect((await screen.findByRole("alert")).textContent).toContain("differ by");
  expect(screen.getByText("178.46 kg")).toBeTruthy();
});
