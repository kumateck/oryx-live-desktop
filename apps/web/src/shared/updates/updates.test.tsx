// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, it, vi } from "vitest";
import { UpdateProvider, useReleaseUpdates } from "./update-provider";
import { canApplyWebRelease, hasUnsavedUpdateWork } from "./leave-safety";
import { useFormUpdateSafety } from "./form-update-safety";
import { UpdateButton } from "./update-button";
import type { DesktopUpdateState } from "../../../../../shared/desktop-updates";
const old="a".repeat(40), next="b".repeat(40);
const metadata=(commit:string, minimumShellVersion="0.1.0")=>Response.json({commit,minimumShellVersion});
afterEach(()=>{cleanup();vi.useRealTimers();vi.unstubAllGlobals();delete window.oryxUpdates;delete window.oryxSession;});
function Editing({dirty=false}:{dirty?:boolean}) {
  useFormUpdateSafety(dirty);
  const updates=useReleaseUpdates();
  return <><input aria-label="Draft" /><button type="button" onClick={updates.open}>Show updates</button></>;
}
it("automatic web refresh is allowed only on visible screens without editable work or dialogs",()=>{
  expect(canApplyWebRelease()).toBe(true);
  const view=render(<Editing dirty />);
  expect(hasUnsavedUpdateWork()).toBe(true);expect(canApplyWebRelease()).toBe(false);
  view.unmount();expect(hasUnsavedUpdateWork()).toBe(false);
});
it("hidden controls, including the collapsed header search, do not prevent safe web updates", () => {
  const view = render(<><input type="hidden" /><div style={{ opacity: 0 }}><input aria-label="Collapsed search" /></div><div hidden><form><input /></form></div></>);
  expect(canApplyWebRelease()).toBe(true);
  view.rerender(<div style={{ opacity: 0 }}><Editing dirty /></div>);
  expect(canApplyWebRelease()).toBe(false);
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
