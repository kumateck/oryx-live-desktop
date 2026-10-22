// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { canAccess } from "@/shared/auth/access";
import { SessionProvider } from "@/shared/auth/session-provider";
import { Store } from "@/shared/inventory/stores";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { openMenu } from "@/test/menu";
import { modules } from "../registry";
import { routeAccessPolicy } from "../registry-model";
import { PriceComparisonPage } from "./components/comparison-page";
import { MemoDetailPage } from "./components/memo-pages";
import { QuotationResponsesPage } from "./components/quotation-pages";
import { SourcingDetailPage } from "./components/sourcing-pages";
import { comparisonSchema, memoSchema } from "./lib/procurement";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

const requisition = (status = 0) => ({ id: "p1", code: "PR-0001", status: 0, createdAt: "2026-10-20T08:00:00Z", items: [
  { id: "a", quantity: 10, status, uoM: { id: "u1", name: "Box", symbol: "bx" }, item: { id: "i1", name: "Paper", code: "PPR", store: Store.General, availableQuantity: 2 } },
  { id: "b", quantity: 2, status: 2, uoM: { id: "u1", name: "Box", symbol: "bx" }, item: { id: "i2", name: "Toner", code: "TNR", store: Store.General, availableQuantity: 0 } },
] });
const comparison = (price = 5) => [{ item: { id: "i1", name: "Paper", code: "PPR" }, uoM: { id: "u1", symbol: "bx" }, quantity: 10, vendorPrices: [
  { vendor: { id: "v1", name: "Alpha" }, vendorQuotationItem: { id: "q1", quotedPrice: price, priceUoM: "box" } },
  { vendor: { id: "v2", name: "Beta" }, vendorQuotationItem: { id: "q2", quotedPrice: 6, priceUoM: "box" } },
] }];
const memo = (paid: string | null = null) => ({ id: "m1", code: "MEMO-000001", createdAt: "2026-10-21T10:00:00Z", paid: false, status: 0, items: [
  { id: "mi1", quantity: 10, pricePerUnit: 5, purchasedAt: paid, vendorQuotationItemId: "q1", vendor: { name: "Alpha" }, item: { id: "i1", name: "Paper", code: "PPR" }, uoM: { symbol: "bx" } },
] });
const quotation = { id: "vq1", receivedQuotation: false, vendor: { id: "v1", name: "Alpha", currency: { symbol: "GHS" } },
  sourceInventoryRequisition: { sentQuotationRequestAt: "2026-10-21T09:00:00Z" }, items: [{ id: "q1", quantity: 10, item: { id: "i1", name: "Paper", code: "PPR" }, uoM: { symbol: "bx" } }] };

