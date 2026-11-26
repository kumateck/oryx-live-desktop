// @vitest-environment jsdom
import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useCurrentUser } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { stockTraceSchema } from "../schemas/stock-trace";
import { ApprovedMaterialDetail } from "./approved-material-detail";
import { StockTracePrint } from "./stock-trace-print";

const material = { id: "m1", code: "RMV006", name: "Vanilla Powder", kind: 0 as const, category: "Flavours", pharmacopoeia: "BP" };
const trace = {
  materialId: "m1", materialCode: "RMV006", materialName: "Vanilla Powder", materialKind: 0, category: "Flavours", pharmacopoeia: "BP",
  departmentId: "558da105-a506-44a9-8ff5-8d005a54f294", departmentName: "Tablet", unit: "kg", periodStart: "2026-11-01T00:00:00Z", generatedAt: "2026-11-25T12:00:00Z",
  openingBalance: 10, received: 10, issued: 5, ledgerClosing: 15, storeStock: 15, reservedStock: 2, freeStock: 13, expiredStock: 0, unavailableStock: 0,
  productionFloorStock: 3, consumedStock: 2, inTransitStock: 0, ledgerGap: 0, gaps: [],
  rows: [
    { id: "s1", materialBatchId: "lot1", materialBatchNumber: "LOT-SHELF", state: 0, quantity: 15, unit: "kg", warehouse: "Tablet raw", shelf: "T/A", evidence: "Shelf stock" },
    { id: "r1", materialBatchId: "lot1", materialBatchNumber: "LOT-RESERVED", state: 1, quantity: 2, unit: "kg", warehouse: "Tablet raw", reference: "PS007", product: "Lufart", productBatchNumber: "BATCH-RESERVED", evidence: "Unissued production reservation" },
    { id: "f1", materialBatchId: "lot1", materialBatchNumber: "LOT-FLOOR", state: 2, quantity: 3, unit: "kg", warehouse: "Tablet floor", reference: "PS007", product: "Lufart", productBatchNumber: "BATCH-FLOOR", evidence: "Issued allocation" },
    { id: "c1", materialBatchId: "lot1", materialBatchNumber: "LOT-CONSUMED", state: 3, quantity: 2, unit: "kg", warehouse: "Tablet floor", reference: "PS007", product: "Lufart", productBatchNumber: "BATCH-CONSUMED", evidence: "Recorded consumption event", actor: "Store operator", occurredAt: "2026-11-24T09:00:00Z" },
  ],
  ledgerRows: [{ id: "b1", materialBatchId: "lot1", materialBatchNumber: "LOT-LEDGER", occurredAt: "2026-11-13T16:01:00Z", description: "Stock transfer RM/B/25/011 received", reference: "RM/B/25/011", arNumber: "AR-1", warehouse: "Tablet raw", unit: "kg", received: 10, issued: 0, balance: 15 }],
};
afterEach(() => { cleanup(); forgetSession(); });
let materialCase = 0;
function open(tab: string, permissions = ["CanViewApprovedRawMaterials", "CanViewMaterialBinCard", "CanViewRawMaterialStockTrace", "CanPrintRawMaterialStockTrace"], failure = false) {
  const selectedMaterial = { ...material, id: `m-${++materialCase}` };
  const backend = stubBackend({ permissions }); rememberSession(); const session = backend.fetcher.getMockImplementation();
  const requests: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (input instanceof Request) {
      const url = new URL(input.url); requests.push(url.pathname);
      if (url.pathname.startsWith("/api/v1/material-stock-trace/")) return failure ? Response.json({ title: "Unavailable" }, { status: 500 }) : Response.json({ ...trace, materialId: selectedMaterial.id });
      if (url.pathname.includes("/batches/v2/") || url.pathname.includes("/bincardinformation/")) return Response.json({ data: [], totalRecordCount: 0, pageCount: 0, pageIndex: 1 });
      if (url.pathname.endsWith("/reserved")) return Response.json([]);
    }
    return session ? session(input, init) : new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: <ApprovedMaterialDetail material={selectedMaterial} /> }], { initialEntries: [`/?tab=${tab}`] });
  function Workspace() { return useCurrentUser() ? <ApiProvider><RouterProvider router={router} /></ApiProvider> : null; }
  render(<SessionProvider><Workspace /></SessionProvider>);
  return requests;
}

