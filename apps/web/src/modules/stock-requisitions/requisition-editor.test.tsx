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
import { RequisitionEditor } from "./components/requisition-editor";
import { stockRequisitionSchema } from "./lib/stock-requisitions";

const record = (issued = 0) => ({ id: "r1", number: "SR-1", status: issued ? 1 : 0, department: { id: "d1", name: "Quality" }, justification: "Production supplies", requisitionItems: [
  { id: "l1", itemId: "i1", quantityRequested: 2, quantityIssued: issued, item: { id: "i1", name: "Paper", code: "PPR", availableQuantity: 10, classification: 0, unitOfMeasure: { name: "Box", symbol: "bx" } } },
] });
function open(granted = ["CanViewGeneralStoreStockRequisitions", "CanCreateGeneralStoreStockRequisition"]) {
  const backend = stubBackend({ permissions: granted }); const auth = backend.fetcher.getMockImplementation();
  const state = { issued: 0, refuse: false }; const writes: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    if (new URL(input.url).pathname === "/api/v1/items/stock-requisitions/r1") {
      if (input.method === "GET") return Response.json(record(state.issued));
      writes.push(await input.clone().text());
      return state.refuse ? Response.json({ errors: [{ description: "Please retry this save." }] }, { status: 409 }) : new Response(null, { status: 204 });
    }
    return new Response(null, { status: 404 });
  });
  rememberSession(); const saved = vi.fn<(id: string) => void>();
  const router = createMemoryRouter([{ path: "*", element: <RequisitionEditor store={Store.General} requisition={stockRequisitionSchema.parse(record())} onSaved={saved} onClose={() => {}} /> }]);
  render(<SessionProvider><SessionReady><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionReady></SessionProvider>);
  return { state, writes, saved };
}
afterEach(() => { cleanup(); forgetSession(); });
it("validates lazy item rows, retains failed edits and refuses requisitions with new issues", async () => {
  const user = userEvent.setup(); const app = open();
  const quantity = await screen.findByRole("textbox", { name: "Quantity for line 1" });
  await user.clear(quantity); await user.type(quantity, "2.5");
  await user.click(screen.getByRole("button", { name: "Save requisition" }));
  expect(await screen.findByText("Enter a whole number.")).toBeTruthy(); expect(app.writes).toHaveLength(0);
  await user.clear(quantity); await user.type(quantity, "11");
  await user.click(screen.getByRole("button", { name: "Save requisition" }));
  expect(await screen.findByText("Only 10 in stock.")).toBeTruthy(); expect(app.writes).toHaveLength(0);
  await user.clear(quantity); await user.type(quantity, "4"); app.state.issued = 1;
  await user.click(screen.getByRole("button", { name: "Save requisition" }));
  expect(await screen.findByText(/can no longer be changed/)).toBeTruthy(); expect(app.writes).toHaveLength(0);
  app.state.issued = 0; app.state.refuse = true;
  await user.click(screen.getByRole("button", { name: "Save requisition" }));
  expect(await screen.findByText("Please retry this save.")).toBeTruthy(); expect(quantity).toHaveProperty("value", "4");
  app.state.refuse = false;
  await user.click(screen.getByRole("button", { name: "Save requisition" }));
  await waitFor(() => expect(app.saved).toHaveBeenCalledWith("r1"));
  expect(app.writes[1]).toContain('"quantityRequested":4');
});
it("rechecks the create grant before writing an otherwise valid edit", async () => {
  const user = userEvent.setup(); const app = open([]);
  await screen.findByRole("textbox", { name: "Quantity for line 1" });
  await user.click(screen.getByRole("button", { name: "Save requisition" }));
  expect(await screen.findByText(/do not have permission for this action/)).toBeTruthy(); expect(app.writes).toHaveLength(0);
});
