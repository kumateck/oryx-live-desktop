// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import OrderRoute from "../../pages/(workspace)/crm/production-order/[id]/page";
import OrdersRoute from "../../pages/(workspace)/crm/production-order/page";
import { ApiProvider } from "../../shared/api/api-provider";
import { SessionProvider } from "../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { fulfilment, packingProblems, startingPacks } from "./lib/orders";
import { batchesSchema, orderSchema } from "./schemas/order-schema";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

const order = { id: "o-1", code: "PO-9", status: 1, approved: true, createdAt: "2026-09-20T00:00:00Z", totalValue: 900, customer: { id: "c-1", name: "Acme Pharmacy", email: "buy@acme.test", phone: "0244000000", address: "Accra" },
  products: [{ product: { id: "p1", code: "FP-1", name: "Dicnac 100" }, totalOrderQuantity: 250, shippers: 2, loose: 50, fulfilledQuantities: [{ quantity: 100 }], fulfilled: false, remainingQuantity: 150, productPacking: { id: "k1", name: "10 x 10", packPerShipper: 100 } },
    { product: { id: "p2", code: "FP-2", name: "Paracetamol" }, totalOrderQuantity: 40, shippers: 0, loose: 40, fulfilledQuantities: [{ quantity: 40 }], fulfilled: true, productPacking: { id: "k2", name: "Blister", packPerShipper: 0 } }] };
const notes = { finishedGoodsTransferNotes: [{ id: "n1", isApproved: true, totalQuantity: 500, remainingQuantity: 120, pendingAllocatedQuantity: 20, productPacking: { id: "k1", name: "10 x 10", packPerShipper: 100 }, batchManufacturingRecord: { batchNumber: "B-1", manufacturingDate: "2026-01-01T00:00:00Z", expiryDate: "2028-01-31T00:00:00Z" } },
  { id: "n2", isApproved: false, totalQuantity: 500, remainingQuantity: 500, pendingAllocatedQuantity: 0, productPacking: { id: "k1" }, batchManufacturingRecord: { batchNumber: "B-2" } },
  { id: "n3", isApproved: true, totalQuantity: 500, remainingQuantity: 500, pendingAllocatedQuantity: 0, productPacking: { id: "k9", packPerShipper: 50 }, batchManufacturingRecord: { batchNumber: "B-3" } },
  // Held as yield: 16,207 tablets at 200 a box is 81 whole boxes; the 7 tablets over cannot go on a packing list.
  { id: "n5", isApproved: true, totalQuantity: 32_000, remainingQuantity: 16_207, quantityPerPack: 200, productPacking: { id: "k5", name: "80 X 20 X 10", packPerShipper: 80 }, batchManufacturingRecord: { batchNumber: "B-5" } },
  // No saved units per pack: read from the packing style, whose "Tube = 25" row is the 25 g fill, not a count.
  { id: "n6", isApproved: true, totalQuantity: 720, remainingQuantity: 720, productPacking: { id: "k6", name: "18x20x25g", packPerShipper: 360, basePackingUoM: { name: "Tube", symbol: "Tu" },
    packingLists: [{ uom: { name: "Shipper", symbol: "s" }, quantity: 18, order: 0 }, { uom: { name: "Outer Carton", symbol: "Out ctn" }, quantity: 20, order: 0 }, { uom: { name: "Tube", symbol: "Tu" }, quantity: 25, order: 0 }] }, batchManufacturingRecord: { batchNumber: "B-6" } }] };
const pick = (key: string, noteId: string, packs: number, perShipper = 100) => ({ key, lineKey: "L", noteId, shippers: Math.floor(packs / perShipper), loose: packs % perShipper, packs });

