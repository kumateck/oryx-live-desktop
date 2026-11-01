// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import CustomerRoute from "../../pages/(workspace)/crm/customers/[id]/page";
import CustomersRoute from "../../pages/(workspace)/crm/customers/page";
import QuotationRoute from "../../pages/(workspace)/crm/quotations/[id]/page";
import { ApiProvider } from "../../shared/api/api-provider";
import { SessionProvider } from "../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { openMenu } from "../../test/menu";
import { lineTotal, quotationNextStep, splitPacking } from "./lib/customers";
import { customerFormSchema, orderedPacks, quotationFormSchema } from "./schemas/customer-schema";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

it("splits quantities into shippers, totals a discounted line and says what a quotation can do next", () => {
  expect([splitPacking(250, 100), splitPacking(250, 0), splitPacking(Number.NaN, 10)]).toEqual([{ shippers: 2, loose: 50 }, { shippers: 0, loose: 250 }, { shippers: 0, loose: 0 }]);
  expect([lineTotal(10, 2.5, 10), lineTotal(10, 2.5, null), lineTotal(null, 2.5, 0), lineTotal(3, 0.1, 0)]).toEqual([22.5, 25, null, 0.3]);
  expect([quotationNextStep({ status: 0, approved: false }).action, quotationNextStep({ status: 1, approved: false }).action, quotationNextStep({ status: 2, approved: false }).action, quotationNextStep({ status: 2, approved: true }).action, quotationNextStep({ status: 5, approved: true }).action])
    .toEqual(["send", null, null, "convert", null]);
  expect(customerFormSchema.safeParse({ name: "Ac", address: "", email: "x", phone: "12" }).error?.issues.map((issue) => issue.path[0])).toEqual(["name", "address", "email", "phone"]);
  const line = { product: { value: "p1", label: "P" }, packing: { value: "k1", label: "K" }, perShipper: 10, shippers: 0, loose: 5, unitPrice: Number.NaN, discount: 0, fromAgreement: null };
  expect(quotationFormSchema.safeParse({ code: "Q-1", validUntil: new Date(), items: [line, line] }).error?.issues[0]?.message).toBe("This product and packing style is already on the quotation");
});

it("takes orders as shippers and loose packs and totals them in packs", () => {
  const line = { product: { value: "p1", label: "P" }, packing: { value: "k1", label: "K" }, perShipper: 80, shippers: 25, loose: 10, unitPrice: Number.NaN, discount: 0, fromAgreement: null };
  const parse = (patch: object) => quotationFormSchema.safeParse({ code: "Q-1", validUntil: new Date(), items: [{ ...line, ...patch }] });
  expect(orderedPacks(line)).toBe(2010);
  expect(orderedPacks({ ...line, shippers: Number.NaN })).toBe(10);
  expect(parse({}).success).toBe(true);
  expect(parse({ loose: 80 }).error?.issues[0]?.message).toBe("Loose packs must be fewer than 80, a full shipper. Add a shipper instead.");
  expect(parse({ shippers: 0, loose: 0 }).error?.issues[0]).toMatchObject({ path: ["items", 0, "shippers"], message: "Enter at least one shipper or loose pack" });
  expect(parse({ shippers: 1.5 }).error?.issues[0]?.message).toBe("Enter a whole number of shippers, 0 or more");
  // A packing style with no shipper size takes loose packs only.
  expect(orderedPacks({ ...line, perShipper: 0 })).toBe(10);
});

const quotation = (status: number, approved: boolean) => ({ id: "q-1", customerId: "c-1", customerName: "Acme Pharmacy", currency: { id: "cur", name: "Ghana cedi", symbol: "GHS" }, code: "QT-7", status, validUntil: "2026-12-31T23:59:59Z", approved, totalValue: 450,
  items: [{ id: "i1", productName: "Dicnac 100", quantity: 250, shippers: 2, loose: 50, productPackingName: "10 x 10", unitPrice: 2, discountPercent: 10, totalValue: 450 }], approvals: [{ id: "s1", order: 1, required: true, status: 1, comments: "Fine" }] });
