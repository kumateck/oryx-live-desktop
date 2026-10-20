// @vitest-environment jsdom
import { cleanup, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { expect, it } from "vitest";
import { chooseAction } from "../../../test/menu";
import { open, writes, statusAsked, future } from "./order-test-fixtures";

it("finalises a foreign order: insurance and freight are required and the total is worked out", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders", ["CanViewForeignPurchaseOrder", "CanCreateForeignPurchaseOrder"]);
  await chooseAction("Actions for PO-0009", "Finalise order");
  expect(statusAsked(calls)).toBe("3");
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("PFI-778")).toBeTruthy();
  await user.click(within(dialog).getByRole("button", { name: "Finalise order" }));
  expect(await within(dialog).findByText("Enter the insurance")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.type(within(dialog).getByRole("spinbutton", { name: /Insurance/ }), "150");
  await user.type(within(dialog).getByRole("spinbutton", { name: /Freight/ }), "800");
  // 300 + 100 of lines, plus 150 and 800.
  expect(await within(dialog).findByText("$ 1,350.00")).toBeTruthy();
  expect(within(dialog).getByText("One thousand three hundred and fifty US Dollar only")).toBeTruthy();
  await user.click(within(dialog).getByRole("button", { name: "Finalise order" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls)).toEqual([{ method: "PUT", path: "/api/v1/procurement/purchase-order/po1", search: "", body: { totalFobValue: 400, totalCifValue: 1_350, seaFreight: 800, insurance: 150,
    amountInFigures: "One thousand three hundred and fifty US Dollar only" } }]);
}, 20_000);

it("finalises a local order with no tax at all", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders?type=1", ["CanViewLocalPurchaseOrder", "CanCreateLocalPurchaseOrder"]);
  await chooseAction("Actions for PO-0009", "Finalise order");
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).queryByRole("spinbutton", { name: /Insurance/ })).toBeNull();
  await user.click(within(dialog).getByRole("button", { name: "Finalise order" }));
  await waitFor(() => expect(writes(calls)).toHaveLength(1));
  expect(writes(calls)[0]?.body).toMatchObject({ totalFobValue: 400, totalCifValue: 400, seaFreight: 0, insurance: 0 });
}, 20_000);

