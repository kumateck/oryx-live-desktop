// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import PendingApprovalPage from "../../../pages/(workspace)/qa/pending-approvals/[type]/[id]/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";

afterEach(() => { cleanup(); forgetSession(); });
interface Call { method: string; path: string; body: object | null }
import { entity, leave } from "./__fixtures__/approval-records";
import { delegationFormSchema, delegationRequest } from "../lib/delegation";

it("previews the certificate of analysis and starts an OOS investigation on rejected results, saying what it changes", async () => {
  const user = userEvent.setup();
  const backend = stubBackend({ permissions: ["CanViewPendingApprovals", "CanApprovePendingApproval", "CanInitiateOosInvestigation"] });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method !== "GET") calls.push({ method: input.method, path, body: JSON.parse(await input.clone().text()) as object | null });
    if (path === "/api/v1/approval/my-pending/Response/doc-1") return Response.json(entity("Response", "doc-1", { code: "COA-12", approvalLogs: [{ user: { name: "K. Mensah" }, status: 2, comments: "Assay below limit" }] }));
    if (path === "/api/v1/form/responses/doc-1") return Response.json({ form: { id: "form-1" }, materialBatch: { id: "mb-1", name: "Maize starch" }, formResponses: [] });
    if (path === "/api/v1/form/form-1") return Response.json({ sections: [{ id: "s1", name: "<p>Assay</p>", description: "<p>98.0% to 102.0%</p>", order: 1, fields: [{ id: "fld-1" }] },
      { id: "s2", name: "<p>Loss on drying</p>", order: 2, fields: [{ id: "fld-2" }] }] });
    if (path === "/api/v1/form/responses/material-batch/mb-1") return Response.json([{ responseId: "doc-1", formField: { id: "fld-1" }, value: "94.1%", complies: false }]);
    if (path === "/api/v1/material-ard/material/batch-details/mb-1") return Response.json({ arNumber: "AR-55", materialBatch: { batchNumber: "B-1", material: { name: "Maize starch", code: "RM-1" } } });
    if (path === "/api/v1/qa/oos-investigations/initiate") return Response.json("oos-1");
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/qa/pending-approvals/:type/:id", element: <PendingApprovalPage /> }], { initialEntries: ["/qa/pending-approvals/Response/doc-1"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);

  await user.click(await screen.findByRole("button", { name: "Certificate of analysis" }));
  const certificate = await screen.findByRole("dialog");
  expect(certificate.textContent).toContain("QC AR AR-55");
  // A test with no result is not reported as complying.
  expect(certificate.textContent).toContain("Does not comply");
  expect(certificate.textContent).toContain("Not recorded");
  await user.click(within(certificate).getAllByRole("button", { name: "Close" })[0] as HTMLElement);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());

  await user.click(screen.getByRole("button", { name: "Start OOS investigation" }));
  const dialog = await screen.findByRole("dialog");
  expect(dialog.textContent).toContain("put back in quarantine");
  expect((await within(dialog).findByRole("textbox", { name: /Certificate number/ }) as HTMLInputElement).value).toBe("COA-12");
  expect(calls).toEqual([]);
  await user.click(within(dialog).getByRole("button", { name: "Start investigation" }));
  await waitFor(() => expect(calls).toEqual([{ method: "POST", path: "/api/v1/qa/oos-investigations/initiate", body: {
    materialBatchId: "mb-1", analyticalTestRequestId: null, coaNumber: "COA-12", productOrMaterialName: "Maize starch", batchNumber: "B-1", rejectionReason: "Assay below limit" } }]));
}, 20_000);

it("offers no OOS investigation on results that were not rejected", async () => {
  const backend = stubBackend({ permissions: ["CanViewPendingApprovals", "CanInitiateOosInvestigation"] });
  rememberSession();
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === "/api/v1/approval/my-pending/Response/doc-1") return Response.json(entity("Response", "doc-1"));
    if (path === "/api/v1/form/responses/doc-1") return Response.json({ form: { id: "form-1" }, materialBatch: { id: "mb-1" }, formResponses: [] });
    if (path === "/api/v1/form/form-1") return Response.json({ sections: [{ id: "s1", name: "Assay", fields: [{ id: "fld-1" }] }] });
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/qa/pending-approvals/:type/:id", element: <PendingApprovalPage /> }], { initialEntries: ["/qa/pending-approvals/Response/doc-1"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  expect(await screen.findByRole("button", { name: "Certificate of analysis" })).toBeTruthy();
  expect(screen.queryByRole("button", { name: "Start OOS investigation" })).toBeNull();
});

