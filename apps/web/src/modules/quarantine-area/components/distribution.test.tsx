// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { z } from "zod";
import GrnPage from "../../../pages/(workspace)/warehouse/quarantine-area/[id]/details/page";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { notifyPermissionDenied } from "@/shared/auth/session-events";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { chooseAction } from "@/test/menu";
import { grnFixture, ids } from "../lib/distribution-fixtures";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

const view = "CanViewQuarantineRawMaterials";
const distribute = "CanDistributeRawMaterials";
const payload = z.array(z.object({ warehouseId: z.uuid(), materialBatchId: z.uuid(), uoMId: z.uuid(), distributedRequisitionItemId: z.uuid(), quantity: z.number().positive() }));
interface Write { body: z.infer<typeof payload>; module: string | null; subModule: string | null }
function open(options: { permissions?: string[]; kind?: number; status?: number; stale?: boolean; refused?: boolean; offline?: boolean; holdPreflight?: boolean; multipleMaterials?: boolean } = {}) {
  const backend = stubBackend({ permissions: options.permissions ?? [view, distribute] });
  rememberSession();
  const session = backend.fetcher.getMockImplementation();
  const writes: Write[] = [];
  let reads = 0;
  let saved = false;
  let release = () => {};
  const gate = new Promise<void>((resolve) => { release = resolve; });
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === `/api/v1/warehouse/grn/${ids.grn}`) {
      reads++;
      if (reads > 1 && options.holdPreflight) await gate;
      if (reads > 1 && options.offline) return new Response(null, { status: 503 });
      const fixture = grnFixture(reads > 1 && options.stale ? 4 : options.status ?? 8, options.kind ?? 0);
      const firstBatch = fixture.materialBatches[0];
      if (options.multipleMaterials && firstBatch) {
        const material = { id: "22222222-2222-4222-8222-222222222223", name: "Maize Starch" };
        fixture.materialBatches.push({ ...firstBatch, material,
          id: "44444444-4444-4444-8444-444444444446", batchNumber: "OTHER", totalQuantity: 1_000_000,
          quantityDistributed: 0, status: 8,
        });
        fixture.checkLists.push({ material: { ...material, kind: options.kind ?? 0 },
          distributedRequisitionMaterial: { distributedRequisitionItems: [] },
        });
      }
      if (saved) fixture.materialBatches = fixture.materialBatches.map((batch) => ({ ...batch, quantityDistributed: batch.totalQuantity }));
      return Response.json(fixture);
    }
    if (path === "/api/v1/procurement/distribute-material" && input.method === "POST") {
      writes.push({ body: payload.parse(JSON.parse(await input.text())), module: input.headers.get("Module"), subModule: input.headers.get("SubModule") });
      if (options.refused) return Response.json({ errors: [{ description: "Stock changed on the server" }] }, { status: 400 });
      saved = true;
      return new Response(null, { status: 204 });
    }
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/warehouse/quarantine-area/:id/details", element: <GrnPage /> }], { initialEntries: [`/warehouse/quarantine-area/${ids.grn}/details?type=0`] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { writes, backend, release: () => release(), reads: () => reads };
}
async function review(fromRow = false) {
  const user = userEvent.setup();
  if (fromRow) await chooseAction("Actions for Diclofenac Sodium, batch BNTXOCT16A", "Distribute material");
  else await user.click(await screen.findByRole("button", { name: "Distribute" }));
  const dialog = await screen.findByRole("dialog");
  await within(dialog).findByRole("button", { name: "Distribute to Production store" });
  return { user, dialog };
}

it("renders distribution actions from the actual GRN contract whose batch material has no kind field", async () => {
  open();
  await screen.findByText("GRN GRXTNC");
  expect(screen.getAllByText("Approved")).toHaveLength(2);
  expect(screen.getByRole("columnheader", { name: "Quantities" })).toBeTruthy();
  expect(screen.getByRole("columnheader", { name: "Dates" })).toBeTruthy();
  const row = screen.getByText("BNTXOCT16A").closest("tr");
  if (!row) throw new Error("Expected the first batch row");
  expect(within(row).getAllByRole("term").map((term) => term.textContent)).toEqual([
    "Received", "Allocated", "Distributed", "Manufacturing", "Expiry", "Retest",
  ]);
  expect(within(row).getAllByRole("definition").map((value) => value.textContent)).toEqual([
    "10 kg", "0 mg", "2 kg", "Oct 2026", "Oct 2027", "–",
  ]);
  const { dialog } = await review();
  expect(within(dialog).getByText("13 kg")).toBeTruthy();
  expect(within(dialog).getByText("10 kg")).toBeTruthy();
});

it("uses the raw/packaging distribution permissions and the record's actual kind, and blocks a denied route before fetching", async () => {
  const denied = open({ permissions: [] });
  await screen.findByText("You don't have access to this page");
  expect(denied.reads()).toBe(0);
  cleanup();
  open({ permissions: [view, "CanDistributePackagingMaterials"] });
  await screen.findByText("GRN GRXTNC");
  expect(screen.queryByRole("button", { name: "Distribute" })).toBeNull();
  cleanup();
  open({ kind: 1, permissions: [view, distribute] });
  await screen.findByText("You don't have access to this page");
  cleanup();
  open({ kind: 1, permissions: ["CanViewQuarantinePackagingMaterials", "CanDistributePackagingMaterials"] });
  await review();
});

