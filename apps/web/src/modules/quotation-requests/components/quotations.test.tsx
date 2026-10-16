// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import ProformaRequestsPage from "../../../pages/(workspace)/procurement/awarded-quotations/page";
import PriceComparisonPage from "../../../pages/(workspace)/procurement/price-comparison/page";
import ProformaResponsesPage from "../../../pages/(workspace)/procurement/profoma-responses/page";
import QuotationRequestsPage from "../../../pages/(workspace)/procurement/quotations/page";
import QuotationResponsesPage from "../../../pages/(workspace)/procurement/sales-quotation/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { chooseAction, openMenu } from "../../../test/menu";

// Radix Select needs these and jsdom has neither.
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => { cleanup(); forgetSession(); });

const mg = { id: "u-mg", symbol: "mg" };
const pcs = { id: "u-pcs", symbol: "pcs" };
const usd = { id: "c-usd", symbol: "$", name: "US Dollar" };
const acme = { id: "s1", name: "Acme Chemicals", email: "sales@acme.test", contactPerson: "Kofi Boateng", country: { name: "Ghana" }, currency: usd };
const bolt = { id: "s2", name: "Bolt Trading", email: null, currency: usd };
const starch = { id: "m1", code: "RM-001", name: "Maize starch" };
const film = { id: "m2", code: "PM-001", name: "Blister film" };
const requests = [
  { supplier: acme, sentQuotationRequestAt: null, items: [{ id: "i1", material: starch, uoM: mg, quantity: 25_000_000, defaultManufacturer: { name: "Roquette" } }, { id: "i2", material: film, uoM: pcs, quantity: 40 }] },
  { supplier: bolt, sentQuotationRequestAt: null, items: [{ id: "i3", material: starch, uoM: mg, quantity: 25_000_000 }] },
];
const quotation = { id: "q1", supplier: acme, receivedQuotation: false, items: [
  { id: "qi1", material: starch, uoM: mg, quantity: 25_000_000, defaultManufacturer: { name: "Roquette" } }, { id: "qi2", material: film, uoM: pcs, quantity: 40 }] };
const comparison = [
  { material: starch, uoM: mg, quantity: 25_000_000, supplierQuotation: [
    { supplier: acme, sourceRequisition: { id: "sr1", code: "SR-1" }, price: 12, priceUoM: "kg", defaultManufacturer: { name: "Roquette" } },
    { supplier: { ...bolt, email: "b@bolt.test" }, sourceRequisition: { id: "sr2", code: "SR-2" }, price: 0.011, priceUoM: "g" }] },
  { material: film, uoM: pcs, quantity: 40, supplierQuotation: [{ supplier: acme, sourceRequisition: { id: "sr1", code: "SR-1" }, price: 2.5, priceUoM: "pcs" }] },
];
const order = { id: "po1", code: "PO-0009", createdAt: "2026-09-25T09:00:00Z", status: 0, supplier: acme, items: [
  { id: "l1", material: starch, uom: mg, quantity: 25_000_000, price: 12, priceUoM: "kg", cost: 0 }, { id: "l2", material: film, uom: pcs, quantity: 40, price: 2.5, priceUoM: "pcs", cost: 0 }] };
const page = (data: unknown[]) => Response.json({ data, pageIndex: 1, pageCount: 1, totalRecordCount: data.length });

