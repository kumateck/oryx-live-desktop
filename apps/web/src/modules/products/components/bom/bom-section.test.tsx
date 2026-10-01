// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "../../../../shared/api/api-provider";
import { SessionProvider } from "../../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../../test/backend";
import { chooseAction, openMenu } from "../../../../test/menu";
import { BomSection } from "./bom-section";

afterEach(() => { cleanup(); forgetSession(); });

const id = "658da105-a506-44a9-8ff5-8d005a54f294";
const bom = { version: 3, isActive: true, billOfMaterial: { items: [
  { id: "b1", order: 1, baseQuantity: 100, baseUoM: { id: "u-mg", symbol: "mg" }, material: { id: "m-api", name: "Albendazole", code: "RM-001" } },
  { id: "b2", order: 2, baseQuantity: 2, baseUoM: { id: "u-g", symbol: "g" }, material: { id: "m-sugar", name: "Sugar", code: "RM-002" } },
] } };

function open(saved: object | null = bom) {
  const backend = stubBackend({ permissions: ["CanEditProductionPlan"] });
  rememberSession();
  const calls: { method: string; path: string; body: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method !== "GET") calls.push({ method: input.method, path, body: await input.clone().text() });
    if (path === `/api/v1/product/${id}/bom` && input.method === "GET") return Response.json(saved);
    if (path === "/api/v1/bom" && input.method === "POST") return Response.json("new-bom-id", { status: 201 });
    if (path === `/api/v1/product/${id}/bom/archive`) return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: <BomSection productId={id} compositionSize={5} batchSize={1_500_000} /> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

it("shows the formula scaled to a batch and saves the remaining lines as the next version", async () => {
  const calls = open();
  expect(await screen.findByText("Albendazole")).toBeTruthy();
  expect(screen.getByRole("heading", { name: /version 3/ })).toBeTruthy();
  // 100 mg per 5 ml unit, 1,500,000 ml batch.
  expect(screen.getByText("30 kg")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Reorder Albendazole" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Save bill of materials" }).hasAttribute("disabled")).toBe(true);
  await chooseAction("Actions for Albendazole", "Remove");
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Remove" }));
  await waitFor(() => expect(screen.queryByText("Albendazole")).toBeNull());
  // Archiving is offered only for the saved formula, not while there are unsaved changes.
  expect(screen.queryByRole("button", { name: "Archive" })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: "Save bill of materials" }));
  await waitFor(() => expect(calls.some((call) => call.path === "/api/v1/bom")).toBe(true));
  expect(JSON.parse(calls.find((call) => call.path === "/api/v1/bom")?.body ?? "{}")).toEqual({ productId: id, items: [
    { materialId: "m-sugar", baseUoMId: "u-g", baseQuantity: 2, grade: null, order: 1, prescribedQuantity: 600_000, isSubstitutable: false, substituteMaterialIds: [] },
  ] });
});

it("refuses to save an empty formula and explains why", async () => {
  const calls = open({ version: 1, isActive: true, billOfMaterial: { items: [bom.billOfMaterial.items[0]] } });
  await chooseAction("Actions for Albendazole", "Remove");
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Remove" }));
  fireEvent.click(await screen.findByRole("button", { name: "Save bill of materials" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Add at least one material.");
  expect(calls).toEqual([]);
});

it("treats a product without a formula as empty, and archives only after confirmation", async () => {
  const view = open(null);
  expect(await screen.findByText("No materials yet")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Archive" })).toBeNull();
  cleanup(); forgetSession();
  expect(view).toEqual([]);
  const calls = open();
  fireEvent.click(await screen.findByRole("button", { name: "Archive" }));
  const dialog = await screen.findByRole("dialog");
  expect(dialog.textContent).toContain("left without one");
  fireEvent.click(within(dialog).getByRole("button", { name: "Archive" }));
  await waitFor(() => expect(calls.some((call) => call.method === "PUT" && call.path === `/api/v1/product/${id}/bom/archive`)).toBe(true));
});
