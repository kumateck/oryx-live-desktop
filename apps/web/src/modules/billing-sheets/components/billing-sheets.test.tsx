// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import EditBillingSheetPage from "../../../pages/(workspace)/logistics/billing-sheets/[id]/edit/page";
import BillingSheetPage from "../../../pages/(workspace)/logistics/billing-sheets/[id]/page";
import CreateBillingSheetPage from "../../../pages/(workspace)/logistics/billing-sheets/create/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { changeBlock, chargeState, chargeTotals, daysBetween, deleteBlock, detailsRequest, freeDays, freeTime, isPayable, paymentBlock } from "../lib/billing-rules";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(async () => {
  cleanup();
  // Radix restores focus on a deferred task after a dialog unmounts. Finish it in this DOM realm.
  await new Promise<void>((resolve) => setTimeout(resolve, 0));
  forgetSession();
});

it("works out free time from the arrival date, and what a sheet allows from its charges", () => {
  const time = freeTime(new Date(2026, 9, 28), 14);
  expect([time?.expiry.getMonth(), time?.expiry.getDate(), time?.demurrageStart.getDate()]).toEqual([10, 11, 12]);
  expect(freeTime(new Date(2026, 9, 28), 1.5)).toBeNull();
  expect(freeTime(null, 3)).toBeNull();
  expect([freeDays("14 days"), freeDays("7"), freeDays("two weeks")]).toEqual([14, 7, null]);
  expect(daysBetween("2026-10-01T00:00:00Z", "2026-10-15T00:00:00Z")).toBe(14);
  const request = detailsRequest({ code: " BS-1 ", billOfLading: "BL-9", arrival: new Date(2026, 9, 28), freeDays: 1, containerNumber: "C-1", packages: 40, packageStyleId: null, packageDescription: " " }, "inv", "sup");
  expect(request).toMatchObject({ code: "BS-1", invoiceId: "inv", supplierId: "sup", expectedArrivalDate: "2026-10-28T00:00:00.000Z", freeTimeExpiryDate: "2026-10-29T00:00:00.000Z", demurrageStartDate: "2026-10-30T00:00:00.000Z",
    freeTimeDuration: "1 day", numberOfPackages: "40", packageDescription: null });

  const charge = (paid: boolean, paymentStatus: number | null, amount = 100, currencyId: string | null = "usd") => ({ paid, paymentStatus, amount, currencyId, currency: currencyId });
  expect([chargeState(charge(false, null)), chargeState(charge(false, 0)), chargeState(charge(true, 1)), chargeState(charge(false, 2))]).toEqual(["unpaid", "awaiting", "paid", "rejected"]);
  expect([isPayable(charge(false, null)), isPayable(charge(false, 2)), isPayable(charge(false, 0)), isPayable(charge(false, null, 0)), isPayable(charge(false, null, 5, null))]).toEqual([true, true, false, false, false]);
  expect(changeBlock({ approved: false, status: 0, charges: [] })).toContain("waiting for approval");
  expect(changeBlock({ approved: true, status: 0, charges: [] })).toBeNull();
  expect(paymentBlock({ approved: false, status: 0, charges: [charge(false, null)] })).toContain("approved");
  expect(paymentBlock({ approved: true, status: 0, charges: [charge(true, 1)] })).toBe("No charge is waiting for a payment.");
  expect(deleteBlock({ approved: true, status: 0, charges: [charge(false, 0)] })).toContain("cannot be deleted");
  expect(deleteBlock({ approved: true, status: 0, charges: [charge(false, 2)] })).toBeNull();
  expect(chargeTotals([{ amount: 10, currency: "$" }, { amount: 5, currency: "GH₵" }, { amount: 2.5, currency: "$" }])).toEqual([{ currency: "$", total: 12.5 }, { currency: "GH₵", total: 5 }]);
});

