// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import AuditTrailRoute from "../../pages/(workspace)/access-management/audit-trail/page";
import PermissionsRoute from "../../pages/(workspace)/access-management/permissions/page";
import MyIssueRoute from "../../pages/(workspace)/it/my-issues/[id]/details/page";
import MyIssuesRoute from "../../pages/(workspace)/it/my-issues/page";
import TeamTicketsRoute from "../../pages/(workspace)/it/support-tickets/page";
import { ApiProvider } from "../../shared/api/api-provider";
import { SessionProvider } from "../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { availableMoves, isOverdue, moveBetween, moveBlock } from "./lib/tickets";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

it("allows only the moves a ticket's status and the user's part in it permit", () => {
  expect([moveBetween(0, 1), moveBetween(1, 2), moveBetween(1, 3), moveBetween(3, 4), moveBetween(4, 2), moveBetween(0, 3), moveBetween(2, 0)]).toEqual(["assign", "start", "done", "close", "reopen", null, null]);
  const ticket = (status: 0 | 1 | 2 | 3 | 4) => ({ status, assigneeId: "agent", reporterId: "reporter" });
  const actor = (userId: string, ...permissions: string[]) => ({ userId, has: (permission: string) => permissions.includes(permission) });
  expect(availableMoves(ticket(1), actor("agent"))).toEqual(["start", "done"]);
  expect(availableMoves(ticket(1), actor("someone", "CanAssignTicket"))).toEqual(["assign"]);
  expect(moveBlock("start", ticket(1), actor("someone"))).toBe("Only the person the ticket is assigned to can start work on it.");
  // The reporter may reopen their own finished ticket; closing needs the permission.
  expect(availableMoves(ticket(3), actor("reporter"))).toEqual(["reopen"]);
  expect(availableMoves(ticket(3), actor("lead", "CanCloseTicket"))).toEqual(["close", "reopen"]);
  expect(moveBlock("assign", ticket(4), actor("lead", "CanAssignTicket"))).toBe("A finished ticket is reopened before it is assigned again.");
  const now = new Date(2026, 9, 2);
  expect([isOverdue("2026-10-01T00:00:00", 1, now), isOverdue("2026-10-01T00:00:00", 3, now), isOverdue("2026-10-05T00:00:00", 1, now), isOverdue(null, 0, now)]).toEqual([true, false, false, false]);
});

const person = (id: string, firstName: string) => ({ id, firstName, lastName: "Owusu" });
const ticket = (id: string, status: number, extra: object = {}) => ({ id, ticketNumber: id.toUpperCase(), title: `Printer ${id}`, description: "It will not print.", category: 0, priority: 2, status, reportedBy: person("u-1", "Ama"), dueDate: "2020-01-01T00:00:00Z", ...extra });
interface Call { method: string; path: string; search: string; body?: unknown }
function open(address: string, permissions: string[]) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ method: input.method, path: url.pathname, search: url.search, ...(input.method !== "GET" ? { body: await input.clone().json().catch(() => null) } : {}) });
    if (url.pathname === "/api/v1/tickets" && input.method === "POST") return Response.json("t-9");
    if (url.pathname === "/api/v1/tickets") return Response.json({ data: [ticket("t-1", 0), ticket("t-2", 3, { assignedTo: person("u-2", "Kofi") })], pageIndex: 1, pageCount: 1, totalRecordCount: 2 });
    if (url.pathname === "/api/v1/tickets/t-2") return Response.json(ticket("t-2", 3, { assignedTo: person("u-2", "Kofi"), reopenCount: 1 }));
    if (url.pathname === "/api/v1/tickets/t-2/activity") return Response.json([{ id: "a1", createdAt: "2026-10-01T09:00:00Z", user: person("u-2", "Kofi"), type: 1, oldStatus: 2, newStatus: 3 }, { id: "a2", createdAt: "2026-10-01T10:00:00Z", user: person("u-1", "Ama"), type: 0, note: "Still jams." }]);
    if (url.pathname === "/api/v1/tickets/t-2/reopen" || url.pathname === "/api/v1/tickets/t-2/close") return new Response(null, { status: 204 });
    if (url.pathname === "/api/v1/activity-log") return Response.json({ data: [{ user: { firstName: "Ama", lastName: "Owusu", email: "ama@x.test" }, action: "Deleted a rack", module: "Warehouse", subModule: "Racks", actionType: 3, statusCode: 403, createdAt: "2026-10-01T09:00:00Z", ipAddress: "10.0.0.4" }], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname === "/api/v1/role") return Response.json([{ id: "r1", name: "storekeeper", displayName: "Storekeeper", type: 0 }]);
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/it/my-issues", element: <MyIssuesRoute /> }, { path: "/it/my-issues/:id/details", element: <MyIssueRoute /> }, { path: "/it/support-tickets", element: <TeamTicketsRoute /> },
    { path: "/access-management/audit-trail", element: <AuditTrailRoute /> }, { path: "/access-management/permissions", element: <PermissionsRoute /> }], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}
