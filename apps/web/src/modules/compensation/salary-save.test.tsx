// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { rememberSession, forgetSession, stubBackend } from "@/test/backend";
import { compensationSchema } from "./schemas/contracts";
import { salaryDefaults } from "./schemas/editor-schema";
import { useSalarySave } from "./hooks/use-salary-save";
const employeeId = "258da105-a506-44a9-8ff5-8d005a54f294";
const id = "558da105-a506-44a9-8ff5-8d005a54f294";
const original = compensationSchema.parse({
  id,
  employeeId,
  employeeName: "Ama",
  basicSalary: 0,
  bankAccountNumber: "0000123",
  tier3VoluntaryEnrolled: false,
  effectiveFrom: "2026-01-01T00:00:00Z",
  totalAllowances: 0,
  allowances: [{ id, type: 0, amount: 0, isTaxable: false }],
});
function Probe({ initial }: { initial: boolean }) {
  const save = useSalarySave(employeeId, initial ? null : original, () => {});
  return (
    <>
      <button disabled={!save.allowed || save.busy} onClick={() => void save.run({ ...salaryDefaults(original), from: new Date(2026, 10, 1) })}>
        Save
      </button>
      {save.error ? <p role="alert">{save.error}</p> : null}
    </>
  );
}
function open(initial = false) {
  const backend = stubBackend({ permissions: ["CanViewCompensation", "CanManageCompensation"] });
  const auth = backend.fetcher.getMockImplementation();
  const state = { current: initial ? null : structuredClone(original), employeeStatus: 0, response: 200 };
  const writes: { body: string; audit: string | null }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    if (input.method === "POST") {
      writes.push({ body: await input.clone().text(), audit: input.headers.get("Module") });
      return state.response === 200 ? Response.json(id) : new Response(null, { status: state.response });
    }
    if (url.pathname.startsWith("/api/v1/employee/")) return Response.json({ id: employeeId, status: state.employeeStatus });
    return state.current ? Response.json(state.current) : new Response(null, { status: 404 });
  });
  rememberSession();
  render(
    <SessionProvider>
      <ApiProvider>
        <Probe initial={initial} />
      </ApiProvider>
    </SessionProvider>,
  );
  return { state, writes };
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
it("creates a new audited effective record retaining full allowances and bank number zeroes", async () => {
  const page = open();
  await run();
  await waitFor(() => expect(page.writes).toHaveLength(1));
  expect(JSON.parse(page.writes[0]?.body ?? "{}")).toMatchObject({
    basicSalary: 0,
    bankAccountNumber: "0000123",
    allowances: [{ type: 0, amount: 0, isTaxable: false }],
  });
  expect(page.writes[0]?.audit).toBe("HR Management");
});
it("blocks a salary write if another user changed compensation", async () => {
  const page = open();
  page.state.current = { ...original, basicSalary: 100 };
  await run();
  expect((await screen.findByRole("alert")).textContent).toContain("changed");
  expect(page.writes).toHaveLength(0);
});
it("checks for an existing record before creating initial compensation", async () => {
  const page = open(true);
  page.state.current = original;
  await run();
  expect((await screen.findByRole("alert")).textContent).toContain("changed");
  expect(page.writes).toHaveLength(0);
});
it("does not silently replay an ambiguous effective-dated save", async () => {
  const page = open();
  page.state.response = 503;
  await run();
  await screen.findByRole("alert");
  await run();
  expect(screen.getByRole("alert").textContent).toContain("previous save was not confirmed");
  expect(page.writes).toHaveLength(1);
});
