// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import { ApiProvider } from "../../../../shared/api/api-provider";
import { SessionProvider } from "../../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../../test/backend";
import { chooseAction } from "../../../../test/menu";
import { QaProductWorkspace } from "../../hooks/use-product-workspace";
import { anyChangeKeys, productKeys } from "../../lib/product-keys";
import { BomSection } from "./bom-section";

afterEach(() => { cleanup(); forgetSession(); });

const id = "658da105-a506-44a9-8ff5-8d005a54f294";
const bom = { version: 3, isActive: true, billOfMaterial: { items: [
  { id: "b1", order: 1, baseQuantity: 100, baseUoM: { id: "u-mg", symbol: "mg" }, material: { id: "m-api", name: "Albendazole", code: "RM-001" } },
  { id: "b2", order: 2, baseQuantity: 2, baseUoM: { id: "u-g", symbol: "g" }, material: { id: "m-sugar", name: "Sugar", code: "RM-002" } },
] } };

function open(permissions: string[], qa = false) {
  // Production product pages are limited to production departments (type 0).
  const backend = stubBackend({ permissions, departmentType: 0 });
  rememberSession();
  const calls: { method: string; path: string; search: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    if (input.method !== "GET") calls.push({ method: input.method, path: url.pathname, search: url.search });
    if (url.pathname === `/api/v1/product/${id}/bom` && input.method === "GET") return Response.json(bom);
    if (url.pathname === "/api/v1/bom" && input.method === "POST") return Response.json("new-bom-id", { status: 201 });
    if (url.pathname === "/api/v1/material/m-api/uom") return Response.json({ id: "u-mg", symbol: "mg" });
    if (url.pathname === "/api/v1/material/m-sugar/uom") return Response.json({ id: "u-g", symbol: "g" });
    return new Response(null, { status: 404 });
  });
  const section = <BomSection productId={id} compositionSize={5} batchSize={1_500_000} />;
  const router = createMemoryRouter([{ path: "/qa/products/:id/edit/bom", element: qa ? <QaProductWorkspace>{section}</QaProductWorkspace> : section },
    { path: "/", element: section }], { initialEntries: [qa ? `/qa/products/${id}/edit/bom` : "/"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

describe("product BOM permissions (one key per task and section)", () => {
  it("offers adding but not editing, removing or archiving to a user who may only add lines", async () => {
    open(["CanAddProductionProductBom"]);
    expect(await screen.findByText("Albendazole")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Add material" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Archive" })).toBeNull();
    // With no permitted row action there is no row menu at all.
    expect(screen.queryByRole("button", { name: "Actions for Albendazole" })).toBeNull();
  });

  it("offers removing and archiving only with their own keys", async () => {
    open(["CanDeleteProductionProductBom", "CanArchiveProductionProductBom"]);
    expect(await screen.findByText("Albendazole")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Archive" })).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add material" })).toBeNull();
    await chooseAction("Actions for Albendazole", "Remove");
    expect(await screen.findByRole("dialog")).toBeTruthy();
  });

  it("sends QA saves with the QA context so the server checks QA keys", async () => {
    const calls = open([productKeys.qa.list, productKeys.qa.sections.bom.delete ?? "CanDeleteQaProductBom"], true);
    expect(await screen.findByText("Albendazole")).toBeTruthy();
    await chooseAction("Actions for Albendazole", "Remove");
    fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Remove" }));
    await waitFor(() => expect(screen.queryByText("Albendazole")).toBeNull());
    fireEvent.click(screen.getByRole("button", { name: "Save bill of materials" }));
    await waitFor(() => expect(calls.some((call) => call.path === "/api/v1/bom")).toBe(true));
    expect(new URLSearchParams(calls.find((call) => call.path === "/api/v1/bom")?.search).get("context")).toBe("qa");
  });

  it("grants nothing on the QA pages to Production keys", async () => {
    open(anyChangeKeys("production"), true);
    expect(await screen.findByText("Albendazole")).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Add material" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Archive" })).toBeNull();
  });

  it("keeps the Production and QA key sets apart", () => {
    const production = new Set(anyChangeKeys("production"));
    expect(anyChangeKeys("qa").some((key) => production.has(key))).toBe(false);
  });
});