const supplier = { id: "s0", name: "Acme Chemicals", type: 0, currency: { id: "usd", symbol: "$", name: "US Dollar" } };
const invoice = (id: string) => ({ id, code: id.toUpperCase(), supplier, items: [{ id: `${id}-i`, material: { name: "Maize starch" }, uoM: { symbol: "mg" }, purchaseOrder: { code: "PO-1" }, receivedQuantity: 8_000_000, expectedQuantity: 8_000_000, price: 12, priceUoM: "kg" }] });
const shipment = (id: string, invoiceId: string, extra: object = {}) => ({ id, code: id.toUpperCase(), status: 1, shipmentInvoice: invoice(invoiceId), attachments: [], ...extra });
const sheet = (extra: object = {}) => ({ id: "bs-1", code: "BS-1", billOfLading: "BL-77", status: 0, approved: true, supplier, invoice: { ...invoice("inv-a"), supplier: null }, expectedArrivalDate: "2026-10-28T00:00:00Z",
  freeTimeExpiryDate: "2026-11-11T00:00:00Z", freeTimeDuration: "14 days", demurrageStartDate: "2026-11-12T00:00:00Z", containerNumber: "MSKU-1", numberOfPackages: "40", packageDescription: "Drums on pallets",
  containerPackageStyle: { id: "ps-1", name: "Pallet" }, attachments: [],
  charges: [{ id: "c-1", charge: { name: "Port handling" }, currency: { id: "usd", symbol: "$" }, amount: 500, paid: false, paymentStatus: null },
    { id: "c-2", charge: { name: "Customs duty" }, currency: { id: "usd", symbol: "$" }, amount: 1200, paid: false, paymentStatus: null },
    { id: "c-3", charge: { name: "Scanning" }, currency: { id: "usd", symbol: "$" }, amount: 80, paid: true, paymentStatus: 1 }], ...extra });
interface Call { method: string; path: string; body: unknown }

function open(address: string, permissions: string[], record: object = sheet()) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    const text = input.method === "GET" ? "" : await input.clone().text();
    calls.push({ method: input.method, path, body: text ? JSON.parse(text) as unknown : null });
    if (path === "/api/v1/procurement/shipment-document") return Response.json({ data: [shipment("sd-1", "inv-a"), shipment("sd-2", "inv-b", { hasBillingSheet: true }), shipment("sd-3", "inv-c", { status: 2 })], pageIndex: 1, pageCount: 1, totalRecordCount: 3 });
    if (path === "/api/v1/collection") return Response.json({ Charge: [{ id: "ch-1", name: "Port handling" }, { id: "ch-2", name: "Customs duty" }], Currency: [{ id: "usd", name: "US Dollar", symbol: "$" }, { id: "ghs", name: "Ghana Cedi", symbol: "GH₵" }], PackageStyle: [{ id: "ps-1", name: "Pallet" }] });
    if (path === "/api/v1/configuration/by-model-type/BillingSheet") return Response.json({ prefix: "BS-", namingType: 0, minimumNameLength: 4, maximumNameLength: 6 });
    if (path === "/api/v1/configuration/BillingSheet/count") return Response.json({ detail: "Invalid model type sent" }, { status: 400 });
    if (path.startsWith("/api/v1/configuration/")) return Response.json(4);
    if (path === "/api/v1/procurement/billing-sheet") return input.method === "GET"
      ? Response.json({ data: [], pageIndex: 1, pageCount: 1, totalRecordCount: 4 }) : Response.json("bs-9", { status: 201 });
    if (path === "/api/v1/procurement/billing-sheet/charge") return Response.json({ paidChargeIds: [], pendingChargeIds: ["c-1"] });
    if (path.startsWith("/api/v1/procurement/billing-sheet/")) return input.method === "GET" ? Response.json(record) : new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([
    { path: "/logistics/billing-sheets", element: <p>All sheets</p> }, { path: "/logistics/billing-sheets/create", element: <CreateBillingSheetPage /> },
    { path: "/logistics/billing-sheets/:id", element: <BillingSheetPage /> }, { path: "/logistics/billing-sheets/:id/edit", element: <EditBillingSheetPage /> },
  ], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}
const secondField = (fields: HTMLElement[]) => { const field = fields[1]; if (!field) throw new Error("Missing second charge row"); return field; };
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET" && call.path !== "/api/v1/collection");

