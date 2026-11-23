// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import type { ReactNode } from "react";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionReady } from "@/test/session-ready";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { GoodsActionDialog, goodsKeys, type GoodsAction } from "./components/goods-action-dialog";
import { CostingConfirmationDialog } from "./components/costing-confirmation-dialog";
import { CustomerPoDialog } from "./components/customer-po-dialog";
import { IssuedInvoiceDetailPage, IssuedInvoiceListPage } from "./components/issued-invoice-pages";
import { allocationSchema, invoiceSchema } from "./schemas/dispatch-schema";
import { RecallActionDialog, type RecallAction } from "../product-recalls/components/recall-action-dialog";
import { FinancialResolutionDialog } from "../product-recalls/components/financial-resolution-dialog";
import { detailSchema, recallKeys } from "../product-recalls/lib";
import { DeliveryEvidence } from "./components/delivery-evidence";
import { StockQualityActions } from "./components/stock-quality-actions";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });
const record = { id: "a1", approved: true, productionOrder: { id: "o1", code: "ORDER-1", customer: { id: "c1", name: "Hospital" } },
  products: [{ product: { id: "p1", name: "Product" }, productPacking: { id: "k1", name: "100 tablets" },
    fulfilledQuantities: [{ quantity: 60, unitsPerPack: 100, yieldQuantity: 6000, finishedGoodsTransferNote: { id: "n1", packingStyleSnapshot: "100 tablets", quantityPerPack: 100 } }] }] };
const allocation = allocationSchema.parse(record);
if (!allocation) throw new Error("Test allocation missing");
const proformaRecord = { id: "pf1", code: "PF-1", approved: true, status: 2, issuedInvoiceId: "i1", customerPoVerifiedAt: "2026-11-20T00:00:00Z", customerPoNumber: "CPO-1", allocateProductionOrder: record,
  products: [{ id: "l1", product: { id: "p1", name: "Product" }, productPackingId: "k1", unitPrice: 12, priceCurrencyId: "cur1", quantity: 60 }] };
const proforma = invoiceSchema.parse(proformaRecord);
if (!proforma) throw new Error("Test proforma missing");
const recall = detailSchema.parse({ id: "r1", code: "RC-1", batchManufacturingRecordId: "b1", consignments: [], recoveries: [], stocks: [] });
const issued = { id: "i1", code: "INV-1", createdAt: "2026-11-21T09:00:00Z", customer: { name: "Hospital" }, proformaInvoice: proformaRecord,
  amounts: [{ amount: 720, currency: { id: "cur1", symbol: "GHS" } }], balances: [] };
interface Call { method: string; path: string; body: string }
function open(element: ReactNode, permissions: string[], address = "/") {
  const backend = stubBackend({ permissions }); rememberSession(); const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url); calls.push({ method: input.method, path: url.pathname, body: input.method === "GET" ? "" : await input.clone().text() });
    if (url.pathname === "/api/v1/collection") return Response.json({ Currency: [{ id: "cur1", symbol: "GHS", name: "Cedi" }] });
    if (url.pathname === "/api/v1/production-orders/invoice/i1") return Response.json(issued);
    if (url.pathname === "/api/v1/production-orders/invoice") return Response.json({ data: [issued], totalRecordCount: 1, pageCount: 1, pageIndex: 1 });
    if (url.pathname.endsWith("/settlement-options") || url.pathname.endsWith("/reconciliation")) return Response.json([]);
    if (input.method === "POST") return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "*", element: <SessionReady>{element}</SessionReady> }, { path: "/invoice/:id", element: <SessionReady>{element}</SessionReady> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}