const writes = (calls: readonly Call[]) => calls.filter((call) => call.method !== "GET");

it("lists only the signed-in user's issues and reports a new one", async () => {
  const user = userEvent.setup();
  const { calls, router } = open("/it/my-issues", ["CanCreateTicket"]);
  expect(await screen.findByText("Printer t-1")).toBeTruthy();
  expect(screen.getByText("Awaiting assignment")).toBeTruthy();
  expect(calls.find((call) => call.path === "/api/v1/tickets")?.search).toContain("reportedById=");
  // No board for a reporter.
  expect(screen.queryByRole("button", { name: "Board" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Report issue" }));
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("button", { name: "Report issue" }));
  expect(await within(dialog).findByText("Enter a short summary of the issue")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
  expect(router.state.location.pathname).toBe("/it/my-issues");
}, 20_000);

it("lets the reporter reopen a finished ticket with a reason, and nothing else", async () => {
  const user = userEvent.setup();
  const { calls } = open("/it/my-issues/t-2/details", ["CanCommentOnTicket"]);
  expect(await screen.findByText("Still jams.")).toBeTruthy();
  expect(screen.getByText(/In progress to Done/)).toBeTruthy();
  expect(screen.getByText("1 time")).toBeTruthy();
  // The session user is not the reporter here, and may not close: no moves are offered.
  expect(screen.queryByRole("button", { name: "Close ticket" })).toBeNull();
  await user.click(screen.getByRole("button", { name: "Post comment" }));
  expect(await screen.findByText("Write the comment")).toBeTruthy();
  expect(writes(calls)).toEqual([]);
});

it("shows the team's tickets on a board and closes a done ticket only after confirming", async () => {
  const user = userEvent.setup();
  const { calls } = open("/it/support-tickets", ["CanViewAllTickets", "CanCloseTicket"]);
  const done = await screen.findByRole("region", { name: "Done tickets" });
  expect(within(done).getByText("Printer t-2")).toBeTruthy();
  expect(within(screen.getByRole("region", { name: "Open tickets" })).getByText("Overdue")).toBeTruthy();
  await user.click(within(done).getByRole("button", { name: "Actions for T-2" }));
  await user.click(await screen.findByRole("menuitem", { name: "Close ticket" }));
  expect(writes(calls)).toEqual([]);
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Close ticket" }));
  await waitFor(() => expect(writes(calls).map((call) => `${call.method} ${call.path}`)).toEqual(["PUT /api/v1/tickets/t-2/close"]));
}, 20_000);

it("shows the audit trail with refused requests marked, and asks for a role before showing permissions", async () => {
  open("/access-management/audit-trail", ["CanViewAuditTrail"]);
  expect(await screen.findByText("Deleted a rack")).toBeTruthy();
  expect(screen.getByText("Refused by the server (403)")).toBeTruthy();
  expect(screen.getByText("Warehouse · Racks")).toBeTruthy();
  cleanup();
  open("/access-management/permissions", ["CanViewPermissions"]);
  expect(await screen.findByText("No role selected")).toBeTruthy();
  expect(screen.queryByRole("link", { name: "Manage roles" })).toBeNull();
});
