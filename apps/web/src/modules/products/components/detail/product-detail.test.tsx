// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, expect, it } from "vitest";
import ProductDetailPage from "../../../../pages/(workspace)/production/products/[id]/details/page";
import { ApiProvider } from "../../../../shared/api/api-provider";
import { SessionProvider } from "../../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../../test/backend";

afterEach(() => { cleanup(); forgetSession(); });

const id = "658da105-a506-44a9-8ff5-8d005a54f294";
const product = { id, code: "NL-047", name: "Wormee 4 Suspension", category: { name: "Syrup" }, division: 1, baseQuantity: 5, fullBatchSize: 1_500_000,
  baseUoM: { name: "Millilitre", symbol: "ml" }, shelfLife: "24 months", isVerified: false, createdAt: "2026-01-02T10:00:00Z", createdBy: { name: "Ada" },
  description: "<p>Each 5 ml contains <strong>albendazole</strong></p><script>bad()</script>",
  currentBillOfMaterial: { version: 3, isActive: true, effectiveDate: "2026-02-01T00:00:00Z",
    billOfMaterial: { items: [{ id: "a1", order: 1, material: { name: "Albendazole", code: "RM-001" }, baseQuantity: 100, baseUoM: { symbol: "mg" } }] } },
  outdatedBillOfMaterials: [{ version: 2, isActive: false, billOfMaterial: { items: [{ id: "b1", order: 1, material: { name: "Old sugar", code: "RM-009" }, baseQuantity: 1, baseUoM: { symbol: "g" } }] } }],
  packages: [{ id: "p1", material: { name: "Bottle", code: "PM-1" }, prescribedQuantity: 1000, packingExcessMargin: 20 }], packings: [] };

function open(permissions: string[], address = `/production/products/${id}/details`, status = 200) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const paths: string[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    paths.push(path);
    if (path === `/api/v1/product/${id}`) return status === 200 ? Response.json(product) : new Response(null, { status });
    if (path === `/api/v1/product/${id}/routes`) return Response.json([{ id: "758da105-a506-44a9-8ff5-8d005a54f294", order: 1, operation: { name: "Mixing" }, isCritical: true,
      responsibleRoles: [{ role: { name: "Operator" }, action: 1 }] }]);
    return new Response(null, { status: 404 });
  });
  render(<SessionProvider><MemoryRouter initialEntries={[address]}><ApiProvider><Routes>
    <Route path="/production/products/:id/details" element={<ProductDetailPage />} />
  </Routes></ApiProvider></MemoryRouter></SessionProvider>);
  return paths;
}

it("shows the product, its scaled bill of materials, and only permitted actions", async () => {
  open(["CanViewPlannedProducts"]);
  expect(await screen.findByRole("heading", { name: "Wormee 4 Suspension" })).toBeTruthy();
  expect(screen.getByText("1,500 L")).toBeTruthy();
  expect(screen.getByText("albendazole").tagName).toBe("STRONG");
  expect(document.body.innerHTML).not.toContain("bad()");
  // 100 mg per 5 ml, scaled to 1,500,000 ml.
  expect(screen.getByText("30 kg")).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Edit product" })).toBeNull();
  expect(screen.queryByRole("button", { name: /Verify/ })).toBeNull();
});

it("loads a tab's records only when it is opened, and opens the tab named in the address", async () => {
  const paths = open(["CanViewPlannedProducts", "CanEditProductionPlan"], `/production/products/${id}/details?tab=outdated-boms`);
  expect(await screen.findByText("Old sugar")).toBeTruthy();
  expect(screen.getByRole("link", { name: "Edit product" }).getAttribute("href")).toBe(`/production/products/${id}/edit/info`);
  expect(paths).not.toContain(`/api/v1/product/${id}/routes`);
  fireEvent.click(screen.getByRole("tab", { name: "Procedure" }));
  expect(await screen.findByText("Mixing")).toBeTruthy();
  expect(screen.getByText("Critical")).toBeTruthy();
  expect(screen.getByText(/Stock requisition or issue/)).toBeTruthy();
  fireEvent.click(screen.getByRole("tab", { name: "Packaging" }));
  expect(await screen.findByText("1020")).toBeTruthy();
  // A product without quality documents answers 404: that is an empty tab, not an error.
  fireEvent.click(screen.getByRole("tab", { name: "ARD" }));
  expect(await screen.findByText("No analytical raw data")).toBeTruthy();
});

it("says so when the product does not exist", async () => {
  open(["CanViewPlannedProducts"], undefined, 404);
  await waitFor(() => expect(screen.getByRole("heading", { name: "This product could not be found" })).toBeTruthy());
  expect(screen.queryByRole("button", { name: "Retry" })).toBeNull();
});
