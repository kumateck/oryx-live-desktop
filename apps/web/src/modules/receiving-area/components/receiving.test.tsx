// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import CreateChecklistRoute from "../../../pages/(workspace)/warehouse/receiving-area/[id]/create-checklist/page";
import ViewChecklistRoute from "../../../pages/(workspace)/warehouse/receiving-area/[id]/view-checklist/page";
import ReceivingAreaPage from "../../../pages/(workspace)/warehouse/receiving-area/page";
import GrnPage from "../../../pages/(workspace)/warehouse/quarantine-area/[id]/details/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { openMenu } from "../../../test/menu";
import { checklistRequest } from "../lib/checklist-request";
import { accountsFor, batchesTotal, canCreateChecklist, canJoinGrn, grnNumber, grnPrefix, readStatus } from "../lib/receiving";
import { checklistFormSchema, deliveredMaterialSchema } from "../schemas/receiving-schema";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => { cleanup(); forgetSession(); });

const delivered = (id: string, status: number, extra: object = {}) => ({ id, status, quantity: 50_000_000, uoM: { id: "u-mg", symbol: "mg" }, distributedAt: "2026-09-29T09:00:00Z", material: { id: "m1", name: "Maize starch", code: "RM-1", kind: 0 },
  shipmentInvoice: { id: "inv-a", code: "INV-A", supplier: { id: "s0", name: "Acme Chemicals" } }, materialItemDistributions: [{ shipmentInvoiceItem: { uoM: { id: "u-mg", symbol: "mg" }, manufacturer: { id: "mf1", name: "Roquette" } } }],
  checklists: status >= 2 ? [{ materialBatches: [{ id: `${id}-b1` }] }] : [], department: { name: "Production", isBeta: false }, ...extra });

it("works out what a delivery allows, what its batches account for, and the next note number", () => {
  expect([0, 1, 2, 3, 4].map((status) => canCreateChecklist(status as 0))).toEqual([true, true, false, false, false]);
  expect([canJoinGrn({ status: 2, batches: 1 }), canJoinGrn({ status: 2, batches: 0 }), canJoinGrn({ status: 3, batches: 1 }), canJoinGrn({ status: 0, batches: 0 })]).toEqual([true, false, false, false]);
  expect([readStatus(null), readStatus("2"), readStatus("9")]).toEqual([0, 2, 0]);
  // 50 kg delivered, stored in mg and typed in kg.
  expect(batchesTotal([{ containers: 2, perContainer: 12.5 }, { containers: 1, perContainer: Number.NaN }])).toBe(25);
  expect(accountsFor([{ containers: 2, perContainer: 25 }], 50_000_000, "mg")).toBe(true);
  expect(accountsFor([{ containers: 3, perContainer: 16.666 }], 50_000_000, "mg")).toBe(false);
  expect(accountsFor([{ containers: 1, perContainer: 49 }], 50_000_000, "mg")).toBe(false);
  expect(grnNumber(grnPrefix(0, false, 2026), 7)).toBe("WHD/RM/26/008");
  expect(grnPrefix(1, true, 2026)).toBe("BWH/PM/26");

  const batch = { number: "B-1", containers: 2, style: { value: "ps", label: "Drum" }, perContainer: 25, made: "2026-06", expires: "2028-06", weights: [{ gross: 25.4 }, { gross: Number.NaN }] };
  const base = { checkedAt: new Date(2026, 9, 1), certificate: "yes", labelled: "no", intactness: { value: "0", label: "Good" }, carrier: { value: "1", label: "Clean" } };
  expect(checklistFormSchema(0).safeParse({ ...base, batches: [batch] }).success).toBe(true);
  // A raw material batch needs its number and expiry; packaging does not.
  const bare = { ...batch, number: "", expires: null };
  expect(checklistFormSchema(0).safeParse({ ...base, batches: [bare] }).error?.issues.map((issue) => issue.message)).toEqual(["Enter the batch number", "Choose the expiry date"]);
  expect(checklistFormSchema(1).safeParse({ ...base, batches: [bare] }).success).toBe(true);
  // The manufacturing date is never after, or the same month as, the expiry date, and never in the future.
  expect(checklistFormSchema(0).safeParse({ ...base, batches: [{ ...batch, made: "2026-06", expires: "2026-05" }] }).error?.issues.map((issue) => issue.message)).toEqual(["The expiry date must be after the manufacturing date"]);
  expect(checklistFormSchema(1).safeParse({ ...base, batches: [{ ...batch, made: "2026-06", expires: "2026-06" }] }).error?.issues.map((issue) => issue.path.join("."))).toEqual(["batches.0.expires"]);
  expect(checklistFormSchema(0).safeParse({ ...base, batches: [{ ...batch, made: "2999-01", expires: "2999-06" }] }).error?.issues.map((issue) => issue.message)).toEqual(["The manufacturing date cannot be in the future"]);
  expect(checklistFormSchema(0).safeParse({ ...base, certificate: "", batches: [{ ...batch, weights: [{ gross: Number.NaN }] }] }).error?.issues.map((issue) => issue.message))
    .toEqual(["Say whether the certificate of analysis came with the delivery", "Record at least one gross weight"]);
  expect(checklistFormSchema(0).safeParse({ ...base, batches: [batch, { ...batch, number: "b-1" }] }).error?.issues[0]?.message).toBe("This batch number is already used above");

  const material = deliveredMaterialSchema.parse(delivered("dm-1", 0));
  expect(checklistRequest({ ...material!, materialId: "m1" }, { ...base, batches: [batch] })).toEqual({ distributedRequisitionMaterialId: "dm-1", materialId: "m1", checkedAt: "2026-10-01T00:00:00.000Z", shipmentInvoiceId: "inv-a", supplierId: "s0", manufacturerId: "mf1",
    certificateOfAnalysisDelivered: true, visibleLabelling: false, intactnessStatus: 0, consignmentCarrierStatus: 1,
    materialBatches: [{ materialId: "m1", batchNumber: "B-1", numberOfContainers: 2, containerPackageStyleId: "ps", quantityPerContainer: 25_000_000, totalQuantity: 50_000_000, uoMId: "u-mg", dateReceived: "2026-10-01T00:00:00.000Z",
      manufacturingDate: "2026-06-01T00:00:00.000Z", expiryDate: "2028-06-30T00:00:00.000Z", sampleWeights: [{ srNumber: "1", grossWeight: 25.4 }] }] });
});

