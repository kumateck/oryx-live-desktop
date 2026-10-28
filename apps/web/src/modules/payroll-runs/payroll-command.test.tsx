// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { rememberSession, forgetSession, stubBackend, userId } from "@/test/backend";
import { usePayrollCommand } from "./hooks/use-payroll-command";
import { payrollRun, payslip, employeeId, runId, requesterId } from "./payroll-fixture";
function Probe() {
  const command = usePayrollCommand(payrollRun, "approve", () => {});
  return (
    <>
      <button disabled={!command.allowed || command.busy} onClick={() => void command.run("")}>
        Approve
      </button>
      {command.error ? <p role="alert">{command.error}</p> : null}
    </>
  );
}
function open() {
  const backend = stubBackend({ permissions: ["CanViewPayrollRuns", "CanApprovePayrollRun", "CanViewPayslip", "CanViewActiveEmployee"] });
  const auth = backend.fetcher.getMockImplementation();
  const state = {
    run: structuredClone(payrollRun),
    slips: [structuredClone(payslip)],
    employeeIds: [employeeId],
    requester: requesterId,
    assigned: true,
    writeStatus: 204,
  };
  const writes: { path: string; audit: string | null }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (input.method === "POST") {
      writes.push({ path, audit: input.headers.get("Module") });
      return new Response(null, { status: state.writeStatus });
    }
    if (path === `/api/v1/payroll/runs/${runId}`) return Response.json(state.run);
    if (path.endsWith("/payslips")) return Response.json({ data: state.slips, pageIndex: 1, pageCount: 1, totalRecordCount: state.slips.length });
    if (path === "/api/v1/employee")
      return Response.json({
        data: state.employeeIds.map((id) => ({ id, status: 0 })),
        pageIndex: 1,
        pageCount: 1,
        totalRecordCount: state.employeeIds.length,
      });
    if (path.includes("/approval/my-pending/"))
      return state.assigned ? Response.json({ id: runId, modelType: "PayrollRun", requestedBy: { id: state.requester } }) : new Response(null, { status: 403 });
    return new Response(null, { status: 404 });
  });
  rememberSession();
  render(
    <SessionProvider>
      <ApiProvider>
        <Probe />
      </ApiProvider>
    </SessionProvider>,
  );
  return { state, writes };
}
afterEach(() => {
  cleanup();
  forgetSession();
});
const approve = async () => {
  const user = userEvent.setup();
  await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false));
  await user.click(screen.getByRole("button"));
};
it("approves only after current payroll, complete payslips, active employees and assigned stage reconcile", async () => {
  const page = open();
  await approve();
  await waitFor(() => expect(page.writes).toHaveLength(1));
  expect(page.writes[0]).toMatchObject({ path: `/api/v1/approval/approve/PayrollRun/${runId}`, audit: "HR Management" });
});
it.each(["stale", "skipped", "self", "unassigned"] as const)("refuses payroll approval when %s", async (kind) => {
  const page = open();
  if (kind === "stale") page.state.run = { ...payrollRun, totalNetPay: 90 };
  if (kind === "skipped") page.state.employeeIds = [employeeId, "958da105-a506-44a9-8ff5-8d005a54f294"];
  if (kind === "self") page.state.requester = userId;
  if (kind === "unassigned") page.state.assigned = false;
  await approve();
  await screen.findByRole("alert");
  expect(page.writes).toHaveLength(0);
});
it("shows a refused approval without replaying it", async () => {
  const page = open();
  page.state.writeStatus = 409;
  await approve();
  await screen.findByRole("alert");
  expect(page.writes).toHaveLength(1);
});
