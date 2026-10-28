// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import IssueStockRequisitionPage from "../../../pages/(workspace)/warehouse/stock-requisition/[id]/page";
import StockRequisitionsPage from "../../../pages/(workspace)/warehouse/stock-requisition/page";
import { BatchBreakdown } from "./batch-breakdown";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { alternativesSchema, expiresEarlier, shelfRecordsSchema, swapRequestFor, swapSuggestions } from "../lib/alternative-batches";
import { batchNumber, expiredOrDue, issueBlock, shortfall } from "../lib/stock-issue";

afterEach(() => { cleanup(); forgetSession(); });

it("reads batch numbers, expiry and what stops an issue", () => {
  expect([batchNumber("B-12"), batchNumber("1.2345E+5"), batchNumber("12E-2"), batchNumber("N/A"), batchNumber(null)]).toEqual(["B-12", "123450", "0.12", "–", "–"]);
  const today = new Date(2026, 9, 2);
  expect([expiredOrDue("2026-10-02T00:00:00", today), expiredOrDue("2026-10-01T00:00:00", today), expiredOrDue("2026-10-03T00:00:00", today), expiredOrDue(null, today), expiredOrDue("0001-01-01T00:00:00", today)]).toEqual([true, true, false, false, false]);
  const line = (quantity: number, batches: { quantity: number; expires: string | null }[]) => ({ quantity, batches });
  expect([shortfall(line(100, [{ quantity: 60, expires: null }, { quantity: 40, expires: null }])), shortfall(line(100, [{ quantity: 60, expires: null }]))]).toEqual([0, 40]);
  const good = line(100, [{ quantity: 100, expires: "2027-01-01T00:00:00" }]);
  expect(issueBlock({ approved: false, status: 0, items: [good] }, today)).toContain("waiting for approval");
  expect(issueBlock({ approved: true, status: 3, items: [good] }, today)).toContain("already been issued");
  expect(issueBlock({ approved: true, status: 1, items: [] }, today)).toContain("no materials");
  expect(issueBlock({ approved: true, status: 1, items: [line(5, [{ quantity: 5, expires: "2026-10-02T00:00:00" }])] }, today)).toContain("expired or expires today");
  expect(issueBlock({ approved: true, status: 1, items: [good, line(5, [])] }, today)).toContain("No stock is set aside");
  expect(issueBlock({ approved: true, status: 1, items: [good] }, today)).toBeNull();
});

it("labels an issued batch with no batch number", () => {
  render(<BatchBreakdown line={{ unit: "kg", batches: [{ key: "missing-number", number: null, quantity: 5, expires: null, returned: false }] }} />);
  expect(screen.getByText("No batch")).toBeTruthy();
});

const requisition = (id: string, extra: object = {}) => ({ id, code: id.toUpperCase(), status: 1, approved: true, createdAt: "2026-10-01T09:00:00Z", requestedBy: { firstName: "Ama", lastName: "Owusu" }, department: { name: "Production" },
  productionScheduleProduct: { batchNumber: "T081K004", product: { name: "Paracetamol syrup", code: "FP-1" }, productionSchedule: { code: "PS026" } },
  items: [{ id: "l1", quantity: 50_000_000, material: { name: "Maize starch", code: "RM-1", kind: 0 }, uoM: { symbol: "mg" },
    batches: [{ quantityToTake: 30_000_000, batch: { id: "b1", batchNumber: "B-1", expiryDate: "2099-01-01T00:00:00Z" } }, { quantityToTake: 20_000_000, batch: { id: "b2", batchNumber: "B-2", expiryDate: "2099-06-01T00:00:00Z", isReturn: true } }] }], ...extra });
interface Call { method: string; path: string; body?: unknown }
function open(address: string, permissions: string[], record: object = requisition("sr-1"), extra: (path: string, method: string) => Response | null = () => null) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    calls.push({ method: input.method, path, ...(input.method === "POST" && path.endsWith("/swap") ? { body: await input.clone().json() } : {}) });
    const other = extra(path, input.method);
    if (other) return other;
    if (path === "/api/v1/requisition/department") return Response.json({ data: [requisition("sr-1"), requisition("sr-2", { approved: false, status: 0 })], pageIndex: 1, pageCount: 1, totalRecordCount: 2 });
    if (path === "/api/v1/requisition/sr-1") return Response.json(record);
    if (path === "/api/v1/requisition/issue-stock-requisition/sr-1") return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/warehouse/stock-requisition", element: <StockRequisitionsPage /> }, { path: "/warehouse/stock-requisition/:id", element: <IssueStockRequisitionPage /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET").map(({ method, path }) => ({ method, path }));

it("lists the store's requisitions with where each stands", async () => {
  open("/warehouse/stock-requisition", ["CanViewRawMaterialRequisitions"]);
  expect(await screen.findByText("SR-1")).toBeTruthy();
  expect(screen.getByText("Ready to issue")).toBeTruthy();
  expect(screen.getByText("Awaiting approval")).toBeTruthy();
});

