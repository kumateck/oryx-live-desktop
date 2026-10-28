// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import ActivityStepPage from "../../../../../pages/(workspace)/production/activities/[id]/board/[stepId]/page";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { rememberSession, forgetSession, stubBackend, testUserId } from "@/test/backend";
import { emptyStepRecords, stepEvidenceFixture } from "../../../test/step-records-fixture";

// Keep source step configuration deliberately different from the recorded test.
const activity = { id: "a1", currentStep: { id: "current" }, productionScheduleProduct: { id: "b1", batchNumber: "4862",
  product: { name: "Coldrilif Syrup", baseUoM: { symbol: "ml" } } }, steps: [
  { id: "done", order: 6, status: 2, completedAt: "2026-10-26T00:08:22Z", operation: { name: "Intermediate sampling" },
    responsibleUsers: [{ user: { id: testUserId, firstName: "Ada", lastName: "Mensah" }, action: 7, productAnalyticalRawData: { stage: 0 } }] },
  { id: "current", order: 12, status: 1, isCritical: true, operation: { name: "Finished sampling" }, responsibleUsers: [] },
] };
const recordPath = (stepId = "done") => `/api/v1/production-schedule/activity/a1/step/${stepId}/records`;

function open({ permission = true, response = () => Response.json(stepEvidenceFixture()) }: {
  permission?: boolean; response?: (stepId: string) => Response | Promise<Response>;
} = {}) {
  const backend = stubBackend({ permissions: permission ? ["CanViewPlannedProducts"] : [] });
  const session = backend.fetcher.getMockImplementation();
  const reads: string[] = [];
  const writes: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method !== "GET") writes.push(path);
    reads.push(path);
    if (path === "/api/v1/production-schedule/activity/a1") return Response.json(activity);
    if (path === recordPath("done")) return response("done");
    if (path === recordPath("current")) return response("current");
    if (path === "/api/v1/production-schedule/extra-packing/by-product/b1") return Response.json([]);
    return new Response(null, { status: 404 });
  });
  rememberSession();
  const router = createMemoryRouter([{ path: "/production/activities/:id/board/:stepId", element: <ActivityStepPage /> }],
    { initialEntries: ["/production/activities/a1/board/done"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { reads, writes, router };
}
afterEach(() => { cleanup(); forgetSession(); });

it("shows all performed action types on a completed step without sending any mutation", async () => {
  const { reads, writes } = open();
  const records = await screen.findByRole("region", { name: "Analytical test request" });
  expect(records.textContent).toContain("AR-4862");
  expect(records.textContent).toContain("Finished");
  expect(records.textContent).toContain("Released");
  expect(records.textContent).toContain("Eunice Adams");
  expect(records.textContent).toContain("500 ml");
  expect(records.textContent).toContain("QC analyst");
  expect(screen.getByRole("heading", { name: "Step 6: Intermediate sampling" })).toBeTruthy();
  expect(screen.getByRole("region", { name: "Batch manufacturing record" }).textContent).toContain("Approved");
  expect(screen.getByRole("region", { name: "Stock requisition" }).textContent).toContain("RM-4862");
  expect(screen.getByRole("region", { name: "Extra material request" }).textContent).toContain("11.000123 pcs");
  expect(screen.getByRole("region", { name: "Final packing" }).textContent).toContain("19,980");
  const transfers = screen.getAllByRole("region", { name: "Finished goods transfer" });
  expect(transfers).toHaveLength(2);
  expect(transfers[0]?.textContent).toContain("9,500 pcs");
  expect(transfers[0]?.textContent).toContain("Finished goods quarantine");
  expect(within(transfers[0] as HTMLElement).getByRole("progressbar", { name: "Received against transferred" }).getAttribute("aria-valuenow")).toBe("95");
  expect(transfers[0]?.textContent).toContain("Approved · awaiting receipt");
  expect(transfers[1]?.textContent).toContain("FGT-4862-B");
  expect(screen.getByRole("region", { name: "Leftover material return" }).textContent).toContain("Unused caps");
  expect(screen.getByRole("table", { name: "Final packing material reconciliation" }).textContent).toContain("Bottle breakages recorded");
  expect(reads.filter((path) => path === recordPath())).toHaveLength(1);
  expect(writes).toEqual([]);
  expect(screen.queryByRole("button", { name: "Request analysis" })).toBeNull();
  expect(screen.queryByRole("button", { name: "Complete step" })).toBeNull();
});

it("labels batch-scoped history without attributing it to this step", async () => {
  open();
  const extra = await screen.findByRole("region", { name: "Extra material request" });
  expect(extra.textContent).toContain("Linked to the batch, not specifically to this step");
  expect(extra.textContent).toContain("Batch level");
  expect(screen.getByRole("region", { name: "Analytical test request" }).textContent).not.toContain("Linked to the batch");
});

it("keeps an empty record set distinct from unavailable or malformed evidence", async () => {
  open({ response: () => Response.json(emptyStepRecords()) });
  expect(await screen.findByText(/No action records are linked to this step/)).toBeTruthy();
});

it("shows a shaped loading state while step evidence is pending", async () => {
  let finish: ((response: Response) => void) | undefined;
  open({ response: () => new Promise<Response>((resolve) => { finish = resolve; }) });
  expect(await screen.findByRole("region", { name: "Loading recorded actions" })).toBeTruthy();
  await act(async () => { finish?.(Response.json(emptyStepRecords())); });
  expect(await screen.findByText(/No action records are linked/)).toBeTruthy();
});

it("reports failures and retries evidence without resubmitting an action", async () => {
  let failed = true;
  const { writes } = open({ response: () => failed ? Response.json({ detail: "Database temporarily unavailable" }, { status: 503 }) : Response.json(stepEvidenceFixture()) });
  expect(await screen.findByText("Recorded actions could not be loaded.")).toBeTruthy();
  expect(screen.queryByText(/No action records are linked/)).toBeNull();
  failed = false;
  fireEvent.click(screen.getByRole("button", { name: "Retry recorded actions" }));
  expect(await screen.findByRole("region", { name: "Final packing" })).toBeTruthy();
  expect(writes).toEqual([]);
});

it("rejects a response for the wrong step rather than showing unrelated records", async () => {
  open({ response: () => Response.json(stepEvidenceFixture("another-step")) });
  expect(await screen.findByText(/could not be verified for this step/)).toBeTruthy();
  expect(screen.queryByText("AR-4862")).toBeNull();
});

it("rejects malformed nested record arrays", async () => {
  open({ response: () => Response.json({ ...stepEvidenceFixture(), transfers: {} }) });
  expect(await screen.findByText(/could not be verified for this step/)).toBeTruthy();
});

it("does not fetch action evidence without board permission", async () => {
  const { reads } = open({ permission: false });
  await screen.findByRole("heading", { name: "Step 6: Intermediate sampling" });
  expect(reads.some((path) => path.endsWith("/records"))).toBe(false);
  expect(screen.queryByRole("heading", { name: "Recorded actions" })).toBeNull();
});

it("never flashes the previous step's cached records during navigation", async () => {
  let finish: ((response: Response) => void) | undefined;
  const { router } = open({ response: (stepId) => stepId === "done" ? Response.json(stepEvidenceFixture()) : new Promise<Response>((resolve) => { finish = resolve; }) });
  await screen.findByRole("region", { name: "Analytical test request" });
  await act(async () => { await router.navigate("/production/activities/a1/board/current"); });
  expect(await screen.findByRole("region", { name: "Loading recorded actions" })).toBeTruthy();
  expect(screen.queryByText("AR-4862")).toBeNull();
  await act(async () => { finish?.(Response.json(emptyStepRecords("current"))); });
  await waitFor(() => expect(within(screen.getByRole("region", { name: "Recorded actions" })).getByText(/No action records/)).toBeTruthy());
});
