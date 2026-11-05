import { createMemoryRouter, type RouteObject } from "react-router";
import { randomId } from "../ids/random-id";
import { destinationKey, fallbackTabTitle, tabAddress, type TabLocation } from "./destinations";
import { readSidebarPreference, writeSidebarPreference } from "./sidebar-preference";

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
export interface TabsSnapshot { tabs: readonly WorkspaceTab[]; activeId: string; sidebarOpen: boolean; canReopen: boolean }
/** New tabs from links open beside the current tab; the New tab button appends, as in browsers. */
export type TabPlacement = "end" | "after-active";
interface ClosedTab { location: TabLocation; title: string }
const home: TabLocation = { pathname: "/home", search: "", hash: "" };
const closedLimit = 20;

/** One in-memory router per tab; route definitions and the session/API cache remain shared. */
export class WorkspaceTabs {
  private state: TabsSnapshot = { tabs: [], activeId: "", sidebarOpen: readSidebarPreference(), canReopen: false };
  private listeners = new Set<() => void>();
  private releases = new Map<string, () => void>();
  private dirty = new Map<string, Set<string>>();
  private busy = new Map<string, Set<string>>();
  private history = new Map<string, { entries: string[]; index: number }>();
  private titles = new Map<string, { pathname: string; title: string }>();
  private closed: ClosedTab[] = [];
  constructor(private routes: RouteObject[], private pending: () => boolean, private identity: (location: TabLocation) => string = destinationKey,
    private onBusy: () => void = () => {}) {}
  getSnapshot = (): TabsSnapshot => this.state;
  subscribe = (listener: () => void): (() => void) => { this.listeners.add(listener); return () => this.listeners.delete(listener); };
  private publish(tabs = this.state.tabs, activeId = this.state.activeId, sidebarOpen = this.state.sidebarOpen): void {
    this.state = { tabs, activeId, sidebarOpen, canReopen: this.closed.length > 0 };
    for (const listener of this.listeners) listener();
  }
  private update(id: string, change: Partial<WorkspaceTab>): void {
    this.publish(this.state.tabs.map((tab) => tab.id === id ? { ...tab, ...change } : tab));
  }
  private blocked(): boolean { if (!this.hasPending()) return false; this.onBusy(); return true; }
  isActive = (id: string): boolean => this.state.activeId === id;
  hasPending = (): boolean => this.pending() || this.state.tabs.some((tab) => tab.busy);
  hasWork = (): boolean => this.hasPending() || this.state.tabs.some((tab) => tab.dirty);
  active = (): WorkspaceTab | undefined => this.state.tabs.find((tab) => this.isActive(tab.id));

  setSidebar = (sidebarOpen: boolean): void => {
    if (sidebarOpen === this.state.sidebarOpen) return;
    writeSidebarPreference(sidebarOpen);
    this.publish(this.state.tabs, this.state.activeId, sidebarOpen);
  };
  toggleSidebar = (): void => this.setSidebar(!this.state.sidebarOpen);

  focus = (id: string): void => {
    if (id !== this.state.activeId && this.blocked()) return;
    if (this.state.tabs.some((tab) => tab.id === id)) this.publish(this.state.tabs, id);
  };
  /** Ctrl/Cmd+1…8 pick a position; a negative index (Ctrl/Cmd+9) picks the last tab. */
  focusIndex = (index: number): void => {
    const { tabs } = this.state;
    const target = index < 0 ? tabs.at(-1) : tabs[index];
    if (target) this.focus(target.id);
  };
  cycle = (delta: -1 | 1): void => {
    const { tabs, activeId } = this.state;
    const index = tabs.findIndex((tab) => tab.id === activeId);
    const next = tabs[(index + delta + tabs.length) % tabs.length];
    if (next) this.focus(next.id);
  };

