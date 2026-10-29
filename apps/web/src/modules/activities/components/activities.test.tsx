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

interface Options {
  current?: { order: number; status: number; critical: boolean; mine: boolean; actions?: number[] }; nextIsFinalPacking?: boolean;
  cancelled?: boolean; packagingAvailable?: boolean; requisition?: boolean | "raw"; packagingIssued?: boolean; packagingFrom?: string; finalPacked?: boolean; extraStatuses?: number[]; extraReadStatus?: number; malformedExtra?: boolean;
}
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
      { id: "later", order: 9, status: 0, isCritical: true, operation: { name: options.nextIsFinalPacking ? "Final Packing" : "Filling" }, responsibleUsers: [] },
    ] };
}

function open(address: string, options: Options = {}) {
  const backend = stubBackend({ permissions: ["CanViewPlannedProducts"] });
  rememberSession();
  const calls: { method: string; path: string; search: string; body: string }[] = [];
  const reads: string[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url); const path = url.pathname;
    if (input.method === "GET") reads.push(path);
    if (input.method !== "GET") calls.push({ method: input.method, path, search: url.search, body: await input.clone().text() });
    if (path === "/api/v1/production-schedule/activity/operation-grouped") return Response.json([{ operation: { id: "o1", name: "Dispensing" }, activities: [
      { id: "a1", batchNumber: "WM-001", quantity: 1_500_000, productionScheduleProduct: batch, currentStep: { status: 1, isCritical: true, startedAt: ago(45), productionActivity: { id: "a1" }, responsibleUsers: [{ user: me }] } }] },
      { operation: { id: "o2", name: "Filling" }, activities: [] }]);
    if (path === "/api/v1/production-schedule/activity/a1") return Response.json(run(options));
    if (path.startsWith("/api/v1/production-schedule/activity-step/") && input.method === "PUT") {
      const status = Number(url.searchParams.get("status"));
      if (options.current) options.current.status = status;
      return new Response(null, { status: 204 });
    }
    if (path === "/api/v1/production-schedule/extra-packing/by-product/b1") {
      if (options.extraReadStatus) return new Response(null, { status: options.extraReadStatus });
      return Response.json(options.malformedExtra ? { unexpected: true } : (options.extraStatuses ?? []).map((status) => ({ status })));
    }
    if (path.startsWith("/api/v1/production-schedule/stock-requisition/")) {
      const raised = options.requisition === true || (options.requisition === "raw" && path.includes("/raw/"));
      const packagingRow = path.includes("/package/");
      return raised ? Response.json({ id: "r1", code: "SR-0004", status: packagingRow && options.packagingIssued ? 3 : 1,
        productionActivityStepId: packagingRow ? options.packagingFrom ?? "done-1" : "done-1" }) : new Response(null, { status: 404 });
    }
    if (path === "/api/v1/production-schedule/final-packing/product/b1" && options.finalPacked) return Response.json({ id: "fp1" });
    if (path === "/api/v1/production-schedule/material-stock/b1") return Response.json([{ material: { id: "m1", name: "Sugar", code: "RM-1" }, materialDepartment: { uoM: { id: "u-g", symbol: "g" } }, quantityNeeded: 500, quantityOnHand: 900 }]);
    if (path === "/api/v1/production-schedule/package-material-stock/b1") return Response.json([{ material: { id: "m2", name: "Bottle", code: "PM-1" }, materialDepartment: { uoM: { id: "u-pc", symbol: "pc" } }, quantityNeeded: 300, quantityOnHand: options.packagingAvailable ? 400 : 50 }]);
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
  return { calls, reads, router };
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

it("automatically starts a non-critical current step and leaves completion to the user", async () => {
  const { calls } = open("/production/activities/a1/board", { current: { order: 4, status: 0, critical: false, mine: false } });
  expect(screen.queryByRole("button", { name: "Start step" })).toBeNull();
  await waitFor(() => expect(calls.map((call) => `${call.method} ${call.path}${call.search}`)).toEqual(["PUT /api/v1/production-schedule/activity-step/current/status?status=1"]));
  expect(await screen.findByRole("button", { name: "Complete step" })).toBeTruthy();
  expect(screen.getAllByText("Automated").length).toBeGreaterThan(0);
});

it("asks for raw and packaging together on the stock step when all packaging is available", async () => {
  const { calls } = open("/production/activities/a1/board", { current: { order: 2, status: 0, critical: true, mine: true, actions: [1] }, packagingAvailable: true });
  fireEvent.click(await screen.findByRole("button", { name: "Request stock" }));
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText("Bottle")).toBeTruthy();
  expect(within(dialog).getByText("Sugar")).toBeTruthy();
  const code = await within(dialog).findByLabelText(/Requisition code/, { selector: "input" });
  await waitFor(() => expect((code as HTMLInputElement).value).toBe("SR-0005"));
  fireEvent.click(within(dialog).getByRole("button", { name: "Send requisition" }));
  await waitFor(() => expect(calls.length).toBe(1));
  expect(JSON.parse(calls[0]?.body ?? "{}").items).toEqual([{ materialId: "m1", quantity: 500, uomId: "u-g" }, { materialId: "m2", quantity: 300, uomId: "u-pc" }]);
});

