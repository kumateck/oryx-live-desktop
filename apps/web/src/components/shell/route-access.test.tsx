// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { useEffect } from "react";
import { MemoryRouter, useLocation } from "react-router";
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

it("lets the user refresh access after an administrator grants the page permission", async () => {
  const backend = stubBackend({ permissions: [] });
  rememberSession();
  render(<SessionProvider><MemoryRouter initialEntries={["/access-management/roles/create"]}>
    <RouteAccess><p>Page content</p></RouteAccess>
  </MemoryRouter></SessionProvider>);
  await screen.findByRole("alert");
  backend.set({ permissions: ["CanCreateRole"] });
  fireEvent.click(screen.getByRole("button", { name: "Refresh access" }));
  expect(await screen.findByText("Page content")).toBeTruthy();
});

it("allows explicitly declared personal settings without ERP permissions", async () => {
  open("/settings/appearance", []);
  expect(await screen.findByText("Page content")).toBeTruthy();
});

it("denies an undeclared child of authenticated settings before mounting it", async () => {
  open("/settings/future-admin-tool", []);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByText("Page content")).toBeNull();
});

it("denies a route without an owning module", async () => {
  open("/future-admin-tool", []);
  expect(await screen.findByRole("alert")).toBeTruthy();
  expect(screen.queryByText("Page content")).toBeNull();
});

it("redirects to an allowed tab before its page can mount and fetch", async () => {
  const mounted: string[] = [];
  function Page() {
    const { search, hash } = useLocation();
    useEffect(() => { mounted.push(search); }, [search]);
    return <p>Loaded {search}{hash}</p>;
  }
  stubBackend({ permissions: ["CanViewLocalQuotation"] });
  rememberSession();
  render(<SessionProvider><MemoryRouter initialEntries={["/procurement/quotations?type=0&page=9&search=Acme#summary"]}>
    <RouteAccess><Page /></RouteAccess>
  </MemoryRouter></SessionProvider>);
  await screen.findByText("Loaded ?type=1&search=Acme#summary");
  expect(mounted).toEqual(["?type=1&search=Acme"]);
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
