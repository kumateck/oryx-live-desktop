// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { afterEach, describe, expect, it } from "vitest";
import UserPasswordsPage from "../../pages/(workspace)/settings/user-passwords/page";
import { RouteAccess } from "../../components/shell/route-access";
import { ApiProvider } from "../../shared/api/api-provider";
import { canAccess } from "../../shared/auth/access";
import { passwordAdminAccess } from "../../shared/auth/password-admin";
import { SessionProvider } from "../../shared/auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { navigationCatalog } from "../navigation/catalog.generated";
import { visibleNavigation } from "../navigation/navigation-model";
import { modules } from "../registry";
import { routeAccessRule } from "../registry-model";
import { userPasswordsPath } from "./lib/user-password";

afterEach(() => { cleanup(); forgetSession(); });

const signedIn = (email: string | null, permissions: string[] = []) => ({ state: "authenticated" as const, permissions: new Set(permissions), email });
const entryIds = (email: string | null, permissions: string[] = []) => visibleNavigation(navigationCatalog, signedIn(email, permissions))
  .flatMap((group) => group.items.map((item) => item.id));

describe("password administrator guard", () => {
  it("lets only dkadusei@kumateck.com open the route, ignoring case", () => {
    const rule = routeAccessRule(modules, userPasswordsPath);
    expect(rule).toEqual(passwordAdminAccess);
    if (!rule) return;
    expect(canAccess(rule, signedIn("dkadusei@kumateck.com"))).toBe(true);
    expect(canAccess(rule, signedIn("DKadusei@Kumateck.COM"))).toBe(true);
    expect(canAccess(rule, signedIn("ada@example.com", ["CanViewActiveUser", "CanEditUser", "CanViewChangePassword"]))).toBe(false);
    expect(canAccess(rule, signedIn("dkadusei@kumateck.com.evil.test"))).toBe(false);
    expect(canAccess(rule, signedIn(null))).toBe(false);
    expect(canAccess(rule, { state: "anonymous" })).toBe(false);
  });

  it("shows the menu entry to the administrator only", () => {
    expect(entryIds("dkadusei@kumateck.com")).toContain("system-settings.change-user-password");
    expect(entryIds("ada@example.com", ["CanViewChangePassword", "CanViewActiveUser"])).not.toContain("system-settings.change-user-password");
  });
});

const target = { id: "458da105-a506-44a9-8ff5-8d005a54f294", firstName: "Kofi", lastName: "Boateng", email: "kofi@example.com", isDisabled: false };
interface Call { method: string; path: string; body: string }

function openPage(email: string, respond: () => Response = () => new Response(null, { status: 204 })) {
  const backend = stubBackend({ email });
  rememberSession();
  const calls: Call[] = [];
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    calls.push({ method: input.method, path: url.pathname, body: input.method === "GET" ? "" : await input.clone().text() });
    if (url.pathname === "/api/v1/user") return Response.json({ data: [target], pageIndex: 1, pageCount: 1, totalRecordCount: 1 });
    if (url.pathname === "/api/v1/auth/admin/user-password") return respond();
    return new Response(null, { status: 404 });
  });
  render(<SessionProvider><MemoryRouter initialEntries={[userPasswordsPath]}><ApiProvider>
    <RouteAccess><UserPasswordsPage /></RouteAccess>
  </ApiProvider></MemoryRouter></SessionProvider>);
  return calls;
}

async function fill(newPassword: string, confirmPassword = newPassword) {
  const user = userEvent.setup();
  await user.click(await screen.findByRole("combobox", { name: /^User/ }));
  await user.click(await screen.findByRole("option", { name: "Kofi Boateng · kofi@example.com" }, { timeout: 3000 }));
  await user.type(screen.getByLabelText(/^New password/), newPassword);
  await user.type(screen.getByLabelText(/^Confirm new password/), confirmPassword);
  await user.click(screen.getByRole("button", { name: "Change password" }));
  return user;
}

const writes = (calls: Call[]) => calls.filter((call) => call.method !== "GET");

describe("change user password page", () => {
  it("shows access denied to anyone else without loading users", async () => {
    const calls = openPage("ada@example.com");
    expect(await screen.findByText("You don't have access to this page")).toBeTruthy();
    expect(screen.queryByRole("combobox", { name: /^User/ })).toBeNull();
    expect(calls).toEqual([]);
  });

  it("validates before asking for confirmation", async () => {
    const calls = openPage("dkadusei@kumateck.com");
    await fill("weakpass", "different");
    expect(await screen.findByText("Passwords do not match")).toBeTruthy();
    expect(screen.getByText("Include a digit")).toBeTruthy();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(writes(calls)).toEqual([]);
  });

  it("sends the change only after confirmation and reports success", async () => {
    const calls = openPage("dkadusei@kumateck.com");
    const user = await fill("Fresh#Pass1 ");
    expect(await screen.findByRole("heading", { name: "Change the password for Kofi Boateng · kofi@example.com?" })).toBeTruthy();
    expect(writes(calls)).toEqual([]);
    await user.click(screen.getByRole("button", { name: "Change password" }));
    await waitFor(() => expect(writes(calls)).toHaveLength(1));
    expect(writes(calls)[0]?.path).toBe("/api/v1/auth/admin/user-password");
    expect(JSON.parse(writes(calls)[0]?.body ?? "null")).toEqual({ userId: target.id, newPassword: "Fresh#Pass1 " });
    expect(await screen.findByText(/Password changed for Kofi Boateng/)).toBeTruthy();
    expect((screen.getByLabelText(/^New password/) as HTMLInputElement).value).toBe("");
  });

  it("keeps the form and shows the server's reason when it refuses", async () => {
    openPage("dkadusei@kumateck.com", () => Response.json({ errors: [{ code: "UserPassword.PasswordRequiresDigit", description: "Passwords must have at least one digit ('0'-'9')." }] }, { status: 400 }));
    const user = await fill("Fresh#Pass1");
    await user.click(await screen.findByRole("button", { name: "Change password" }));
    expect(await screen.findByText(/The password was not changed\. Passwords must have at least one digit/)).toBeTruthy();
    expect((screen.getByLabelText(/^New password/) as HTMLInputElement).value).toBe("Fresh#Pass1");
  });
});
