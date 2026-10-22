// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useSession } from "@/shared/auth/session-provider";
import { canAccess } from "@/shared/auth/access";
import { routeAccessPolicy, resolveQueryAccess } from "@/modules/registry-model";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { openMenu } from "@/test/menu";
import { ProductionTransferListPage } from "./components/transfer-list-page";
import { ProductionTransferDetailPage } from "./components/transfer-detail-page";
import { manifest } from "./manifest";
import { decisionProblem, sameDecisionEvidence, statusLabel, transferSchema } from "./lib/transfers";

const departmentId = "558da105-a506-44a9-8ff5-8d005a54f294";
const permissions = ["CanViewIncomingStockTransferRequests", "CanViewOutgoingStockTransferRequests", "CanApproveIncomingStockTransferRequest"];
const transfer = (status = 0) => ({ id: "t1", status, quantity: 1250, fromDepartment: { id: departmentId, name: "Production A" }, toDepartment: { id: "destination", name: "Production B" }, material: { id: "m1", code: "M01", name: "Lactose" }, uoM: { id: "u1", symbol: "g" }, createdAt: "2026-10-20T10:00:00Z", reason: "<p>Batch shortage</p>" });
function RefreshAccess() { const session = useSession(); return <button onClick={() => void session.refresh()}>Recheck access</button>; }
function open(address = "/production/stock-transfer-requests", granted = permissions) {
  const backend = stubBackend({ permissions: granted });
  const auth = backend.fetcher.getMockImplementation();
  const state = { record: transfer(), fail: false };
  const calls: { path: string; method: string; module: string | null; subModule: string | null; search: string }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ path: url.pathname, method: input.method, search: url.search, module: input.headers.get("Module"), subModule: input.headers.get("SubModule") });
    if (input.method !== "GET") return new Response(null, { status: state.fail ? 409 : 204 });
    if (url.pathname.endsWith("/in-bound")) return Response.json({ data: [state.record], pageIndex: 1, totalRecordCount: 1 });
    if (url.pathname.endsWith("/out-bound")) return Response.json({ data: [{ ...state.record, fromDepartment: state.record.toDepartment, toDepartment: state.record.fromDepartment }], pageIndex: 1, totalRecordCount: 1 });
    if (url.pathname.endsWith("/stock-transfer/t1")) return Response.json(state.record);
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([
    { path: "/production/stock-transfer-requests", element: <ProductionTransferListPage /> },
    { path: "/production/stock-transfer-requests/:id/details", element: <ProductionTransferDetailPage /> },
  ], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RefreshAccess /><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { backend, state, calls, writes: () => calls.filter((call) => call.method !== "GET") };
}
afterEach(() => { cleanup(); forgetSession(); });

it("keeps review, direction and department policy independent", () => {
  const context = { state: "authenticated" as const, permissions: new Set([permissions[1] ?? ""]) };
  expect(canAccess(manifest.access, context)).toBe(true);
  expect(resolveQueryAccess(manifest.query, "?type=0", context)).toEqual({ state: "redirect", search: "?type=1" });
  expect(routeAccessPolicy([manifest], "/production/stock-transfer-requests/t1/details")).not.toBeNull();
  expect(decisionProblem(transferSchema.parse(transfer()), "wrong")).toContain("supplying department");
  for (const status of [1, 2, 3, 99]) expect(decisionProblem(transferSchema.parse(transfer(status)), departmentId)).toContain("no longer");
  expect(statusLabel(undefined)).toBe("Not recorded");
  expect(statusLabel(99)).toBe("Unknown (99)");
  expect(sameDecisionEvidence(transferSchema.parse(transfer()), transferSchema.parse({ ...transfer(), quantity: 2 }))).toBe(false);
});

it("lists the material, amount, reason and status without HTML tags and follows outgoing requests", async () => {
  const user = userEvent.setup(); const page = open();
  await screen.findByText("Lactose");
  expect(screen.getByText("1.25 kg")).toBeTruthy();
  expect(screen.getByText("Batch shortage")).toBeTruthy();
  expect(page.writes()).toHaveLength(0);
  await user.click(screen.getByRole("button", { name: "Outgoing requests" }));
  await waitFor(() => expect(page.calls.some((call) => call.path.endsWith("/out-bound") && !call.search.includes("status="))).toBe(true));
  expect(screen.queryByRole("menuitem", { name: "Approve" })).toBeNull();
});

it("requires confirmation, rereads evidence, and sends the proper audit headers", async () => {
  const user = userEvent.setup(); const page = open(); await screen.findByText("Lactose");
  await openMenu(/Actions for Lactose/); await user.click(screen.getByRole("menuitem", { name: "Approve" }));
  expect(page.writes()).toHaveLength(0);
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Approve transfer" }));
  await waitFor(() => expect(page.writes()).toHaveLength(1));
  expect(page.calls.findIndex((call) => call.path.endsWith("/stock-transfer/t1"))).toBeLessThan(page.calls.findIndex((call) => call.method === "PUT"));
  expect(page.writes()[0]).toMatchObject({ method: "PUT", path: "/api/v1/production-schedule/stock-transfer/approve/t1", module: "Production", subModule: "Stock Transfer Requests" });
});

it("refuses a changed quantity instead of approving stale evidence", async () => {
  const user = userEvent.setup(); const page = open(); await screen.findByText("Lactose");
  await openMenu(/Actions for Lactose/); await user.click(screen.getByRole("menuitem", { name: "Approve" }));
  page.state.record = { ...transfer(), quantity: 2000 };
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Approve transfer" }));
  expect((await screen.findByRole("alert")).textContent).toContain("changed after you opened");
  expect(page.writes()).toHaveLength(0);
});

it("refuses an already issued transfer returned by the preflight", async () => {
  const user = userEvent.setup(); const page = open(); await screen.findByText("Lactose");
  await openMenu(/Actions for Lactose/); await user.click(screen.getByRole("menuitem", { name: "Reject" }));
  page.state.record = transfer(2);
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Reject transfer" }));
  expect((await screen.findByRole("alert")).textContent).toContain("no longer awaiting"); expect(page.writes()).toHaveLength(0);
});

it("hides decisions from viewers and denies a detail in the wrong department", async () => {
  open("/production/stock-transfer-requests", [permissions[0] ?? ""]); await screen.findByText("Lactose");
  await openMenu(/Actions for Lactose/); expect(screen.queryByRole("menuitem", { name: "Approve" })).toBeNull();
  cleanup(); forgetSession();
  const page = open("/production/stock-transfer-requests/t1/details"); page.state.record.fromDepartment.id = "other";
  expect(await screen.findByText(/don't have access/i)).toBeTruthy(); expect(page.writes()).toHaveLength(0);
});

it("does not automatically retry a failed rejection", async () => {
  const user = userEvent.setup(); const page = open(); page.state.fail = true; await screen.findByText("Lactose");
  await openMenu(/Actions for Lactose/); await user.click(screen.getByRole("menuitem", { name: "Reject" }));
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Reject transfer" }));
  await screen.findByRole("alert"); expect(page.writes()).toHaveLength(1); expect(screen.getByRole("dialog")).toBeTruthy();
});
