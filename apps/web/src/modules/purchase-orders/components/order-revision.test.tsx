// @vitest-environment jsdom
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { chooseAction, openMenu } from "../../../test/menu";
import { open, writes } from "./order-test-fixtures";

const reviser = ["CanViewForeignPurchaseOrder", "CanReviseForeignPurchaseOrder"];

it("moves a line to another supplier in two ordered steps: off this order, then awarded", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders/po1/revise", reviser);
  await screen.findByRole("textbox", { name: "Quantity of Maize starch" });
  // A line nobody else quoted for cannot be moved.
  await openMenu("More actions for Blister film");
  expect(screen.getByRole("menuitem", { name: /Move to another supplier/ }).textContent).toContain("No other supplier quoted");
  await user.keyboard("{Escape}");
  await chooseAction("More actions for Maize starch", "Move to another supplier");
  const dialog = await screen.findByRole("dialog");
  const choice = await within(dialog).findByRole("radio");
  // The order's own supplier is not offered.
  expect(within(dialog).getByText("Bolt Trading")).toBeTruthy();
  expect(within(dialog).queryByText("Acme Chemicals")).toBeNull();
  expect(within(dialog).getByRole("button", { name: "Move the line" }).hasAttribute("disabled")).toBe(true);
  await user.click(choice);
  await user.click(within(dialog).getByRole("button", { name: "Move the line" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls).map((call) => `${call.method} ${call.path}`)).toEqual(["PUT /api/v1/procurement/purchase-order/po1/revise", "POST /api/v1/requisition/source/quotation/process-purchase-order"]);
  expect(writes(calls)[0]?.body).toEqual([{ type: 0, purchaseOrderItemId: "l1" }]);
  expect(writes(calls)[1]?.body).toEqual([{ supplierId: "s2", sourceRequisitionId: "sr2", items: [{ materialId: "m1", uomId: "u-mg", quantity: 25_000_000, price: 11, priceUoM: "kg", currencyId: "c-usd" }] }]);
}, 20_000);

it("says where the line went when the award fails, and does not take it off twice on a retry", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders/po1/revise", reviser, { awardStatus: 400 });
  await screen.findByRole("textbox", { name: "Quantity of Maize starch" });
  await chooseAction("More actions for Maize starch", "Move to another supplier");
  const dialog = await screen.findByRole("dialog");
  await user.click(await within(dialog).findByRole("radio"));
  await user.click(within(dialog).getByRole("button", { name: "Move the line" }));
  expect(await within(dialog).findByText(/Maize starch is off this order, but Bolt Trading could not be awarded it/)).toBeTruthy();
  await user.click(within(dialog).getByRole("button", { name: "Award the supplier" }));
  await waitFor(() => expect(writes(calls)).toHaveLength(3));
  expect(writes(calls).filter((call) => call.path.endsWith("/revise"))).toHaveLength(1);
}, 20_000);

it("will not move a line while a price comparison is open, or while other changes are unsaved", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders/po1/revise", reviser, { openComparison: true });
  const quantity = await screen.findByRole("textbox", { name: "Quantity of Maize starch" });
  await chooseAction("More actions for Maize starch", "Move to another supplier");
  let dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText(/A price comparison is open for this supplier type/)).toBeTruthy();
  expect(within(dialog).queryByRole("radio")).toBeNull();
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
  await user.clear(quantity);
  await user.type(quantity, "30");
  await user.tab();
  await openMenu("More actions for Maize starch");
  expect(screen.getByRole("menuitem", { name: /Return to sourcing/ }).textContent).toContain("Save or discard your other changes first");
  expect(writes(calls)).toEqual([]);
}, 20_000);

it("returns a line to sourcing with one request, after confirming", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders/po1/revise", reviser);
  await screen.findByRole("textbox", { name: "Quantity of Maize starch" });
  await chooseAction("More actions for Blister film", "Return to sourcing");
  const confirm = await screen.findByRole("dialog");
  expect(within(confirm).getByText(/goes back to Purchase requisitions/)).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.click(within(confirm).getByRole("button", { name: "Return to sourcing" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls)).toMatchObject([{ method: "PUT", path: "/api/v1/procurement/purchase-order/po1/revise", body: [{ type: 1, purchaseOrderItemId: "l2" }] }]);
});

it("adds a line from what the supplier supplies, saved with the revision", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders/po1/revise", reviser);
  await screen.findByRole("textbox", { name: "Quantity of Maize starch" });
  await user.click(screen.getByRole("button", { name: "Add line" }));
  const dialog = await screen.findByRole("dialog");
  await user.click(await within(dialog).findByRole("combobox", { name: /Material/ }));
  // Starch is already on the order, and Lactose is listed once though two manufacturers make it.
  expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual(["RM-009 - Lactose"]);
  await user.click(screen.getByRole("option", { name: "RM-009 - Lactose" }));
  await user.type(within(dialog).getByRole("spinbutton", { name: /Quantity \(kg\)/ }), "50");
  await user.type(within(dialog).getByRole("spinbutton", { name: /Unit price/ }), "3");
  await user.click(within(dialog).getByRole("combobox", { name: /Priced per/ }));
  await user.click(await screen.findByRole("option", { name: "kg" }));
  await user.click(within(dialog).getByRole("button", { name: "Add to the revision" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(screen.getByText("Lactose: added, 50 kg at $ 3 / kg")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.click(screen.getByRole("button", { name: "Review changes (1)" }));
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Save revision" }));
  await waitFor(() => expect(writes(calls)).toHaveLength(1));
  expect(writes(calls)[0]?.body).toEqual([{ type: 2, materialId: "m9", uoMId: "u-kg", quantity: 50, price: 3, priceUoM: "kg", currencyId: "c-usd" }]);
}, 20_000);

it("cancels an order only with the revise permission for its kind, after saying what cancelling does", async () => {
  const user = userEvent.setup();
  open("/procurement/purchase-orders/po1?type=0", ["CanViewForeignPurchaseOrder"]);
  expect(await screen.findByText("Revision 1")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Cancel order" })).toBeNull();
  cleanup();
  const { calls } = open("/procurement/purchase-orders/po1?type=0", ["CanViewForeignPurchaseOrder", "CanReviseForeignPurchaseOrder"]);
  await user.click(await screen.findByRole("button", { name: "Cancel order" }));
  const dialog = await screen.findByRole("dialog");
  expect(dialog.textContent).toContain("already gone to Acme Chemicals");
  expect(dialog.textContent).toContain("2 lines stay with the order");
  expect(writes(calls)).toEqual([]);
  await user.click(within(dialog).getByRole("button", { name: "Cancel order" }));
  await waitFor(() => expect(writes(calls).map((call) => [call.method, call.path])).toEqual([["DELETE", "/api/v1/procurement/purchase-order/po1/cancel"]]));
});
