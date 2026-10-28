// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";
import { RoutineDetailPage } from "./routine-detail";
import { RoutineTrackPage } from "./track-page";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

const track = { id: "t1", routineExecutionId: "r1", routineCode: "WTR/26/001", routineSampleId: "s1", sampleIdentity: "Purified water loop", analysisType: 1, formId: "f1", routineArdId: "a1", approved: false, rejected: false };
const form = { id: "f1", name: "Micro worksheet", sections: [{ id: "sec", name: "TVC", order: 1, fields: [{ id: "q1", required: true, question: { id: "qq", label: "Count", type: 0 } }] }] };
const run = { id: "r1", routineCode: "WTR/26/001", origin: 0, type: 0, routineDate: "2026-10-01T00:00:00Z", status: 1, samples: [
  { id: "s1", samplingPoint: "Purified water loop", collectedAt: "2026-10-01T08:00:00Z", tracks: [{ id: "t1", analysisType: 0, routineArdId: "a0", formId: "f0", approved: true }, { id: "t2", analysisType: 1, routineArdId: "a1", formId: "f1", approved: true }] }] };

function open(path: string, permissions: string[], state: { assigned: boolean; responseId: string | null }) {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: { method: string; path: string; body: string }[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    if (input.method !== "GET") { calls.push({ method: input.method, path: url.pathname, body: await input.clone().text() }); return url.pathname.endsWith("/certificate") ? Response.json("c9") : new Response(null, { status: 204 }); }
    if (url.pathname === "/api/v1/qc/routines/tracks/t1") return Response.json(track);
    if (url.pathname === "/api/v1/qc/routines/r1") return Response.json(run);
    if (url.pathname === "/api/v1/form/f1") return Response.json(form);
    if (url.pathname === "/api/v1/form/form-assignee") return state.assigned ? Response.json("asg") : new Response("null", { status: 200, headers: { "content-type": "application/json" } });
    if (url.pathname === "/api/v1/form/response") return state.responseId ? Response.json(state.responseId) : new Response("null", { status: 200, headers: { "content-type": "application/json" } });
    if (url.pathname === "/api/v1/form/responses/resp1") return Response.json({ id: "resp1", formResponses: [{ responseId: "resp1", value: "12", formField: { id: "q1" } }] });
    if (url.pathname === "/api/v1/user/by-permission") return Response.json({ data: [], pageIndex: 1, pageCount: 1 });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([
    { path: "/qc/routines/:id", element: <RoutineDetailPage /> },
    { path: "/qc/routines/tracks/:id", element: <RoutineTrackPage /> },
    { path: "/qc/routines/certificates/:id", element: <p>Certificate page</p> },
  ], { initialEntries: [path] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return { calls, router };
}

it("asks for an assignment before results, and offers it only to those who may create routines", async () => {
  open("/qc/routines/tracks/t1", ["CanViewQcRoutineTests", "CanPerformQcRoutineTest"], { assigned: false, responseId: null });
  expect(await screen.findByText("Assign the worksheet")).toBeTruthy();
  expect(screen.getByText(/A supervisor assigns this worksheet/)).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Submit for approval" })).toBeNull();
});

it("submits a started worksheet for approval only after confirming", async () => {
  const user = userEvent.setup();
  const { calls } = open("/qc/routines/tracks/t1", ["CanViewQcRoutineTests", "CanPerformQcRoutineTest"], { assigned: true, responseId: "resp1" });
  await user.click(await screen.findByRole("button", { name: "Submit for approval" }));
  expect(calls).toEqual([]);
  await user.click(await screen.findByRole("button", { name: "Submit for approval", hidden: false }));
  await waitFor(() => expect(calls.some((call) => call.path === "/api/v1/qc/routines/tracks/t1/submit-approval")).toBe(true));
}, 30_000);

it("generates a water sample's combined certificate once confirmed, then opens it", async () => {
  const user = userEvent.setup();
  const { calls, router } = open("/qc/routines/r1", ["CanViewQcRoutineTests", "CanPerformQcRoutineTest"], { assigned: true, responseId: null });
  await user.click(await screen.findByRole("button", { name: /Generate combined certificate/ }));
  await user.click(await screen.findByRole("button", { name: "Generate certificate" }));
  await waitFor(() => expect(router.state.location.pathname).toBe("/qc/routines/certificates/c9"));
  expect(calls).toEqual([expect.objectContaining({ method: "POST", path: "/api/v1/qc/routines/samples/s1/certificate" })]);
}, 30_000);
