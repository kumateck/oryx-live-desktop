// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import PurchaseOrderListPage from "../../../pages/(workspace)/procurement/purchase-order-lists/page";
import PurchaseOrderPage from "../../../pages/(workspace)/procurement/purchase-orders/[id]/page";
import RevisePurchaseOrderPage from "../../../pages/(workspace)/procurement/purchase-orders/[id]/revise/page";
import ApprovedPurchaseOrdersPage from "../../../pages/(workspace)/procurement/purchase-orders/approved/page";
import CheckPurchaseOrdersPage from "../../../pages/(workspace)/procurement/purchase-orders/check/page";
import FinalisePurchaseOrdersPage from "../../../pages/(workspace)/procurement/purchase-orders/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { chooseAction, openMenu } from "../../../test/menu";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => { cleanup(); forgetSession(); });

const supplier = (type: number) => ({ id: "s1", name: "Acme Chemicals", email: "sales@acme.test", type, currency: { id: "c-usd", symbol: "$", name: "US Dollar" } });
const future = new Date(Date.now() + 10 * 86_400_000).toISOString();
const order = (type: number, status: number) => ({ id: "po1", code: "PO-0009", createdAt: "2026-09-25T09:00:00Z", status, supplier: supplier(type), proFormaInvoiceNumber: "PFI-778", estimatedDeliveryDate: future,
  deliveryMode: { name: "Sea freight" }, termsOfPayment: { name: "30 days" }, attachments: [{ id: "f1", name: "pfi-778.pdf", link: "https://files.test/pfi-778.pdf" }],
  ...(status >= 4 ? { totalFobValue: 400, totalCifValue: 1_350, seaFreight: 800, insurance: 150, amountInFigures: "One thousand three hundred and fifty US Dollar only" } : {}),
  items: [{ id: "l1", material: { id: "m1", name: "Maize starch", code: "RM-001" }, uom: { id: "u-mg", symbol: "mg" }, quantity: 25_000_000, price: 12, priceUoM: "kg", canReassignSupplier: true }, { id: "l2", material: { id: "m2", name: "Blister film" }, uom: { id: "u-pcs", symbol: "pcs" }, quantity: 40, price: 2.5, priceUoM: "pcs" }] });
interface Call { method: string; path: string; search: string; body: unknown }

function open(address: string, permissions: string[], options: { type?: number; sendStatus?: number; awardStatus?: number; openComparison?: boolean } = {}) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const path = url.pathname;
    const text = input.method === "GET" ? "" : await input.clone().text();
    calls.push({ method: input.method, path, search: url.search, body: text ? JSON.parse(text) as unknown : null });
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
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET");
const statusAsked = (calls: readonly Call[]) => new URLSearchParams(calls.find((call) => call.path === "/api/v1/procurement/purchase-order")?.search).get("status");

it("finalises a foreign order: insurance and freight are required and the total is worked out", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders", ["CanViewForeignPurchaseOrder", "CanCreateForeignPurchaseOrder"]);
  await chooseAction("Actions for PO-0009", "Finalise order");
  expect(statusAsked(calls)).toBe("3");
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("PFI-778")).toBeTruthy();
  await user.click(within(dialog).getByRole("button", { name: "Finalise order" }));
  expect(await within(dialog).findByText("Enter the insurance")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.type(within(dialog).getByRole("spinbutton", { name: /Insurance/ }), "150");
  await user.type(within(dialog).getByRole("spinbutton", { name: /Freight/ }), "800");
  // 300 + 100 of lines, plus 150 and 800.
  expect(await within(dialog).findByText("$ 1,350.00")).toBeTruthy();
  expect(within(dialog).getByText("One thousand three hundred and fifty US Dollar only")).toBeTruthy();
  await user.click(within(dialog).getByRole("button", { name: "Finalise order" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls)).toEqual([{ method: "PUT", path: "/api/v1/procurement/purchase-order/po1", search: "", body: { totalFobValue: 400, totalCifValue: 1_350, seaFreight: 800, insurance: 150,
    amountInFigures: "One thousand three hundred and fifty US Dollar only" } }]);
}, 20_000);

it("finalises a local order with no tax at all", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders?type=1", ["CanViewLocalPurchaseOrder", "CanCreateLocalPurchaseOrder"]);
  await chooseAction("Actions for PO-0009", "Finalise order");
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).queryByRole("spinbutton", { name: /Insurance/ })).toBeNull();
  await user.click(within(dialog).getByRole("button", { name: "Finalise order" }));
  await waitFor(() => expect(writes(calls)).toHaveLength(1));
  expect(writes(calls)[0]?.body).toMatchObject({ totalFobValue: 400, totalCifValue: 400, seaFreight: 0, insurance: 0 });
}, 20_000);

