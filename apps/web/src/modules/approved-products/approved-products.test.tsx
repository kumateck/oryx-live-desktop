// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import ApprovedProductPackingRoute from "../../pages/(workspace)/warehouse/approved-products/[id]/packing-style/page";
import ApprovedProductsRoute from "../../pages/(workspace)/warehouse/approved-products/page";
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
const products = [
  { product: { id: beta, code: "BL-1", name: "Amoxicillin 250", division: 0 }, totalQuantity: 100, totalRemainingQuantity: 50 },
  { product: { id: "p2", code: "NL-1", name: "Wormee 4", division: 1 }, totalQuantity: 80, totalRemainingQuantity: 20 },
];

function open(address: string, permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const posts: { path: string; body: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method === "POST" && path.startsWith("/api/v1/product/")) { posts.push({ path, body: await input.clone().text() }); return Response.json(beta); }
    if (path === "/api/v1/production-schedule/approved-products") return Response.json(products);
    if (path.startsWith("/api/v1/production-schedule/approved-products/")) return Response.json([]);
    if (path === `/api/v1/product/${beta}`) return Response.json({ id: beta, name: "Amoxicillin 250", code: "BL-1", fullBatchSize: 1_500_000, baseUoM: { symbol: "ml" } });
    if (path === `/api/v1/product/${beta}/packing`) return Response.json([style]);
    if (path === "/api/v1/collection/uom/paginated") return Response.json({ data: [bottle] });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([
    { path: "/warehouse/approved-products", element: <ApprovedProductsRoute /> },
    { path: "/warehouse/approved-products/:id/packing-style", element: <ApprovedProductPackingRoute /> },
  ], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { posts, router };
}

it("lists beta-lactam and non-beta-lactam products apart, behind a division switch", async () => {
  const { router } = open("/warehouse/approved-products", ["CanViewApprovedProducts"]);
  expect(await screen.findByText("Amoxicillin 250")).toBeTruthy();
  expect(screen.queryByText("Wormee 4")).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Non-beta-lactam" }));
  expect(await screen.findByText("Wormee 4")).toBeTruthy();
  expect(screen.queryByText("Amoxicillin 250")).toBeNull();
  expect(router.state.location.search).toBe("?division=1");
});

it("opens a product's packing styles from its row menu", async () => {
  const { router } = open("/warehouse/approved-products", ["CanViewApprovedProducts"]);
  await chooseAction("Actions for Amoxicillin 250", "View packing style");
  await waitFor(() => expect(router.state.location.pathname).toBe(`/warehouse/approved-products/${beta}/packing-style`));
  expect(await screen.findByText("100 ml bottle")).toBeTruthy();
});

it("shows packing styles read-only without the approved-product packing permission", async () => {
  open(`/warehouse/approved-products/${beta}/packing-style`, ["CanViewApprovedProducts", "CanEditProductionPlan"]);
  expect(await screen.findByText("100 ml bottle")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Add style" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Save packing styles" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Actions for 100 ml bottle" })).toBeNull();
});

it("saves edits through the finished goods endpoint with the approved-product packing permission", async () => {
  const { posts } = open(`/warehouse/approved-products/${beta}/packing-style`, ["CanViewApprovedProducts", "CanEditApprovedProductPackingStyle"]);
  expect(await screen.findByText("100 ml bottle")).toBeTruthy();
  await chooseAction("Actions for 100 ml bottle", "Remove");
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Remove" }));
  fireEvent.click(screen.getByRole("button", { name: "Save packing styles" }));
  await waitFor(() => expect(posts).toEqual([{ path: `/api/v1/product/${beta}/packing/approved-product`, body: "[]" }]));
}, 20_000);