  /** Opens a tab, or focuses a tab already showing the same destination. */
  open = (location: TabLocation, title?: string, picker = false, placement: TabPlacement = picker ? "end" : "after-active"): void => {
    if (this.blocked()) return;
    const existing = !picker && this.matching(location);
    if (existing) { this.focus(existing.id); return; }
    this.create(location, title, picker, placement);
  };

  /** Ordinary navigation: switch to an open match, otherwise replace the current tab's page. */
  navigate = (location: TabLocation, title?: string): void => {
    if (this.blocked()) return;
    const current = this.active();
    const existing = this.matching(location);
    if (existing && existing.id !== current?.id) { this.focus(existing.id); return; }
    if (!current) { this.create(location, title, false, "end"); return; }
    if (existing) return;
    if (title) this.titles.set(current.id, { pathname: location.pathname, title });
    // A blank picker becomes the chosen page instead of keeping a "New tab" history entry.
    void current.router.navigate(tabAddress(location), { replace: current.picker });
  };

  newTab = (): void => {
    const blank = this.state.tabs.find((tab) => tab.picker);
    if (blank) this.focus(blank.id);
    else this.open(home, "New tab", true);
  };
  duplicate = (id: string): void => {
    const tab = this.state.tabs.find((entry) => entry.id === id);
    if (!tab || tab.picker || this.blocked()) return;
    this.focus(id);
    this.create(tab.location, tab.title, false, "after-active");
  };
  reopenClosed = (): void => {
    const last = this.closed.at(-1);
    if (!last || this.blocked()) return;
    this.closed = this.closed.slice(0, -1);
    this.open(last.location, last.title);
    this.publish();
  };
  move = (id: string, index: number): void => {
    const tabs = [...this.state.tabs];
    const from = tabs.findIndex((tab) => tab.id === id);
    if (from < 0 || from === index || index < 0 || index >= tabs.length) return;
    const [tab] = tabs.splice(from, 1);
    if (tab) { tabs.splice(index, 0, tab); this.publish(tabs); }
  };

  setTitle = (id: string, title: string): void => {
    if (this.state.tabs.some((tab) => tab.id === id && tab.title !== title)) this.update(id, { title });
  };
  setDirty = (id: string, key: string, value: boolean): void => this.setGuard(this.dirty, "dirty", id, key, value);
  setBusy = (id: string, key: string, value: boolean): void => this.setGuard(this.busy, "busy", id, key, value);
  private setGuard(store: Map<string, Set<string>>, field: "dirty" | "busy", id: string, key: string, value: boolean): void {
    const guards = store.get(id);
    if (!guards) return;
    if (value) guards.add(key); else guards.delete(key);
    const flag = guards.size > 0;
    if (this.state.tabs.some((tab) => tab.id === id && tab[field] !== flag)) this.update(id, { [field]: flag });
  }

  /** Closes one tab; the tab to its right (or else its left) becomes current, as in browsers. */
  close = (id: string, discard = false): boolean => {
    const tab = this.state.tabs.find((entry) => entry.id === id);
    if (!tab || this.hasPending() || (tab.dirty && !discard)) return false;
    const index = this.state.tabs.indexOf(tab);
    const remaining = this.state.tabs.filter((entry) => entry.id !== id);
    this.remember(tab);
    this.release(id);
    const next = this.isActive(id) ? (remaining[index] ?? remaining[index - 1])?.id ?? "" : this.state.activeId;
    this.publish(remaining, next);
    if (!remaining.length) this.newTab();
    return true;
  };
  /** Bulk close never discards work: tabs with unsaved changes stay open. Returns how many were kept. */
  closeOthers = (id: string): number => this.closeWhere(id, (_, tab) => tab.id !== id);
  closeToRight = (id: string): number => {
    const anchor = this.state.tabs.findIndex((tab) => tab.id === id);
    return this.closeWhere(id, (index) => index > anchor);
  };
  private closeWhere(anchor: string, selected: (index: number, tab: WorkspaceTab) => boolean): number {
    if (this.blocked()) return 0;
    const targets = this.state.tabs.filter((tab, index) => selected(index, tab));
    const closing = targets.filter((tab) => !tab.dirty);
    for (const tab of closing) { this.remember(tab); this.release(tab.id); }
    const remaining = this.state.tabs.filter((tab) => !closing.includes(tab));
    const activeGone = closing.some((tab) => this.isActive(tab.id));
    this.publish(remaining, activeGone ? anchor : this.state.activeId);
    return targets.length - closing.length;
  }