interface Call { method: string; path: string; search: string; body: unknown }
interface Options { pending?: boolean; uploadStatus?: number; agreements?: unknown[]; starchQuantity?: number }
function open(address: string, permissions: string[], options: Options = {}) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const path = url.pathname;
    const multipart = input.headers.get("content-type")?.includes("multipart") ?? false;
    const text = input.method === "GET" || multipart ? "" : await input.clone().text();
    calls.push({ method: input.method, path, search: url.search, body: multipart ? "files" : text ? JSON.parse(text) as unknown : null });
    if (path === "/api/v1/requisition/source/supplier") return page(url.searchParams.get("sent") === "true" ? [{ ...requests[0], sentQuotationRequestAt: "2026-09-20T08:00:00Z" }] : requests);
    if (path === "/api/v1/requisition/pending/s1") return Response.json(options.pending ?? false);
    if (path === "/api/v1/requisition/source/supplier/s1/send-quotation") return new Response(null, { status: 204 });
    if (path === "/api/v1/requisition/source/supplier/quotation" && url.searchParams.get("received") === "true") return page([{ ...quotation, receivedQuotation: true, items: [
      { ...quotation.items[0], quotedPrice: 12, priceUoM: "kg" }, { ...quotation.items[1], quotedPrice: 3, priceUoM: "pcs" }] }]);
    if (path === "/api/v1/requisition/source/supplier/quotation") return page([{ ...quotation, items: quotation.items.map((item) => item.id === "qi1" ? { ...item, quantity: options.starchQuantity ?? item.quantity } : item) }]);
    if (path === "/api/v1/suppliers/s1/pricing-agreements") return input.method === "GET" ? Response.json(options.agreements ?? []) : Response.json("new-agreement", { status: 201 });
    if (path === "/api/v1/requisition/source/supplier/q1/quotation/receive") return new Response(null, { status: 204 });
    if (path === "/api/v1/requisition/source/material/price-comparison") return Response.json(comparison);
    if (path === "/api/v1/requisition/source/quotation/process-purchase-order") return new Response(null, { status: 204 });
    if (path === "/api/v1/procurement/purchase-order") return page([{ ...order, status: Number(url.searchParams.get("status")) }]);
    if (path === "/api/v1/procurement/purchase-order/proforma-invoice/po1") return new Response(null, { status: 204 });
    if (path === "/api/v1/collection") return Response.json({ TermsOfPayment: [{ id: "t1", name: "30 days" }], DeliveryMode: [{ id: "d1", name: "Sea freight" }] });
    if (path === "/api/v1/procurement/purchase-order/first-step/po1") return new Response(null, { status: 204 });
    if (path === "/api/v1/file/PurchaseOrder/po1") return (options.uploadStatus ?? 200) === 200 ? new Response(null, { status: 200 })
      : Response.json({ errors: [{ code: "File.Upload", description: "The file store is unavailable." }] }, { status: options.uploadStatus ?? 500 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([
    { path: "/procurement/quotations", element: <QuotationRequestsPage /> },
    { path: "/procurement/sales-quotation", element: <QuotationResponsesPage /> },
    { path: "/procurement/price-comparison", element: <PriceComparisonPage /> },
    { path: "/procurement/awarded-quotations", element: <ProformaRequestsPage /> },
    { path: "/procurement/profoma-responses", element: <ProformaResponsesPage /> },
  ], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls };
}
// Reading the payment terms is a POST on the server; it is not a write.
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET" && call.path !== "/api/v1/collection");

it("sends a quotation request only when asked, and never as a side effect of looking at it", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/quotations", ["CanViewForeignQuotation", "CanSendForeignQuotationRequest"]);
  await chooseAction("Actions for Acme Chemicals", "Review and send");
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("sales@acme.test")).toBeTruthy();
  expect(within(dialog).getByText("25 kg")).toBeTruthy();
  expect(within(dialog).getByText("Roquette")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  const send = within(dialog).getByRole("button", { name: "Send request by email" });
  await waitFor(() => expect(send.hasAttribute("disabled")).toBe(false));
  await user.click(send);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls).map((call) => call.path)).toEqual(["/api/v1/requisition/source/supplier/s1/send-quotation"]);
});

it("says why a request cannot be sent: no email address, or quotes still in comparison", async () => {
  open("/procurement/quotations", ["CanViewForeignQuotation", "CanSendForeignQuotationRequest"], { pending: true });
  await chooseAction("Actions for Bolt Trading", "Review and send");
  let dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText(/This supplier has no email address/)).toBeTruthy();
  expect(within(dialog).getByRole("button", { name: "Send request by email" }).hasAttribute("disabled")).toBe(true);
  cleanup();
  open("/procurement/quotations", ["CanViewForeignQuotation", "CanSendForeignQuotationRequest"], { pending: true });
  await chooseAction("Actions for Acme Chemicals", "Review and send");
  dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText(/still has quotes waiting in price comparison/)).toBeTruthy();
  expect(within(dialog).getByRole("button", { name: "Send request by email" }).hasAttribute("disabled")).toBe(true);
});

