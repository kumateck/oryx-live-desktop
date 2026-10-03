// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import ShipmentInvoicePage from "../../../pages/(workspace)/logistics/shipment-invoices/[id]/page";
import CreateShipmentInvoicePage from "../../../pages/(workspace)/logistics/shipment-invoices/create/page";
import ShipmentInvoicesPage from "../../../pages/(workspace)/logistics/shipment-invoices/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { purchaseOrderRowsSchema } from "../../proforma-requests/schemas/purchase-order-schema";
import { invoiceLineProblems, invoiceRequest, invoiceableOrders, mergeInvoiceLines, startInvoiceLines } from "../lib/invoice-lines";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => { cleanup(); forgetSession(); });

const supplier = { id: "s1", name: "Acme Chemicals", type: 0, currency: { id: "c-usd", symbol: "$" } };
const maker = (id: string, name: string, preferred = false) => ({ default: preferred, manufacturer: { id, name } });
const order = (id: string, status: number, invoiced = 0) => ({ id, code: id.toUpperCase(), status, supplier, items: [
  { id: `${id}-l1`, material: { id: "m1", name: "Maize starch", code: "RM-001" }, uom: { id: "u-mg", symbol: "mg" }, quantity: 25_000_000, quantityInvoiced: invoiced, price: 12, priceUoM: "kg",
    manufacturers: [maker("mf2", "Other maker"), maker("mf1", "Roquette", true), maker("mf1", "Roquette", true)] }] });
const orders = [order("po-1", 7, 5_000_000), order("po-2", 9, 25_000_000), order("po-3", 6)];

it("offers only sent orders with something left, starting each line at what is left with the default manufacturer", () => {
  const open = invoiceableOrders(purchaseOrderRowsSchema.parse(orders));
  expect(open.map((item) => item.code)).toEqual(["PO-1"]);
  const [line] = startInvoiceLines(open);
  expect(line).toMatchObject({ key: "po-1:m1", remaining: 20_000_000, quantity: 20, enteredUnit: "kg", manufacturerId: "mf1" });
  expect(line?.manufacturers.map((item) => item.label)).toEqual(["Roquette", "Other maker"]);
  expect(invoiceLineProblems([line!])).toEqual([]);
  expect(invoiceLineProblems([{ ...line!, quantity: 21 }])[0]?.message).toBe("Maize starch: only 20 kg of PO-1 is left to invoice");
  expect(invoiceLineProblems([{ ...line!, quantity: 8 }])[0]?.message).toBe("Maize starch: say why less than the 20 kg left on PO-1 is invoiced");
  expect(invoiceLineProblems([{ ...line!, included: false }])).toEqual([{ key: null, message: "Keep at least one line on the invoice" }]);
  expect(invoiceRequest(" INV-9 ", "s1", [{ ...line!, quantity: 8, reason: "Part shipment" }])).toEqual({ code: "INV-9", supplierId: "s1", items: [
    { materialId: "m1", uoMId: "u-mg", manufacturerId: "mf1", purchaseOrderId: "po-1", expectedQuantity: 20_000_000, receivedQuantity: 8_000_000, reason: "Part shipment" }] });
  // What was typed on a line that stays is kept when the chosen orders change.
  expect(mergeInvoiceLines([{ ...line!, quantity: 8, reason: "Part shipment" }], startInvoiceLines(open))[0]).toMatchObject({ quantity: 8, reason: "Part shipment" });
});

const invoice = { id: "inv1", code: "INV-9", createdAt: "2026-09-28T00:00:00Z", supplier, isUsed: false, items: [
  { id: "i1", material: { name: "Maize starch", code: "RM-001" }, uoM: { symbol: "mg" }, manufacturer: { name: "Roquette" }, purchaseOrder: { id: "po-1", code: "PO-1" }, expectedQuantity: 20_000_000, receivedQuantity: 8_000_000, price: 12, priceUoM: "kg", reason: "Part shipment" }] };
