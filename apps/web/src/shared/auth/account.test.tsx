// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
import { ApiProvider } from "@/shared/api/api-provider";
import { forgetSession, rememberSession, stubBackend, testUserId } from "@/test/backend";
import { AccountSummary } from "./account-summary";
import { maySwitchDepartment } from "./session-api";
import { SessionProvider } from "./session-provider";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

const other = "6a8da105-a506-44a9-8ff5-8d005a54f2aa";
const png: Uint8Array<ArrayBuffer> = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 1, 2, 3, 4]);
interface Call { method: string; path: string }

function open(options: { roles?: string[]; storedPhoto?: Uint8Array<ArrayBuffer> } = {}) {
  const backend = stubBackend();
  const session = backend.fetcher.getMockImplementation();
  const calls: Call[] = [];
  let department = { id: "558da105-a506-44a9-8ff5-8d005a54f294", name: "Quality", type: 0 };
  backend.fetcher.mockImplementation(async (input, init) => {
    const request = input instanceof Request ? input : new Request(new URL(String(input), window.location.origin), init);
    const path = new URL(request.url).pathname;
    if (path === "/api/v1/user/authenticated") return Response.json({ id: testUserId, firstName: "Ada", lastName: "Mensah", email: "ada@example.com", avatar: `http://server.invalid/api/v1/file/avatar/${testUserId}.png`,
      department, roles: (options.roles ?? []).map((name) => ({ name })) });
    if (!(input instanceof Request) && !path.startsWith("/api/v1/file/")) return session ? session(input, init) : new Response(null, { status: 500 });
    calls.push({ method: request.method, path });
    if (path.startsWith("/api/v1/file/avatar/")) return new Response(options.storedPhoto ?? png);
    if (path === "/api/v1/department") return Response.json({ data: [department, { id: other, name: "Oral liquids", type: 0 }], pageIndex: 1, pageCount: 1 });
    if (path === `/api/v1/user/switch-department/${other}`) { department = { id: other, name: "Oral liquids", type: 0 }; return new Response(null, { status: 200 }); }
    return new Response(null, { status: request.method === "POST" ? 204 : 404 });
  });
  rememberSession();
  render(<SessionProvider><ApiProvider><MemoryRouter><AccountSummary /></MemoryRouter></ApiProvider></SessionProvider>);
  return calls;
}

async function choosePhoto() {
  // The field loads on demand; its placeholder is labelled "Loading New photo" until then.
  const input = await waitFor(() => { const found = document.querySelector<HTMLInputElement>('input[type="file"]'); if (!found) throw new Error("photo field not loaded"); return found; });
  fireEvent.change(input, { target: { files: [new File([png], "me.png", { type: "image/png" })] } });
  fireEvent.click(screen.getByRole("button", { name: "Save photo" }));
}

it("offers switching department only to the roles the server allows", () => {
  expect([maySwitchDepartment({ roles: ["Warehouse Manager"] }), maySwitchDepartment({ roles: ["super"] }), maySwitchDepartment({ roles: ["Operator", "Admin"] }), maySwitchDepartment(null)]).toEqual([true, true, false, false]);
});

it("saves a photo only once the server gives back the same image", async () => {
  const calls = open();
  await choosePhoto();
  // Saved: the photo was read back, nothing was refused, and the form is ready for another.
  await waitFor(() => expect(calls.some((call) => call.path === `/api/v1/file/avatar/${testUserId}.png`)).toBe(true));
  await waitFor(() => expect((screen.getByRole("button", { name: "Save photo" }) as HTMLButtonElement).disabled).toBe(false));
  expect(screen.queryByRole("alert")).toBeNull();
  expect(calls.filter((call) => call.method === "POST").map((call) => call.path)).toEqual([`/api/v1/user/avatar/${testUserId}`]);
  expect(calls.some((call) => call.path === `/api/v1/file/avatar/${testUserId}.png`)).toBe(true);
  expect(screen.queryByRole("button", { name: "Switch department" })).toBeNull();
});

it("says so when the upload answered 204 but the old photo is still stored", async () => {
  open({ storedPhoto: new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10, 9, 9]) });
  await choosePhoto();
  expect(await screen.findByText(/did not confirm the new photo was stored/)).toBeTruthy();
});

it("moves an allowed user to another production department and reads the session again", async () => {
  const user = userEvent.setup();
  const calls = open({ roles: ["Warehouse Manager"] });
  await user.click(await screen.findByRole("button", { name: "Switch department" }));
  const dialog = await screen.findByRole("dialog");
  expect(dialog.textContent).toContain("saved on your account");
  await user.click(within(dialog).getByRole("combobox"));
  // The current department is not offered.
  expect(screen.queryByRole("option", { name: "Quality" })).toBeNull();
  await user.click(await screen.findByRole("option", { name: "Oral liquids" }));
  await user.click(within(dialog).getByRole("button", { name: "Switch to Oral liquids" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(calls.filter((call) => call.method === "POST").map((call) => call.path)).toEqual([`/api/v1/user/switch-department/${other}`]);
  expect(await screen.findByText(/^Oral liquids/)).toBeTruthy();
}, 20_000);
