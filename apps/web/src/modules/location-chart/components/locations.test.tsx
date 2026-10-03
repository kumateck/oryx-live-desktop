// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import ApprovedMaterialsPage from "../../../pages/(workspace)/warehouse/approved-materials/page";
import ApprovedMaterialPage from "../../../pages/(workspace)/warehouse/approved-materials/[id]/details/page";
import LocationChartPage from "../../../pages/(workspace)/warehouse/location-chart/page";
import MaterialLocationPage from "../../../pages/(workspace)/warehouse/material-location/page";
import MaterialLocationDetailPage from "../../../pages/(workspace)/warehouse/material-location/[id]/details/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { chooseAction, openMenu } from "../../../test/menu";

// Radix Select needs these and jsdom has neither.
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => { cleanup(); forgetSession(); });

const soon = new Date(Date.now() + 20 * 86_400_000).toISOString();
const mg = { id: "u-mg", symbol: "mg" };
const starch = { id: "m1", code: "RM-001", name: "Maize starch", kind: 0 };
const film = { id: "m2", code: "PM-001", name: "Blister film", kind: 1 };
const racks = [
  { id: "r1", name: "Rack 1", warehouseLocation: { name: "Raw store" }, shelves: [{ id: "s1", code: "A1" }, { id: "s2", code: "A2" }] },
  { id: "r2", name: "Rack 2", warehouseLocation: { name: "Raw store" }, shelves: [{ id: "s3", code: "B1" }] },
];
const rackOne = { id: "r1", name: "Rack 1", warehouseLocation: { name: "Raw store", floorName: "Ground" }, shelves: [
  { id: "s1", code: "A1", materialBatches: [{ id: "sb1", quantity: 5_000_000, uoM: mg, materialBatch: { batchNumber: "B-01", expiryDate: soon, material: starch } }] },
  { id: "s2", code: "A2", materialBatches: [] }] };
const shelfRecord = { id: "sb1", quantity: 5_000_000, uoM: mg, materialBatch: { id: "b1", batchNumber: "B-01", expiryDate: soon, material: starch },
  warehouseLocationShelf: { id: "s1", code: "A1", warehouseLocationRack: { name: "Rack 1", warehouseLocation: { name: "Raw store", floorName: "Ground" } } } };
const page = (data: unknown[]) => Response.json({ data, pageIndex: 1, pageCount: 1, totalRecordCount: data.length });