it("keeps the bin card closed without its dedicated permission", async () => {
  const requests = open("bin-card", ["CanViewApprovedRawMaterials", "CanViewRawMaterialStockTrace"]);
  await screen.findByRole("tab", { name: "Stock by batch" });
  expect(screen.queryByRole("tab", { name: "Bin card" })).toBeNull();
  expect(requests.some((path) => path.includes("/bincardinformation/"))).toBe(false);
});

it("denies trace tabs and all trace requests without the material kind's permission", async () => {
  const requests = open("consumed", ["CanViewApprovedRawMaterials", "CanViewPackagingMaterialStockTrace"]);
  await screen.findByRole("tab", { name: "Stock by batch" });
  expect(screen.queryByRole("tab", { name: "Consumed" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Print material details" })).toBeNull();
  expect(requests.some((path) => path.includes("/material-stock-trace/"))).toBe(false);
});

it.each([
  ["stock", "Print stock by batch", "LOT-SHELF", "LOT-CONSUMED"],
  ["bin-card", "Print bin card", "LOT-LEDGER", "LOT-SHELF"],
  ["reserved", "Print reserved", "LOT-RESERVED", "LOT-CONSUMED"],
  ["floor", "Print production floor", "LOT-FLOOR", "LOT-CONSUMED"],
  ["consumed", "Print consumed", "LOT-CONSUMED", "LOT-FLOOR"],
])("prints %s separately with material information first", async (tab, label, included, excluded) => {
  open(tab);
  await userEvent.click(await screen.findByRole("button", { name: label }));
  const dialog = await screen.findByRole("dialog");
  await within(dialog).findByText(new RegExp(included));
  expect(within(dialog).getByText("Material code")).toBeTruthy();
  expect(within(dialog).getAllByText("RMV006").length).toBeGreaterThan(0);
  expect(within(dialog).getByText("Tablet")).toBeTruthy();
  expect(within(dialog).queryByText(excluded)).toBeNull();
  expect(within(dialog).getByRole("button", { name: "Print" }).hasAttribute("disabled")).toBe(false);
});

it("prints combined material details with all five sections from one complete snapshot", async () => {
  const requests = open("stock");
  await userEvent.click(await screen.findByRole("button", { name: "Print material details" }));
  const dialog = await screen.findByRole("dialog");
  await within(dialog).findByText(/LOT-SHELF/);
  for (const heading of ["Stock by batch", "Bin card", "Reserved stock", "Production-floor stock", "Consumed stock"])
    expect(within(dialog).getByRole("heading", { name: heading })).toBeTruthy();
  expect(within(dialog).getByText("LOT-CONSUMED")).toBeTruthy();
  expect(within(dialog).getByText("Bin card difference")).toBeTruthy();
  expect(requests.filter((path) => path.includes("/material-stock-trace/"))).toHaveLength(1);
});

it("does not print an incomplete or failed snapshot as a report", async () => {
  open("stock", undefined, true);
  await userEvent.click(await screen.findByRole("button", { name: "Print material details" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByRole("button", { name: "Print" }).hasAttribute("disabled")).toBe(true);
  expect(stockTraceSchema.safeParse({ ...trace, ledgerClosing: undefined }).success).toBe(false);
});

it("prints every bin-card entry beyond the old 500-row limit", () => {
  const rows = Array.from({ length: 501 }, (_, index) => ({ ...trace.ledgerRows[0], id: `ledger-${index}`, description: `Entry ${index}`, reference: `REF-${index}` }));
  const snapshot = stockTraceSchema.parse({ ...trace, ledgerRows: rows });
  render(<SessionProvider><StockTracePrint data={snapshot} view="bin-card" onClose={() => {}} /></SessionProvider>);
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByText("REF-500")).toBeTruthy();
  expect(within(dialog).getAllByRole("row")).toHaveLength(502);
});
