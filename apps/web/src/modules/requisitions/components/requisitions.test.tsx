// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import CreateRequisitionPage from "../../../pages/(workspace)/production/requisition/create/page";
import RequisitionsPage from "../../../pages/(workspace)/production/requisition/general/page";
import RequisitionPage from "../../../pages/(workspace)/production/requisition/[id]/details/page";
import PurchaseRequisitionsPage from "../../../pages/(workspace)/procurement/requisition/page";
import SourcingPage from "../../../pages/(workspace)/procurement/requisition/[id]/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { chooseAction, openMenu } from "../../../test/menu";

// Radix Select needs these and jsdom has neither.
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => { cleanup(); forgetSession(); });

const mg = { id: "u-mg", symbol: "mg" };
const materials = [
  { material: { id: "m1", code: "RM-001", name: "Maize starch", totalStock: 9_000_000, materialCategory: { name: "Excipient" } }, uoM: mg, warehouseStock: 4_000_000, reOrderLevel: 5_000_000, maximumStockLevel: 20_000_000 },
  { material: { id: "m2", code: "RM-002", name: "Lactose", totalStock: 50_000_000 }, uoM: mg, warehouseStock: 50_000_000, reOrderLevel: 5_000_000 },
];
const line = (id: string, status: number) => ({ id, quantity: 2_500_000, status, material: { id: `m-${id}`, code: `RM-${id}`, name: `Material ${id}` }, uoM: mg });
const requisition = { id: "r1", code: "PR-0007", requisitionType: 1, status: 1, approved: true, comments: "Needed for the March campaign", createdAt: "2026-09-20T08:00:00Z",
  requestedBy: { id: "u1", name: "Ada Mensah" }, department: { id: "d1", name: "Production" }, items: [line("a", 1), line("b", 1), line("c", 2)] };
const waiting = { ...requisition, id: "r2", code: "PR-0008", status: 0, approved: false, items: [line("a", 0)] };
const page = (data: unknown[]) => Response.json({ data, pageIndex: 1, pageCount: 1, totalRecordCount: data.length });

