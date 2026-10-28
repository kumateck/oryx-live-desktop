// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider } from "@/shared/auth/session-provider";
import { rememberSession, forgetSession, stubBackend } from "@/test/backend";
import { useConfigCommand } from "./hooks/use-config-command";
import type { PayGrade } from "./schemas/contracts";
const id = "258da105-a506-44a9-8ff5-8d005a54f294";
const original: PayGrade = { id, name: "Junior", minSalary: 0, maxSalary: 100, level: 0 };
function Probe({ mode }: { mode: "create" | "edit" | "delete" }) {
  const command = useConfigCommand("grade", mode === "create" ? null : { kind: "grade", row: original }, () => {});
  return (
    <>
      <button
        disabled={command.busy || !command.allowed}
        onClick={() =>
          void command.run(
            mode === "delete"
              ? "delete"
              : { kind: "grade", ...(mode === "edit" ? { id } : {}), body: { ...original, name: mode === "create" ? "New grade" : "Updated" } },
          )
        }
      >
        Run
      </button>
      {command.error ? <p role="alert">{command.error}</p> : null}
    </>
  );
}
function open(mode: "create" | "edit" | "delete", allowed = true) {
  const backend = stubBackend({ permissions: allowed ? ["CanManagePayrollConfiguration"] : [] });
  const auth = backend.fetcher.getMockImplementation();
  const state = { grades: [structuredClone(original)], status: 200 };
  const writes: { method: string; body: string; audit: string | null }[] = [];
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    if (input.method === "GET") return Response.json(state.grades);
    writes.push({ method: input.method, body: await input.clone().text(), audit: input.headers.get("Module") });
    return state.status === 200
      ? input.method === "POST"
        ? Response.json(id)
        : new Response(null, { status: 204 })
      : new Response(null, { status: state.status });
  });
  rememberSession();
  render(
    <SessionProvider>
      <ApiProvider>
        <Probe mode={mode} />
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
it("saves an audited pay grade with zero salary and level values intact", async () => {
  const page = open("create");
  await run();
  await waitFor(() => expect(page.writes).toHaveLength(1));
  expect(JSON.parse(page.writes[0]?.body ?? "{}")).toMatchObject({ minSalary: 0, level: 0 });
  expect(page.writes[0]?.audit).toBe("HR Management");
});
it.each(["edit", "delete"] as const)("blocks stale configuration before %s", async (mode) => {
  const page = open(mode);
  page.state.grades = [{ ...original, maxSalary: 150 }];
  await run();
  expect((await screen.findByRole("alert")).textContent).toContain("changed");
  expect(page.writes).toHaveLength(0);
});
it("does not replay an unconfirmed create after a server failure", async () => {
  const page = open("create");
  page.state.status = 503;
  await run();
  await screen.findByRole("alert");
  await run();
  expect(screen.getByRole("alert").textContent).toContain("previous save was not confirmed");
  expect(page.writes).toHaveLength(1);
});
it("keeps the command disabled without the current management permission", async () => {
  const page = open("create", false);
  await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(true));
  expect(page.writes).toHaveLength(0);
});
