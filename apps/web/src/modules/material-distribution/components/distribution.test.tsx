// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import ShipmentDistributionPage from "../../../pages/(workspace)/procurement/material-distribution/[id]/details/page";
import MaterialDistributionPage from "../../../pages/(workspace)/procurement/material-distribution/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { confirmBlock, sectionTotals } from "../lib/distribution";

afterEach(() => { cleanup(); forgetSession(); });

it("totals a material's shares and holds distribution until the arrival is approved", () => {
  expect(sectionTotals({ arrived: 60, shares: [{ requested: 50, allocated: 30 }, { requested: 50, allocated: 30 }] })).toEqual({ requested: 100, allocated: 60, short: 40, surplus: 0 });
  expect(sectionTotals({ arrived: 120, shares: [{ requested: 100, allocated: 120 }] })).toMatchObject({ short: 0, surplus: 20 });
  expect(confirmBlock({ approved: false }, { shares: [{ departmentId: "d1" }] })).toContain("approved");
  expect(confirmBlock({ approved: true }, { shares: [{ departmentId: null }] })).toContain("no department");
  expect(confirmBlock({ approved: true }, { shares: [{ departmentId: "d1" }] })).toBeNull();
});

const invoice = { id: "inv-a", code: "INV-A", supplier: { id: "s0", name: "Acme Chemicals", type: 0 }, items: [{ id: "i1", material: { name: "Maize starch" }, receivedQuantity: 60, expectedQuantity: 100, purchaseOrder: { code: "PO-1" } }] };
const shipment = (approved: boolean) => ({ id: "sd-1", code: "SD-1", status: 4, arrivedAt: "2026-09-28T08:00:00Z", approved, shipmentInvoice: invoice, attachments: [] });
const share = (id: string, department: string, requested: number, allocated: number) => ({ department: { id, name: department }, requisitionItem: { id: `ri-${id}`, uoM: { symbol: "kg" } }, quantityRequested: requested, quantityAllocated: allocated, quantityRemaining: requested - allocated });
const sections = [{ material: { id: "m1", name: "Maize starch", code: "RM-1" }, totalQuantity: 60, uoM: { symbol: "kg" }, items: [share("d1", "Production", 50, 30), share("d2", "Quality Control", 50, 30)] }];
interface Call { method: string; path: string }

function open(address: string, permissions: string[], approved = true) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    calls.push({ method: input.method, path });
    if (path === "/api/v1/procurement/shipment-document/arrived") return Response.json({ data: [shipment(approved)], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (path === "/api/v1/procurement/shipment-document/sd-1") return Response.json(shipment(approved));
    if (path === "/api/v1/procurement/shipment-document/sd-1/material-distribution") return Response.json({ sections });
    if (path.includes("/confirm-distribution/")) return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/procurement/material-distribution", element: <MaterialDistributionPage /> }, { path: "/procurement/material-distribution/:id/details", element: <ShipmentDistributionPage /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET");

it("shows the server's shares and distributes a material only after the receiving store is chosen and confirmed", async () => {
  const user = userEvent.setup();
  const { calls, router } = open("/procurement/material-distribution/sd-1/details", ["CanViewMaterialDistribution", "CanDistributeMaterial"]);
  expect(await screen.findByText(/Production/)).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Distribute Maize starch" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText(/40 kg short of what was asked for/)).toBeTruthy();
  await user.click(within(dialog).getByRole("button", { name: "Confirm distribution" }));
  expect(await within(dialog).findByText("Choose the department whose store receives the goods.")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.click(within(dialog).getByRole("radio", { name: "Quality Control" }));
  await user.click(within(dialog).getByRole("button", { name: "Confirm distribution" }));
  await waitFor(() => expect(writes(calls)).toEqual([{ method: "POST", path: "/api/v1/procurement/sd-1/confirm-distribution/m1/d2" }]));
  // It was the last material, so the page returns to the list.
  await waitFor(() => expect(router.state.location.pathname).toBe("/procurement/material-distribution"));
}, 20_000);

it("offers no distribution to a viewer, and none before the arrival is approved", async () => {
  open("/procurement/material-distribution/sd-1/details", ["CanViewMaterialDistribution"]);
  await screen.findByText(/Production/);
  expect(screen.queryByRole("button", { name: "Distribute Maize starch" })).toBeNull();
  cleanup();
  open("/procurement/material-distribution/sd-1/details", ["CanViewMaterialDistribution", "CanDistributeMaterial"], false);
  expect(await screen.findByText(/waiting for approval/)).toBeTruthy();
  expect((screen.getByRole("button", { name: "Distribute Maize starch" }) as HTMLButtonElement).disabled).toBe(true);
});
