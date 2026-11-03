// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { canAccess } from "@/shared/auth/access";
import { SessionProvider } from "@/shared/auth/session-provider";
import { SessionReady } from "@/test/session-ready";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { chooseDate } from "@/test/date-picker";
import { openMenu } from "@/test/menu";
import { EditQuotationDialog } from "./components/service-quotation-dialogs";
import { EditMemoDialog } from "./components/memo-form";
import { RequestProformaDialog } from "./components/proforma-dialogs";
import { quotationSchema, memoSchema } from "./lib/service-procurement";
import { modules } from "../registry";
import { routeAccessPolicy } from "../registry-model";
import { ServiceMemoDetailPage, ServiceMemosPage } from "./components/memo-pages";
import { ServicePriceComparisonPage } from "./components/price-comparison-page";
import { ServiceProformaPage } from "./components/proforma-page";
import { ServiceQuoteResponsesPage } from "./components/quote-responses-page";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

const page = (data: unknown[]) => ({ data, pageIndex: 1, pageCount: 1, totalRecordCount: data.length });
const provider = (name: string) => ({ id: `sp-${name}`, name });
const quote = (id: string, name: string, cost: number, extra: Record<string, unknown> = {}) => ({ id, quotationNumber: `Q-${id}`, jobOrderId: "o1", jobOrderStatus: 2, status: 0, isSelected: false,
  submittedDate: "2026-10-20T00:00:00Z", estimatedDays: 3, estimatedCompletionDate: "2026-10-25T00:00:00Z", serviceProvider: provider(name), currency: { symbol: "GHS" },
  serviceCharges: [{ name: "Labour", cost }], totalServiceCharge: cost, totalItemCost: 0, grandTotal: cost, items: [], ...extra });
const order = (status = 2) => ({ id: "o1", code: "JO-001", status, service: { name: "HVAC repair" }, issuedDate: "2026-10-19T00:00:00Z",
  serviceProviders: [{ id: "jsp1", sentAt: "2026-10-19T00:00:00Z", responseReceived: true, serviceProvider: provider("Cool Air") }, { id: "jsp2", sentAt: "2026-10-19T00:00:00Z", responseReceived: false, serviceProvider: provider("Breeze") }],
  quotations: [{ id: "q1" }, { id: "q2" }] });
const proforma = (status: number, extra: Record<string, unknown> = {}) => ({ id: "p1", invoiceNumber: status ? "PI-9" : null, status, requestedDate: "2026-10-21T00:00:00Z", serviceCharge: 100, totalCost: 120,
  jobOrder: { id: "o1", code: "JO-001" }, currency: { symbol: "GHS" }, serviceQuotation: { id: "q1", quotationNumber: "Q-q1", serviceProvider: provider("Cool Air") },
  items: [{ id: "pi1", quantity: 2, unitPrice: 10, item: { name: "Filter" }, unitOfMeasure: { symbol: "pc" } }, { id: "pi2", quantity: 1, unitPrice: 0, item: { name: "Seal" }, unitOfMeasure: { symbol: "pc" } }], ...extra });
const memo = (status: number, paid = false) => ({ id: "m1", memoNumber: "SM-001", status, paid, agreedServiceCharge: 100, agreedMaterialsCost: 20, totalAgreedCost: 120,
  issuedDate: "2026-10-22T00:00:00Z", expectedStartDate: "2026-10-23T00:00:00Z", expectedCompletionDate: "2026-10-25T00:00:00Z", jobOrder: { id: "o1", code: "JO-001" }, serviceProvider: { name: "Cool Air" } });

