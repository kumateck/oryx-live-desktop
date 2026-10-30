// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import ApprovedProductsRoute from "../../pages/(workspace)/warehouse/approved-products/page";
import TransferNotesRoute from "../../pages/(workspace)/warehouse/finished-goods-transfer-notes/page";
import { ApiProvider } from "../../shared/api/api-provider";
import { SessionProvider } from "../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { openMenu } from "../../test/menu";
import { stockSummary } from "../approved-products/approved-products";
import { fgLayout } from "../../shared/packing/fg-quantity";
import { approveSchema } from "./notes";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

// Dicnac: 80 boxes per shipper, a box holds 20 strips of 10 tablets, so one shipper is 16,000 tablets.
const dicnac = fgLayout({ packPerShipper: 80, basePackingUoM: { name: "Tablet" }, packingLists: [{ uom: { name: "Shipper" }, quantity: 80, order: 1 }, { uom: { name: "Box" }, quantity: 20, order: 2 }, { uom: { name: "Strip" }, quantity: 10, order: 3 }] });

it("checks what the store received as yield, entered as shippers and loose packs", () => {
  const schema = approveSchema({ total: 1_600_200, layout: dicnac });
  expect(schema.safeParse({ shippers: 100, loose: 1, notes: "" }).success).toBe(true);
  expect(schema.safeParse({ shippers: 100, loose: 2, notes: "" }).error?.issues[0]?.message).toBe("That is more than was sent (100 shippers · 1 loose)");
  expect(schema.safeParse({ shippers: Number.NaN, loose: Number.NaN, notes: "" }).error?.issues[0]?.message).toBe("Enter what was received");
  const incomplete = fgLayout({ packPerShipper: 80, packingLists: [{ uom: { name: "Shipper" }, quantity: 7, order: 1 }] });
  expect(approveSchema({ total: 100, layout: incomplete }).safeParse({ shippers: 1, loose: 0, notes: "" }).error?.issues[0]?.message).toContain("does not say how many units fill a pack");
});

it("adds up a product's stock per transfer, each with its own packing style", () => {
  const byPack = fgLayout({ packPerShipper: 100 });
  expect(stockSummary([
    { total: 32_000, received: 32_000, remaining: 16_200, perShipper: 80, packing: "80 X 20 X 10", layout: dicnac },
    { total: 250, received: 240, remaining: 150, perShipper: 100, packing: "10 x 10", layout: byPack },
  ])).toEqual({ transferred: { shippers: 4, loose: 50, units: 0 }, received: { shippers: 4, loose: 40, units: 0 }, remaining: { shippers: 2, loose: 51, units: 0 }, baseName: "Tablet",
    packings: ["80 X 20 X 10 (80 per shipper)", "10 x 10 (100 per shipper)"] });
});

const note = { id: "n1", isApproved: false, totalQuantity: 250, quantityPerPack: 1, remainingQuantity: 0, productPacking: { id: "k1", name: "10 x 10", packPerShipper: 100 },
  batchManufacturingRecord: { batchNumber: "B-1", manufacturingDate: "2026-01-15T00:00:00Z", expiryDate: "2028-01-31T00:00:00Z", productionScheduleProduct: { product: { id: "p1", name: "Dicnac 100", code: "FP-1" } } } };
interface Call { method: string; path: string; search: string; body?: unknown }
function open(address: string, permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ method: input.method, path: url.pathname, search: url.search, ...(input.method !== "GET" ? { body: await input.clone().json().catch(() => null) } : {}) });
    if (url.pathname === "/api/v1/production-schedule/finished-goods-transfer-note") return Response.json({ data: [note], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname === "/api/v1/production-schedule/finished-goods-transfer-note/n1/approve") return new Response(null, { status: 204 });
    if (url.pathname === "/api/v1/production-schedule/approved-products") return Response.json([{ product: { id: "p1", code: "FP-1", name: "Dicnac 100" }, totalQuantity: 250, totalRemainingQuantity: 90 }]);
    if (url.pathname === "/api/v1/production-schedule/approved-products/p1") return Response.json([{ ...note, isApproved: true, quantityReceived: 240 }]);
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/warehouse/finished-goods-transfer-notes", element: <TransferNotesRoute /> }, { path: "/warehouse/approved-products", element: <ApprovedProductsRoute /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

it("approves a transfer with what was counted in, only with the approve permission", async () => {
  const user = userEvent.setup();
  open("/warehouse/finished-goods-transfer-notes", ["CanViewFgtn"]);
  expect(await screen.findByText("2 shippers · 50 loose")).toBeTruthy();
  expect(screen.getByText(new Intl.DateTimeFormat(undefined, { month: "short", year: "numeric" }).format(new Date(2028, 0, 1)))).toBeTruthy();
  await openMenu("Actions for batch B-1");
  expect(screen.queryByRole("menuitem", { name: "Approve" })).toBeNull();
  cleanup();
  const calls = open("/warehouse/finished-goods-transfer-notes", ["CanViewFgtn", "CanApproveFgtn"]);
  await screen.findByText("2 shippers · 50 loose");
  await openMenu("Actions for batch B-1");
  await user.click(await screen.findByRole("menuitem", { name: "Approve" }));
  const dialog = await screen.findByRole("dialog");
  const loose = await within(dialog).findByRole("spinbutton", { name: /Loose packs received/ });
  await user.clear(loose);
  await user.type(loose, "40");
  expect(await within(dialog).findByText(/0 shippers · 10 loose fewer than sent/)).toBeTruthy();
  expect(calls.filter((call) => call.method !== "GET")).toEqual([]);
  await user.click(within(dialog).getByRole("button", { name: "Approve transfer" }));
  await waitFor(() => expect(calls.find((call) => call.method === "PUT")?.body).toEqual({ quantityReceived: 240, notes: null }));
}, 20_000);

it("lists approved products with transferred, received and remaining in shippers and loose packs", async () => {
  open("/warehouse/approved-products", ["CanViewApprovedProducts"]);
  expect(await screen.findByText("Dicnac 100")).toBeTruthy();
  expect(await screen.findByText("10 x 10 (100 per shipper)")).toBeTruthy();
  expect(screen.getByText("2 shippers · 50 loose")).toBeTruthy();
  expect(screen.getByText("2 shippers · 40 loose")).toBeTruthy();
  expect(screen.getByText("0 shippers · 0 loose")).toBeTruthy();
  expect(screen.queryByRole("columnheader", { name: /Shippers and loose/ })).toBeNull();
});
