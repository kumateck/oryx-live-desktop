// @vitest-environment jsdom
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
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
interface Call { method: string; path: string }

function HeaderAvatar() {
  const user = useCurrentUser();
  const { logout } = useSession();
  return user ? <AccountMenu user={user} onLogout={logout} /> : null;
}

function open(options: { roles?: string[]; permissions?: string[]; refuseSwitch?: boolean } = {}) {
  const backend = stubBackend({ permissions: options.permissions ?? [] });
  const session = backend.fetcher.getMockImplementation();
  const calls: Call[] = [];
  let department = { id: "558da105-a506-44a9-8ff5-8d005a54f294", name: "Quality", type: 0 };
  backend.fetcher.mockImplementation(async (input, init) => {
    const request = input instanceof Request ? input : new Request(new URL(String(input), window.location.origin), init);
    const path = new URL(request.url).pathname;
    if (path === "/api/v1/user/authenticated") return Response.json({ id: testUserId, firstName: "Ada", lastName: "Mensah", email: "ada@example.com", avatar: null,
      department, roles: (options.roles ?? []).map((name) => ({ name })) });
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    calls.push({ method: request.method, path });
    if (path === "/api/v1/department") return Response.json({ data: [department, { id: other, name: "Oral liquids", type: 0 }], pageIndex: 1, pageCount: 1 });
    if (path === `/api/v1/user/switch-department/${other}`) {
      if (options.refuseSwitch) return new Response(null, { status: 403 });
      department = { id: other, name: "Oral liquids", type: 0 };
      return new Response(null, { status: 200 });
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
  expect(calls.filter((call) => call.method === "POST").map((call) => call.path)).toEqual([`/api/v1/user/switch-department/${other}`]);
  await openAvatar();
  expect(await screen.findByText("Oral liquids")).toBeTruthy();
}, 20_000);

it("explains a refusal from the server and keeps the department", async () => {
  const calls = open({ permissions: ["CanSwitchDepartment"], refuseSwitch: true });
  const user = await openAvatar();
  const dialog = await switchToOralLiquids(user);
  expect(await within(dialog).findByText(/You do not have permission to switch department/)).toBeTruthy();
  expect(calls.filter((call) => call.method === "POST").map((call) => call.path)).toEqual([`/api/v1/user/switch-department/${other}`]);
}, 20_000);
