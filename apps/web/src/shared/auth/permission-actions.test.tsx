// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { MemoryRouter } from "react-router";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { SessionProvider, useSession } from "./session-provider";
import { usePermissionAction } from "./use-permission-action";
import { notifyPermissionDenied, notifySessionExpired } from "./session-events";
import { ConfirmActionDialog } from "../actions/confirm-action-dialog";
import { ActionMenuItems } from "../actions/action-menu-items";
import { DropdownMenu, DropdownMenuContent } from "@/components/ui/dropdown-menu";

afterEach(() => { cleanup(); forgetSession(); });

function Refresh() {
  const { refresh } = useSession();
  return <button type="button" onClick={() => void refresh()}>Refresh access</button>;
}

it("blocks a callback retained before permission revocation", async () => {
  const backend = stubBackend({ permissions: ["CanDeleteRole"] });
  rememberSession();
  const retained: { check?: () => string | null } = {};
  function Probe() {
    const permission = usePermissionAction("CanDeleteRole");
    return <><Refresh /><button type="button" onClick={() => { retained.check = permission.check; }}>Remember action</button>
      <span>{permission.allowed ? "Allowed" : "Denied"}</span></>;
  }
  render(<SessionProvider><Probe /></SessionProvider>);
  await screen.findByText("Allowed");
  fireEvent.click(screen.getByText("Remember action"));
  backend.set({ permissions: [] });
  fireEvent.click(screen.getByText("Refresh access"));
  await screen.findByText("Denied");
  expect(retained.check?.()).toContain("access has changed");
});

it("invalidates retained actions immediately on session expiry, before the next render", async () => {
  stubBackend({ permissions: ["CanDeleteRole"] });
  rememberSession();
  const retained: { check?: () => string | null } = {};
  function Probe() {
    const permission = usePermissionAction("CanDeleteRole");
    return <button type="button" disabled={!permission.allowed} onClick={() => { retained.check = permission.check; }}>Remember action</button>;
  }
  render(<SessionProvider><Probe /></SessionProvider>);
  await waitFor(() => expect(screen.getByText("Remember action").hasAttribute("disabled")).toBe(false));
  fireEvent.click(screen.getByText("Remember action"));
  act(() => {
    notifySessionExpired();
    expect(retained.check?.()).toContain("access has changed");
  });
});

it("applies server-confirmed revocation before the refresh render commits", async () => {
  const backend = stubBackend({ permissions: ["CanDeleteRole"] });
  rememberSession();
  const retained: { refresh?: () => Promise<void>; check?: () => string | null } = {};
  function Probe() {
    const { refresh } = useSession();
    const permission = usePermissionAction("CanDeleteRole");
    return <button type="button" disabled={!permission.allowed} onClick={() => {
      retained.refresh = refresh; retained.check = permission.check;
    }}>Remember action</button>;
  }
  render(<SessionProvider><Probe /></SessionProvider>);
  await waitFor(() => expect(screen.getByText("Remember action").hasAttribute("disabled")).toBe(false));
  fireEvent.click(screen.getByText("Remember action"));
  backend.set({ permissions: [] });
  await act(async () => {
    await retained.refresh?.();
    expect(retained.check?.()).toContain("access has changed");
  });
});

it("keeps an open confirmation safe after access changes without calling the mutation", async () => {
  const backend = stubBackend({ permissions: ["CanDeleteRole"] });
  rememberSession();
  const mutate = vi.fn(async () => null);
  render(<SessionProvider><Refresh /><ConfirmActionDialog require="CanDeleteRole" title="Remove role?" description="Removes the role."
    confirmLabel="Remove" busyLabel="Removing" onConfirm={mutate} onClose={() => {}} /></SessionProvider>);
  await waitFor(() => expect(screen.getByRole("button", { name: "Remove" }).hasAttribute("disabled")).toBe(false));
  backend.set({ permissions: [] });
  fireEvent.click(screen.getByText("Refresh access"));
  await waitFor(() => expect(screen.getByRole("button", { name: "Remove" }).hasAttribute("disabled")).toBe(true));
  expect(screen.getByRole("alert").textContent).toContain("access has changed");
  fireEvent.click(screen.getByRole("button", { name: "Remove" }));
  expect(mutate).not.toHaveBeenCalled();
});

it("filters direct menu items too and removes an already open action after revocation", async () => {
  const backend = stubBackend({ permissions: ["CanDeleteRole"] });
  rememberSession();
  const mutate = vi.fn();
  render(<SessionProvider><MemoryRouter><Refresh /><DropdownMenu open><DropdownMenuContent>
    <ActionMenuItems items={[{ id: "delete", label: "Delete role", require: "CanDeleteRole", onSelect: mutate }]} />
  </DropdownMenuContent></DropdownMenu></MemoryRouter></SessionProvider>);
  await screen.findByRole("menuitem", { name: "Delete role" });
  backend.set({ permissions: [] });
  fireEvent.click(screen.getByText("Refresh access"));
  await waitFor(() => expect(screen.queryByRole("menuitem", { name: "Delete role" })).toBeNull());
  expect(mutate).not.toHaveBeenCalled();
});

it("coalesces forbidden responses and refreshes permissions without logging out", async () => {
  const backend = stubBackend({ permissions: ["CanDeleteRole"] });
  rememberSession();
  function Probe() {
    const { state } = useSession();
    const permission = usePermissionAction("CanDeleteRole");
    return <span>{state.status}:{permission.allowed ? "allowed" : "denied"}</span>;
  }
  render(<SessionProvider><Probe /></SessionProvider>);
  await screen.findByText("authenticated:allowed");
  const before = backend.fetcher.mock.calls.length;
  backend.set({ permissions: [] });
  act(() => { notifyPermissionDenied(); notifyPermissionDenied(); notifyPermissionDenied(); });
  await screen.findByText("authenticated:denied");
  expect(backend.fetcher.mock.calls.length - before).toBe(2);
});