interface Call { method: string; path: string }
function open(address: string, permissions: string[], record: object = quotation(2, true)) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    calls.push({ method: input.method, path });
    if (path === "/api/v1/customers" && input.method === "GET") return Response.json({ data: [{ id: "c-1", name: "Acme Pharmacy", email: "buy@acme.test", phone: "0244000000", address: "Accra" }], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (path === "/api/v1/customers/c-1" && input.method === "GET") return Response.json({ id: "c-1", name: "Acme Pharmacy", email: "buy@acme.test", phone: "0244000000", address: "Accra", type: 1, currency: { id: "cur", name: "Ghana cedi", symbol: "GHS" } });
    if (path === "/api/v1/customers/c-1" && input.method === "DELETE") return new Response(null, { status: 204 });
    if (path === "/api/v1/customers/c-1/order-history") return Response.json({ data: [{ id: "o-1", code: "PO-9", status: 2, totalValue: 900, promisedDeliveryDate: "2026-09-01T00:00:00Z", deliveredAt: "2026-09-05T00:00:00Z" }] });
    if (path === "/api/v1/customers/c-1/credit-status") return Response.json({ creditLimit: 1000, preferredCurrencyName: "GHS", outstandingInPreferredCurrency: 1200, availableCredit: -200, isWithinCreditLimit: false, outstandingByCurrency: [{ currencyId: "cur", currencyName: "Ghana cedi", currencySymbol: "GHS", documentTotal: 2000, amountPaid: 800, outstandingBalance: 1200 }] });
    if (path === "/api/v1/customers/c-1/summary") return Response.json({ lifetimeOrderCount: 4, totalOrderValue: 3600, averageOrderValue: 900, onTimeDeliveryRate: 75 });
    if (path === "/api/v1/customers/quotations/q-1") return Response.json(record);
    if (path === "/api/v1/customers/quotations/q-1/convert") return Response.json("po-1");
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/crm/customers", element: <CustomersRoute /> }, { path: "/crm/customers/:id", element: <CustomerRoute /> }, { path: "/crm/quotations/:id", element: <QuotationRoute /> },
    { path: "/crm/production-order/:id", element: <p>Production order</p> }, { path: "/finance/costing/agreements", element: <p>Costing agreements</p> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET");

it("lists customers and deletes one only after confirming, with the delete permission", async () => {
  const user = userEvent.setup();
  open("/crm/customers", ["CanViewCustomers"]);
  expect(await screen.findByText("Acme Pharmacy")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "New customer" })).toBeNull();
  cleanup();
  const { calls } = open("/crm/customers", ["CanViewCustomers", "CanDeleteCustomer"]);
  await screen.findByText("Acme Pharmacy");
  await openMenu("Actions for Acme Pharmacy");
  await user.click(await screen.findByRole("menuitem", { name: "Delete" }));
  expect(writes(calls)).toEqual([]);
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Delete customer" }));
  await waitFor(() => expect(writes(calls)).toEqual([{ method: "DELETE", path: "/api/v1/customers/c-1" }]));
}, 20_000);

it("shows only the workspace tabs the user may use", async () => {
  open("/crm/customers/c-1", ["CanViewCustomers"]);
  expect(await screen.findByText("PO-9")).toBeTruthy();
  expect(screen.getByText(/late/)).toBeTruthy();
  expect(screen.queryByRole("tab", { name: "Credit overview" })).toBeNull();
  expect(screen.queryByRole("tab", { name: "Pricing" })).toBeNull();
  cleanup();
  open("/crm/customers/c-1", ["CanViewCustomers", "ViewCustomerCreditStatus"]);
  expect(await screen.findByText("Limit exceeded")).toBeTruthy();
  expect(screen.getByText("75.0%")).toBeTruthy();
});

it("sends pricing to Finance → Costing, including saved links to the old pricing tab", async () => {
  const user = userEvent.setup();
  const { router } = open("/crm/customers/c-1", ["CanViewCustomers", "ManageCustomerContracts", "ManageCosting"]);
  expect(await screen.findByRole("tab", { name: "Contacts" })).toBeTruthy();
  expect(screen.queryByRole("tab", { name: "Pricing" })).toBeNull();
  await user.click(screen.getByRole("link", { name: "Pricing agreements" }));
  await waitFor(() => expect(`${router.state.location.pathname}${router.state.location.search}`).toBe("/finance/costing/agreements?customer=c-1"));
  cleanup();
  const moved = open("/crm/customers/c-1?tab=pricing", ["CanViewCustomers", "ManageCustomerContracts", "ManageCosting"]);
  await waitFor(() => expect(`${moved.router.state.location.pathname}${moved.router.state.location.search}`).toBe("/finance/costing/agreements?customer=c-1"));
});

it("converts an approved quotation only after confirming, and offers nothing while approval is pending", async () => {
  const user = userEvent.setup();
  open("/crm/quotations/q-1", ["ViewCustomerQuotations", "ConvertCustomerQuotation"], quotation(1, false));
  expect(await screen.findByText(/Waiting for approval/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Convert to production order" })).toBeNull();
  cleanup();
  const { calls, router } = open("/crm/quotations/q-1", ["ViewCustomerQuotations", "ConvertCustomerQuotation"]);
  expect(await screen.findByText("2 shippers · 50 loose")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Convert to production order" }));
  expect(writes(calls)).toEqual([]);
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Convert" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/crm/production-order/po-1"));
  expect(writes(calls)).toEqual([{ method: "POST", path: "/api/v1/customers/quotations/q-1/convert" }]);
}, 20_000);
