// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { SessionProvider } from "@/shared/auth/session-provider";
import { ApiProvider } from "@/shared/api/api-provider";
import { rememberSession, forgetSession, stubBackend } from "@/test/backend";
import { overtimeDefaults } from "./schemas/overtime-schema";
import { useOvertimeSave } from "./hooks/use-overtime-save";
import type { Overtime } from "./lib/overtime";
const employeeId = "258da105-a506-44a9-8ff5-8d005a54f294";
const departmentId = "558da105-a506-44a9-8ff5-8d005a54f294";
const original: Overtime = {
  id: "overtime1",
  code: "OT001",
  departmentId,
  employees: [{ id: employeeId }],
  status: 0,
  overtimeDate: "2026-11-01T00:00:00Z",
  startTime: "1:00 PM",
  endTime: "3:00 PM",
};
function Probe({ edit }: { edit: boolean }) {
  const save = useOvertimeSave(edit ? original : null, () => {});
  return (
    <>
      <button disabled={!save.allowed || save.busy} onClick={() => void save.save(overtimeDefaults(original))}>
        Save
      </button>
      {save.error ? <p role="alert">{save.error}</p> : null}
    </>
  );
}
function open(edit = false) {
  const backend = stubBackend({ permissions: ["CanCreateOvertimeManagement", "CanEditOvertimeManagement"] });
  const auth = backend.fetcher.getMockImplementation();
  const state = { fresh: structuredClone(original), employeeStatus: 0, includeEmployee: true, childDepartment: false, status: 200 };
  const calls: { method: string; path: string; body: string; audit: string | null }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    calls.push({ method: input.method, path, body: input.method !== "GET" ? await input.clone().text() : "", audit: input.headers.get("Module") });
    if (path === `/api/v1/employee/departments/${departmentId}`)
      return Response.json(
        state.includeEmployee
          ? [{ id: employeeId, status: state.employeeStatus, department: { id: state.childDepartment ? "child-department" : departmentId } }]
          : [],
      );
    if (path === "/api/v1/overtime-requests/overtime1" && input.method === "GET") return Response.json(state.fresh);
    return state.status === 200
      ? input.method === "POST"
        ? Response.json("overtime1")
        : new Response(null, { status: 204 })
      : new Response(null, { status: state.status });
  });
  rememberSession();
  render(
    <SessionProvider>
      <ApiProvider>
        <Probe edit={edit} />
      </ApiProvider>
    </SessionProvider>,
  );
  return { state, calls, writes: () => calls.filter((call) => call.method !== "GET") };
}
afterEach(() => {
  cleanup();
  forgetSession();
});
const save = async () => {
  const user = userEvent.setup();
  await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false));
  await user.click(screen.getByRole("button"));
};
it("submits employee IDs with audited headers and honors child-department membership returned by the scoped endpoint", async () => {
  const page = open();
  page.state.childDepartment = true;
  await save();
  await waitFor(() => expect(page.writes()).toHaveLength(1));
  expect(JSON.parse(page.writes()[0]?.body ?? "{}")).toMatchObject({ employeeIds: [employeeId], departmentId, startTime: "1:00 PM" });
  expect(page.writes()[0]?.audit).toBe("HR Management");
});
it.each(["inactive", "missing"] as const)("rejects an employee who is %s in the fresh department read", async (kind) => {
  const page = open();
  if (kind === "inactive") page.state.employeeStatus = 1;
  else page.state.includeEmployee = false;
  await save();
  expect((await screen.findByRole("alert")).textContent).toContain("no longer active");
  expect(page.writes()).toHaveLength(0);
});
it("does not edit a request that was approved while its editor was open", async () => {
  const page = open(true);
  page.state.fresh = { ...original, status: 1 };
  await save();
  expect((await screen.findByRole("alert")).textContent).toContain("changed");
  expect(page.writes()).toHaveLength(0);
});
it("does not replay an ambiguous creation after a server failure", async () => {
  const page = open();
  page.state.status = 503;
  await save();
  await screen.findByRole("alert");
  await save();
  expect(screen.getByRole("alert").textContent).toContain("previous save was not confirmed");
  expect(page.writes()).toHaveLength(1);
});
