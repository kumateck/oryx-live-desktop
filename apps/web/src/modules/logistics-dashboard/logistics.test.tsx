// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import LogisticsDashboardRoute from "../../pages/(workspace)/logistics-dashboard/page";
import ShipmentDocumentPage from "../../pages/(workspace)/logistics/shipment-documents/[id]/details/page";
import ShipmentInvoicePage from "../../pages/(workspace)/logistics/shipment-invoices/[id]/page";
import DistributionPage from "../../pages/(workspace)/procurement/material-distribution/[id]/details/page";
import AvailableStockRoute from "../../pages/(workspace)/stock/available/page";
import { ApiProvider } from "../../shared/api/api-provider";
import { SessionProvider } from "../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { grandTotal, paidTotals } from "../billing-sheets/lib/billing-rules";
import { deliveryProgress, sectionProgress, supplyChain } from "../material-distribution/lib/distribution";
import { distributionSchema } from "../material-distribution/schemas/distribution-schema";
import { shipmentProgress } from "../shipment-documents/lib/shipment-kinds";
import { linesByOrder, linesQuantity, linesValue } from "../shipment-invoices/lib/invoice-totals";
import { invoiceSchema } from "../shipment-invoices/schemas/invoice-schema";
import { demurrageDays, longestOnDemurrage, periodRange } from "./dashboard";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

const supplier = { id: "s1", name: "Acme Pharma", email: "sales@acme.test", contactPerson: "Kofi Mensah", contactNumber: "+233 20 000 0000", address: "12 Harbour Road, Tema", type: 0, country: { name: "India", code: "IN" }, currency: { id: "c1", symbol: "USD", name: "US dollar" } };
const item = (id: string, order: string, received: number, expected: number, extra: object = {}) => ({ id, expectedQuantity: expected, receivedQuantity: received, price: 2, priceUoM: "kg", reason: received < expected ? "Short shipped" : "N/A",
  material: { name: `Material ${id}`, code: id.toUpperCase(), pharmacopoeia: "BP", specification: { specificationNumber: `SPC-${id}` } }, uoM: { symbol: "mg" }, manufacturer: { name: "Zeta Labs" }, purchaseOrder: { id: order, code: order }, ...extra });
const invoice = { id: "inv-1", code: "INV-77", createdAt: "2026-09-20T10:00:00Z", supplier, isUsed: true, currency: { symbol: "USD" }, items: [item("m1", "PO-1", 50_000_000, 50_000_000), item("m2", "PO-1", 20_000_000, 30_000_000), item("m3", "PO-2", 5_000, 5_000, { uoM: { symbol: "ml" }, priceUoM: "L", price: 10 })] };
const sheet = { id: "bs-1", code: "BS-9", billOfLading: "BL-555", status: 1, approved: true, expectedArrivalDate: "2026-09-25T00:00:00Z", freeTimeExpiryDate: "2026-10-09T00:00:00Z", freeTimeDuration: "14 days", demurrageStartDate: "2026-10-10T00:00:00Z",
  containerNumber: "MSKU1234567", numberOfPackages: "40", containerPackageStyle: { id: "ps", name: "Cartons" }, supplier, invoice,
  charges: [{ id: "ch1", charge: { name: "Port handling" }, currency: { id: "c1", symbol: "USD" }, amount: 300, paid: true, paymentStatus: 1 }, { id: "ch2", charge: { name: "Demurrage" }, currency: { id: "c1", symbol: "USD" }, amount: 200, paid: false, paymentStatus: null }] };
const shipment = { id: "sd-1", code: "SD-0001", status: 1, type: 0, createdAt: "2026-09-21T08:00:00Z", atPortAt: "2026-09-25T09:30:00Z", hasBillingSheet: true, hasApprovedBillingSheet: true, approved: false,
  createdBy: { firstName: "Ama", lastName: "Owusu", department: { name: "Logistics" } }, attachments: [{ id: "f1", name: "packing-list.pdf", link: "https://files.test/packing-list.pdf" }, { id: "f2", name: "seal.jpg", link: "https://files.test/seal.jpg" }], shipmentInvoice: invoice };
const distribution = { sections: [{ material: { id: "m1", name: "Maize starch", code: "RM-1", kind: 0 }, totalQuantity: 50_000_000, uoM: { symbol: "mg" },
  items: [{ department: { id: "d1", name: "Production", code: "PRD" }, requisitionItem: { id: "ri-1", status: 2, quantity: 40_000_000, uoM: { symbol: "mg" } }, quantityRequested: 40_000_000, quantityAllocated: 40_000_000, quantityRemaining: 0,
    distributions: [{ quantity: 40_000_000, shipmentInvoiceItem: { expectedQuantity: 50_000_000, receivedQuantity: 50_000_000, price: 2, priceUoM: "kg", uoM: { symbol: "mg" }, material: { code: "RM-1" }, manufacturer: { name: "Zeta Labs" }, purchaseOrder: { code: "PO-1" }, currency: { symbol: "USD" } } }] },
    { department: { id: "d2", name: "Research", code: "RND" }, requisitionItem: { id: "ri-2", status: 1, quantity: 20_000_000, uoM: { symbol: "mg" } }, quantityRequested: 20_000_000, quantityAllocated: 10_000_000, quantityRemaining: 10_000_000, distributions: [] }] }] };

