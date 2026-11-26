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
import { batchesInSupplyUnit, holdingRowsSchema, issueEligibility, supplyQuantity, transferIssueBlock, transferRowsSchema } from "./transfers";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

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
function open(address: string, permissions: string[], issued?: { history: boolean }, extra: { short?: string; rejected?: boolean } = {}) {
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
    if (extra.short && url.pathname.endsWith("/stock-transfer/batch/t1"))
      return Response.json({ title: "Server Failure", status: 412, errors: [{ code: "StockTransfer.InsufficientStock", description: extra.short }] }, { status: 412 });
    if (extra.rejected && url.pathname.endsWith("/stock-transfer/t1"))
      return Response.json({ ...transfer("t1", 0, 3), rejectionReason: "Stock is committed to a running campaign", rejectedAt: "2026-11-19T07:00:00Z", rejectedBy: { name: "Ama Mensah" } });
    if (url.pathname.endsWith("/stock-transfer/batch/t1")) {
      if (issued) return Response.json(issued.history ? [{ quantityToTake: 10, batch: { id: "b2", batchNumber: "ISSUED-LOT" } }] : []);
      return Response.json([{ quantityToTake: 10, batch: { id: "b1", batchNumber: "B-1", expiryDate: "2020-01-01T00:00:00Z", effectiveExpiryDate: "2099-01-01T00:00:00Z", expired: false } }]);
    }
    if (url.pathname.endsWith("/stock-transfer/t1")) return Response.json({ ...transfer("t1", 0), ...(issued ? { issuedAt: "2026-10-01T10:00:00Z" } : {}) });
    if (url.pathname === "/api/v1/material/holding") return Response.json({ data: [{ id: "h1", batches: [{ quantity: 5, sourceWarehouse: { name: "Beta raw store" }, materialBatch: { id: "b1", batchNumber: "B-1", uoM: { id: "u", symbol: "kg" }, material: { name: "Lactose" } } }] }], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname.includes("/warehouse/rack")) return Response.json([{ id: "r1", name: "Rack 1", warehouseLocation: { name: "Receiving store" }, shelves: [{ id: "s1", code: "A1" }] }]);
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

it.each([true, false])("shows issued transfer history or its empty state without an issue action (%s)", async (history) => {
  const { calls } = open("/warehouse/stock-transfer-requests/t1/details", ["CanIssueRawMaterialStockTransfers"], { history });
  expect(await screen.findByRole("heading", { name: "Issued batches" })).toBeTruthy();
  expect(screen.getByText(history ? "ISSUED-LOT" : "Issued batch history is unavailable for this transfer.")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Issue stock" })).toBeNull();
  expect(calls.every((call) => call.method === "GET")).toBe(true);
});

it("offers transferred stock shelving with its own assignment key, independently of issue and delivery shelving", async () => {
  const { calls } = open("/warehouse/stock-transfer-requests/allocation", ["CanViewRawMaterialTransferList", "CanIssueRawMaterialStockTransfers", "CanAssignRawMaterialsStockToShelves", "CanAssignPackagingMaterialStockTransfers"]);
  expect(await screen.findByText("Beta raw store")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Actions for Lactose/ })).toBeNull();
  expect(calls.every((call) => call.method === "GET")).toBe(true);
  cleanup();
  open("/warehouse/stock-transfer-requests/allocation", ["CanViewRawMaterialTransferList", "CanAssignRawMaterialStockTransfers"]);
  await screen.findByText("Beta raw store");
  await openMenu(/Actions for Lactose/);
  expect(screen.getByRole("menuitem", { name: "Put on shelves" })).toBeTruthy();
});

it.each([
  ["CanViewRawMaterialTransferList", "CanAssignRawMaterialStockTransfers"],
  ["CanViewPackagingMaterialTransferList", "CanAssignPackagingMaterialStockTransfers"],
])("shelves a received transfer with %s and its assignment key", async (view, assign) => {
  const user = userEvent.setup();
  const { calls } = open("/warehouse/stock-transfer-requests/allocation", [view, assign]);
  await screen.findByText("Beta raw store");
  await openMenu(/Actions for Lactose/);
  await user.click(screen.getByRole("menuitem", { name: "Put on shelves" }));
  const dialog = await screen.findByRole("dialog");
  await user.click(await within(dialog).findByRole("combobox", { name: /Rack/ }));
  await user.click(await screen.findByRole("option", { name: "Receiving store · Rack 1" }));
  await user.click(within(dialog).getByRole("combobox", { name: /Shelf/ }));
  await user.click(await screen.findByRole("option", { name: "A1" }));
  await user.click(within(dialog).getByRole("button", { name: "Put on shelves" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(calls.filter((call) => call.method !== "GET")).toEqual([
    expect.objectContaining({ method: "POST", path: "/api/v1/material/holding/move", body: {
      materialBatchId: "b1", holdingMaterialId: "h1", shelfMaterialBatches: [{ warehouseLocationShelfId: "s1", quantity: 5, uomId: "u", note: "" }],
    } }),
  ]);
});


it("uses the saved receiving quantity and unit while leaving received lines out of the shelving queue", () => {
  const batch = { quantity: 25, destinationQuantity: 20, destinationUoM: { id: "kg", symbol: "kg" },
    uoM: { id: "l", symbol: "l" }, materialBatch: { id: "lot", batchNumber: "B", uoM: { id: "l", symbol: "l" }, material: { name: "Liquid" } } };
  const rows = holdingRowsSchema.parse([{ id: "transfer", batches: [batch, { ...batch, receivedAt: "2026-11-18T12:00:00Z" }] }]);
  expect(rows).toHaveLength(1);
  expect(rows[0]).toMatchObject({ quantity: 20, unitId: "kg", unit: "kg" });
});

it("reads a transfer in the supplying store's unit and keeps the requester's figure beside it", () => {
  const only = <T,>(items: T[]): T => { const [item] = items; if (!item) throw new Error("Expected one transfer"); return item; };
  const row = only(transferRowsSchema.parse([{ id: "t9", status: 1, quantity: 20_000_000, uoM: { symbol: "mL" }, supplierQuantity: 20_720, supplierUoM: { symbol: "kg" }, material: { name: "Propylene Glycol", kind: 0 } }]));
  expect(supplyQuantity(row)).toEqual({ quantity: 20_720, unit: "kg", asked: { quantity: 20_000_000, unit: "mL" } });
  // An older server sends no supplier fields; the request quantity is shown as before.
  const old = only(transferRowsSchema.parse([{ id: "t8", status: 1, quantity: 10, uoM: { symbol: "kg" }, material: { name: "Lactose", kind: 0 } }]));
  expect(supplyQuantity(old)).toEqual({ quantity: 10, unit: "kg", asked: null });
  const batch = (sourceQuantity: number | null, sourceUnit: string | null) => ({ quantity: 1_000, sourceQuantity, sourceUnit });
  expect(batchesInSupplyUnit([batch(1.036, "kg")], "kg")).toEqual([{ quantity: 1.036, sourceQuantity: 1.036, sourceUnit: "kg" }]);
  expect(batchesInSupplyUnit([batch(1.036, "kg"), batch(null, null)], "kg")).toBeNull();
  expect(batchesInSupplyUnit([batch(1.036, "kg")], null)).toBeNull();
});

it("says plainly why a transfer cannot be issued and what the store can do", () => {
  const short = "The supplying store has 3,743.3 kg free of the 20,720 kg needed for 20,000 L. It is short by 16,976.7 kg.";
  expect(issueEligibility({ status: 1 }, short, true, true)).toEqual({ title: "Not enough stock to issue this transfer", reason: short,
    next: "Wait until the stock is received and approved, or reject it with the reason so the requesting department can ask elsewhere." });
  expect(issueEligibility({ status: 1 }, short, true, false).next).toBe("Wait until the stock is received and approved.");
  expect(issueEligibility({ status: 0 }, "This transfer is waiting for approval.", false, true).title).toBe("Not approved yet");
});

it("explains a shortfall and lets a store that may reject refuse the transfer with a reason", async () => {
  const user = userEvent.setup();
  const short = "The supplying store has 3,743.3 kg free of the 20,720 kg needed for 20,000 L. It is short by 16,976.7 kg.";
  const { calls } = open("/warehouse/stock-transfer-requests/t1/details", ["CanIssueRawMaterialStockTransfers", "CanRejectIncomingStockTransferRequest"], undefined, { short });
  const panel = await screen.findByRole("status", { name: "Not enough stock to issue this transfer" });
  expect(within(panel).getByText(short)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Issue stock" }).hasAttribute("disabled")).toBe(true);
  await user.click(screen.getByRole("button", { name: "Reject" }));
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByLabelText("Why can't it be supplied?"), "Only 3,743.3 kg in stock");
  await user.click(within(dialog).getByRole("button", { name: "Reject transfer" }));
  await waitFor(() => expect(calls.some((call) => call.method === "PUT")).toBe(true));
  expect(calls.find((call) => call.method === "PUT")).toMatchObject({ path: "/api/v1/production-schedule/stock-transfer/reject/t1", body: { reason: "Only 3,743.3 kg in stock" } });
}, 20_000);

it("offers no rejection without its key, and shows the reason once a transfer is rejected", async () => {
  open("/warehouse/stock-transfer-requests/t1/details", ["CanIssueRawMaterialStockTransfers"], undefined, { short: "It is short by 1 kg." });
  expect(await screen.findByRole("status", { name: "Not enough stock to issue this transfer" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Reject" })).toBeNull();
  cleanup(); forgetSession();
  open("/warehouse/stock-transfer-requests/t1/details", ["CanIssueRawMaterialStockTransfers", "CanRejectIncomingStockTransferRequest"], undefined, { rejected: true });
  const notice = await screen.findByRole("status", { name: "This store will not supply this transfer" });
  expect(within(notice).getByText("Stock is committed to a running campaign")).toBeTruthy();
  expect(within(notice).getByText(/By Ama Mensah/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Reject" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Issue stock" })).toBeNull();
});