function open(element: ReactNode, granted: string[], path = "/x") {
  const backend = stubBackend({ permissions: granted });
  const auth = backend.fetcher.getMockImplementation();
  const state = { requisition: requisition(), comparison: comparison(), memo: memo() };
  const calls: { path: string; method: string; body: unknown }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ path: url.pathname, method: input.method, body: input.method === "GET" ? null : await input.clone().json().catch(() => null) });
    if (input.method !== "GET") return new Response(null, { status: 204 });
    if (url.pathname === "/api/v1/procurement/inventory/p1") return Response.json(state.requisition);
    if (url.pathname === "/api/v1/vendors/item/i1") return Response.json([{ id: "v1", name: "Alpha" }, { id: "v2", name: "Beta" }]);
    if (url.pathname === "/api/v1/procurement/inventory/price-comparison") return Response.json(state.comparison);
    if (url.pathname === "/api/v1/procurement/inventory/memo/m1") return Response.json(state.memo);
    if (url.pathname === "/api/v1/procurement/inventory/vendor/quotations") return Response.json({ data: [quotation], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname === "/api/v1/procurement/inventory/vendor/quotation/vq1") return Response.json(quotation);
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([{ path: "/x/:id?", element }], { initialEntries: [path] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { state, writes: () => calls.filter((c) => c.method !== "GET") };
}
afterEach(() => { cleanup(); forgetSession(); });

it("guards each procurement page with its own view key", () => {
  const can = (path: string, keys: string[]) => { const p = routeAccessPolicy(modules, path); return Boolean(p && canAccess(p.access, { state: "authenticated", permissions: new Set(keys) })); };
  expect(can("/extrals/procurement/memo/m1", ["CanViewOpenMarketMemo"])).toBe(true);
  expect(can("/extrals/procurement/purchase-requisition-sourcing/p1", ["CanViewOpenMarketMemo"])).toBe(false);
  expect(can("/extrals/procurement/purchased-items", ["CanViewPurchaseOrdersForTrustedVendors"])).toBe(true);
});

it("reads prices and memo items, including payment and source", () => {
  const [row] = comparisonSchema.parse(comparison());
  expect(row?.offers.map((o) => o.choice)).toEqual(["q1", "q2"]);
  expect(memoSchema.parse(memo("2026-10-22T00:00:00Z")).items[0]).toMatchObject({ value: 50, purchasedAt: "2026-10-22T00:00:00Z" });
});

it("sources an item to the chosen trusted vendors after a fresh read", async () => {
  const user = userEvent.setup();
  const page = open(<SourcingDetailPage />, ["CanViewPurchaseRequisitionsSourcing", "CanSourcePurchaseRequisitionSourcing"], "/x/p1");
  await user.click(await screen.findByRole("combobox", { name: "Source for Paper" }));
  await user.click(await screen.findByRole("option", { name: "Trusted vendors" }));
  await user.click(await screen.findByRole("checkbox", { name: "Alpha" }));
  await user.click(screen.getByRole("button", { name: "Save sourcing" }));
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Save sourcing" }));
  await waitFor(() => expect(page.writes()).toHaveLength(1));
  expect(page.writes()[0]).toMatchObject({ path: "/api/v1/procurement/inventory/source", body: { inventoryPurchaseRequisitionId: "p1",
    items: [{ itemId: "i1", uoMId: "u1", quantity: 10, source: 0, vendors: [{ vendorId: "v1" }] }] } });
  // Already-sourced lines are shown, not offered again.
  expect(screen.queryByRole("combobox", { name: "Source for Toner" })).toBeNull();
});

it("creates a trusted-vendor memo from the chosen price and refuses a price that changed", async () => {
  const user = userEvent.setup();
  const page = open(<PriceComparisonPage />, ["CanViewTrustedVendorPricingSelection", "CanCreateMemoForTrustedVendor"]);
  await user.click(await screen.findByRole("radio", { name: "Choose Alpha for Paper" }));
  await user.click(screen.getByRole("button", { name: "Create memo (1)" }));
  page.state.comparison = comparison(7);
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Create memo" }));
  expect(await within(screen.getByRole("dialog")).findByText(/changed or been used/)).toBeTruthy();
  expect(page.writes()).toHaveLength(0);
  page.state.comparison = comparison(5);
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Create memo" }));
  await waitFor(() => expect(page.writes()).toHaveLength(1));
  expect(page.writes()[0]).toMatchObject({ path: "/api/v1/procurement/inventory/memo/trusted-vendor", body: [{ vendorQuotationItemId: "q1", itemId: "i1", uoMId: "u1", quantity: 10 }] });
});

it("marks a memo item paid only while it is still unpaid", async () => {
  const user = userEvent.setup();
  const page = open(<MemoDetailPage />, ["CanViewMemoForTrustedVendors", "CanCreatePurchaseOrderForTrustedVendor"], "/x/m1");
  await user.click(await screen.findByRole("button", { name: "Mark paid" }));
  page.state.memo = memo("2026-10-22T00:00:00Z");
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Mark paid" }));
  expect(await within(screen.getByRole("dialog")).findByText(/already been paid/)).toBeTruthy();
  expect(page.writes()).toHaveLength(0);
});

it("records every price on a quotation", async () => {
  const user = userEvent.setup();
  const page = open(<QuotationResponsesPage />, ["CanViewQuotationResponsesForTrustedVendors", "CanSendQuotationResponseForTrustedVendor"]);
  await screen.findByText("Alpha");
  await openMenu(/Actions for Alpha/); await user.click(screen.getByRole("menuitem", { name: "Record prices" }));
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Record prices" }));
  expect(within(dialog).getByText(/price greater than zero for every item/)).toBeTruthy();
  await user.type(within(dialog).getByLabelText("Unit price for Paper"), "4.5");
  await user.click(within(dialog).getByRole("button", { name: "Record prices" }));
  await waitFor(() => expect(page.writes()).toHaveLength(1));
  expect(page.writes()[0]).toMatchObject({ path: "/api/v1/procurement/inventory/vendor/quotation/vq1/receive", body: [{ id: "q1", price: 4.5, priceUoM: "bx" }] });
});
