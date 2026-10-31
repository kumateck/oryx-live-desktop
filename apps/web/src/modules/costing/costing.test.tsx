// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import AgreementRoute from "../../pages/(workspace)/finance/costing/agreements/[id]/page";
import AgreementsRoute from "../../pages/(workspace)/finance/costing/agreements/page";
import CostingRoute from "../../pages/(workspace)/finance/costing/page";
import { ApiProvider } from "../../shared/api/api-provider";
import { SessionProvider } from "../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { openMenu } from "../../test/menu";
import { navigationCatalog } from "../navigation/catalog.generated";
import { modules } from "../registry";
import { canAccess, routeAccessRule } from "../registry-model";
import { agreementState, priceIn } from "./lib/costing";
import { agreementFormSchema, listPriceFormSchema } from "./schemas/costing-schema";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

const cedi = { id: "ghs", name: "Ghana cedi", symbol: "GH₵" };
const dollar = { id: "usd", name: "US Dollar", symbol: "$" };
const agreement = { id: "ag-1", customerId: "c-2", customerName: "City Clinic", productId: "p1", productCode: "FP-1", productName: "Dicnac 100", productPackingId: "k1", productPackingName: "10 x 10",
  agreedPrice: 3.5, currency: dollar, effectiveFrom: "2026-01-01T00:00:00Z", effectiveTo: null, notes: "Export price" };
interface Call { method: string; path: string; search: string; body: unknown }
function open(address: string, permissions = ["ManageCosting"]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url); const path = url.pathname;
    calls.push({ method: input.method, path, search: url.search, body: input.method === "GET" ? null : await input.clone().json().catch(() => null) });
    if (path === "/api/v1/collection") return Response.json({ Currency: [cedi, dollar] });
    if (path === "/api/v1/costing/list-prices") return Response.json({ data: [{ productId: "p1", productCode: "FP-1", productName: "Dicnac 100", price: 10, priceUoM: "pack", currency: cedi, pricedAt: "2026-09-01T00:00:00Z" }], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (path === "/api/v1/costing/list-prices/p1/history") return Response.json([{ price: 10, priceUoM: "pack", currency: cedi, date: "2026-09-01T00:00:00Z" }, { price: 8, priceUoM: "pack", currency: dollar, date: "2026-01-01T00:00:00Z" }]);
    if (path === "/api/v1/costing/list-prices/p1" && input.method === "PUT") return new Response(null, { status: 204 });
    if (path === "/api/v1/costing/pricing-agreements") return Response.json({ data: [agreement, { ...agreement, id: "ag-2", customerId: "c-1", customerName: "Acme Pharmacy", agreedPrice: 30, currency: cedi }], pageIndex: 1, pageCount: 1, totalRecordCount: 2 });
    if (path === "/api/v1/costing/pricing-agreements/ag-1") return Response.json(agreement);
    if (path.startsWith("/api/v1/customers/c-2/pricing-agreements/ag-1")) return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/finance/costing", element: <CostingRoute /> }, { path: "/finance/costing/agreements", element: <AgreementsRoute /> },
    { path: "/finance/costing/agreements/:id", element: <AgreementRoute /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router, writes: () => calls.filter((call) => call.method !== "GET" && call.path !== "/api/v1/collection") };
}

it("shows prices in their own currency, knows when an agreement applies, and validates the editors", () => {
  expect([priceIn(3.5, dollar), priceIn(10, cedi), priceIn(10, null)]).toEqual(["$ 3.50", "GH₵ 10.00", "10.00 · no currency"]);
  const now = new Date("2026-06-01T00:00:00Z");
  expect([agreementState("2026-07-01T00:00:00Z", null, now), agreementState("2026-01-01T00:00:00Z", null, now), agreementState("2026-01-01T00:00:00Z", "2026-05-31T23:59:59Z", now)]).toEqual(["upcoming", "active", "ended"]);
  expect(listPriceFormSchema.safeParse({ currency: null, price: 5, unit: "" }).error?.issues[0]?.message).toBe("Choose the currency the product is priced in");
  const chosen = { value: "x", label: "X" };
  const values = { customer: chosen, product: chosen, packing: chosen, currency: null, price: 2, from: new Date("2026-02-01"), to: new Date("2026-01-01"), notes: "" };
  expect(agreementFormSchema.safeParse(values).error?.issues.map((issue) => issue.message)).toEqual(["Choose the currency the product is priced in", "The end date cannot be before the start date"]);
});

it("lives under Finance with its own ManageCosting permission, and is closed to roles without it", () => {
  const finance = navigationCatalog.find((group) => group.id === "finance-and-cashflow");
  expect(finance?.items.find((item) => item.path === "/finance/costing")?.permissions).toEqual(["ManageCosting"]);
  for (const path of ["/finance/costing", "/finance/costing/agreements", "/finance/costing/agreements/ag-1"])
    expect(routeAccessRule(modules, path)).toEqual({ kind: "all", permissions: ["ManageCosting"] });
  // Customer contracts alone no longer opens costing.
  const contractsOnly = { state: "authenticated" as const, permissions: new Set(["ManageCustomerContracts", "CanViewPayments"]) };
  const closed = { kind: "all", permissions: ["never"] } as const;
  expect(canAccess(routeAccessRule(modules, "/finance/costing/agreements") ?? closed, contractsOnly)).toBe(false);
  expect(canAccess(routeAccessRule(modules, "/finance/costing") ?? closed, { ...contractsOnly, permissions: new Set(["ManageCosting"]) })).toBe(true);
});

it("sets a list price in the currency it is priced in and shows the price history", async () => {
  const user = userEvent.setup();
  const page = open("/finance/costing");
  expect(await screen.findByText("GH₵ 10.00")).toBeTruthy();
  expect(screen.getByText("Ghana cedi (GH₵)")).toBeTruthy();
  await openMenu("Actions for Dicnac 100");
  await user.click(await screen.findByRole("menuitem", { name: "Set price" }));
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText("$ 8.00 per pack")).toBeTruthy();
  const price = await within(dialog).findByRole("spinbutton", { name: /List price/ });
  await user.clear(price); await user.type(price, "12.5");
  await user.click(within(dialog).getByRole("button", { name: "Save price" }));
  await waitFor(() => expect(page.writes()).toEqual([{ method: "PUT", path: "/api/v1/costing/list-prices/p1", search: "", body: { price: 12.5, currencyId: "ghs", priceUoM: "pack" } }]));
}, 20_000);

