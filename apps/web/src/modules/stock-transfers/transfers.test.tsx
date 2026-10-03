// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import StockTransferPage from "../../pages/(workspace)/warehouse/stock-transfer-requests/[id]/details/page";
import TransferredStockPage from "../../pages/(workspace)/warehouse/stock-transfer-requests/allocation/page";
import StockTransfersPage from "../../pages/(workspace)/warehouse/stock-transfer-requests/page";
import { ApiProvider } from "../../shared/api/api-provider";
import { SessionProvider } from "../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { openMenu } from "../../test/menu";
import { holdingRowsSchema, transferIssueBlock } from "./transfers";

afterEach(() => { cleanup(); forgetSession(); });

it("issues a transfer only when approved, covered, and not from expired stock", () => {
  const today = new Date(2026, 9, 2);
  const batch = (quantity: number, expires: string | null = "2027-01-01T00:00:00") => ({ key: "k", id: "b", number: "B", quantity, expires, returned: false });
  expect(transferIssueBlock({ status: 0, quantity: 10 }, [batch(10)], today)).toContain("waiting for approval");
  expect(transferIssueBlock({ status: 2, quantity: 10 }, [batch(10)], today)).toContain("already been issued");
  expect(transferIssueBlock({ status: 1, quantity: 10 }, [], today)).toContain("no stock picked");
  expect(transferIssueBlock({ status: 1, quantity: 10 }, [batch(6)], today)).toContain("does not cover");
  expect(transferIssueBlock({ status: 1, quantity: 10 }, [batch(10, "2026-10-02T00:00:00")], today)).toContain("expired");
  expect(transferIssueBlock({ status: 1, quantity: 10 }, [batch(6), batch(4)], today)).toBeNull();
  expect(holdingRowsSchema.parse([{ id: "h1", batches: [{ quantity: 5, sourceWarehouse: { name: "Beta raw store" }, materialBatch: { id: "b1", batchNumber: "B-1", uoM: { id: "u", symbol: "kg" }, material: { name: "Lactose" } } }, { quantity: 1, materialBatch: {} }] }]))
    .toEqual([{ key: "h1:b1:0", holdingId: "h1", batchId: "b1", batchNumber: "B-1", expires: null, materialName: "Lactose", materialCode: null, quantity: 5, unit: "kg", unitId: "u", from: "Beta raw store" }]);
});

const transfer = (id: string, kind: number, status = 1) => ({ id, status, quantity: 10, uoM: { symbol: "kg" }, material: { name: kind ? "Bottle caps" : "Lactose", code: "M-1", kind }, toDepartment: { name: "Beta Production" }, fromDepartment: { name: "General Production" }, createdAt: "2026-10-01T09:00:00Z", reason: "<p>Short for batch 12</p>" });
interface Call { method: string; path: string; body: unknown; search: string }
function open(address: string, permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const text = input.method === "GET" ? "" : await input.clone().text();
    calls.push({ method: input.method, path: url.pathname, body: text ? JSON.parse(text) as unknown : null, search: url.search });
    if (url.pathname.endsWith("/stock-transfer/in-bound") || url.pathname.endsWith("/stock-transfer/out-bound")) return Response.json({ data: [transfer("t1", 0), transfer("t2", 1)], pageIndex: 1, pageCount: 1, totalRecordCount: 2 });
    if (url.pathname.endsWith("/stock-transfer/batch/t1")) return Response.json([{ quantityToTake: 10, batch: { id: "b1", batchNumber: "B-1", expiryDate: "2099-01-01T00:00:00Z" } }]);
    if (url.pathname.endsWith("/stock-transfer/t1")) return Response.json(transfer("t1", 0));
    if (url.pathname === "/api/v1/material/holding") return Response.json({ data: [{ id: "h1", batches: [{ quantity: 5, sourceWarehouse: { name: "Beta raw store" }, materialBatch: { id: "b1", batchNumber: "B-1", uoM: { id: "u", symbol: "kg" }, material: { name: "Lactose" } } }] }], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname.includes("/warehouse/rack")) return Response.json([]);
    return new Response(null, { status: 204 });
  });
  const router = createMemoryRouter([{ path: "/warehouse/stock-transfer-requests", element: <StockTransfersPage /> }, { path: "/warehouse/stock-transfer-requests/allocation", element: <TransferredStockPage /> },
    { path: "/warehouse/stock-transfer-requests/:id/details", element: <StockTransferPage /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}

it("lists only the kinds the user may see and reloads when the direction changes", async () => {
  const user = userEvent.setup();
  const { calls } = open("/warehouse/stock-transfer-requests", ["CanViewRawMaterialTransferList"]);
  expect(await screen.findByText("Lactose")).toBeTruthy();
  expect(screen.queryByText("Bottle caps")).toBeNull();
  expect(calls.some((call) => call.path.endsWith("/in-bound") && call.search.includes("status=1"))).toBe(true);
  await user.click(screen.getByRole("button", { name: "Requested by us" }));
  await waitFor(() => expect(calls.some((call) => call.path.endsWith("/out-bound"))).toBe(true));
});

it("issues the picked batches after a confirmation, to someone who may issue that kind", async () => {
  const user = userEvent.setup();
  open("/warehouse/stock-transfer-requests/t1/details", ["CanViewRawMaterialTransferList"]);
  expect(await screen.findByText("B-1")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Issue stock" })).toBeNull();
  cleanup();
  const { calls, router } = open("/warehouse/stock-transfer-requests/t1/details", ["CanIssueRawMaterialStockTransfers"]);
  await user.click(await screen.findByRole("button", { name: "Issue stock" }));
  const writes = () => calls.filter((call) => call.method !== "GET");
  expect(writes()).toEqual([]);
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Issue stock" }));
  await waitFor(() => expect(writes()).toHaveLength(1));
  expect(writes()[0]).toMatchObject({ method: "PUT", path: "/api/v1/production-schedule/stock-transfer/issue/t1", body: [{ batchId: "b1", quantity: 10 }] });
  await waitFor(() => expect(router.state.location.pathname).toBe("/warehouse/stock-transfer-requests"));
}, 20_000);

it("offers shelving of transferred stock only to those who may assign stock to shelves", async () => {
  open("/warehouse/stock-transfer-requests/allocation", ["CanViewRawMaterialTransferList"]);
  expect(await screen.findByText("Beta raw store")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Actions for Lactose/ })).toBeNull();
  cleanup();
  open("/warehouse/stock-transfer-requests/allocation", ["CanViewRawMaterialTransferList", "CanAssignRawMaterialsStockToShelves"]);
  await screen.findByText("Beta raw store");
  await openMenu(/Actions for Lactose/);
  expect(screen.getByRole("menuitem", { name: "Put on shelves" })).toBeTruthy();
});