it("lets a viewer read a request but not send it, and lists the requests already sent", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/quotations", ["CanViewForeignQuotation"]);
  await openMenu("Actions for Acme Chemicals");
  expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["View request"]);
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Sent" }));
  expect(await screen.findByText("Sent", { selector: "[data-slot=badge]" })).toBeTruthy();
  expect(calls.some((call) => call.path === "/api/v1/requisition/source/supplier" && new URLSearchParams(call.search).get("sent") === "true")).toBe(true);
});

it("records quoted prices with the unit each is priced per, after checking every line", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/sales-quotation", ["CanViewForeignQuotationResponse", "CanSendForeignQuotationResponse"]);
  await chooseAction("Actions for Acme Chemicals", "Record prices");
  const dialog = await screen.findByRole("dialog");
  const record = await within(dialog).findByRole("button", { name: "Record prices" });
  await waitFor(() => expect(record.hasAttribute("disabled")).toBe(false));
  await user.click(record);
  expect(await within(dialog).findByText("Enter the price quoted for Maize starch")).toBeTruthy();
  await user.type(within(dialog).getByRole("textbox", { name: "Unit price of Maize starch" }), "12");
  await user.type(within(dialog).getByRole("textbox", { name: "Unit price of Blister film" }), "2.5");
  await user.click(record);
  // A mass can be priced per mg, g or kg, so the unit has to be chosen; a counted unit has only one.
  expect(await within(dialog).findByText("Choose the unit Maize starch is priced per")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.click(within(dialog).getByRole("combobox", { name: "Unit Maize starch is priced per" }));
  await user.click(await screen.findByRole("option", { name: "kg" }));
  expect(await within(dialog).findByText("$ 300.00")).toBeTruthy();
  await user.click(record);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  // Without the agreements permission nothing but the quotation is written.
  expect(writes(calls)).toMatchObject([{ path: "/api/v1/requisition/source/supplier/q1/quotation/receive", body: [{ id: "qi1", price: 12, priceUoM: "kg" }, { id: "qi2", price: 2.5, priceUoM: "pcs" }] }]);
}, 20_000);

it("asks for confirmation before recording a line worth almost nothing", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/sales-quotation", ["CanViewForeignQuotationResponse", "CanSendForeignQuotationResponse"],
    { agreements: [{ id: "a1", supplierId: "s1", status: 1, changeKind: 0, materialId: "m2", materialName: "Blister film", uoMId: "u-pcs", uoMName: "pcs", agreedPrice: 2.5, priceUoM: "pcs",
      currency: { id: "c-usd", name: "US Dollar", symbol: "$" }, effectiveFrom: "2020-01-01T00:00:00Z" }], starchQuantity: 5 });
  await chooseAction("Actions for Acme Chemicals", "Record prices");
  const dialog = await screen.findByRole("dialog");
  // The standing agreement pre-fills the film's price.
  await waitFor(() => expect((within(dialog).getByRole("textbox", { name: "Unit price of Blister film" }) as HTMLInputElement).value).toBe("2.5"));
  // 5 mg priced per kg: the unit is almost certainly wrong.
  await user.type(within(dialog).getByRole("textbox", { name: "Unit price of Maize starch" }), "12");
  await user.click(within(dialog).getByRole("combobox", { name: "Unit Maize starch is priced per" }));
  await user.click(await screen.findByRole("option", { name: "kg" }));
  expect(await within(dialog).findByText("Check the unit")).toBeTruthy();
  await user.click(within(dialog).getByRole("button", { name: "Record prices" }));
  expect(await within(dialog).findByText("Check this line before recording")).toBeTruthy();
  expect(within(dialog).getByText(/5 mg at \$ 12 \/ kg comes to \$ 0.00006/)).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.click(within(dialog).getByRole("button", { name: "Confirm and record" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls)).toMatchObject([{ body: [{ id: "qi1", price: 12, priceUoM: "kg" }, { id: "qi2", price: 2.5, priceUoM: "pcs" }] }]);
}, 20_000);