  travel = (delta: -1 | 1): void => {
    if (this.blocked()) return;
    const tab = this.active(); if (tab && (delta < 0 ? tab.back : tab.forward)) void tab.router.navigate(delta);
  };

  private matching(location: TabLocation): WorkspaceTab | undefined {
    const key = this.identity(location);
    return this.state.tabs.find((tab) => !tab.picker && this.identity(tab.location) === key);
  }
  private create(location: TabLocation, title: string | undefined, picker: boolean, placement: TabPlacement): void {
    const id = randomId();
    const router = createMemoryRouter(this.routes, { initialEntries: [tabAddress(location)] });
    const tab: WorkspaceTab = { id, router, location, title: title ?? fallbackTabTitle(location), picker, dirty: false, busy: false, back: false, forward: false };
    this.history.set(id, { entries: [router.state.location.key], index: 0 });
    this.dirty.set(id, new Set());
    this.busy.set(id, new Set());
    this.releases.set(id, router.subscribe((state) => this.track(id, state)));
    // A blank picker is replaced by the selected destination, rather than accumulating empty tabs.
    const blank = this.active();
    const replaced = blank?.picker && !picker ? blank.id : "";
    const at = placement === "after-active" ? this.state.tabs.findIndex((entry) => this.isActive(entry.id)) + 1 : 0;
    if (replaced) this.release(replaced);
    const before = at > 0 ? this.state.tabs.slice(0, at) : this.state.tabs;
    const after = at > 0 ? this.state.tabs.slice(at) : [];
    this.publish([...before, tab, ...after].filter((entry) => entry.id !== replaced), id);
  }
  private track(id: string, state: TabRouter["state"]): void {
    const previous = this.state.tabs.find((entry) => entry.id === id);
    const history = this.history.get(id);
    if (!previous || !history || state.navigation.state !== "idle") return;
    const changed = state.location.key !== history.entries[history.index];
    const at = history.entries.indexOf(state.location.key);
    if (at >= 0) history.index = at;
    else if (state.historyAction === "REPLACE") history.entries[history.index] = state.location.key;
    else { history.entries = [...history.entries.slice(0, history.index + 1), state.location.key]; history.index++; }
    const moved = previous.location.pathname !== state.location.pathname;
    if (moved) this.dirty.get(id)?.clear();
    const pending = changed ? this.titles.get(id) : undefined;
    if (pending) this.titles.delete(id);
    const title = pending?.pathname === state.location.pathname ? pending.title : moved ? fallbackTabTitle(state.location) : previous.title;
    this.update(id, { location: state.location, back: history.index > 0, forward: history.index < history.entries.length - 1,
      picker: previous.picker && !changed, title, ...(moved ? { dirty: false } : {}) });
  }
  private remember(tab: WorkspaceTab): void {
    if (tab.picker) return;
    this.closed = [...this.closed, { location: tab.location, title: tab.title }].slice(-closedLimit);
  }
  private release(id: string): void {
    this.releases.get(id)?.(); this.releases.delete(id);
    this.state.tabs.find((tab) => tab.id === id)?.router.dispose();
    this.dirty.delete(id); this.busy.delete(id); this.history.delete(id); this.titles.delete(id);
  }
  dispose = (): void => {
    for (const tab of this.state.tabs) this.release(tab.id);
    this.closed = [];
    this.state = { tabs: [], activeId: "", sidebarOpen: this.state.sidebarOpen, canReopen: false };
  };
}
