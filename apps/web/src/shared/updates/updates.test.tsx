// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { UpdateProvider, useReleaseUpdates } from "./update-provider";
import { hasUnsavedUpdateWork } from "./leave-safety";
import { useFormUpdateSafety } from "./form-update-safety";
import { UpdateButton } from "./update-button";
import type { DesktopUpdateState } from "../../../../../shared/desktop-updates";
import { replaceWebPage, runningWebCommit } from "./web-release";
vi.mock("./web-release", async (importOriginal) => ({
  ...await importOriginal<typeof import("./web-release")>(),
  runningWebCommit: vi.fn(),
  replaceWebPage: vi.fn(),
}));
const old="a".repeat(40), next="b".repeat(40);
const metadata=(commit:string, minimumShellVersion="0.1.0")=>Response.json({commit,minimumShellVersion});
const page = (asset = "old") => `<meta name="application-name" content="Oryx Live"><script type="module" src="/assets/${asset}.js"></script>`;
beforeEach(() => { vi.mocked(runningWebCommit).mockReturnValue(old); });
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();vi.clearAllMocks();document.head.innerHTML="";delete window.oryxUpdates;delete window.oryxSession;});
function Editing({dirty=false}:{dirty?:boolean}) {
  useFormUpdateSafety(dirty);
  const updates=useReleaseUpdates();
  return <><input aria-label="Draft" /><button type="button" onClick={updates.open}>Show updates</button></>;
}
it("dirty forms block refreshing until their work is saved or discarded",()=>{
  expect(hasUnsavedUpdateWork()).toBe(false);
  const view=render(<Editing dirty />);
  expect(hasUnsavedUpdateWork()).toBe(true);
  view.unmount();expect(hasUnsavedUpdateWork()).toBe(false);
});
it("new web releases are announced and manual refresh refuses unsaved edits",async()=>{
  let version=old;
  const fetcher=vi.fn(async()=>metadata(version));vi.stubGlobal("fetch",fetcher);
  render(<UpdateProvider><Editing dirty /></UpdateProvider>);
  await waitFor(()=>expect(fetcher).toHaveBeenCalledTimes(1));
  version=next;await act(async()=>{window.dispatchEvent(new Event("focus"));});
  expect(await screen.findByRole("heading",{name:"A web update is ready"})).toBeTruthy();
  fireEvent.click(screen.getByRole("button",{name:"Refresh now"}));
  expect((await screen.findByRole("alert")).textContent).toContain("Save or discard");
  fireEvent.click(screen.getByRole("button",{name:"Remind me later"}));
  await act(async()=>{window.dispatchEvent(new Event("focus"));});
  expect(screen.queryByRole("dialog")).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:"Show updates"}));
  expect(await screen.findByRole("dialog")).toBeTruthy();
});
it("a higher minimum shell version offers the native updater instead of refreshing",async()=>{
  let version=old;const open=vi.fn(async()=>{});
  const state:DesktopUpdateState={phase:"available",currentVersion:"0.2.0",latestVersion:"0.3.0",received:0,total:100,error:""};
  window.oryxUpdates={status:async()=>state,open,onStatus:()=>()=>{}};
  vi.stubGlobal("fetch",async()=>metadata(version,"0.3.0"));
  render(<UpdateProvider><Editing /></UpdateProvider>);
  await act(async()=>{});version=next;
  await act(async()=>{window.dispatchEvent(new Event("focus"));});
  expect(await screen.findByRole("heading",{name:"Desktop update required"})).toBeTruthy();
  expect(screen.queryByRole("button",{name:"Refresh now"})).toBeNull();
  fireEvent.click(screen.getByRole("button",{name:"Update desktop"}));expect(open).toHaveBeenCalledOnce();
});
it("the header exposes downloading progress and keeps the updater available after deferral",async()=>{
  const state:DesktopUpdateState={phase:"downloading",currentVersion:"0.2.0",latestVersion:"0.3.0",received:75,total:100,error:""};
  const open=vi.fn(async()=>{});window.oryxUpdates={status:async()=>state,open,onStatus:()=>()=>{}};
  vi.stubGlobal("fetch",async()=>new Response(null,{status:404}));
  render(<UpdateProvider><UpdateButton /></UpdateProvider>);
  const button=await screen.findByRole("button",{name:"Downloading desktop update: 75%"});fireEvent.click(button);
  expect(open).toHaveBeenCalledOnce();
});
it("unavailable or invalid metadata leaves the current web application usable",async()=>{
  const fetcher=vi.fn(async()=>new Response("<html>not metadata</html>"));vi.stubGlobal("fetch",fetcher);
  render(<UpdateProvider><Editing /></UpdateProvider>);
  await waitFor(()=>expect(fetcher).toHaveBeenCalled());expect(screen.queryByRole("dialog")).toBeNull();expect(screen.getByRole("textbox",{name:"Draft"})).toBeTruthy();
});