it("offers to propose agreement changes to someone who manages agreements, and records prices only when told to", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/sales-quotation", ["CanViewForeignQuotationResponse", "CanSendForeignQuotationResponse", "CanManageSupplierContracts"]);
  await chooseAction("Actions for Acme Chemicals", "Record prices");
  const dialog = await screen.findByRole("dialog");
  await user.type(await within(dialog).findByRole("textbox", { name: "Unit price of Maize starch" }), "12");
  await user.type(within(dialog).getByRole("textbox", { name: "Unit price of Blister film" }), "2.5");
  await user.click(within(dialog).getByRole("combobox", { name: "Unit Maize starch is priced per" }));
  await user.click(await screen.findByRole("option", { name: "kg" }));
  await user.click(within(dialog).getByRole("button", { name: "Record prices" }));
  const changes = await within(dialog).findByRole("list", { name: "Agreement changes" });
  expect(within(changes).getAllByRole("listitem").map((item) => item.textContent)).toEqual(["Maize starchNo agreement → $ 12 / kg", "Blister filmNo agreement → $ 2.5 / pcs"]);
  expect(writes(calls)).toEqual([]);
  await user.click(within(dialog).getByRole("button", { name: "Record prices only" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls).map((call) => call.path)).toEqual(["/api/v1/requisition/source/supplier/q1/quotation/receive"]);
}, 20_000);

