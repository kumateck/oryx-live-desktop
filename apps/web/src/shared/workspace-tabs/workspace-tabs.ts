import { createMemoryRouter, type RouteObject } from "react-router";
import { randomId } from "../ids/random-id";
import { destinationKey, fallbackTabTitle, tabAddress, type TabLocation } from "./destinations";

export type TabRouter = ReturnType<typeof createMemoryRouter>;
export interface WorkspaceTab {
  id: string;
  router: TabRouter;
  location: TabLocation;
  title: string;
  picker: boolean;
  dirty: boolean;
  busy: boolean;
  back: boolean;
  forward: boolean;
}
export interface TabsSnapshot { tabs: readonly WorkspaceTab[]; activeId: string; sidebarOpen: boolean }

/** One in-memory router per tab; route definitions and the session/API cache remain shared. */
export class WorkspaceTabs {
  private state: TabsSnapshot = { tabs: [], activeId: "", sidebarOpen: true };
  private listeners = new Set<() => void>();
  private releases = new Map<string, () => void>();
  private dirty = new Map<string, Set<string>>();
  private busy = new Map<string, Set<string>>();
  private history = new Map<string, { entries: string[]; index: number }>();
  constructor(private routes: RouteObject[], private pending: () => boolean, private identity: (location: TabLocation) => string = destinationKey,
    private onBusy: () => void = () => {}) {}
  getSnapshot = (): TabsSnapshot => this.state;
  subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  private publish(tabs = this.state.tabs, activeId = this.state.activeId): void {
    this.state = { ...this.state, tabs, activeId };
    for (const listener of this.listeners) listener();
  }
  isActive = (id: string): boolean => this.state.activeId === id;
  hasPending = (): boolean => this.pending() || this.state.tabs.some((tab) => tab.busy);
  hasWork = (): boolean => this.hasPending() || this.state.tabs.some((tab) => tab.dirty);
  active = (): WorkspaceTab | undefined => this.state.tabs.find((tab) => this.isActive(tab.id));
  setSidebar = (sidebarOpen: boolean): void => { this.state = { ...this.state, sidebarOpen }; this.publish(); };
  focus = (id: string): void => {
    if (id !== this.state.activeId && this.hasPending()) { this.onBusy(); return; }
    if (this.state.tabs.some((tab) => tab.id === id)) this.publish(this.state.tabs, id);
  };
  open = (location: TabLocation, title?: string, picker = false): void => {
    if (this.hasPending()) { this.onBusy(); return; }
    const existing = !picker && this.state.tabs.find((tab) => !tab.picker && this.identity(tab.location) === this.identity(location));
    if (existing) { this.focus(existing.id); return; }
    const id = randomId();
    const router = createMemoryRouter(this.routes, { initialEntries: [tabAddress(location)] });
    const tab: WorkspaceTab = { id, router, location, title: title ?? fallbackTabTitle(location), picker, dirty: false, busy: false, back: false, forward: false };
    this.history.set(id, { entries: [router.state.location.key], index: 0 });
    this.dirty.set(id, new Set());
    this.busy.set(id, new Set());
    this.releases.set(id, router.subscribe((state) => {
      const previous = this.state.tabs.find((entry) => entry.id === id);
      const history = this.history.get(id);
      if (!previous || !history || state.navigation.state !== "idle") return;
      const at = history.entries.indexOf(state.location.key);
      if (at >= 0) history.index = at;
      else if (state.historyAction === "REPLACE") history.entries[history.index] = state.location.key;
      else { history.entries = [...history.entries.slice(0, history.index + 1), state.location.key]; history.index++; }
      const moved = previous.location.pathname !== state.location.pathname;
      if (moved) this.dirty.get(id)?.clear();
      const next = { ...previous, location: state.location, back: history.index > 0, forward: history.index < history.entries.length - 1,
        ...(moved ? { title: fallbackTabTitle(state.location), dirty: false } : {}) };
      this.publish(this.state.tabs.map((entry) => entry.id === id ? next : entry));
    }));
    // A blank picker is replaced by the selected destination, rather than accumulating empty tabs.
    const blank = this.active();
    if (blank?.picker && !picker) this.release(blank.id);
    this.publish([...this.state.tabs.filter((entry) => entry.id !== (blank?.picker && !picker ? blank.id : "")), tab], id);
  };
  newTab = (): void => {
    const blank = this.state.tabs.find((tab) => tab.picker);
    if (blank) this.focus(blank.id);
    else this.open({ pathname: "/home", search: "", hash: "" }, "New tab", true);
  };
  setTitle = (id: string, title: string): void => {
    if (this.state.tabs.some((tab) => tab.id === id && tab.title !== title)) this.publish(this.state.tabs.map((tab) => tab.id === id ? { ...tab, title } : tab));
  };
  setDirty = (id: string, key: string, value: boolean): void => {
    const guards = this.dirty.get(id);
    if (!guards) return;
    if (value) guards.add(key); else guards.delete(key);
    const dirty = guards.size > 0;
    if (this.state.tabs.some((tab) => tab.id === id && tab.dirty !== dirty)) this.publish(this.state.tabs.map((tab) => tab.id === id ? { ...tab, dirty } : tab));
  };
  setBusy = (id: string, key: string, value: boolean): void => {
    const guards = this.busy.get(id);
    if (!guards) return;
    if (value) guards.add(key); else guards.delete(key);
    const busy = guards.size > 0;
    if (this.state.tabs.some((tab) => tab.id === id && tab.busy !== busy)) this.publish(this.state.tabs.map((tab) => tab.id === id ? { ...tab, busy } : tab));
  };
  close = (id: string, discard = false): boolean => {
    const tab = this.state.tabs.find((entry) => entry.id === id);
    if (!tab || this.hasPending() || (tab.dirty && !discard)) return false;
    const index = this.state.tabs.indexOf(tab);
    const remaining = this.state.tabs.filter((entry) => entry.id !== id);
    this.release(id);
    this.publish(remaining, this.isActive(id) ? (remaining[Math.max(0, index - 1)]?.id ?? "") : this.state.activeId);
    if (!remaining.length) this.newTab();
    return true;
  };
  travel = (delta: -1 | 1): void => {
    if (this.hasPending()) { this.onBusy(); return; }
    const tab = this.active(); if (tab && (delta < 0 ? tab.back : tab.forward)) void tab.router.navigate(delta);
  };
  private release(id: string): void {
    this.releases.get(id)?.(); this.releases.delete(id);
    this.state.tabs.find((tab) => tab.id === id)?.router.dispose();
    this.dirty.delete(id); this.busy.delete(id); this.history.delete(id);
  }
  dispose = (): void => { for (const tab of this.state.tabs) this.release(tab.id); this.state = { tabs: [], activeId: "", sidebarOpen: true }; };
}
