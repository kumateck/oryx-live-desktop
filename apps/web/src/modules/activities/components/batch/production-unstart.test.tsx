// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it, vi } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import ProductionUnstartDialog from "./production-unstart-dialog";
import { ProductionUnstart } from "./production-unstart";

afterEach(() => { cleanup(); forgetSession(); vi.unstubAllGlobals(); });
const preview = () => ({ activityId: "run-1", batchId: "batch-1", scheduleId: "schedule-1", productName: "Amoxicillin 500mg Capsule-BF",
  batchNumber: "BFC4K338", previewToken: "a".repeat(64), canApply: true, alreadyUnstarted: false, blockers: [] as string[],
  stepsToArchive: 12, draftDocumentsToArchive: 2, scheduleStatusBefore: 1, scheduleStatusAfter: 0,
  reservations: [{ id: "reserve-1", materialCode: "PMF015", materialName: "Amoxicillin foil", lotNumber: "SYNTHETIC-LOT", unit: "mg", quantity: 22_500_000 }] });

function open({ permission = true, button = false, evidence = preview(), malformed = false, fail = false } = {}) {
  const backend = stubBackend({ permissions: ["CanViewPlannedProducts", ...(permission ? ["CanUnstartProduction"] : [])] });
  rememberSession();
  const session = backend.fetcher.getMockImplementation();
  const writes: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    if (new URL(input.url).pathname === "/api/v1/production-schedule/activity/run-1/unstart") {
      if (input.method === "GET") return Response.json(malformed ? { rows: null } : evidence);
      writes.push(await input.clone().text());
      if (fail && writes.length === 1) return Response.json({ errors: [{ code: "Unstart.StalePreview", description: "The BMR changed. Reload the preview." }] }, { status: 409 });
      return Response.json({ repairId: "repair-1", batchId: "batch-1", scheduleId: "schedule-1", alreadyApplied: false });
    }
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/", element: button ? <ProductionUnstart activityId="run-1" /> : <ProductionUnstartDialog activityId="run-1" onClose={() => {}} /> },
    { path: "/production/schedules/:id/details", element: <p>Awaiting start</p> }]);
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { writes, router };
}

it.each([false, true])("previews and unstarts production with a valid request ID (HTTP fallback: %s)", async (http) => {
  if (http) vi.stubGlobal("crypto", { getRandomValues: crypto.getRandomValues.bind(crypto), subtle: crypto.subtle });
  const { writes, router } = open();
  expect(await screen.findByText("PMF015")).toBeTruthy();
  expect(screen.getByText("22.5 kg")).toBeTruthy();
  expect(screen.getByText(/12 steps and 2 draft documents/)).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Unstart production" }));
  expect(await screen.findByText("Record why this production start needs reversing")).toBeTruthy(); expect(writes).toHaveLength(0);
  fireEvent.change(screen.getByRole("textbox", { name: /Repair reason/ }), { target: { value: "Production was started accidentally" } });
  fireEvent.click(screen.getByRole("button", { name: "Unstart production" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/production/schedules/schedule-1/details"));
  expect(router.state.location.search).toBe("?batch=batch-1");
  expect(writes).toHaveLength(1);
  expect(JSON.parse(writes[0] ?? "{}").requestId).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  expect(JSON.parse(writes[0] ?? "null")).toMatchObject({ previewToken: "a".repeat(64), reason: "Production was started accidentally" });
});

it("blocks a run with an issued BMR without posting a repair", async () => {
  const evidence = preview(); evidence.canApply = false; evidence.blockers = ["The BMR and BPR must both be unissued, unsampled draft records."];
  const { writes } = open({ evidence });
  expect(await screen.findByText(evidence.blockers[0] ?? "")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Unstart production" })).toHaveProperty("disabled", true); expect(writes).toHaveLength(0);
});

it.each([false, true])("preserves the reason and request ID on retry (HTTP fallback: %s)", async (http) => {
  if (http) vi.stubGlobal("crypto", { getRandomValues: crypto.getRandomValues.bind(crypto), subtle: crypto.subtle });
  const { writes, router } = open({ fail: true }); await screen.findByText("PMF015");
  fireEvent.change(screen.getByRole("textbox", { name: /Repair reason/ }), { target: { value: "Accidental start" } });
  fireEvent.click(screen.getByRole("button", { name: "Unstart production" }));
  expect(await screen.findByText("The BMR changed. Reload the preview.")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Unstart production" })).toHaveProperty("disabled", true);
  fireEvent.click(screen.getByRole("button", { name: "Reload preview" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Unstart production" })).toHaveProperty("disabled", false));
  fireEvent.click(screen.getByRole("button", { name: "Unstart production" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/production/schedules/schedule-1/details")); expect(writes[1]).toBe(writes[0]);
});

it("refuses unreadable evidence and hides actions without the dedicated permission", async () => {
  const { writes } = open({ malformed: true }); expect(await screen.findByText(/unreadable unstart preview/)).toBeTruthy();
  expect(screen.getByRole("button", { name: "Unstart production" })).toHaveProperty("disabled", true); expect(writes).toHaveLength(0);
  cleanup(); forgetSession(); vi.unstubAllGlobals(); open({ permission: false, button: true });
  await waitFor(() => expect(screen.queryByRole("button", { name: "Unstart production" })).toBeNull());
});

it("releases pending state if ID generation fails so the reviewed repair can be retried", async () => {
  const { writes, router } = open();
  await screen.findByText("PMF015");
  const getRandomValues = crypto.getRandomValues.bind(crypto);
  vi.stubGlobal("crypto", { subtle: crypto.subtle, getRandomValues: vi.fn()
    .mockImplementationOnce(() => { throw new Error("Random bytes unavailable"); })
    .mockImplementation((bytes: Uint8Array<ArrayBuffer>) => getRandomValues(bytes)) });
  fireEvent.change(screen.getByRole("textbox", { name: /Repair reason/ }), { target: { value: "Accidental start" } });
  fireEvent.click(screen.getByRole("button", { name: "Unstart production" }));
  await screen.findByText("The repair response could not be confirmed. Reload before retrying.");
  expect(writes).toHaveLength(0);
  fireEvent.click(screen.getByRole("button", { name: "Reload preview" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Unstart production" })).toHaveProperty("disabled", false));
  fireEvent.click(screen.getByRole("button", { name: "Unstart production" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/production/schedules/schedule-1/details"));
  expect(writes).toHaveLength(1);
});
