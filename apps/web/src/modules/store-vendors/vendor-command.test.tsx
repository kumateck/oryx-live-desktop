// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, it } from "vitest";
import { SessionProvider } from "@/shared/auth/session-provider";
import { ApiProvider } from "@/shared/api/api-provider";
import { rememberSession, forgetSession, stubBackend } from "@/test/backend";
import { vendorSchema, defaults } from "./schemas/vendor";
import { useVendorCommand } from "./hooks/use-vendor-command";
const id = "01a152ee-6948-7e40-a0f0-8c01e2a43ea9";
const row = vendorSchema.parse({
  id,
  name: "Vendor",
  address: "Address",
  phone: "1234567890",
  email: "vendor@example.com",
  contactPerson: "Contact",
  countryId: id,
  currencyId: id,
  items: [{ item: { id, name: "Item", store: 0 } }],
});
function Probe() {
  const command = useVendorCommand(row, "save", () => {});
  return (
    <>
      <button disabled={!command.allowed || command.busy} onClick={() => void command.run({ ...defaults(row), phone: "+44 1234 567890" })}>
        Save
      </button>
      {command.error ? <p role="alert">{command.error}</p> : null}
    </>
  );
}
function open() {
  const backend = stubBackend({ permissions: ["CanViewVendors", "CanUpdateVendorDetails"] });
  const auth = backend.fetcher.getMockImplementation();
  const writes: { method: string; body: string }[] = [];
  const state = { row: structuredClone(row), status: 204 };
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return auth ? auth(input, init) : new Response(null, { status: 500 });
    const path = new URL(input.url).pathname;
    if (path.endsWith("/collection")) return Response.json({ Country: [{ id, name: "Country" }], Currency: [{ id, name: "Currency" }] });
    if (input.method === "PUT") {
      writes.push({ method: input.method, body: await input.text() });
      return new Response(null, { status: state.status });
    }
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
it("updates contacts while retaining existing item associations without requiring new item access", async () => {
  const page = open();
  await save();
  await waitFor(() => expect(page.writes).toHaveLength(1));
  expect(JSON.parse(page.writes[0]?.body ?? "{}")).toMatchObject({ phone: "+44 1234 567890", itemIds: [id] });
});
it("refuses stale vendor evidence before a write", async () => {
  const page = open();
  page.state.row = { ...row, address: "Changed" };
  await save();
  await screen.findByRole("alert");
  expect(page.writes).toHaveLength(0);
});
it("does not replay a refused write from the same editor", async () => {
  const page = open();
  page.state.status = 409;
  await save();
  await screen.findByRole("alert");
  await save();
  expect(page.writes).toHaveLength(1);
});
