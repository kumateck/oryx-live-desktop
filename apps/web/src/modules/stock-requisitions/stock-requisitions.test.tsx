// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { canAccess } from "@/shared/auth/access";
import { SessionProvider } from "@/shared/auth/session-provider";
import { Store } from "@/shared/inventory/stores";
import { workflowRule } from "@/shared/inventory/workflows";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { modules } from "../registry";
import { routeAccessPolicy, resolveQueryAccess } from "../registry-model";
import { StockRequisitionDetailPage } from "./components/requisition-detail";
import { issueBlocker, sameIssueEvidence, stockRequisitionSchema } from "./lib/stock-requisitions";

const requisition = (overrides: Record<string, unknown> = {}, issued = 0) => ({
  id: "r1", number: "SR-0001", createdAt: "2026-10-20T08:00:00Z", justification: "Lab consumables", status: issued ? 1 : 0, store: Store.General, issueHistoryAttributed: true,
  requestedBy: { id: "u2", firstName: "Esi", lastName: "Boateng" }, department: { id: "d1", name: "Quality" },
  requisitionItems: [
    { id: "l1", itemId: "i1", quantityRequested: 5, quantityIssued: issued, quantityRemaining: 5 - issued,
      item: { id: "i1", code: "GLV", name: "Gloves", store: Store.General, availableQuantity: 3, isActive: true, classification: 1, unitOfMeasure: { name: "Box", symbol: "bx" } } },
    { id: "l2", itemId: "i2", quantityRequested: 2, quantityIssued: 0, quantityRemaining: 2,
      item: { id: "i2", code: "PPR", name: "Paper", store: Store.General, availableQuantity: 10, isActive: true, classification: 1, unitOfMeasure: { name: "Ream", symbol: "rm" } } },
  ], ...overrides,
});
const issuer = ["CanViewGeneralStoreIssueStocks", "CanCreateGeneralStoreIssueStock"];

function open(address: string, granted: string[]) {
  const backend = stubBackend({ permissions: granted });
  const auth = backend.fetcher.getMockImplementation();
  const state = { record: requisition() };
  const calls: { path: string; method: string; body: unknown; subModule: string | null }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ path: url.pathname, method: input.method, subModule: input.headers.get("SubModule"), body: input.method === "GET" ? null : await input.clone().json().catch(() => null) });
    if (input.method !== "GET") return new Response(null, { status: 204 });
    if (url.pathname === "/api/v1/items/stock-requisitions/r1") return Response.json(state.record);
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([
    { path: "/extrals/issue-stock/:id", element: <StockRequisitionDetailPage mode="issue" /> },
    { path: "/extrals/stock-requisitions/:id/details", element: <StockRequisitionDetailPage mode="raise" /> },
  ], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { state, writes: () => calls.filter((c) => c.method !== "GET") };
}
afterEach(() => { cleanup(); forgetSession(); });

it("routes each store to its own keys and redirects to a store the user may open", () => {
  const context = { state: "authenticated" as const, permissions: new Set(["CanViewItStoreStockRequisitions"]) };
  const policy = routeAccessPolicy(modules, "/extrals/stock-requisitions");
  expect(policy?.access && canAccess(policy.access, context)).toBe(true);
  expect(policy?.query && resolveQueryAccess(policy.query, "?storeType=1", context)).toEqual({ state: "redirect", search: "?storeType=0" });
  expect(canAccess(workflowRule(Store.IT, "issueStock", "create"), { state: "authenticated", permissions: new Set(["CanCreateItStoreIssueStock"]) })).toBe(false);
  expect(routeAccessPolicy(modules, "/extrals/issue-stock/r1")).not.toBeNull();
});

it("knows when nothing more can be issued and when issues changed meanwhile", () => {
  const read = stockRequisitionSchema.parse(requisition());
  expect(issueBlocker(read)).toBeNull();
  expect(issueBlocker(stockRequisitionSchema.parse(requisition({ issueHistoryAttributed: false })))).toContain("reconciled");
  expect(issueBlocker(stockRequisitionSchema.parse(requisition({ status: 2 })))).toContain("issued");
  expect(sameIssueEvidence(read, stockRequisitionSchema.parse(requisition({}, 1)))).toBe(false);
});

it("issues the entered quantities per item after a confirmation and a fresh read", async () => {
  const user = userEvent.setup(); const page = open("/extrals/issue-stock/r1", issuer);
  // Defaults to what remains, capped by stock.
  expect((await screen.findByLabelText("Issue now: Gloves") as HTMLInputElement).value).toBe("3");
  await user.clear(screen.getByLabelText("Issue now: Paper"));
  await user.click(screen.getByRole("button", { name: "Issue stock" }));
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Issue stock" }));
  await waitFor(() => expect(page.writes()).toHaveLength(1));
  expect(page.writes()[0]).toMatchObject({ path: "/api/v1/items/stock-requisitions/r1/issue-stock-against-requisition", subModule: "Issue Stock",
    body: { quantitiesToIssue: [{ itemId: "i1", quantity: 3 }] } });
});

it("refuses quantities above what remains or is in stock", async () => {
  const user = userEvent.setup(); open("/extrals/issue-stock/r1", issuer);
  const gloves = await screen.findByLabelText("Issue now: Gloves");
  await user.clear(gloves); await user.type(gloves, "4");
  expect(await screen.findByText("Only 3 bx are in stock.")).toBeTruthy();
  expect((screen.getByRole("button", { name: "Issue stock" }) as HTMLButtonElement).disabled).toBe(true);
});

it("sends nothing when stock was issued after the page was opened", async () => {
  const user = userEvent.setup(); const page = open("/extrals/issue-stock/r1", issuer);
  await screen.findByLabelText("Issue now: Gloves");
  await user.click(screen.getByRole("button", { name: "Issue stock" }));
  page.state.record = requisition({}, 2);
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Issue stock" }));
  // The refusal stays on the page even after the fresh read replaces the form and its dialog.
  await waitFor(() => expect(screen.getAllByText(/issued against this requisition since you opened it/).some((n) => !n.closest("[role=dialog]"))).toBe(true));
  // The page now shows the fresh issued quantity.
  expect(within(screen.getByRole("region", { name: "Requisition items" })).getByText("2 bx")).toBeTruthy();
  expect(page.writes()).toHaveLength(0);
});

it("shows the requisition without issue controls to someone who may only view", async () => {
  open("/extrals/issue-stock/r1", ["CanViewGeneralStoreIssueStocks"]);
  expect(await screen.findByText(/not issue stock from this store/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Issue stock" })).toBeNull();
});

it("offers editing only while nothing has been issued", async () => {
  open("/extrals/stock-requisitions/r1/details", ["CanViewGeneralStoreStockRequisitions", "CanCreateGeneralStoreStockRequisition"]);
  expect(await screen.findByRole("button", { name: "Edit" })).toBeTruthy();
  cleanup(); forgetSession();
  const page = open("/extrals/stock-requisitions/r1/details", ["CanViewGeneralStoreStockRequisitions", "CanCreateGeneralStoreStockRequisition"]);
  page.state.record = requisition({}, 1);
  await screen.findByText("Partly issued");
  expect(screen.queryByRole("button", { name: "Edit" })).toBeNull();
});