function open(element: ReactNode, granted: string[], path = "/x") {
  const backend = stubBackend({ permissions: granted });
  const auth = backend.fetcher.getMockImplementation();
  const state = { order: order(), quotes: [quote("q1", "Cool Air", 100), quote("q2", "Breeze", 80)], proformas: [proforma(0)], memo: memo(0), refuse: false };
  const calls: { path: string; search: string; method: string; body: unknown }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ path: url.pathname, search: url.search, method: input.method, body: input.method === "GET" ? null : await input.clone().json().catch(() => null) });
    if (url.pathname === "/api/v1/collection") return Response.json({ Currency: [{ id: "c1", name: "GHS" }], Charge: [{ id: "ch1", name: "Labour" }] });
    if (url.pathname === "/api/v1/service-memos" && input.method === "POST") return Response.json("m9");
    if (input.method !== "GET") return state.refuse ? Response.json({ errors: [{ description: "Please retry this save." }] }, { status: 409 }) : new Response(null, { status: 204 });
    if (url.pathname === "/api/v1/items/choices") return Response.json(page([{ id: "i1", name: "Filter", code: "FIL", unitOfMeasureId: "u1", unitOfMeasureSymbol: "pc", unitOfMeasureName: "Piece", availableQuantity: 10, classification: 0 }]));
    if (url.pathname === "/api/v1/job-orders") return Response.json(page([state.order]));
    if (url.pathname === "/api/v1/job-orders/o1") return Response.json(state.order);
    if (url.pathname === "/api/v1/job-orders/service-providers") return Response.json(page([{ id: "jsp2", jobOrderId: "o1", sentAt: "2026-10-19T00:00:00Z", responseReceived: false, serviceProvider: provider("Breeze") }]));
    if (url.pathname === "/api/v1/service-quotations") return Response.json(page(state.quotes));
    if (url.pathname.startsWith("/api/v1/service-quotations/")) return Response.json(state.quotes.find((q) => url.pathname.endsWith(q.id)));
    if (url.pathname === "/api/v1/service-proforma-invoices") return Response.json(page(state.proformas));
    if (url.pathname === "/api/v1/service-proforma-invoices/p1") return Response.json(state.proformas[0]);
    if (url.pathname === "/api/v1/service-memos") return Response.json(page([state.memo]));
    if (url.pathname === "/api/v1/service-memos/m1") return Response.json(state.memo);
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([{ path: "/x/:id?", element }, { path: "/extrals/service-memo/:id", element: <p>memo opened</p> }], { initialEntries: [path] });
  render(<SessionProvider><SessionReady><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionReady></SessionProvider>);
  return { state, calls, writes: () => calls.filter((c) => c.method !== "GET" && c.path !== "/api/v1/collection") };
}
afterEach(() => { cleanup(); forgetSession(); });

it("guards each service procurement page with its own view key", () => {
  const can = (path: string, keys: string[]) => { const p = routeAccessPolicy(modules, path); return Boolean(p && canAccess(p.access, { state: "authenticated", permissions: new Set(keys) })); };
  expect(can("/extrals/service-quotation-response", ["CanViewServicesQuotationResponses"])).toBe(true);
  expect(can("/extrals/service-price-comparison", ["CanViewServicesQuotationResponses"])).toBe(false);
  expect(can("/extrals/service-price-comparison", ["CanViewServicesPricingSelection"])).toBe(true);
  expect(can("/extrals/service-proforma-request", ["CanViewServicesProformaResponses"])).toBe(true);
  expect(can("/extrals/service-memo/m1", ["CanViewServicesMemo"])).toBe(true);
  expect(can("/extrals/service-memo/m1", ["CanViewServicesPricingSelection"])).toBe(false);
});

