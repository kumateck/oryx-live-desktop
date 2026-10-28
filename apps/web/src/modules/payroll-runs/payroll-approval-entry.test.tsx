// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { rememberSession, forgetSession, stubBackend } from "@/test/backend";
import { ApprovalDetailPage } from "@/modules/pending-approvals/components/approval-detail-page";
import { payrollRun, runId, requesterId } from "./payroll-fixture";
afterEach(() => { cleanup(); forgetSession(); });
it("requires the dedicated reconciled HR workflow even when generic approval permissions are held", async () => {
  const backend = stubBackend({ permissions: ["CanViewPendingApprovals", "CanApprovePendingApproval", "CanRejectPendingApproval", "CanViewPayrollRuns", "CanApprovePayrollRun"] }); const auth = backend.fetcher.getMockImplementation(); const writes: string[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname; if (input.method !== "GET") writes.push(path);
    return path.includes("/approval/my-pending/") ? Response.json({ id: runId, modelType: "PayrollRun", requestedBy: { id: requesterId, firstName: "Requester" }, approvalLogs: [] }) : Response.json(payrollRun);
  });
  rememberSession(); const router = createMemoryRouter([{ path: "/qa/pending-approvals/:type/:id", element: <ApprovalDetailPage /> }], { initialEntries: [`/qa/pending-approvals/PayrollRun/${runId}`] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  const link = await screen.findByRole("link", { name: "Review and reconcile payroll in HR" }); expect(link.getAttribute("href")).toBe(`/hr/payroll-runs/${runId}`);
  expect(screen.getByRole("button", { name: "Approve" }).hasAttribute("disabled")).toBe(true);
  expect(screen.getByRole("button", { name: "Reject" }).hasAttribute("disabled")).toBe(true);
  expect(writes).toHaveLength(0);
});
