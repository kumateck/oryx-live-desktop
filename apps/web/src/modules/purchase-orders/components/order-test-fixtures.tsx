import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach } from "vitest";
import { cleanup, render } from "@testing-library/react";
import type { JsonValue } from "@/shared/api/generated/procurement";
import PurchaseOrderListPage from "../../../pages/(workspace)/procurement/purchase-order-lists/page";
import PurchaseOrderPage from "../../../pages/(workspace)/procurement/purchase-orders/[id]/page";
import RevisePurchaseOrderPage from "../../../pages/(workspace)/procurement/purchase-orders/[id]/revise/page";
import ApprovedPurchaseOrdersPage from "../../../pages/(workspace)/procurement/purchase-orders/approved/page";
import CheckPurchaseOrdersPage from "../../../pages/(workspace)/procurement/purchase-orders/check/page";
import FinalisePurchaseOrdersPage from "../../../pages/(workspace)/procurement/purchase-orders/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => { cleanup(); forgetSession(); });

const supplier = (type: number) => ({ id: "s1", name: "Acme Chemicals", email: "sales@acme.test", type, currency: { id: "c-usd", symbol: "$", name: "US Dollar" } });
export const future = new Date(Date.now() + 10 * 86_400_000).toISOString();
const order = (type: number, status: number) => ({ id: "po1", code: "PO-0009", createdAt: "2026-09-25T09:00:00Z", status, supplier: supplier(type), proFormaInvoiceNumber: "PFI-778", estimatedDeliveryDate: future,
  deliveryMode: { name: "Sea freight" }, termsOfPayment: { name: "30 days" }, attachments: [{ id: "f1", name: "pfi-778.pdf", link: "https://files.test/pfi-778.pdf" }],
  ...(status >= 4 ? { totalFobValue: 400, totalCifValue: 1_350, seaFreight: 800, insurance: 150, amountInFigures: "One thousand three hundred and fifty US Dollar only" } : {}),
  items: [{ id: "l1", material: { id: "m1", name: "Maize starch", code: "RM-001" }, uom: { id: "u-mg", symbol: "mg" }, quantity: 25_000_000, price: 12, priceUoM: "kg", canReassignSupplier: true }, { id: "l2", material: { id: "m2", name: "Blister film" }, uom: { id: "u-pcs", symbol: "pcs" }, quantity: 40, price: 2.5, priceUoM: "pcs" }] });
interface Call { method: string; path: string; search: string; body: JsonValue }

export function open(address: string, permissions: string[], options: { type?: number; sendStatus?: number; awardStatus?: number; openComparison?: boolean } = {}) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const path = url.pathname;
    const text = input.method === "GET" ? "" : await input.clone().text();
    calls.push({ method: input.method, path, search: url.search, body: text ? JSON.parse(text) as JsonValue : null });
    const type = options.type ?? Number(url.searchParams.get("type") ?? 0);
    if (path === "/api/v1/procurement/purchase-order") return Response.json({ data: [order(type, Number(url.searchParams.get("status") ?? 7))], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (path === "/api/v1/procurement/purchase-order/po1" && input.method === "GET") return Response.json({ ...order(options.type ?? 0, 7), isRevised: true, revisionNumber: 1,
      revisions: [{ revisionNumber: 1, items: [{ type: 3, material: { name: "Maize starch" }, quantity: 25_000_000, quantityBefore: 20_000_000, price: 12, priceBefore: 11, priceUoM: "kg", priceUoMBefore: "kg", uoM: { symbol: "mg" } }] }] });
    if (path === "/api/v1/procurement/purchase-order/po1" && input.method === "POST") return (options.sendStatus ?? 204) === 204 ? new Response(null, { status: 204 })
      : Response.json({ errors: [{ code: "Supplier.Quotation", description: "The mail server refused the message." }] }, { status: 400 });
    if (path === "/api/v1/procurement/purchase-order/po1" || path === "/api/v1/procurement/purchase-order/check/po1" || path === "/api/v1/procurement/purchase-order/po1/revise"
      || path === "/api/v1/procurement/purchase-order/po1/cancel") return new Response(null, { status: 204 });
    const starchQuotes = [{ material: { id: "m1", name: "Maize starch" }, uoM: { id: "u-mg", symbol: "mg" }, quantity: 25_000_000, supplierQuotation: [
      { supplier: supplier(0), sourceRequisition: { id: "sr1" }, price: 12, priceUoM: "kg" }, { supplier: { ...supplier(0), id: "s2", name: "Bolt Trading" }, sourceRequisition: { id: "sr2" }, price: 11, priceUoM: "kg" }] }];
    if (path === "/api/v1/requisition/source/material/price-comparison/by-material") return Response.json(starchQuotes);
    if (path === "/api/v1/requisition/source/material/price-comparison") return Response.json(options.openComparison ? starchQuotes : []);
    if (path === "/api/v1/requisition/source/quotation/process-purchase-order") return (options.awardStatus ?? 204) === 204 ? new Response(null, { status: 204 })
      : Response.json({ errors: [{ code: "SupplierQuotation.Item", description: "No open quotation line was found for one of the selected materials." }] }, { status: 400 });
    if (path === "/api/v1/procurement/supplier/s1/material") return Response.json([{ material: { id: "m1", name: "Maize starch" }, uoM: { id: "u-mg", symbol: "mg" } },
      { material: { id: "m9", name: "Lactose", code: "RM-009" }, uoM: { id: "u-kg", symbol: "kg" } }, { material: { id: "m9", name: "Lactose" }, uoM: { id: "u-kg", symbol: "kg" } }]);
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([
    { path: "/procurement/purchase-orders", element: <FinalisePurchaseOrdersPage /> },
    { path: "/procurement/purchase-orders/check", element: <CheckPurchaseOrdersPage /> },
    { path: "/procurement/purchase-orders/approved", element: <ApprovedPurchaseOrdersPage /> },
    { path: "/procurement/purchase-orders/:id", element: <PurchaseOrderPage /> },
    { path: "/procurement/purchase-orders/:id/revise", element: <RevisePurchaseOrderPage /> },
    { path: "/procurement/purchase-order-lists", element: <PurchaseOrderListPage /> },
  ], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}
export const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET");
export const statusAsked = (calls: readonly Call[]) => new URLSearchParams(calls.find((call) => call.path === "/api/v1/procurement/purchase-order")?.search).get("status");