interface Call { method: string; path: string; body: unknown }
function open(address: string, permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    calls.push({ method: input.method, path, body: input.method === "GET" ? null : await input.clone().json() });
    if (path === "/api/v1/procurement/shipment-invoice") return input.method === "GET" ? Response.json({ data: [invoice], pageIndex: 1, pageCount: 1, totalRecordCount: 1 }) : Response.json("inv2", { status: 201 });
    if (path === "/api/v1/procurement/shipment-invoice/inv1") return Response.json(invoice);
    if (path === "/api/v1/procurement/purchase-order/not-linked") return Response.json([supplier]);
    if (path === "/api/v1/procurement/purchase-order/supplier/s1/not-linked") return Response.json(orders);
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/logistics/shipment-invoices", element: <ShipmentInvoicesPage /> }, { path: "/logistics/shipment-invoices/create", element: <CreateShipmentInvoicePage /> },
    { path: "/logistics/shipment-invoices/:id", element: <ShipmentInvoicePage /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}

it("lists invoices with their value and opens one; recording needs its own permission", async () => {
  const user = userEvent.setup();
  const { router } = open("/logistics/shipment-invoices", ["CanViewShipmentInvoice"]);
  const row = (await screen.findByText("INV-9")).closest("tr") as HTMLElement;
  expect(within(row).getByText("$ 96.00")).toBeTruthy();
  expect(within(row).getByText("Not yet shipped")).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Record invoice" })).toBeNull();
  await user.click(row);
  await waitFor(() => expect(router.state.location.pathname).toBe("/logistics/shipment-invoices/inv1"));
  expect(await screen.findByText("Expected 20 kg")).toBeTruthy();
  expect(screen.getByText("Part shipment")).toBeTruthy();
});

it("records an invoice for part of what is left only with a reason", async () => {
  const user = userEvent.setup();
  const { calls, router } = open("/logistics/shipment-invoices/create", ["CanViewShipmentInvoice", "CanCreateShipmentInvoice"]);
  await user.type(await screen.findByRole("textbox", { name: /Invoice number/ }), "INV-10");
  await user.click(screen.getByRole("combobox", { name: /Supplier/ }));
  await user.click(await screen.findByRole("option", { name: "Acme Chemicals" }));
  await user.click(await screen.findByRole("button", { name: /Purchase orders/ }));
  // The fully invoiced order and the one not yet sent are not offered.
  await user.click(await screen.findByText("PO-1"));
  expect(screen.queryByText("PO-2")).toBeNull();
  expect(screen.queryByText("PO-3")).toBeNull();
  await user.keyboard("{Escape}");
  const quantity = await screen.findByRole("textbox", { name: "Quantity of Maize starch on PO-1" });
  expect((quantity as HTMLInputElement).value).toBe("20");
  expect(screen.getByText("$ 240.00", { selector: "span.font-semibold" })).toBeTruthy();
  await user.clear(quantity);
  await user.type(quantity, "8");
  await user.click(screen.getByRole("button", { name: "Record invoice" }));
  expect(await screen.findByText("Maize starch: say why less than the 20 kg left on PO-1 is invoiced")).toBeTruthy();
  expect(calls.some((call) => call.method === "POST")).toBe(false);
  await user.type(screen.getByRole("textbox", { name: "Reason for Maize starch on PO-1" }), "Part shipment");
  await user.click(screen.getByRole("button", { name: "Record invoice" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/logistics/shipment-invoices"));
  expect(calls.find((call) => call.method === "POST")?.body).toEqual({ code: "INV-10", supplierId: "s1", items: [
    { materialId: "m1", uoMId: "u-mg", manufacturerId: "mf1", purchaseOrderId: "po-1", expectedQuantity: 20_000_000, receivedQuantity: 8_000_000, reason: "Part shipment" }] });
}, 30_000);