it("a desktop on a read-only screen gets a prompt on its first check, without automatically reloading", async () => {
  const state: DesktopUpdateState = { phase: "current", currentVersion: "0.2.1", latestVersion: null, received: 0, total: 0, error: "" };
  window.oryxUpdates = { status: async () => state, open: async () => {}, onStatus: () => () => {} };
  vi.stubGlobal("fetch", async () => metadata(next));
  render(<UpdateProvider><p>Read-only detail</p></UpdateProvider>);
  expect(await screen.findByRole("heading", { name: "A web update is ready" })).toBeTruthy();
  expect(replaceWebPage).not.toHaveBeenCalled();
});

it("checks for new releases on the minute timer, reconnection and return to a visible window", async () => {
  vi.useFakeTimers();
  const fetcher = vi.fn(async () => metadata(old));
  vi.stubGlobal("fetch", fetcher);
  render(<UpdateProvider><Editing /></UpdateProvider>);
  await act(async () => {});
  await act(async () => { await vi.advanceTimersByTimeAsync(60_000); });
  await act(async () => { window.dispatchEvent(new Event("online")); });
  await act(async () => { document.dispatchEvent(new Event("visibilitychange")); });
  expect(fetcher).toHaveBeenCalledTimes(4);
});

it("an older build without a commit compares its actual assets before adopting server metadata", async () => {
  vi.mocked(runningWebCommit).mockReturnValue("");
  document.head.innerHTML = page();
  vi.stubGlobal("fetch", async (url: string) => url.includes("deployment.json") ? metadata(next) : new Response(page("new")));
  render(<UpdateProvider><Editing /></UpdateProvider>);
  expect(await screen.findByRole("heading", { name: "A web update is ready" })).toBeTruthy();
});

it("refresh loads fresh HTML and preserves the current route without clearing the session", async () => {
  const fetcher = vi.fn(async (url: string) => url.includes("deployment.json") ? metadata(next) : new Response(page("new")));
  vi.stubGlobal("fetch", fetcher);
  render(<UpdateProvider><Editing /></UpdateProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "Refresh now" }));
  await waitFor(() => expect(replaceWebPage).toHaveBeenCalledOnce());
  const address = vi.mocked(replaceWebPage).mock.calls[0]?.[0];
  expect(address).toContain(`__oryx_release=${next}.`);
  expect(fetcher.mock.calls.length).toBe(3);
  for (const call of fetcher.mock.calls) expect(new URL(call[0]).origin).toBe(window.location.origin);
});

it("a failed refresh keeps the current page and makes retry available", async () => {
  vi.stubGlobal("fetch", async (url: string) => url.includes("deployment.json") ? metadata(next) : new Response(null, { status: 503 }));
  render(<UpdateProvider><Editing /></UpdateProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "Refresh now" }));
  expect((await screen.findByRole("alert")).textContent).toContain("current page is still open");
  expect(screen.getByRole("button", { name: "Refresh now" }).hasAttribute("disabled")).toBe(false);
  expect(replaceWebPage).not.toHaveBeenCalled();
});

it("refresh rechecks unsaved work after its asynchronous preflight", async () => {
  let dirty = false;
  const guard = (event: BeforeUnloadEvent) => { if (dirty) event.preventDefault(); };
  window.addEventListener("beforeunload", guard);
  vi.stubGlobal("fetch", async (url: string) => {
    if (url.includes("deployment.json")) return metadata(next);
    dirty = true;
    return new Response(page("new"));
  });
  try {
    render(<UpdateProvider><Editing /></UpdateProvider>);
    fireEvent.click(await screen.findByRole("button", { name: "Refresh now" }));
    expect((await screen.findByRole("alert")).textContent).toContain("Save or discard");
    expect(replaceWebPage).not.toHaveBeenCalled();
  } finally { window.removeEventListener("beforeunload", guard); }
});

it("deferring one release still prompts when a different release arrives", async () => {
  let version = next;
  vi.stubGlobal("fetch", async () => metadata(version));
  render(<UpdateProvider><Editing /></UpdateProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "Remind me later" }));
  version = "c".repeat(40);
  await act(async () => { window.dispatchEvent(new Event("focus")); });
  expect(await screen.findByRole("heading", { name: "A web update is ready" })).toBeTruthy();
});

it("disables refresh and deferral while preflight is pending, preventing duplicate refreshes", async () => {
  let respond: (response: Response) => void = () => {};
  const pending = new Promise<Response>((resolve) => { respond = resolve; });
  const fetcher = vi.fn(async (url: string) => url.includes("deployment.json") ? metadata(next) : pending);
  vi.stubGlobal("fetch", fetcher);
  render(<UpdateProvider><Editing /></UpdateProvider>);
  const button = await screen.findByRole("button", { name: "Refresh now" });
  fireEvent.click(button);
  expect(screen.getByRole("button", { name: "Refreshing…" }).hasAttribute("disabled")).toBe(true);
  expect(screen.getByRole("button", { name: "Remind me later" }).hasAttribute("disabled")).toBe(true);
  fireEvent.click(button);
  await act(async () => { respond(new Response(page("new"))); });
  expect(replaceWebPage).toHaveBeenCalledOnce();
  expect(fetcher).toHaveBeenCalledTimes(3);
});
