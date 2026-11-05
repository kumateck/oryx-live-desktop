// @vitest-environment jsdom
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, expect, it } from "vitest";
import { DesktopTabContext, useWorkspaceSidebar } from "./context";
import { WorkspaceTabs } from "./workspace-tabs";

const Page = () => <p>page</p>;
const routes = [{ path: "/home", Component: Page }, { path: "/records/:id", Component: Page }];
const at = (pathname: string) => ({ pathname, search: "", hash: "" });
let workspace: WorkspaceTabs;
const paths = () => workspace.getSnapshot().tabs.map((tab) => tab.location.pathname);
const activePath = () => workspace.active()?.location.pathname;

beforeEach(() => { window.localStorage.clear(); workspace = new WorkspaceTabs(routes, () => false); });
afterEach(() => { cleanup(); workspace.dispose(); });

function SidebarProbe() {
  const [open, setOpen] = useWorkspaceSidebar();
  return <button onClick={() => setOpen(!open)}>{open ? "Sidebar open" : "Sidebar closed"}</button>;
}

it("re-renders every tab's shell when the shared sidebar is toggled, and remembers the choice", async () => {
  workspace.open(at("/records/a"));
  const id = workspace.getSnapshot().activeId;
  render(<DesktopTabContext.Provider value={{ workspace, id }}><SidebarProbe /></DesktopTabContext.Provider>);
  await userEvent.click(screen.getByRole("button", { name: "Sidebar open" }));
  expect(screen.getByRole("button", { name: "Sidebar closed" })).toBeTruthy();
  act(() => workspace.toggleSidebar());
  expect(screen.getByRole("button", { name: "Sidebar open" })).toBeTruthy();
  act(() => workspace.setSidebar(false));
  expect(new WorkspaceTabs(routes, () => false).getSnapshot().sidebarOpen).toBe(false);
});

it("navigates the current tab, or switches to a tab already showing the page", async () => {
  workspace.open(at("/records/a"));
  workspace.open(at("/records/b"));
  act(() => workspace.navigate(at("/records/c"), "Record C"));
  await waitFor(() => expect(activePath()).toBe("/records/c"));
  expect(paths()).toEqual(["/records/a", "/records/c"]);
  expect(workspace.active()?.title).toBe("Record C");
  act(() => workspace.navigate(at("/records/a")));
  expect(activePath()).toBe("/records/a");
  expect(paths()).toHaveLength(2);
});

it("turns the New tab picker into the chosen page without a back entry", async () => {
  workspace.open(at("/records/a"));
  act(() => workspace.newTab());
  expect(workspace.active()?.picker).toBe(true);
  act(() => workspace.navigate(at("/records/b"), "Record B"));
  await waitFor(() => expect(workspace.active()?.picker).toBe(false));
  expect(activePath()).toBe("/records/b");
  expect(workspace.active()?.back).toBe(false);
});

it("opens link tabs beside the current tab and closes towards the right", () => {
  workspace.open(at("/records/a"));
  workspace.open(at("/records/b"));
  workspace.focusIndex(0);
  workspace.open(at("/records/c"));
  expect(paths()).toEqual(["/records/a", "/records/c", "/records/b"]);
  workspace.close(workspace.getSnapshot().activeId);
  expect(activePath()).toBe("/records/b");
  workspace.focusIndex(-1);
  expect(activePath()).toBe("/records/b");
});

it("keeps unsaved tabs open in bulk closes and can reopen closed tabs", () => {
  for (const id of ["a", "b", "c", "d"]) workspace.open(at(`/records/${id}`));
  const [first, second] = workspace.getSnapshot().tabs;
  workspace.setDirty(second?.id ?? "", "form", true);
  expect(workspace.closeOthers(first?.id ?? "")).toBe(1);
  expect(paths()).toEqual(["/records/a", "/records/b"]);
  expect(activePath()).toBe("/records/a");
  expect(workspace.getSnapshot().canReopen).toBe(true);
  workspace.reopenClosed();
  expect(paths()).toEqual(["/records/a", "/records/d", "/records/b"]);
  expect(workspace.closeToRight(first?.id ?? "")).toBe(1);
  expect(paths()).toEqual(["/records/a", "/records/b"]);
});

it("reorders and duplicates tabs", () => {
  for (const id of ["a", "b", "c"]) workspace.open(at(`/records/${id}`));
  const last = workspace.getSnapshot().tabs[2];
  workspace.move(last?.id ?? "", 0);
  expect(paths()).toEqual(["/records/c", "/records/a", "/records/b"]);
  workspace.duplicate(last?.id ?? "");
  expect(paths()).toEqual(["/records/c", "/records/c", "/records/a", "/records/b"]);
  expect(workspace.getSnapshot().activeId).not.toBe(last?.id);
});