it("generates the approved COA for a material batch or a product's test request only once the results are approved", async () => {
  const subjects = [{ subject: { materialBatch: { id: "mb-1", name: "Maize starch" } }, post: "/api/v1/qc/commercial-certificates/material-batches/mb-1" },
    { subject: { batchManufacturingRecord: { id: "bmr-1", name: "Paracetamol" }, productionActivityStepId: "step-1" }, post: "/api/v1/qc/commercial-certificates/products/atr-1" }];
  for (const { subject, post } of subjects) for (const approved of [false, true]) {
    const user = userEvent.setup();
    const backend = stubBackend({ permissions: ["CanViewPendingApprovals", "CanCheckRawMaterialTestResult", "CanCheckProductTest"] });
    rememberSession();
    const calls: Call[] = [];
    const session = backend.fetcher.getMockImplementation();
    backend.fetcher.mockImplementation(async (input, init) => {
      if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
      const path = new URL(input.url).pathname;
      if (input.method !== "GET") calls.push({ method: input.method, path, body: null });
      if (path === "/api/v1/approval/my-pending/Response/doc-1") return Response.json(entity("Response", "doc-1"));
      if (path === "/api/v1/form/responses/doc-1") return Response.json({ form: { id: "form-1" }, formResponses: [], approved, ...subject });
      if (path === "/api/v1/form/form-1") return Response.json({ sections: [{ id: "s1", name: "Assay", fields: [{ id: "fld-1" }] }] });
      if (path === "/api/v1/qa/analytical-tests/activity-step/step-1") return Response.json({ id: "atr-1" });
      if (path === post) return Response.json("coa-9");
      return new Response(null, { status: 404 });
    });
    const router = createMemoryRouter([{ path: "/qa/pending-approvals/:type/:id", element: <PendingApprovalPage /> }, { path: "/qc/commercial-certificates/:id", element: <p>Certificate page</p> }],
      { initialEntries: ["/qa/pending-approvals/Response/doc-1"] });
    render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
    expect(await screen.findByRole("button", { name: "Certificate of analysis" })).toBeTruthy();
    if (!approved) {
      expect(screen.queryByRole("button", { name: "Generate approved COA" })).toBeNull();
    } else {
      await user.click(await screen.findByRole("button", { name: "Generate approved COA" }));
      const dialog = await screen.findByRole("dialog");
      expect(dialog.textContent).toContain("cannot be changed afterwards");
      expect(calls).toEqual([]);
      await user.click(within(dialog).getByRole("button", { name: "Generate" }));
      await waitFor(() => expect(router.state.location.pathname).toBe("/qc/commercial-certificates/coa-9"));
      expect(calls).toEqual([{ method: "POST", path: post, body: null }]);
    }
    cleanup(); forgetSession();
  }
}, 30_000);

it("delegates whole local days, never more than ninety, starting now when the first day is today", () => {
  const now = new Date(2026, 9, 15, 10, 30);
  const values = { delegate: { value: "u2", label: "Kofi" }, start: new Date(2026, 9, 15), end: new Date(2026, 9, 17), reason: " Leave " };
  expect(delegationRequest(values, now)).toEqual({ delegateUserId: "u2", startDate: now.toISOString(), endDate: new Date(2026, 9, 18).toISOString(), reason: "Leave" });
  expect(delegationRequest({ ...values, start: new Date(2026, 9, 16) }, now).startDate).toBe(new Date(2026, 9, 16).toISOString());
  const issues = (extra: object) => delegationFormSchema.safeParse({ ...values, ...extra }).error?.issues.map((issue) => issue.message) ?? [];
  expect(issues({})).toEqual([]);
  expect(issues({ end: new Date(2026, 9, 14) })).toEqual(["The last day cannot be before the first"]);
  expect(issues({ end: new Date(2027, 0, 12) })).toEqual([]);
  expect(issues({ end: new Date(2027, 0, 13) })).toEqual(["A delegation can last at most 90 days"]);
  expect(issues({ delegate: null })).toEqual(["Choose who will decide your approvals"]);
});

it("says whose request it is when it waits for someone who delegated to the user", async () => {
  const backend = stubBackend({ permissions: ["CanViewPendingApprovals", "CanApprovePendingApproval"] });
  rememberSession();
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path === "/api/v1/approval/my-pending/LeaveRequest/lr-1") return Response.json(entity("LeaveRequest", "lr-1", { onBehalfOf: { name: "Ama Owusu" } }));
    if (path === "/api/v1/leave-request/lr-1") return Response.json(leave);
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "/qa/pending-approvals/:type/:id", element: <PendingApprovalPage /> }], { initialEntries: ["/qa/pending-approvals/LeaveRequest/lr-1"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  expect(await screen.findByText(/waits for Ama Owusu, who delegated their approvals to you/)).toBeTruthy();
});