it("creates purchase orders only when every material has a supplier, grouped by supplier", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/price-comparison", ["CanViewForeignVendorPricing", "CanApplyChangesForForeignVendorPricingSelection"]);
  const starchCard = await screen.findByRole("region", { name: "Maize starch" });
  // 0.011 per g beats 12 per kg once both are put on the same footing.
  expect(within(within(starchCard).getByText("Bolt Trading").closest("tr") as HTMLElement).getByText("Lowest")).toBeTruthy();
  expect(within(within(starchCard).getByText("Acme Chemicals").closest("tr") as HTMLElement).getByText("$ 300.00")).toBeTruthy();
  const create = screen.getByRole("button", { name: "Create purchase orders" });
  expect(create.hasAttribute("disabled")).toBe(true);
  await user.click(screen.getByRole("radio", { name: "Choose Bolt Trading for Maize starch" }));
  expect(screen.getByText("1 of 2")).toBeTruthy();
  expect(create.hasAttribute("disabled")).toBe(true);
  await user.click(screen.getByRole("radio", { name: "Choose Acme Chemicals for Blister film" }));
  await user.click(create);
  const confirm = await screen.findByRole("dialog");
  expect(within(confirm).getByText(/Bolt Trading \(1 material\), Acme Chemicals \(1 material\)/)).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.click(within(confirm).getByRole("button", { name: "Create purchase orders" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  const sent = calls.find((call) => call.method === "POST");
  expect(new URLSearchParams(sent?.search).get("supplierType")).toBe("0");
  expect(sent?.body).toEqual([
    { supplierId: "s2", sourceRequisitionId: "sr2", items: [{ materialId: "m1", uomId: "u-mg", quantity: 25_000_000, price: 0.011, priceUoM: "g", currencyId: "c-usd" }] },
    { supplierId: "s1", sourceRequisitionId: "sr1", items: [{ materialId: "m2", uomId: "u-pcs", quantity: 40, price: 2.5, priceUoM: "pcs", currencyId: "c-usd" }] }]);
});

it("shows the comparison to a viewer without any way to choose", async () => {
  open("/procurement/price-comparison", ["CanViewForeignVendorPricing"]);
  await screen.findByRole("region", { name: "Maize starch" });
  expect(screen.queryByRole("radio")).toBeNull();
  expect(screen.queryByRole("button", { name: "Create purchase orders" })).toBeNull();
});

it("asks the awarded supplier for a proforma invoice with the order value shown", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/awarded-quotations", ["CanViewForeignProformaRequest", "CanSendForeignProformaRequest"]);
  expect(await screen.findByText("$ 400.00")).toBeTruthy();
  expect(new URLSearchParams(calls.find((call) => call.path === "/api/v1/procurement/purchase-order")?.search).get("status")).toBe("0");
  await chooseAction("Actions for PO-0009", "Review and send");
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("$ 12 / kg")).toBeTruthy();
  expect(within(dialog).getByText("$ 300.00")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.click(within(dialog).getByRole("button", { name: "Send request by email" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls).map((call) => call.path)).toEqual(["/api/v1/procurement/purchase-order/proforma-invoice/po1"]);
});

async function fillProforma(user: ReturnType<typeof userEvent.setup>) {
  await chooseAction("Actions for PO-0009", "Record proforma invoice");
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Record proforma invoice" }));
  expect(await within(dialog).findByText("Enter the proforma invoice number")).toBeTruthy();
  expect(await within(dialog).findByText("Attach the proforma invoice")).toBeTruthy();
  await user.type(within(dialog).getByRole("textbox", { name: /Proforma invoice number/ }), "PFI-778");
  await user.click(within(dialog).getByRole("combobox", { name: /Terms of payment/ }));
  await user.click(await screen.findByRole("option", { name: "30 days" }));
  await user.click(within(dialog).getByRole("combobox", { name: /Delivery mode/ }));
  await user.click(await screen.findByRole("option", { name: "Sea freight" }));
  await user.click(within(dialog).getByRole("button", { name: /Estimated delivery/ }));
  const today = new Date();
  await user.click(await screen.findByRole("button", { name: new RegExp(`${today.toLocaleString("en-US", { month: "long" })} ${today.getDate()}(st|nd|rd|th)?,`) }));
  await user.upload(within(dialog).getByLabelText(/Proforma invoice document/), new File(["pfi"], "pfi-778.pdf", { type: "application/pdf" }));
  await user.click(within(dialog).getByRole("button", { name: "Record proforma invoice" }));
  return dialog;
}

it("records a proforma invoice: the details first, then the document that moves the order on", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/profoma-responses", ["CanViewForeignProformaInvoiceSubmissions", "CanSendForeignProformaInvoice"]);
  await screen.findByText("PO-0009");
  expect(new URLSearchParams(calls.find((call) => call.path === "/api/v1/procurement/purchase-order")?.search).get("status")).toBe("2");
  await fillProforma(user);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  const written = writes(calls);
  expect(written.map((call) => `${call.method} ${call.path}`)).toEqual(["PUT /api/v1/procurement/purchase-order/first-step/po1", "POST /api/v1/file/PurchaseOrder/po1"]);
  expect(written[0]?.body).toMatchObject({ proFormaInvoiceNumber: "PFI-778", termsOfPaymentId: "t1", deliveryModeId: "d1" });
}, 30_000);

it("keeps the dialog open and says the details were saved when the document cannot be attached", async () => {
  const user = userEvent.setup();
  open("/procurement/profoma-responses", ["CanViewForeignProformaInvoiceSubmissions", "CanSendForeignProformaInvoice"], { uploadStatus: 500 });
  await screen.findByText("PO-0009");
  const dialog = await fillProforma(user);
  expect(await within(dialog).findByText(/The details were saved, but the document could not be attached/)).toBeTruthy();
}, 30_000);

it("prints a quotation request as a paper copy without sending it", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/quotations", ["CanViewForeignQuotation", "CanSendForeignQuotationRequest"]);
  await chooseAction("Actions for Acme Chemicals", "Review and send");
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Print" }));
  const preview = (await screen.findAllByRole("dialog")).at(-1) as HTMLElement;
  expect(within(preview).getByText("Printing does not send the request to the supplier.", { exact: false })).toBeTruthy();
  expect(within(preview).getByText("To: Acme Chemicals")).toBeTruthy();
  expect(within(preview).getByText("Priced per")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
});

it("corrects a recorded price only on the line still in price comparison, and sends only that line", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/sales-quotation?show=received", ["CanViewForeignQuotationResponse", "CanSendForeignQuotationResponse"]);
  await chooseAction("Actions for Acme Chemicals", "Correct prices");
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText(/1 of 2 lines are still in price comparison/)).toBeTruthy();
  // The film's price is no longer the one in comparison, so it can only be read.
  expect(within(dialog).queryByRole("textbox", { name: "Unit price of Blister film" })).toBeNull();
  const price = within(dialog).getByRole("textbox", { name: "Unit price of Maize starch" });
  await user.click(within(dialog).getByRole("button", { name: "Save corrections" }));
  expect(await within(dialog).findByText("Nothing has been changed")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.clear(price);
  await user.type(price, "11.5");
  await user.click(within(dialog).getByRole("button", { name: "Save corrections" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls)).toMatchObject([{ path: "/api/v1/requisition/source/supplier/q1/quotation/receive", body: [{ id: "qi1", price: 11.5, priceUoM: "kg" }] }]);
}, 20_000);

it("offers no correction to a viewer", async () => {
  open("/procurement/sales-quotation?show=received", ["CanViewForeignQuotationResponse"]);
  await openMenu("Actions for Acme Chemicals");
  expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["View prices"]);
});