it("adds up invoice lines, charges, distribution and demurrage without mixing units or currencies", () => {
  const parsed = invoiceSchema.parse(invoice)!;
  // 70 kg at 2 per kg and 5 L at 10 per L: the weights are added together, the volume stands apart.
  expect([linesValue(parsed.items), linesQuantity(parsed.items)]).toEqual([190, "70 kg + 5 L"]);
  expect(linesByOrder(parsed.items).map((group) => [group.order, group.lines.length])).toEqual([["PO-1", 2], ["PO-2", 1]]);
  expect(parsed.items[1]).toMatchObject({ cost: 40, expectedCost: 60, reason: "Short shipped", pharmacopoeia: "BP", specification: "SPC-m2" });
  expect(parsed.items[0]?.reason).toBeNull();
  const charges = [{ amount: 300, currency: "USD", paid: true, paymentStatus: 1 }, { amount: 200, currency: "USD", paid: false, paymentStatus: 0 }];
  expect(grandTotal(190, "USD", charges)).toEqual({ currency: "USD", total: 690 });
  // Charges in another currency are never added to the invoice.
  expect(grandTotal(190, "USD", [{ amount: 300, currency: "GHS" }])).toBeNull();
  expect(grandTotal(null, "USD", charges)).toBeNull();
  // A payment still waiting for approval has not been paid.
  expect(paidTotals(charges)).toEqual([{ currency: "USD", total: 500, paid: 300, outstanding: 200 }]);
  expect([shipmentProgress("shipment", 1), shipmentProgress("waybill", 3), shipmentProgress("shipment", 4)]).toEqual([{ done: 2, of: 5, percent: 40 }, { done: 2, of: 3, percent: 67 }, { done: 5, of: 5, percent: 100 }]);
  const sections = distributionSchema.parse(distribution);
  expect(sectionProgress(sections[0]!)).toEqual({ requested: 60_000_000, allocated: 50_000_000, remaining: 10_000_000, percent: 83 });
  expect(deliveryProgress(sections)).toEqual({ complete: 0, of: 1, percent: 0 });
  expect(supplyChain(sections[0]!)).toMatchObject({ manufacturers: ["Zeta Labs"], orders: ["PO-1"], averagePrice: 2, currency: "USD", priceUnit: "kg" });
  const now = new Date(2026, 9, 14, 12);
  expect([demurrageDays("2026-10-10T00:00:00", now), demurrageDays("2026-10-20T00:00:00", now), demurrageDays(null, now)]).toEqual([4, 0, 0]);
  expect(longestOnDemurrage([{ demurrageStarts: "2026-10-12T00:00:00" }, { demurrageStarts: null }, { demurrageStarts: "2026-10-01T00:00:00" }], now).map((row) => row.days)).toEqual([13, 2]);
  // Wednesday 14 October 2026: the week starts on Monday the 12th.
  expect([new Date(periodRange("week", now).startDate!).getDate(), new Date(periodRange("month", now).startDate!).getDate(), periodRange("all", now)]).toEqual([12, 1, {}]);
});

