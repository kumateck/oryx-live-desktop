// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import AllocationRoute from "../../pages/(workspace)/crm/allocations/[id]/page";
import AllocationsRoute from "../../pages/(workspace)/crm/allocations/page";
import ProformaInvoiceRoute from "../../pages/(workspace)/crm/proforma-invoice/[id]/page";
import { ApiProvider } from "../../shared/api/api-provider";
import { SessionProvider } from "../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { openMenu } from "../../test/menu";
import { agreementFor, nextStep, packingGroups, packingRows, priceLines, proformaNumber, totalsByCurrency } from "./lib/dispatch";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

it("orders the steps to the customer, groups a packing list and prices lines at the agreement in effect", () => {
  const at = (approved: boolean, loadedAt: string | null, hasWaybill: boolean, deliveredAt: string | null = null) => ({ approved, loadedAt, hasWaybill, deliveredAt });
  expect([nextStep(at(false, null, false)), nextStep(at(true, null, false)), nextStep(at(true, "2026-10-01", false)), nextStep(at(true, "2026-10-01", true)), nextStep(at(true, "2026-10-01", true, "2026-10-02"))]).toEqual([null, "load", "waybill", "deliver", null]);
  const source = (quantity: number, batch: string, perShipper = 100) => ({ quantity, batch, made: null, expires: null, packing: "10 x 10", perShipper });
  const rows = packingRows([{ name: "Zinc", sources: [source(40, "B-9", 0)] }, { name: "Dicnac", sources: [source(250, "B-10"), source(120, "B-2")] }]);
  expect(rows.map((row) => [row.product, row.batch, row.shippers, row.loose])).toEqual([["Dicnac", "B-2", 1, 20], ["Dicnac", "B-10", 2, 50], ["Zinc", "B-9", 0, 40]]);
  // Only a product packed from more than one batch gets a subtotal.
  expect(packingGroups(rows).map((group) => group.subtotal)).toEqual([370, null]);
  const agreement = (id: string, price: number, from: string, to: string | null, symbol = "GHS") => ({ id, productId: "p1", productPackingId: "k1", agreedPrice: price, currency: { id: symbol, name: symbol, symbol }, effectiveFrom: from, effectiveTo: to });
  const agreements = [agreement("old", 2, "2026-01-01T00:00:00Z", "2026-06-30T23:59:59Z"), agreement("new", 3, "2026-07-01T00:00:00Z", null, "USD")];
  expect([agreementFor(agreements, "p1", "k1", "2026-03-01T00:00:00Z")?.id, agreementFor(agreements, "p1", "k1", "2026-09-01T00:00:00Z")?.id, agreementFor(agreements, "p1", "k9", "2026-09-01T00:00:00Z")]).toEqual(["old", "new", null]);
  const line = (key: string, productId: string, quantity: number, listPrice: number | null, listCurrencyId: string | null = "ghs") => ({ key, productId, productName: key, genericName: null, code: null, packingId: "k1", quantity, listPrice, listCurrencyId });
  const priced = priceLines([line("a", "p1", 10, 9), line("b", "p2", 5, 4)], agreements, "2026-09-01T00:00:00Z", new Map([["ghs", "GHS"]]));
  expect(priced.map((item) => [item.unitPrice, item.currency, item.source])).toEqual([[3, "USD", "agreement"], [4, "GHS", "default"]]);
  // A list price is shown in the currency it was set in, never the customer's; one without a currency says so rather than borrowing one.
  expect(priceLines([line("c", "p2", 1, 4, "usd")], [], null, new Map([["usd", "$"]]))[0]?.currency).toBe("$");
  expect(priceLines([line("d", "p2", 1, 4, null)], [], null, new Map())[0]).toMatchObject({ currency: null, currencyKey: "" });
  // One total per currency, never added together.
  expect(totalsByCurrency(priced)).toEqual([{ currency: "USD", amount: 30 }, { currency: "GHS", amount: 20 }]);
  expect(proformaNumber(7, 2026)).toBe("PFIN/FGP/26/008");
});

const allocation = (extra: object = {}) => ({ id: "a-1", approved: true, loadedAt: null, deliveredAt: null, createdAt: "2026-10-01T09:00:00Z", hasInvoice: false, hasWayBill: false,
  productionOrder: { id: "o-1", code: "PO-9", customer: { id: "c-1", name: "Acme Pharmacy", email: "buy@acme.test", address: "Accra", currency: { symbol: "GHS" } } },
  products: [{ product: { id: "p1", name: "Dicnac 100", code: "FP-1", price: 9 }, productPacking: { id: "k1", name: "10 x 10", packPerShipper: 100 },
    fulfilledQuantities: [{ quantity: 250, batchPackagingRecord: { batchNumber: "B-10", expiryDate: "2028-01-31T00:00:00Z" } }, { quantity: 120, batchPackagingRecord: { batchNumber: "B-2" } }] }], ...extra });