const mutations = (calls: readonly Call[]) => calls.filter((c) => c.method === "POST" && c.path !== "/api/v1/collection");
const goodsCases: readonly [GoodsAction, string][] = [["load", "Record loading"], ["clear", "Clear for departure"], ["dispatch", "Record departure"], ["deliver", "Record delivery"], ["cancel", "Cancel packing list"]];
it.each(goodsCases)("requires the precise current permission for %s", async (action, label) => {
  const denied = open(<GoodsActionDialog action={action} allocation={allocation} onClose={() => {}} />, []);
  const button = await screen.findByRole("button", { name: label }); expect(button.hasAttribute("disabled")).toBe(true); fireEvent.click(button); expect(mutations(denied)).toEqual([]);
  cleanup(); open(<GoodsActionDialog action={action} allocation={allocation} onClose={() => {}} />, [goodsKeys[action]]);
  await waitFor(() => expect(screen.getByRole("button", { name: label }).hasAttribute("disabled")).toBe(false));
});
const recallCases: readonly [RecallAction, string][] = [["decision", "Record authority decision"], ["create", "Initiate recall"], ["notify", "Record notification"], ["recover", "Receive recalled goods"], ["dispose", "Dispose recovered goods"], ["disposeStock", "Dispose held stock"], ["close", "Close recall"], ["reopen", "Reopen recall"]];
it.each(recallCases)("requires its separate recall task for %s", async (action, label) => {
  const element = <RecallActionDialog action={action} recall={recall} onClose={() => {}} onSaved={() => {}} />;
  const denied = open(element, []); expect((await screen.findByRole("button", { name: label })).hasAttribute("disabled")).toBe(true); expect(mutations(denied)).toEqual([]);
  cleanup(); open(element, [recallKeys[action]]); await waitFor(() => expect(screen.getByRole("button", { name: label }).hasAttribute("disabled")).toBe(false));
});
it.each([["verify", "Verify customer PO", "CanVerifyFinishedGoodsCustomerPo"], ["issue", "Issue invoice", "CanCreateInvoice"], ["void", "Void invoice", "CanVoidFinishedGoodsInvoice"]] as const)("separates customer-document permission %s", async (action, label, key) => {
  const element = <CustomerPoDialog invoice={proforma} action={action} onClose={() => {}} />;
  const calls = open(element, []); expect((await screen.findByRole("button", { name: label })).hasAttribute("disabled")).toBe(true); expect(mutations(calls)).toEqual([]);
  cleanup(); open(element, [key]); await waitFor(() => expect(screen.getByRole("button", { name: label }).hasAttribute("disabled")).toBe(false));
});
it("requires Costing and Finance resolution permissions independently of warehouse powers", async () => {
  open(<CostingConfirmationDialog allocation={allocation} onClose={() => {}} />, ["CanLoadFinishedGoods"]);
  expect((await screen.findByRole("button", { name: "Confirm costing basis" })).hasAttribute("disabled")).toBe(true);
  cleanup(); open(<CostingConfirmationDialog allocation={allocation} onClose={() => {}} />, ["CanConfirmFinishedGoodsCosting"]);
  await waitFor(() => expect(screen.getByRole("button", { name: "Confirm costing basis" }).hasAttribute("disabled")).toBe(false));
  cleanup(); open(<FinancialResolutionDialog id="r1" onClose={() => {}} onSaved={() => {}} />, ["CanCreateProductRecall"]);
  expect((await screen.findByRole("button", { name: "Record resolution" })).hasAttribute("disabled")).toBe(true);
  cleanup(); open(<FinancialResolutionDialog id="r1" onClose={() => {}} onSaved={() => {}} />, ["CanRecordProductRecallSettlement"]);
  await waitFor(() => expect(screen.getByRole("button", { name: "Record resolution" }).hasAttribute("disabled")).toBe(false));
});
it.each([[false, false, "CanHoldFinishedGoods", "Place batch on hold"], [true, false, "CanReleaseFinishedGoodsHold", "Release QA hold"], [false, true, "CanReconcileFinishedGoodsStock", "Reconcile stock"]] as const)("checks the separate stock control permission %s/%s", async (held, needsReconciliation, key, label) => {
  const element = <StockQualityActions id="n1" received held={held} needsReconciliation={needsReconciliation} unitsPerPack={100} packsPerShipper={80} packingName="100 tablets" />;
  open(element, ["CanApproveFgtn"]); await waitFor(() => expect(screen.queryByRole("button", { name: label })).toBeNull());
  cleanup(); open(element, [key]); expect(await screen.findByRole("button", { name: label })).toBeTruthy();
});
it("posts counted loading evidence to the new task without a waybill or customer PO", async () => {
  const calls = open(<GoodsActionDialog action="load" allocation={allocation} onClose={() => {}} />, [goodsKeys.load]);
  const dialog = within(await screen.findByRole("dialog"));
  for (const [name, value] of [[/^Vehicle registration/, "GR-1"], [/^Driver(?:\s*\*)?$/, "Driver"], [/^Driver contact/, "0244"], [/^Loading bay/, "Bay 1"], [/^Vehicle inspection/, "INS-1"]] as const)
    fireEvent.change(await dialog.findByRole("textbox", { name }), { target: { value } });
  fireEvent.click(dialog.getByRole("checkbox"));
  await waitFor(() => expect(dialog.getByRole("button", { name: "Record loading" }).hasAttribute("disabled")).toBe(false));
  fireEvent.click(dialog.getByRole("button", { name: "Record loading" }));
  await waitFor(() => expect(mutations(calls)).toHaveLength(1));
  expect(mutations(calls)[0]?.path).toBe("/api/v1/finished-goods/allocations/a1/load");
  expect(JSON.parse(mutations(calls)[0]?.body ?? "{}")).toMatchObject({ vehicleRegistration: "GR-1", loadingLocation: "Bay 1", conditionsConfirmed: true });
});
it("reads issued invoices instead of relabelling proformas and prints only frozen amounts", async () => {
  const calls = open(<IssuedInvoiceListPage />, ["CanViewInvoice"]);
  expect(await screen.findByText("INV-1")).toBeTruthy(); expect(calls.some((c) => c.path.endsWith("/proforma-invoice"))).toBe(false);
  cleanup(); const detailCalls = open(<IssuedInvoiceDetailPage />, ["CanViewInvoice"], "/invoice/i1");
  expect(await screen.findByRole("heading", { name: "Invoice INV-1" })).toBeTruthy(); expect(screen.getByText("CPO-1")).toBeTruthy();
  expect(detailCalls.some((c) => c.path.includes("pricing-agreements") || c.path === "/api/v1/collection")).toBe(false);
  fireEvent.click(screen.getByRole("button", { name: "Print" }));
  const preview = within(await screen.findByRole("dialog")); expect(await preview.findByText("INV-1")).toBeTruthy(); expect(preview.getAllByText(/720/).length).toBeGreaterThan(0);
});

it("shows the saved receiver, POD and reconciled batch delivery quantities", () => {
  render(<DeliveryEvidence allocation={{ ...allocation, deliveredAt: "2026-11-21T10:00:00Z", deliveryReceiver: "Hospital receiving officer", deliveryEvidence: "Signed POD-1126",
    deliveryCondition: "One pack damaged", deliveryLines: [{ finishedGoodsTransferNoteId: "n1", acceptedYield: 5900, damagedYield: 100, shortYield: 0 }] }} />);
  expect(screen.getByText("Signed POD-1126")).toBeTruthy();
  expect(screen.getByText("Accepted 59 packs · Damaged 1 packs · Short 0 packs")).toBeTruthy();
});
