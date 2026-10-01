// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import CreateProductPage from "../../../../pages/(workspace)/production/products/create/page";
import ProductEditLayout from "../../../../pages/(workspace)/production/products/[id]/edit/layout";
import EditProductInfoPage from "../../../../pages/(workspace)/production/products/[id]/edit/info/page";
import { ApiProvider } from "../../../../shared/api/api-provider";
import { SessionProvider } from "../../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../../test/backend";

afterEach(() => { cleanup(); forgetSession(); });

const id = "658da105-a506-44a9-8ff5-8d005a54f294";
const saved = { id, name: "Wormee", code: "NL-047", division: 1, baseQuantity: 5, fullBatchSize: 1_500_000, price: 12,
  category: { id: "c1", name: "Syrup" }, department: { id: "d1", name: "Oral liquids" }, equipment: null,
  baseUoM: { id: "u1", name: "Millilitre", symbol: "ml", type: 0 }, description: "<p>Claims</p>" };

interface Call { method: string; path: string; body: string | null }

function open(address: string) {
  const backend = stubBackend({ permissions: ["CanViewPlannedProducts", "CanCreateNewProductionPlan", "CanEditProductionPlan"] });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    calls.push({ method: input.method, path, body: input.method === "GET" ? null : await input.clone().text() });
    if (path === "/api/v1/collection") return Response.json({ ProductCategory: [{ id: "c1", name: "Syrup" }] });
    if (path === "/api/v1/collection/uom/paginated") return Response.json({ data: [{ id: "u1", name: "Millilitre", symbol: "ml", type: 0 }, { id: "u9", name: "Box", symbol: "box", type: 1 }] });
    if (path === "/api/v1/product/equipment/all") return Response.json([{ id: "e1", name: "Mixer" }]);
    if (path === "/api/v1/department") return Response.json({ data: [{ id: "d1", name: "Oral liquids" }] });
    if (path === "/api/v1/configuration/by-model-type/Product") return Response.json({ prefix: "NL-", namingType: 0, minimumNameLength: 3, maximumNameLength: 5 });
    if (path === "/api/v1/configuration/Product/count") return Response.json(47);
    if (path === `/api/v1/product/${id}` && input.method === "GET") return Response.json(saved);
    if (path === `/api/v1/product/${id}` && input.method === "PUT") return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([
    { path: "/production/products/create", element: <CreateProductPage /> },
    { path: "/production/products/:id/edit", element: <ProductEditLayout />, children: [{ path: "info", element: <EditProductInfoPage /> }] },
    { path: "/production/products/:id/details", element: <p>Product detail</p> },
    { path: "/production/products", element: <p>Product list</p> },
  ], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}

it("suggests the next product code and explains what is missing before anything is sent", async () => {
  const { calls } = open("/production/products/create");
  const code = await screen.findByRole("textbox", { name: /Product code/ });
  await waitFor(() => expect((code as HTMLInputElement).value).toBe("NL-048"));
  fireEvent.click(screen.getByRole("button", { name: "Create product" }));
  expect(await screen.findByText("Enter the product name")).toBeTruthy();
  expect(await screen.findByText("Choose a category")).toBeTruthy();
  expect(await screen.findByText("Enter the full batch size")).toBeTruthy();
  expect(calls.some((call) => call.method === "POST" && call.path === "/api/v1/product")).toBe(false);
});

it("edits a product's information from its saved values and saves only when asked", async () => {
  const { calls } = open(`/production/products/${id}/edit/info`);
  const name = await screen.findByRole("textbox", { name: /Product name/ });
  await waitFor(() => expect((name as HTMLInputElement).value).toBe("Wormee"));
  expect(screen.getByRole("heading", { name: "Edit Wormee" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Info" }).getAttribute("aria-current")).toBe("page");
  expect(screen.getByRole("link", { name: "Bill of materials" }).getAttribute("href")).toBe(`/production/products/${id}/edit/bom`);
  // Sections not built yet are listed but cannot be opened.
  expect(screen.getByText("ARD").getAttribute("aria-disabled")).toBe("true");
  expect(screen.getByRole("status").textContent).toContain("Full batch: 1,500 L");
  fireEvent.change(name, { target: { value: "Wormee 4 Suspension" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(calls.some((call) => call.method === "PUT")).toBe(true));
  const body = JSON.parse(calls.find((call) => call.method === "PUT")?.body ?? "{}");
  expect(body).toMatchObject({ name: "Wormee 4 Suspension", code: "NL-047", categoryId: "c1", departmentId: "d1", baseUomId: "u1",
    division: 1, baseQuantity: 5, fullBatchSize: 1_500_000, price: 12, equipmentId: null });
});

it("asks before leaving a form with unsaved changes", async () => {
  const { router } = open(`/production/products/${id}/edit/info`);
  const name = await screen.findByRole("textbox", { name: /Product name/ });
  await waitFor(() => expect((name as HTMLInputElement).value).toBe("Wormee"));
  fireEvent.change(name, { target: { value: "Changed" } });
  void router.navigate("/production/products");
  expect(await screen.findByRole("heading", { name: "Leave without saving?" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Keep editing" }));
  await waitFor(() => expect(screen.queryByRole("heading", { name: "Leave without saving?" })).toBeNull());
  expect((screen.getByRole("textbox", { name: /Product name/ }) as HTMLInputElement).value).toBe("Changed");
  void router.navigate("/production/products");
  fireEvent.click(await screen.findByRole("button", { name: "Leave" }));
  expect(await screen.findByText("Product list")).toBeTruthy();
});
