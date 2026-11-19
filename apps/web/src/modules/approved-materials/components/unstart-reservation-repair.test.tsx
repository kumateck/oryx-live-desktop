// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { ReservedTable } from "./stock-tables";
import { reservationRepairPermissions } from "../schemas/unstart-reservations";

afterEach(() => { cleanup(); forgetSession(); });
const first = "11111111-1111-4111-8111-111111111111";
const blocked = "22222222-2222-4222-8222-222222222222";
const receipt = "33333333-3333-4333-8333-333333333333";
const preview = (token = "a".repeat(64)) => ({ previewToken: token, reservations: [
  { reservationId: first, product: "Reserved product", productBatch: "B-OLD", materialBatch: "LOT-OLD", quantity: 10, unit: "kg", unstartRepairId: receipt, unstartedAt: "2026-11-01T10:00:00Z", blockers: [] },
  { reservationId: blocked, product: "Issued product", productBatch: "B-ISSUED", materialBatch: "LOT-ISSUED", quantity: 20, unit: "kg", unstartRepairId: receipt, unstartedAt: "2026-11-01T10:00:00Z", blockers: ["Stock has already been issued or received for this request."] },
] });

function open(kind: 0 | 1, allowed = true, failFirst = false) {
  const view = kind === 0 ? "CanViewApprovedRawMaterials" : "CanViewApprovedPackagingMaterials";
  const backend = stubBackend({ permissions: [view, ...(allowed ? [reservationRepairPermissions[kind]] : [])] });
  rememberSession();
  const session = backend.fetcher.getMockImplementation();
  const writes: { requestId: string; reservationIds: string[]; reason: string; previewToken: string }[] = [];
  let queueReads = 0; let previewReads = 0;
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path.endsWith("/reserved")) { queueReads++; return Response.json([]); }
    if (path === `/api/v1/unstart-reservations/${receipt}/${kind === 0 ? "raw" : "packaging"}`) {
      if (input.method === "GET") { previewReads++; return Response.json(preview()); }
      writes.push(await input.clone().json());
      if (failFirst && writes.length === 1) return Response.json({ title: "Conflict", detail: "Stock evidence changed." }, { status: 409 });
      expect(input.headers.get("Module")).toBe("Warehouse");
      return Response.json({ repairId: receipt, releasedCount: 1, alreadyApplied: writes.length > 1 });
    }
    return session ? session(input, init) : new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/warehouse/stock-requisition", element: <ReservedTable materialId={receipt} departmentId={first} kind={kind} /> }], {
    initialEntries: [`/warehouse/stock-requisition?type=${kind}`],
  });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { writes, reads: () => ({ queue: queueReads, preview: previewReads }) };
}

it.each([0, 1] as const)("hides the repair without the dedicated permission for kind %s", async kind => {
  const state = open(kind, false);
  await screen.findByText("Nothing is reserved");
  expect(screen.queryByRole("button", { name: "Repair Unstart reservations" })).toBeNull();
  expect(state.reads().preview).toBe(0); expect(state.writes).toHaveLength(0);
});

it.each([0, 1] as const)("reviews blockers and removes only selected holds, refreshing kind %s's issue queue", async kind => {
  const user = userEvent.setup(); const state = open(kind);
  await user.click(await screen.findByRole("button", { name: "Repair Unstart reservations" }));
  expect(await screen.findByText("Reserved product · Batch B-OLD")).toBeTruthy();
  const issued = screen.getByRole("checkbox", { name: "Release B-ISSUED · LOT-ISSUED" });
  expect(issued.hasAttribute("disabled")).toBe(true);
  await user.click(screen.getByRole("checkbox", { name: "Release B-OLD · LOT-OLD" }));
  await user.type(screen.getByLabelText(/Repair reason/), "Historical Unstart request left in the queue");
  const before = state.reads().queue;
  await user.click(screen.getByRole("button", { name: "Release selected (1)" }));
  await waitFor(() => expect(state.writes).toHaveLength(1));
  expect(state.writes[0]?.reservationIds).toEqual([first]);
  expect(state.writes[0]?.requestId).toMatch(/^[0-9a-f-]{36}$/);
  await waitFor(() => expect(state.reads().queue).toBeGreaterThan(before));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

it("requires a fresh review after refusal and keeps an identical retry's request ID", async () => {
  const user = userEvent.setup(); const state = open(0, true, true);
  await user.click(await screen.findByRole("button", { name: "Repair Unstart reservations" }));
  await user.click(await screen.findByRole("checkbox", { name: "Release B-OLD · LOT-OLD" }));
  await user.type(screen.getByLabelText(/Repair reason/), "Historical Unstart request");
  await user.click(screen.getByRole("button", { name: "Release selected (1)" }));
  await screen.findByText("Reload and review the reservations before trying again.");
  expect(screen.getByRole("button", { name: "Release selected (1)" }).hasAttribute("disabled")).toBe(true);
  await user.click(screen.getByRole("button", { name: "Reload preview" }));
  await waitFor(() => expect(state.reads().preview).toBe(2));
  await user.click(screen.getByRole("checkbox", { name: "Release B-OLD · LOT-OLD" }));
  await user.click(screen.getByRole("button", { name: "Release selected (1)" }));
  await waitFor(() => expect(state.writes).toHaveLength(2));
  expect(state.writes[1]?.requestId).toBe(state.writes[0]?.requestId);
});
