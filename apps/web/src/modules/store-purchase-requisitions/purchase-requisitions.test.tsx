// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { Store } from "@/shared/inventory/stores";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { PurchaseRequisitionDetailPage } from "./components/purchase-pages";
import { purchaseEditable, purchaseRequisitionSchema, samePurchaseRequisition } from "./lib/purchase-requisitions";

const record = (lineStatus = 1) => ({ id: "p1", code: "PR-0007", status: 0, createdAt: "2026-10-20T08:00:00Z", remarks: "For Q4",
  createdBy: { firstName: "Abena", lastName: "Mensah" },
  items: [{ id: "a", quantity: 12, status: lineStatus, uoM: { id: "u1", symbol: "bx" },
    item: { id: "i1", name: "Paper", code: "PPR", store: Store.General, availableQuantity: 3, minimumLevel: 5, maximumLevel: 40, reorderLevel: 10 } }] });
const keys = ["CanViewGeneralStorePurchaseRequisitions", "CanEditGeneralStorePurchaseRequisition", "CanDeleteGeneralStorePurchaseRequisition"];

function open(data: unknown, granted = keys) {
  const backend = stubBackend({ permissions: granted });
  const auth = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    return new URL(input.url).pathname === "/api/v1/procurement/inventory/p1" ? Response.json(data) : new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([{ path: "/extrals/purchase-requisitions/:id/details", element: <PurchaseRequisitionDetailPage /> }], { initialEntries: ["/extrals/purchase-requisitions/p1/details"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
}
afterEach(() => { cleanup(); forgetSession(); });

it("is editable only until an item is sourced, and notices a changed line", () => {
  const pending = purchaseRequisitionSchema.parse(record());
  expect(purchaseEditable(pending)).toBe(true);
  expect(purchaseEditable(purchaseRequisitionSchema.parse(record(2)))).toBe(false);
  expect(samePurchaseRequisition(pending, purchaseRequisitionSchema.parse({ ...record(), items: [{ ...record().items[0], quantity: 13 }] }))).toBe(false);
});

it("shows each item's stock levels and offers edit and delete while pending", async () => {
  open(record());
  expect(await screen.findByText("For Q4")).toBeTruthy();
  expect(screen.getByText("12 bx")).toBeTruthy();
  expect(screen.getByText("40")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Edit" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Delete" })).toBeTruthy();
});

it("offers no changes once an item has been sourced", async () => {
  open(record(2));
  expect(await screen.findByText("Sourced")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Delete" })).toBeNull();
});