it("records a provider's quotation with its charges and refuses it without a currency", async () => {
  const user = userEvent.setup();
  const app = open(<ServiceQuoteResponsesPage />, ["CanViewServicesQuotationResponses", "CanSendServicesQuotationResponse"]);
  await openMenu(/Actions for Breeze/); await user.click(screen.getByRole("menuitem", { name: "Record quotation" }));
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Record quotation" }));
  expect(await within(dialog).findByText("Choose the currency of the quotation.")).toBeTruthy();
  await user.click(within(dialog).getByRole("combobox", { name: "Currency" })); await user.click(await screen.findByRole("option", { name: "GHS" }));
  await user.type(await within(dialog).findByRole("textbox", { name: "Estimated days" }), "4");
  await chooseDate(user, "Estimated completion", 2026, 10, 30);
  await user.click(within(dialog).getByRole("combobox", { name: "Charge 1" })); await user.click(await screen.findByRole("option", { name: "Labour" }));
  await user.type(within(dialog).getByRole("textbox", { name: "Cost of charge 1" }), "250");
  await user.click(within(dialog).getByRole("button", { name: "Add charge" }));
  await user.click(await within(dialog).findByRole("combobox", { name: "Charge 2" }));
  await user.click(await screen.findByRole("option", { name: "Labour" }));
  await user.type(within(dialog).getByRole("textbox", { name: "Cost of charge 2" }), "250.0000");
  await user.click(within(dialog).getByRole("button", { name: "Remove charge 1" }));
  expect(await within(dialog).findByRole("textbox", { name: "Cost of charge 1" })).toHaveProperty("value", "250.0000");
  await user.click(within(dialog).getByRole("button", { name: "Add material" }));
  await user.click(await within(dialog).findByRole("combobox", { name: "Material 1" }));
  await user.click(await screen.findByRole("option", { name: "Filter · FIL" }));
  await user.type(within(dialog).getByRole("textbox", { name: "Quantity of material 1" }), "1.2500");
  await user.type(within(dialog).getByRole("textbox", { name: "Unit price of material 1" }), "2.50");
  await user.click(within(dialog).getByRole("button", { name: "Record quotation" }));
  await waitFor(() => expect(app.writes()).toHaveLength(1));
  expect(app.writes()[0]).toMatchObject({ path: "/api/v1/service-quotations", body: { jobOrderId: "o1", serviceProviderId: "sp-Breeze", currencyId: "c1", estimatedDays: 4,
    serviceCharges: [{ name: "Labour", cost: 250 }], items: [{ itemId: "i1", unitOfMeasureId: "u1", quantity: 1.25, unitPrice: 2.5 }] } });
});

it("selects a quotation only when the quotations are as they were compared", async () => {
  const user = userEvent.setup();
  const app = open(<ServicePriceComparisonPage />, ["CanViewServicesPricingSelection", "CanApplyChangesForServicesPricingSelection"]);
  expect(await screen.findByText(/request and approve its proforma invoice before raising a service memo/)).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Service proforma requests" })).toBeNull();
  await openMenu(/Actions for JO-001/); await user.click(screen.getByRole("menuitem", { name: "Compare and select" }));
  const dialog = await screen.findByRole("dialog");
  const options = await within(dialog).findAllByRole("radio");
  // Cheapest first.
  expect(within(dialog).getAllByText(/^(Breeze|Cool Air)$/).map((n) => n.textContent)).toEqual(["Breeze", "Cool Air"]);
  await user.click(options[0] as HTMLElement);
  await user.click(within(dialog).getByRole("button", { name: "Select quotation" }));
  app.state.quotes = [quote("q1", "Cool Air", 100), quote("q2", "Breeze", 95)];
  await user.click(within(dialog).getByRole("button", { name: "Confirm selection" }));
  expect(await within(dialog).findByText(/quotations changed/)).toBeTruthy();
  expect(app.writes()).toHaveLength(0);
  app.state.quotes = [quote("q1", "Cool Air", 100), quote("q2", "Breeze", 80)];
  await user.click(within(dialog).getByRole("button", { name: "Confirm selection" }));
  await waitFor(() => expect(app.writes()).toHaveLength(1));
  expect(app.writes()[0]).toMatchObject({ path: "/api/v1/job-orders/select-quotation", body: { jobOrderId: "o1", quotationId: "q2" } });
});