it("marks an order as checked only with the check permission", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders/check", ["CanViewForeignPurchaseOrder", "CanCheckForeignPurchaseOrder"]);
  await chooseAction("Actions for PO-0009", "Review and check");
  expect(statusAsked(calls)).toBe("4");
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("Total CIF value")).toBeTruthy();
  expect(within(dialog).getByText("$ 1,350.00")).toBeTruthy();
  await user.click(within(dialog).getByRole("button", { name: "Mark as checked" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(writes(calls).map((call) => `${call.method} ${call.path}`)).toEqual(["PUT /api/v1/procurement/purchase-order/check/po1"]);
  cleanup();
  // Someone who may finalise orders is not thereby allowed to check them.
  open("/procurement/purchase-orders/check", ["CanViewForeignPurchaseOrder", "CanCreateForeignPurchaseOrder"]);
  await screen.findByText("PO-0009");
  expect(screen.queryByRole("button", { name: "Actions for PO-0009" })).toBeNull();
});

it("sends an approved order with the delivery date from the proforma invoice offered", async () => {
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders/approved", ["CanViewApprovedForeignPurchaseOrder", "CanSendApprovedForeignPurchaseOrder"]);
  await chooseAction("Actions for PO-0009", "Review and send");
  expect(statusAsked(calls)).toBe("6");
  const dialog = await screen.findByRole("dialog");
  expect(writes(calls)).toEqual([]);
  await user.click(within(dialog).getByRole("button", { name: "Send order by email" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  const sent = writes(calls)[0];
  expect(`${sent?.method} ${sent?.path}`).toBe("POST /api/v1/procurement/purchase-order/po1");
  expect((sent?.body as { expectedDeliveryDate: string }).expectedDeliveryDate.slice(0, 10)).toBe(new Date(new Date(future).getFullYear(), new Date(future).getMonth(), new Date(future).getDate()).toLocaleDateString("en-CA"));
});

it("warns that a failed send may still have recorded the order as sent", async () => {
  const user = userEvent.setup();
  open("/procurement/purchase-orders/approved", ["CanViewApprovedForeignPurchaseOrder", "CanSendApprovedForeignPurchaseOrder"], { sendStatus: 400 });
  await chooseAction("Actions for PO-0009", "Review and send");
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Send order by email" }));
  expect(await within(dialog).findByText(/The mail server refused the message\. The order may already be recorded as sent/)).toBeTruthy();
});

it("lists every order with its stage, filters by status, and opens one with its history", async () => {
  const user = userEvent.setup();
  const { calls, router } = open("/procurement/purchase-order-lists", ["CanViewForeignPurchaseOrder"]);
  const row = (await screen.findByText("PO-0009")).closest("tr") as HTMLElement;
  expect(statusAsked(calls)).toBeNull();
  expect(within(row).getByText("Sent to supplier")).toBeTruthy();
  expect(within(row).getByText("$ 1,350.00")).toBeTruthy();
  await user.click(screen.getByRole("combobox", { name: "Status" }));
  await user.click(await screen.findByRole("option", { name: "Awaiting check" }));
  await waitFor(() => expect(router.state.location.search).toContain("status=4"));
  await user.click((await screen.findByText("PO-0009")).closest("tr") as HTMLElement);
  await waitFor(() => expect(router.state.location.pathname).toBe("/procurement/purchase-orders/po1"));
  expect(await screen.findByText("Revision 1")).toBeTruthy();
  await user.click(screen.getByRole("tab", { name: "Revisions (1)" }));
  const change = (await screen.findByText("Line changed")).closest("tr") as HTMLElement;
  expect(within(change).getByText("20 kg at $ 11 / kg")).toBeTruthy();
  expect(within(change).getByText("25 kg at $ 12 / kg")).toBeTruthy();
  await user.click(screen.getByRole("tab", { name: "Attachments (1)" }));
  expect(screen.queryByRole("link", { name: "pfi-778.pdf" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "pfi-778.pdf" }));
  expect(await screen.findByRole("dialog", { name: "pfi-778.pdf" })).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Open original" })).toBeNull();
}, 20_000);

it("refuses an order of a supplier type the user may not see, whatever the address says", async () => {
  open("/procurement/purchase-orders/po1?type=0", ["CanViewForeignPurchaseOrder"], { type: 1 });
  expect(await screen.findByText("You don't have access to this page")).toBeTruthy();
});

it("revises a sent order: only changed lines are sent, after confirming what changes", async () => {
  const user = userEvent.setup();
  const { calls, router } = open("/procurement/purchase-orders/po1", ["CanViewForeignPurchaseOrder", "CanReviseForeignPurchaseOrder"]);
  await user.click(await screen.findByRole("link", { name: "Revise order" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/procurement/purchase-orders/po1/revise"));
  const quantity = await screen.findByRole("textbox", { name: "Quantity of Maize starch" });
  expect((quantity as HTMLInputElement).value).toBe("25");
  await user.click(screen.getByRole("button", { name: "Review changes" }));
  expect(await screen.findByText("Nothing has been changed")).toBeTruthy();
  await user.clear(quantity);
  await user.type(quantity, "30");
  await user.click(screen.getByRole("button", { name: "Remove Blister film" }));
  await user.click(screen.getByRole("button", { name: "Review changes (2)" }));
  const confirm = await screen.findByRole("dialog");
  expect(within(confirm).getByText(/Maize starch: 30 kg at \$ 12 \/ kg; Blister film: removed from the order/)).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.click(within(confirm).getByRole("button", { name: "Save revision" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/procurement/purchase-orders/po1"));
  expect(writes(calls)).toMatchObject([{ method: "PUT", path: "/api/v1/procurement/purchase-order/po1/revise", body: [
    { type: 3, purchaseOrderItemId: "l1", uoMId: "u-mg", quantity: 30_000_000, price: 12, priceUoM: "kg" }, { type: 4, purchaseOrderItemId: "l2" }] }]);
}, 20_000);

it("does not offer revision without its permission, even by address, and lists revised orders to be checked again", async () => {
  open("/procurement/purchase-orders/po1", ["CanViewForeignPurchaseOrder"]);
  await screen.findByText("Revision 1");
  expect(screen.queryByRole("link", { name: "Revise order" })).toBeNull();
  cleanup();
  open("/procurement/purchase-orders/po1/revise", ["CanViewForeignPurchaseOrder"]);
  expect(await screen.findByText("You don't have access to this page")).toBeTruthy();
  cleanup();
  const user = userEvent.setup();
  const { calls } = open("/procurement/purchase-orders/check", ["CanViewForeignPurchaseOrder", "CanCheckForeignPurchaseOrder"]);
  await screen.findByText("PO-0009");
  await user.click(screen.getByRole("button", { name: "Revised" }));
  await waitFor(() => expect(calls.some((call) => call.path === "/api/v1/procurement/purchase-order" && new URLSearchParams(call.search).get("status") === "10")).toBe(true));
});