// The order this packing list fills: 400 packs ordered, the 370 on the list already counted as packed.
const productionOrder = { id: "o-1", code: "PO-9", status: 1, approved: true, customer: { id: "c-1", name: "Acme Pharmacy" },
  products: [{ product: { id: "p1", code: "FP-1", name: "Dicnac 100" }, totalOrderQuantity: 400, fulfilledQuantities: [{ quantity: 370 }], fulfilled: false, productPacking: { id: "k1", name: "10 x 10", packPerShipper: 100 } }] };
// Stock after this list took its packs: B-10 has none left, B-2 has 30 more.
const batch = (id: string, number: string, remaining: number) => ({ id, isApproved: true, totalQuantity: 1000, remainingQuantity: remaining, quantityPerPack: 1, productPacking: { id: "k1", name: "10 x 10", packPerShipper: 100 }, batchManufacturingRecord: { batchNumber: number } });
const batches = { finishedGoodsTransferNotes: [batch("n1", "B-10", 0), batch("n2", "B-2", 30)] };
const awaitingApproval = () => allocation({ approved: false, status: 0, products: [{ product: { id: "p1", name: "Dicnac 100", code: "FP-1", price: 9 }, productPacking: { id: "k1", name: "10 x 10", packPerShipper: 100 },
  fulfilledQuantities: [{ quantity: 250, finishedGoodsTransferNote: { id: "n1" }, batchPackagingRecord: { batchNumber: "B-10" } }, { quantity: 120, finishedGoodsTransferNote: { id: "n2" }, batchPackagingRecord: { batchNumber: "B-2" } }] }] });