it("raises one stock requisition for the batch, or shows the ones already raised", async () => {
  const { calls } = open("/production/activities/a1/board", { current: { order: 2, status: 0, critical: true, mine: true, actions: [1] } });
  fireEvent.click(await screen.findByRole("button", { name: "Request stock" }));
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText("Sugar")).toBeTruthy();
  // Packaging is short, so it is left for later.
  expect(within(dialog).getByText(/Packaging material is short, so this voucher asks only for the raw materials/)).toBeTruthy();
  expect(within(dialog).queryByText("Bottle")).toBeNull();
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

it("requests packaging once from any step after raw material, until final packing", async () => {
  // No packaging before the raw material requisition.
  open("/production/activities/a1/board", { current: { order: 4, status: 1, critical: true, mine: true } });
  expect(await screen.findByRole("button", { name: "Complete step" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Request packaging material" })).toBeNull();
  cleanup(); forgetSession();

  const { calls } = open("/production/activities/a1/board", { current: { order: 4, status: 1, critical: true, mine: true }, requisition: "raw" });
  fireEvent.click(await screen.findByRole("button", { name: "Request packaging material" }));
  const dialog = await screen.findByRole("dialog");
  expect(await within(dialog).findByText("Bottle")).toBeTruthy();
  expect(within(dialog).queryByText("Sugar")).toBeNull();
  const code = await within(dialog).findByLabelText(/Requisition code/, { selector: "input" });
  await waitFor(() => expect((code as HTMLInputElement).value).toBe("SR-0005"));
  fireEvent.click(within(dialog).getByRole("button", { name: "Send requisition" }));
  await waitFor(() => expect(calls.some((call) => call.path === "/api/v1/requisition")).toBe(true));
  expect(JSON.parse(calls.find((call) => call.path === "/api/v1/requisition")?.body ?? "{}")).toMatchObject({ productionActivityStepId: "current",
    items: [{ materialId: "m2", quantity: 300, uomId: "u-pc" }] });
  cleanup(); forgetSession();

  const packed = open("/production/activities/a1/board", { current: { order: 4, status: 1, critical: true, mine: true }, requisition: "raw", finalPacked: true });
  expect(await screen.findByRole("button", { name: "Complete step" })).toBeTruthy();
  await waitFor(() => expect(packed.reads).toContain("/api/v1/production-schedule/final-packing/product/b1"));
  await new Promise((resolve) => setTimeout(resolve, 50));
  expect(screen.queryByRole("button", { name: "Request packaging material" })).toBeNull();
});

it("keeps the step before final packing open until packaging is requested and issued", async () => {
  const board = { current: { order: 4, status: 1, critical: true, mine: true }, nextIsFinalPacking: true } as const;
  open("/production/activities/a1/board", { ...board, requisition: "raw" });
  expect(await screen.findByText(/Request the batch's packaging material, and complete this step once it is issued/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Complete step" }).hasAttribute("disabled")).toBe(true);
  expect(screen.getByRole("button", { name: "Request packaging material" })).toBeTruthy();
  cleanup(); forgetSession();

  open("/production/activities/a1/board", { ...board, requisition: true });
  expect(await screen.findByText(/Complete this step once the batch's packaging material is issued/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Complete step" }).hasAttribute("disabled")).toBe(true);
  cleanup(); forgetSession();

  open("/production/activities/a1/board", { ...board, requisition: true, packagingIssued: true });
  const complete = await screen.findByRole("button", { name: "Complete step" });
  await waitFor(() => expect(complete.hasAttribute("disabled")).toBe(false));
  expect(screen.queryByText(/Final packing comes next/)).toBeNull();
});

it("completes a step packaging was requested from by hand, once that packaging is issued", async () => {
  const board = { current: { order: 4, status: 1, critical: true, mine: true }, requisition: true, packagingFrom: "current" } as const;
  open("/production/activities/a1/board", board);
  expect(await screen.findByText(/requested from this step has not been issued yet/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Complete step" }).hasAttribute("disabled")).toBe(true);
  cleanup(); forgetSession();

  open("/production/activities/a1/board", { ...board, packagingIssued: true });
  const complete = await screen.findByRole("button", { name: "Complete step" });
  await waitFor(() => expect(complete.hasAttribute("disabled")).toBe(false));
});

it("closes every action on a cancelled batch and says why", async () => {
  open("/production/activities/a1/board", { cancelled: true });
  expect((await screen.findByRole("alert")).textContent).toContain("Production of this batch was cancelled. Reason: Line down");
  expect(screen.queryByRole("button", { name: "Start step" })).toBeNull();
});

it.each([0, 1])("disables completion until every extra material has been issued (outstanding status %s)", async (status) => {
  const { calls } = open("/production/activities/a1/board", {
    current: { order: 5, status: 1, critical: true, mine: true, actions: [3] }, extraStatuses: [2, status],
  });
  await screen.findByText(status === 0 ? /Extra material is waiting for approval/ : /Approved extra material has not been issued/);
  const complete = screen.getByRole("button", { name: "Complete step" });
  expect(complete.hasAttribute("disabled")).toBe(true);
  fireEvent.click(complete);
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(calls).toEqual([]);
});

it("allows completion after all extra materials are issued", async () => {
  const { calls } = open("/production/activities/a1/board", {
    current: { order: 5, status: 1, critical: true, mine: true }, extraStatuses: [2, 2],
  });
  await waitFor(() => expect(screen.getByRole("button", { name: "Complete step" }).hasAttribute("disabled")).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: "Complete step" }));
  fireEvent.click(within(await screen.findByRole("dialog")).getByRole("button", { name: "Complete step" }));
  await waitFor(() => expect(calls.map((call) => call.search)).toEqual(["?status=2"]));
});

it.each([0, 1])("refreshes extra material at confirmation and refuses a newly outstanding request (%s)", async (status) => {
  const options: Options = { current: { order: 5, status: 1, critical: true, mine: true }, extraStatuses: [2] };
  const { calls } = open("/production/activities/a1/board", options);
  await waitFor(() => expect(screen.getByRole("button", { name: "Complete step" }).hasAttribute("disabled")).toBe(false));
  fireEvent.click(screen.getByRole("button", { name: "Complete step" }));
  const dialog = await screen.findByRole("dialog");
  options.extraStatuses = [status];
  fireEvent.click(within(dialog).getByRole("button", { name: "Complete step" }));
  await screen.findByText("All extra material must be approved and issued before completing this step.");
  expect(calls).toEqual([]);
});

it.each([{ extraReadStatus: 503 }, { malformedExtra: true }])("keeps completion disabled when issue evidence cannot be verified: %o", async (failure) => {
  const { calls } = open("/production/activities/a1/board", { ...failure, current: { order: 5, status: 1, critical: true, mine: true } });
  await screen.findByRole("button", { name: "Retry step check" });
  expect(screen.getByRole("button", { name: "Complete step" }).hasAttribute("disabled")).toBe(true);
  expect(calls).toEqual([]);
});
