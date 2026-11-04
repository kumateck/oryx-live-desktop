// @vitest-environment jsdom
import { useEffect, useState, useSyncExternalStore } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, useParams, useSearchParams } from "react-router";
import { afterEach, expect, it } from "vitest";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { WorkspaceTabView } from "./tab-view";
import { WorkspaceTabs } from "./workspace-tabs";
import { WorkspaceTabStrip } from "./tab-strip";
import { useDesktopTabSafety, useDesktopTabTitle } from "./context";
import { useWorkspaceLeaveSafety } from "./use-workspace-leave-safety";
import { hasUnsavedUpdateWork } from "../updates/leave-safety";
import { useDesktopNavigation } from "./use-desktop-navigation";
import { DesktopRouteBlocker } from "./route-blocker";
import { WorkspaceLinkMenu } from "./internal-link-menu";
import { WorkspaceNavigation } from "@/components/shell/workspace-navigation";
import { TooltipProvider } from "@/components/ui/tooltip";

let initialisations = 0;
let running = 0;
function RecordPage() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const [draft, setDraft] = useState("");
  const [dialog, setDialog] = useState(false);
  useDesktopTabTitle(`Record ${id}`);
  useDesktopTabSafety(Boolean(draft));
  useEffect(() => { initialisations++; setDraft(""); running++; return () => { running--; }; }, []);
  return <WorkspaceLinkMenu><><DesktopRouteBlocker /><WorkspaceTabStrip /><h1>Record {id}</h1>
    <TooltipProvider><WorkspaceNavigation groups={[{ id: "warehouse-management", label: "Warehouse", items: [{ id: "other", label: "Other record", path: "/records/b" }] }]}
      active={null} pathname={`/records/${id}`} sidebarOpen onOpenSidebar={() => {}} /></TooltipProvider>
    <input aria-label="Draft" value={draft} onChange={(event) => setDraft(event.target.value)} />
    <input aria-label="Filter" value={params.get("search") ?? ""} onChange={(event) => setParams({ search: event.target.value })} />
    <Link to="/records/detail">Details</Link><button onClick={() => setDialog(true)}>Open dialog</button>
    <Dialog open={dialog} onOpenChange={setDialog}><DialogContent><DialogTitle>Record dialog</DialogTitle><DialogDescription>Only the current tab can show this.</DialogDescription></DialogContent></Dialog>
  </></WorkspaceLinkMenu>;
}
function Harness({ workspace }: { workspace: WorkspaceTabs }) {
  useWorkspaceLeaveSafety(workspace);
  useDesktopNavigation(workspace);
  const { tabs, activeId } = useSyncExternalStore(workspace.subscribe, workspace.getSnapshot);
  return tabs.map((tab) => <WorkspaceTabView key={tab.id} tab={tab} workspace={workspace} active={tab.id === activeId} pending={false} />);
}
const spaces: WorkspaceTabs[] = [];
function open(hash = "") {
  initialisations = 0; running = 0;
  let pending = false;
  const workspace = new WorkspaceTabs([{ path: "/records/:id", Component: RecordPage }, { path: "/home", Component: RecordPage }], () => pending);
  spaces.push(workspace);
  workspace.open({ pathname: "/records/a", search: "?search=acid", hash });
  render(<Harness workspace={workspace} />);
  return { workspace, user: userEvent.setup(), pending: (value: boolean) => { pending = value; } };
}
afterEach(() => { cleanup(); for (const space of spaces) space.dispose(); spaces.length = 0; });

it("uses the active tab for ordinary sidebar clicks and a separate tab for Ctrl-click", async () => {
  const { workspace, user } = open();
  const first = workspace.active()?.id;
  await user.click(screen.getByRole("link", { name: "Other record" }));
  await waitFor(() => expect(workspace.active()?.location.pathname).toBe("/records/b"));
  expect(workspace.getSnapshot().tabs).toHaveLength(1);
  expect(workspace.active()?.id).toBe(first);
  fireEvent.click(screen.getByRole("link", { name: "Details" }), { ctrlKey: true });
  await waitFor(() => expect(workspace.getSnapshot().tabs).toHaveLength(2));
  expect(workspace.active()?.location.pathname).toBe("/records/detail");
});