it("issues only after a confirmation, and only to someone who may issue that kind", async () => {
  const user = userEvent.setup();
  open("/warehouse/stock-requisition/sr-1", ["CanViewRawMaterialRequisitions"]);
  expect(await screen.findByText("B-1")).toBeTruthy();
  expect(screen.getByText("Returned stock")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Issue stock" })).toBeNull();
  cleanup();
  open("/warehouse/stock-requisition/sr-1", ["CanIssuePackagingMaterialRequisitions"]);
  // A raw material requisition is not opened with the packaging permission.
  await waitFor(() => expect(screen.queryByText("B-1")).toBeNull());
  expect(screen.queryByRole("button", { name: "Issue stock" })).toBeNull();
  cleanup();
  const { calls, router } = open("/warehouse/stock-requisition/sr-1", ["CanViewRawMaterialRequisitions", "CanIssueRawMaterialRequisitions"]);
  await user.click(await screen.findByRole("button", { name: "Issue stock" }));
  expect(writes(calls)).toEqual([]);
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Issue stock" }));
  await waitFor(() => expect(writes(calls)).toEqual([{ method: "POST", path: "/api/v1/requisition/issue-stock-requisition/sr-1" }]));
  await waitFor(() => expect(router.state.location.pathname).toBe("/warehouse/stock-requisition"));
}, 20_000);

it("will not issue from an expired batch, or before approval", async () => {
  const expired = requisition("sr-1", { items: [{ id: "l1", quantity: 5, material: { name: "Lactose", kind: 0 }, uoM: { symbol: "kg" }, batches: [{ quantityToTake: 5, batch: { id: "b1", batchNumber: "OLD-1", expiryDate: "2020-01-01T00:00:00Z" } }] }] });
  open("/warehouse/stock-requisition/sr-1", ["CanIssueRawMaterialRequisitions"], expired);
  expect(await screen.findByText(/has expired or expires today/)).toBeTruthy();
  expect((screen.getByRole("button", { name: "Issue stock" }) as HTMLButtonElement).disabled).toBe(true);
  cleanup();
  open("/warehouse/stock-requisition/sr-1", ["CanIssueRawMaterialRequisitions"], requisition("sr-1", { approved: false, status: 0 }));
  expect(await screen.findByText(/waiting for approval. Stock is issued once/)).toBeTruthy();
  expect((screen.getByRole("button", { name: "Issue stock" }) as HTMLButtonElement).disabled).toBe(true);
});

const lot = (id: string, expiryDate: string) => ({ id, batchNumber: id.toUpperCase(), expiryDate, uoM: { id: "u-mg", symbol: "mg" } });
const alternatives = [{ material: { id: "m1", name: "Maize starch", code: "RM-1" },
  currentReservedBatches: [{ batch: lot("b1", "2099-01-01T00:00:00Z"), quantityToTake: 30_000_000, warehouseLocationShelfId: "s1" }, { batch: lot("b2", "2099-06-01T00:00:00Z"), quantityToTake: 20_000_000, warehouseLocationShelfId: "s1" }],
  alternativeBatches: [{ batch: lot("a2", "2098-09-01T00:00:00Z"), quantityAvailable: 100_000_000, warehouse: { id: "w2", name: "Beta raw store" }, warehouseLocationShelfId: "s8" },
    { batch: lot("a1", "2098-03-01T00:00:00Z"), quantityAvailable: 10_000_000, warehouse: { id: "w2", name: "Beta raw store" }, warehouseLocationShelfId: "s9" },
    { batch: lot("a3", "2099-03-01T00:00:00Z"), quantityAvailable: 5_000_000, warehouse: { id: "w3", name: "Gamma raw store" }, warehouseLocationShelfId: "s7" }] }];
const shelf = (id: string, batchId: string, shelfId: string, quantity: number, warehouse: string) => ({ id, quantity, uoM: { id: "u-mg" }, materialBatch: { id: batchId }, warehouseLocationShelf: { id: shelfId, warehouseLocationRack: { warehouseLocation: { warehouse: { id: warehouse } } } } });
const shelves = [shelf("r1", "b1", "s1", 30_000_000, "w1"), shelf("r2", "b2", "s1", 20_000_000, "w1"), shelf("r8", "a2", "s8", 100_000_000, "w2"), shelf("r9", "a1", "s9", 4_000_000, "w2"), shelf("r7", "a3", "s7", 5_000_000, "w3")];

it("pairs each batch set aside with earlier batches, soonest first, and never offers stock twice", () => {
  expect([expiresEarlier("2026-01-01", "2026-01-02"), expiresEarlier("2026-01-02T08:00:00", "2026-01-02T20:00:00"), expiresEarlier(null, "2026-01-02"), expiresEarlier("2026-01-01", null)]).toEqual([true, false, false, false]);
  const rows = swapSuggestions(alternativesSchema.parse(alternatives));
  // b1 takes all of the soonest batch (a1) and the rest from a2; b2 is covered by what a2 has left, so a3 is not needed.
  expect(rows.map((row) => [row.current.number, row.alternative.number, row.quantity, row.partial])).toEqual([["B1", "A1", 10_000_000, true], ["B1", "A2", 20_000_000, true], ["B2", "A2", 20_000_000, false]]);
  // 25 of b1 already waits in another swap: only the remaining 5 is offered.
  expect(swapSuggestions(alternativesSchema.parse(alternatives), new Map([["b1", 25_000_000]])).filter((row) => row.current.number === "B1").map((row) => row.quantity)).toEqual([5_000_000]);
  const records = shelfRecordsSchema.parse(shelves);
  expect(swapRequestFor(rows[1]!, records, "sr-1")).toEqual({ body: { firstWarehouseId: "w1", secondWarehouseId: "w2", stockRequisitionId: "sr-1",
    firstSwapShelfMaterialBatches: [{ shelfMaterialBatchId: "r1", materialBatchId: "b1", uoMId: "u-mg", quantity: 20_000_000 }], secondSwapShelfMaterialBatches: [{ shelfMaterialBatchId: "r8", materialBatchId: "a2", uoMId: "u-mg", quantity: 20_000_000 }] } });
  // The other store has since used some of a1.
  expect(swapRequestFor(rows[0]!, records, "sr-1")).toEqual({ reason: "Beta raw store now holds less of the batch than the swap needs." });
  expect(swapRequestFor(rows[0]!, records.filter((record) => record.id !== "r1"), "sr-1")).toEqual({ reason: "The batch set aside is no longer on its shelf." });
});

const swapBackend = (path: string, method: string) => {
  if (path === "/api/v1/requisition/sr-1/alternative-batches") return Response.json(alternatives);
  if (path === "/api/v1/material/m1/shelf") return Response.json(shelves);
  if (path === "/api/v1/warehouse/swap") return method === "POST" ? new Response(null, { status: 204 }) : Response.json({ data: [], pageIndex: 1, pageCount: 1, totalRecordCount: 0 });
  return null;
};
it("asks for the chosen swaps one at a time after a review, and says which could not be asked for", async () => {
  const user = userEvent.setup();
  open("/warehouse/stock-requisition/sr-1", ["CanViewRawMaterialRequisitions"], requisition("sr-1"), swapBackend);
  const viewing = await screen.findByRole("region", { name: "Earlier batches in other stores" });
  expect(await within(viewing).findByText("A1")).toBeTruthy();
  // Someone who may only look cannot choose swaps.
  expect(within(viewing).queryByRole("checkbox", { name: "Select row" })).toBeNull();
  expect(within(viewing).queryByRole("button", { name: /Review swaps/ })).toBeNull();
  cleanup();
  const { calls } = open("/warehouse/stock-requisition/sr-1", ["CanViewRawMaterialRequisitions", "CanIssueRawMaterialRequisitions"], requisition("sr-1"), swapBackend);
  const panel = await screen.findByRole("region", { name: "Earlier batches in other stores" });
  const boxes = await within(panel).findAllByRole("checkbox", { name: "Select row" });
  expect(boxes).toHaveLength(3);
  expect((within(panel).getByRole("button", { name: "Review swaps (0)" }) as HTMLButtonElement).disabled).toBe(true);
  await user.click(boxes[0]!);
  await user.click(boxes[1]!);
  await user.click(within(panel).getByRole("button", { name: "Review swaps (2)" }));
  expect(writes(calls)).toEqual([]);
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Ask for 2 swaps" }));
  // The first is refused before sending (the shelf now holds less); the second is sent on its own.
  expect(await within(dialog).findByText(/Not asked for: Beta raw store now holds less/)).toBeTruthy();
  const posts = calls.filter((call) => call.method === "POST");
  expect(posts).toHaveLength(1);
  expect(posts[0]?.body).toMatchObject({ firstWarehouseId: "w1", secondWarehouseId: "w2", stockRequisitionId: "sr-1", firstSwapShelfMaterialBatches: [{ shelfMaterialBatchId: "r1", quantity: 20_000_000 }], secondSwapShelfMaterialBatches: [{ shelfMaterialBatchId: "r8", quantity: 20_000_000 }] });
  // Only the refused swap is still chosen.
  expect(within(dialog).getByRole("button", { name: "Try again" })).toBeTruthy();
  expect(within(dialog).getAllByRole("listitem")).toHaveLength(1);
}, 20_000);

it("offers no swaps once the stock has been issued", async () => {
  const { calls } = open("/warehouse/stock-requisition/sr-1", ["CanViewRawMaterialRequisitions", "CanIssueRawMaterialRequisitions"], requisition("sr-1", { status: 3 }), swapBackend);
  expect(await screen.findByText("B-1")).toBeTruthy();
  expect(screen.queryByRole("region", { name: "Earlier batches in other stores" })).toBeNull();
  expect(calls.some((call) => call.path.endsWith("/alternative-batches"))).toBe(false);
});
