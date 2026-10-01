// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
import UsersPage from "../../../pages/(workspace)/access-management/users/page";
import { ApiProvider } from "../../../shared/api/api-provider";
import { SessionProvider } from "../../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../../test/backend";

afterEach(() => { cleanup(); forgetSession(); });

const ada = { id: "458da105-a506-44a9-8ff5-8d005a54f294", firstName: "Ada", lastName: "Mensah", email: "ada@example.com", isDisabled: false,
  department: { name: "Quality" }, roles: [{ id: "11111111-1111-4111-8111-111111111111", name: "qa", displayName: "QA Manager" }] };
const roles = [{ id: "11111111-1111-4111-8111-111111111111", name: "qa", displayName: "QA Manager" },
  { id: "22222222-2222-4222-8222-222222222222", name: "analyst", displayName: "Analyst" }];

interface Call { method: string; path: string; search: string; body: string | null }

/** Signs in with the given permissions and answers the user and role endpoints. */
function openUsers(permissions: string[], address = "/access-management/users") {
  const backend = stubBackend({ permissions });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ method: input.method, path: url.pathname, search: url.search, body: input.method === "GET" ? null : await input.clone().text() });
    if (url.pathname === "/api/v1/user") return Response.json({ data: [ada], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname === "/api/v1/role") return Response.json(roles);
    if (input.method === "PUT") return new Response(null, { status: 204 });
    return new Response(null, { status: 404 });
  });
  render(<SessionProvider><MemoryRouter initialEntries={[address]}><ApiProvider><UsersPage /></ApiProvider></MemoryRouter></SessionProvider>);
  return calls;
}

const openMenu = async () => {
  const trigger = await screen.findByRole("button", { name: "Actions for Ada Mensah" });
  fireEvent.pointerDown(trigger, { button: 0, ctrlKey: false });
};

it("lists users for the permitted tab and offers only the actions the user holds", async () => {
  const calls = openUsers(["CanViewActiveUser"], "/access-management/users?status=1");
  expect(await screen.findByText("ada@example.com")).toBeTruthy();
  expect(calls.find((call) => call.path === "/api/v1/user")?.search).toContain("isActive=false");
  expect(screen.queryByRole("tablist")).toBeNull();
  expect(screen.queryByRole("link", { name: "Create user" })).toBeNull();
  await openMenu();
  expect(await screen.findByRole("menuitem", { name: "User details" })).toBeTruthy();
  expect(screen.queryByRole("menuitem", { name: "Change role" })).toBeNull();
  expect(screen.queryByRole("menuitem", { name: "Block user" })).toBeNull();
});

it("offers every action to a full administrator and blocks a user after confirmation", async () => {
  const calls = openUsers(["CanViewActiveUser", "CanViewInactiveUser", "CanEditUser", "CanBlockUser", "CanCreateUser"]);
  expect(await screen.findByRole("tab", { name: "Inactive" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Create user" }).getAttribute("href")).toBe("/access-management/users/create");
  await openMenu();
  fireEvent.click(await screen.findByRole("menuitem", { name: "Block user" }));
  expect(await screen.findByRole("heading", { name: "Block Ada Mensah?" })).toBeTruthy();
  fireEvent.click(screen.getByRole("button", { name: "Block user" }));
  await waitFor(() => expect(calls.some((call) => call.method === "PUT" && call.path === `/api/v1/user/toggle-disable/${ada.id}`)).toBe(true));
  await waitFor(() => expect(screen.queryByRole("heading", { name: "Block Ada Mensah?" })).toBeNull());
  // The list is reloaded after the change.
  await waitFor(() => expect(calls.filter((call) => call.path === "/api/v1/user").length).toBeGreaterThan(1));
});