it("submits the reviewed requisition-specific allocation once, with audit headers, and refreshes the GRN after success", async () => {
  const state = open();
  const { user, dialog } = await review();
  await user.dblClick(within(dialog).getByRole("button", { name: "Distribute to Production store" }));
  await waitFor(() => expect(state.writes).toHaveLength(1));
  expect(state.writes[0]).toEqual({ module: "Warehouse", subModule: "Quality Assurance Goods Receipt Note", body: [
    { warehouseId: ids.warehouse, materialBatchId: ids.batch, uoMId: ids.unit, distributedRequisitionItemId: ids.request, quantity: 3_000_000 },
    { warehouseId: ids.warehouse, materialBatchId: ids.batch, uoMId: ids.unit, distributedRequisitionItemId: ids.request2, quantity: 3_000_000 },
    { warehouseId: ids.warehouse, materialBatchId: ids.batch2, uoMId: ids.unit, distributedRequisitionItemId: ids.request2, quantity: 2_000_000 },
  ] });
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  await waitFor(() => expect(state.reads()).toBeGreaterThanOrEqual(3));
});

it("requires another review when approval changes during preflight, and sends nothing if stock cannot be checked", async () => {
  const state = open({ stale: true });
  const { user, dialog } = await review(true);
  await user.click(within(dialog).getByRole("button", { name: "Distribute to Production store" }));
  await within(dialog).findByText("This material no longer has approved batches on this note.");
  expect(state.writes).toHaveLength(0);
  cleanup();
  const offline = open({ offline: true });
  const retry = await review();
  await retry.user.click(within(retry.dialog).getByRole("button", { name: "Distribute to Research store" }));
  await within(retry.dialog).findByText(/Stock could not be checked/);
  expect(offline.writes).toHaveLength(0);
});

it("keeps a server refusal visible with no automatic mutation retry", async () => {
  const state = open({ refused: true });
  const { user, dialog } = await review();
  await user.click(within(dialog).getByRole("button", { name: "Distribute to Production store" }));
  await within(dialog).findByText("Stock changed on the server");
  expect(state.writes).toHaveLength(1);
  await waitFor(() => expect(state.reads()).toBeGreaterThanOrEqual(3));
});

it("removes an open row distribution dialog when access is revoked", async () => {
  const state = open();
  await review(true);
  state.backend.set({ permissions: [view] });
  fireEvent(window, new Event("focus"));
  notifyPermissionDenied();
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(state.writes).toHaveLength(0);
});

it("checks current access again after stock preflight, even if the dialog was unmounted while the request was pending", async () => {
  const state = open({ holdPreflight: true });
  const { user, dialog } = await review();
  await user.click(within(dialog).getByRole("button", { name: "Distribute to Production store" }));
  await waitFor(() => expect(state.reads()).toBe(2));
  state.backend.set({ permissions: [view] });
  notifyPermissionDenied();
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  state.release();
  await waitFor(() => expect(state.writes).toHaveLength(0));
});

it("shows an unrecognized status explicitly and never enables distribution for it", async () => {
  open({ status: 99 });
  await screen.findByText("GRN GRXTNC");
  expect(screen.getAllByText("Unknown (99)")).toHaveLength(2);
  expect(screen.getByRole("button", { name: "Distribute" }).hasAttribute("disabled")).toBe(true);
});

it("preselects the approved row material when the GRN contains multiple materials and preserves the audited write", async () => {
  const state = open({ multipleMaterials: true });
  await chooseAction("Actions for Diclofenac Sodium, batch BNTXOCT16A", "Distribute material");
  const dialog = await screen.findByRole("dialog");
  await within(dialog).findByRole("button", { name: "Distribute to Production store" });
  expect(within(dialog).getByText("13 kg")).toBeTruthy();
  await userEvent.setup().click(within(dialog).getByRole("button", { name: "Distribute to Production store" }));
  await waitFor(() => expect(state.writes).toHaveLength(1));
  expect(state.writes[0]?.module).toBe("Warehouse");
  expect(state.writes[0]?.subModule).toBe("Quality Assurance Goods Receipt Note");
});

it("hides row distribution without the matching permission or approved batch status", async () => {
  open({ permissions: [view] });
  await screen.findByText("GRN GRXTNC");
  expect(screen.queryByRole("button", { name: /Actions for/ })).toBeNull();
  cleanup();
  open({ status: 3 });
  await screen.findByText("GRN GRXTNC");
  expect(screen.queryByRole("button", { name: /Actions for/ })).toBeNull();
});

it.each([0, 3, 4, 9, 99])("hides the row distribution action for non-approved status %s", async (status) => {
  open({ status });
  await screen.findByText("GRN GRXTNC");
  expect(screen.queryByRole("button", { name: /Actions for/ })).toBeNull();
});