function open(address: string, permissions: string[], moveStatus = 204) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: { method: string; path: string; body: unknown; search: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const path = url.pathname;
    calls.push({ method: input.method, path, search: url.search, body: input.method === "GET" ? null : await input.clone().json() });
    if (path === "/api/v1/material/approved-materials") return page(url.searchParams.get("kind") === "1" ? [] : [{ material: starch, unitOfMeasure: mg, totalAvailableQuantity: 5_000_000, reservedQuantity: 5_000_000 }]);
    if (path === "/api/v1/warehouse/rack/by-department/summary") return Response.json(url.searchParams.get("kind") === "1" ? [] : racks);
    if (path === "/api/v1/warehouse/rack/r1") return Response.json(rackOne);
    if (path === "/api/v1/warehouse/rack/r2") return Response.json({ id: "r2", name: "Rack 2", shelves: [{ id: "s3", code: "B1", materialBatches: [] }] });
    if (path === "/api/v1/material/batch/move/v2") return moveStatus === 204 ? new Response(null, { status: 204 }) : Response.json({ errors: [{ code: "Material.Move", description: "The target shelf is in a different warehouse" }] }, { status: moveStatus });
    if (path === "/api/v1/material/department") return page([{ material: starch, uoM: mg, warehouseStock: 5_000_000, minimumStockLevel: 10_000_000, reOrderLevel: 20_000_000, maximumStockLevel: 0, expiredQuantity: 1_000_000 }]);
    if (path === "/api/v1/material/m1") return Response.json(starch);
    if (path === "/api/v1/material/m2") return Response.json(film);
    if (path === "/api/v1/material/m1/shelf") return Response.json([shelfRecord, { ...shelfRecord, id: "sb0", quantity: 0 }]);
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([
    { path: "/warehouse/approved-materials", element: <ApprovedMaterialsPage /> },
    { path: "/warehouse/approved-materials/:id/details", element: <ApprovedMaterialPage /> },
    { path: "/warehouse/location-chart", element: <LocationChartPage /> },
    { path: "/warehouse/material-location", element: <MaterialLocationPage /> },
    { path: "/warehouse/material-location/:id/details", element: <MaterialLocationDetailPage /> },
  ], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}

it("lists approved stock with what is free to issue, and opens a material", async () => {
  const { router } = open("/warehouse/approved-materials", ["CanViewApprovedRawMaterials"]);
  const row = (await screen.findByText("Maize starch")).closest("tr");
  if (!row) throw new Error("row not found");
  // Everything approved is reserved, so nothing is free.
  expect(within(row).getByText("0 mg").className).toContain("text-destructive");
  expect(within(row).getAllByText("5 kg")).toHaveLength(2);
  // One kind allowed: no switch to a list the user may not see.
  expect(screen.queryByRole("group", { name: "Material kind" })).toBeNull();
  fireEvent.click(row);
  await waitFor(() => expect(router.state.location.pathname).toBe("/warehouse/approved-materials/m1/details"));
});

it("refuses an approved material of a kind the user may not see, even by address", async () => {
  open("/warehouse/approved-materials/m2/details", ["CanViewApprovedRawMaterials"]);
  expect(await screen.findByText("You don't have access to this page")).toBeTruthy();
  expect(screen.queryByText("Blister film")).toBeNull();
});

it("shows the open rack's shelves and hides the move action from a user who may only view", async () => {
  const { calls } = open("/warehouse/location-chart", ["CanViewRawMaterialLocationChartList"]);
  const row = (await screen.findByText("Maize starch")).closest("tr");
  if (!row) throw new Error("row not found");
  expect(within(row).getByText("A1")).toBeTruthy();
  expect(within(row).getByText("5 kg")).toBeTruthy();
  expect(screen.getByText("1 of 2")).toBeTruthy();
  expect(screen.getByText("Empty: A2")).toBeTruthy();
  expect(screen.getByRole("button", { name: /Raw store · Rack 1/ }).getAttribute("aria-current")).toBe("true");
  expect(screen.queryByRole("button", { name: /Actions for batch/ })).toBeNull();
  fireEvent.click(screen.getByRole("button", { name: /Raw store · Rack 2/ }));
  expect(await screen.findByText("This rack is empty")).toBeTruthy();
  // Viewing never writes.
  expect(calls.every((call) => call.method === "GET")).toBe(true);
});

it("moves stock to other shelves after checking the quantities, and sends them in the stored unit", async () => {
  const user = userEvent.setup();
  const { calls } = open("/warehouse/location-chart", ["CanViewRawMaterialLocationChartList", "CanReassignRawMaterialStock"]);
  await chooseAction(/Actions for batch B-01 on shelf A1/, "Move to another shelf");
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("5 kg")).toBeTruthy();
  // The dialog cannot be submitted until the racks to choose from have arrived.
  await waitFor(() => expect(within(dialog).getByRole("button", { name: "Move stock" }).hasAttribute("disabled")).toBe(false));
  await user.click(within(dialog).getByRole("button", { name: "Move stock" }));
  expect(await within(dialog).findByText("Choose a rack")).toBeTruthy();
  expect(calls.some((call) => call.method === "POST")).toBe(false);

  await user.type(within(dialog).getByRole("spinbutton", { name: /Quantity \(kg\)/ }), "6");
  await user.click(within(dialog).getByRole("combobox", { name: /Rack/ }));
  await user.click(await screen.findByRole("option", { name: "Raw store · Rack 1" }));
  await user.click(within(dialog).getByRole("combobox", { name: /Shelf/ }));
  await user.click(await screen.findByRole("option", { name: "A1" }));
  await user.click(within(dialog).getByRole("button", { name: "Move stock" }));
  expect(await within(dialog).findByText("The stock is already on this shelf")).toBeTruthy();
  expect(within(dialog).getByText("The quantities add up to more than the 5 kg on the shelf")).toBeTruthy();
  expect(calls.some((call) => call.method === "POST")).toBe(false);

  await user.click(within(dialog).getByRole("combobox", { name: /Shelf/ }));
  await user.click(await screen.findByRole("option", { name: "A2" }));
  await user.clear(within(dialog).getByRole("spinbutton", { name: /Quantity \(kg\)/ }));
  await user.type(within(dialog).getByRole("spinbutton", { name: /Quantity \(kg\)/ }), "1.5");
  await user.click(within(dialog).getByRole("button", { name: "Move stock" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  const sent = calls.find((call) => call.method === "POST");
  expect(sent?.path).toBe("/api/v1/material/batch/move/v2");
  expect(sent?.body).toEqual({ shelfMaterialBatchId: "sb1", movedShelfBatchMaterials: [{ warehouseLocationShelfId: "s2", quantity: 1_500_000, uomId: "u-mg", note: "" }] });
  // The rack is read again after the move.
  await waitFor(() => expect(calls.filter((call) => call.path === "/api/v1/warehouse/rack/r1").length).toBeGreaterThan(1));
}, 20_000);

it("keeps the move dialog open with the server's reason when the move is refused", async () => {
  const user = userEvent.setup();
  open("/warehouse/location-chart", ["CanViewRawMaterialLocationChartList", "CanReassignRawMaterialStock"], 400);
  await chooseAction(/Actions for batch B-01 on shelf A1/, "Move to another shelf");
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByRole("spinbutton", { name: /Quantity \(kg\)/ }), "1");
  await user.click(within(dialog).getByRole("combobox", { name: /Rack/ }));
  await user.click(await screen.findByRole("option", { name: "Raw store · Rack 2" }));
  await user.click(within(dialog).getByRole("combobox", { name: /Shelf/ }));
  await user.click(await screen.findByRole("option", { name: "B1" }));
  await user.click(within(dialog).getByRole("button", { name: "Move stock" }));
  expect(await within(dialog).findByText("The target shelf is in a different warehouse")).toBeTruthy();
}, 20_000);

it("says so when the department has no racks for the kind", async () => {
  open("/warehouse/location-chart?type=1", ["CanViewRawMaterialLocationChartList", "CanViewPackagingMaterialLocationChartList"]);
  expect(await screen.findByText("No racks")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Packaging" }).getAttribute("aria-pressed")).toBe("true");
});

it("lists the department's materials with their stock judged against their levels", async () => {
  const { router } = open("/warehouse/material-location", ["CanViewRawMaterialLocationList"]);
  const row = (await screen.findByText("Maize starch")).closest("tr");
  if (!row) throw new Error("row not found");
  expect(within(row).getByText("Critical")).toBeTruthy();
  expect(within(row).getByText("1 kg expired")).toBeTruthy();
  expect(within(row).getByText("Not set")).toBeTruthy();
  fireEvent.click(row);
  await waitFor(() => expect(router.state.location.pathname).toBe("/warehouse/material-location/m1/details"));
});

it("shows every shelf holding a material, with its levels, and offers the move only with its own permission", async () => {
  open("/warehouse/material-location/m1/details?type=0", ["CanViewRawMaterialLocationList", "CanReassignRawMaterialStock"]);
  expect(await screen.findByText("1 batch on 1 shelf")).toBeTruthy();
  expect(await screen.findByText("Critical")).toBeTruthy();
  expect(screen.getByText("Rack 1 · Raw store · Ground")).toBeTruthy();
  // The record left at zero by an earlier move is not listed.
  expect(screen.getAllByRole("row")).toHaveLength(2);
  await openMenu(/Actions for batch B-01 on shelf A1/);
  expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["Move to another shelf"]);
});

it("does not offer the move on a material's shelves to a user without the reassign permission", async () => {
  open("/warehouse/material-location/m1/details?type=0", ["CanViewRawMaterialLocationList", "CanAssignRawMaterialsStockToShelves"]);
  expect(await screen.findByText("Rack 1 · Raw store · Ground")).toBeTruthy();
  expect(screen.queryByRole("button", { name: /Actions for batch/ })).toBeNull();
});

it("prints the open rack and a material's shelves as documents, without writing anything", async () => {
  const user = userEvent.setup();
  const { calls } = open("/warehouse/location-chart", ["CanViewRawMaterialLocationChartList"]);
  await screen.findByText("Maize starch");
  await user.click(screen.getByRole("button", { name: "Print rack" }));
  const preview = await screen.findByRole("dialog");
  expect(within(preview).getByText("Location chart record")).toBeTruthy();
  expect(within(preview).getByText("Empty shelves")).toBeTruthy();
  expect(within(preview).getByText("B-01")).toBeTruthy();
  cleanup();
  open("/warehouse/material-location/m1/details?type=0", ["CanViewRawMaterialLocationList"]);
  await screen.findByText("1 batch on 1 shelf");
  await user.click(screen.getByRole("button", { name: "Print" }));
  const record = await screen.findByRole("dialog");
  expect(within(record).getByText("Material location record")).toBeTruthy();
  expect(within(record).getByText("Critical")).toBeTruthy();
  expect(calls.every((call) => call.method === "GET")).toBe(true);
});
