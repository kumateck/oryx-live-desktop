// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { chooseAction } from "../../../test/menu";
import { StockMigrationPage } from "./stock-migration-page";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

const migration = {
  id: "m1", departmentName: "Oral Liquid-Syrup", fileName: "Syrup Department.xlsx", status: 0, massUnit: "kg", volumeUnit: "L", createdBy: "Ama Mensah",
  total: 2, ok: 1, warning: 0, blocked: 1, skipped: 0, excluded: 0, writtenOff: 0, sheets: ["Raw Material"],
  warehouses: [{ id: "w1", name: "SYRUP Raw Warehouse", type: 0, willBeWiped: true, shelves: [{ id: "s1", name: "G/09/B", code: "S/RM/G/09/B" }] }],
};
const blocked = {
  id: "l2", sheet: "Raw Material", rowNumber: 65, materialCode: "RMG039", sheetMaterialName: "Green Tea Extract 50%", batchNumber: "DCS2502013", arNumber: "QCD/RM/26/314", quantityInSheet: 28.9,
  sheetUnit: "mg", status: 2, blockers: ["The code RMG039 is used by \"Green Tea Extract 50%\" and \"Glucose\". Pick the right material."], warnings: [], corrections: ["Missing shelf assigned to the first rack and shelf."],
  materialChoices: [{ id: "g1", code: "RMG039", name: "Green Tea Extract 50%" }, { id: "g2", code: "RMG039", name: "Glucose" }], shelfName: "G/09/B", resolvedShelfId: "s1",
};

function open(permissions: string[], arNumber: string | null = blocked.arNumber, topUp = false) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: { method: string; path: string; body: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    if (input.method !== "GET") { calls.push({ method: input.method, path: url.pathname, body: await input.text() }); return new Response(null, { status: 204 }); }
    const json = (value: object) => new Response(JSON.stringify(value), { headers: { "Content-Type": "application/json" } });
    if (url.pathname === "/api/v1/stock-migrations/m1") return json(topUp ? { ...migration, mode: 1, reason: "Missed during migration", blocked: 0, ok: 1, warehouses: migration.warehouses.map((store) => ({ ...store, willBeWiped: false })) } : migration);
    if (url.pathname === "/api/v1/stock-migrations/m1/lines") return json({ data: [{ ...blocked, arNumber }], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname === "/api/v1/stock-migrations/m1/comparison") return json([{ materialId: "x", code: "RMA010", name: "Ascorbic Acid", kind: 0, unit: "mg", current: 14_000_000, new: topUp ? 15_000_000 : 0, added: topUp ? 1_000_000 : 0, currentBatches: 1, newBatches: 0 }]);
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/settings/upload-center/stock-migrations/:id", element: <StockMigrationPage /> }], { initialEntries: ["/settings/upload-center/stock-migrations/m1"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

it("holds approval while a row is blocked and saves the material picked for a shared code", async () => {
  const user = userEvent.setup();
  const calls = open(["CanViewOpeningBalances", "CanCorrectOpeningBalances", "CanApproveOpeningBalances"]);
  expect(await screen.findByText(/This draft does not affect available stock/)).toBeTruthy();
  expect((screen.getByRole("button", { name: /Approve opening balances/ }) as HTMLButtonElement).disabled).toBe(true);
  expect(await screen.findByText(/is used by "Green Tea Extract 50%" and "Glucose"/)).toBeTruthy();

  await chooseAction("Actions for row 65 of Raw Material", "Correct row");
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("AR number")).toBeTruthy();
  expect(within(dialog).getByText("QCD/RM/26/314")).toBeTruthy();
  await user.click(await within(dialog).findByRole("combobox", { name: /Material/ }));
  await user.click(await screen.findByRole("option", { name: "RMG039 · Glucose" }));
  await user.click(within(dialog).getByRole("button", { name: "Save and check" }));

  await waitFor(() => expect(calls).toHaveLength(1));
  expect(calls[0]?.path).toBe("/api/v1/stock-migrations/m1/lines/l2");
  expect(JSON.parse(calls[0]?.body ?? "{}")).toMatchObject({ materialId: "g2", shelfId: "s1", batchNumber: "DCS2502013", quantityInSheet: 28.9 });
}, 30_000);

it("shows materials that approval would set to zero", async () => {
  const user = userEvent.setup();
  open(["CanViewOpeningBalances"]);
  await user.click(await screen.findByRole("tab", { name: "Stock before and after" }));
  expect(await screen.findByText(/1 material\(s\) have stock now but are not in the sheet/)).toBeTruthy();
  expect(screen.getByText("Goes to zero")).toBeTruthy();
}, 30_000);

it("shows the imported AR alongside the batch for a reviewer without correction access", async () => {
  open(["CanViewOpeningBalances"]);
  const ar = await screen.findByText("AR: QCD/RM/26/314");
  const row = ar.closest("tr");
  expect(row).toBeTruthy();
  if (!row) throw new Error("Expected an AR number in a stock row");
  expect(within(row).getByText("DCS2502013")).toBeTruthy();
  expect(screen.getByRole("columnheader", { name: /Batch \/ AR number/ })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Actions for row 65 of Raw Material" })).toBeNull();
}, 30_000);

it("shows a missing AR as unavailable while retaining the batch", async () => {
  open(["CanViewOpeningBalances"], null);
  expect((await screen.findByText(/^AR:/)).textContent).toBe("AR: –");
  expect(screen.getByText("DCS2502013")).toBeTruthy();
}, 30_000);

it("allows a corrector to edit a draft without exposing approval", async () => {
  open(["CanViewOpeningBalances", "CanCorrectOpeningBalances"]);
  expect(await screen.findByRole("button", { name: "Check again" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Approve opening balances" })).toBeNull();
  await chooseAction("Actions for row 65 of Raw Material", "Correct row");
  expect(await screen.findByRole("dialog")).toBeTruthy();
}, 30_000);

it("lets an approver review without showing correction or discard controls", async () => {
  const user = userEvent.setup();
  open(["CanViewOpeningBalances", "CanApproveOpeningBalances"]);
  expect(await screen.findByRole("button", { name: "Approve opening balances" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Check again" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Discard" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Actions for row 65 of Raw Material" })).toBeNull();
  await user.click(await screen.findByRole("button", { name: "1 preparation notes" }));
  expect(await screen.findByText("Missing shelf assigned to the first rack and shelf.")).toBeTruthy();
}, 30_000);

it("approves an additive top-up with its reason and without a replacement warning", async () => {
  const user = userEvent.setup();
  const calls = open(["CanViewOpeningBalances", "CanApproveOpeningBalances"], blocked.arNumber, true);
  expect(await screen.findByText(/Missed during migration/)).toBeTruthy();
  await user.click(await screen.findByRole("button", { name: "Approve stock top-up" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText(/Existing balances are preserved/)).toBeTruthy();
  expect(within(dialog).queryByText(/written off/)).toBeNull();
  await user.click(within(dialog).getByRole("button", { name: "Approve stock top-up" }));
  await waitFor(() => expect(calls.some((call) => call.path.endsWith("/approve"))).toBe(true));
}, 30_000);

it("shows the additive comparison and hides approval from a top-up creator", async () => {
  const user = userEvent.setup();
  open(["CanViewOpeningBalances", "CanUploadOpeningBalances"], blocked.arNumber, true);
  expect(await screen.findByText(/Missed during migration/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Approve stock top-up" })).toBeNull();
  await user.click(screen.getByRole("tab", { name: "Stock before and after" }));
  expect(await screen.findByRole("columnheader", { name: /Top-up/ })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Going to zero" })).toBeNull();
}, 30_000);