it("lists agreements across customers, filters by customer and edits one through its customer", async () => {
  const user = userEvent.setup();
  const page = open("/finance/costing/agreements?customer=c-2");
  expect(await screen.findByText("$ 3.50")).toBeTruthy();
  expect(screen.getByText("GH₵ 30.00")).toBeTruthy();
  expect(page.calls.find((call) => call.path === "/api/v1/costing/pricing-agreements")?.search).toContain("customerId=c-2");
  await user.click(screen.getByText("$ 3.50"));
  await waitFor(() => expect(page.router.state.location.pathname).toBe("/finance/costing/agreements/ag-1"));
  expect(await screen.findByText("US Dollar ($)")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Actions" }));
  await user.click(await screen.findByRole("menuitem", { name: "Edit agreement" }));
  const dialog = await screen.findByRole("dialog");
  const price = await within(dialog).findByRole("spinbutton", { name: /Agreed price per pack/ });
  await user.clear(price); await user.type(price, "4");
  await user.click(within(dialog).getByRole("button", { name: "Save agreement" }));
  await waitFor(() => expect(page.writes()).toHaveLength(1));
  expect(page.writes()[0]).toMatchObject({ method: "PUT", path: "/api/v1/customers/c-2/pricing-agreements/ag-1", body: { productId: "p1", productPackingId: "k1", currencyId: "usd", agreedPrice: 4 } });
}, 20_000);
