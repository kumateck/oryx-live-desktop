// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { StockIssueListPage } from "./stock-issue-pages";
import { leftoverRepairPermissions } from "../schemas/unstart-leftovers";

afterEach(() => { cleanup(); forgetSession(); });
const first = "11111111-1111-4111-8111-111111111111";
const blocked = "22222222-2222-4222-8222-222222222222";
const receipt = "33333333-3333-4333-8333-333333333333";
const preview = (token = "a".repeat(64)) => ({ previewToken: token, requisitions: [
  { requisitionId: first, code: "RQ/OLD/001", batchNumber: "B-OLD", unstartRepairId: receipt, unstartedAt: "2026-11-01T10:00:00Z", materialCount: 2, blockers: [] },
  { requisitionId: blocked, code: "RQ/ISSUED/002", batchNumber: "B-ISSUED", unstartRepairId: receipt, unstartedAt: "2026-11-01T10:00:00Z", materialCount: 1, blockers: ["Stock has already been issued or received for this request."] },
] });

function open(kind: 0 | 1, allowed = true, failFirst = false) {
  const view = kind === 0 ? "CanViewRawMaterialRequisitions" : "CanViewPackagingMaterialRequisitions";
  const backend = stubBackend({ permissions: [view, ...(allowed ? [leftoverRepairPermissions[kind]] : [])] });
  rememberSession();
  const session = backend.fetcher.getMockImplementation();
  const writes: { requestId: string; requisitionIds: string[]; reason: string; previewToken: string }[] = [];
  let queueReads = 0; let previewReads = 0;
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === `/api/v1/stock-issue/${kind === 0 ? "raw" : "packaging"}`) { queueReads++; return Response.json({ requisitions: { data: [], pageIndex: 1, pageCount: 1, totalRecordCount: 0 }, products: [] }); }
    if (path === `/api/v1/unstart-leftovers/${kind === 0 ? "raw" : "packaging"}`) {
      if (input.method === "GET") { previewReads++; return Response.json(preview()); }
      writes.push(await input.clone().json());
      if (failFirst && writes.length === 1) return Response.json({ title: "Conflict", detail: "Stock evidence changed." }, { status: 409 });
      expect(input.headers.get("Module")).toBe("Warehouse");
      return Response.json({ repairId: receipt, cancelledCount: 1, alreadyApplied: writes.length > 1 });
    }
    return session ? session(input, init) : new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/warehouse/stock-requisition", element: <StockIssueListPage /> }], {
    initialEntries: [`/warehouse/stock-requisition?type=${kind}`],
  });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { writes, reads: () => ({ queue: queueReads, preview: previewReads }) };
}

it.each([0, 1] as const)("hides the repair without the dedicated permission for kind %s", async kind => {
  const state = open(kind, false);
  await screen.findByText("No requisitions are awaiting issue");
  expect(screen.queryByRole("button", { name: "Repair Unstart leftovers" })).toBeNull();
  expect(state.reads().preview).toBe(0); expect(state.writes).toHaveLength(0);
});

it.each([0, 1] as const)("reviews blockers and removes only selected requests, refreshing kind %s's issue queue", async kind => {
  const user = userEvent.setup(); const state = open(kind);
  await user.click(await screen.findByRole("button", { name: "Repair Unstart leftovers" }));
  expect(await screen.findByText("RQ/OLD/001 · Batch B-OLD")).toBeTruthy();
  const issued = screen.getByRole("checkbox", { name: "Remove RQ/ISSUED/002" });
  expect(issued.hasAttribute("disabled")).toBe(true);
  await user.click(screen.getByRole("checkbox", { name: "Remove RQ/OLD/001" }));
  await user.type(screen.getByLabelText(/Repair reason/), "Historical Unstart request left in the queue");
  const before = state.reads().queue;
  await user.click(screen.getByRole("button", { name: "Remove selected (1)" }));
  await waitFor(() => expect(state.writes).toHaveLength(1));
  expect(state.writes[0]?.requisitionIds).toEqual([first]);
  expect(state.writes[0]?.requestId).toMatch(/^[0-9a-f-]{36}$/);
  await waitFor(() => expect(state.reads().queue).toBeGreaterThan(before));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

it("requires a fresh review after refusal and keeps an identical retry's request ID", async () => {
  const user = userEvent.setup(); const state = open(0, true, true);
  await user.click(await screen.findByRole("button", { name: "Repair Unstart leftovers" }));
  await user.click(await screen.findByRole("checkbox", { name: "Remove RQ/OLD/001" }));
  await user.type(screen.getByLabelText(/Repair reason/), "Historical Unstart request");
  await user.click(screen.getByRole("button", { name: "Remove selected (1)" }));
  await screen.findByText("Reload and review the requests before trying again.");
  expect(screen.getByRole("button", { name: "Remove selected (1)" }).hasAttribute("disabled")).toBe(true);
  await user.click(screen.getByRole("button", { name: "Reload preview" }));
  await waitFor(() => expect(state.reads().preview).toBe(2));
  await user.click(screen.getByRole("checkbox", { name: "Remove RQ/OLD/001" }));
  await user.click(screen.getByRole("button", { name: "Remove selected (1)" }));
  await waitFor(() => expect(state.writes).toHaveLength(2));
  expect(state.writes[1]?.requestId).toBe(state.writes[0]?.requestId);
});
