// @vitest-environment jsdom
import { useEffect, useSyncExternalStore } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it } from "vitest";
import { RouteAccess } from "@/components/shell/route-access";
import { SessionProvider, useSession } from "../auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "@/test/backend";
import { WorkspaceTabs } from "./workspace-tabs";
import { WorkspaceTabView } from "./tab-view";
import { isDesktopRenderer } from "./is-desktop";
import { scopedDestinationKey } from "./scoped-destination";

let mounted = 0;
function ProtectedPage() { useEffect(() => { mounted++; }, []); return <p>Protected users</p>; }
function Refresh() { const { refresh } = useSession(); return <button onClick={() => void refresh()}>Reload session</button>; }
function Views({ workspace }: { workspace: WorkspaceTabs }) {
  const { tabs, activeId } = useSyncExternalStore(workspace.subscribe, workspace.getSnapshot);
  return <><Refresh />{tabs.map((tab) => <WorkspaceTabView key={tab.id} tab={tab} workspace={workspace} active={tab.id === activeId} pending={false} />)}</>;
}
let workspace: WorkspaceTabs | undefined;
afterEach(() => { cleanup(); workspace?.dispose(); workspace = undefined; forgetSession(); delete window.oryxSession; });

it("uses only the isolated desktop capability to enable tabs", () => {
  expect(isDesktopRenderer()).toBe(false);
  window.oryxSession = { load: async () => null, save: async () => {} };
  expect(isDesktopRenderer()).toBe(true);
});

it("normalizes omitted query choices from manifest permissions without merging different choices", () => {
  const allowed = () => true;
  const raw = { pathname: "/warehouse/materials", search: "?type=0", hash: "" };
  expect(scopedDestinationKey({ ...raw, search: "" }, allowed)).toBe(scopedDestinationKey(raw, allowed));
  expect(scopedDestinationKey({ ...raw, search: "?type=1" }, allowed)).not.toBe(scopedDestinationKey(raw, allowed));
});

it("guards each tab before page effects mount and removes revoked inactive content", async () => {
  mounted = 0;
  const backend = stubBackend({ permissions: [] });
  rememberSession();
  workspace = new WorkspaceTabs([
    { path: "/access-management/users", element: <RouteAccess><ProtectedPage /></RouteAccess> },
    { path: "/settings/account", element: <p>Personal account</p> },
  ], () => false);
  workspace.open({ pathname: "/access-management/users", search: "", hash: "" });
  const tabId = workspace.getSnapshot().activeId;
  render(<SessionProvider><Views workspace={workspace} /></SessionProvider>);
  await screen.findByText(/don't have access/i);
  expect(mounted).toBe(0);
  backend.set({ permissions: ["CanViewActiveUser"] });
  fireEvent.click(screen.getByRole("button", { name: "Reload session" }));
  await screen.findByText("Protected users");
  expect(mounted).toBe(1);
  // A dirty page stays mounted, so revocation must work without relying on suspension.
  act(() => { workspace?.setDirty(tabId, "fixture", true); workspace?.open({ pathname: "/settings/account", search: "", hash: "" }); });
  backend.set({ permissions: [] });
  fireEvent.click(screen.getByRole("button", { name: "Reload session" }));
  await waitFor(() => expect(screen.queryByText("Protected users")).toBeNull());
  act(() => workspace?.focus(tabId));
  expect(await screen.findByText(/don't have access/i)).toBeTruthy();
});
