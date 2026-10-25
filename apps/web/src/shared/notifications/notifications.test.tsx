// @vitest-environment jsdom
import { act } from "react";
import { cleanup, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { NotificationSheet } from "../../components/shell/notification-sheet";
import { ApiProvider } from "../api/api-provider";
import { SessionProvider } from "../auth/session-provider";
import { forgetSession, rememberSession, stubBackend } from "../../test/backend";
import { arrivalSummary, createAnnouncedLog, newArrivals } from "./arrivals";
import type { LiveHandlers } from "./live-connection";
import { notificationLabel, notificationLink } from "./notification-types";

const live = vi.hoisted(() => ({ handlers: null as LiveHandlers | null, closed: 0, token: null as string | null }));
vi.mock("./live-connection", () => ({ connectLive: (getToken: () => string | null, handlers: LiveHandlers) => { live.handlers = handlers; live.token = getToken(); return () => { live.closed += 1; }; } }));
const toasts = vi.hoisted(() => ({ info: [] as { title: string; description?: string }[], error: [] as string[] }));
vi.mock("sonner", () => ({ toast: { info: (title: string, options?: { description?: string }) => { toasts.info.push({ title, ...(options?.description ? { description: options.description } : {}) }); }, error: (title: string) => { toasts.error.push(title); }, success: () => undefined } }));

beforeEach(() => { live.handlers = null; live.closed = 0; toasts.info.length = 0; toasts.error.length = 0; });
afterEach(() => { cleanup(); forgetSession(); delete window.oryxCompanion; });

it("tells new arrivals from what was already waiting, and never announces one twice", () => {
  const item = (id: string) => ({ id, message: `Message ${id}`, type: null });
  // The first look sets the baseline; nothing is announced.
  expect(newArrivals(null, [item("a"), item("b")])).toEqual([]);
  expect(newArrivals(new Set(["a", "b"]), [item("c"), item("a"), item("b")])).toEqual([item("c")]);
  expect(newArrivals(new Set(["a"]), [])).toEqual([]);
  let clock = 0;
  const log = createAnnouncedLog(1000, () => clock);
  expect([log.claim("Shipment arrived"), log.claim("Shipment arrived"), log.claim("Another")]).toEqual([true, false, true]);
  clock = 2000;
  expect(log.claim("Shipment arrived")).toBe(true);
  expect([arrivalSummary(3), arrivalSummary(4)]).toEqual([null, "4 new notifications"]);
  expect([notificationLabel(2), notificationLabel(99), notificationLabel(null), notificationLink(15), notificationLink(1)]).toEqual(["Shipment arrived", "Notification", "Notification", "/warehouse/expired-materials", "/settings/shift-schedule"]);
});

interface Call { method: string; path: string }
function open(initial: { id: string; message: string; type: number; priority?: string }[]) {
  const backend = stubBackend({ permissions: [] });
  rememberSession();
  const state = { unread: [...initial], calls: [] as Call[], refuse: null as string | null };
  const session = backend.fetcher.getMockImplementation();
  backend.fetcher.mockImplementation(async (input, init) => {
    if (!(input instanceof Request)) return session ? session(input, init) : new Response(null, { status: 500 });
    const url = new URL(input.url);
    state.calls.push({ method: input.method, path: `${url.pathname}${url.search}` });
    if (url.pathname === "/api/v1/alert/notifications") return Response.json(url.searchParams.get("unreadOnly") === "true" ? state.unread : [...state.unread, { id: "old-1", message: "Leave request approved", type: 10 }]);
    const marked = /^\/api\/v1\/alert\/([^/]+)\/mark-as-read$/.exec(url.pathname);
    if (marked) {
      if (state.refuse === marked[1]) return Response.json({ errors: [{ code: "Notification", description: "The server could not save this." }] }, { status: 500 });
      state.unread = state.unread.filter((item) => item.id !== marked[1]);
      return new Response(null, { status: 204 });
    }
    return new Response(null, { status: 404 });
  });
  const router = createMemoryRouter([{ path: "*", element: <NotificationSheet /> }], { initialEntries: ["/"] });
  render(<SessionProvider><ApiProvider><RouterProvider router={router} /></ApiProvider></SessionProvider>);
  return state;
}
const waiting = [{ id: "n1", message: "Shipment SD-1 has arrived", type: 2 }, { id: "n2", message: "Lactose is below its minimum", type: 4 }];

it("shows what is already waiting without announcing it, and connects with the session's token", async () => {
  open(waiting);
  expect(await screen.findByRole("button", { name: "Notifications, 2 unread" })).toBeTruthy();
  expect(toasts.info).toEqual([]);
  await waitFor(() => expect(live.handlers).not.toBeNull());
});

it("announces a pushed notification once, then brings the bell in step with the server", async () => {
  const state = open(waiting);
  await screen.findByRole("button", { name: "Notifications, 2 unread" });
  await waitFor(() => expect(live.handlers).not.toBeNull());
  // The server publishes first and saves a moment later, under an id of its own.
  live.handlers?.onNotification({ message: "Batch T081K004 moved to packing", type: 0, sentAt: "2026-10-02T09:00:00Z" });
  expect(toasts.info).toEqual([{ title: "Production stage changed", description: "Batch T081K004 moved to packing" }]);
  state.unread = [{ id: "n3", message: "Batch T081K004 moved to packing", type: 0 }, ...state.unread];
  expect(await screen.findByRole("button", { name: "Notifications, 3 unread" }, { timeout: 4000 })).toBeTruthy();
  // It turned up in the list under its own id, and is not announced a second time.
  expect(toasts.info).toHaveLength(1);
}, 15_000);

it("announces what a later check finds, when nothing was pushed", async () => {
  const state = open(waiting);
  await screen.findByRole("button", { name: "Notifications, 2 unread" });
  state.unread = [{ id: "n9", message: "Sorbitol has expired", type: 15 }, ...state.unread];
  // Coming back to the window reads the list again.
  window.dispatchEvent(new Event("focus"));
  document.dispatchEvent(new Event("visibilitychange"));
  expect(await screen.findByRole("button", { name: "Notifications, 3 unread" }, { timeout: 4000 })).toBeTruthy();
  expect(toasts.info).toEqual([{ title: "Expired material", description: "Sorbitol has expired" }]);
}, 15_000);

it("marks one as read at once, puts it back if the server refuses, and loads earlier ones only when asked", async () => {
  const user = userEvent.setup();
  const state = open(waiting);
  await user.click(await screen.findByRole("button", { name: "Notifications, 2 unread" }));
  const list = await screen.findByRole("list", { name: "Unread notifications" });
  expect(within(list).getAllByRole("link", { name: "Open" }).map((link) => link.getAttribute("href"))).toEqual(["/procurement/material-distribution", "/warehouse/materials/linked"]);
  expect(state.calls.some((call) => call.path.includes("unreadOnly=false"))).toBe(false);
  state.refuse = "n1";
  await user.click(within(list).getByRole("button", { name: "Mark as read: Shipment SD-1 has arrived" }));
  await waitFor(() => expect(toasts.error).toEqual(["Could not mark it as read"]));
  expect(await within(list).findByText("Shipment SD-1 has arrived")).toBeTruthy();
  state.refuse = null;
  await user.click(within(list).getByRole("button", { name: "Mark as read: Shipment SD-1 has arrived" }));
  await waitFor(() => expect(screen.queryByText("Shipment SD-1 has arrived")).toBeNull());
  expect(state.calls.filter((call) => call.method === "PUT").map((call) => call.path)).toEqual(["/api/v1/alert/n1/mark-as-read", "/api/v1/alert/n1/mark-as-read"]);
  await user.click(screen.getByRole("button", { name: "Show earlier notifications" }));
  expect(await screen.findByText("Leave request approved")).toBeTruthy();
}, 20_000);

it("marks everything as read one request after another", async () => {
  const user = userEvent.setup();
  const state = open(waiting);
  await user.click(await screen.findByRole("button", { name: "Notifications, 2 unread" }));
  await user.click(await screen.findByRole("button", { name: /Mark all as read/ }));
  expect(await screen.findByText("You are up to date.")).toBeTruthy();
  expect(state.calls.filter((call) => call.method === "PUT").map((call) => call.path)).toEqual(["/api/v1/alert/n1/mark-as-read", "/api/v1/alert/n2/mark-as-read"]);
}, 20_000);

it("a system-alert click focuses the matching unread notification without marking it read", async () => {
  let requested: ((id?: string) => void) | undefined;
  window.oryxCompanion = { summary: async () => {}, onOpen: (listener) => { requested = listener; return () => {}; } };
  const state = open(waiting);
  await screen.findByRole("button", { name: "Notifications, 2 unread" });
  act(() => requested?.("n2"));
  const selected = await screen.findByRole("listitem", { name: "Selected notification" });
  expect(selected.textContent).toContain("Lactose"); expect(document.activeElement).toBe(selected);
  expect(state.calls.some((call) => call.method === "PUT")).toBe(false);
});
it("a previously read system alert can be found in notification history", async () => {
  let requested: ((id?: string) => void) | undefined;
  window.oryxCompanion = { summary: async () => {}, onOpen: (listener) => { requested = listener; return () => {}; } };
  open(waiting);
  await screen.findByRole("button", { name: "Notifications, 2 unread" });
  act(() => requested?.("old-1"));
  const selected = await screen.findByRole("listitem", { name: "Selected notification" });
  expect(selected.textContent).toContain("Leave request approved");
});

it("publishes the configured event category from the personal unread feed without querying administrative alert rules", async () => {
  const summary = vi.fn(async () => {});
  window.oryxCompanion = { summary, onOpen: () => () => {} };
  const state = open([{ id: "configured-alert", type: 15, message: "Expiry review", priority: "High" }]);
  await screen.findByRole("button", { name: "Notifications, 1 unread" });
  await waitFor(() => expect(summary).toHaveBeenCalledWith(expect.objectContaining({ unread: 1, alerts: [{ id: "configured-alert", label: "Expired material", message: "Expiry review", type: 15, priority: 3 }] })));
  expect(state.calls.some((call) => /\/api\/v1\/alert(?:\?|$)/.test(call.path))).toBe(false);
});
