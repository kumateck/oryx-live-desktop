// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, Outlet, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { RouteAccess } from "@/components/shell/route-access";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { chooseAction } from "@/test/menu";
import { QaProductWorkspace } from "../hooks/use-product-workspace";
import { QaProductRecordLayout } from "./qa-product-record-layout";
import { QaProductsPage } from "./qa-products-page";
import ProductDetailPage from "./pages/product-detail-page";
import ProductEditLayout from "./pages/product-edit-layout";
import ProductEditBomPage from "./pages/product-edit-bom-page";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });
const id = "658da105-a506-44a9-8ff5-8d005a54f294";
const departmentId = "758da105-a506-44a9-8ff5-8d005a54f294";
const otherDepartmentId = "858da105-a506-44a9-8ff5-8d005a54f294";
const name = "Gelatin Capsule Shells - Zinvite";
const view = "CanViewPlannedProducts";
const edit = "CanEditProductionPlan";

function open(permissions: string[], address = "/qa/products", productDepartment = departmentId) {
  const backend = stubBackend({ permissions, departmentType: 1 }); rememberSession();
  const calls: { path: string; search: string; method: string; body: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url); const path = url.pathname;
    calls.push({ path, search: url.search, method: input.method, body: input.method === "GET" ? "" : await input.clone().text() });
    if (path === "/api/v1/department") return Response.json({ data: [{ id: departmentId, name: "Tablet", type: 0 }], pageIndex: 1, pageCount: 1 });
    if (path === `/api/v1/department/${departmentId}`) return Response.json({ id: departmentId, name: "Tablet", type: 0 });
    if (path === "/api/v1/product") return Response.json({ data: [{ id, name: "Zinvite", code: "P1", isVerified: false }], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (path === `/api/v1/product/${id}`) return Response.json({ id, name: "Zinvite", code: "P1", isVerified: false,
      department: { id: productDepartment, name: "Tablet" }, baseQuantity: 1, fullBatchSize: 2 });
    if (path === `/api/v1/product/${id}/bom`) return Response.json({ version: 2, isActive: true, billOfMaterial: { items: [
      { id: "line-shells", order: 1, baseQuantity: 50, baseUoM: { id: "old-mg", symbol: "mg" }, material: { id: "shells", name, code: "RMG033" } },
    ] } });
    if (path === "/api/v1/material/shells/uom") return Response.json({ id: "linked-piece", symbol: "piece" });
    if (path === "/api/v1/material/department") return Response.json({ data: [], pageIndex: 1, pageCount: 1 });
    if (path === "/api/v1/bom") return Response.json("ok");
    if (path === "/api/v1/verification") return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/qa/products", element: <RouteAccess><QaProductWorkspace><Outlet /></QaProductWorkspace></RouteAccess>, children: [
    { index: true, element: <QaProductsPage /> },
    { path: ":id", element: <QaProductRecordLayout />, children: [
      { path: "details", element: <ProductDetailPage /> },
      { path: "edit", element: <ProductEditLayout />, children: [{ path: "bom", element: <ProductEditBomPage /> }] },
    ] },
  ] }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}

it("guards QA products before queries mount and does not grant access from QA membership", async () => {
  const { calls } = open(["CanVerifyProduct"]);
  expect(await screen.findByRole("heading", { name: "You don't have access to this page" })).toBeTruthy();
  expect(calls).toEqual([]);
});

it("loads products only after QA chooses a production department", async () => {
  const { calls } = open([view]);
  const user = userEvent.setup();
  await user.click(await screen.findByRole("combobox", { name: "Production department" }));
  await user.click(await screen.findByRole("option", { name: "Tablet" }));
  expect(calls.filter(call => call.path === "/api/v1/product")).toEqual([]);
  await user.click(screen.getByRole("button", { name: "Load products" }));
  expect(await screen.findByRole("link", { name: "Zinvite" })).toBeTruthy();
  expect(calls.find(call => call.path === "/api/v1/product")?.search).toContain(`departmentId=${departmentId}`);
  expect(screen.getByRole("link", { name: "Zinvite" }).getAttribute("href")).toBe(`/qa/products/${id}/details?departmentId=${departmentId}`);
  expect(calls.some(call => call.path.includes("switch-department"))).toBe(false);
});