it("creates a sheet for the invoice in the address, with dates worked out and the supplier's currency on its charges", async () => {
  const user = userEvent.setup();
  const { calls, router } = open("/logistics/billing-sheets/create?invoiceId=inv-a", ["CanViewBillingSheet", "CanCreateBillingSheet"]);
  // Only the shipment that is not cleared and has no sheet is offered, and it is already chosen.
  expect(await screen.findByText("Acme Chemicals")).toBeTruthy();
  await waitFor(() => expect((screen.getByRole("textbox", { name: /Billing sheet number/ }) as HTMLInputElement).value).toMatch(/^BS-/));
  await user.click(screen.getByRole("button", { name: "Create billing sheet" }));
  expect(await screen.findByText("Enter the bill of lading number")).toBeTruthy();
  expect(screen.getByText("Choose the charge")).toBeTruthy();
  expect(writes(calls)).toEqual([]);

  await user.type(screen.getByRole("textbox", { name: /Bill of lading/ }), "BL-77");
  await user.type(screen.getByRole("spinbutton", { name: /Free time/ }), "14");
  await user.type(screen.getByRole("textbox", { name: /Container number/ }), "MSKU-1");
  await user.type(screen.getByRole("spinbutton", { name: /Number of packages/ }), "40");
  await user.click(screen.getByRole("combobox", { name: /^Charge/ }));
  await user.click(await screen.findByRole("option", { name: "Port handling" }));
  await user.type(screen.getByRole("spinbutton", { name: /Amount/ }), "500.5");
  // The currency was filled from the supplier.
  await waitFor(() => expect(screen.getByRole("combobox", { name: /Currency/ }).textContent).toContain("US Dollar"));
  await user.click(screen.getByRole("button", { name: "Add charge" }));
  expect(screen.getAllByRole("combobox", { name: /Currency/ })).toHaveLength(1);
  await user.click(secondField(screen.getAllByRole("combobox", { name: /^Charge/ })));
  expect(screen.queryByRole("option", { name: "Port handling" })).toBeNull();
  await user.click(await screen.findByRole("option", { name: "Customs duty" }));
  await user.type(secondField(screen.getAllByRole("spinbutton", { name: /Amount/ })), "75");
  await user.click(screen.getByRole("combobox", { name: /Currency/ }));
  await user.click(await screen.findByRole("option", { name: /Ghana Cedi/ }));
  await user.click(screen.getByRole("button", { name: /Expected arrival/ }));
  await user.click((await screen.findAllByRole("gridcell")).find((cell) => cell.textContent === "15")!.querySelector("button") ?? (await screen.findAllByRole("gridcell")).find((cell) => cell.textContent === "15")!);
  expect(await screen.findByText(/Free time ends on/)).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Create billing sheet" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/logistics/billing-sheets/bs-9"));
  expect(writes(calls)).toHaveLength(1);
  const body = writes(calls)[0]?.body as { expectedArrivalDate: string; freeTimeExpiryDate: string; demurrageStartDate: string };
  expect(calls.some((call) => call.path === "/api/v1/configuration/BillingSheet/count")).toBe(false);
  expect(body).toMatchObject({ code: "BS-0005", billOfLading: "BL-77", invoiceId: "inv-a", supplierId: "s0", freeTimeDuration: "14 days", containerNumber: "MSKU-1", numberOfPackages: "40", containerPackageStyleId: null,
    charges: [{ chargeId: "ch-1", currencyId: "ghs", amount: 500.5 }, { chargeId: "ch-2", currencyId: "ghs", amount: 75 }] });
  const days = (to: string) => Math.round((new Date(to).getTime() - new Date(body.expectedArrivalDate).getTime()) / 86_400_000);
  expect([days(body.freeTimeExpiryDate), days(body.demurrageStartDate)]).toEqual([14, 15]);
}, 40_000);