function open(address: string, permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: string[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push(`${input.method} ${url.pathname}${url.search}`);
    if (url.pathname === "/api/v1/procurement/shipment-document/sd-1") return Response.json(shipment);
    if (url.pathname === "/api/v1/procurement/billing-sheet/invoice/inv-1") return Response.json(sheet);
    if (url.pathname === "/api/v1/procurement/shipment-invoice/inv-1") return Response.json(invoice);
    if (url.pathname === "/api/v1/procurement/shipment-document/sd-1/material-distribution") return Response.json(distribution);
    if (url.pathname === "/api/v1/report/logistics") return Response.json({ numberOfInvoices: 12, numberOfPaidInvoices: 9, numberOfUnpaidInvoices: 3, numberOfShipments: 7, numberOfInTransitShipments: 2, numberOfNewShipments: 1, numberOfBillingSheets: 5, numberOfPendingBillingSheets: 4, numberOfPaidBillingSheets: 1, numberOfWaybills: 6 });
    if (url.pathname === "/api/v1/report/procurement-dashboard") return Response.json({ materialDistributionStatus: { pendingCount: 2, distributedCount: 8 } });
    if (url.pathname === "/api/v1/report/shipment-status-summary") return Response.json({ newCount: 1, atPortCount: 3, clearedCount: 0, inTransitCount: 2, arrivedCount: 1 });
    if (url.pathname === "/api/v1/report/shipment") return Response.json([{ supplierName: "Acme Pharma", billOfLadingNo: "BL-555", demurrageStarts: "2020-01-01T00:00:00Z", freeDays: "14 days" }]);
    if (url.pathname === "/api/v1/material/department/approved-materials") return Response.json({ data: [{ material: { id: "m1", code: "RM-1", name: "Maize starch", materialCategory: { name: "Excipient" } }, unitOfMeasure: { symbol: "mg", name: "Milligram" }, totalAvailableQuantity: 50_000_000, reservedQuantity: 20_000_000 }], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname === "/api/v1/department") return Response.json({ data: [{ id: "d1", name: "Production" }], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/logistics/shipment-documents/:id/details", element: <ShipmentDocumentPage /> }, { path: "/logistics/shipment-invoices/:id", element: <ShipmentInvoicePage /> },
    { path: "/procurement/material-distribution/:id/details", element: <DistributionPage /> }, { path: "/logistics-dashboard", element: <LogisticsDashboardRoute /> }, { path: "/stock/available", element: <AvailableStockRoute /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

it("shows a shipment with its supplier, timeline, billing sheet, costed lines and papers, and prints its charges", async () => {
  const user = userEvent.setup();
  const calls = open("/logistics/shipment-documents/sd-1/details", ["CanViewShipmentDocument", "CanViewBillingSheet", "CanRecordPayment"]);
  expect(await screen.findByText("12 Harbour Road, Tema")).toBeTruthy();
  expect(screen.getByText("India (IN)")).toBeTruthy();
  const timeline = screen.getByRole("region", { name: "Timeline" });
  expect(within(timeline).getByText("40%")).toBeTruthy();
  expect(within(timeline).getAllByRole("listitem")).toHaveLength(5);
  const billing = await screen.findByRole("region", { name: "Billing sheet" });
  expect(within(billing).getByText("BL-555")).toBeTruthy();
  expect(within(billing).getByText("Demurrage")).toBeTruthy();
  // 190 invoiced and 500 of charges, in one currency.
  expect(within(billing).getByText("USD 690.00")).toBeTruthy();
  expect(screen.getByText("Short shipped")).toBeTruthy();
  expect(screen.getByText("3 materials · total", { exact: false }).textContent).toContain("USD 190.00");
  expect(screen.getByRole("button", { name: "View packing-list.pdf" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Pay charges" })).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Print charges" }));
  const note = await screen.findByRole("dialog");
  expect(within(note).getByText("USD 200.00", { selector: "strong" })).toBeTruthy();
  expect(within(note).getByText(/Free time ended on/)).toBeTruthy();
  expect(calls.filter((call) => !call.startsWith("GET"))).toEqual([]);
}, 20_000);

it("groups an invoice by purchase order with its totals", async () => {
  open("/logistics/shipment-invoices/inv-1", ["CanViewShipmentInvoice"]);
  const first = await screen.findByRole("region", { name: "Purchase order PO-1" });
  expect(within(first).getByText("USD 140.00", { selector: "span.font-semibold.text-foreground" })).toBeTruthy();
  expect(screen.getByRole("region", { name: "Purchase order PO-2" })).toBeTruthy();
  expect(screen.getByText("70 kg + 5 L")).toBeTruthy();
  expect(screen.getByText("US dollar (USD)")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Print" })).toBeTruthy();
});

it("breaks a distributed material down by department and source", async () => {
  const user = userEvent.setup();
  open("/procurement/material-distribution/sd-1/details", ["CanViewMaterialDistribution"]);
  expect(await screen.findByText("83% allocated")).toBeTruthy();
  expect(screen.getByText("0 of 1 material fully allocated")).toBeTruthy();
  // Without the distribute permission there is only the view.
  expect(screen.queryByRole("button", { name: "Distribute Maize starch" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "View Maize starch" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("Research")).toBeTruthy();
  expect(within(dialog).getByText(/Request sourced · originally asked for 40 kg/)).toBeTruthy();
  expect(within(dialog).getByText("PO PO-1")).toBeTruthy();
  expect(within(dialog).getByText("Distribution sources (1)")).toBeTruthy();
});

it("shows the logistics figures and the stock that is free to issue", async () => {
  open("/logistics-dashboard", ["CanViewShipmentInvoice"]);
  expect((await screen.findByText("9 paid")).closest("a")?.getAttribute("href")).toBe("/logistics/shipment-invoices");
  expect(await screen.findByText("2 pending")).toBeTruthy();
  await waitFor(() => expect(within(screen.getByRole("region", { name: "Shipment stages" })).getByText("At port")).toBeTruthy());
  expect(await screen.findByText(/BL-555/)).toBeTruthy();
  cleanup();
  const calls = open("/stock/available", ["CanViewPackingMaterialStock"]);
  expect(await screen.findByText("Maize starch")).toBeTruthy();
  expect(screen.getByText("Excipient")).toBeTruthy();
  // 50 kg in stock less 20 kg reserved.
  expect(screen.getByText("30 kg")).toBeTruthy();
  // Only the kind the user may see is asked for.
  expect(calls.some((call) => call.includes("/approved-materials") && call.includes("kind=1"))).toBe(true);
  expect(calls.some((call) => call.includes("/approved-materials") && call.includes("kind=0"))).toBe(false);
});
