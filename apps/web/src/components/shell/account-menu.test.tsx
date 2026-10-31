// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
import { z } from "zod";
import { ApiProvider } from "@/shared/api/api-provider";
import { SessionProvider, useCurrentUser, useSession } from "@/shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend, testUserId } from "@/test/backend";
import { AccountMenu } from "./account-menu";

HTMLElement.prototype.hasPointerCapture = () => false;
HTMLElement.prototype.setPointerCapture = () => {};
HTMLElement.prototype.releasePointerCapture = () => {};
HTMLElement.prototype.scrollIntoView = () => {};
afterEach(() => { cleanup(); forgetSession(); });

const other = "6a8da105-a506-44a9-8ff5-8d005a54f2aa";
interface Call { method: string; path: string; body?: { departmentId: string | null }; module?: string | null; subModule?: string | null }
interface Department { id: string; name: string; type: 0 }
const quality: Department = { id: "558da105-a506-44a9-8ff5-8d005a54f294", name: "Quality", type: 0 };
const liquids: Department = { id: other, name: "Oral liquids", type: 0 };
const switchBody = z.object({ departmentId: z.uuid().nullable() });

function HeaderAvatar() {
  const user = useCurrentUser();
  const { logout } = useSession();
  return user ? <AccountMenu user={user} onLogout={logout} /> : null;
}

function open(options: { roles?: string[]; permissions?: string[]; refuseSwitch?: boolean; failSwitch?: boolean; failDepartments?: boolean; noDepartment?: boolean } = {}) {
  const backend = stubBackend({ permissions: options.permissions ?? [] });
  const session = backend.fetcher.getMockImplementation();
  const calls: Call[] = [];
  let department: Department | null = options.noDepartment ? null : quality;
  backend.fetcher.mockImplementation(async (input, init) => {
    const request = input instanceof Request ? input : new Request(new URL(String(input), window.location.origin), init);
    const path = new URL(request.url).pathname;
    if (path === "/api/v1/user/authenticated") return Response.json({ id: testUserId, firstName: "Ada", lastName: "Mensah", email: "ada@example.com", avatar: null,
      department, roles: (options.roles ?? []).map((name) => ({ name })) });
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const call: Call = { method: request.method, path };
    calls.push(call);
    if (path === "/api/v1/department") return options.failDepartments ? new Response(null, { status: 503 })
      : Response.json({ data: [quality, liquids], pageIndex: 1, pageCount: 1 });
    if (path === "/api/v1/user/switch-department" && request.method === "POST") {
      call.body = switchBody.parse(await request.json());
      call.module = request.headers.get("Module");
      call.subModule = request.headers.get("SubModule");
      if (options.refuseSwitch) return new Response(null, { status: 403 });
      if (options.failSwitch) return new Response(null, { status: 503 });
      department = call.body.departmentId === null ? null : [quality, liquids].find((item) => item.id === call.body?.departmentId) ?? null;
      return new Response(null, { status: 204 });
    }
    return new Response(null, { status: 404 });
  });
  rememberSession();
  render(<SessionProvider><ApiProvider><MemoryRouter><HeaderAvatar /></MemoryRouter></ApiProvider></SessionProvider>);
  return calls;
}

async function openAvatar() {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("button", { name: "Account menu for Ada Mensah" }));
  return user;
}

async function switchToOralLiquids(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("menuitem", { name: "Switch department" }));
  const dialog = await screen.findByRole("dialog");
  await user.click(within(dialog).getByRole("combobox"));
  // The current department is not offered.
  expect(screen.queryByRole("option", { name: "Quality" })).toBeNull();
  await user.click(await screen.findByRole("option", { name: "Oral liquids" }));
  await user.click(within(dialog).getByRole("button", { name: "Switch to Oral liquids" }));
  return dialog;
}

it("does not offer switching department without the permission, whatever the role", async () => {
  open({ roles: ["super", "Warehouse Manager"], permissions: ["CanViewActiveUser"] });
  await openAvatar();
  expect(await screen.findByRole("menuitem", { name: "Account" })).toBeTruthy();
  expect(screen.queryByRole("menuitem", { name: "Switch department" })).toBeNull();
});

