// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import ShipmentDocumentPage from "../../../pages/(workspace)/logistics/shipment-documents/[id]/details/page";
import CreateShipmentDocumentPage from "../../../pages/(workspace)/logistics/shipment-documents/create/page";
import ShipmentDocumentsPage from "../../../pages/(workspace)/logistics/shipment-documents/page";
import CreateWaybillPage from "../../../pages/(workspace)/logistics/waybill/create/page";
import WaybillsPage from "../../../pages/(workspace)/logistics/waybill/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { chooseAction, openMenu } from "../../../test/menu";
import { advanceBlock, nextStatus } from "../lib/shipment-kinds";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => { cleanup(); forgetSession(); });

it("takes a shipment through port and clearing, and a waybill straight to transit", () => {
  expect([0, 1, 2, 3, 4].map((status) => nextStatus("shipment", status as 0))).toEqual([1, 2, 3, 4, null]);
  expect([0, 3, 4].map((status) => nextStatus("waybill", status as 0))).toEqual([3, 4, null]);
  const at = (status: 0 | 1 | 4, hasBillingSheet = false, billingSheetApproved = false) => ({ status, hasBillingSheet, billingSheetApproved });
  expect(advanceBlock("shipment", at(0))).toBeNull();
  expect(advanceBlock("shipment", at(1))).toBe("Create the billing sheet for this shipment first.");
  expect(advanceBlock("shipment", at(1, true))).toBe("The billing sheet has to be approved before the shipment is cleared.");
  expect(advanceBlock("shipment", at(1, true, true))).toBeNull();
  expect(advanceBlock("waybill", at(0))).toBeNull();
  expect(advanceBlock("waybill", at(4))).toContain("no further stage");
});

const supplier = (type: number) => ({ id: `s${type}`, name: type ? "Local Chem" : "Acme Chemicals", type, currency: { symbol: "$" } });
const invoice = (id: string, type: number) => ({ id, code: id.toUpperCase(), supplier: supplier(type), items: [{ id: `${id}-i`, material: { name: "Maize starch" }, uoM: { symbol: "mg" }, purchaseOrder: { code: "PO-1" }, receivedQuantity: 8_000_000, expectedQuantity: 8_000_000, price: 12, priceUoM: "kg" }] });
const shipment = (id: string, status: number, extra: object = {}) => ({ id, code: id.toUpperCase(), status, createdAt: "2026-09-20T08:00:00Z", atPortAt: status >= 1 ? "2026-09-25T08:00:00Z" : null, shipmentInvoice: invoice("inv-a", 0), attachments: [], ...extra });
interface Call { method: string; path: string; body: unknown }

function open(address: string, permissions: string[], options: { uploadFails?: boolean; codeFailsOnce?: boolean } = {}) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  let uploads = 0;
  let codeCounts = 0;
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    const multipart = input.headers.get("content-type")?.includes("multipart") ?? false;
    const text = input.method === "GET" || multipart ? "" : await input.clone().text();
    calls.push({ method: input.method, path, body: multipart ? "files" : text ? JSON.parse(text) as unknown : null });
    if (path === "/api/v1/procurement/shipment-document") return input.method === "GET" ? Response.json({ data: [shipment("sd-1", 0), shipment("sd-2", 1), shipment("sd-3", 1, { hasBillingSheet: true, hasApprovedBillingSheet: true })], pageIndex: 1, pageCount: 1, totalRecordCount: 3 }) : Response.json("sd-9", { status: 201 });
    if (path === "/api/v1/procurement/waybill") return input.method === "GET" ? Response.json({ data: [{ ...shipment("wb-1", 0), shipmentInvoice: invoice("inv-l", 1) }], pageIndex: 1, pageCount: 1, totalRecordCount: 1 }) : Response.json("wb-9", { status: 201 });
    if (path === "/api/v1/procurement/shipment-document/sd-9") return Response.json(shipment("sd-9", 0));
    if (path === "/api/v1/procurement/shipment-invoice/unattached") return Response.json([invoice("inv-a", 0), invoice("inv-l", 1)]);
    if (path === "/api/v1/configuration/by-model-type/ShipmentDocument") return Response.json({ prefix: "SD-", namingType: 0, minimumNameLength: 4, maximumNameLength: 6 });
    if (path === "/api/v1/configuration/by-model-type/Waybill") return Response.json({ prefix: "WB", namingType: 0, minimumNameLength: 3, maximumNameLength: 3 });
    if (path.endsWith("/Waybill/count")) return Response.json({ description: "Invalid model type sent" }, { status: 400 });
    if (path.endsWith("/ShipmentDocument/count")) {
      codeCounts++;
      return options.codeFailsOnce && codeCounts === 1 ? Response.json({ description: "Invalid model type sent" }, { status: 400 }) : Response.json(new URL(input.url).searchParams.get("prefix") === "WB" ? 8 : 4);
    }
    if (path.startsWith("/api/v1/configuration/")) return Response.json(4);
    if (path === "/api/v1/file/ShipmentDocument/sd-9") { uploads += 1; return options.uploadFails && uploads === 1 ? Response.json({ errors: [{ code: "File", description: "The file store is unavailable." }] }, { status: 500 }) : new Response(null, { status: 200 }); }
    if (path.endsWith("/status")) return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([
    { path: "/logistics/shipment-documents", element: <ShipmentDocumentsPage /> }, { path: "/logistics/shipment-documents/create", element: <CreateShipmentDocumentPage /> },
    { path: "/logistics/shipment-documents/:id/details", element: <ShipmentDocumentPage /> }, { path: "/logistics/waybill", element: <WaybillsPage /> }, { path: "/logistics/waybill/create", element: <CreateWaybillPage /> },
  ], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET");

it("moves a shipment one stage at a time after confirming, and holds it at port until its billing sheet is approved", async () => {
  const user = userEvent.setup();
  const { calls } = open("/logistics/shipment-documents", ["CanViewShipmentDocument", "CanChangeShipmentDocumentStatus", "CanCreateBillingSheet"]);
  await screen.findByText("SD-1");
  await openMenu("Actions for SD-2");
  expect(screen.getByRole("menuitem", { name: /Mark as cleared/ }).textContent).toContain("Create the billing sheet for this shipment first.");
  expect(screen.getByRole("menuitem", { name: "Create billing sheet" }).getAttribute("href")).toBe("/logistics/billing-sheets/create?invoiceId=inv-a");
  await user.keyboard("{Escape}");
  await openMenu("Actions for SD-3");
  expect(screen.getByRole("menuitem", { name: "Mark as cleared" }).getAttribute("aria-disabled")).not.toBe("true");
  await user.keyboard("{Escape}");
  await chooseAction("Actions for SD-1", "Mark as at port");
  const confirm = await screen.findByRole("dialog");
  expect(writes(calls)).toEqual([]);
  await user.click(within(confirm).getByRole("button", { name: "Mark as at port" }));
  await waitFor(() => expect(writes(calls)).toHaveLength(1));
  expect(writes(calls)[0]).toEqual({ method: "PUT", path: "/api/v1/procurement/shipments/sd-1/status", body: { status: 1 } });
}, 20_000);

it("offers a viewer no stage change, and takes a waybill straight to in transit", async () => {
  open("/logistics/shipment-documents", ["CanViewShipmentDocument"]);
  await screen.findByText("SD-1");
  await openMenu("Actions for SD-1");
  expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["View"]);
  cleanup();
  open("/logistics/waybill", ["CanViewWaybill", "CanChangeWaybillStatus"]);
  await screen.findByText("WB-1");
  await openMenu("Actions for WB-1");
  expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual(["View", "Mark as in transit"]);
});

