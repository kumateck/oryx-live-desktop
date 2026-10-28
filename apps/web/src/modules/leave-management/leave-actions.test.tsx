// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { LeaveActions } from "./components/leave-actions";
import type { Leave } from "./lib/leave";
const from = new Date();
from.setUTCDate(from.getUTCDate() - 1);
const to = new Date();
to.setUTCDate(to.getUTCDate() + 1);
const original: Leave = {
  id: "leave1",
  employeeId: "employee1",
  employee: { id: "employee1", firstName: "Ama", department: { id: "department1" } },
  leaveStatus: 1,
  requestCategory: 0,
  startDate: from.toISOString(),
  endDate: to.toISOString(),
};
function open(leave = original) {
  const backend = stubBackend({ permissions: ["CanViewLeaveRequests", "CanRecallLeave", "CanCancelLeave", "CanEditLeaveRequest"] });
  const auth = backend.fetcher.getMockImplementation();
  const state = { fresh: structuredClone(leave), approved: [structuredClone(leave)], status: 204 };
  const writes: { path: string; body: string; audit: string | null }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method !== "GET") {
      writes.push({ path, body: await input.clone().text(), audit: input.headers.get("Module") });
      return new Response(null, { status: state.status });
    }
    if (path === "/api/v1/leave-request/leave1") return Response.json(state.fresh);
    if (path === "/api/v1/leave-request") return Response.json({ data: state.approved, pageIndex: 1, pageCount: 1, totalRecordCount: state.approved.length });
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([{ path: "/", element: <LeaveActions row={leave} detail /> }]);
  render(
    <SessionProvider>
      <ApiProvider>
        <RouterProvider router={router} />
      </ApiProvider>
    </SessionProvider>,
  );
  return { state, writes };
}
afterEach(() => {
  cleanup();
  forgetSession();
});
it("rechecks status before cancelling an approved request", async () => {
  const user = userEvent.setup();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 5);
  const page = open({ ...original, startDate: start.toISOString(), endDate: start.toISOString() });
  await user.click(await screen.findByRole("button", { name: "Actions for Ama" }));
  await user.click(await screen.findByRole("menuitem", { name: "Cancel approved leave" }));
  page.state.fresh = { ...page.state.fresh, leaveStatus: 6 };
  await user.click(await screen.findByRole("button", { name: "Cancel leave" }));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("changed"));
  expect(page.writes).toHaveLength(0);
});
it("sends a confirmed cancellation with audit headers and shows server refusal without a second write", async () => {
  const user = userEvent.setup();
  const start = new Date();
  start.setUTCDate(start.getUTCDate() + 5);
  const page = open({ ...original, startDate: start.toISOString(), endDate: start.toISOString() });
  page.state.status = 409;
  await user.click(await screen.findByRole("button", { name: "Actions for Ama" }));
  await user.click(await screen.findByRole("menuitem", { name: "Cancel approved leave" }));
  await user.click(await screen.findByRole("button", { name: "Cancel leave" }));
  await screen.findByRole("alert");
  expect(page.writes).toHaveLength(1);
  expect(page.writes[0]).toMatchObject({ path: "/api/v1/leave-request/leave1/cancel", audit: "HR Management" });
  expect(screen.getByRole("dialog")).toBeTruthy();
});
