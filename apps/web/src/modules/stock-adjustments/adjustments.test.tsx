// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import NewStockAdjustmentPage from "../../pages/(workspace)/warehouse/stock-adjustments/new/page";
import StockAdjustmentsPage from "../../pages/(workspace)/warehouse/stock-adjustments/page";
import { ApiProvider } from "../../shared/api/api-provider";
import { SessionProvider } from "../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { adjustmentFormSchema, adjustmentRequest, countInStoredUnit, itemRecords, parseTarget, recordAdjustmentFormSchema, recordAdjustmentRequest, suggestedNumber, systemInCountUnit, transferNoteRecords } from "./adjustments";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

afterEach(() => { cleanup(); forgetSession(); });

const option = (value: string) => ({ value, label: value });
const line = (extra: object = {}) => ({ material: option("m1"), stock: option("sb-1"), counted: 4, reason: option("0"), notes: "", system: 5_000_000, unit: "mg", ...extra });
const messages = (lines: object[]) => adjustmentFormSchema.safeParse({ number: "ADJ-1", date: new Date(2026, 9, 1), lines }).error?.issues.map((issue) => issue.message) ?? [];

it("converts counts, refuses what is not an adjustment, and builds the request", () => {
  expect([systemInCountUnit({ quantity: 5_000_000, unit: "mg" }), countInStoredUnit(4, "mg"), countInStoredUnit(12, "pcs")]).toEqual([5, 4_000_000, 12]);
  expect(messages([line()])).toEqual([]);
  expect(messages([line({ counted: 5 })])).toEqual(["The count is the same as the system's; there is nothing to adjust"]);
  expect(messages([line(), line({ counted: 3 })])).toEqual(["This batch on this shelf is already on another line"]);
  expect(messages([line({ reason: option("6") })])).toEqual(["Say what the reason is"]);
  expect(messages([line({ counted: -1 })])).toEqual(["A count cannot be negative"]);
  expect(messages([])).toEqual(["Add at least one line"]);
  expect(adjustmentRequest({ number: "ADJ-1", date: new Date(2026, 9, 1), lines: [line({ notes: "Spilt" }) as never] })).toEqual({ adjustmentNumber: "ADJ-1", adjustmentDate: "2026-10-01T00:00:00.000Z", targetType: 1,
    lines: [{ modelId: "sb-1", physicalCount: 4_000_000, reasonCode: 0, notes: "Spilt" }] });
  expect(suggestedNumber(new Date(2026, 9, 2, 10, 0, 0))).toMatch(/^ADJ-261002-\d{4}$/);
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
    if (url.pathname === "/api/v1/items") return Response.json({ data: [{ id: "i1", code: "GS-1", name: "Gloves", availableQuantity: 40, unitOfMeasure: { symbol: "pcs" } }], pageIndex: 1, pageCount: 1 });
    if (url.pathname === "/api/v1/stock-adjustment" && input.method === "POST") return Response.json({ id: "a2", approved: false });
    if (url.pathname === "/api/v1/stock-adjustment") return Response.json({ data: [{ id: "a1", adjustmentNumber: "ADJ-1", adjustmentDate: "2026-10-01T00:00:00Z", linesProcessed: 2, approved: false }], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/warehouse/stock-adjustments", element: <StockAdjustmentsPage /> }, { path: "/warehouse/stock-adjustments/new", element: <NewStockAdjustmentPage /> },
    { path: "/warehouse/stock-adjustments/:id", element: <p>Saved adjustment</p> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return calls;
}

it("lists material adjustments and offers a new one only to those who may record it", async () => {
  const calls = open("/warehouse/stock-adjustments", ["CanViewMaterialStockAdjustment"]);
  expect(await screen.findByText("ADJ-1")).toBeTruthy();
  expect(screen.getByText("Awaiting approval")).toBeTruthy();
  expect(screen.queryByRole("link", { name: /New adjustment/ })).toBeNull();
  expect(calls.some((call) => call.includes("targetType=1"))).toBe(true);
  cleanup();
  open("/warehouse/stock-adjustments", ["CanViewMaterialStockAdjustment", "CanCreateMaterialStockAdjustment"]);
  await screen.findByText("ADJ-1");
  expect(screen.getByRole("link", { name: /New adjustment/ })).toBeTruthy();
});

it("opens a new adjustment with a suggested number and one empty line, writing nothing", async () => {
  const calls = open("/warehouse/stock-adjustments/new", ["CanViewMaterialStockAdjustment", "CanCreateMaterialStockAdjustment"]);
  expect(((await screen.findByRole("textbox", { name: /Adjustment number/ })) as HTMLInputElement).value).toMatch(/^ADJ-/);
  expect(await screen.findByRole("combobox", { name: /Batch and shelf/ })).toBeTruthy();
  expect(calls.filter((call) => !call.startsWith("GET"))).toEqual([]);
});

const recordLine = (extra: object = {}) => ({ record: option("i1"), counted: 38, reason: option("1"), notes: "", system: 40, unit: "pcs", ...extra });
const recordMessages = (target: 0 | 2, lines: object[]) => recordAdjustmentFormSchema(target).safeParse({ number: "ADJ-2", date: new Date(2026, 9, 1), lines }).error?.issues.map((issue) => issue.message) ?? [];

it("counts items in whole units and transfer notes as recorded, refusing what is not an adjustment", () => {
  expect([parseTarget(null), parseTarget(""), parseTarget("0"), parseTarget("2"), parseTarget("9")]).toEqual([1, 1, 0, 2, 1]);
  expect(recordMessages(0, [recordLine()])).toEqual([]);
  expect(recordMessages(0, [recordLine({ counted: 38.5 })])).toEqual(["Items are counted in whole units"]);
  expect(recordMessages(2, [recordLine({ counted: 38.5 })])).toEqual([]);
  expect(recordMessages(0, [recordLine({ counted: 40 })])).toEqual(["The count is the same as the system's; there is nothing to adjust"]);
  expect(recordMessages(0, [recordLine(), recordLine({ counted: 1 })])).toEqual(["This is already on another line"]);
  expect(recordAdjustmentRequest({ number: "ADJ-2", date: new Date(2026, 9, 1), lines: [recordLine() as never] }, 2)).toEqual({ adjustmentNumber: "ADJ-2", adjustmentDate: "2026-10-01T00:00:00.000Z", targetType: 2,
    lines: [{ modelId: "i1", physicalCount: 38, reasonCode: 1, notes: null }] });
  expect(itemRecords([{ id: "i1", code: "GS-1", name: "Gloves", availableQuantity: 40, unitOfMeasure: { symbol: "pcs" } }])).toEqual([{ value: "i1", label: "GS-1 · Gloves", system: 40, unit: "pcs" }]);
  expect(transferNoteRecords([{ id: "n1", transferNoteNumber: "FGTN-4", totalQuantity: 1200, uoM: { symbol: "pcs" }, batchManufacturingRecord: { batchNumber: "B-9", productionScheduleProduct: { product: { name: "Wormee" } } } }]))
    .toEqual([{ value: "n1", label: "FGTN-4 · Wormee · batch B-9", system: 1200, unit: "pcs" }]);
});

it("lists and records general store item adjustments from the address the stores menu opens", async () => {
  const user = userEvent.setup();
  const calls = open("/warehouse/stock-adjustments?target=0", ["CanViewMaterialStockAdjustment", "CanCreateMaterialStockAdjustment"]);
  await screen.findByText("ADJ-1");
  expect(calls.some((call) => call.includes("targetType=0"))).toBe(true);
  expect(screen.getByRole("button", { name: "General store items" }).getAttribute("aria-pressed")).toBe("true");
  expect(screen.getByRole("link", { name: /New adjustment/ }).getAttribute("href")).toBe("/warehouse/stock-adjustments/new?target=0");
  cleanup(); forgetSession();
  const writes = open("/warehouse/stock-adjustments/new?target=0", ["CanViewMaterialStockAdjustment", "CanCreateMaterialStockAdjustment"]);
  // Every field is loaded on demand; wait for the last one so the item field is not replaced under the click.
  await screen.findByRole("spinbutton", { name: /Counted/ });
  await screen.findByRole("textbox", { name: /Note/ });
  await user.click(screen.getByRole("combobox", { name: /^Item/ }));
  await user.click(await screen.findByRole("option", { name: "GS-1 · Gloves" }, { timeout: 3000 }));
  expect(await screen.findByText(/40 pcs/)).toBeTruthy();
  await user.type(screen.getByRole("spinbutton", { name: /Counted/ }), "37");
  await user.click(screen.getByRole("combobox", { name: /Reason/ }));
  await user.click(await screen.findByRole("option", { name: "Damage" }));
  await user.click(screen.getByRole("button", { name: "Send for approval" }));
  await waitFor(() => expect(writes.filter((call) => call.startsWith("POST"))).toEqual(["POST /api/v1/stock-adjustment"]));
  expect(await screen.findByText("Saved adjustment")).toBeTruthy();
}, 20_000);