interface Call { method: string; path: string; body: unknown }
function open(address: string, permissions: string[], options: { status?: number } = {}) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const path = url.pathname;
    const text = input.method === "GET" ? "" : await input.clone().text();
    calls.push({ method: input.method, path, body: text ? JSON.parse(text) as unknown : null });
    if (path === "/api/v1/warehouse/distributed-requisition-materials") { const status = Number(url.searchParams.get("status"));
      return Response.json({ data: status === 2 ? [delivered("dm-2", 2), delivered("dm-3", 2, { checklists: [{ materialBatches: [] }], material: { id: "m2", name: "Lactose", kind: 0 } })] : [delivered("dm-1", 0)], pageIndex: 1, pageCount: 1, totalRecordCount: 2 }); }
    if (path === "/api/v1/warehouse/distributed-material/dm-1") return Response.json(delivered("dm-1", options.status ?? 0));
    if (path === "/api/v1/warehouse/distributed-material/dm-1/checklist") return Response.json({ checkedAt: "2026-10-01T00:00:00Z", certificateOfAnalysisDelivered: true, visibleLabelling: true, intactnessStatus: 1, consignmentCarrierStatus: 1,
      material: { name: "Maize starch", code: "RM-1" }, supplier: { name: "Acme Chemicals" }, shipmentInvoice: { code: "INV-A" }, materialBatches: [{ id: "b1", batchNumber: "B-1", numberOfContainers: 2, quantityPerContainer: 25_000_000, totalQuantity: 50_000_000, uoM: { symbol: "mg" },
        containerPackageStyle: { name: "Drum" }, manufacturingDate: "2026-06-01T00:00:00Z", expiryDate: "0001-01-01T00:00:00Z", sampleWeights: [{ srNumber: "1", grossWeight: 25.4 }] }] });
    if (path === "/api/v1/warehouse/distributed-material/material-batch") return Response.json([{ id: "dm-2-b1" }]);
    if (path === "/api/v1/warehouse/grn") return Response.json("grn-1", { status: 201 });
    if (path === "/api/v1/warehouse/grn/grn-1") return Response.json({ id: "grn-1", grnNumber: "WHD/RM/26/008", carrierName: "K. Mensah", vehicleNumber: "GT-1", createdAt: "2026-10-01T10:00:00Z",
      materialBatches: [{ id: "b1", batchNumber: "B-1", material: { name: "Maize starch" }, totalQuantity: 50_000_000, uoM: { symbol: "mg" }, status: 1, supplierName: "Acme Chemicals", checklist: { shipmentInvoice: { code: "INV-A" } } }] });
    if (path === "/api/v1/warehouse/checklist") return Response.json("cl-1", { status: 201 });
    if (path === "/api/v1/collection") return Response.json({ PackageStyle: [{ id: "ps", name: "Drum" }] });
    if (path === "/api/v1/configuration/GRNNumber/count") return Response.json(7);
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/warehouse/receiving-area", element: <ReceivingAreaPage /> }, { path: "/warehouse/receiving-area/:id/create-checklist", element: <CreateChecklistRoute /> },
    { path: "/warehouse/receiving-area/:id/view-checklist", element: <ViewChecklistRoute /> }, { path: "/warehouse/quarantine-area/:id/details", element: <GrnPage /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET" && call.path !== "/api/v1/collection");

it("offers the checklist only to those who may write it, and refuses a second one by address", async () => {
  open("/warehouse/receiving-area?status=0", ["CanViewRawMaterialsItems"]);
  await screen.findByText("Maize starch");
  // With nothing the viewer may do, the row has no menu at all.
  const menu = screen.queryByRole("button", { name: "Actions for Maize starch" });
  if (menu) { await openMenu("Actions for Maize starch"); expect(screen.queryByRole("menuitem", { name: "Create checklist" })).toBeNull(); }
  cleanup();
  open("/warehouse/receiving-area/dm-1/create-checklist", ["CanViewRawMaterialsItems"]);
  expect(await screen.findByText("You may not write checklists for this kind of material.")).toBeTruthy();
  cleanup();
  open("/warehouse/receiving-area/dm-1/create-checklist", ["CanViewRawMaterialsItems", "CanCreateChecklistForRawMaterials"], { status: 2 });
  expect(await screen.findByText(/A checklist has already been saved/)).toBeTruthy();
  cleanup();
  open("/warehouse/receiving-area/dm-1/create-checklist", ["CanViewPackagingMaterialsItems", "CanCreateChecklistForPackagingMaterials"]);
  expect(await screen.findByText("You do not have access to this kind of material.")).toBeTruthy();
}, 20_000);

it("saves a checklist only when the batches account for the whole delivery", async () => {
  const user = userEvent.setup();
  const { calls } = open("/warehouse/receiving-area/dm-1/create-checklist", ["CanViewRawMaterialsItems", "CanCreateChecklistForRawMaterials"]);
  await user.type(await screen.findByRole("textbox", { name: /Batch number/ }), "B-1");
  await user.type(screen.getByRole("spinbutton", { name: /Number of containers/ }), "2");
  await user.type(screen.getByRole("spinbutton", { name: /Quantity per container \(kg\)/ }), "20");
  expect(screen.getByRole("status").textContent).toContain("40 kg of the 50 kg delivered");
  await user.click(screen.getByRole("button", { name: "Save checklist" }));
  expect(await screen.findByText("Choose the condition of the carrier")).toBeTruthy();
  expect(screen.getByText("Choose the expiry date")).toBeTruthy();
  expect(screen.getByText("Record at least one gross weight")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
}, 30_000);

it("puts only checked materials with batches on a goods received note, reading their batches first", async () => {
  const user = userEvent.setup();
  const { calls } = open("/warehouse/receiving-area?status=2", ["CanViewRawMaterialsItems", "CanCreateGrnForRawMaterials"]);
  await screen.findByText("Maize starch");
  expect((screen.getByRole("button", { name: "Create GRN" }) as HTMLButtonElement).disabled).toBe(true);
  const boxes = screen.getAllByRole("checkbox", { name: "Select row" }) as HTMLButtonElement[];
  // Lactose was checked without batches, so it cannot be ticked.
  expect(boxes.map((box) => box.disabled)).toEqual([false, true]);
  await user.click(boxes[0]!);
  await user.click(await screen.findByRole("button", { name: "Create GRN (1)" }));
  const dialog = await screen.findByRole("dialog");
  await waitFor(() => expect((within(dialog).getByRole("textbox", { name: /GRN number/ }) as HTMLInputElement).value).toBe("WHD/RM/26/008"));
  await user.click(within(dialog).getByRole("button", { name: "Create GRN" }));
  expect(await within(dialog).findByText("Enter the carrier's name")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  await user.type(within(dialog).getByRole("textbox", { name: /Carrier's name/ }), "K. Mensah");
  await user.type(within(dialog).getByRole("textbox", { name: /Vehicle number/ }), "GT-1");
  await user.click(within(dialog).getByRole("button", { name: "Create GRN" }));
  await waitFor(() => expect(writes(calls)).toHaveLength(2));
  expect(writes(calls).map((call) => `${call.method} ${call.path}`)).toEqual(["POST /api/v1/warehouse/distributed-material/material-batch", "POST /api/v1/warehouse/grn"]);
  expect(writes(calls)[0]?.body).toEqual(["dm-2"]);
  expect(writes(calls)[1]?.body).toEqual({ grnNumber: "WHD/RM/26/008", declarationNumber: null, carrierName: "K. Mensah", vehicleNumber: "GT-1", remarks: null, materialBatchIds: ["dm-2-b1"] });
}, 30_000);

it("shows a saved checklist with what was found on arrival, and a note with its batches", async () => {
  open("/warehouse/receiving-area/dm-1/view-checklist", ["CanViewRawMaterialsItems"], { status: 2 });
  expect(await screen.findByText("Problems noted on arrival")).toBeTruthy();
  expect(screen.getByText("B-1")).toBeTruthy();
  expect(screen.getByText("25.4")).toBeTruthy();
  cleanup();
  open("/warehouse/quarantine-area/grn-1/details", ["CanViewQuarantineRawMaterials"]);
  expect(await screen.findByText("GRN WHD/RM/26/008")).toBeTruthy();
  expect(screen.getByText("Quarantine")).toBeTruthy();
});