it("reads an order's lines and checks a packing list against batch stock and what is still to pack", () => {
  const parsed = orderSchema.parse(order)!;
  expect(parsed.lines.map((line) => [line.fulfilled, line.remaining, line.complete])).toEqual([[100, 150, false], [40, 0, true]]);
  expect([fulfilment(250, 0), fulfilment(250, 100), fulfilment(250, 250)]).toEqual(["pending", "part", "fulfilled"]);
  // Only approved batches. Free stock is whole packs of the yield left; packing lists awaiting approval already took theirs.
  expect(batchesSchema.parse(notes).map((batch) => [batch.batchNumber, batch.free])).toEqual([["B-1", 120], ["B-3", 500], ["B-5", 81], ["B-6", 720]]);
  const line = { key: "L", productName: "Dicnac 100", remaining: 150 };
  const batch = { noteId: "n1", batchNumber: "B-1", free: 100 };
  expect(startingPacks(line, batch, [])).toBe(100);
  expect(startingPacks(line, { noteId: "n4", batchNumber: "B-4", free: 400 }, [pick("a", "n1", 100)])).toBe(50);
  const batches = new Map([["n1", batch], ["n4", { noteId: "n4", batchNumber: "B-4", free: 400 }]]);
  expect(packingProblems([], [line], batches)).toEqual(["Add at least one batch to the packing list."]);
  expect(packingProblems([pick("a", "n1", 120)], [line], batches)).toEqual(["Batch B-1 has 100 packs free; 120 are on the list."]);
  expect(packingProblems([pick("a", "n1", 100), pick("b", "n4", 60)], [line], batches)).toEqual(["Dicnac 100 needs 150 more packs; 160 are on the list."]);
  expect(packingProblems([pick("a", "n1", 100), pick("b", "n4", 50)], [line], batches)).toEqual([]);
  expect(packingProblems([{ ...pick("a", "n1", 0), shippers: Number.NaN, loose: Number.NaN }], [line], batches)).toEqual(["Enter the shippers or loose packs taken from batch B-1."]);
  expect(packingProblems([{ ...pick("a", "n1", 50), loose: 2.5 }], [line], batches)).toEqual(["Enter whole numbers of shippers and loose packs for batch B-1."]);
});

interface Call { method: string; path: string; search: string; body?: unknown }
function open(address: string, permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ method: input.method, path: url.pathname, search: url.search, ...(input.method !== "GET" ? { body: await input.clone().json().catch(() => null) } : {}) });
    if (url.pathname === "/api/v1/production-orders" && input.method === "GET") return Response.json({ data: [order], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname === "/api/v1/production-orders/o-1") return Response.json(order);
    if (url.pathname === "/api/v1/production-schedule/approved-products/product/p1") return Response.json(notes);
    if (url.pathname === "/api/v1/production-orders/allocate") return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/crm/production-order", element: <OrdersRoute /> }, { path: "/crm/production-order/:id", element: <OrderRoute /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}

it("lists orders by status and offers creating one only with the convert permission", async () => {
  const user = userEvent.setup();
  const { calls } = open("/crm/production-order?status=1", ["CanViewOrder"]);
  expect(await screen.findByText("PO-9")).toBeTruthy();
  expect(calls.find((call) => call.path === "/api/v1/production-orders")?.search).toContain("status=1");
  expect(screen.queryByRole("button", { name: "From approved quotation" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Fully packed" }));
  await waitFor(() => expect(calls.some((call) => call.search.includes("status=2"))).toBe(true));
});

it("shows what is packed and builds a packing list only for products still to pack", async () => {
  const user = userEvent.setup();
  open("/crm/production-order/o-1", ["CanViewOrder"]);
  expect(await screen.findByText("150 still to pack")).toBeTruthy();
  expect(screen.getByText("Part fulfilled")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Generate packing list" })).toBeNull();
  cleanup();
  const { calls } = open("/crm/production-order/o-1", ["CanViewOrder", "CanGeneratePackingList"]);
  await user.click(await screen.findByRole("button", { name: "Generate packing list" }));
  const dialog = await screen.findByRole("dialog");
  // The fully packed product is not offered.
  expect(within(dialog).queryByText("Paracetamol")).toBeNull();
  expect((within(dialog).getByRole("button", { name: "Create packing list" }) as HTMLButtonElement).disabled).toBe(true);
  expect(calls.filter((call) => call.method !== "GET")).toEqual([]);
}, 20_000);
