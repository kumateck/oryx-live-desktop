// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import ActivitiesPage from "../../../pages/(workspace)/production/activities/page";
import BatchBoardPage from "../../../pages/(workspace)/production/activities/[id]/board/page";
import ActivityStepPage from "../../../pages/(workspace)/production/activities/[id]/board/[stepId]/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend, testUserId } from "../../../test/backend";

afterEach(() => { cleanup(); forgetSession(); });

const batch = { id: "b1", batchNumber: "WM-001", quantity: 1_500_000, batchSize: 0, product: { id: "p1", name: "Wormee", code: "NL-047", baseUoM: { symbol: "ml" } }, productionSchedule: { id: "sch", code: "PS-7" } };
const me = { id: testUserId, firstName: "Ada", lastName: "Mensah" };
const other = { id: "someone-else", firstName: "Kofi", lastName: "Boateng" };
const ago = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

interface Options { current?: { order: number; status: number; critical: boolean; mine: boolean; actions?: number[] }; cancelled?: boolean; requisition?: boolean }
function run(options: Options) {
  const current = options.current ?? { order: 3, status: 0, critical: true, mine: true };
  const people = (current.actions ?? [8]).map((action) => ({ user: current.mine ? me : other, action }));
  return { id: "a1", status: 1, startedAt: ago(200), currentStep: { id: "current" },
    productionScheduleProduct: { ...batch, cancelled: options.cancelled ?? false, reasonForCancellation: options.cancelled ? "Line down" : null },
    activityLogs: [{ id: "l1", message: "completed stock requisition", timestamp: ago(30), user: other }],
    steps: [
      { id: "done-1", order: 1, status: 2, isCritical: false, startedAt: ago(200), completedAt: ago(170), operation: { name: "BMR requisition" }, responsibleUsers: [] },
      { id: "current", order: current.order, status: current.status, isCritical: current.critical, startedAt: current.status ? ago(45) : null, operation: { name: "Dispensing", description: "Weigh out the raw materials" },
        workCenters: [{ workCenter: { name: "Dispensary" } }], responsibleUsers: people },
      { id: "later", order: 9, status: 0, isCritical: true, operation: { name: "Filling" }, responsibleUsers: [] },
    ] };
}