interface Call { method: string; path: string; search: string; body?: unknown }
function open(address: string, permissions: string[], record: object = allocation()) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ method: input.method, path: url.pathname, search: url.search, ...(input.method !== "GET" ? { body: await input.clone().json().catch(() => null) } : {}) });
    if (url.pathname === "/api/v1/production-orders/allocate" && input.method === "GET") return Response.json({ data: [record], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname === "/api/v1/production-orders/allocate/a-1" && input.method === "GET") return Response.json(record);
    if (url.pathname === "/api/v1/production-orders/load/a-1") return new Response(null, { status: 204 });
    if (url.pathname === "/api/v1/production-orders/allocate/a-1" && input.method === "PUT") return new Response(null, { status: 204 });
    if (url.pathname === "/api/v1/production-orders/o-1") return Response.json(productionOrder);
    if (url.pathname === "/api/v1/production-schedule/approved-products/product/p1") return Response.json(batches);
    if (url.pathname === "/api/v1/customers/c-1/pricing-agreements") return Response.json([{ id: "ag", productId: "p1", productName: "Dicnac 100", productPackingId: "k1", productPackingName: "10 x 10", agreedPrice: 3, currency: { id: "cur", name: "Ghana cedi", symbol: "GHS" }, effectiveFrom: "2026-01-01T00:00:00Z" }]);
    if (url.pathname === "/api/v1/collection") return Response.json({ Currency: [{ id: "cur", name: "Ghana cedi", symbol: "GHS" }] });
    if (url.pathname === "/api/v1/configuration/ProformaInvoice/count") return Response.json(7);
    if (url.pathname === "/api/v1/production-orders/proforma-invoice" && input.method === "POST") return Response.json("pi-1");
    if (url.pathname === "/api/v1/production-orders/proforma-invoice/pi-1") return Response.json({ id: "pi-1", code: "PFIN/FGP/26/008", status: 0, createdAt: "2026-10-01T10:00:00Z", allocateProductionOrder: record, products: [{ id: "l1", product: { id: "p1", name: "Dicnac 100", code: "FP-1", price: 9 }, quantity: 370 }] });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/crm/allocations", element: <AllocationsRoute /> }, { path: "/crm/allocations/:id", element: <AllocationRoute /> }, { path: "/crm/proforma-invoice/:id", element: <ProformaInvoiceRoute /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}
// The currency lookup is a read the server takes as a POST; it changes nothing.
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET" && call.path !== "/api/v1/collection").map((call) => `${call.method} ${call.path}`);

it("lists packing lists and allocations behind their own permissions and loads an allocation only after confirming", async () => {
  const user = userEvent.setup();
  open("/crm/allocations?type=1", ["CanViewPackingList"]);
  // Allocations need the invoice permission; the packing list permission does not open them.
  await waitFor(() => expect(screen.queryByText("Acme Pharmacy")).toBeNull());
  cleanup();
  const { calls } = open("/crm/allocations?type=1", ["CanViewInvoice"]);
  expect(await screen.findByText("Acme Pharmacy")).toBeTruthy();
  expect(calls.find((call) => call.path === "/api/v1/production-orders/allocate")?.search).toContain("approved=true");
  await openMenu("Actions for order PO-9");
  await user.click(await screen.findByRole("menuitem", { name: "Mark as loaded" }));
  expect(writes(calls)).toEqual([]);
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Mark as loaded" }));
  await waitFor(() => expect(writes(calls)).toEqual(["PUT /api/v1/production-orders/load/a-1"]));
}, 20_000);

it("raises a proforma invoice only when Generate is pressed, at the customer's agreed price", async () => {
  const user = userEvent.setup();
  const { calls, router } = open("/crm/allocations/a-1", ["CanViewInvoice", "CanGenerateProformaInvoice", "CanViewProformaInvoice"]);
  expect(await screen.findByText("Subtotal · Dicnac 100")).toBeTruthy();
  expect(screen.getByText("3 shippers · 70 loose")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Generate proforma invoice" }));
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText("Agreed price")).toBeTruthy();
  expect(within(dialog).getAllByText("GHS 1,110.00").length).toBeGreaterThan(0);
  expect(await within(dialog).findByText(/PFIN\/FGP\/\d\d\/008/)).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.click(within(dialog).getByRole("button", { name: "Generate proforma invoice" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/crm/proforma-invoice/pi-1"));
  expect(calls.find((call) => call.method === "POST" && call.path === "/api/v1/production-orders/proforma-invoice")?.body).toMatchObject({ allocateProductionOrderId: "a-1", products: [{ productId: "p1", quantity: 370 }] });
  expect(await screen.findByRole("button", { name: "Send to customer" }).catch(() => null)).toBeNull();
}, 20_000);

it("will not invoice an allocation that is still waiting for approval", async () => {
  const user = userEvent.setup();
  open("/crm/allocations/a-1", ["CanViewPackingList", "CanGenerateProformaInvoice"], allocation({ approved: false }));
  expect(await screen.findByText(/waiting for approval. It can be invoiced/)).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Generate proforma invoice" }));
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText(/waiting for its own approval/)).toBeTruthy();
  expect((within(dialog).getByRole("button", { name: "Generate proforma invoice" }) as HTMLButtonElement).disabled).toBe(true);
});

it("edits a packing list waiting for approval, counting its own packs as free again", async () => {
  const user = userEvent.setup();
  const { calls } = open("/crm/allocations/a-1", ["CanViewPackingList", "CanGeneratePackingList"], awaitingApproval());
  await user.click(await screen.findByRole("button", { name: "Edit packing list" }));
  // B-10 opens at 2 shippers and 50 loose; its 250 packs count as free in the batch again.
  const loose = await screen.findByRole("spinbutton", { name: "Loose packs from batch B-10 for Dicnac 100" }, { timeout: 5_000 });
  const dialog = screen.getByRole("dialog", { name: /Edit packing list/ });
  expect((loose as HTMLInputElement).value).toBe("50");
  // Ordered 400; with this list's 370 given back, nothing is packed and all 400 are still to pack.
  expect(within(dialog).getAllByText("4 shippers · 0 loose")).toHaveLength(2);
  expect(within(dialog).getByText("0 shippers · 0 loose")).toBeTruthy();
  await user.clear(loose);
  await user.type(loose, "0");
  expect(writes(calls)).toEqual([]);
  await user.click(within(dialog).getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(writes(calls)).toEqual(["PUT /api/v1/production-orders/allocate/a-1"]));
  expect(calls.find((call) => call.method === "PUT")?.body).toMatchObject({ productionOrderId: "o-1",
    products: [{ productId: "p1", productPackingId: "k1", fulfilledQuantities: [{ finishedGoodsTransferNoteId: "n1", quantity: 200 }, { finishedGoodsTransferNoteId: "n2", quantity: 120 }] }] });
}, 20_000);

it("does not offer editing once a packing list is approved", async () => {
  open("/crm/allocations/a-1", ["CanViewInvoice", "CanGeneratePackingList"]);
  expect(await screen.findByText("Subtotal · Dicnac 100")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Edit packing list" })).toBeNull();
});

it("marks the goods as loaded from the proforma invoice, before the purchase order is attached", async () => {
  const user = userEvent.setup();
  const { calls } = open("/crm/proforma-invoice/pi-1", ["CanViewProformaInvoice", "CanViewInvoice"]);
  await user.click(await screen.findByRole("button", { name: "Mark as loaded" }));
  expect(writes(calls)).toEqual([]);
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Mark as loaded" }));
  await waitFor(() => expect(writes(calls)).toEqual(["PUT /api/v1/production-orders/load/a-1"]));
}, 20_000);