it("opens a navigation link through its context menu", async () => {
  const { workspace, user } = open();
  fireEvent.contextMenu(screen.getByRole("link", { name: "Other record" }));
  await user.click(await screen.findByRole("menuitem", { name: "Open in new tab" }));
  await waitFor(() => expect(workspace.getSnapshot().tabs).toHaveLength(2));
  expect(workspace.active()?.location.pathname).toBe("/records/b");
});

it("duplicates a tab through its header menu while retaining the original dirty draft and URL", async () => {
  const { workspace, user, pending } = open("#notes");
  const original = workspace.active();
  await user.type(screen.getByRole("textbox", { name: "Draft" }), "original unsaved work");
  fireEvent.contextMenu(screen.getByRole("tab", { name: /Record a/ }));
  await user.click(await screen.findByRole("menuitem", { name: "Duplicate tab" }));
  await waitFor(() => expect(workspace.getSnapshot().tabs).toHaveLength(2));
  expect(workspace.active()?.id).not.toBe(original?.id);
  expect(workspace.active()?.location).toMatchObject({ pathname: "/records/a", search: "?search=acid", hash: "#notes" });
  expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Draft" }).value).toBe("");
  expect(workspace.hasWork()).toBe(true);
  if (!original) throw new Error("Missing original tab");
  act(() => workspace.focus(original.id));
  expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Draft" }).value).toBe("original unsaved work");
  pending(true);
  act(() => workspace.duplicate(original.id));
  expect(workspace.getSnapshot().tabs).toHaveLength(2);
});

it("turns a blank picker into the selected sidebar page without creating another tab", async () => {
  const { workspace, user } = open();
  act(() => workspace.newTab());
  const blankId = workspace.active()?.id;
  expect(workspace.active()?.picker).toBe(true);
  await user.click(screen.getByRole("link", { name: "Other record" }));
  await waitFor(() => expect(workspace.active()?.picker).toBe(false));
  expect(workspace.active()?.id).toBe(blankId);
  expect(workspace.active()?.location.pathname).toBe("/records/b");
  expect(workspace.getSnapshot().tabs).toHaveLength(2);
});

it("retains dirty form values and list filters independently without restarting form effects", async () => {
  const { workspace, user } = open();
  const first = workspace.getSnapshot().activeId;
  await user.type(screen.getByRole("textbox", { name: "Draft" }), "unsaved a");
  act(() => workspace.open({ pathname: "/records/b", search: "?search=base", hash: "" }));
  await user.type(screen.getByRole("textbox", { name: "Draft" }), "unsaved b");
  const before = initialisations;
  act(() => workspace.focus(first));
  expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Draft" }).value).toBe("unsaved a");
  expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Filter" }).value).toBe("acid");
  expect(initialisations).toBe(before);
  expect(workspace.hasWork()).toBe(true);
  expect(hasUnsavedUpdateWork()).toBe(true);
  act(() => workspace.open({ pathname: "/records/a", search: "", hash: "" }));
  expect(workspace.getSnapshot().tabs).toHaveLength(2);
  expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Filter" }).value).toBe("acid");
});

it("keeps controller effects stable and histories in their owning tab", async () => {
  const { workspace, user } = open();
  const first = workspace.getSnapshot().activeId;
  await user.click(screen.getByRole("link", { name: "Details" }));
  await waitFor(() => expect(workspace.active()?.back).toBe(true));
  act(() => workspace.open({ pathname: "/records/b", search: "", hash: "" }));
  await waitFor(() => expect(running).toBe(2));
  expect(workspace.active()?.back).toBe(false);
  act(() => workspace.focus(first));
  act(() => workspace.travel(-1));
  await waitFor(() => expect(screen.getByRole("heading", { level: 1 }).textContent).toBe("Record a"));
  expect(workspace.active()?.forward).toBe(true);
});