function open(address: string, options: Options = {}) {
  const backend = stubBackend({ permissions: ["CanViewPlannedProducts"] });
  rememberSession();
  const calls: { method: string; path: string; search: string; body: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url); const path = url.pathname;
    if (input.method !== "GET") calls.push({ method: input.method, path, search: url.search, body: await input.clone().text() });
    if (path === "/api/v1/production-schedule/activity/operation-grouped") return Response.json([{ operation: { id: "o1", name: "Dispensing" }, activities: [
      { id: "a1", batchNumber: "WM-001", quantity: 1_500_000, productionScheduleProduct: batch, currentStep: { status: 1, isCritical: true, startedAt: ago(45), productionActivity: { id: "a1" }, responsibleUsers: [{ user: me }] } }] },
      { operation: { id: "o2", name: "Filling" }, activities: [] }]);
    if (path === "/api/v1/production-schedule/activity/a1") return Response.json(run(options));
    if (path.startsWith("/api/v1/production-schedule/activity-step/") && input.method === "PUT") return new Response(null, { status: 204 });
    if (path === "/api/v1/production-schedule/extra-packing/by-product/b1") return Response.json([]);
    if (path.startsWith("/api/v1/production-schedule/stock-requisition/")) return options.requisition ? Response.json({ id: "r1", code: "SR-0004", status: 1 }) : new Response(null, { status: 404 });
    if (path === "/api/v1/production-schedule/material-stock/b1") return Response.json([{ material: { id: "m1", name: "Sugar", code: "RM-1" }, materialDepartment: { uoM: { id: "u-g", symbol: "g" } }, quantityNeeded: 500, quantityOnHand: 900 }]);
    if (path === "/api/v1/production-schedule/package-material-stock/b1") return Response.json([]);
    if (path === "/api/v1/configuration/by-model-type/Requisition") return Response.json({ prefix: "SR-", namingType: 0, minimumNameLength: 4, maximumNameLength: 6 });
    if (path === "/api/v1/configuration/Requisition/count") return Response.json(4);
    if (path === "/api/v1/requisition" && input.method === "POST") return Response.json("r-new", { status: 201 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([
    { path: "/production/activities", element: <ActivitiesPage /> },
    { path: "/production/activities/:id/board", element: <BatchBoardPage /> },
    { path: "/production/activities/:id/board/:stepId", element: <ActivityStepPage /> },
  ], { initialEntries: [address] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}

it("shows running batches by operation, each opening its own board", async () => {
  open("/production/activities");
  const column = await screen.findByRole("region", { name: "Dispensing, 1 batch" });
  const card = within(column).getByRole("link");
  expect(card.getAttribute("href")).toBe("/production/activities/a1/board");
  expect(card.textContent).toContain("WM-001");
  expect(card.textContent).toContain("Wormee");
  expect(card.textContent).toContain("1,500 L");
  expect(card.textContent).toContain("running 45 min");
  expect(screen.getByRole("region", { name: "Filling, 0 batches" }).textContent).toContain("No batches here");
  expect(screen.getByText(/1 batch in production/)).toBeTruthy();
});

it("tracks a run's progress and lets the responsible person start the current step", async () => {
  const { calls } = open("/production/activities/a1/board");
  const progress = await screen.findByRole("progressbar", { name: "Production progress" });
  expect(progress.getAttribute("aria-valuetext")).toBe("1 of 3 steps completed");
  expect(screen.getByText("Now at step 3: Dispensing.")).toBeTruthy();
  const steps = within(screen.getByRole("list", { name: "Production steps" })).getAllByRole("listitem");
  expect(steps.map((item) => item.getAttribute("aria-current"))).toEqual([null, "step", null]);
  expect(steps[0]?.textContent).toContain("took 30 min");
  expect(screen.getByText("completed stock requisition")).toBeTruthy();
  fireEvent.click(await screen.findByRole("button", { name: "Start step" }));
  await waitFor(() => expect(calls.length).toBe(1));
  expect(calls[0]).toMatchObject({ method: "PUT", path: "/api/v1/production-schedule/activity-step/current/status", search: "?status=1" });
});

it("asks before completing a step, on the step's own page", async () => {
  const { calls } = open("/production/activities/a1/board/current", { current: { order: 3, status: 1, critical: true, mine: true, actions: [2] } });
  expect(await screen.findByRole("heading", { name: "Step 3: Dispensing" })).toBeTruthy();
  expect(screen.getByText("Weigh out the raw materials")).toBeTruthy();
  // The step page lists each responsible person with their instruction, and offers the action.
  expect(screen.getByRole("button", { name: "Full return" })).toBeTruthy();
  expect(screen.getByRole("link", { name: /9\. Filling/ }).getAttribute("href")).toBe("/production/activities/a1/board/later");
  fireEvent.click(await screen.findByRole("button", { name: "Complete step" }));
  const dialog = await screen.findByRole("dialog");
  expect(dialog.textContent).toContain("cannot be reopened");
  expect(calls).toEqual([]);
  fireEvent.click(within(dialog).getByRole("button", { name: "Complete step" }));
  await waitFor(() => expect(calls.map((call) => call.search)).toEqual(["?status=2"]));
});

it("does not offer a critical step to someone who is not responsible for it", async () => {
  const { calls } = open("/production/activities/a1/board", { current: { order: 3, status: 0, critical: true, mine: false } });
  expect(await screen.findByText("This is a critical step. Only the people responsible for it can carry it out.")).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Start step" })).toBeNull();
  expect(calls).toEqual([]);
});

it("never changes a batch just because its page was opened", async () => {
  const { calls } = open("/production/activities/a1/board", { current: { order: 4, status: 0, critical: false, mine: false } });
  // A step that is not critical can be started by anyone on the board, but only by pressing the button.
  const start = await screen.findByRole("button", { name: "Start step" });
  await new Promise((resolve) => setTimeout(resolve, 300));
  expect(calls).toEqual([]);
  fireEvent.click(start);
  await waitFor(() => expect(calls.map((call) => `${call.method} ${call.path}${call.search}`)).toEqual(["PUT /api/v1/production-schedule/activity-step/current/status?status=1"]));
});

it("raises one stock requisition for the batch, or shows the ones already raised", async () => {
  const { calls } = open("/production/activities/a1/board", { current: { order: 2, status: 0, critical: true, mine: true, actions: [1] } });
  fireEvent.click(await screen.findByRole("button", { name: "Request stock" }));
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText("Sugar")).toBeTruthy();
  const code = await within(dialog).findByLabelText(/Requisition code/, { selector: "input" });
  await waitFor(() => expect((code as HTMLInputElement).value).toBe("SR-0005"));
  fireEvent.click(within(dialog).getByRole("button", { name: "Send requisition" }));
  await waitFor(() => expect(calls.length).toBe(1));
  expect(JSON.parse(calls[0]?.body ?? "{}")).toMatchObject({ code: "SR-0005", requisitionType: 0, productionScheduleProductId: "b1", productionActivityStepId: "current",
    items: [{ materialId: "m1", quantity: 500, uomId: "u-g" }] });
  cleanup(); forgetSession();
  open("/production/activities/a1/board", { current: { order: 2, status: 0, critical: true, mine: true, actions: [1] }, requisition: true });
  expect((await screen.findAllByText("Pending")).length).toBe(2);
  expect(screen.queryByRole("button", { name: "Request stock" })).toBeNull();
});

it("closes every action on a cancelled batch and says why", async () => {
  open("/production/activities/a1/board", { cancelled: true });
  expect((await screen.findByRole("alert")).textContent).toContain("Production of this batch was cancelled. Reason: Line down");
  expect(screen.queryByRole("button", { name: "Start step" })).toBeNull();
});
