// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "../../../../shared/api/api-provider";
import { SessionProvider } from "../../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../../test/backend";
import { chooseAction, openMenu } from "../../../../test/menu";
import { PackagingSection } from "./packaging-section";

afterEach(() => { cleanup(); forgetSession(); });

const id = "658da105-a506-44a9-8ff5-8d005a54f294";
const packages = [
  { id: "p1", material: { id: "m-bottle", name: "Bottle", code: "PM-001" }, productPacking: { id: "s1", name: "1x100ml" }, prescribedQuantity: 1, packingExcessMargin: 0.005,
    baseQuantity: 1, unitCapacity: 0 },
  { id: "p2", material: { id: "m-carton", name: "Carton", code: "PM-002" }, prescribedQuantity: 0.02, packingExcessMargin: 0, baseQuantity: 1, unitCapacity: 0 },
];

function open(saved: object[] = packages) {
  const backend = stubBackend({ permissions: ["CanEditProductionPlan"] });
  rememberSession();
  const calls: { method: string; path: string; body: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method !== "GET") calls.push({ method: input.method, path, body: await input.clone().text() });
    if (path === `/api/v1/product/${id}/packages`) return input.method === "GET" ? Response.json(saved) : Response.json("ok");
    if (path === `/api/v1/product/${id}/packing`) return Response.json([]);
    if (path === "/api/v1/material-specifications/material/m-bottle") return Response.json({ specificationNumber: "SPEC-9" });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: <PackagingSection productId={id} /> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

it("lists the saved materials with entered quantities kept and totals calculated", async () => {
  open();
  const row = (await screen.findByText("Bottle")).closest("tr");
  if (!row) throw new Error("row not found");
  expect(within(row).getByText("1x100ml")).toBeTruthy();
  expect(within(row).getByText("0.005")).toBeTruthy();
  expect(within(row).getByText("1.005")).toBeTruthy();
  expect(await within(row).findByText("SPEC-9")).toBeTruthy();
  expect(screen.getByText("All styles")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Save packing materials" }).hasAttribute("disabled")).toBe(true);
});

it("saves the remaining materials as the whole list", async () => {
  const calls = open();
  await chooseAction("Actions for Carton", "Remove");
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Remove" }));
  await waitFor(() => expect(screen.queryByText("Carton")).toBeNull());
  fireEvent.click(screen.getByRole("button", { name: "Save packing materials" }));
  await waitFor(() => expect(calls.length).toBe(1));
  expect(calls[0]?.path).toBe(`/api/v1/product/${id}/packages`);
  expect(JSON.parse(calls[0]?.body ?? "[]")).toEqual([{
    materialId: "m-bottle", productPackingId: "s1", prescribedQuantity: 1, packingExcessMargin: 0.005, loose: 0.005,
    baseQuantity: 1, unitCapacity: 0, directLinkMaterialId: null, materialThickness: null, otherStandards: null, substituteMaterialIds: [],
  }]);
});

it("refuses to save an empty list, and discards changes on request", async () => {
  const calls = open([packages[1]!]);
  await chooseAction("Actions for Carton", "Remove");
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Remove" }));
  fireEvent.click(await screen.findByRole("button", { name: "Save packing materials" }));
  expect((await screen.findByRole("alert")).textContent).toBe("Add at least one packing material.");
  expect(calls).toEqual([]);
  fireEvent.click(screen.getByRole("button", { name: "Discard changes" }));
  expect(await screen.findByText("Carton")).toBeTruthy();
});
