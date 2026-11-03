// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { Store } from "@/shared/inventory/stores";
import { SessionReady } from "@/test/session-ready";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { PurchaseRequisitionEditor } from "./components/purchase-editor";
import { purchaseRequisitionSchema } from "./lib/purchase-requisitions";
import { purchaseFormSchema } from "./schemas/purchase-form";

const record = (sourced = false) => ({ id: "p1", code: "PR-1", status: 0, expectedDeliveryDate: "2026-01-10T00:00:00Z", remarks: "Urgent", items: [
  { id: "l1", quantity: 2, status: sourced ? 2 : 1, uoM: { id: "u1", name: "Box", symbol: "bx" }, item: { id: "i1", name: "Paper", code: "PPR", availableQuantity: 0, store: Store.General, classification: 0 } },
] });
function open() {
  const backend = stubBackend({ permissions: ["CanViewGeneralStorePurchaseRequisitions", "CanEditGeneralStorePurchaseRequisition"] }); const auth = backend.fetcher.getMockImplementation();
  const state = { sourced: true }; const writes: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    if (new URL(input.url).pathname === "/api/v1/procurement/inventory/p1") {
      if (input.method === "GET") return Response.json(record(state.sourced));
      writes.push(await input.clone().text()); return new Response(null, { status: 204 });
    }
    return new Response(null, { status: 404 });
  });
  rememberSession(); const saved = vi.fn<(id: string) => void>();
  const router = createMemoryRouter([{ path: "*", element: <PurchaseRequisitionEditor store={Store.General} requisition={purchaseRequisitionSchema.parse(record())} onSaved={saved} onClose={() => {}} /> }]);
  render(<SessionProvider><SessionReady><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionReady></SessionProvider>);
  return { state, writes, saved };
}
afterEach(() => { cleanup(); forgetSession(); });
it("keeps fractional purchase quantities and existing delivery dates, while refusing sourced records", async () => {
  const user = userEvent.setup(); const app = open();
  const quantity = await screen.findByRole("textbox", { name: "Quantity for line 1" });
  await user.clear(quantity); await user.type(quantity, "1.25000");
  await user.click(screen.getByRole("button", { name: "Save requisition" }));
  expect(await screen.findByText(/have been sourced/)).toBeTruthy(); expect(app.writes).toHaveLength(0);
  expect(quantity).toHaveProperty("value", "1.25000"); app.state.sourced = false;
  await user.click(screen.getByRole("button", { name: "Save requisition" }));
  await waitFor(() => expect(app.saved).toHaveBeenCalledWith("p1"));
  expect(app.writes[0]).toBe(JSON.stringify({ code: "PR-1", expectedDeliveryDate: "2026-01-10T00:00:00.000Z", remarks: "Urgent", items: [{ itemId: "i1", uoMId: "u1", quantity: 1.25 }] }));
});
it("requires an orderable unit and rejects a past delivery date only for new requisitions", () => {
  const values = { store: Store.General, number: "PR-1", delivery: new Date(2000, 0, 1), remarks: "", lines: [{ key: "l1", quantity: "0.00001", item: { id: "i1", name: "Paper", code: "PPR", available: 0, classification: 0, unitId: "u1", unitName: "Box", unitSymbol: "bx" } }] };
  expect(purchaseFormSchema(true).safeParse(values).success).toBe(true);
  expect(purchaseFormSchema(false).safeParse(values).success).toBe(false);
  expect(purchaseFormSchema(true).safeParse({ ...values, lines: values.lines.map((line) => ({ ...line, item: { ...line.item, unitId: "" } })) }).success).toBe(false);
});
