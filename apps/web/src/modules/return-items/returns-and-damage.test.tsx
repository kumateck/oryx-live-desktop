// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { DamageMissingPage } from "@/modules/damage-missing/components/damage-page";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { Store } from "@/shared/inventory/stores";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { openMenu } from "@/test/menu";
import { ReturnItemsPage } from "./components/returns-page";
import { returnedByLine, returnListSchema } from "./lib/returns";

const requisition = { id: "r1", number: "SR-0009", status: 1, store: Store.Equipment, issueHistoryAttributed: true, department: { id: "d1", name: "Engineering" },
  requisitionItems: [{ id: "l1", itemId: "i1", quantityRequested: 5, quantityIssued: 3,
    item: { id: "i1", code: "DRL", name: "Drill", store: Store.Equipment, availableQuantity: 7, isActive: true, classification: 0, unitOfMeasure: { name: "Piece", symbol: "pc" } } }] };
const earlier = { id: "x1", createdAt: "2026-10-21T10:00:00Z", quantity: 1, reason: null, store: Store.Equipment, itemStockRequisitionId: "r1", itemStockRequisitionItemId: "l1",
  requisitionNumber: "SR-0009", createdBy: { firstName: "Kojo", lastName: "Asare" }, item: { id: "i1", name: "Drill", code: "DRL", unitOfMeasure: { symbol: "pc" } } };
const damage = (overrides: Record<string, unknown> = {}) => ({ id: "g1", itemId: "i1", quantityDamaged: 2, damageStatus: 0, remarks: "Dropped", createdAt: "2026-10-21T09:00:00Z",
  item: { name: "Drill", code: "DRL", store: Store.Equipment, availableQuantity: 4, unitOfMeasure: { symbol: "pc" } }, ...overrides });

function open(element: React.ReactNode, address: string, granted: string[]) {
  const backend = stubBackend({ permissions: granted });
  const auth = backend.fetcher.getMockImplementation();
  const state = { damage: damage() };
  const calls: { path: string; method: string; body: unknown }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ path: url.pathname, method: input.method, body: input.method === "GET" ? null : await input.clone().json().catch(() => null) });
    if (input.method !== "GET") return input.method === "POST" ? Response.json("new-id") : new Response(null, { status: 204 });
    if (url.pathname === "/api/v1/recoverable-items-reports") return Response.json([earlier]);
    if (url.pathname === "/api/v1/items/stock-requisitions") return Response.json({ data: [requisition], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname === "/api/v1/items/stock-requisitions/r1") return Response.json(requisition);
    if (url.pathname === "/api/v1/damaged-goods") return Response.json({ data: [state.damage], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname === "/api/v1/damaged-goods/g1") return Response.json(state.damage);
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([{ path: "*", element }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { state, writes: () => calls.filter((c) => c.method !== "GET") };
}
// Radix Select needs pointer capture and scrolling, which jsdom does not provide.
HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

it("counts what has already been returned per requisition line", () => {
  expect(returnedByLine(returnListSchema.parse([earlier, { ...earlier, id: "x2", quantity: 2 }])).get("l1")).toBe(3);
});

it("records a return against the issued line and refuses more than is left", async () => {
  const user = userEvent.setup();
  const page = open(<ReturnItemsPage />, "/extrals/return-items?storeType=2", ["CanViewEquipmentStoreReturnItems", "CanCreateEquipmentStoreReturnItem"]);
  await screen.findByText("SR-0009");
  await user.click(screen.getByRole("button", { name: "Record a return" }));
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("combobox", { name: "Issued requisition" }));
  await user.click(await screen.findByRole("option", { name: /SR-0009/ }));
  await user.click(await within(dialog).findByRole("combobox", { name: "Item" }));
  // 3 issued, 1 already returned.
  await user.click(await screen.findByRole("option", { name: /2 of 3 pc returnable/ }));
  await user.type(within(dialog).getByLabelText(/Quantity returned/), "3");
  expect(await within(dialog).findByText("Only 2 issued on this requisition remain to be returned.")).toBeTruthy();
  await user.clear(within(dialog).getByLabelText(/Quantity returned/)); await user.type(within(dialog).getByLabelText(/Quantity returned/), "2");
  await user.click(within(dialog).getByRole("button", { name: "Record return" }));
  await waitFor(() => expect(page.writes()).toHaveLength(1));
  expect(page.writes()[0]).toMatchObject({ path: "/api/v1/recoverable-items-reports", body: { itemId: "i1", itemStockRequisitionItemId: "l1", quantity: 2 } });
});

it("corrects a damage record after a fresh read and refuses a changed one", async () => {
  const user = userEvent.setup();
  const page = open(<DamageMissingPage />, "/extrals/damage-missing-items?storeType=2", ["CanViewEquipmentStoreDamageMissingItems", "CanEditEquipmentStoreDamageMissingItemRecord"]);
  await screen.findByText("Dropped");
  await openMenu(/Actions for Drill/); await user.click(screen.getByRole("menuitem", { name: "Correct" }));
  const dialog = await screen.findByRole("dialog");
  const quantity = within(dialog).getByLabelText("Quantity");
  await user.clear(quantity); await user.type(quantity, "7");
  expect(within(dialog).getByText(/At most 6 pc/)).toBeTruthy();
  await user.clear(quantity); await user.type(quantity, "3");
  page.state.damage = damage({ quantityDamaged: 5 });
  await user.click(within(dialog).getByRole("button", { name: "Save correction" }));
  expect(await within(dialog).findByText(/changed after you opened it/)).toBeTruthy();
  expect(page.writes()).toHaveLength(0);
});

it("hides corrections and deletions without their keys", async () => {
  open(<DamageMissingPage />, "/extrals/damage-missing-items?storeType=2", ["CanViewEquipmentStoreDamageMissingItems"]);
  await screen.findByText("Dropped");
  // With no action allowed the row has no actions menu at all.
  expect(screen.queryByRole("button", { name: /Actions for Drill/ })).toBeNull();
});