it("records a proforma response with only the changed line prices", async () => {
  const user = userEvent.setup();
  const app = open(<ServiceProformaPage />, ["CanViewServicesProformaResponses", "CanSendServicesProformaResponse"]);
  await screen.findByText("No selected quotations need a proforma");
  await user.click(screen.getByRole("button", { name: "Awaiting response" }));
  await openMenu(/Actions for Cool Air/); await user.click(screen.getByRole("menuitem", { name: "Record response" }));
  const dialog = await screen.findByRole("dialog");
  await user.type(await within(dialog).findByRole("textbox", { name: "Invoice number" }), "PI-9");
  const price = await within(dialog).findByRole("textbox", { name: "Unit price of Filter" });
  await user.clear(price); await user.type(price, "12");
  await user.click(within(dialog).getByRole("button", { name: "Record response" }));
  await waitFor(() => expect(app.writes()).toHaveLength(1));
  expect(app.writes()[0]).toMatchObject({ path: "/api/v1/service-proforma-invoices/respond", body: { serviceProformaInvoiceId: "p1", invoiceNumber: "PI-9", updatedItems: [{ serviceProformaInvoiceItemId: "pi1", unitPrice: 12 }] } });
});

it("does not approve a proforma that changed after it was opened", async () => {
  const user = userEvent.setup();
  const app = open(<ServiceProformaPage />, ["CanViewServicesPurchaseOrders", "CanCreateServicesPurchaseOrder"]);
  app.state.proformas = [proforma(1)];
  await screen.findByText("No selected quotations need a proforma");
  await user.click(screen.getByRole("button", { name: "Received" }));
  await openMenu(/Actions for Cool Air/); await user.click(screen.getByRole("menuitem", { name: "Approve" }));
  app.state.proformas = [proforma(1, { totalCost: 150 })];
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Approve" }));
  expect(await within(screen.getByRole("dialog")).findByText(/changed after you opened it/)).toBeTruthy();
  expect(app.writes()).toHaveLength(0);
});

it("raises a memo from an approved proforma and opens it", async () => {
  const user = userEvent.setup();
  const app = open(<ServiceMemosPage />, ["CanViewServicesMemo", "CanCreateServicesMemo"]);
  app.state.proformas = [proforma(2)];
  await screen.findByText("SM-001");
  await user.click(screen.getByRole("button", { name: "Ready for a memo" }));
  await openMenu(/Actions for Cool Air/); await user.click(screen.getByRole("menuitem", { name: "Raise memo" }));
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByRole("textbox", { name: "Agreed materials cost" })).toHaveProperty("value", "20");
  await chooseDate(user, "Expected start", 2026, 10, 26);
  await chooseDate(user, "Expected completion", 2026, 10, 24);
  await user.click(within(dialog).getByRole("button", { name: "Raise memo" }));
  expect(await within(dialog).findByText(/before the expected start/)).toBeTruthy();
  await chooseDate(user, "Expected completion", 2026, 10, 29);
  await user.click(within(dialog).getByRole("button", { name: "Raise memo" }));
  expect(await screen.findByText("memo opened")).toBeTruthy();
  expect(app.calls.some((c) => c.path === "/api/v1/service-proforma-invoices" && c.search.includes("memoPending=true") && c.search.includes("jobOrderId=o1"))).toBe(true);
  expect(app.writes()[0]).toMatchObject({ path: "/api/v1/service-memos", body: { jobOrderId: "o1", serviceQuotationId: "q1", serviceProviderId: "sp-Cool Air", agreedServiceCharge: 100, agreedMaterialsCost: 20 } });
});

it("issues a draft memo and offers payment only once it is issued", async () => {
  const user = userEvent.setup();
  const app = open(<ServiceMemoDetailPage />, ["CanViewServicesMemo", "CanCreateServicesMemo", "CanCreateServicesPurchaseOrder"], "/x/m1");
  await openMenu("Actions");
  expect(screen.queryByRole("menuitem", { name: "Mark as paid" })).toBeNull();
  await user.click(screen.getByRole("menuitem", { name: "Issue to provider" }));
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Issue memo" }));
  await waitFor(() => expect(app.writes()).toHaveLength(1));
  expect(app.writes()[0]).toMatchObject({ path: "/api/v1/service-memos/issue", body: { serviceMemoId: "m1" } });
});

