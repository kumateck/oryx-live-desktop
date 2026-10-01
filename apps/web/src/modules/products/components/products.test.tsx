// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
import ProductsPage from "../../../pages/(workspace)/production/products/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";

afterEach(() => { cleanup(); forgetSession(); });

const gel = { id: "658da105-a506-44a9-8ff5-8d005a54f294", code: "P-001", name: "Amoxicillin 500", category: { name: "Capsules" }, department: { name: "Production" },
  division: 0, baseQuantity: 2_500_000, fullBatchSize: 1500, baseUoM: { symbol: "mg" }, shelfLife: "24 months", fdaRegistrationNumber: "FDA-1",
  masterFormulaNumber: "MF-9", isVerified: false };

interface Call { method: string; path: string; search: string; body: string | null }

function openProducts(permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ method: input.method, path: url.pathname, search: url.search, body: input.method === "GET" ? null : await input.clone().text() });
    if (url.pathname === "/api/v1/product") return Response.json({ data: [gel], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname === "/api/v1/verification") return new Response(null, { status: 200 });
    return new Response(null, { status: 404 });
  });
  render(<SessionProvider><MemoryRouter><ApiProvider><ProductsPage /></ApiProvider></MemoryRouter></SessionProvider>);
  return calls;
}

it("lists the user's department products with quantities in readable units", async () => {
  const calls = openProducts(["CanViewPlannedProducts"]);
  expect(await screen.findByText("Amoxicillin 500")).toBeTruthy();
  expect(calls.find((call) => call.path === "/api/v1/product")?.search).toContain("departmentId=558da105-a506-44a9-8ff5-8d005a54f294");
  expect(screen.getByText("2.5 kg")).toBeTruthy();
  expect(screen.getByText("1.5 g")).toBeTruthy();
  expect(screen.getByText("Beta-lactam")).toBeTruthy();
  expect(screen.getByText("Not verified")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /^Verify/ })).toBeNull();
  expect(screen.queryByRole("link", { name: "Create" })).toBeNull();
});

it("verifies a product for a user who may, then reloads the list", async () => {
  const calls = openProducts(["CanViewPlannedProducts", "CanVerifyProduct", "CanCreateNewProductionPlan"]);
  expect(screen.queryByRole("link", { name: "Create" }) ?? await screen.findByRole("link", { name: "Create" })).toBeTruthy();
  fireEvent.click(await screen.findByRole("button", { name: "Verify Amoxicillin 500" }));
  await waitFor(() => expect(calls.some((call) => call.method === "POST" && call.path === "/api/v1/verification")).toBe(true));
  expect(JSON.parse(calls.find((call) => call.path === "/api/v1/verification")?.body ?? "{}")).toEqual({ modelId: gel.id, modelType: 0 });
  await waitFor(() => expect(calls.filter((call) => call.path === "/api/v1/product").length).toBeGreaterThan(1));
});