it("keeps QA detail/edit links in the selected department and hides ungranted edit actions", async () => {
  open([view], `/qa/products/${id}/details?departmentId=${departmentId}`);
  expect(await screen.findByRole("heading", { name: "Zinvite" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Edit product" })).toBeNull();
  expect(screen.queryByRole("button", { name: /Verify Zinvite/ })).toBeNull();
});

it("retains department context in the QA edit link", async () => {
  const { router } = open([view, edit], `/qa/products/${id}/details?departmentId=${departmentId}`);
  expect((await screen.findByRole("link", { name: "Edit product" })).getAttribute("href"))
    .toBe(`/qa/products/${id}/edit/info?departmentId=${departmentId}`);
  fireEvent.click(screen.getByRole("tab", { name: "Procedure" }));
  expect(router.state.location.search).toContain(`departmentId=${departmentId}`);
});

it("refuses a mismatched department before any editor or material lookup mounts", async () => {
  const { calls } = open([view, edit], `/qa/products/${id}/edit/bom?departmentId=${departmentId}`, otherDepartmentId);
  expect(await screen.findByText("This product is not available in the selected department.")).toBeTruthy();
  expect(calls.some(call => call.path.endsWith("/bom") || call.path.startsWith("/api/v1/material"))).toBe(false);
});

it("denies a QA edit bookmark without edit permission before even reading the product", async () => {
  const { calls } = open([view], `/qa/products/${id}/edit/bom?departmentId=${departmentId}`);
  expect(await screen.findByRole("heading", { name: "You don't have access to this page" })).toBeTruthy();
  expect(calls).toEqual([]);
});

it("uses the product's linkage for QA BOM editing and rechecks that unit before saving", async () => {
  const { calls } = open([view, edit], `/qa/products/${id}/edit/bom?departmentId=${departmentId}`);
  await chooseAction(`Actions for ${name}`, "Edit");
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByRole("spinbutton", { name: "Unit quantity (piece)" })).toBeTruthy();
  fireEvent.click(within(dialog).getByRole("button", { name: "Update material" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "Save bill of materials" }));
  await waitFor(() => expect(calls.some(call => call.path === "/api/v1/bom")).toBe(true));
  const lookups = calls.filter(call => call.path === "/api/v1/material/shells/uom");
  expect(lookups.length).toBeGreaterThanOrEqual(2);
  expect(lookups.every(call => call.search.includes(`productId=${id}`))).toBe(true);
  expect(calls.find(call => call.path === "/api/v1/bom")?.body).toContain('"baseUoMId":"linked-piece"');
  expect(screen.getByRole("link", { name: "Packing materials" }).getAttribute("href")).toContain(`departmentId=${departmentId}`);
});

it("uses product-scoped materials in the QA picker", async () => {
  const { calls } = open([view, edit], `/qa/products/${id}/edit/bom?departmentId=${departmentId}`);
  await screen.findByText(name);
  fireEvent.click(await screen.findByRole("button", { name: "Add material" }));
  fireEvent.click(await screen.findByRole("combobox", { name: /Material/ }));
  await waitFor(() => expect(calls.find(call => call.path === "/api/v1/material/department")?.search).toContain(`productId=${id}`));
});

it("allows explicitly granted QA verification without changing the active department", async () => {
  const { calls } = open([view, "CanVerifyProduct"], `/qa/products?departmentId=${departmentId}`);
  fireEvent.click(await screen.findByRole("button", { name: "Verify Zinvite" }));
  await waitFor(() => expect(calls.some(call => call.path === "/api/v1/verification")).toBe(true));
  expect(calls.find(call => call.path === "/api/v1/verification")?.body).toBe(JSON.stringify({ modelId: id, modelType: 0 }));
  expect(calls.some(call => call.path.includes("switch-department"))).toBe(false);
});
