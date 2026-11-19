// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import PendingApprovalPage from "@/pages/(workspace)/qa/pending-approvals/[type]/[id]/page";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { entity } from "./__fixtures__/approval-records";
import { stockRejectionKind } from "../lib/stock-rejection";

afterEach(() => { cleanup(); forgetSession(); });
function open(kind: 0 | 1, allowed: boolean) {
  const backend = stubBackend({ permissions: ["CanViewPendingApprovals", "CanApprovePendingApproval", "CanViewRequisitions", allowed
    ? kind === 0 ? "CanRejectRawMaterialStockRequisition" : "CanRejectPackagingMaterialStockRequisition"
    : kind === 0 ? "CanRejectPackagingMaterialStockRequisition" : "CanRejectRawMaterialStockRequisition"] });
  rememberSession();
  const session = backend.fetcher.getMockImplementation();
  const writes: { path: string; body: object }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === "/api/v1/approval/my-pending/StockRequisition/stock-1") return Response.json(entity("StockRequisition", "stock-1", { contentRevision: 2 }));
    if (path === "/api/v1/requisition/stock-1") return Response.json({ id: "stock-1", code: "RM/26/1", contentRevision: 2, requisitionType: 0, status: 0,
      productionScheduleProduct: { batchNumber: "PROD-26-1", product: { name: "Syrup" } }, items: [{ id: "line-1", material: { id: "m-1", kind, name: "Glycerin" },
        quantity: 20, uoM: { symbol: "kg" }, batches: [{ quantityToTake: 25, batch: { batchNumber: "LOT-26-2", uoM: { symbol: "l" } } }] }] });
    if (path.startsWith("/api/v1/production-stock-requisitions/stock-1/")) {
      writes.push({ path, body: await input.clone().json() }); return new Response(null, { status: 204 });
    }
    return session ? session(input, init) : new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/qa/pending-approvals/:type/:id", element: <PendingApprovalPage /> }, { path: "/qa/pending-approvals", element: <p>Back to queue</p> }], {
    initialEntries: ["/qa/pending-approvals/StockRequisition/stock-1"],
  });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return writes;
}

it.each([0, 1] as const)("shows production and physical material batches and rejects kind %s with a recorded reason", async kind => {
  const user = userEvent.setup(); const writes = open(kind, true);
  expect(await screen.findByText("PROD-26-1")).toBeTruthy();
  expect(await screen.findByText("LOT-26-2")).toBeTruthy();
  expect(screen.getByText(/25 L/i)).toBeTruthy();
  await user.click(await screen.findByRole("button", { name: "Reject" }));
  const dialog = within(screen.getByRole("dialog"));
  await user.type(await dialog.findByRole("textbox", { name: /Reason for rejecting/ }), "Correct the requested materials");
  await user.click(dialog.getByRole("button", { name: "Reject request" }));
  await waitFor(() => {
    const problem = dialog.queryByRole("alert");
    if (problem) throw new Error(problem.textContent ?? "Rejection failed");
    expect(writes).toHaveLength(1);
  });
  await waitFor(() => expect(writes).toEqual([{ path: `/api/v1/production-stock-requisitions/stock-1/${kind === 0 ? "raw" : "packaging"}/reject`,
    body: { reason: "Correct the requested materials", contentRevision: 2 } }]));
}, 30_000);

it.each([0, 1] as const)("does not allow kind %s rejection with the other material's permission", async kind => {
  const writes = open(kind, false);
  await screen.findByText("PROD-26-1");
  await waitFor(() => expect(screen.queryByRole("button", { name: "Reject" })).toBeNull());
  expect(writes).toHaveLength(0);
});

it("does not infer a stock kind from mixed, empty or non-stock evidence", () => {
  for (const data of [{ requisitionType: 0, items: [] }, { requisitionType: 0, items: [{ material: { kind: 0 } }, { material: { kind: 1 } }] }, { requisitionType: 1, items: [{ material: { kind: 0 } }] }])
    expect(stockRejectionKind({ entries: [{ url: "/api/v1/requisition/r", data }] })).toBeNull();
});
