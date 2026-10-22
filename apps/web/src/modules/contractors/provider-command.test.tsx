// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { SessionProvider } from "@/shared/auth/session-provider";
import { ApiProvider } from "@/shared/api/api-provider";
import { rememberSession, forgetSession, stubBackend } from "@/test/backend";
import { useProviderCommand } from "./hooks/use-provider-command";
import { providerDefaults } from "./schemas/provider";
import { provider, id, secondService } from "./provider-fixture";
function Probe() {
  const command = useProviderCommand(provider, "save", () => {});
  return (
    <>
      <button
        disabled={!command.allowed || command.busy}
        onClick={() => void command.run({ ...providerDefaults(provider), services: [{ value: secondService, label: "Service B" }] })}
      >
        Save
      </button>
      {command.error ? <p role="alert">{command.error}</p> : null}
    </>
  );
}
function open() {
  const backend = stubBackend({ permissions: ["CanViewContractors", "CanEditContractors", "CanViewServices"] });
  const auth = backend.fetcher.getMockImplementation();
  const writes: string[] = [];
  const state = { row: structuredClone(provider), broken: false, writeStatus: 204 };
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path.endsWith("/collection")) return Response.json({ Country: [{ id, name: "Country" }], Currency: [{ id, name: "Currency" }] });
    if (input.method === "PUT") {
      writes.push(await input.text());
      return new Response(null, { status: state.writeStatus });
    }
    if (path.includes("/services/")) return Response.json({ ...provider.services[0], id: secondService, name: "Service B" });
    if (writes.length && !state.broken) return Response.json({ ...provider, services: [{ ...provider.services[0], id: secondService, name: "Service B" }] });
    return Response.json(state.row);
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
const save = async () => {
  await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false));
  await userEvent.setup().click(screen.getByRole("button"));
};
it("writes all requested service IDs and verifies the actual persisted associations", async () => {
  const page = open();
  await save();
  await waitFor(() => expect(page.writes).toHaveLength(1));
  await waitFor(() => expect(screen.getByRole("button").hasAttribute("disabled")).toBe(false));
  expect(JSON.parse(page.writes[0] ?? "{}").serviceIds).toEqual([secondService]);
  expect(screen.queryByRole("alert")).toBeNull();
});
it("detects the old backend that accepts edits without updating service associations", async () => {
  const page = open();
  page.state.broken = true;
  await save();
  expect((await screen.findByRole("alert")).textContent).toMatch(/associations were not confirmed/);
  await save();
  expect(page.writes).toHaveLength(1);
});
it("refuses stale evidence before a write", async () => {
  const page = open();
  page.state.row = { ...provider, name: "Changed" };
  await save();
  await screen.findByRole("alert");
  expect(page.writes).toHaveLength(0);
});
it("does not replay refused writes", async () => {
  const page = open();
  page.state.writeStatus = 409;
  await save();
  await screen.findByRole("alert");
  await save();
  expect(page.writes).toHaveLength(1);
});
