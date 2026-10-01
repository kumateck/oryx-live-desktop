// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import { afterEach, expect, it } from "vitest";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { SessionProvider } from "../../shared/auth/session-provider";
import { RouteAccess } from "./route-access";

afterEach(() => { cleanup(); forgetSession(); });

function open(path: string, permissions: string[]) {
  stubBackend({ permissions });
  rememberSession();
  render(<SessionProvider><MemoryRouter initialEntries={[path]}><RouteAccess><p>Page content</p></RouteAccess></MemoryRouter></SessionProvider>);
}

it("blocks a module route the user's roles do not include", async () => {
  open("/access-management/roles/create", ["CanViewRoles"]);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.getByText("You don't have access to this page")).toBeTruthy();
  expect(screen.queryByText("Page content")).toBeNull();
});

it("opens a route once the matching permission is held", async () => {
  open("/access-management/roles/create", ["CanCreateRole"]);
  expect(await screen.findByText("Page content")).toBeTruthy();
});

it("leaves routes outside any module to the signed-in workspace", async () => {
  open("/settings/appearance", []);
  expect(await screen.findByText("Page content")).toBeTruthy();
});

it("blocks a production-only page for a user outside production departments", async () => {
  stubBackend({ permissions: ["CanViewPlannedProducts"], departmentType: 1 });
  rememberSession();
  render(<SessionProvider><MemoryRouter initialEntries={["/production/products"]}><RouteAccess><p>Page content</p></RouteAccess></MemoryRouter></SessionProvider>);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByText("Page content")).toBeNull();
});

it("opens the production-only page for a production user", async () => {
  stubBackend({ permissions: ["CanViewPlannedProducts"], departmentType: 0 });
  rememberSession();
  render(<SessionProvider><MemoryRouter initialEntries={["/production/products"]}><RouteAccess><p>Page content</p></RouteAccess></MemoryRouter></SessionProvider>);
  expect(await screen.findByText("Page content")).toBeTruthy();
});
