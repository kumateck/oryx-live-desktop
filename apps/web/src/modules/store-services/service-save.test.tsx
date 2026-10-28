// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { SessionProvider } from "@/shared/auth/session-provider";
import { ApiProvider } from "@/shared/api/api-provider";
import { rememberSession, forgetSession, stubBackend } from "@/test/backend";
import { useServiceSave } from "./hooks/use-service-save";
import { service, serviceId } from "./service-fixture";
function Probe() {
  const command = useServiceSave(null, () => {});
  return (
    <>
      <button
        disabled={command.busy || !command.allowed}
        onClick={() =>
          void command.run({
            name: "New service",
            code: "SVC002",
            start: new Date("2026-10-01"),
            end: new Date("2027-10-01"),
            description: "",
            files: [new File(["PDF bytes"], "work.pdf")],
          })
        }
      >
        Save
      </button>
      {command.savedId ? <p role="status">Saved {command.savedId}</p> : null}
      {command.error ? <p role="alert">{command.error}</p> : null}
    </>
  );
}
function open() {
  const backend = stubBackend({ permissions: ["CanViewServices", "CanCreateService"] });
  const auth = backend.fetcher.getMockImplementation();
  const writes: string[] = [];
  const state = { uploadStatus: 204, duplicate: false };
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    const path = url.pathname;
    if (input.method === "POST") {
      writes.push(path);
      return path.includes("/file/") ? new Response(null, { status: state.uploadStatus }) : Response.json(serviceId);
    }
    if (path.endsWith("/services")) {
      const rows = state.duplicate && url.searchParams.get("isActive") === "true" ? [{ ...service, name: "New service" }] : [];
      return Response.json({ data: rows, pageIndex: 1, pageCount: 1, totalRecordCount: rows.length });
    }
    return Response.json(service);
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
it("saves the service once before uploading attachments with the confirmed identity", async () => {
  const page = open();
  await save();
  await waitFor(() => expect(page.writes).toEqual(["/api/v1/services", `/api/v1/file/Service/${serviceId}`]));
});
it("retains the saved identity and does not recreate or replay an unconfirmed attachment stage", async () => {
  const page = open();
  page.state.uploadStatus = 500;
  await save();
  await screen.findByRole("alert");
  expect(screen.getByRole("status").textContent).toContain(serviceId);
  await save();
  expect(page.writes).toHaveLength(2);
});
it("refuses a duplicate name before creating a service or uploading files", async () => {
  const page = open();
  page.state.duplicate = true;
  await save();
  await screen.findByRole("alert");
  expect(page.writes).toHaveLength(0);
});