function open(address: string, permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: { method: string; path: string; search: string; body: unknown }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const path = url.pathname;
    calls.push({ method: input.method, path, search: url.search, body: input.method === "GET" ? null : await input.clone().json() });
    if (path === "/api/v1/material/department") return page(materials);
    if (path === "/api/v1/collection/MaterialCategory") return Response.json([{ id: "c1", name: "Excipient" }]);
    if (path === "/api/v1/configuration/by-model-type/Requisition") return Response.json({ prefix: "PR-", namingType: 0, minimumNameLength: 4, maximumNameLength: 6 });
    if (path === "/api/v1/configuration/Requisition/count") return Response.json(7);
    if (path === "/api/v1/requisition") return input.method === "GET" ? page([requisition, waiting]) : new Response(null, { status: 204 });
    if (path === "/api/v1/requisition/r1") return Response.json(requisition);
    if (path === "/api/v1/requisition/r2") return Response.json(waiting);
    if (path === "/api/v1/procurement/supplier/m-a/0") return Response.json([{ id: "s1", name: "Acme Chemicals" }, { id: "s2", name: "Bolt Trading" }]);
    if (path === "/api/v1/requisition/source") return Response.json("ok");
    if (path === "/api/v1/material/m1/stock/across-warehouses") return Response.json([{ warehouse: { id: "w1", name: "QC store", type: 0 }, stockQuantity: 5_000_000, expiredQuantity: 1_000_000 }]);
    if (path === "/api/v1/material/m1/stock/pipeline") return Response.json([{ id: "po1", reference: "PO-0009", stage: 3, status: "Approved", quantity: 10_000_000, uom: mg, supplierName: "Acme" }]);
    if (path === "/api/v1/material/m1/department-stock/2000000") return Response.json([{ id: "d-qc", name: "Quality Control" }, { id: "558da105-a506-44a9-8ff5-8d005a54f294", name: "Quality" }]);
    if (path === "/api/v1/configuration/by-model-type/StockTransfer") return Response.json({ prefix: "ST-", namingType: 0, minimumNameLength: 4, maximumNameLength: 6 });
    if (path === "/api/v1/configuration/StockTransfer/count") return Response.json(3);
    if (path === "/api/v1/production-schedule/stock-transfer") return Response.json("st1", { status: 201 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([
    { path: "/production/requisition/create", element: <CreateRequisitionPage /> },
    { path: "/production/requisition/general", element: <RequisitionsPage /> },
    { path: "/production/requisition/:id/details", element: <RequisitionPage /> },
    { path: "/procurement/requisition", element: <PurchaseRequisitionsPage /> },
    { path: "/procurement/requisition/:id", element: <SourcingPage /> },
  ], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}
const rowOf = async (text: string) => { const row = (await screen.findByText(text)).closest("tr"); if (!row) throw new Error(`no row for ${text}`); return row; };

it("raises a purchase requisition for the ticked materials, with quantities stored in the material's unit", async () => {
  const user = userEvent.setup();
  const { calls, router } = open("/production/requisition/create", ["CanViewRawMaterialRequisitionsForCreation", "CanCreateRawMaterialRequisitions", "CanViewRawMaterialRequisitions"]);
  const starch = await rowOf("Maize starch");
  expect(within(starch).getByText("At or under reorder level")).toBeTruthy();
  expect(within(starch).getByText("5 kg")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Raise purchase requisition" }).hasAttribute("disabled")).toBe(true);
  await user.click(within(starch).getByRole("checkbox", { name: "Select row" }));
  await user.click(within(await rowOf("Lactose")).getByRole("checkbox", { name: "Select row" }));
  expect(screen.getByText("2 materials chosen")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Raise purchase requisition" }));

  const dialog = await screen.findByRole("dialog");
  await waitFor(() => expect((within(dialog).getByRole("textbox", { name: /Requisition number/ }) as HTMLInputElement).value).not.toBe(""));
  expect(within(dialog).getByText("16 kg")).toBeTruthy();
  await user.click(within(dialog).getByRole("button", { name: "Raise requisition" }));
  expect(await within(dialog).findByText("Enter how much Maize starch to order")).toBeTruthy();
  expect(calls.some((call) => call.method === "POST")).toBe(false);

  await user.type(within(dialog).getByRole("textbox", { name: "Order quantity of Maize starch" }), "16");
  await user.click(within(dialog).getByRole("button", { name: "Remove Lactose" }));
  await user.type(within(dialog).getByRole("textbox", { name: /Remarks/ }), "Campaign stock");
  await user.click(within(dialog).getByRole("button", { name: "Raise requisition" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/production/requisition/general"));
  const sent = calls.find((call) => call.method === "POST");
  expect(sent?.path).toBe("/api/v1/requisition");
  expect(sent?.body).toMatchObject({ requisitionType: 1, comments: "Campaign stock", expectedDelivery: null, items: [{ materialId: "m1", quantity: 16_000_000, uomId: "u-mg" }] });
  expect((sent?.body as { code: string }).code).toMatch(/^PR-/);
}, 20_000);

it("shows stock but offers no way to raise a requisition without the create permission", async () => {
  open("/production/requisition/create", ["CanViewRawMaterialRequisitionsForCreation"]);
  await rowOf("Maize starch");
  expect(screen.queryByRole("checkbox")).toBeNull();
  expect(screen.queryByRole("button", { name: "Raise purchase requisition" })).toBeNull();
  expect(screen.getByText(/needs its own permission/)).toBeTruthy();
});

it("lists requisitions with what each is waiting on, filters by type, and opens one", async () => {
  const user = userEvent.setup();
  const { calls } = open("/production/requisition/general", ["CanViewRawMaterialRequisitions"]);
  expect(within(await rowOf("PR-0007")).getByText("Awaiting sourcing")).toBeTruthy();
  expect(within(await rowOf("PR-0008")).getByText("Awaiting approval")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Purchase" }));
  await waitFor(() => expect(calls.some((call) => call.path === "/api/v1/requisition" && new URLSearchParams(call.search).get("type") === "1")).toBe(true));
  cleanup();
  open("/production/requisition/r1/details", ["CanViewRawMaterialRequisitions"]);
  expect(await screen.findByText("Needed for the March campaign")).toBeTruthy();
  expect(within(await rowOf("Material c")).getByText("Sourced")).toBeTruthy();
  expect(within(await rowOf("Material a")).getByText("2.5 kg")).toBeTruthy();
});

it("asks Procurement only for approved requisitions still waiting for suppliers", async () => {
  const { calls } = open("/procurement/requisition", ["CanViewPurchaseRequisitions"]);
  await rowOf("PR-0007");
  const query = new URLSearchParams(calls.find((call) => call.path === "/api/v1/requisition")?.search);
  expect([query.get("type"), query.get("status")]).toEqual(["1", "1"]);
});

it("saves the chosen suppliers for the lines that are ready, after confirming what is left for later", async () => {
  const user = userEvent.setup();
  const { calls, router } = open("/procurement/requisition/r1", ["CanViewPurchaseRequisitions", "CanSourcePurchaseRequisition"]);
  await screen.findByText("0 of 2 ready");
  // The line already sent to suppliers is shown, but cannot be sourced again.
  expect(screen.queryByRole("combobox", { name: "Where to buy Material c" })).toBeNull();
  expect(within(await rowOf("Material c")).getByText("Sourced")).toBeTruthy();

  await user.click(screen.getByRole("combobox", { name: "Where to buy Material a" }));
  await user.click(await screen.findByRole("option", { name: "Foreign" }));
  // A source without a supplier is half an answer.
  await user.click(screen.getByRole("button", { name: "Save suppliers" }));
  expect(await screen.findByText("Choose at least one supplier for Material a")).toBeTruthy();
  expect(calls.some((call) => call.method === "POST")).toBe(false);

  await user.click(await screen.findByRole("combobox", { name: "Suppliers for Material a" }));
  await user.click(await screen.findByRole("option", { name: "Acme Chemicals" }));
  await user.click(await screen.findByRole("option", { name: "Bolt Trading" }));
  await user.keyboard("{Escape}");
  expect(await screen.findByText("1 of 2 ready")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Save suppliers" }));
  const confirm = await screen.findByRole("dialog");
  expect(within(confirm).getByText(/1 material without suppliers stays on the requisition for later/)).toBeTruthy();
  await user.click(within(confirm).getByRole("button", { name: "Save suppliers" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/procurement/requisition"));
  expect(calls.find((call) => call.method === "POST")?.body).toEqual({ requisitionId: "r1", items: [
    { materialId: "m-a", uoMId: "u-mg", quantity: 2_500_000, source: 0, suppliers: [{ supplierId: "s1" }, { supplierId: "s2" }] }] });
}, 20_000);

it("explains why a requisition awaiting approval cannot be sourced, and offers nothing to save", async () => {
  open("/procurement/requisition/r2", ["CanViewPurchaseRequisitions", "CanSourcePurchaseRequisition"]);
  expect(await screen.findByText(/still awaiting approval/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Save suppliers" })).toBeNull();
  expect(screen.queryByRole("combobox", { name: /Where to buy/ })).toBeNull();
});

it("lets someone who may only view a requisition see it without choosing suppliers", async () => {
  open("/procurement/requisition/r1", ["CanViewPurchaseRequisitions"]);
  await screen.findByText("0 of 2 ready");
  expect(screen.queryByRole("button", { name: "Save suppliers" })).toBeNull();
  expect(screen.getByRole("combobox", { name: "Where to buy Material a" }).hasAttribute("disabled")).toBe(true);
});

it("shows where else a material is held and what is on order, without writing", async () => {
  const user = userEvent.setup();
  const { calls } = open("/production/requisition/create", ["CanViewRawMaterialRequisitionsForCreation"]);
  await rowOf("Maize starch");
  await chooseAction("Actions for Maize starch", "Stock availability");
  const dialog = await screen.findByRole("dialog");
  const store = (await within(dialog).findByText("QC store")).closest("tr") as HTMLElement;
  expect(within(store).getByText("4 kg")).toBeTruthy();
  expect(within(store).getByText("1 kg")).toBeTruthy();
  await user.click(within(dialog).getByRole("tab", { name: "On its way in" }));
  expect(await within(dialog).findByText("Purchase order")).toBeTruthy();
  expect(within(dialog).getByText("PO-0009")).toBeTruthy();
  expect(calls.every((call) => call.method === "GET")).toBe(true);
});

it("asks another department for stock: only those holding enough are offered, never the user's own", async () => {
  const user = userEvent.setup();
  const { calls } = open("/production/requisition/create", ["CanViewRawMaterialRequisitionsForCreation", "CanCreateRawMaterialRequisitions"]);
  await rowOf("Maize starch");
  // Lactose is held nowhere else, so there is no one to ask.
  await openMenu("Actions for Lactose");
  expect(screen.getByRole("menuitem", { name: /Request stock transfer/ }).textContent).toContain("No other department holds this material");
  await user.keyboard("{Escape}");
  await chooseAction("Actions for Maize starch", "Request stock transfer");
  const dialog = await screen.findByRole("dialog");
  await waitFor(() => expect((within(dialog).getByRole("textbox", { name: /Request number/ }) as HTMLInputElement).value).toMatch(/^ST-/));
  await user.type(within(dialog).getByRole("spinbutton", { name: /Quantity/ }), "2");
  await user.click(within(dialog).getByRole("combobox", { name: /From department/ }));
  expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual(["Quality Control"]);
  await user.click(screen.getByRole("option", { name: "Quality Control" }));
  await user.click(within(dialog).getByRole("button", { name: "Send request" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  const sent = calls.find((call) => call.method === "POST");
  expect(sent?.path).toBe("/api/v1/production-schedule/stock-transfer");
  expect(sent?.body).toMatchObject({ materialId: "m1", uoMId: "u-mg", requiredQuantity: 2_000_000, sources: [{ fromDepartmentId: "d-qc", quantity: 2_000_000 }] });
}, 20_000);