it("asks before closing inactive dirty work, and rechecks pending writes before discard", async () => {
  const { workspace, user, pending } = open();
  await user.type(screen.getByRole("textbox", { name: "Draft" }), "keep me");
  act(() => workspace.open({ pathname: "/records/b", search: "", hash: "" }));
  await user.click(screen.getByRole("button", { name: "Close Record a" }));
  expect(await screen.findByRole("dialog")).toBeTruthy();
  pending(true);
  await user.click(screen.getByRole("button", { name: "Discard and close" }));
  expect(workspace.getSnapshot().tabs).toHaveLength(2);
  pending(false);
  await user.click(screen.getByRole("button", { name: "Keep editing" }));
  expect(screen.getByRole<HTMLInputElement>("textbox", { name: "Draft" }).value).toBe("keep me");
  await user.click(screen.getByRole("button", { name: "Close Record a" }));
  await user.click(screen.getByRole("button", { name: "Discard and close" }));
  expect(workspace.getSnapshot().tabs).toHaveLength(1);
  expect(workspace.hasWork()).toBe(false);
  expect(hasUnsavedUpdateWork()).toBe(false);
});

it("supports native navigation, modified internal links and desktop tab shortcuts", async () => {
  let receive: ((command: import("../../../../../shared/desktop-workspace").WorkspaceNavigationCommand) => void) | undefined;
  window.oryxWorkspace = { onNavigate: (listener) => { receive = listener; return () => { receive = undefined; }; } };
  const { workspace } = open();
  fireEvent.click(screen.getByRole("link", { name: "Details" }), { ctrlKey: true });
  await waitFor(() => expect(workspace.getSnapshot().tabs).toHaveLength(2));
  expect(workspace.active()?.location.pathname).toBe("/records/detail");
  act(() => receive?.("home"));
  expect(workspace.active()?.location.pathname).toBe("/home");
  fireEvent.keyDown(window, { key: "Tab", ctrlKey: true, shiftKey: true });
  expect(workspace.active()?.location.pathname).toBe("/records/detail");
  cleanup();
  expect(receive).toBeUndefined();
  delete window.oryxWorkspace;
});

it("hides dirty inactive dialog portals while preserving their form state", async () => {
  const { workspace, user } = open();
  const first = workspace.getSnapshot().activeId;
  await user.type(screen.getByRole("textbox", { name: "Draft" }), "draft");
  await user.click(screen.getByRole("button", { name: "Open dialog" }));
  expect(screen.getByRole("dialog")).toBeTruthy();
  act(() => workspace.open({ pathname: "/records/b", search: "", hash: "" }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  act(() => workspace.focus(first));
  expect(await screen.findByRole("dialog")).toBeTruthy();
  fireEvent.keyDown(screen.getByRole("dialog"), { key: "Escape" });
});

it.each(["Details", "Other record"])("guards dirty navigation through %s and blocks tab changes during a save", async (link) => {
  const { workspace, user } = open();
  await user.type(screen.getByRole("textbox", { name: "Draft" }), "work");
  await user.click(screen.getByRole("link", { name: link }));
  expect(await screen.findByRole("heading", { name: "Leave without saving?" })).toBeTruthy();
  await user.click(screen.getByRole("button", { name: "Keep editing" }));
  const first = workspace.getSnapshot().activeId;
  act(() => workspace.setBusy(first, "preflight", true));
  act(() => workspace.newTab());
  expect(workspace.getSnapshot().tabs).toHaveLength(1);
  expect(workspace.close(first, true)).toBe(false);
  expect(hasUnsavedUpdateWork()).toBe(true);
  act(() => workspace.setBusy(first, "preflight", false));
  act(() => workspace.newTab());
  expect(workspace.getSnapshot().tabs).toHaveLength(2);
});
