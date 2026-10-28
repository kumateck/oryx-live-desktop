// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { canAccess } from "@/shared/auth/access";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { openMenu } from "@/test/menu";
import { modules } from "../registry";
import { routeAccessPolicy } from "../registry-model";
import { JobRequestsPage } from "./components/job-pages";
import { JobOrderDetailPage } from "./components/order-pages";
import { Handling, JobStatus, jobActions, jobRequestSchema } from "./lib/job-requests";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};

const raw = (status: number, extra: Record<string, unknown> = {}) => ({ id: "j1", code: "JR-001", status, approved: true, handlingType: Handling.NotAssigned, descriptionOfWork: "Fix the fume hood",
  dateOfIssue: "2026-10-20T00:00:00Z", preferredCompletionDate: "2026-10-30T00:00:00Z", department: { id: "d1", name: "QC" }, ...extra });
const job = (status: number, extra: Record<string, unknown> = {}) => jobRequestSchema.parse(raw(status, extra));
const order = { id: "o1", code: "JO-001", jobRequestId: "j1", status: 2, issuedDate: "2026-10-21T00:00:00Z", description: "Replace the blower", service: { name: "HVAC repair" },
  issuedBy: { firstName: "Ama", lastName: "Owusu" },
  serviceProviders: [{ id: "jsp1", sentAt: "2026-10-21T00:00:00Z", responseReceived: true, responseDate: "2026-10-22T00:00:00Z", serviceProvider: { name: "Cool Air", phone: "020", email: "a@cool.test" } }],
  quotations: [{ id: "q1", quotationNumber: "Q-1", grandTotal: 250, status: 0, isSelected: false, serviceProvider: { name: "Cool Air" }, currency: { symbol: "GHS" } }] };

function open(element: ReactNode, granted: string[], path = "/x") {
  const backend = stubBackend({ permissions: granted });
  const auth = backend.fetcher.getMockImplementation();
  const state = { job: raw(JobStatus.Pending) };
  const calls: { path: string; method: string; body: unknown }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ path: url.pathname, method: input.method, body: input.method === "GET" ? null : await input.clone().json().catch(() => null) });
    if (input.method !== "GET") return new Response(null, { status: 204 });
    if (url.pathname === "/api/v1/job-requests") return Response.json({ data: [state.job], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname === "/api/v1/job-requests/j1") return Response.json(state.job);
    if (url.pathname === "/api/v1/job-orders/o1") return Response.json(order);
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([{ path: "/x/:id?", element }], { initialEntries: [path] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { state, writes: () => calls.filter((c) => c.method !== "GET" && c.path !== "/api/v1/collection") };
}
afterEach(() => { cleanup(); forgetSession(); });

it("guards job requests and job orders with their own view keys", () => {
  const can = (path: string, keys: string[]) => { const p = routeAccessPolicy(modules, path); return Boolean(p && canAccess(p.access, { state: "authenticated", permissions: new Set(keys) })); };
  expect(can("/extrals/job-requests", ["CanViewJobRequests"])).toBe(true);
  expect(can("/extrals/job-orders/o1/details", ["CanViewJobRequests"])).toBe(false);
  expect(can("/extrals/job-orders/o1/details", ["CanViewJobOrders"])).toBe(true);
});

it("offers only the steps the server allows at each stage", () => {
  expect(jobActions(job(JobStatus.Pending, { approved: false }))).toMatchObject({ acknowledge: false, assign: false, order: false, cancel: true, edit: true });
  expect(jobActions(job(JobStatus.Acknowledged))).toMatchObject({ acknowledge: false, assign: true, order: true });
  expect(jobActions(job(JobStatus.Acknowledged, { handlingType: Handling.External }))).toMatchObject({ assign: false, order: true });
  expect(jobActions(job(JobStatus.Assigned, { handlingType: Handling.Internal }))).toMatchObject({ edit: false, remove: false, cancel: false, start: true, complete: true, reassign: true, order: false });
  expect(jobActions(job(JobStatus.SentToExternal))).toMatchObject({ edit: false, remove: false, cancel: false, assign: false, order: false });
});

it("acknowledges a request only while it is as it was shown", async () => {
  const user = userEvent.setup();
  const app = open(<JobRequestsPage />, ["CanViewJobRequests", "CanAcknowledgeJobRequest"]);
  await openMenu(/Actions for JR-001/);
  // Without the edit or delete keys those steps are not offered.
  expect(screen.queryByRole("menuitem", { name: "Edit" })).toBeNull();
  expect(screen.queryByRole("menuitem", { name: "Delete" })).toBeNull();
  await user.click(screen.getByRole("menuitem", { name: "Acknowledge" }));
  app.state.job = raw(JobStatus.Pending, { approved: false });
  await user.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Acknowledge" }));
  expect(await within(screen.getByRole("dialog")).findByText(/changed after you opened it/)).toBeTruthy();
  expect(app.writes()).toHaveLength(0);
  app.state.job = raw(JobStatus.Pending);
  await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Acknowledge" }));
  await waitFor(() => expect(app.writes()).toHaveLength(1));
  expect(app.writes()[0]).toMatchObject({ path: "/api/v1/job-requests/status/j1", method: "PUT", body: { status: 1 } });
});

it("completes in-house work with what was done", async () => {
  const user = userEvent.setup();
  const app = open(<JobRequestsPage />, ["CanViewJobRequests", "CanCompleteJobRequest"]);
  app.state.job = raw(JobStatus.Started, { handlingType: Handling.Internal });
  await openMenu(/Actions for JR-001/);
  await user.click(screen.getByRole("menuitem", { name: "Complete" }));
  const dialog = await screen.findByRole("dialog");
  await user.type(await within(dialog).findByRole("textbox", { name: /Activity performed/ }), "Replaced the filter and tested airflow");
  await user.click(within(dialog).getByRole("button", { name: "Complete job" }));
  await waitFor(() => expect(app.writes()).toHaveLength(1));
  expect(app.writes()[0]).toMatchObject({ path: "/api/v1/job-requests/complete", body: { jobRequestId: "j1", activityPerformedNote: "Replaced the filter and tested airflow" } });
});

it("shows a job order's providers and the quotations they sent", async () => {
  open(<JobOrderDetailPage />, ["CanViewJobOrders"], "/x/o1");
  expect(await screen.findByRole("heading", { name: "JO-001" })).toBeTruthy();
  const providers = screen.getByRole("region", { name: "Service providers" });
  expect(within(providers).getByText("Cool Air")).toBeTruthy();
  expect(within(providers).getByText(/020 · a@cool.test/)).toBeTruthy();
  const quotes = screen.getByRole("region", { name: "Quotations" });
  expect(within(quotes).getByText("GHS 250.00")).toBeTruthy();
  expect(within(quotes).getByText("Submitted")).toBeTruthy();
});