it("edits a quotation through validated fields and refuses stale totals", async () => {
  const user = userEvent.setup();
  const app = open(<EditQuotationDialog quotation={quotationSchema.parse(quote("q1", "Cool Air", 100))} onClose={() => {}} />, ["CanViewServicesQuotationResponses", "CanSendServicesQuotationResponse"]);
  const charge = await screen.findByRole("textbox", { name: "Service charge" });
  await waitFor(() => expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true));
  await user.clear(charge); await user.type(charge, "123.4500");
  app.state.quotes = [quote("q1", "Cool Air", 200)];
  await user.click(screen.getByRole("button", { name: "Save quotation" }));
  expect(await screen.findByText(/changed after you opened it/)).toBeTruthy(); expect(app.writes()).toHaveLength(0);
  expect(charge).toHaveProperty("value", "123.4500");
  app.state.quotes = [quote("q1", "Cool Air", 100)];
  await user.click(screen.getByRole("button", { name: "Save quotation" }));
  await waitFor(() => expect(app.writes()).toHaveLength(1));
  expect(app.writes()[0]).toMatchObject({ method: "PUT", body: { serviceCharge: 123.45, estimatedDays: 3, estimatedCompletionDate: "2026-10-25T00:00:00.000Z" } });
});
it("retains memo edits when saving fails, and permits a retry", async () => {
  const user = userEvent.setup();
  const app = open(<EditMemoDialog memo={memoSchema.parse(memo(0))} onClose={() => {}} />, ["CanViewServicesMemo", "CanCreateServicesMemo"]);
  const terms = await screen.findByRole("textbox", { name: "Terms and conditions" });
  await waitFor(() => expect(screen.getByRole("dialog").contains(document.activeElement)).toBe(true));
  await user.type(terms, "Net 30"); app.state.refuse = true;
  await user.click(screen.getByRole("button", { name: "Save memo" }));
  expect(await screen.findByText("Please retry this save.")).toBeTruthy();
  expect(screen.getByRole("textbox", { name: "Terms and conditions" })).toHaveProperty("value", "Net 30");
  app.state.refuse = false; await user.click(screen.getByRole("button", { name: "Save memo" }));
  await waitFor(() => expect(app.writes()).toHaveLength(2));
  expect(app.writes()[1]).toMatchObject({ path: "/api/v1/service-memos/m1", body: { agreedServiceCharge: 100, agreedMaterialsCost: 20, termsAndConditions: "Net 30" } });
});
it("requests a proforma only for a still-selected quotation, keeping the provider notes", async () => {
  const user = userEvent.setup(); const selected = quote("q1", "Cool Air", 100, { status: 3, isSelected: true });
  const app = open(<RequestProformaDialog quotation={quotationSchema.parse(selected)} onClose={() => {}} />, ["CanViewServicesProformaRequests", "CanSendServicesProformaRequest"]);
  app.state.quotes = [selected];
  await user.type(await screen.findByRole("textbox", { name: "Notes to the provider" }), "Include the invoice reference");
  await user.click(screen.getByRole("button", { name: "Send request" }));
  await waitFor(() => expect(app.writes()).toHaveLength(1));
  expect(app.writes()[0]).toMatchObject({ path: "/api/v1/service-proforma-invoices/request", body: { jobOrderId: "o1", serviceQuotationId: "q1", notes: "Include the invoice reference" } });
});

it("explains a missing saved memo issue date instead of silently refusing the edit", async () => {
  const user = userEvent.setup();
  const app = open(<EditMemoDialog memo={memoSchema.parse({ ...memo(0), issuedDate: null })} onClose={() => {}} />, ["CanViewServicesMemo", "CanCreateServicesMemo"]);
  await screen.findByRole("textbox", { name: "Agreed service charge" });
  await user.click(screen.getByRole("button", { name: "Save memo" }));
  expect(await screen.findByText(/issue date could not be read/)).toBeTruthy();
  expect(app.writes()).toHaveLength(0);
});
