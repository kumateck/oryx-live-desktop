// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import MaterialReturnPage from "../../pages/(workspace)/warehouse/material-returns/[id]/details/page";
import SwapRequestPage from "../../pages/(workspace)/warehouse/swap-requests/[id]/details/page";
import { ApiProvider } from "../../shared/api/api-provider";
import { SessionProvider } from "../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { openMenu } from "../../test/menu";
import { restocked, returnNoteSchema } from "../material-returns/returns";
import { approveBlock, swapSchema } from "./swaps";

afterEach(() => { cleanup(); forgetSession(); });

const batch = (id: string, quantity: number, kind = 0) => ({ quantity, uoM: { symbol: "kg" }, materialBatch: { id, batchNumber: id.toUpperCase(), expiryDate: "2099-01-01T00:00:00Z", material: { name: "Lactose", code: "RM-2", kind } } });
const swap = (extra: object = {}) => ({ id: "sw-1", status: 0, firstWarehouse: { name: "General raw store" }, secondWarehouse: { name: "Beta raw store" }, firstSwapShelfMaterialBatches: [batch("b1", 10)], secondSwapShelfMaterialBatches: [batch("b2", 6), batch("b3", 4)], ...extra });
const note = { id: "rn-1", batchNumber: "T081K004", isFullReturn: false, productionScheduleProduct: { product: { name: "Paracetamol syrup" } },
  partialReturns: [{ returned: false, quantity: 2, uoM: { id: "u", symbol: "kg" }, material: { name: "Lactose", kind: 0 }, materialBatch: { id: "b1", batchNumber: "B-1" } }, { returned: true, quantity: 1, uoM: { id: "u", symbol: "kg" }, material: { name: "Sorbitol", kind: 0 }, materialBatch: { id: "b2", batchNumber: "B-2" } }] };

it("reads swaps and return notes, and holds a swap whose sides differ", () => {
  expect(approveBlock(swapSchema.parse(swap())!)).toBeNull();
  expect(approveBlock(swapSchema.parse(swap({ secondSwapShelfMaterialBatches: [batch("b2", 6)] }))!)).toBe("The two sides are not the same quantity.");
  expect(approveBlock(swapSchema.parse(swap({ status: "Approved" }))!)).toBe("This request has already been decided.");
  const parsed = returnNoteSchema.parse(note)!;
  expect(restocked(parsed)).toBe("part");
  expect(restocked({ lines: parsed.lines.map((line) => ({ ...line, returned: true })) })).toBe("all");
  // A full return takes its quantities from what was reserved.
  expect(returnNoteSchema.parse({ id: "rn-2", isFullReturn: true, fullReturns: [{ returned: false, materialBatchReservedQuantity: { quantity: 7, materialBatch: { id: "b9", batchNumber: "B-9", uoM: { id: "u", symbol: "kg" }, material: { name: "Maize starch", kind: 1 } } } }] })?.lines)
    .toEqual([{ key: "b9-0", batchId: "b9", batchNumber: "B-9", materialName: "Maize starch", materialCode: null, kind: 1, quantity: 7, unit: "kg", unitId: "u", returned: false }]);
});

interface Call { method: string; path: string }
function open(address: string, permissions: string[], record: object = swap()) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    calls.push({ method: input.method, path });
    if (path === "/api/v1/warehouse/swap/sw-1") return Response.json(record);
    if (path === "/api/v1/production-schedule/material-return-note/rn-1") return Response.json(note);
    return new Response(null, { status: 204 });
  });
  const router = createMemoryRouter([{ path: "/warehouse/swap-requests", element: <p>Swaps</p> }, { path: "/warehouse/swap-requests/:id/details", element: <SwapRequestPage /> }, { path: "/warehouse/material-returns/:id/details", element: <MaterialReturnPage /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET");

it("lets the store that is asked decide a swap, after a confirmation", async () => {
  const user = userEvent.setup();
  // The store that asked can only watch.
  open("/warehouse/swap-requests/sw-1/details?direction=1", ["CanIssueRawMaterialRequisitions"]);
  expect(await screen.findByText("General raw store gives up")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
  cleanup();
  open("/warehouse/swap-requests/sw-1/details?direction=0", ["CanIssuePackagingMaterialRequisitions"]);
  await screen.findByText("General raw store gives up");
  expect(screen.queryByRole("button", { name: "Approve" })).toBeNull();
  cleanup();
  const { calls, router } = open("/warehouse/swap-requests/sw-1/details?direction=0", ["CanIssueRawMaterialRequisitions"]);
  await user.click(await screen.findByRole("button", { name: "Reject" }));
  expect(writes(calls)).toEqual([]);
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Reject swap" }));
  await waitFor(() => expect(writes(calls)).toEqual([{ method: "PUT", path: "/api/v1/warehouse/swap/sw-1/reject" }]));
  await waitFor(() => expect(router.state.location.pathname).toBe("/warehouse/swap-requests"));
}, 20_000);

it("offers shelving for returned material that is not back on a shelf yet", async () => {
  open("/warehouse/material-returns/rn-1/details", ["CanViewMaterialsReturnNote", "CanAssignRawMaterialsStockToShelves"]);
  expect(await screen.findByText("Lactose")).toBeTruthy();
  expect(screen.getByText("1 of 2")).toBeTruthy();
  await openMenu(/Actions for Lactose/);
  expect(screen.getByRole("menuitem", { name: "Put on shelves" })).toBeTruthy();
  // Sorbitol is already back on shelves, so it has no menu.
  expect(screen.queryByRole("button", { name: /Actions for Sorbitol/ })).toBeNull();
});
