// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import FgProductPackingRoute from "../../pages/(workspace)/warehouse/fg-products/[id]/page";
import FgProductsRoute from "../../pages/(workspace)/warehouse/fg-products/page";
import { ApiProvider } from "../../shared/api/api-provider";
import { SessionProvider } from "../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { chooseAction } from "../../test/menu";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

const beta = "11111111-1111-4111-8111-111111111111";
const bottle = { id: "u-bottle", name: "Bottle", symbol: "btl", type: 1 };
const style = { id: "33333333-3333-4333-8333-333333333333", name: "100 ml bottle", isDefault: true, basePackingQuantity: 100, packPerShipper: 24, expectedYield: 15000,
  basePackingUoM: bottle, packingLists: [{ uom: bottle, quantity: 1, order: 1 }] };
// Products of one division come from different departments; the list must not narrow them to one.
const byDivision: Record<string, object[]> = {
  "0": [{ id: beta, code: "BL-1", name: "Amoxicillin 250", division: 0, department: { name: "Beta Lactam" } }],
  "1": [{ id: "p2", code: "NL-1", name: "Wormee 4", division: 1, department: { name: "Oral Liquid-Syrup" } }, { id: "p3", code: "NL-2", name: "Paracetamol 500", division: 1, department: { name: "Oral Solid-Tablet" } }],
};

function open(address: string, permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const posts: { path: string; body: string }[] = [];
  const lists: URLSearchParams[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const path = url.pathname;
    if (input.method === "POST" && path.startsWith("/api/v1/product/")) { posts.push({ path, body: await input.clone().text() }); return Response.json(beta); }
    if (path === "/api/v1/product") { lists.push(url.searchParams); const data = byDivision[url.searchParams.get("division") ?? ""] ?? []; return Response.json({ data, pageIndex: 1, pageCount: 1, totalRecordCount: data.length }); }
    if (path === `/api/v1/product/${beta}`) return Response.json({ id: beta, name: "Amoxicillin 250", code: "BL-1", division: 0, fullBatchSize: 1_500_000, baseUoM: { symbol: "ml" } });
    if (path === `/api/v1/product/${beta}/packing`) return Response.json([style]);
    if (path === "/api/v1/collection/uom/paginated") return Response.json({ data: [bottle] });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([
    { path: "/warehouse/fg-products", element: <FgProductsRoute /> },
    { path: "/warehouse/fg-products/:id", element: <FgProductPackingRoute /> },
  ], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { posts, lists, router };
}

it("loads every product of the chosen division, from all departments, not by department", async () => {
  const { lists, router } = open("/warehouse/fg-products", ["CanViewApprovedProducts"]);
  expect(await screen.findByText("Amoxicillin 250")).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Non-beta-lactam" }));
  expect(await screen.findByText("Wormee 4")).toBeTruthy();
  expect(screen.getByText("Paracetamol 500")).toBeTruthy();
  expect(screen.queryByText("Amoxicillin 250")).toBeNull();
  expect(router.state.location.search).toBe("?division=1");
  expect(lists.every((params) => params.has("division") && !params.has("departmentId"))).toBe(true);
});

it("opens a product's packing styles when its row is clicked", async () => {
  const { router } = open("/warehouse/fg-products", ["CanViewApprovedProducts"]);
  fireEvent.click(await screen.findByText("Amoxicillin 250"));
  await waitFor(() => expect(router.state.location.pathname).toBe(`/warehouse/fg-products/${beta}`));
  expect(await screen.findByText("100 ml bottle")).toBeTruthy();
});

it("shows packing styles read-only without the approved-product packing permission", async () => {
  open(`/warehouse/fg-products/${beta}`, ["CanViewApprovedProducts"]);
  expect(await screen.findByText("100 ml bottle")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Add style" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Save packing styles" })).toBeNull();
});

it("saves packing styles through the finished goods endpoint", async () => {
  const { posts } = open(`/warehouse/fg-products/${beta}`, ["CanViewApprovedProducts", "CanEditApprovedProductPackingStyle"]);
  expect(await screen.findByText("100 ml bottle")).toBeTruthy();
  await chooseAction("Actions for 100 ml bottle", "Remove");
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Remove" }));
  fireEvent.click(screen.getByRole("button", { name: "Save packing styles" }));
  await waitFor(() => expect(posts).toEqual([{ path: `/api/v1/product/${beta}/packing/approved-product`, body: "[]" }]));
}, 20_000);