it("marks an order as checked only with the check permission", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders/check", ["CanViewForeignPurchaseOrder", "CanCheckForeignPurchaseOrder"]);
  await chooseAction("Actions for PO-0009", "Review and check");
  expect(statusAsked(calls)).toBe("4");
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("Total CIF value")).toBeTruthy();
  expect(within(dialog).getByText("$ 1,350.00")).toBeTruthy();
  await user.click(within(dialog).getByRole("button", { name: "Mark as checked" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls).map((call) => `${call.method} ${call.path}`)).toEqual(["PUT /api/v1/procurement/purchase-order/check/po1"]);
  cleanup();
  // Someone who may finalise orders is not thereby allowed to check them.
  open("/procurement/purchase-orders/check", ["CanViewForeignPurchaseOrder", "CanCreateForeignPurchaseOrder"]);
  await screen.findByText("PO-0009");
  expect(screen.queryByRole("button", { name: "Actions for PO-0009" })).toBeNull();
});

it("sends an approved order with the delivery date from the proforma invoice offered", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders/approved", ["CanViewApprovedForeignPurchaseOrder", "CanSendApprovedForeignPurchaseOrder"]);
  await chooseAction("Actions for PO-0009", "Review and send");
  expect(statusAsked(calls)).toBe("6");
  const dialog = await screen.findByRole("dialog");
  expect(writes(calls)).toEqual([]);
  await user.click(within(dialog).getByRole("button", { name: "Send order by email" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  const sent = writes(calls)[0];
  expect(`${sent?.method} ${sent?.path}`).toBe("POST /api/v1/procurement/purchase-order/po1");
  expect((sent?.body as { expectedDeliveryDate: string }).expectedDeliveryDate.slice(0, 10)).toBe(new Date(new Date(future).getFullYear(), new Date(future).getMonth(), new Date(future).getDate()).toLocaleDateString("en-CA"));
});

it("warns that a failed send may still have recorded the order as sent", async () => {
  const user = userEvent.setup();
  open("/procurement/purchase-orders/approved", ["CanViewApprovedForeignPurchaseOrder", "CanSendApprovedForeignPurchaseOrder"], { sendStatus: 400 });
  await chooseAction("Actions for PO-0009", "Review and send");
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Send order by email" }));
  expect(await within(dialog).findByText(/The mail server refused the message\. The order may already be recorded as sent/)).toBeTruthy();
});

it("lists every order with its stage, filters by status, and opens one with its history", async () => {
  const user = userEvent.setup();
  const { calls, router } = open("/procurement/purchase-order-lists", ["CanViewForeignPurchaseOrder"]);
  const row = (await screen.findByText("PO-0009")).closest("tr") as HTMLElement;
  expect(statusAsked(calls)).toBeNull();
  expect(within(row).getByText("Sent to supplier")).toBeTruthy();
  expect(within(row).getByText("$ 1,350.00")).toBeTruthy();
  await user.click(screen.getByRole("combobox", { name: "Status" }));
  await user.click(await screen.findByRole("option", { name: "Awaiting check" }));
  await waitFor(() => expect(router.state.location.search).toContain("status=4"));
  await user.click((await screen.findByText("PO-0009")).closest("tr") as HTMLElement);
  await waitFor(() => expect(router.state.location.pathname).toBe("/procurement/purchase-orders/po1"));
  expect(await screen.findByText("Revision 1")).toBeTruthy();
  await user.click(screen.getByRole("tab", { name: "Revisions (1)" }));
  const change = (await screen.findByText("Line changed")).closest("tr") as HTMLElement;
  expect(within(change).getByText("20 kg at $ 11 / kg")).toBeTruthy();
  expect(within(change).getByText("25 kg at $ 12 / kg")).toBeTruthy();
  await user.click(screen.getByRole("tab", { name: "Attachments (1)" }));
  expect(screen.getByRole("link", { name: "pfi-778.pdf" }).getAttribute("href")).toBe("https://files.test/pfi-778.pdf");
}, 20_000);

it("refuses an order of a supplier type the user may not see, whatever the address says", async () => {
  open("/procurement/purchase-orders/po1?type=0", ["CanViewForeignPurchaseOrder"], { type: 1 });
  expect(await screen.findByText("You don't have access to this page")).toBeTruthy();
});

it("revises a sent order: only changed lines are sent, after confirming what changes", async () => {
  const user = userEvent.setup();
  const { calls, router } = open("/procurement/purchase-orders/po1", ["CanViewForeignPurchaseOrder", "CanReviseForeignPurchaseOrder"]);
  await user.click(await screen.findByRole("link", { name: "Revise order" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/procurement/purchase-orders/po1/revise"));
  const quantity = await screen.findByRole("textbox", { name: "Quantity of Maize starch" });
  expect((quantity as HTMLInputElement).value).toBe("25");
  await user.click(screen.getByRole("button", { name: "Review changes" }));
  expect(await screen.findByText("Nothing has been changed")).toBeTruthy();
  await user.clear(quantity);
  await user.type(quantity, "30");
  await user.click(screen.getByRole("button", { name: "Remove Blister film" }));
  await user.click(screen.getByRole("button", { name: "Review changes (2)" }));
  const confirm = await screen.findByRole("dialog");
  expect(within(confirm).getByText(/Maize starch: 30 kg at \$ 12 \/ kg; Blister film: removed from the order/)).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.click(within(confirm).getByRole("button", { name: "Save revision" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/procurement/purchase-orders/po1"));
  expect(writes(calls)).toMatchObject([{ method: "PUT", path: "/api/v1/procurement/purchase-order/po1/revise", body: [
    { type: 3, purchaseOrderItemId: "l1", uoMId: "u-mg", quantity: 30_000_000, price: 12, priceUoM: "kg" }, { type: 4, purchaseOrderItemId: "l2" }] }]);
}, 20_000);

it("does not offer revision without its permission, even by address, and lists revised orders to be checked again", async () => {
  open("/procurement/purchase-orders/po1", ["CanViewForeignPurchaseOrder"]);
  await screen.findByText("Revision 1");
  expect(screen.queryByRole("link", { name: "Revise order" })).toBeNull();
  cleanup();
  open("/procurement/purchase-orders/po1/revise", ["CanViewForeignPurchaseOrder"]);
  expect(await screen.findByText("You don't have access to this page")).toBeTruthy();
  cleanup();
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders/check", ["CanViewForeignPurchaseOrder", "CanCheckForeignPurchaseOrder"]);
  await screen.findByText("PO-0009");
  await user.click(screen.getByRole("button", { name: "Revised" }));
  await waitFor(() => expect(calls.some((call) => call.path === "/api/v1/procurement/purchase-order" && new URLSearchParams(call.search).get("status") === "10")).toBe(true));
});

const reviser = ["CanViewForeignPurchaseOrder", "CanReviseForeignPurchaseOrder"];

it("moves a line to another supplier in two ordered steps: off this order, then awarded", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders/po1/revise", reviser);
  await screen.findByRole("textbox", { name: "Quantity of Maize starch" });
  // A line nobody else quoted for cannot be moved.
  await openMenu("More actions for Blister film");
  expect(screen.getByRole("menuitem", { name: /Move to another supplier/ }).textContent).toContain("No other supplier quoted");
  await user.keyboard("{Escape}");
  await chooseAction("More actions for Maize starch", "Move to another supplier");
  const dialog = await screen.findByRole("dialog");
  const choice = await within(dialog).findByRole("radio");
  // The order's own supplier is not offered.
  expect(within(dialog).getByText("Bolt Trading")).toBeTruthy();
  expect(within(dialog).queryByText("Acme Chemicals")).toBeNull();
  expect(within(dialog).getByRole("button", { name: "Move the line" }).hasAttribute("disabled")).toBe(true);
  await user.click(choice);
  await user.click(within(dialog).getByRole("button", { name: "Move the line" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls).map((call) => `${call.method} ${call.path}`)).toEqual(["PUT /api/v1/procurement/purchase-order/po1/revise", "POST /api/v1/requisition/source/quotation/process-purchase-order"]);
  expect(writes(calls)[0]?.body).toEqual([{ type: 0, purchaseOrderItemId: "l1" }]);
  expect(writes(calls)[1]?.body).toEqual([{ supplierId: "s2", sourceRequisitionId: "sr2", items: [{ materialId: "m1", uomId: "u-mg", quantity: 25_000_000, price: 11, priceUoM: "kg", currencyId: "c-usd" }] }]);
}, 20_000);

it("says where the line went when the award fails, and does not take it off twice on a retry", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders/po1/revise", reviser, { awardStatus: 400 });
  await screen.findByRole("textbox", { name: "Quantity of Maize starch" });
  await chooseAction("More actions for Maize starch", "Move to another supplier");
  const dialog = await screen.findByRole("dialog");
  await user.click(await within(dialog).findByRole("radio"));
  await user.click(within(dialog).getByRole("button", { name: "Move the line" }));
  expect(await within(dialog).findByText(/Maize starch is off this order, but Bolt Trading could not be awarded it/)).toBeTruthy();
  await user.click(within(dialog).getByRole("button", { name: "Award the supplier" }));
  await waitFor(() => expect(writes(calls)).toHaveLength(3));
  expect(writes(calls).filter((call) => call.path.endsWith("/revise"))).toHaveLength(1);
}, 20_000);

it("will not move a line while a price comparison is open, or while other changes are unsaved", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders/po1/revise", reviser, { openComparison: true });
  const quantity = await screen.findByRole("textbox", { name: "Quantity of Maize starch" });
  await chooseAction("More actions for Maize starch", "Move to another supplier");
  let dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText(/A price comparison is open for this supplier type/)).toBeTruthy();
  expect(within(dialog).queryByRole("radio")).toBeNull();
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
  await user.clear(quantity);
  await user.type(quantity, "30");
  await user.tab();
  await openMenu("More actions for Maize starch");
  expect(screen.getByRole("menuitem", { name: /Return to sourcing/ }).textContent).toContain("Save or discard your other changes first");
  expect(writes(calls)).toEqual([]);
}, 20_000);

it("returns a line to sourcing with one request, after confirming", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders/po1/revise", reviser);
  await screen.findByRole("textbox", { name: "Quantity of Maize starch" });
  await chooseAction("More actions for Blister film", "Return to sourcing");
  const confirm = await screen.findByRole("dialog");
  expect(within(confirm).getByText(/goes back to Purchase requisitions/)).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.click(within(confirm).getByRole("button", { name: "Return to sourcing" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls)).toMatchObject([{ method: "PUT", path: "/api/v1/procurement/purchase-order/po1/revise", body: [{ type: 1, purchaseOrderItemId: "l2" }] }]);
});

it("adds a line from what the supplier supplies, saved with the revision", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders/po1/revise", reviser);
  await screen.findByRole("textbox", { name: "Quantity of Maize starch" });
  await user.click(screen.getByRole("button", { name: "Add line" }));
  const dialog = await screen.findByRole("dialog");
  await user.click(await within(dialog).findByRole("combobox", { name: /Material/ }));
  // Starch is already on the order, and Lactose is listed once though two manufacturers make it.
  expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual(["RM-009 - Lactose"]);
  await user.click(screen.getByRole("option", { name: "RM-009 - Lactose" }));
  await user.type(within(dialog).getByRole("spinbutton", { name: /Quantity \(kg\)/ }), "50");
  await user.type(within(dialog).getByRole("spinbutton", { name: /Unit price/ }), "3");
  await user.click(within(dialog).getByRole("combobox", { name: /Priced per/ }));
  await user.click(await screen.findByRole("option", { name: "kg" }));
  await user.click(within(dialog).getByRole("button", { name: "Add to the revision" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.getByText("Lactose: added, 50 kg at $ 3 / kg")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.click(screen.getByRole("button", { name: "Review changes (1)" }));
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Save revision" }));
  await waitFor(() => expect(writes(calls)).toHaveLength(1));
  expect(writes(calls)[0]?.body).toEqual([{ type: 2, materialId: "m9", uoMId: "u-kg", quantity: 50, price: 3, priceUoM: "kg", currencyId: "c-usd" }]);
}, 20_000);

it("cancels an order only with the revise permission for its kind, after saying what cancelling does", async () => {
  const user = userEvent.setup();
  open("/procurement/purchase-orders/po1?type=0", ["CanViewForeignPurchaseOrder"]);
  expect(await screen.findByText("Revision 1")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Cancel order" })).toBeNull();
  cleanup();
  const { calls } = open("/procurement/purchase-orders/po1?type=0", ["CanViewForeignPurchaseOrder", "CanReviseForeignPurchaseOrder"]);
  await user.click(await screen.findByRole("button", { name: "Cancel order" }));
  const dialog = await screen.findByRole("dialog");
  expect(dialog.textContent).toContain("already gone to Acme Chemicals");
  expect(dialog.textContent).toContain("2 lines stay with the order");
  expect(writes(calls)).toEqual([]);
  await user.click(within(dialog).getByRole("button", { name: "Cancel order" }));
  await waitFor(() => expect(writes(calls).map((call) => [call.method, call.path])).toEqual([["DELETE", "/api/v1/procurement/purchase-order/po1/cancel"]]));
});
