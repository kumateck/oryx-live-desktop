// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { PermissionGuard } from "./permission-guard";
import { notifySessionExpired } from "./session-events";
import { SessionProvider, useSession } from "./session-provider";

function Probe() {
  const { state, refresh } = useSession();
  return <div>
    <p data-testid="status">{state.status}{state.status === "anonymous" ? `:${state.reason ?? "none"}` : ""}</p>
    <button type="button" onClick={() => void refresh()}>refresh</button>
    <PermissionGuard require="CanViewRoles" fallback={<span>roles hidden</span>}><span>roles shown</span></PermissionGuard>
    <PermissionGuard require={{ kind: "some", permissions: ["CanCreateRole", "CanEditRole"] }}><span>can change roles</span></PermissionGuard>
  </div>;
}

const status = () => screen.getByTestId("status").textContent;
afterEach(() => { cleanup(); forgetSession(); });

it("applies permission changes on refresh without leaving the workspace", async () => {
  const backend = stubBackend();
  rememberSession();
  render(<SessionProvider><Probe /></SessionProvider>);
  await waitFor(() => expect(status()).toBe("authenticated"));
  expect(screen.getByText("roles hidden")).toBeTruthy();
  expect(screen.queryByText("can change roles")).toBeNull();
  backend.set({ permissions: ["CanViewRoles", "CanEditRole"] });
  act(() => screen.getByRole("button", { name: "refresh" }).click());
  expect(await screen.findByText("roles shown")).toBeTruthy();
  expect(screen.getByText("can change roles")).toBeTruthy();
  expect(status()).toBe("authenticated");
});

it("keeps the workspace open when a background check cannot reach the server", async () => {
  const backend = stubBackend({ permissions: ["CanViewRoles"] });
  rememberSession();
  render(<SessionProvider><Probe /></SessionProvider>);
  expect(await screen.findByText("roles shown")).toBeTruthy();
  const calls = backend.fetcher.mock.calls.length;
  backend.fetcher.mockRejectedValue(new TypeError("offline"));
  act(() => screen.getByRole("button", { name: "refresh" }).click());
  await waitFor(() => expect(backend.fetcher.mock.calls.length).toBeGreaterThan(calls));
  expect(status()).toBe("authenticated");
});

it("renews an expired access token during a check instead of signing the user out", async () => {
  const backend = stubBackend({ permissions: ["CanViewRoles"] });
  rememberSession();
  render(<SessionProvider><Probe /></SessionProvider>);
  expect(await screen.findByText("roles shown")).toBeTruthy();
  let rejected = 0;
  const original = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (String(input).includes("/user/authenticated") && rejected++ === 0) return new Response(null, { status: 401 });
    return original ? original(input, init) : new Response(null, { status: 500 });
  });
  act(() => screen.getByRole("button", { name: "refresh" }).click());
  await waitFor(() => expect(rejected).toBeGreaterThan(1));
  expect(status()).toBe("authenticated");
});

it("records why the user was signed out", async () => {
  const backend = stubBackend({ permissions: ["CanViewRoles"] });
  rememberSession();
  render(<SessionProvider><Probe /></SessionProvider>);
  expect(await screen.findByText("roles shown")).toBeTruthy();
  backend.set({ profileStatus: 401, refreshStatus: 400 });
  act(() => screen.getByRole("button", { name: "refresh" }).click());
  await waitFor(() => expect(status()).toBe("anonymous:expired"));
  expect(screen.getByText("roles hidden")).toBeTruthy();
});

it("signs out a disabled account instead of offering a retry", async () => {
  stubBackend({ disabled: true });
  rememberSession();
  render(<SessionProvider><Probe /></SessionProvider>);
  await waitFor(() => expect(status()).toBe("anonymous:disabled"));
});

it("marks the session expired when an API request is rejected", async () => {
  stubBackend();
  rememberSession();
  render(<SessionProvider><Probe /></SessionProvider>);
  await waitFor(() => expect(status()).toBe("authenticated"));
  act(notifySessionExpired);
  expect(status()).toBe("anonymous:expired");
});
