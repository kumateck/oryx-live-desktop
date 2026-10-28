// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { useLeaveSave } from "./hooks/use-leave-save";
import { leaveDefaults } from "./schemas/leave-schema";
import type { Leave, Category } from "./lib/leave";
const employeeId = "258da105-a506-44a9-8ff5-8d005a54f294";
const typeId = "558da105-a506-44a9-8ff5-8d005a54f294";
const original: Leave = {
  id: "leave1",
  employeeId,
  leaveStatus: 0,
  requestCategory: 0,
  startDate: "2026-11-02T00:00:00Z",
  endDate: "2026-11-03T00:00:00Z",
  leaveTypeId: typeId,
};
function Probe({ existing, files, category }: { existing: Leave | null; files: File[]; category: Category }) {
  const save = useLeaveSave(existing, () => {});
  const values = { ...leaveDefaults(category, original), destination: "Supplier site", files };
  return (
    <>
      <button disabled={!save.allowed || save.busy} onClick={() => void save.save(values)}>
        Save request
      </button>
      {save.savedId ? <p>Request saved</p> : null}
      {save.error ? <p role="alert">{save.error}</p> : null}
    </>
  );
}
function open(existing: Leave | null = null, files: File[] = [], category: Category = 0) {
  const backend = stubBackend({ permissions: ["CanCreateLeaveRequest", "CanEditLeaveRequest"] });
  const auth = backend.fetcher.getMockImplementation();
  const state = { employeeStatus: 0, employeeType: 1, designation: "designation1", fresh: structuredClone(original), fileStatus: 204, createStatus: 200 };
  const calls: { method: string; path: string; body: string; audit: string | null }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    calls.push({
      method: input.method,
      path,
      body: input.method === "POST" || input.method === "PUT" ? await input.clone().text() : "",
      audit: input.headers.get("Module"),
    });
    if (path === `/api/v1/employee/${employeeId}`)
      return Response.json({ id: employeeId, status: state.employeeStatus, type: state.employeeType, designation: { id: state.designation } });
    if (path === `/api/v1/leave-type/${typeId}`) return Response.json({ id: typeId, isActive: true, designations: [{ id: "designation1" }] });
    if (path === "/api/v1/leave-request/leave1") return input.method === "GET" ? Response.json(state.fresh) : new Response(null, { status: 204 });
    if (path === "/api/v1/leave-request" && input.method === "POST")
      return state.createStatus === 200 ? Response.json("leave1") : new Response(null, { status: state.createStatus });
    if (path === "/api/v1/file/LeaveRequest/leave1") return new Response(null, { status: state.fileStatus });
    return new Response(null, { status: 404 });
  });
  rememberSession();
  render(
    <SessionProvider>
      <ApiProvider>
        <Probe existing={existing} files={files} category={category} />
      </ApiProvider>
    </SessionProvider>,
  );
  return { state, calls, writes: () => calls.filter((call) => call.method !== "GET") };
}
afterEach(() => {
  cleanup();
  forgetSession();
});
it("submits a zero-category leave through the existing audited approval request endpoint", async () => {
  const user = userEvent.setup();
  const page = open();
  await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false));
  await user.click(screen.getByRole("button"));
  await screen.findByText("Request saved");
  expect(page.writes()).toHaveLength(1);
  expect(JSON.parse(page.writes()[0]?.body ?? "{}")).toMatchObject({ requestCategory: 0, employeeId, leaveTypeId: typeId, startDate: "2026-11-02T00:00:00Z" });
  expect(page.writes()[0]?.audit).toBe("HR Management");
});
it("retains the saved request ID and retries only attachments after a failed file upload", async () => {
  const user = userEvent.setup();
  const page = open(null, [new File(["pdf"], "evidence.pdf", { type: "application/pdf" })]);
  page.state.fileStatus = 503;
  await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false));
  await user.click(screen.getByRole("button"));
  expect((await screen.findByRole("alert")).textContent).toContain("Request saved. Attachments were not confirmed");
  page.state.fileStatus = 204;
  await user.click(screen.getByRole("button"));
  await waitFor(() => expect(screen.queryByRole("alert")).toBeNull());
  expect(page.writes().filter((call) => call.path === "/api/v1/leave-request")).toHaveLength(1);
  expect(page.writes().filter((call) => call.path.startsWith("/api/v1/file"))).toHaveLength(2);
});
it("blocks stale edits before any update or attachment write", async () => {
  const user = userEvent.setup();
  const page = open(original);
  page.state.fresh = { ...original, leaveStatus: 1 };
  await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false));
  await user.click(screen.getByRole("button"));
  expect((await screen.findByRole("alert")).textContent).toContain("changed");
  expect(page.writes()).toHaveLength(0);
});
it("revalidates official-duty employee eligibility instead of accepting a stale selection", async () => {
  const user = userEvent.setup();
  const page = open(null, [], 3);
  page.state.employeeType = 0;
  await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false));
  await user.click(screen.getByRole("button"));
  expect((await screen.findByRole("alert")).textContent).toContain("permanent");
  expect(page.writes()).toHaveLength(0);
});
it("does not repeat an ambiguous create when the user retries after a server failure", async () => {
  const user = userEvent.setup();
  const page = open();
  page.state.createStatus = 503;
  await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false));
  await user.click(screen.getByRole("button"));
  await screen.findByRole("alert");
  await user.click(screen.getByRole("button"));
  await waitFor(() => expect(screen.getByRole("alert").textContent).toContain("previous save was not confirmed"));
  expect(page.writes()).toHaveLength(1);
});
