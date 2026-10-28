// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { rememberSession, forgetSession, stubBackend } from "@/test/backend";
import { staffDefaults } from "./schemas/staff-schema";
import { useStaffCommand } from "./hooks/use-staff-command";
import type { StaffRequest } from "./lib/staff";
const departmentId = "258da105-a506-44a9-8ff5-8d005a54f294";
const designationId = "558da105-a506-44a9-8ff5-8d005a54f294";
const urgency = new Date();
urgency.setUTCDate(urgency.getUTCDate() + 5);
const original: StaffRequest = {
  id: "staff1",
  departmentId,
  designationId,
  staffRequired: 2,
  qualification: "Qualified",
  educationalQualification: "Diploma",
  appointmentType: 0,
  budgetStatus: 0,
  staffRequisitionStatus: 0,
  requestUrgency: urgency.toISOString(),
  additionalRequests: "Other request",
  additionalRequirements: "Requirement",
};
function Probe({ existing, mode }: { existing: StaffRequest | null; mode: "save" | "delete" }) {
  const command = useStaffCommand(existing, mode, () => {});
  return (
    <>
      <button disabled={!command.allowed || command.busy} onClick={() => void command.run(mode === "save" ? staffDefaults(original) : undefined)}>
        Run
      </button>
      {command.error ? <p role="alert">{command.error}</p> : null}
    </>
  );
}
function open(existing: StaffRequest | null = null, mode: "save" | "delete" = "save") {
  const backend = stubBackend({ permissions: ["CanCreateStaffRequisition", "CanEditStaffRequisition", "CanDeleteStaffRequisition"] });
  const auth = backend.fetcher.getMockImplementation();
  const state = { fresh: structuredClone(original), validDesignation: true, status: 200 };
  const calls: { method: string; path: string; body: string; audit: string | null }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    calls.push({ method: input.method, path, body: input.method !== "GET" ? await input.clone().text() : "", audit: input.headers.get("Module") });
    if (path === `/api/v1/department/${departmentId}`) return Response.json({ id: departmentId, name: "Verified department" });
    if (path === `/api/v1/designation/department/${departmentId}`) return Response.json(state.validDesignation ? [{ id: designationId }] : []);
    if (path === "/api/v1/staff-requisitions/staff1" && input.method === "GET") return Response.json(state.fresh);
    return state.status === 200
      ? input.method === "POST"
        ? Response.json("staff1")
        : new Response(null, { status: 204 })
      : new Response(null, { status: state.status });
  });
  rememberSession();
  render(
    <SessionProvider>
      <ApiProvider>
        <Probe existing={existing} mode={mode} />
      </ApiProvider>
    </SessionProvider>,
  );
  return { state, writes: () => calls.filter((call) => call.method !== "GET") };
}
afterEach(() => {
  cleanup();
  forgetSession();
});
const run = async () => {
  const user = userEvent.setup();
  await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false));
  await user.click(screen.getByRole("button"));
};
it("creates an audited request retaining zero enums and separate text fields", async () => {
  const page = open();
  await run();
  await waitFor(() => expect(page.writes()).toHaveLength(1));
  expect(JSON.parse(page.writes()[0]?.body ?? "{}")).toMatchObject({
    staffRequired: 2,
    appointmentType: 0,
    budgetStatus: 0,
    additionalRequests: "Other request",
    additionalRequirements: "Requirement",
    departmentName: "Verified department",
  });
  expect(page.writes()[0]?.audit).toBe("HR Management");
});
it("blocks a designation that is no longer assigned to the department", async () => {
  const page = open();
  page.state.validDesignation = false;
  await run();
  expect((await screen.findByRole("alert")).textContent).toContain("designation");
  expect(page.writes()).toHaveLength(0);
});
it.each(["save", "delete"] as const)("blocks %s if approval changed after opening", async (mode) => {
  const page = open(original, mode);
  page.state.fresh = { ...original, staffRequisitionStatus: 2 };
  await run();
  expect((await screen.findByRole("alert")).textContent).toContain("changed");
  expect(page.writes()).toHaveLength(0);
});
it("does not repeat an ambiguous staff request creation", async () => {
  const page = open();
  page.state.status = 503;
  await run();
  await screen.findByRole("alert");
  await run();
  expect(screen.getByRole("alert").textContent).toContain("previous save was not confirmed");
  expect(page.writes()).toHaveLength(1);
});