it("switches department from the avatar menu and reads the session again", async () => {
  const calls = open({ roles: ["Operator"], permissions: ["CanSwitchDepartment"] });
  const user = await openAvatar();
  await user.click(await screen.findByRole("menuitem", { name: "Switch department" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("Current role").nextSibling?.textContent).toBe("Operator");
  expect(within(dialog).getByText("Current department").nextSibling?.textContent).toBe("Quality");
  await user.click(within(dialog).getByRole("button", { name: "Cancel" }));
  await openAvatar();
  await switchToOralLiquids(user);
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(calls.filter((call) => call.method === "POST").map((call) => ({ path: call.path, body: call.body })))
    .toEqual([{ path: "/api/v1/user/switch-department", body: { departmentId: other } }]);
  await openAvatar();
  expect(await screen.findByText("Oral liquids")).toBeTruthy();
}, 20_000);

it("explains a refusal from the server and keeps the department", async () => {
  const calls = open({ permissions: ["CanSwitchDepartment"], refuseSwitch: true });
  const user = await openAvatar();
  const dialog = await switchToOralLiquids(user);
  expect(await within(dialog).findByText(/You do not have permission to switch department/)).toBeTruthy();
  expect(calls.filter((call) => call.method === "POST").map((call) => call.body)).toEqual([{ departmentId: other }]);
}, 20_000);

async function chooseNoDepartment(user: ReturnType<typeof userEvent.setup>) {
  await user.click(await screen.findByRole("menuitem", { name: "Switch department" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByRole("button", { name: "Switch" }).hasAttribute("disabled")).toBe(true);
  await user.click(within(dialog).getByRole("combobox", { name: "Department" }));
  await user.click(await screen.findByRole("option", { name: "No department" }));
  await user.click(within(dialog).getByRole("button", { name: "Remove department" }));
  return dialog;
}

it("saves an explicit null with audit headers and reloads the unassigned session", async () => {
  const calls = open({ permissions: ["CanSwitchDepartment"] });
  await chooseNoDepartment(await openAvatar());
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(calls.filter((call) => call.method === "POST")).toEqual([{
    method: "POST", path: "/api/v1/user/switch-department", body: { departmentId: null },
    module: "User Management", subModule: "Switch Department",
  }]);
  await openAvatar();
  expect(await screen.findByText("No department", { exact: true })).toBeTruthy();
});

it("lets an unassigned user choose a department without offering a redundant clear", async () => {
  const calls = open({ permissions: ["CanSwitchDepartment"], noDepartment: true });
  const user = await openAvatar();
  await user.click(await screen.findByRole("menuitem", { name: "Switch department" }));
  const dialog = await screen.findByRole("dialog");
  expect(within(dialog).getByText("Current department").nextSibling?.textContent).toBe("No department");
  await user.click(within(dialog).getByRole("combobox"));
  expect(screen.queryByRole("option", { name: "No department" })).toBeNull();
  await user.click(await screen.findByRole("option", { name: "Oral liquids" }));
  await user.click(within(dialog).getByRole("button", { name: "Switch to Oral liquids" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(calls.filter((call) => call.method === "POST").map((call) => call.body)).toEqual([{ departmentId: other }]);
});

it("can remove the assignment when the department list cannot be loaded", async () => {
  const calls = open({ permissions: ["CanSwitchDepartment"], failDepartments: true });
  await chooseNoDepartment(await openAvatar());
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  expect(calls.filter((call) => call.method === "POST").map((call) => call.body)).toEqual([{ departmentId: null }]);
});

it.each([{ refuseSwitch: true, reason: /You do not have permission to switch department/ },
  { failSwitch: true, reason: /The server could not complete the request \(503\)/ }])(
  "keeps the current department and the selected clear option when saving is refused: $reason", async (failure) => {
    const calls = open({ permissions: ["CanSwitchDepartment"], ...failure });
    const dialog = await chooseNoDepartment(await openAvatar());
    expect(await within(dialog).findByText(failure.reason)).toBeTruthy();
    expect(within(dialog).getByText("Current department").nextSibling?.textContent).toBe("Quality");
    expect(within(dialog).getByRole("combobox").textContent).toBe("No department");
    expect(calls.filter((call) => call.method === "POST").map((call) => call.body)).toEqual([{ departmentId: null }]);
  });