it("creates the document, then attaches its papers; a failed upload is retried without creating it twice", async () => {
  const user = userEvent.setup();
  const { calls, router } = open("/logistics/shipment-documents/create", ["CanViewShipmentDocument", "CanCreateShipmentDocument"], { uploadFails: true });
  await waitFor(() => expect((screen.getByRole("textbox", { name: /Document number/ }) as HTMLInputElement).value).toMatch(/^SD-/));
  await user.click(await screen.findByRole("combobox", { name: /Shipment invoice/ }));
  // Only foreign invoices go on a shipment document.
  expect((await screen.findAllByRole("option")).map((option) => option.textContent)).toEqual(["INV-A · Acme Chemicals"]);
  await user.click(screen.getByRole("option", { name: "INV-A · Acme Chemicals" }));
  expect(await screen.findByText("On invoice INV-A")).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Create shipment document" }));
  expect(await screen.findByText("Attach the shipping documents")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.upload(screen.getByLabelText(/Shipping documents/), new File(["bl"], "bill-of-lading.pdf", { type: "application/pdf" }));
  await user.click(screen.getByRole("button", { name: "Create shipment document" }));
  expect(await screen.findByText(/was created, but its documents could not be attached/)).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Attach documents" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/logistics/shipment-documents/sd-9/details"));
  expect(writes(calls).map((call) => `${call.method} ${call.path}`)).toEqual(["POST /api/v1/procurement/shipment-document", "POST /api/v1/file/ShipmentDocument/sd-9", "POST /api/v1/file/ShipmentDocument/sd-9"]);
  expect(writes(calls)[0]?.body).toMatchObject({ shipmentInvoiceId: "inv-a" });
}, 30_000);

it("waybill code generation uses its configured rule and recovers from a failed count without creating a document", async () => {
  const { calls } = open("/logistics/waybill/create", ["CanViewWaybill", "CanCreateWaybill"], { codeFailsOnce: true });
  await screen.findByText(/The document number could not be generated/);
  const number = screen.getByRole("textbox", { name: /Document number/ });
  expect((number as HTMLInputElement).value).toBe("");
  await userEvent.setup().click(screen.getByRole("button", { name: "Retry document number" }));
  await waitFor(() => expect((number as HTMLInputElement).value).toBe("WB009"));
  expect(calls.filter((call) => call.path.endsWith("/ShipmentDocument/count"))).toHaveLength(2);
  expect(calls.some((call) => call.path.endsWith("/Waybill/count"))).toBe(false);
  expect(writes(calls)).toHaveLength(0);
});
it("retrying a waybill code never overwrites a manual document number", async () => {
  open("/logistics/waybill/create", ["CanViewWaybill", "CanCreateWaybill"]);
  await waitFor(() => expect((screen.getByRole("textbox", { name: /Document number/ }) as HTMLInputElement).value).toBe("WB009"));
  const number = screen.getByRole("textbox", { name: /Document number/ });
  const user = userEvent.setup(); await user.clear(number); await user.type(number, "MANUAL-123");
  await user.click(screen.getByRole("button", { name: "Retry document number" }));
  expect((number as HTMLInputElement).value).toBe("MANUAL-123");
}, 15000);
