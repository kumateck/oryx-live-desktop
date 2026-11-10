// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import type { DomainEntitiesMaterialsBatchMaterialBatchDto } from "@/shared/api/generated/materials";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { notifySessionExpired } from "@/shared/auth/session-events";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { ExpiryDetailPage } from "./expiry-detail-page";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });
const unit = { id: "u-ml", symbol: "ml" };
const shelf = (id: string, quantity: number, kind: 0 | 1 = 0) => ({ id: `stock-${id}`, quantity, uoM: unit,
  warehouseLocationShelf: { id, name: id, warehouseLocationRack: { name: "G/09" } },
  materialBatch: { material: { id: "m1", kind } } });
const batch: DomainEntitiesMaterialsBatchMaterialBatchDto = { id: "b1", material: { name: "Propylene Glycol" },
  batchNumber: "KI0203PU1B", status: 3, totalQuantity: 215000, uoM: unit, shelves: [shelf("A", 5000)] };

function open(record = batch, permissions = ["CanReassignRawMaterialStock", "CanViewRawMaterialLocationChartList"], refuse = false) {
  const backend = stubBackend({ permissions: ["CanViewExpiredMaterials", ...permissions] });
  rememberSession();
  const session = backend.fetcher.getMockImplementation();
  const writes: string[] = [];
  let reads = 0;
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === "/api/v1/material/batch/b1") { reads++; return Response.json(record); }
    if (path === "/api/v1/warehouse/rack/by-department/summary") return Response.json([
      { id: "rack", name: "G/09", warehouseLocation: { name: "General" }, shelves: [{ id: "A", name: "A" }, { id: "B", name: "B" }] },
    ]);
    if (path === "/api/v1/material/batch/move/v2") {
      writes.push(await input.text());
      return refuse ? Response.json({ errors: [{ description: "Stock changed. Reload before moving." }] }, { status: 409 }) : new Response(null, { status: 204 });
    }
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/warehouse/expired-materials/:id", element: <ExpiryDetailPage /> }], { initialEntries: ["/warehouse/expired-materials/b1"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { writes, reads: () => reads };
}

it("shows the production allocation when all 215 L is reserved, without claiming it is on an empty shelf", async () => {
  open({ ...batch, shelves: [shelf("A", 0)], reservedQuantities: [{ id: "reserved", quantity: 215000, uoM: unit, warehouse: { name: "SYRUP Production Floor" } }] });
  const locations = await screen.findByRole("region", { name: "Batch stock locations" });
  expect(within(locations).getByText("Reserved · SYRUP Production Floor")).toBeTruthy();
  expect(within(locations).getByText("215 L")).toBeTruthy();
  expect(within(locations).queryByText("G/09 (A)")).toBeNull();
  expect(screen.queryByText("Location not recorded")).toBeNull();
  expect(screen.queryByRole("button", { name: "Update shelf location" })).toBeNull();
});

it.each([0, 1] as const)("uses the stored material kind %s for the update permission", async (kind) => {
  const { writes } = open({ ...batch, shelves: [shelf("A", 5000, kind)] }, [kind === 0 ? "CanReassignPackagingMaterialStock" : "CanReassignRawMaterialStock"]);
  await screen.findByText("Propylene Glycol");
  expect(screen.queryByRole("button", { name: "Update shelf location" })).toBeNull();
  expect(writes).toHaveLength(0);
});

it.each([0, 1] as const)("allows the correct update permission for material kind %s", async (kind) => {
  open({ ...batch, shelves: [shelf("A", 5000, kind)] }, [kind === 0 ? "CanReassignRawMaterialStock" : "CanReassignPackagingMaterialStock"]);
  expect(await screen.findByRole("button", { name: "Update shelf location" })).toBeTruthy();
});

it("keeps each shelf's quantity visible and asks which source to move", async () => {
  const user = userEvent.setup();
  open({ ...batch, shelves: [shelf("A", 5000), shelf("B", 37500), shelf("Empty", 0)] });
  const locations = await screen.findByRole("region", { name: "Batch stock locations" });
  expect(within(locations).getByText("5 L")).toBeTruthy();
  expect(within(locations).getByText("37.5 L")).toBeTruthy();
  expect(within(locations).queryByText("G/09 (Empty)")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Update shelf location" }));
  await user.click(screen.getByRole("button", { name: "G/09 (B) · 37.5 L" }));
  expect(within(await screen.findByRole("dialog")).getByText("37.5 L")).toBeTruthy();
});

async function fillMove() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Update shelf location" }));
  const dialog = await screen.findByRole("dialog");
  await user.type(within(dialog).getByRole("spinbutton", { name: /Quantity/ }), "1.5");
  await user.click(within(dialog).getByRole("combobox", { name: /Rack/ }));
  await user.click(await screen.findByRole("option", { name: "General · G/09" }));
  await user.click(within(dialog).getByRole("combobox", { name: /Shelf/ }));
  await user.click(await screen.findByRole("option", { name: "B" }));
  return { user, dialog };
}

it("moves only the selected source quantity in its stored unit and refreshes the batch", async () => {
  const result = open();
  const { user, dialog } = await fillMove();
  await user.click(within(dialog).getByRole("button", { name: "Move stock" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(JSON.parse(result.writes[0] ?? "{} ")).toEqual({ shelfMaterialBatchId: "stock-A", movedShelfBatchMaterials: [{ warehouseLocationShelfId: "B", quantity: 1500, uomId: "u-ml", note: "" }] });
  await waitFor(() => expect(result.reads()).toBeGreaterThan(1));
});

it("preserves the form and shows a backend refusal", async () => {
  open(batch, ["CanReassignRawMaterialStock"], true);
  const { user, dialog } = await fillMove();
  await user.click(within(dialog).getByRole("button", { name: "Move stock" }));
  expect(await screen.findByText("Stock changed. Reload before moving.")).toBeTruthy();
  expect(within(dialog).getByRole("spinbutton", { name: /Quantity/ })).toHaveProperty("value", "1.5");
});

it("does not submit from an open dialog after the session expires", async () => {
  const { writes } = open();
  const { user, dialog } = await fillMove();
  act(() => notifySessionExpired());
  await user.click(within(dialog).getByRole("button", { name: "Move stock" }));
  expect(writes).toHaveLength(0);
});