it("holds a sheet that is waiting for approval: no edit, no charges, no payment", async () => {
  open("/logistics/billing-sheets/bs-1", ["CanViewBillingSheet", "CanEditBillingSheet", "CanDeleteBillingSheet", "CanRecordPayment"], sheet({ approved: false }));
  expect(await screen.findByText(/waiting for approval. Until it is approved/)).toBeTruthy();
  expect((screen.getByRole("button", { name: "Edit" }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("button", { name: "Add charges" }) as HTMLButtonElement).disabled).toBe(true);
  expect((screen.getByRole("button", { name: "Record payment" }) as HTMLButtonElement).disabled).toBe(true);
  // A charge is already paid, so the sheet is kept.
  expect((screen.getByRole("button", { name: "Delete" }) as HTMLButtonElement).disabled).toBe(true);
  cleanup();
  open("/logistics/billing-sheets/bs-1", ["CanViewBillingSheet"]);
  await screen.findByText("Port handling");
  expect(screen.queryByRole("button", { name: "Record payment" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Add charges" })).toBeNull();
});

it("records a payment only for ticked unpaid charges, each with its own reference", async () => {
  const user = userEvent.setup();
  const { calls } = open("/logistics/billing-sheets/bs-1", ["CanViewBillingSheet", "CanRecordPayment"]);
  await user.click(await screen.findByRole("button", { name: "Record payment" }));
  const dialog = await screen.findByRole("dialog");
  // The paid charge is not offered.
  expect(await within(dialog).findAllByRole("checkbox")).toHaveLength(2);
  await user.click(within(dialog).getByRole("button", { name: "Record payment" }));
  expect(await within(dialog).findByText("Tick at least one charge to pay")).toBeTruthy();
  await user.click(within(dialog).getByRole("checkbox", { name: /Pay Port handling/ }));
  await user.click(within(dialog).getByRole("checkbox", { name: /Pay Customs duty/ }));
  expect(within(dialog).getByRole("status").textContent).toContain("1,700");
  await user.type(within(dialog).getByRole("textbox", { name: /Reference for Port handling/ }), "TRX-1");
  await user.type(within(dialog).getByRole("textbox", { name: /Reference for Customs duty/ }), "trx-1");
  await user.click(within(dialog).getByRole("combobox", { name: /Paid by/ }));
  await user.click(await screen.findByRole("option", { name: "Cheque" }));
  await user.click(within(dialog).getByRole("button", { name: "Record payment" }));
  expect(await within(dialog).findByText("Each payment needs its own reference")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.click(within(dialog).getByRole("checkbox", { name: /Pay Customs duty/ }));
  await user.click(within(dialog).getByRole("button", { name: "Record payment" }));
  await waitFor(() => expect(writes(calls)).toHaveLength(1));
  expect(writes(calls)[0]).toMatchObject({ method: "PUT", path: "/api/v1/procurement/billing-sheet/charge", body: { method: 1, charges: [{ billingSheetChargeId: "c-1", reference: "TRX-1", notes: null }] } });
}, 40_000);

it("saves an edit with the invoice and supplier the sheet already has", async () => {
  const user = userEvent.setup();
  const { calls, router } = open("/logistics/billing-sheets/bs-1/edit", ["CanViewBillingSheet", "CanEditBillingSheet"]);
  const container = await screen.findByRole("textbox", { name: /Container number/ });
  expect((screen.getByRole("spinbutton", { name: /Free time/ }) as HTMLInputElement).value).toBe("14");
  await user.clear(container);
  await user.type(container, "MSKU-2");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/logistics/billing-sheets/bs-1"));
  expect(writes(calls)).toHaveLength(1);
  expect(writes(calls)[0]).toMatchObject({ method: "PUT", path: "/api/v1/procurement/billing-sheet/bs-1", body: { code: "BS-1", billOfLading: "BL-77", invoiceId: "inv-a", supplierId: "s0", containerNumber: "MSKU-2",
    expectedArrivalDate: "2026-10-28T00:00:00.000Z", freeTimeExpiryDate: "2026-11-11T00:00:00.000Z", demurrageStartDate: "2026-11-12T00:00:00.000Z", freeTimeDuration: "14 days", numberOfPackages: "40", containerPackageStyleId: "ps-1", packageDescription: "Drums on pallets" } });
}, 30_000);

it("adds a batch of charges with one currency and no repeated selection", async () => {
  const user = userEvent.setup();
  const { calls } = open("/logistics/billing-sheets/bs-1", ["CanViewBillingSheet", "CanEditBillingSheet"], sheet({ charges: [] }));
  await user.click(await screen.findByRole("button", { name: "Add charges" }));
  const dialog = await screen.findByRole("dialog");
  await waitFor(() => expect(within(dialog).getByRole("combobox", { name: /Currency/ }).textContent).toContain("US Dollar"));
  await user.click(within(dialog).getByRole("combobox", { name: /^Charge/ }));
  await user.click(await screen.findByRole("option", { name: "Port handling" }));
  await user.type(within(dialog).getByRole("spinbutton", { name: /Amount/ }), "12");
  await user.click(within(dialog).getByRole("button", { name: "Add charge" }));
  await user.click(secondField(within(dialog).getAllByRole("combobox", { name: /^Charge/ })));
  expect(screen.queryByRole("option", { name: "Port handling" })).toBeNull();
  await user.click(await screen.findByRole("option", { name: "Customs duty" }));
  await user.type(secondField(within(dialog).getAllByRole("spinbutton", { name: /Amount/ })), "30");
  expect(within(dialog).getAllByRole("combobox", { name: /Currency/ })).toHaveLength(1);
  await user.click(within(dialog).getByRole("button", { name: "Add charges" }));
  await waitFor(() => expect(writes(calls)).toHaveLength(1));
  expect(writes(calls)[0]).toMatchObject({ method: "POST", path: "/api/v1/procurement/billing-sheet/charge/bs-1",
    body: [{ chargeId: "ch-1", currencyId: "usd", amount: 12 }, { chargeId: "ch-2", currencyId: "usd", amount: 30 }] });
});
